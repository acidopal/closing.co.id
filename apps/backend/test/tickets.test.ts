import { beforeEach, describe, expect, it, vi } from 'bun:test'

const mockPipelinesFindMany = vi.fn()
const mockPipelinesFindFirst = vi.fn()
const mockPipelineStagesFindMany = vi.fn()
const mockPipelineStagesFindFirst = vi.fn()
const mockConversationSalesFindMany = vi.fn()
const mockConversationSalesFindUnique = vi.fn()
const mockConversationsFindMany = vi.fn()
const mockConversationsFindFirst = vi.fn()
const mockQueryRaw = vi.fn()
const mockExecuteRaw = vi.fn()
const mockAgentSettingsGetSettings = vi.fn()

const mockPrisma = {
	pipelines: {
		findMany: mockPipelinesFindMany,
		findFirst: mockPipelinesFindFirst,
	},
	pipeline_stages: {
		findMany: mockPipelineStagesFindMany,
		findFirst: mockPipelineStagesFindFirst,
	},
	conversation_sales: {
		findMany: mockConversationSalesFindMany,
		findUnique: mockConversationSalesFindUnique,
	},
	conversations: {
		findMany: mockConversationsFindMany,
		findFirst: mockConversationsFindFirst,
	},
	$queryRaw: mockQueryRaw,
	$executeRaw: mockExecuteRaw,
}

vi.mock('../src/lib/prisma', () => ({ default: mockPrisma }))
vi.mock('../src/modules/agent-settings/service', () => ({
	AgentSettingsService: {
		getSettings: mockAgentSettingsGetSettings,
	},
}))

const { TicketsService } = await import('../src/modules/tickets/service')

beforeEach(() => {
	vi.resetAllMocks()
})

describe('TicketsService', () => {
	it('returns ticket boards from settings and exposes empty-state metadata', async () => {
		mockPipelinesFindMany.mockResolvedValue([
			{
				id: 'board-1',
				name: 'Support Board',
				is_default: false,
				created_at: new Date('2026-01-01T00:00:00Z'),
				pipeline_stages: [
					{
						id: 'stage-1',
						name: 'New',
						color: '#2563EB',
						stage_order: 0,
					},
				],
			},
		])
		mockQueryRaw.mockResolvedValue([{ default_ticket_board_id: 'board-1' }])

		const result = await TicketsService.getSettings('app-1')

		expect(mockPipelinesFindMany).toHaveBeenCalledWith({
			where: {
				app_id: 'app-1',
				pipeline_type: 'ticket',
			},
			include: {
				pipeline_stages: {
					orderBy: { stage_order: 'asc' },
				},
			},
			orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
		})
		expect(result.default_board_id).toBe('board-1')
		expect(result.empty_state.has_boards).toBe(true)
		expect(result.boards).toEqual([
			{
				id: 'board-1',
				board_name: 'Support Board',
				is_default: false,
				created_at: '2026-01-01T00:00:00.000Z',
				statuses: [
					{
						id: 'stage-1',
						name: 'New',
						color: '#2563EB',
						stage_order: 0,
					},
				],
			},
		])
	})

	it('validates default board update and rejects non-ticket or cross-app board', async () => {
		mockPipelinesFindFirst.mockResolvedValueOnce({
			id: 'board-1',
		})
		mockAgentSettingsGetSettings.mockResolvedValueOnce({
			app_id: 'app-1',
		})
		mockExecuteRaw.mockResolvedValueOnce(1)

		const successResult = await TicketsService.setDefaultBoard('app-1', 'board-1')
		expect(successResult).toEqual({
			success: true,
			default_board_id: 'board-1',
		})
		expect(mockPipelinesFindFirst).toHaveBeenCalledWith({
			where: {
				id: 'board-1',
				app_id: 'app-1',
				pipeline_type: 'ticket',
			},
			select: { id: true },
		})

		mockPipelinesFindFirst.mockResolvedValueOnce(null)
		await expect(
			TicketsService.setDefaultBoard('app-1', 'invalid-board'),
		).rejects.toThrow(
			'Invalid board_id. Board must belong to this business and type ticket.',
		)
	})

	it('groups kanban ticket items by stage and unassigned column', async () => {
		mockPipelinesFindFirst.mockResolvedValue({
			id: 'board-1',
			name: 'Support Board',
		})
		mockPipelineStagesFindMany.mockResolvedValue([
			{
				id: 'stage-1',
				name: 'Todo',
				color: '#2563EB',
				stage_order: 0,
			},
		])
		mockConversationSalesFindMany.mockResolvedValue([
			{
				conversation_id: 'conv-1',
				pipeline_id: 'board-1',
				stage_id: 'stage-1',
				deal_value: { toNumber: () => 200000 },
				created_at: new Date('2026-03-01T10:00:00Z'),
				updated_at: new Date('2026-03-01T11:00:00Z'),
			},
			{
				conversation_id: 'conv-2',
				pipeline_id: 'board-1',
				stage_id: null,
				deal_value: { toNumber: () => 50000 },
				created_at: new Date('2026-03-01T09:00:00Z'),
				updated_at: new Date('2026-03-01T10:00:00Z'),
			},
		])
		mockConversationsFindMany.mockResolvedValue([
			{
				id: 'conv-1',
				status: 'open',
				contacts: { name: 'Rani', phone_number: '62811', identifier: 'rani-id' },
				messages: [{ content: 'Need price details' }],
			},
			{
				id: 'conv-2',
				status: 'open',
				contacts: { name: 'Budi', phone_number: '62812', identifier: 'budi-id' },
				messages: [{ content: 'Following up order' }],
			},
		])

		const result = await TicketsService.getKanban('app-1', {
			board_id: 'board-1',
			view: 'kanban',
			page: 1,
			limit: 20,
		})

		expect(result.columns.length).toBe(2)
		expect(result.columns[0].id).toBe('unassigned')
		expect(result.columns[0].tickets).toHaveLength(1)
		expect(result.columns[1].id).toBe('stage-1')
		expect(result.columns[1].tickets).toHaveLength(1)
	})

	it('supports list mode with pagination, sorting, and search filtering', async () => {
		mockPipelinesFindFirst.mockResolvedValue({
			id: 'board-1',
			name: 'Support Board',
		})
		mockPipelineStagesFindMany.mockResolvedValue([
			{
				id: 'stage-1',
				name: 'Todo',
				color: '#2563EB',
				stage_order: 0,
			},
		])
		mockConversationSalesFindMany.mockResolvedValue([
			{
				conversation_id: 'conv-a',
				pipeline_id: 'board-1',
				stage_id: 'stage-1',
				deal_value: { toNumber: () => 100000 },
				created_at: new Date('2026-03-01T10:00:00Z'),
				updated_at: new Date('2026-03-01T10:00:00Z'),
			},
			{
				conversation_id: 'conv-b',
				pipeline_id: 'board-1',
				stage_id: 'stage-1',
				deal_value: { toNumber: () => 300000 },
				created_at: new Date('2026-03-01T11:00:00Z'),
				updated_at: new Date('2026-03-01T11:00:00Z'),
			},
			{
				conversation_id: 'conv-c',
				pipeline_id: 'board-1',
				stage_id: 'stage-1',
				deal_value: { toNumber: () => 200000 },
				created_at: new Date('2026-03-01T12:00:00Z'),
				updated_at: new Date('2026-03-01T12:00:00Z'),
			},
		])
		mockConversationsFindMany.mockResolvedValue([
			{
				id: 'conv-a',
				status: 'open',
				contacts: { name: 'Anna', phone_number: '62811', identifier: 'anna-id' },
				messages: [{ content: 'hello from anna' }],
			},
			{
				id: 'conv-b',
				status: 'open',
				contacts: { name: 'Brian', phone_number: '62812', identifier: 'brian-id' },
				messages: [{ content: 'hello from brian' }],
			},
			{
				id: 'conv-c',
				status: 'open',
				contacts: { name: 'Clara', phone_number: '62813', identifier: 'clara-id' },
				messages: [{ content: 'hello from clara' }],
			},
		])

		const pageTwoResult = await TicketsService.getKanban('app-1', {
			board_id: 'board-1',
			view: 'list',
			page: 2,
			limit: 1,
			sort: {
				field: 'deal_value',
				direction: 'desc',
			},
		})

		expect(pageTwoResult.pagination.total).toBe(3)
		expect(pageTwoResult.items).toHaveLength(1)
		expect(pageTwoResult.items[0].deal_value).toBe(200000)

		const searchResult = await TicketsService.getKanban('app-1', {
			board_id: 'board-1',
			view: 'list',
			page: 1,
			limit: 10,
			search: 'anna',
		})
		expect(searchResult.items).toHaveLength(1)
		expect(searchResult.items[0].contact_name).toBe('Anna')
	})

	it('returns null conversation summary when no ticket is linked', async () => {
		mockConversationsFindFirst.mockResolvedValue({
			id: 'conv-1',
			status: 'open',
			contacts: { name: 'Nina', phone_number: '62814', identifier: 'nina-id' },
			messages: [{ content: 'hello' }],
		})
		mockConversationSalesFindUnique.mockResolvedValue(null)

		const summary = await TicketsService.getConversationSummary(
			'app-1',
			'conv-1',
			'board-1',
		)

		expect(summary).toBeNull()
	})
})
