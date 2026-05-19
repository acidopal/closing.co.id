import { t } from 'elysia'

export const n8nSignInResponse = t.Object({
	success: t.Boolean(),
	embedUrl: t.Optional(t.String()),
	cookie: t.Optional(t.String()),
	error: t.Optional(t.String()),
})

export const n8nProvisionResponse = t.Object({
	success: t.Boolean(),
	error: t.Optional(t.String()),
})
