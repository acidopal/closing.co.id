import prisma from '../lib/prisma'
import { XenditService } from '../modules/xendit'
import type { XenditInvoiceDetails } from '../modules/xendit/model'

const LOOKBACK_HOURS = 48
const MAX_CONCURRENCY = 10
const FETCH_LIMIT = 500
const PAYMENT_STATUS_PENDING = 'pending'

const COMPLETE_STATUSES = new Set(['PAID', 'SETTLED'])
const FAILED_STATUSES = new Set(['FAILED', 'EXPIRED'])

type PaymentRequestRecord = {
	id: string
	org_id: string
	external_id: string | null
	xendit_invoice_id: string | null
	amount: string
	credits: string
	status: string | null
}

type RequestOutcome =
	| 'processed'
	| 'already_processed'
	| 'failed_status'
	| 'skipped'
	| 'error'

function parseNumericValue(value: string | null | undefined): number | null {
	if (!value) return null
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : null
}

async function finalizePaymentRequest(
	requestId: string,
	invoice: XenditInvoiceDetails,
): Promise<'processed' | 'already_processed'> {
	return prisma.$transaction(async (tx) => {
		const rows = await tx.$queryRaw<PaymentRequestRecord[]>`
      SELECT * FROM payment_requests
      WHERE id = ${requestId}
      FOR UPDATE
    `
		const locked = rows[0]
		if (!locked) {
			throw new Error('Payment request went missing while processing')
		}

		if ((locked.status || '').toLowerCase() !== PAYMENT_STATUS_PENDING) {
			return 'already_processed'
		}

		const credits =
			parseNumericValue(locked.credits) ?? parseNumericValue(locked.amount) ?? 0
		await tx.organization.update({
			where: { id: locked.org_id },
			data: { aiCredits: { increment: credits } },
		})

		await tx.credit_transactions.create({
			data: {
				organization_id: locked.org_id,
				amount: credits,
				type: 'top_up',
				description: `Xendit payment reconciliation for ${requestId}`,
				external_id: locked.external_id || invoice.externalId || null,
				payment_status: 'completed',
				metadata: {
					xendit_status: invoice.status,
					xendit_invoice_id: invoice.id,
					xendit_external_id: invoice.externalId,
					xendit_payment_method: invoice.paymentMethod,
				},
			},
		})

		await tx.$executeRaw`
      UPDATE payment_requests
      SET status = 'completed',
          updated_at = now(),
          xendit_invoice_id = COALESCE(${invoice.id}, xendit_invoice_id)
      WHERE id = ${requestId}
    `

		return 'processed'
	})
}

async function markRequestFailed(
	requestId: string,
): Promise<'processed' | 'already_processed'> {
	return prisma.$transaction(async (tx) => {
		const rows = await tx.$queryRaw<PaymentRequestRecord[]>`
      SELECT * FROM payment_requests
      WHERE id = ${requestId}
      FOR UPDATE
    `
		const locked = rows[0]
		if (!locked) {
			throw new Error('Payment request missing during failure handling')
		}

		if ((locked.status || '').toLowerCase() !== PAYMENT_STATUS_PENDING) {
			return 'already_processed'
		}

		await tx.$executeRaw`
      UPDATE payment_requests
      SET status = 'failed',
          updated_at = now()
      WHERE id = ${requestId}
    `

		return 'processed'
	})
}

async function processRequest(
	request: PaymentRequestRecord,
): Promise<RequestOutcome> {
	const externalId = request.external_id?.trim()
	if (!externalId) {
		console.warn(
			`[Reconciliation] Skipping ${request.id} because external_id is missing`,
		)
		return 'skipped'
	}

	try {
		const invoice = await XenditService.getInvoice(externalId)
		const normalizedStatus = String(invoice.status || '').toUpperCase()

		if (COMPLETE_STATUSES.has(normalizedStatus)) {
			const outcome = await finalizePaymentRequest(request.id, invoice)
			if (outcome === 'processed') {
				console.log(
					`[Reconciliation] Granted credits for request ${request.id} (invoice ${invoice.id})`,
				)
				return 'processed'
			}
			return 'already_processed'
		}

		if (FAILED_STATUSES.has(normalizedStatus)) {
			const outcome = await markRequestFailed(request.id)
			if (outcome === 'processed') {
				console.log(
					`[Reconciliation] Marked request ${request.id} as failed (status=${normalizedStatus})`,
				)
				return 'failed_status'
			}
			return 'already_processed'
		}

		console.log(
			`[Reconciliation] Skipping ${request.id}: invoice status ${normalizedStatus}`,
		)
		return 'skipped'
	} catch (error) {
		console.error(
			`[Reconciliation] Failed to process request ${request.id} (${externalId})`,
			error,
		)
		return 'error'
	}
}

export async function reconcilePendingPaymentRequests() {
	console.log('[Reconciliation] Starting run for pending payment requests')
	const cutoff = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000)
	const pendingRequests = await prisma.$queryRaw<PaymentRequestRecord[]>`
    SELECT id, org_id, external_id, xendit_invoice_id, amount, credits, status
    FROM payment_requests
    WHERE status = ${PAYMENT_STATUS_PENDING} AND created_at >= ${cutoff}
    ORDER BY created_at ASC
    LIMIT ${FETCH_LIMIT}
  `

	if (pendingRequests.length === 0) {
		console.log('[Reconciliation] No pending payment requests found')
		return {
			total: 0,
			processed: 0,
			alreadyProcessed: 0,
			failed: 0,
			skipped: 0,
			errors: 0,
		}
	}

	console.log(
		`[Reconciliation] Found ${pendingRequests.length} pending payment request(s) in the last ${LOOKBACK_HOURS}h`,
	)

	const stats = {
		total: pendingRequests.length,
		processed: 0,
		alreadyProcessed: 0,
		failed: 0,
		skipped: 0,
		errors: 0,
	}

	for (
		let index = 0;
		index < pendingRequests.length;
		index += MAX_CONCURRENCY
	) {
		const batch = pendingRequests.slice(index, index + MAX_CONCURRENCY)
		const batchResults = await Promise.all(
			batch.map((request) => processRequest(request)),
		)
		for (const outcome of batchResults) {
			if (outcome === 'processed') {
				stats.processed += 1
			} else if (outcome === 'already_processed') {
				stats.alreadyProcessed += 1
			} else if (outcome === 'failed_status') {
				stats.failed += 1
			} else if (outcome === 'skipped') {
				stats.skipped += 1
			} else if (outcome === 'error') {
				stats.errors += 1
			}
		}
	}

	console.log(
		`[Reconciliation] Run complete: processed=${stats.processed}, alreadyProcessed=${stats.alreadyProcessed}, failed=${stats.failed}, skipped=${stats.skipped}, errors=${stats.errors}`,
	)

	return stats
}
