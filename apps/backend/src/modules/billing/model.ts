import { t } from 'elysia'

export const BillingModel = {
	balance: t.Object({
		ai_credits: t.Number(),
	}),

	transaction: t.Object({
		id: t.String(),
		app_id: t.String(),
		amount: t.Number(),
		type: t.String(),
		description: t.Nullable(t.String()),
		created_at: t.Date(),
	}),

	transactions: t.Array(
		t.Object({
			id: t.String(),
			amount: t.Number(),
			type: t.String(),
			description: t.Nullable(t.String()),
			created_at: t.Date(),
		}),
	),
} as const

export const BillingRequestModel = {
	topUp: t.Object({
		amount: t.Number(),
		package_id: t.Optional(t.String()),
	}),
} as const
