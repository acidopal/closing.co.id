import { beforeEach, describe, expect, it, vi } from 'bun:test'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockUpdateMany = vi.fn()
const mockFindMany = vi.fn()
const mockFindFirst = vi.fn()
const mockDelete = vi.fn()
const mockTransaction = vi.fn()

const mockTx = {
	automation_flows: {
		create: mockCreate,
		update: mockUpdate,
		updateMany: mockUpdateMany,
	},
}

const mockPrisma = {
	automation_flows: {
		create: mockCreate,
		update: mockUpdate,
		updateMany: mockUpdateMany,
		findMany: mockFindMany,
		findFirst: mockFindFirst,
		delete: mockDelete,
	},
	$transaction: mockTransaction,
}

const mockResolveAppId = vi.fn()

vi.mock('../src/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('../src/lib/utils', () => ({
	resolveAppId: mockResolveAppId,
}))

const { FlowService } = await import('../src/modules/flow/service')

describe('FlowService', () => {
	beforeEach(() => {
		vi.resetAllMocks()
		mockResolveAppId.mockResolvedValue('app-uuid')
		mockCreate.mockResolvedValue({ id: 'flow-1', app_id: 'app-uuid', active: true })
		mockUpdate.mockResolvedValue({ id: 'flow-1', app_id: 'app-uuid', active: true })
		mockUpdateMany.mockResolvedValue({ count: 1 })
		mockTransaction.mockImplementation(async (callback) => callback(mockTx))
	})

	it('createFlow deactivates existing active flows before creating a new active flow', async () => {
		await FlowService.createFlow('app-uuid', {
			name: 'Inbound Leads',
			active: true,
			nodes: [],
			edges: [],
		})

		expect(mockTransaction).toHaveBeenCalledTimes(1)
		expect(mockUpdateMany).toHaveBeenCalledWith({
			where: {
				app_id: 'app-uuid',
				active: true,
			},
			data: {
				active: false,
				updated_at: expect.any(Date),
			},
		})
		expect(mockCreate).toHaveBeenCalledWith({
			data: expect.objectContaining({
				name: 'Inbound Leads',
				active: true,
				app_id: 'app-uuid',
			}),
		})
	})

	it('createFlow keeps inactive state when creating inactive flow', async () => {
		await FlowService.createFlow('app-uuid', {
			name: 'Draft Flow',
			active: false,
			nodes: [],
			edges: [],
		})

		expect(mockTransaction).not.toHaveBeenCalled()
		expect(mockUpdateMany).not.toHaveBeenCalled()
		expect(mockCreate).toHaveBeenCalledWith({
			data: expect.objectContaining({
				name: 'Draft Flow',
				active: false,
				app_id: 'app-uuid',
			}),
		})
	})

	it('updateFlow deactivates other active flows when flow is activated', async () => {
		await FlowService.updateFlow('flow-1', 'app-uuid', {
			active: true,
		})

		expect(mockTransaction).toHaveBeenCalledTimes(1)
		expect(mockUpdateMany).toHaveBeenCalledWith({
			where: {
				app_id: 'app-uuid',
				id: { not: 'flow-1' },
				active: true,
			},
			data: {
				active: false,
				updated_at: expect.any(Date),
			},
		})
		expect(mockUpdate).toHaveBeenCalledWith({
			where: { id: 'flow-1', app_id: 'app-uuid' },
			data: expect.objectContaining({
				active: true,
				updated_at: expect.any(Date),
			}),
		})
	})

	it('updateFlow updates non-active fields without transaction when active flag not enabled', async () => {
		await FlowService.updateFlow('flow-1', 'app-uuid', {
			name: 'Renamed Flow',
		})

		expect(mockTransaction).not.toHaveBeenCalled()
		expect(mockUpdateMany).not.toHaveBeenCalled()
		expect(mockUpdate).toHaveBeenCalledWith({
			where: { id: 'flow-1', app_id: 'app-uuid' },
			data: expect.objectContaining({
				name: 'Renamed Flow',
				updated_at: expect.any(Date),
			}),
		})
	})
})
