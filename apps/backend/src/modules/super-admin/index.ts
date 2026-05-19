import { Elysia, t } from 'elysia'
import { auth } from '../../auth'
import prisma from '../../lib/prisma'
import { superAdminModel } from './model'
import { SuperAdminService } from './service'

export const superAdminGuard = new Elysia({ name: 'super-admin-guard' }).derive(
	{ as: 'scoped' },
	async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		})

		if (!session?.user) {
			throw new Error('Unauthorized')
		}

		// Check role from database to be sure
		// Better Auth user IDs are non-UUID strings, so only query legacy users table if it's a valid UUID
		const isUuid =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
				session.user.id,
			)
		let role: string | null = null

		if (isUuid) {
			const user = await prisma.users.findUnique({
				where: { id: session.user.id },
				select: { role: true },
			})
			role = user?.role || null
		}

		if (role !== 'super_admin') {
			throw new Error('Forbidden: Super Admin access required')
		}

		return {
			superAdmin: session.user,
		}
	},
)

export const superAdmin = new Elysia({
	prefix: '/super-admin',
	tags: ['Super Admin'],
})
	.use(superAdminModel)
	.use(superAdminGuard)
	.get('/stats', async () => {
		return { data: await SuperAdminService.getStats() }
	})
	.get(
		'/users',
		async ({ query }) => {
			return { data: await SuperAdminService.getUsers(query) }
		},
		{
			query: 'getUsersQuery',
		},
	)
	.patch(
		'/users/:id/role',
		async ({ params, body }) => {
			return {
				data: await SuperAdminService.updateUserRole(params.id, body.role),
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: 'updateUserRoleBody',
		},
	)
	.post(
		'/users/:id/suspend',
		async ({ params }) => {
			return { data: await SuperAdminService.suspendUser(params.id) }
		},
		{
			params: t.Object({ id: t.String() }),
		},
	)
	.get(
		'/companies',
		async ({ query }) => {
			return { data: await SuperAdminService.getCompanies(query) }
		},
		{
			query: 'getCompaniesQuery',
		},
	)
	.patch(
		'/companies/:id/status',
		async ({ params, body }) => {
			return {
				data: await SuperAdminService.updateCompanyStatus(
					params.id,
					body.isActive,
				),
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: 'updateCompanyStatusBody',
		},
	)
	.post(
		'/companies/:id/top-up',
		async ({ params, body }) => {
			return {
				data: await SuperAdminService.manualCreditTopUp(
					params.id,
					body.amount,
					body.reason,
				),
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: 'manualCreditTopUpBody',
		},
	)
	.get(
		'/webhooks',
		async ({ query }) => {
			return { data: await SuperAdminService.getWebhookLogs(query) }
		},
		{
			query: 'getWebhookLogsQuery',
		},
	)
	.post(
		'/credits/adjust',
		async ({ body, superAdmin, set }) => {
			const reason = body.reason?.trim()
			if (!reason) {
				set.status = 400
				return { error: 'Reason is required' }
			}

			const amount = Number(body.amount)
			if (!Number.isFinite(amount) || amount === 0) {
				set.status = 400
				return { error: 'Amount must be a non-zero number' }
			}

			const adminMetadata = superAdmin
				? {
						admin_id: superAdmin.id,
						admin_email: (superAdmin as { email?: string }).email,
					}
				: undefined

			try {
				const transaction = await SuperAdminService.adjustOrganizationCredits(
					body.organizationId,
					amount,
					reason,
					adminMetadata,
				)
				console.info('[super-admin] adjusted credits', {
					organizationId: body.organizationId,
					amount,
					adminId: superAdmin?.id,
				})

				return {
					data: {
						transactionId: transaction.id,
						amount: Number(transaction.amount),
						organizationId: transaction.organization_id,
					},
				}
			} catch (error) {
				console.error('[super-admin] credit adjustment failed', {
					error,
					organizationId: body.organizationId,
					adminId: superAdmin?.id,
				})
				set.status =
					error instanceof Error && /Organization/.test(error.message)
						? 400
						: 500
				return {
					error:
						error instanceof Error ? error.message : 'Failed to adjust credits',
				}
			}
		},
		{
			body: 'creditsAdjustBody',
		},
	)
	.get('/credits/packages', async ({ set }) => {
		try {
			const packages = await SuperAdminService.getPackages()
			console.info('[super-admin] fetched credit packages', {
				count: packages.length,
			})
			return { data: packages }
		} catch (error) {
			console.error('[super-admin] failed to fetch credit packages', { error })
			set.status = 500
			return { error: 'Failed to fetch credit packages' }
		}
	})
	.get('/credits/model-pricing', async ({ set }) => {
		try {
			const pricing = await SuperAdminService.getModelPricing()
			return { data: pricing }
		} catch (error) {
			console.error('[super-admin] failed to fetch model pricing', { error })
			set.status = 500
			return { error: 'Failed to fetch model pricing' }
		}
	})
	.post(
		'/credits/model-pricing',
		async ({ body, superAdmin, set }) => {
			const normalizedName = body.modelName?.trim()
			if (!normalizedName) {
				set.status = 400
				return { error: 'Model name is required' }
			}

			try {
				const pricing = await SuperAdminService.upsertModelPricing({
					modelName: normalizedName,
					costPerRequest: body.costPerRequest,
					description: body.description,
					isActive: body.isActive,
				})
				console.info('[super-admin] saved model pricing', {
					modelName: normalizedName,
					adminId: superAdmin?.id,
				})
				return { data: pricing }
			} catch (error) {
				console.error('[super-admin] model pricing update failed', {
					error,
					model: normalizedName,
					adminId: superAdmin?.id,
				})
				set.status =
					error instanceof Error && error.message.includes('costPerRequest')
						? 400
						: 500
				return {
					error:
						error instanceof Error
							? error.message
							: 'Failed to update model pricing',
				}
			}
		},
		{
			body: 'creditsModelPricingBody',
		},
	)
	.get(
		'/credits/balance/:orgId',
		async ({ params, set }) => {
			try {
				const balance = await SuperAdminService.getOrganizationBalance(
					params.orgId,
				)
				return { data: balance }
			} catch (error) {
				console.error('[super-admin] failed to fetch organization balance', {
					error,
					organizationId: params.orgId,
				})
				set.status =
					error instanceof Error && /Organization/.test(error.message)
						? 400
						: 500
				return {
					error:
						error instanceof Error
							? error.message
							: 'Failed to fetch organization balance',
				}
			}
		},
		{
			params: 'creditsBalanceParams',
		},
	)
	.get(
		'/reports/usage',
		async ({ query, set }) => {
			try {
				const report = await SuperAdminService.getUsageReport({
					startDate: query.startDate,
					endDate: query.endDate,
					organizationId: query.organizationId,
					page: query.page,
					limit: query.limit,
				})
				console.info('[super-admin] fetched usage report', {
					filters: report.filters,
				})
				return { data: report }
			} catch (error) {
				console.error('[super-admin] usage report failed', { error })
				set.status =
					error instanceof Error && error.message.includes('Invalid')
						? 400
						: 500
				return {
					error:
						error instanceof Error
							? error.message
							: 'Failed to generate usage report',
				}
			}
		},
		{
			query: 'usageReportQuery',
		},
	)
