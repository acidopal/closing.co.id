import { t } from 'elysia'

const ticketSortField = t.Union([
	t.Literal('created_at'),
	t.Literal('updated_at'),
	t.Literal('deal_value'),
	t.Literal('contact_name'),
])

const ticketSortDirection = t.Union([t.Literal('asc'), t.Literal('desc')])

export const TicketsModel = {
	board: t.Object({
		id: t.String(),
		board_name: t.String(),
		is_default: t.Boolean(),
		created_at: t.Nullable(t.String()),
		statuses: t.Array(
			t.Object({
				id: t.String(),
				name: t.String(),
				color: t.String(),
				stage_order: t.Number(),
			}),
		),
	}),
	kanbanColumn: t.Object({
		id: t.String(),
		name: t.String(),
		color: t.String(),
		stage_order: t.Number(),
		tickets: t.Array(
			t.Object({
				conversation_id: t.String(),
				board_id: t.String(),
				stage_id: t.Nullable(t.String()),
				contact_name: t.String(),
				contact_phone: t.Nullable(t.String()),
				last_message: t.Nullable(t.String()),
				conversation_status: t.Nullable(t.String()),
				deal_value: t.Number(),
				created_at: t.Nullable(t.String()),
				updated_at: t.Nullable(t.String()),
			}),
		),
	}),
	listItem: t.Object({
		conversation_id: t.String(),
		board_id: t.String(),
		stage_id: t.Nullable(t.String()),
		stage_name: t.Nullable(t.String()),
		contact_name: t.String(),
		contact_phone: t.Nullable(t.String()),
		last_message: t.Nullable(t.String()),
		conversation_status: t.Nullable(t.String()),
		deal_value: t.Number(),
		created_at: t.Nullable(t.String()),
		updated_at: t.Nullable(t.String()),
	}),
	conversationSummary: t.Object({
		conversation_id: t.String(),
		board_id: t.String(),
		board_name: t.String(),
		stage_id: t.Nullable(t.String()),
		stage_name: t.Nullable(t.String()),
		stage_color: t.Nullable(t.String()),
		deal_value: t.Number(),
		contact_name: t.String(),
		contact_phone: t.Nullable(t.String()),
		last_message: t.Nullable(t.String()),
		conversation_status: t.Nullable(t.String()),
		created_at: t.Nullable(t.String()),
		updated_at: t.Nullable(t.String()),
	}),
} as const

export const TicketsRequestModel = {
	setDefaultBoard: t.Object({
		board_id: t.Union([t.String(), t.Null()]),
	}),
	kanban: t.Object({
		board_id: t.Optional(t.Union([t.String(), t.Null()])),
		page: t.Optional(t.Number()),
		limit: t.Optional(t.Number()),
		search: t.Optional(t.String()),
		sort: t.Optional(
			t.Object({
				field: ticketSortField,
				direction: ticketSortDirection,
			}),
		),
		view: t.Optional(t.Union([t.Literal('kanban'), t.Literal('list')])),
	}),
} as const

