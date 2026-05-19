import { beforeEach, describe, expect, it, vi } from 'bun:test'
import { Decimal } from '@prisma/client-runtime-utils'

type CompanyRecord = {
	id: string
	app_name: string
	business_name: string
	is_active: boolean | null
	ai_credits: Decimal | null
	created_at: Date
	created_by: string | null
}

type CreditTransactionRecord = {
	id: string
	created_at: Date
	app_id: string | null
	description: string | null
	organization_id: string | null
	amount: Decimal
	type: string
	metadata: null
	reservation_id: null
	external_id: null
	payment_status: null
}

const mockUsersFindMany = vi.fn()
const mockUsersCount = vi.fn()
const mockAppsFindMany = vi.fn()
const mockAppsCount = vi.fn()
const mockAppsUpdate = vi.fn()
const mockCreditTransactionsCreate = vi.fn()
const mockTransaction = vi.fn()

const mockPrisma = {
	users: {
		findMany: mockUsersFindMany,
		count: mockUsersCount,
	},
	apps: {
		findMany: mockAppsFindMany,
		count: mockAppsCount,
		update: mockAppsUpdate,
	},
	credit_transactions: {
		create: mockCreditTransactionsCreate,
	},
	$transaction: mockTransaction,
}

vi.mock('../src/lib/prisma', () => ({ default: mockPrisma }))

const { SuperAdminService } = await import('../src/modules/super-admin/service')

type SuperAdminTransactionClient = {
	apps: {
		update: typeof mockAppsUpdate
	}
	credit_transactions: {
		create: typeof mockCreditTransactionsCreate
	}
}

const transactionClient: SuperAdminTransactionClient = {
	apps: {
		update: mockAppsUpdate,
	},
	credit_transactions: {
		create: mockCreditTransactionsCreate,
	},
}

type SuperAdminTransactionCallback = (
	tx: SuperAdminTransactionClient,
) => Promise<CreditTransactionRecord>

beforeEach(() => {
	vi.resetAllMocks()
	mockTransaction.mockImplementation(
		async (callback: SuperAdminTransactionCallback) =>
			callback(transactionClient),
	)
})

describe('SuperAdminService', () => {
	it('returns paginated users with search filtering and metadata', async () => {
		const page = 2
		const limit = 2
		const search = 'alpha'
		const mockUsers = [
			{
				id: 'user-1',
				name: 'Alpha',
				email: 'alpha@example.com',
				role: 'admin',
				active: true,
				created_at: new Date('2025-01-01T00:00:00Z'),
			},
		]

		mockUsersFindMany.mockResolvedValue(mockUsers)
		mockUsersCount.mockResolvedValue(5)

		const result = await SuperAdminService.getUsers({ page, limit, search })

		expect(mockUsersFindMany).toHaveBeenCalledWith({
			where: {
				OR: [
					{ email: { contains: search, mode: 'insensitive' } },
					{ name: { contains: search, mode: 'insensitive' } },
				],
			},
			skip: (page - 1) * limit,
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
		})
		expect(mockUsersCount).toHaveBeenCalledWith({
			where: {
				OR: [
					{ email: { contains: search, mode: 'insensitive' } },
					{ name: { contains: search, mode: 'insensitive' } },
				],
			},
		})

		expect(result).toEqual({
			users: mockUsers,
			pagination: {
				total: 5,
				page,
				limit,
				totalPages: Math.ceil(5 / limit),
			},
		})
	})

	it('calculates pagination metadata even when total is smaller than limit', async () => {
		const mockCompanies: CompanyRecord[] = [
			{
				id: 'company-1',
				app_name: 'Acme',
				business_name: 'Acme Corp',
				is_active: true,
				ai_credits: new Decimal(100),
				created_at: new Date('2025-02-01T00:00:00Z'),
				created_by: 'user-1',
			},
		]

		mockAppsFindMany.mockResolvedValue(mockCompanies)
		mockAppsCount.mockResolvedValue(3)

		const result = await SuperAdminService.getCompanies({})

		expect(mockAppsFindMany).toHaveBeenCalledWith({
			where: {},
			skip: 0,
			take: 10,
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
		})
		expect(mockAppsCount).toHaveBeenCalledWith({ where: {} })

		expect(result.pagination).toEqual({
			total: 3,
			page: 1,
			limit: 10,
			totalPages: Math.ceil(3 / 10),
		})
		expect(result.companies).toBe(mockCompanies)
	})

	it('increments app credits and logs a top-up transaction', async () => {
		const amount = 50
		const reason = 'bonus'
		const createdTx: CreditTransactionRecord = {
			id: 'tx-1',
			created_at: new Date('2025-03-01T00:00:00Z'),
			app_id: 'app-1',
			description: reason,
			organization_id: null,
			amount: new Decimal(amount),
			type: 'top_up',
			metadata: null,
			reservation_id: null,
			external_id: null,
			payment_status: null,
		}

		mockCreditTransactionsCreate.mockResolvedValue(createdTx)

		const result = await SuperAdminService.manualCreditTopUp(
			'app-1',
			amount,
			reason,
		)

		expect(mockTransaction).toHaveBeenCalledTimes(1)
		expect(mockAppsUpdate).toHaveBeenCalledWith({
			where: { id: 'app-1' },
			data: {
				ai_credits: { increment: amount },
			},
		})
		expect(mockCreditTransactionsCreate).toHaveBeenCalledWith({
			data: {
				app_id: 'app-1',
				amount,
				type: 'top_up',
				description: reason,
			},
		})
		expect(result).toBe(createdTx)
	})
})
