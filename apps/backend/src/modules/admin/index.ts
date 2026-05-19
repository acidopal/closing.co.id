import { Elysia, t } from 'elysia'
import prisma from '../../lib/prisma'
import { AdminService } from './service'

export const admin = new Elysia({ prefix: '/admin', tags: ['Admin'] })
	.get('/queues/stats', async () => {
		const stats = await AdminService.getQueueStats()
		return { data: stats }
	})
	.post(
		'/queues/:name/retry',
		async ({ params }) => {
			return AdminService.retryFailed(params.name)
		},
		{
			params: t.Object({ name: t.String() }),
		},
	)
	.get('/billing/organizations', async () => {
		const organizations = await prisma.organization.findMany({
			select: {
				id: true,
				name: true,
				slug: true,
				aiCredits: true,
				aiCreditWarningThreshold: true,
				createdAt: true,
				_count: {
					select: {
						creditTransactions: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		})

		return {
			success: true,
			data: organizations.map((org) => ({
				id: org.id,
				name: org.name,
				slug: org.slug,
				ai_credits: Number(org.aiCredits || 0),
				warning_threshold: Number(org.aiCreditWarningThreshold || 5),
				transaction_count: org._count.creditTransactions,
				created_at: org.createdAt,
			})),
		}
	})
	.get(
		'/billing/organizations/:id/balance',
		async ({ params }) => {
			const organization = await prisma.organization.findUnique({
				where: { id: params.id },
				select: {
					id: true,
					name: true,
					aiCredits: true,
					aiCreditWarningThreshold: true,
					aiLowCreditAlertSent: true,
				},
			})

			if (!organization) {
				return { error: 'Organization not found' }
			}

			return {
				success: true,
				data: {
					id: organization.id,
					name: organization.name,
					ai_credits: Number(organization.aiCredits || 0),
					warning_threshold: Number(organization.aiCreditWarningThreshold || 5),
					alert_sent: organization.aiLowCreditAlertSent,
				},
			}
		},
		{
			params: t.Object({ id: t.String() }),
		},
	)
	.get(
		'/billing/organizations/:id/transactions',
		async ({ params, query }) => {
			const limit = Number(query.limit) || 50
			const transactions = await prisma.credit_transactions.findMany({
				where: { organization_id: params.id },
				orderBy: { created_at: 'desc' },
				take: limit,
			})

			return {
				success: true,
				data: transactions.map((tx) => ({
					id: tx.id,
					amount: Number(tx.amount),
					type: tx.type,
					description: tx.description,
					created_at: tx.created_at,
					payment_status: tx.payment_status,
					external_id: tx.external_id,
					metadata: tx.metadata,
				})),
			}
		},
		{
			params: t.Object({ id: t.String() }),
			query: t.Object({ limit: t.Optional(t.String()) }),
		},
	)
	.post(
		'/billing/organizations/:id/credits',
		async ({ params, body, set }) => {
			try {
				await prisma.$transaction(async (tx) => {
					await tx.organization.update({
						where: { id: params.id },
						data: {
							aiCredits: { increment: body.amount },
						},
					})

					await tx.credit_transactions.create({
						data: {
							organization_id: params.id,
							amount: body.amount,
							type: body.amount > 0 ? 'adjustment' : 'refund',
							description: body.reason || 'Manual credit adjustment',
							payment_status: 'completed',
							metadata: {
								admin_adjustment: true,
								admin_id: body.adminId,
							},
						},
					})
				})

				return { success: true }
			} catch (error) {
				console.error('Credit adjustment error:', error)
				set.status = 500
				return { error: 'Failed to adjust credits' }
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				amount: t.Number(),
				reason: t.Optional(t.String()),
				adminId: t.Optional(t.String()),
			}),
		},
	)
	.get('/billing/pricing', async () => {
		const pricing = await prisma.ai_model_pricing.findMany({
			orderBy: { model_name: 'asc' },
		})

		return {
			success: true,
			data: pricing.map((p) => ({
				id: p.id,
				model_name: p.model_name,
				cost_per_request: Number(p.cost_per_request),
				description: p.description,
				is_active: p.is_active,
			})),
		}
	})
	.post(
		'/billing/pricing',
		async ({ body, set }) => {
			try {
				await prisma.ai_model_pricing.create({
					data: {
						model_name: body.modelName,
						cost_per_request: body.costPerRequest,
						description: body.description,
						is_active: true,
					},
				})

				return { success: true }
			} catch (error) {
				console.error('Create pricing error:', error)
				set.status = 500
				return { error: 'Failed to create pricing' }
			}
		},
		{
			body: t.Object({
				modelName: t.String(),
				costPerRequest: t.Number(),
				description: t.Optional(t.String()),
			}),
		},
	)
	.put(
		'/billing/pricing/:id',
		async ({ params, body, set }) => {
			try {
				await prisma.ai_model_pricing.update({
					where: { id: params.id },
					data: {
						cost_per_request: body.costPerRequest,
						description: body.description,
						is_active: body.isActive,
					},
				})

				return { success: true }
			} catch (error) {
				console.error('Update pricing error:', error)
				set.status = 500
				return { error: 'Failed to update pricing' }
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				costPerRequest: t.Number(),
				description: t.Optional(t.String()),
				isActive: t.Optional(t.Boolean()),
			}),
		},
	)
	.delete(
		'/billing/pricing/:id',
		async ({ params, set }) => {
			try {
				await prisma.ai_model_pricing.delete({
					where: { id: params.id },
				})

				return { success: true }
			} catch (error) {
				console.error('Delete pricing error:', error)
				set.status = 500
				return { error: 'Failed to delete pricing' }
			}
		},
		{
			params: t.Object({ id: t.String() }),
		},
	)
