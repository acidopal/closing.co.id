import { t } from 'elysia'

export const AdminModel = {
	queueStats: t.Object({
		name: t.String(),
		active: t.Number(),
		waiting: t.Number(),
		completed: t.Number(),
		failed: t.Number(),
		paused: t.Boolean(),
	}),
} as const
