import { t } from 'elysia'

export const AppCenterModel = {
	category: t.Object({
		id: t.String(),
		name: t.String(),
		slug: t.String(),
		description: t.Nullable(t.String()),
		icon: t.Nullable(t.String()),
	}),

	app: t.Object({
		id: t.String(),
		name: t.String(),
		slug: t.String(),
		author: t.Nullable(t.String()),
		caption: t.Nullable(t.String()),
		icon_url: t.Nullable(t.String()),
		is_active: t.Boolean(),
	}),

	installation: t.Object({
		id: t.String(),
		app_id: t.String(),
		app_id_org: t.String(),
		status: t.String(),
		is_enabled: t.Boolean(),
	}),
} as const

export const AppCenterRequestModel = {
	install: t.Object({
		app_id: t.String(),
		app_id_org: t.String(),
	}),
} as const
