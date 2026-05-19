import { Elysia, t } from 'elysia'
import prisma from '../../lib/prisma'
import { appContext } from '../../plugins'
import { isUuid } from '../../lib/utils'
import { XenditService } from '../xendit'
import type { XenditInvoiceDetails } from '../xendit/model'
import { BillingService } from './service'

type PaymentRequestRecord = {
	id: string
	org_id: string
	external_id: string | null
	xendit_invoice_id: string | null
	amount: string
	credits: string
	status: string | null
}

async function findPaymentRequestByExternalId(
	externalId: string,
): Promise<PaymentRequestRecord | null> {
	const rows = await prisma.$queryRaw<PaymentRequestRecord[]>`
		SELECT id, org_id, external_id, xendit_invoice_id, amount, credits, status
		FROM payment_requests
		WHERE external_id = ${externalId}
		LIMIT 1
	`
	return rows[0] ?? null
}

async function resolveTopUpOrganizationId(
	orgId: string | null | undefined,
	resolvedAppId: string | null | undefined,
): Promise<string | null> {
	if (resolvedAppId) {
		const organization = await prisma.organization.findFirst({
			where: { appId: resolvedAppId },
			select: { id: true },
		})
		if (organization?.id) return organization.id
	}

	if (!orgId) return null

	const organization = await prisma.organization.findUnique({
		where: { id: orgId },
		select: { id: true },
	})
	return organization?.id ?? null
}

function buildTopUpExternalId(
	organizationId: string,
	packageId: string,
	referenceId?: string,
): string {
	const normalized = referenceId?.trim().replace(/\s+/g, '-') || ''
	const referenceSegment = normalized || String(Date.now())
	return `topup_${organizationId}_${packageId}_${referenceSegment}`
}

function formatInvoiceResponse(
	invoice: XenditInvoiceDetails | null,
	amount: number,
	credits: number,
	externalId: string,
	fallbackInvoiceId?: string | null,
) {
	return {
		id: invoice?.id ?? fallbackInvoiceId ?? null,
		url: invoice?.invoiceUrl ?? null,
		amount,
		credits,
		expiresAt: invoice?.expiryDate ?? null,
		externalId,
	}
}

async function buildResponseForExistingRequest(
	request: PaymentRequestRecord,
	externalId: string,
	amount: number,
	credits: number,
): Promise<ReturnType<typeof formatInvoiceResponse>> {
	let invoice: XenditInvoiceDetails | null = null
	try {
		invoice = await XenditService.getInvoice(externalId)
	} catch (error) {
		console.warn(
			'[billing/top-up] Failed to load Xendit invoice for existing request',
			error,
		)
	}

	return formatInvoiceResponse(
		invoice,
		amount,
		credits,
		externalId,
		request.xendit_invoice_id,
	)
}

export const billing = new Elysia({ prefix: '/billing', tags: ['Billing'] })
	.use(appContext)
	.get(
		'/balance',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const balance = await BillingService.getBalance(resolvedAppId)
			return { success: true, ...balance }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.get(
		'/transactions',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const transactions = await BillingService.getTransactions(resolvedAppId)
			return { success: true, payload: transactions }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.get('/packages', async ({ set }) => {
		try {
			const packages = await prisma.top_up_packages.findMany({
				where: { is_active: true },
				orderBy: { sort_order: 'asc' },
			})

			return {
				success: true,
				payload: packages.map((pkg) => ({
					id: pkg.id,
					name: pkg.name,
					price_usd: Number(pkg.price_usd),
					credits: Number(pkg.credits),
					description: pkg.description,
				})),
			}
		} catch (error) {
			console.error('Get packages error:', error)
			set.status = 500
			return { error: 'Failed to fetch packages' }
		}
	})
	.post(
		'/top-up',
		async ({ orgId, resolvedAppId, body, set }) => {
			const organizationId = await resolveTopUpOrganizationId(
				orgId,
				resolvedAppId,
			)
			if (!organizationId) {
				set.status = 400
				return { error: 'Organization context required for top-up' }
			}

			const requestedPackageId = body.packageId?.trim()
			if (!isUuid(requestedPackageId)) {
				set.status = 400
				return { error: 'Invalid or inactive top-up package' }
			}

			const pkg = await prisma.top_up_packages.findUnique({
				where: { id: requestedPackageId },
			})

			if (!pkg || !pkg.is_active) {
				set.status = 400
				return { error: 'Invalid or inactive top-up package' }
			}

			const amount = Number(pkg.price_usd ?? 0)
			const credits = Number(pkg.credits ?? 0)
			const externalId = buildTopUpExternalId(
				organizationId,
				pkg.id,
				body.referenceId,
			)

			const existing = await findPaymentRequestByExternalId(externalId)
			if (existing) {
				const invoice = await buildResponseForExistingRequest(
					existing,
					externalId,
					amount,
					credits,
				)
				return { success: true, invoice }
			}

			const payerEmail = body.email?.trim()
			const invoicePayload = {
				externalId,
				amount,
				description: `${pkg.name} package - ${Number(pkg.credits)} credits`,
				payerEmail: payerEmail?.length ? payerEmail : undefined,
				items: [
					{
						name: pkg.name,
						quantity: 1,
						price: amount,
						category: 'AI Credits',
					},
				],
			}

			let invoiceDetails: XenditInvoiceDetails
			try {
				invoiceDetails = await XenditService.createInvoice(invoicePayload)
			} catch (error) {
				console.error('[billing/top-up] Xendit invoice creation failed', error)
				set.status = 502
				return {
					error:
						error instanceof Error
							? error.message
							: 'Failed to create Xendit invoice',
				}
			}

			try {
				await prisma.$executeRaw`
					INSERT INTO payment_requests
						(org_id, external_id, xendit_invoice_id, amount, credits, status, created_at, updated_at)
					VALUES
						(${organizationId}, ${externalId}, ${invoiceDetails.id}, ${amount}, ${credits}, 'pending', now(), now())
				`
			} catch (error) {
				const conflicting = await findPaymentRequestByExternalId(externalId)
				if (conflicting) {
					const invoice = await buildResponseForExistingRequest(
						conflicting,
						externalId,
						amount,
						credits,
					)
					return { success: true, invoice }
				}

				console.error('[billing/top-up] Failed to store payment request', error)
				set.status = 500
				return { error: 'Failed to record payment request' }
			}

			return {
				success: true,
				invoice: formatInvoiceResponse(
					invoiceDetails,
					amount,
					credits,
					externalId,
				),
			}
		},
		{
			body: t.Object({
				packageId: t.String(),
				email: t.Optional(t.String()),
				referenceId: t.Optional(t.String()),
			}),
		},
	)
	.post(
		'/top-up/create-invoice',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}

			const packageInfo = await prisma.top_up_packages.findUnique({
				where: { name: body.packageName, is_active: true },
			})

			if (!packageInfo) {
				set.status = 400
				return { error: 'Invalid package' }
			}

			const invoice = await XenditService.createInvoice({
				externalId: `topup_${resolvedAppId}_${Date.now()}`,
				amount: Number(packageInfo.price_usd),
				description: `${packageInfo.name} package - ${packageInfo.credits} credits`,
				payerEmail: body.email,
				items: [
					{
						name: packageInfo.name,
						quantity: 1,
						price: Number(packageInfo.price_usd),
						category: 'AI Credits',
					},
				],
			})

			return {
				success: true,
				invoice: {
					id: invoice.id,
					url: invoice.invoiceUrl,
					amount: Number(packageInfo.price_usd),
					credits: Number(packageInfo.credits),
					expiresAt: invoice.expiryDate,
				},
			}
		},
		{
			body: t.Object({
				packageName: t.String(),
				email: t.Optional(t.String()),
			}),
		},
	)
