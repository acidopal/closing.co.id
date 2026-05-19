import { t } from 'elysia'

export const TikTokModel = {
	connectionStatus: t.Object({
		connected: t.Boolean(),
		id: t.String(),
		tiktokId: t.String(),
		openId: t.Nullable(t.String()),
		unionId: t.Nullable(t.String()),
		displayName: t.String(),
		avatarUrl: t.Nullable(t.String()),
		connectionStatus: t.String(),
		connectedAt: t.Nullable(t.Date()),
		tokenExpiresAt: t.Nullable(t.String()),
		daysUntilTokenExpiry: t.Number(),
		scope: t.Nullable(t.String()),
		requestedScope: t.String(),
		grantedScopes: t.Array(t.String()),
		requestedScopes: t.Array(t.String()),
		hasMessagingScope: t.Boolean(),
		isMessagingReady: t.Boolean(),
		messagingReadiness: t.String(),
		messagingReadinessMessage: t.String(),
	}),
} as const

export const TikTokRequestModel = {
	initLogin: t.Object({
		appId: t.Optional(t.String()),
	}),
} as const
