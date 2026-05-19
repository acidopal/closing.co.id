import prisma from '../../lib/prisma'
import { AgentSettingsService } from '../agent-settings/service'

type TicketSortField = 'created_at' | 'updated_at' | 'deal_value' | 'contact_name'
type TicketSortDirection = 'asc' | 'desc'
type TicketView = 'kanban' | 'list'

type TicketKanbanInput = {
	board_id?: string | null
	page?: number
	limit?: number
	search?: string
	sort?: {
		field: TicketSortField
		direction: TicketSortDirection
	}
	view?: TicketView
}

function toNumber(value: unknown): number {
	if (typeof value === 'number') return Number.isFinite(value) ? value : 0
	if (typeof value === 'string') {
		const parsed = Number(value)
		return Number.isFinite(parsed) ? parsed : 0
	}
	if (value && typeof value === 'object' && 'toNumber' in value) {
		try {
			const asNumber = (value as { toNumber: () => number }).toNumber()
			return Number.isFinite(asNumber) ? asNumber : 0
		} catch {
			return 0
		}
	}
	return 0
}

function toIsoString(value: Date | null | undefined): string | null {
	if (!(value instanceof Date)) return null
	return value.toISOString()
}

function normalizePagination(page?: number, limit?: number) {
	const normalizedPage = Math.max(1, Number(page) || 1)
	const normalizedLimit = Math.min(200, Math.max(1, Number(limit) || 20))
	return { page: normalizedPage, limit: normalizedLimit }
}

function normalizeView(value?: string): TicketView {
	return value === 'list' ? 'list' : 'kanban'
}

function normalizeSearch(value?: string): string {
	return String(value || '').trim().toLowerCase()
}

function safeText(value: unknown): string {
	return String(value || '').trim()
}

type TicketItem = {
	conversation_id: string
	board_id: string
	stage_id: string | null
	stage_name: string | null
	contact_name: string
	contact_phone: string | null
	last_message: string | null
	conversation_status: string | null
	deal_value: number
	created_at: string | null
	updated_at: string | null
}

function sortTicketItems(
	items: TicketItem[],
	sort?: { field: TicketSortField; direction: TicketSortDirection },
) {
	const direction = sort?.direction === 'asc' ? 1 : -1
	const field = sort?.field || 'updated_at'

	return [...items].sort((left, right) => {
		if (field === 'deal_value') {
			return (left.deal_value - right.deal_value) * direction
		}

		if (field === 'contact_name') {
			return left.contact_name.localeCompare(right.contact_name) * direction
		}

		const leftDate = new Date(
			field === 'created_at' ? left.created_at || 0 : left.updated_at || 0,
		).getTime()
		const rightDate = new Date(
			field === 'created_at' ? right.created_at || 0 : right.updated_at || 0,
		).getTime()
		return (leftDate - rightDate) * direction
	})
}

export abstract class TicketsService {
	static async getSettings(appId: string) {
		const [boards, defaultBoardRows] = await Promise.all([
			prisma.pipelines.findMany({
				where: {
					app_id: appId,
					pipeline_type: 'ticket',
				},
				include: {
					pipeline_stages: {
						orderBy: { stage_order: 'asc' },
					},
				},
				orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
			}),
			prisma.$queryRaw<Array<{ default_ticket_board_id: string | null }>>`
				SELECT default_ticket_board_id
				FROM agent_settings
				WHERE app_id = ${appId}
				LIMIT 1
			`,
		])

		const defaultBoardIdRaw =
			defaultBoardRows[0]?.default_ticket_board_id || null
		const hasDefaultInBoardList = boards.some((board) => board.id === defaultBoardIdRaw)
		const defaultBoardId = hasDefaultInBoardList ? defaultBoardIdRaw : null

		return {
			boards: boards.map((board) => ({
				id: board.id,
				board_name: board.name,
				is_default: board.is_default ?? false,
				created_at: toIsoString(board.created_at),
				statuses: board.pipeline_stages.map((stage) => ({
					id: stage.id,
					name: stage.name,
					color: stage.color || '#CBD5E1',
					stage_order: stage.stage_order,
				})),
			})),
			default_board_id: defaultBoardId,
			empty_state: {
				has_boards: boards.length > 0,
				message:
					boards.length > 0
						? null
						: 'No ticket board configured yet. Please set up board and statuses first.',
			},
		}
	}

	static async setDefaultBoard(appId: string, boardId: string | null) {
		if (boardId) {
			const board = await prisma.pipelines.findFirst({
				where: {
					id: boardId,
					app_id: appId,
					pipeline_type: 'ticket',
				},
				select: { id: true },
			})
			if (!board) {
				throw new Error('Invalid board_id. Board must belong to this business and type ticket.')
			}
		}

		await AgentSettingsService.getSettings(appId)
		await prisma.$executeRaw`
			UPDATE agent_settings
			SET default_ticket_board_id = ${boardId},
					updated_at = NOW()
			WHERE app_id = ${appId}
		`

		return { success: true, default_board_id: boardId }
	}

	static async getConversationSummary(
		appId: string,
		conversationId: string,
		boardId?: string | null,
	) {
		const conversation = await prisma.conversations.findFirst({
			where: {
				id: conversationId,
				app_id: appId,
			},
			include: {
				contacts: {
					select: {
						name: true,
						phone_number: true,
						identifier: true,
					},
				},
				messages: {
					orderBy: { created_at: 'desc' },
					take: 1,
					select: {
						content: true,
					},
				},
			},
		})

		if (!conversation) return null

		const sale = await prisma.conversation_sales.findUnique({
			where: { conversation_id: conversationId },
		})
		if (!sale || !sale.pipeline_id) return null

		const board = await prisma.pipelines.findFirst({
			where: {
				id: sale.pipeline_id,
				app_id: appId,
				pipeline_type: 'ticket',
			},
			select: {
				id: true,
				name: true,
			},
		})
		if (!board) return null

		if (boardId && board.id !== boardId) return null

		const stage = sale.stage_id
			? await prisma.pipeline_stages.findFirst({
					where: {
						id: sale.stage_id,
						pipeline_id: board.id,
					},
					select: {
						id: true,
						name: true,
						color: true,
					},
				})
			: null

		return {
			conversation_id: conversationId,
			board_id: board.id,
			board_name: board.name,
			stage_id: stage?.id || null,
			stage_name: stage?.name || null,
			stage_color: stage?.color || null,
			deal_value: toNumber(sale.deal_value),
			contact_name:
				safeText(conversation.contacts?.name) ||
				safeText(conversation.contacts?.identifier) ||
				'Unknown',
			contact_phone: safeText(conversation.contacts?.phone_number) || null,
			last_message: safeText(conversation.messages?.[0]?.content) || null,
			conversation_status: safeText(conversation.status) || null,
			created_at: toIsoString(sale.created_at),
			updated_at: toIsoString(sale.updated_at),
		}
	}

	static async getKanban(appId: string, input: TicketKanbanInput) {
		const { page, limit } = normalizePagination(input.page, input.limit)
		const view = normalizeView(input.view)
		const boardId = safeText(input.board_id)
		const search = normalizeSearch(input.search)

		if (!boardId) {
			return {
				view,
				board: null,
				pagination: { page, limit, total: 0 },
				columns: [],
				items: [],
			}
		}

		const board = await prisma.pipelines.findFirst({
			where: {
				id: boardId,
				app_id: appId,
				pipeline_type: 'ticket',
			},
			select: {
				id: true,
				name: true,
			},
		})

		if (!board) {
			throw new Error('Board not found for this business.')
		}

		const [stages, sales] = await Promise.all([
			prisma.pipeline_stages.findMany({
				where: { pipeline_id: board.id },
				orderBy: { stage_order: 'asc' },
				select: {
					id: true,
					name: true,
					color: true,
					stage_order: true,
				},
			}),
			prisma.conversation_sales.findMany({
				where: { pipeline_id: board.id },
				select: {
					conversation_id: true,
					pipeline_id: true,
					stage_id: true,
					deal_value: true,
					created_at: true,
					updated_at: true,
				},
			}),
		])

		const conversationIds = sales.map((sale) => sale.conversation_id)
		const conversations =
			conversationIds.length > 0
				? await prisma.conversations.findMany({
						where: {
							id: { in: conversationIds },
							app_id: appId,
						},
						include: {
							contacts: {
								select: {
									name: true,
									phone_number: true,
									identifier: true,
								},
							},
							messages: {
								orderBy: { created_at: 'desc' },
								take: 1,
								select: {
									content: true,
								},
							},
						},
					})
				: []

		const conversationById = new Map(
			conversations.map((conversation) => [conversation.id, conversation]),
		)
		const stageById = new Map(stages.map((stage) => [stage.id, stage]))

		const baseItems: TicketItem[] = sales
			.map((sale) => {
				const conversation = conversationById.get(sale.conversation_id)
				if (!conversation) return null

				const stage = sale.stage_id ? stageById.get(sale.stage_id) : null
				return {
					conversation_id: sale.conversation_id,
					board_id: board.id,
					stage_id: sale.stage_id || null,
					stage_name: stage?.name || null,
					contact_name:
						safeText(conversation.contacts?.name) ||
						safeText(conversation.contacts?.identifier) ||
						'Unknown',
					contact_phone: safeText(conversation.contacts?.phone_number) || null,
					last_message: safeText(conversation.messages?.[0]?.content) || null,
					conversation_status: safeText(conversation.status) || null,
					deal_value: toNumber(sale.deal_value),
					created_at: toIsoString(sale.created_at),
					updated_at: toIsoString(sale.updated_at),
				}
			})
			.filter((item): item is TicketItem => item !== null)

		const searchedItems = search
			? baseItems.filter((item) => {
					return (
						item.contact_name.toLowerCase().includes(search) ||
						String(item.contact_phone || '')
							.toLowerCase()
							.includes(search) ||
						String(item.last_message || '')
							.toLowerCase()
							.includes(search)
					)
				})
			: baseItems

		const sortedItems = sortTicketItems(searchedItems, input.sort)
		const total = sortedItems.length
		const startIndex = (page - 1) * limit
		const pagedItems = sortedItems.slice(startIndex, startIndex + limit)

		const unassignedTickets = pagedItems.filter((item) => !item.stage_id)
		const stageColumns = stages.map((stage) => ({
			id: stage.id,
			name: stage.name,
			color: stage.color || '#CBD5E1',
			stage_order: stage.stage_order,
			tickets: pagedItems.filter((item) => item.stage_id === stage.id),
		}))

		const columns =
			unassignedTickets.length > 0
				? [
						{
							id: 'unassigned',
							name: 'Unassigned',
							color: '#CBD5E1',
							stage_order: -1,
							tickets: unassignedTickets,
						},
						...stageColumns,
					]
				: stageColumns

		return {
			view,
			board: {
				id: board.id,
				board_name: board.name,
			},
			pagination: { page, limit, total },
			columns,
			items: pagedItems,
		}
	}
}

