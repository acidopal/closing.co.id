import { Elysia } from 'elysia'
import { appContext } from '../../plugins'
import { WhatsAppRequestModel } from '../whatsapp/model'
import { WhatsAppService } from '../whatsapp/service'

const META_VERIFY_TOKEN =
	process.env.META_VERIFY_TOKEN ||
	process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
	'scalechat_webhook_secret'

function toHeaderString(value: unknown): string | null {
	if (typeof value === 'string' && value.trim()) return value.trim()
	if (Array.isArray(value)) {
		const firstString = value.find(
			(item) => typeof item === 'string' && item.trim(),
		) as string | undefined
		if (firstString) return firstString.trim()
	}
	return null
}

function resolveOriginFromRequest(
	request: Request,
	headers: Record<string, unknown>,
) {
	const forwardedHost = toHeaderString(
		headers['x-forwarded-host'] || headers['X-Forwarded-Host'],
	)
	const forwardedProto = toHeaderString(
		headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'],
	)
	if (forwardedHost && forwardedProto) {
		return `${forwardedProto}://${forwardedHost}`
	}

	try {
		const url = new URL(request.url)
		if (url.protocol === 'http:' || url.protocol === 'https:') {
			return `${url.protocol}//${url.host}`
		}
	} catch {
		// Ignore invalid request URL
	}

	return null
}

function buildWebhookCallbackUrl(
	request: Request,
	headers: Record<string, unknown>,
) {
	const explicitUrl = process.env.WHATSAPP_WEBHOOK_CALLBACK_URL
	if (explicitUrl) return explicitUrl

	const publicApiUrl = process.env.API_PUBLIC_URL || process.env.BACKEND_URL
	if (publicApiUrl) {
		const normalized = publicApiUrl.replace(/\/$/, '')
		return `${normalized}/api/v1/webhooks/whatsapp`
	}

	const redirectUri = process.env.WHATSAPP_REDIRECT_URI
	if (redirectUri) {
		try {
			const parsed = new URL(redirectUri)
			return `${parsed.origin}/api/v1/webhooks/whatsapp`
		} catch {
			// Ignore invalid URL and fallback below.
		}
	}

	const requestOrigin = resolveOriginFromRequest(request, headers)
	if (requestOrigin) {
		return `${requestOrigin}/api/v1/webhooks/whatsapp`
	}

	return 'https://api.scalebiz.chat/api/v1/webhooks/whatsapp'
}

function getWebhookSetupData(request: Request, headers: Record<string, unknown>) {
	return {
		callbackUrl: buildWebhookCallbackUrl(request, headers),
		verifyToken: META_VERIFY_TOKEN,
	}
}

export const waba = new Elysia({ tags: ['WABA'] })
	.use(appContext)
	.get('/webhook-config', ({ request, headers }) => {
		return {
			success: true,
			data: getWebhookSetupData(request, headers as Record<string, unknown>),
		}
	})
	.post(
		'/connect/manual',
		async ({ resolvedAppId, body, set, request, headers }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}

			const accessToken = body.accessToken.trim()
			const wabaId = body.wabaId.trim()

			if (!accessToken || !wabaId) {
				set.status = 400
				return { error: 'Access Token and WABA ID are required' }
			}

			try {
				const createdChannels = await WhatsAppService.completeWabaSync(
					accessToken,
					resolvedAppId,
					{ wabaIds: [wabaId], phoneIds: [] },
				)

				if (createdChannels.length === 0) {
					set.status = 400
					return { error: 'No WhatsApp channels were found or created' }
				}

				return {
					success: true,
					data: {
						channels: createdChannels,
						primaryChannelId: createdChannels[0].id,
						webhook: getWebhookSetupData(
							request,
							headers as Record<string, unknown>,
						),
					},
				}
			} catch (error: any) {
				console.error('[WABA] Manual connect error:', error)
				set.status = 400
				return { error: error.message || 'Failed to connect WABA manually' }
			}
		},
		{
			body: WhatsAppRequestModel.manualConnect,
		},
	)
