import { t } from 'elysia'

export const AutoAssignModel = {
	rule: t.Object({
		id: t.String(),
		app_id: t.String(),
		name: t.String(),
		description: t.Nullable(t.String()),
		rule_type: t.String(),
		priority: t.Number(),
		conditions: t.Any(),
		is_active: t.Boolean(),
	}),

	policy: t.Object({
		id: t.String(),
		app_id: t.String(),
		name: t.String(),
		first_response_time: t.Number(),
		resolution_time: t.Number(),
		is_active: t.Boolean(),
		is_default: t.Boolean(),
	}),
} as const

export const AutoAssignRequestModel = {
	createRule: t.Object({
		name: t.String(),
		description: t.Optional(t.String()),
		rule_type: t.Optional(t.String()),
		priority: t.Optional(t.Number()),
		conditions: t.Optional(t.Any()),
	}),

	createPolicy: t.Object({
		name: t.String(),
		first_response_time: t.Number(),
		resolution_time: t.Number(),
		is_default: t.Optional(t.Boolean()),
	}),
} as const
