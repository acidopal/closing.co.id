import { Elysia, t } from 'elysia'
import prisma from '../lib/prisma'
import { resolveAppId } from '../lib/utils'
import { XenditService } from '../modules/xendit'

export const webhookRoutes = new Elysia({ prefix: '/webhooks/xendit' }).post(
	'/invoice',
	async ({ body, headers, set }) => {
		try {
			const xenditSignatureHeader = headers['x-callback-token']
			const payload = JSON.stringify(body)

			if (
				!xenditSignatureHeader ||
				typeof xenditSignatureHeader !== 'string' ||
				!XenditService.verifyWebhookSignature(payload, xenditSignatureHeader)
			) {
				set.status = 401
				return { error: 'Invalid signature' }
			}

			const { event, data } = body

			if (event === 'invoice.paid') {
				const externalId = data.external_id
				if (!externalId || !externalId.startsWith('topup_')) {
					console.log('Ignoring non-topup invoice:', externalId)
					return { success: true }
				}

				const [, , appIdStr] = externalId.split('_')
				const appId = await resolveAppId(appIdStr)

				if (!appId) {
					console.error('Invalid app ID in external ID:', externalId)
					return { error: 'Invalid app ID' }
				}

				const existingTransaction = await prisma.credit_transactions.findFirst({
					where: { external_id: externalId },
				})

				if (existingTransaction) {
					console.log('Transaction already processed:', externalId)
					return { success: true }
				}

				const organization = await prisma.organization.findUnique({
					where: { appId },
					select: { id: true },
				})

				if (!organization) {
					console.error('Organization not found for app:', appId)
					return { error: 'Organization not found' }
				}

				await prisma.$transaction(async (tx) => {
					const packageData = await tx.top_up_packages.findFirst({
						where: {
							price_usd: data.amount,
							is_active: true,
						},
					})

					const credits = packageData
						? Number(packageData.credits)
						: data.amount

					await tx.organization.update({
						where: { id: organization.id },
						data: { aiCredits: { increment: credits } },
					})

					await tx.credit_transactions.create({
						data: {
							organization_id: organization.id,
							amount: credits,
							type: 'top_up',
							description: `Payment via Xendit - ${externalId}`,
							external_id: externalId,
							payment_status: 'completed',
							metadata: {
								xendit_invoice_id: data.id,
								xendit_payment_method: data.payment_method,
								xendit_paid_at: data.paid_at,
							},
						},
					})
				})

				console.log('Successfully processed top-up:', externalId)
			}

			return { success: true }
		} catch (error) {
			console.error('Webhook error:', error)
			set.status = 500
			return { error: 'Webhook processing failed' }
		}
	},
	{
		body: t.Object({
			event: t.String(),
			data: t.Any(),
		}),
	},
)
