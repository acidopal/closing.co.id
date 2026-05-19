import prisma from '../../lib/prisma'

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
	return value as Record<string, unknown>
}

function asString(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const normalized = value.trim()
	return normalized.length > 0 ? normalized : null
}

function asNonEmptyString(value: unknown): string | null {
	if (typeof value === 'number' && Number.isFinite(value)) return String(value)
	return asString(value)
}

function toBase64State(value: Record<string, unknown>) {
	return Buffer.from(JSON.stringify(value)).toString('base64')
}

function fromBase64State(value: string) {
	try {
		const parsed = JSON.parse(Buffer.from(value, 'base64').toString())
		return asRecord(parsed)
	} catch {
		return {}
	}
}

function resolveTikTokClientKey() {
	return (
		process.env.TIKTOK_CLIENT_KEY ||
		process.env.TIKTOK_APP_ID ||
		process.env.TIKTOK_CLIENT_ID ||
		''
	)
}

function resolveTikTokClientSecret() {
	return (
		process.env.TIKTOK_CLIENT_SECRET || process.env.TIKTOK_APP_SECRET || ''
	)
}

function resolveTikTokRedirectUri() {
	return (
		process.env.TIKTOK_REDIRECT_URI ||
		'https://api.scalebiz.chat/api/tiktok-channels/callback'
	)
}

function normalizeRedirectUri(value: string) {
	const normalized = String(value || '').trim()
	if (!normalized) return normalized
	// TikTok checks redirect_uri as exact string between authorize and token exchange.
	// Keep a single canonical shape to avoid accidental slash mismatch.
	return normalized.replace(/\/+$/, '')
}

function resolveTokenContainer(payload: unknown) {
	const data = asRecord(payload)
	const nestedData = asRecord(data.data)
	return Object.keys(nestedData).length > 0 ? nestedData : data
}

function normalizeStatusText(value: string | null): string {
	return String(value || '')
		.trim()
		.toLowerCase()
}

function isTikTokSuccessStatus(value: string | null): boolean {
	const normalized = normalizeStatusText(value)
	if (!normalized) return false
	return (
		normalized === '0' ||
		normalized === 'ok' ||
		normalized === 'success' ||
		normalized === 'succeeded' ||
		normalized === '200'
	)
}

function hasLikelyErrorKeyword(value: string | null): boolean {
	const normalized = normalizeStatusText(value)
	if (!normalized) return false
	return /(error|invalid|failed|forbidden|unauthorized|denied|expired|reject|missing|not found|limit|unable|wrong)/i.test(
		normalized,
	)
}

function resolveTikTokError(payload: unknown) {
	const root = asRecord(payload)
	const data = asRecord(root.data)
	const errorObject = asRecord(root.error)
	const code =
		asNonEmptyString(root.error_code) ||
		asNonEmptyString(root.code) ||
		asNonEmptyString(data.error_code) ||
		asNonEmptyString(data.code) ||
		asNonEmptyString(errorObject.code)
	const error =
		asString(root.error) ||
		asString(data.error) ||
		asString(errorObject.type)
	const message =
		asString(root.error_description) ||
		asString(root.description) ||
		asString(root.message) ||
		asString(data.error_description) ||
		asString(data.description) ||
		asString(data.message) ||
		asString(errorObject.message)
	const successCode = isTikTokSuccessStatus(code)
	const successErrorText = isTikTokSuccessStatus(error)
	const successMessage = isTikTokSuccessStatus(message)
	const hasErrorText = Boolean(error && !successErrorText)
	const hasMessageError =
		Boolean(message && !successMessage) &&
		(!code || !successCode) &&
		hasLikelyErrorKeyword(message)
	const hasError = Boolean(hasErrorText || (code && !successCode) || hasMessageError)

	return {
		hasError,
		code,
		error,
		message,
	}
}

function formatTikTokError(payload: unknown) {
	const details = resolveTikTokError(payload)
	if (details.hasError) {
		const parts = [details.code ? `code=${details.code}` : null, details.error, details.message].filter(Boolean)
		return parts.join(' | ')
	}

	try {
		const serialized = JSON.stringify(payload)
		return serialized.length > 300 ? `${serialized.slice(0, 300)}...` : serialized
	} catch {
		return 'Unknown TikTok response payload'
	}
}

function resolveProfileContainer(payload: unknown) {
	const data = asRecord(payload)
	const nestedData = asRecord(data.data)
	const nestedUser = asRecord(nestedData.user)
	if (Object.keys(nestedUser).length > 0) return nestedUser
	if (Object.keys(nestedData).length > 0) return nestedData
	return data
}

function resolveExpiryDate(expiresInRaw: unknown) {
	const expiresIn = Number(expiresInRaw)
	const safeExpiresIn =
		Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 24 * 60 * 60
	return new Date(Date.now() + safeExpiresIn * 1000)
}

function resolveDaysUntil(dateRaw: unknown) {
	const value = asString(dateRaw)
	if (!value) return 0
	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) return 0
	return Math.floor((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

const DEFAULT_TIKTOK_SCOPES = 'user.info.basic'

function splitScopeList(raw: unknown): string[] {
	const text = asString(raw)
	if (!text) return []
	return Array.from(
		new Set(
			text
				.split(/[,\s]+/)
				.map((item) => item.trim().toLowerCase())
				.filter((item) => item.length > 0),
		),
	)
}

function resolveRequestedScopeText() {
	return asString(process.env.TIKTOK_SCOPES) || DEFAULT_TIKTOK_SCOPES
}

function hasLikelyMessagingScope(scopes: string[]) {
	return scopes.some((scope) => {
		if (/(message|messages|messaging|chat|dm)/i.test(scope)) return true
		return /(^|[._:-])im([._:-]|$)/i.test(scope)
	})
}

function resolveScopeInsights(config: Record<string, unknown>) {
	const requestedScopeText =
		asString(config.requested_scope) || resolveRequestedScopeText()
	const grantedScopeText = asString(config.scope)
	const requestedScopes =
		Array.isArray(config.requested_scopes) && config.requested_scopes.length > 0
			? Array.from(
					new Set(
						config.requested_scopes
							.map((item) => asString(item))
							.filter((item): item is string => Boolean(item))
							.map((item) => item.toLowerCase()),
					),
				)
			: splitScopeList(requestedScopeText)
	const grantedScopes =
		Array.isArray(config.granted_scopes) && config.granted_scopes.length > 0
			? Array.from(
					new Set(
						config.granted_scopes
							.map((item) => asString(item))
							.filter((item): item is string => Boolean(item))
							.map((item) => item.toLowerCase()),
					),
				)
			: splitScopeList(grantedScopeText)
	const effectiveScopes = grantedScopes.length > 0 ? grantedScopes : requestedScopes
	const hasMessaging = hasLikelyMessagingScope(effectiveScopes)

	return {
		requestedScopeText,
		grantedScopeText,
		requestedScopes,
		grantedScopes,
		hasMessaging,
	}
}

function resolveMessagingReadiness(params: {
	connected: boolean
	tokenExpiresAt: string | null
	hasMessagingScope: boolean
}) {
	if (!params.connected) {
		return {
			isReady: false,
			code: 'channel_inactive',
			message: 'TikTok channel is inactive.',
		}
	}

	if (params.tokenExpiresAt) {
		const parsed = new Date(params.tokenExpiresAt)
		if (!Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now()) {
			return {
				isReady: false,
				code: 'token_expired',
				message: 'TikTok access token expired. Reconnect channel.',
			}
		}
	}

	if (!params.hasMessagingScope) {
		return {
			isReady: false,
			code: 'messaging_scope_not_detected',
			message:
				'No messaging scope detected in OAuth token. Ensure TikTok messaging product is approved and reconnect.',
		}
	}

	return {
		isReady: true,
		code: 'ready',
		message: 'OAuth token looks ready for TikTok messaging webhooks.',
	}
}

export abstract class TikTokService {
	static buildLoginUrl(appId: string) {
		const clientKey = resolveTikTokClientKey()
		const redirectUri = normalizeRedirectUri(resolveTikTokRedirectUri())
		const scopes = resolveRequestedScopeText()

		if (!clientKey) {
			throw new Error(
				'TIKTOK_CLIENT_KEY (or TIKTOK_APP_ID/TIKTOK_CLIENT_ID) is not configured',
			)
		}

		const state = toBase64State({
			timestamp: Date.now(),
			appId,
			redirectUri,
		})

		const params = new URLSearchParams({
			client_key: clientKey,
			response_type: 'code',
			scope: scopes,
			redirect_uri: redirectUri,
			state,
		})

		return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
	}

	static parseState(state: string) {
		const parsed = fromBase64State(state)
		return {
			appId: asString(parsed.appId),
			redirectUri: asString(parsed.redirectUri),
		}
	}

	static async getChannels(appId: string) {
		const inboxes = await prisma.inboxes.findMany({
			where: {
				channel_type: 'tiktok',
				is_active: true,
				deleted_at: null,
				app_id: appId,
			},
			orderBy: { created_at: 'desc' },
		})

		return inboxes.map((inbox) => {
			const config = asRecord(inbox.channel_config)
			const tokenExpiresAt = asString(config.token_expires_at)
			const scopeInsights = resolveScopeInsights(config)
			const readiness = resolveMessagingReadiness({
				connected: Boolean(inbox.is_active && !inbox.deleted_at),
				tokenExpiresAt,
				hasMessagingScope: scopeInsights.hasMessaging,
			})
			return {
				id: inbox.id,
				name: inbox.name,
				channel_type: inbox.channel_type,
				is_active: inbox.is_active,
				created_at: inbox.created_at,
				updated_at: inbox.updated_at,
				tiktok_id: asString(config.tiktok_id) || asString(config.open_id),
				open_id: asString(config.open_id),
				union_id: asString(config.union_id),
				display_name: asString(config.display_name),
				avatar_url: asString(config.avatar_url),
				token_expires_at: tokenExpiresAt,
				scope: scopeInsights.grantedScopeText,
				requested_scope: scopeInsights.requestedScopeText,
				granted_scopes: scopeInsights.grantedScopes,
				requested_scopes: scopeInsights.requestedScopes,
				has_messaging_scope: scopeInsights.hasMessaging,
				messaging_readiness: readiness.code,
				messaging_readiness_message: readiness.message,
			}
		})
	}

	static async getChannelById(inboxId: string) {
		const inbox = await prisma.inboxes.findUnique({
			where: { id: inboxId },
		})

		if (!inbox) return null
		const config = asRecord(inbox.channel_config)
		const tokenExpiresAt = asString(config.token_expires_at)
		const scopeInsights = resolveScopeInsights(config)
		const readiness = resolveMessagingReadiness({
			connected: Boolean(inbox.is_active && !inbox.deleted_at),
			tokenExpiresAt,
			hasMessagingScope: scopeInsights.hasMessaging,
		})
		return {
			id: inbox.id,
			name: inbox.name,
			channel_type: inbox.channel_type,
			is_active: inbox.is_active,
			created_at: inbox.created_at,
			updated_at: inbox.updated_at,
			tiktok_id: asString(config.tiktok_id) || asString(config.open_id),
			open_id: asString(config.open_id),
			union_id: asString(config.union_id),
			display_name: asString(config.display_name),
			avatar_url: asString(config.avatar_url),
			token_expires_at: tokenExpiresAt,
			scope: scopeInsights.grantedScopeText,
			requested_scope: scopeInsights.requestedScopeText,
			granted_scopes: scopeInsights.grantedScopes,
			requested_scopes: scopeInsights.requestedScopes,
			has_messaging_scope: scopeInsights.hasMessaging,
			messaging_readiness: readiness.code,
			messaging_readiness_message: readiness.message,
		}
	}

	static async handleCallback(
		code: string,
		appId: string,
		redirectUriOverride?: string | null,
	) {
		const clientKey = resolveTikTokClientKey()
		const clientSecret = resolveTikTokClientSecret()
		const redirectUri = normalizeRedirectUri(
			redirectUriOverride || resolveTikTokRedirectUri(),
		)
		const tokenUrl =
			process.env.TIKTOK_TOKEN_URL || 'https://open.tiktokapis.com/v2/oauth/token/'
		const profileUrl =
			process.env.TIKTOK_PROFILE_URL ||
			'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,display_name,avatar_url'

		if (!clientKey || !clientSecret) {
			throw new Error(
				'TIKTOK client credentials are missing. Configure TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET.',
			)
		}

		const tokenResponse = await fetch(tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: new URLSearchParams({
				client_key: clientKey,
				client_secret: clientSecret,
				code,
				grant_type: 'authorization_code',
				redirect_uri: redirectUri,
			}).toString(),
		})

		const tokenPayload = (await tokenResponse.json()) as unknown
		if (!tokenResponse.ok) {
			throw new Error(
				`TikTok token exchange failed: ${formatTikTokError(tokenPayload)}`,
			)
		}
		const tokenError = resolveTikTokError(tokenPayload)
		if (tokenError.hasError) {
			throw new Error(`TikTok token exchange rejected: ${formatTikTokError(tokenPayload)}`)
		}

		const tokenData = resolveTokenContainer(tokenPayload)
		const accessToken =
			asString(tokenData.access_token) || asString(tokenData.accessToken)
		const refreshToken = asString(tokenData.refresh_token)
		const openId = asString(tokenData.open_id)
		const unionId = asString(tokenData.union_id)
		const tokenType = asString(tokenData.token_type) || 'Bearer'
		const scope = asString(tokenData.scope)
		const requestedScopeText = resolveRequestedScopeText()
		const grantedScopes = splitScopeList(scope)
		const requestedScopes = splitScopeList(requestedScopeText)
		const expiresAt = resolveExpiryDate(tokenData.expires_in)

		if (!accessToken) {
			throw new Error(
				`TikTok token exchange succeeded but returned no access_token: ${formatTikTokError(tokenPayload)}`,
			)
		}

		const profileResponse = await fetch(profileUrl, {
			method: 'GET',
			headers: {
				Authorization: `${tokenType} ${accessToken}`,
			},
		})
		const profilePayload = (await profileResponse.json()) as unknown
		if (!profileResponse.ok) {
			throw new Error(
				`TikTok profile request failed: ${formatTikTokError(profilePayload)}`,
			)
		}
		if (resolveTikTokError(profilePayload).hasError) {
			throw new Error(
				`TikTok profile request rejected: ${formatTikTokError(profilePayload)}`,
			)
		}
		const profileData = resolveProfileContainer(profilePayload)

		const resolvedOpenId =
			asString(profileData.open_id) || openId || asString(profileData.user_id)
		const resolvedUnionId = asString(profileData.union_id) || unionId
		const resolvedTikTokId = resolvedOpenId || resolvedUnionId

		if (!resolvedTikTokId) {
			throw new Error(
				'TikTok profile response missing open_id/union_id. Cannot attach inbox.',
			)
		}

		const displayName =
			asString(profileData.display_name) ||
			asString(profileData.username) ||
			`TikTok ${resolvedTikTokId.slice(-6)}`
		const avatarUrl =
			asString(profileData.avatar_url) ||
			asString(profileData.avatar_url_100) ||
			asString(profileData.avatar_large_url)

		const existingInboxMatchers: Array<Record<string, unknown>> = [
			{ channel_config: { path: ['tiktok_id'], equals: resolvedTikTokId } },
		]
		if (resolvedOpenId) {
			existingInboxMatchers.push({
				channel_config: { path: ['open_id'], equals: resolvedOpenId },
			})
		}
		if (resolvedUnionId) {
			existingInboxMatchers.push({
				channel_config: { path: ['union_id'], equals: resolvedUnionId },
			})
		}

		const existingInbox = await prisma.inboxes.findFirst({
			where: {
				app_id: appId,
				channel_type: 'tiktok',
				OR: existingInboxMatchers as any,
			},
		})

		const channelConfig = {
			tiktok_id: resolvedTikTokId,
			open_id: resolvedOpenId,
			union_id: resolvedUnionId,
			display_name: displayName,
			avatar_url: avatarUrl,
			access_token: accessToken,
			refresh_token: refreshToken,
			token_type: tokenType,
			scope,
			requested_scope: requestedScopeText,
			granted_scopes: grantedScopes,
			requested_scopes: requestedScopes,
			token_expires_at: expiresAt.toISOString(),
		}

		let inbox
		if (existingInbox) {
			inbox = await prisma.inboxes.update({
				where: { id: existingInbox.id },
				data: {
					name: `TikTok: ${displayName}`,
					channel_config: {
						...asRecord(existingInbox.channel_config),
						...channelConfig,
					},
					is_active: true,
					deleted_at: null,
					updated_at: new Date(),
				},
			})
		} else {
			inbox = await prisma.inboxes.create({
				data: {
					app_id: appId,
					channel_type: 'tiktok',
					name: `TikTok: ${displayName}`,
					channel_config: channelConfig,
				},
			})
		}

		return {
			inboxId: inbox.id,
			displayName,
			tiktokId: resolvedTikTokId,
		}
	}

	static async getStatus(inboxId: string) {
		const inbox = await prisma.inboxes.findUnique({
			where: { id: inboxId },
		})

		if (!inbox) throw new Error('Inbox not found')
		const config = asRecord(inbox.channel_config)
		const tokenExpiresAt = asString(config.token_expires_at)
		const scopeInsights = resolveScopeInsights(config)
		const readiness = resolveMessagingReadiness({
			connected: Boolean(inbox.is_active && !inbox.deleted_at),
			tokenExpiresAt,
			hasMessagingScope: scopeInsights.hasMessaging,
		})

		return {
			connected: Boolean(inbox.is_active && !inbox.deleted_at),
			id: inbox.id,
			tiktokId:
				asString(config.tiktok_id) ||
				asString(config.open_id) ||
				asString(config.union_id) ||
				'unknown',
			openId: asString(config.open_id),
			unionId: asString(config.union_id),
			displayName: asString(config.display_name) || inbox.name || 'TikTok',
			avatarUrl: asString(config.avatar_url),
			connectionStatus: inbox.is_active ? 'connected' : 'inactive',
			connectedAt: inbox.created_at || null,
			tokenExpiresAt,
			daysUntilTokenExpiry: resolveDaysUntil(tokenExpiresAt),
			scope: scopeInsights.grantedScopeText,
			requestedScope: scopeInsights.requestedScopeText,
			grantedScopes: scopeInsights.grantedScopes,
			requestedScopes: scopeInsights.requestedScopes,
			hasMessagingScope: scopeInsights.hasMessaging,
			isMessagingReady: readiness.isReady,
			messagingReadiness: readiness.code,
			messagingReadinessMessage: readiness.message,
		}
	}

	static async deleteConnection(inboxId: string) {
		return prisma.inboxes.update({
			where: { id: inboxId },
			data: {
				deleted_at: new Date(),
				is_active: false,
			},
		})
	}

	static async refreshTokens() {
		const clientKey = resolveTikTokClientKey()
		const clientSecret = resolveTikTokClientSecret()
		const refreshUrl =
			process.env.TIKTOK_REFRESH_URL ||
			process.env.TIKTOK_TOKEN_URL ||
			'https://open.tiktokapis.com/v2/oauth/token/'
		const expiryThreshold = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

		if (!clientKey || !clientSecret) return

		const inboxesToRefresh = await prisma.inboxes.findMany({
			where: {
				channel_type: 'tiktok',
				is_active: true,
				deleted_at: null,
				channel_config: {
					path: ['token_expires_at'],
					lt: expiryThreshold.toISOString(),
				},
			},
		})

		for (const inbox of inboxesToRefresh) {
			const config = asRecord(inbox.channel_config)
			const refreshToken = asString(config.refresh_token)
			if (!refreshToken) continue

			try {
				const response = await fetch(refreshUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						Accept: 'application/json',
					},
					body: new URLSearchParams({
						client_key: clientKey,
						client_secret: clientSecret,
						grant_type: 'refresh_token',
						refresh_token: refreshToken,
					}).toString(),
				})

				const payload = (await response.json()) as unknown
				if (!response.ok) {
					console.error(
						`[TikTokService] Failed to refresh token for inbox ${inbox.id}:`,
						formatTikTokError(payload),
					)
					continue
				}
				if (resolveTikTokError(payload).hasError) {
					console.error(
						`[TikTokService] TikTok rejected refresh token for inbox ${inbox.id}:`,
						formatTikTokError(payload),
					)
					continue
				}

				const tokenData = resolveTokenContainer(payload)
				const nextAccessToken = asString(tokenData.access_token)
				const nextRefreshToken = asString(tokenData.refresh_token)
				const nextExpiresAt = resolveExpiryDate(tokenData.expires_in)

				if (!nextAccessToken) continue

				await prisma.inboxes.update({
					where: { id: inbox.id },
					data: {
						channel_config: {
							...config,
							access_token: nextAccessToken,
							refresh_token: nextRefreshToken || refreshToken,
							token_expires_at: nextExpiresAt.toISOString(),
						},
						updated_at: new Date(),
					},
				})
			} catch (error) {
				console.error(
					`[TikTokService] Failed to refresh token for inbox ${inbox.id}:`,
					error,
				)
			}
		}
	}
}
