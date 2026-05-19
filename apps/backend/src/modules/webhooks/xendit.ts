import { Elysia, t } from 'elysia'
import crypto from 'node:crypto'

import prisma from '../../lib/prisma'

const HEADER_NAME = 'x-callback-token'

const configuredTokens = [
	process.env.XENDIT_CALLBACK_TOKEN,
	process.env.XENDIT_WEBHOOK_TOKEN,
]
	.map((token) => token?.trim())
	.filter(Boolean) as string[]
const hasConfiguredTokens = configuredTokens.length > 0

if (!hasConfiguredTokens) {
	console.error(
		'[XenditWebhook] No callback tokens configured; callbacks will be rejected until XENDIT_CALLBACK_TOKEN or XENDIT_WEBHOOK_TOKEN is set',
	)
}

function constantTimeEquals(value: string, expected: string) {
	const a = Buffer.from(value, 'utf8')
	const b = Buffer.from(expected, 'utf8')
	if (a.length !== b.length) return false
	return crypto.timingSafeEqual(a, b)
}

function isValidCallbackToken(received?: string) {
	if (!hasConfiguredTokens) {
		return false
	}

	if (!received) return false
	const normalized = received.trim()
	if (!normalized) return false

	return configuredTokens.some((token) => constantTimeEquals(normalized, token))
}

function resolvePayload(body: unknown): Record<string, any> {
	if (body && typeof body === 'object' && body !== null) {
		const record = body as Record<string, any>
		if (
			record.data &&
			typeof record.data === 'object' &&
			record.data !== null
		) {
			return record.data as Record<string, any>
		}
		return record
	}
	return {}
}

function findField<T>(
	sources: readonly (Record<string, any> | undefined)[],
	keys: string[],
): T | undefined {
	for (const source of sources) {
		if (!source) continue
		for (const key of keys) {
			if (Object.prototype.hasOwnProperty.call(source, key)) {
				const value = source[key]
				if (value !== undefined && value !== null) {
					return value as T
				}
			}
		}
	}
	return undefined
}

function normalizeStatus(value: unknown) {
	if (typeof value !== 'string') return undefined
	const trimmed = value.trim()
	return trimmed ? trimmed.toUpperCase() : undefined
}

interface PaymentRequestRecord {
	id: string
	org_id: string
	external_id: string | null
	xendit_invoice_id: string | null
	amount: string
	credits: string
	status: string
}

async function findPaymentRequest(externalId?: string, invoiceId?: string) {
	const trimmedExternalId = externalId?.trim()
	if (trimmedExternalId) {
		const rows = await prisma.$queryRaw<PaymentRequestRecord[]>`
      SELECT * FROM payment_requests
      WHERE external_id = ${trimmedExternalId}
      LIMIT 1
    `
		if (rows.length) return rows[0]
	}

	const trimmedInvoiceId = invoiceId?.trim()
	if (trimmedInvoiceId) {
		const rows = await prisma.$queryRaw<PaymentRequestRecord[]>`
      SELECT * FROM payment_requests
      WHERE xendit_invoice_id = ${trimmedInvoiceId}
      LIMIT 1
    `
		if (rows.length) return rows[0]
	}

	return null
}

export const xenditWebhook = new Elysia({ prefix: '/xendit' }).post(
	'/',
	async ({ body, headers, set }) => {
		const rawHeader = headers[HEADER_NAME]
		const headerValue = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader

		if (!isValidCallbackToken(headerValue)) {
			console.warn('[XenditWebhook] Invalid callback token')
			set.status = 401
			return { error: 'Invalid callback token' }
		}

		const requestBody =
			typeof body === 'object' && body !== null
				? (body as Record<string, any>)
				: {}
		const payload = resolvePayload(requestBody)
		const event = findField<string>([requestBody], ['event'])
		const statusValue = findField<string>(
			[payload, requestBody],
			['status', 'payment_status'],
		)
		const normalizedStatus = normalizeStatus(statusValue)

		const externalId = findField<string>(
			[payload, requestBody],
			['external_id', 'externalId'],
		)
		const invoiceId = findField<string>(
			[payload, requestBody],
			['id', 'invoice_id', 'xendit_invoice_id'],
		)
		const paymentMethod = findField<string>(
			[payload, requestBody],
			['payment_method', 'payment_method_type'],
		)
		const paidAt = findField<string>(
			[payload, requestBody],
			['paid_at', 'paidDate', 'updated_at'],
		)

		console.log('[XenditWebhook] Callback received', {
			event,
			status: normalizedStatus,
			externalId,
			invoiceId,
		})

		if (normalizedStatus !== 'PAID') {
			console.log('[XenditWebhook] Ignoring non-PAID status', normalizedStatus)
			return { success: true, reason: 'ignored status' }
		}

		if (!externalId) {
			console.error('[XenditWebhook] Missing external_id in payload')
			set.status = 400
			return { error: 'Missing external_id' }
		}

		const paymentRequest = await findPaymentRequest(externalId, invoiceId)
		if (!paymentRequest) {
			console.error('[XenditWebhook] Payment request not found', {
				externalId,
				invoiceId,
			})
			set.status = 404
			return { error: 'Payment request not found' }
		}

		if (paymentRequest.status?.toLowerCase() !== 'pending') {
			console.log(
				'[XenditWebhook] Request already processed',
				paymentRequest.id,
			)
			return { success: true, reason: 'already processed' }
		}

		let transactionOutcome: 'processed' | 'already_processed' =
			'already_processed'

		await prisma.$transaction(async (tx) => {
			const lockedRequests = await tx.$queryRaw<PaymentRequestRecord[]>`
        SELECT * FROM payment_requests
        WHERE id = ${paymentRequest.id}
        FOR UPDATE
      `
			const locked = lockedRequests[0]

			if (!locked) {
				throw new Error('Payment request missing during processing')
			}

			if (locked.status?.toLowerCase() !== 'pending') {
				transactionOutcome = 'already_processed'
				return
			}

			const credits = Number(locked.credits)
			const amountToGrant = Number.isFinite(credits) ? credits : 0

			await tx.organization.update({
				where: { id: locked.org_id },
				data: { aiCredits: { increment: amountToGrant } },
			})

			await tx.credit_transactions.create({
				data: {
					organization_id: locked.org_id,
					amount: amountToGrant,
					type: 'top_up',
					description: `Xendit payment ${externalId}`,
					external_id: externalId,
					payment_status: 'completed',
					metadata: {
						xendit_status: normalizedStatus,
						...(invoiceId ? { xendit_invoice_id: invoiceId } : {}),
						...(paymentMethod ? { xendit_payment_method: paymentMethod } : {}),
						...(paidAt ? { xendit_paid_at: paidAt } : {}),
					},
				},
			})

			await tx.$executeRaw`
        UPDATE payment_requests
        SET status = 'completed',
          updated_at = now(),
          xendit_invoice_id = COALESCE(${invoiceId}, xendit_invoice_id)
        WHERE id = ${paymentRequest.id}
      `

			transactionOutcome = 'processed'
		})

		if (transactionOutcome === 'already_processed') {
			console.log(
				'[XenditWebhook] Request already completed inside transaction',
				paymentRequest.id,
			)
			return { success: true, reason: 'already processed' }
		}

		console.log('[XenditWebhook] Credits granted', {
			externalId,
			orgId: paymentRequest.org_id,
		})

		return { success: true }
	},
	{
		body: t.Any(),
	},
)
