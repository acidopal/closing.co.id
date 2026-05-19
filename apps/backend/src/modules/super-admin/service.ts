import prisma from '../../lib/prisma'
import { BillingService } from '../billing/service'

type DateTimeFilter = {
	gte?: Date
	lte?: Date
}

type AmountFilter = {
	gt?: number
	lt?: number
}

type CreditTransactionsWhereInput = {
	created_at?: DateTimeFilter
	organization_id?: string | { not: null }
	amount?: AmountFilter
}

type UsageReportFilters = {
	startDate?: string
	endDate?: string
	organizationId?: string
	page?: number
	limit?: number
}

export abstract class SuperAdminService {
	static async getStats() {
		const [totalUsers, totalCompanies, activeAIModels, creditUsage] =
			await Promise.all([
				prisma.users.count(),
				prisma.apps.count(),
				prisma.chatbots.count({
					where: {
						is_deleted: false,
					},
				}),
				prisma.credit_transactions.aggregate({
					_sum: {
						amount: true,
					},
					where: {
						type: 'usage',
					},
				}),
			])

		return {
			totalUsers,
			totalCompanies,
			activeAIModels,
			totalCreditUsage: Math.abs(Number(creditUsage._sum.amount || 0)),
		}
	}

	static async adjustOrganizationCredits(
		organizationId: string,
		amount: number,
		reason: string,
		metadata?: Record<string, unknown>,
	) {
		if (!reason.trim()) {
			throw new Error('Reason is required')
		}

		if (!Number.isFinite(amount) || amount === 0) {
			throw new Error('Amount must be a non-zero number')
		}

		if (amount > 0) {
			return BillingService.topUpOrgCredits(
				organizationId,
				amount,
				reason,
				undefined,
				metadata,
				'adjustment',
			)
		}

		return BillingService.deductOrgCredits(
			organizationId,
			Math.abs(amount),
			reason,
			metadata,
			'adjustment',
		)
	}

	static async getPackages() {
		const packages = await prisma.top_up_packages.findMany({
			where: { is_active: true },
			orderBy: { sort_order: 'asc' },
		})

		return packages.map((pkg) => ({
			id: pkg.id,
			name: pkg.name,
			price_usd: Number(pkg.price_usd),
			credits: Number(pkg.credits),
			description: pkg.description,
			is_active: Boolean(pkg.is_active),
		}))
	}

	static async getModelPricing() {
		const pricing = await prisma.ai_model_pricing.findMany({
			orderBy: { model_name: 'asc' },
		})

		return pricing.map((item) => ({
			id: item.id,
			model_name: item.model_name,
			cost_per_request: Number(item.cost_per_request),
			description: item.description,
			is_active: Boolean(item.is_active),
			updated_at: item.updated_at,
		}))
	}

	static async upsertModelPricing(payload: {
		modelName: string
		costPerRequest: number
		description?: string
		isActive?: boolean
	}) {
		const normalizedCost = Number(payload.costPerRequest)
		if (!Number.isFinite(normalizedCost) || normalizedCost <= 0) {
			throw new Error('costPerRequest must be a positive number')
		}

		const cost = Number(normalizedCost.toFixed(4))

		const model = await prisma.$transaction(async (tx) =>
			tx.ai_model_pricing.upsert({
				where: { model_name: payload.modelName },
				update: {
					cost_per_request: cost,
					description: payload.description,
					is_active: payload.isActive ?? true,
					updated_at: new Date(),
				},
				create: {
					model_name: payload.modelName,
					cost_per_request: cost,
					description: payload.description,
					is_active: payload.isActive ?? true,
				},
			}),
		)

		return {
			id: model.id,
			model_name: model.model_name,
			cost_per_request: Number(model.cost_per_request),
			description: model.description,
			is_active: Boolean(model.is_active),
			updated_at: model.updated_at,
		}
	}

	static async getOrganizationBalance(organizationId: string) {
		return BillingService.getOrgBalance(organizationId)
	}

	static async getUsageReport(filters: UsageReportFilters) {
		const page = Math.max(1, Math.floor(filters.page ?? 1))
		const limit = Math.min(100, Math.max(1, Math.floor(filters.limit ?? 20)))
		const where: CreditTransactionsWhereInput = {}

		const createdAtFilter: DateTimeFilter = {}
		if (filters.startDate) {
			const startDate = new Date(filters.startDate)
			if (Number.isNaN(startDate.getTime())) {
				throw new Error('Invalid startDate')
			}
			createdAtFilter.gte = startDate
		}
		if (filters.endDate) {
			const endDate = new Date(filters.endDate)
			if (Number.isNaN(endDate.getTime())) {
				throw new Error('Invalid endDate')
			}
			createdAtFilter.lte = endDate
		}
		if (Object.keys(createdAtFilter).length) {
			where.created_at = createdAtFilter
		}
		if (filters.organizationId) {
			where.organization_id = filters.organizationId
		}

		const transactionsPromise = prisma.credit_transactions.findMany({
			where,
			orderBy: { created_at: 'desc' },
			skip: (page - 1) * limit,
			take: limit,
		})

		const totalsPromise = prisma.credit_transactions.aggregate({
			where,
			_sum: { amount: true },
			_count: { id: true },
		})

		const positivePromise = prisma.credit_transactions.aggregate({
			where: { ...where, amount: { gt: 0 } },
			_sum: { amount: true },
		})

		const negativePromise = prisma.credit_transactions.aggregate({
			where: { ...where, amount: { lt: 0 } },
			_sum: { amount: true },
		})

		const topOrgsWhere: CreditTransactionsWhereInput = filters.organizationId
			? where
			: { ...where, organization_id: { not: null } }

		const topOrganizationsPromise = prisma.credit_transactions.groupBy({
			by: ['organization_id'],
			where: topOrgsWhere,
			_sum: { amount: true },
			orderBy: { _sum: { amount: 'desc' } },
			take: 5,
		})

		const [transactions, totals, positive, negative, topOrganizations] =
			await Promise.all([
				transactionsPromise,
				totalsPromise,
				positivePromise,
				negativePromise,
				topOrganizationsPromise,
			])

		return {
			page,
			limit,
			filters: {
				startDate: filters.startDate,
				endDate: filters.endDate,
				organizationId: filters.organizationId,
			},
			totals: {
				net: Number(totals._sum.amount || 0),
				added: Number(positive._sum.amount || 0),
				deducted: Math.abs(Number(negative._sum.amount || 0)),
				count: totals._count.id,
			},
			topOrganizations: topOrganizations
				.filter((item) => item.organization_id)
				.map((item) => ({
					organizationId: item.organization_id!,
					total: Number(item._sum.amount || 0),
				})),
			transactions: transactions.map((txn) => ({
				...txn,
				amount: Number(txn.amount),
			})),
		}
	}

	static async getUsers(query: {
		page?: number
		limit?: number
		search?: string
	}) {
		const { page = 1, limit = 10, search } = query
		const skip = (page - 1) * limit

		const where = search
			? {
					OR: [
						{ email: { contains: search, mode: 'insensitive' as const } },
						{ name: { contains: search, mode: 'insensitive' as const } },
					],
				}
			: {}

		const [users, total] = await Promise.all([
			prisma.users.findMany({
				where,
				skip,
				take: limit,
				orderBy: { created_at: 'desc' },
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					active: true,
					created_at: true,
				},
			}),
			prisma.users.count({ where }),
		])

		return {
			users,
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		}
	}

	static async updateUserRole(userId: string, role: string) {
		return prisma.users.update({
			where: { id: userId },
			data: { role },
		})
	}

	static async suspendUser(userId: string) {
		return prisma.users.update({
			where: { id: userId },
			data: { active: false },
		})
	}

	static async getCompanies(query: {
		page?: number
		limit?: number
		search?: string
	}) {
		const { page = 1, limit = 10, search } = query
		const skip = (page - 1) * limit

		const where = search
			? {
					OR: [
						{ app_name: { contains: search, mode: 'insensitive' as const } },
						{
							business_name: { contains: search, mode: 'insensitive' as const },
						},
					],
				}
			: {}

		const [companies, total] = await Promise.all([
			prisma.apps.findMany({
				where,
				skip,
				take: limit,
				orderBy: { created_at: 'desc' },
				select: {
					id: true,
					app_name: true,
					business_name: true,
					is_active: true,
					ai_credits: true,
					created_at: true,
					created_by: true,
				},
			}),
			prisma.apps.count({ where }),
		])

		return {
			companies,
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		}
	}

	static async updateCompanyStatus(appId: string, isActive: boolean) {
		return prisma.apps.update({
			where: { id: appId },
			data: { is_active: isActive },
		})
	}

	static async manualCreditTopUp(
		appId: string,
		amount: number,
		reason: string = 'Manual top-up',
	) {
		return prisma.$transaction(async (tx) => {
			// 1. Update app balance
			await tx.apps.update({
				where: { id: appId },
				data: {
					ai_credits: { increment: amount },
				},
			})

			// 2. Create transaction record
			return tx.credit_transactions.create({
				data: {
					app_id: appId,
					amount,
					type: 'top_up',
					description: reason,
				},
			})
		})
	}

	static async getWebhookLogs(query: {
		page?: number
		limit?: number
		appId?: string
		status?: string
	}) {
		const { page = 1, limit = 10, appId, status } = query
		const skip = (page - 1) * limit

		const where: any = {}
		if (appId) where.app_id = appId
		if (status) where.status = status

		const [logs, total] = await Promise.all([
			prisma.webhook_events.findMany({
				where,
				skip,
				take: limit,
				orderBy: { created_at: 'desc' },
			}),
			prisma.webhook_events.count({ where }),
		])

		return {
			logs,
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		}
	}
}
