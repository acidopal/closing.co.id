import { Elysia, t } from 'elysia'
import { WebhookService } from './service'
import { appContext } from '../../plugins'

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'scalechat_webhook_secret'
const TIKTOK_VERIFY_TOKEN =
	process.env.TIKTOK_WEBHOOK_VERIFY_TOKEN || process.env.TIKTOK_VERIFY_TOKEN || ''

console.log('[WEBHOOK] Loaded verify token:', VERIFY_TOKEN?.substring(0, 4) + '***')

export const webhook = new Elysia({ prefix: '/webhooks', tags: ['Webhook'] })
	.use(appContext)
	// Meta Webhook Verification (GET)
	.get('/whatsapp', ({ query, set }) => {
		const mode = query['hub.mode']
		const token = query['hub.verify_token']
		const challenge = query['hub.challenge']

		console.log('[WEBHOOK] WhatsApp verification request:', {
			mode,
			tokenReceived: token?.substring(0, 4) + '***',
			tokenExpected: VERIFY_TOKEN?.substring(0, 4) + '***',
			tokenMatch: token === VERIFY_TOKEN,
			challenge: challenge?.substring(0, 10) + '...',
		})

		if (mode === 'subscribe' && token === VERIFY_TOKEN) {
			console.log('[WEBHOOK] WhatsApp verification successful')
			// Meta requires the challenge to be returned as plain text (not JSON)
			set.headers['content-type'] = 'text/plain'
			return challenge
		}
		console.error('[WEBHOOK] WhatsApp verification failed', { mode, token: token?.substring(0, 4) + '...' })
		set.status = 403
		return 'Forbidden'
	}, {
		query: t.Object({
			'hub.mode': t.Optional(t.String()),
			'hub.verify_token': t.Optional(t.String()),
			'hub.challenge': t.Optional(t.String()),
		}),
	})
	.get('/instagram', ({ query, set }) => {
		const mode = query['hub.mode']
		const token = query['hub.verify_token']
		const challenge = query['hub.challenge']

		console.log('[WEBHOOK] Instagram verification request:', {
			mode,
			tokenReceived: token?.substring(0, 4) + '***',
			tokenExpected: VERIFY_TOKEN?.substring(0, 4) + '***',
			tokenMatch: token === VERIFY_TOKEN,
			challenge: challenge?.substring(0, 10) + '...',
		})

		if (mode === 'subscribe' && token === VERIFY_TOKEN) {
			console.log('[WEBHOOK] Instagram verification successful')
			// Meta requires the challenge to be returned as plain text (not JSON)
			set.headers['content-type'] = 'text/plain'
			return challenge
		}
		console.error('[WEBHOOK] Instagram verification failed', { mode, token: token?.substring(0, 4) + '...' })
		set.status = 403
		return 'Forbidden'
		}, {
			query: t.Object({
				'hub.mode': t.Optional(t.String()),
				'hub.verify_token': t.Optional(t.String()),
				'hub.challenge': t.Optional(t.String()),
			}),
		})
		.get('/tiktok', ({ query, set }) => {
			const challenge = String(
				query.challenge || query['hub.challenge'] || '',
			).trim()
			const mode = String(query['hub.mode'] || '').trim()
			const token = String(
				query.verify_token || query['hub.verify_token'] || '',
			).trim()

			const shouldValidateToken = TIKTOK_VERIFY_TOKEN.length > 0 && token.length > 0
			if (shouldValidateToken && token !== TIKTOK_VERIFY_TOKEN) {
				console.error('[WEBHOOK] TikTok verification failed - token mismatch')
				set.status = 403
				return 'Forbidden'
			}

			if (challenge) {
				set.headers['content-type'] = 'text/plain'
				return challenge
			}

			if (mode === 'subscribe') {
				set.headers['content-type'] = 'text/plain'
				return 'ok'
			}

			set.status = 400
			return 'Bad Request'
		}, {
			query: t.Object({
				challenge: t.Optional(t.String()),
				verify_token: t.Optional(t.String()),
				'hub.mode': t.Optional(t.String()),
				'hub.verify_token': t.Optional(t.String()),
				'hub.challenge': t.Optional(t.String()),
			}),
		})
	.get(
		'/whatsapp/media/:messageId',
		async ({ params, set }) => {
			try {
				const media =
					await WebhookService.getWhatsAppMediaContentByMessageId(params.messageId)
				if (!media) {
					set.status = 404
					return { error: 'Media not found' }
				}

				return new Response(media.buffer, {
					status: 200,
					headers: {
						'content-type': media.mimeType,
						'cache-control': 'public, max-age=300',
					},
				})
			} catch (error) {
				console.error('[WEBHOOK] Failed to stream WhatsApp media:', error)
				set.status = 500
				return { error: 'Failed to load media' }
			}
		},
		{
			params: t.Object({
				messageId: t.String(),
			}),
		},
	)
	// Meta Webhook Payloads (POST)
	.post('/whatsapp', async ({ body }) => {
		return WebhookService.processWhatsAppPayload(body)
	})
	.post('/instagram', async ({ body }) => {
		return WebhookService.processInstagramPayload(body)
	})
		.post('/tiktok', async ({ body }) => {
			return WebhookService.processTikTokPayload(body)
		})

	// Outbound Management
	.get(
		'/',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const hooks = await WebhookService.getWebhooks(resolvedAppId)
			return { data: hooks }
		},
		{
			query: t.Object({ accountId: t.Optional(t.String()) }),
		},
	)
	.post(
		'/',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const hook = await WebhookService.createWebhook(resolvedAppId, body)
			return { data: hook }
		},
		{
			query: t.Object({ accountId: t.Optional(t.String()) }),
			body: t.Object({
				url: t.String(),
				name: t.Optional(t.String()),
				events: t.Optional(t.Array(t.String())),
			}),
		},
	)
	.delete(
		'/:id',
		async ({ params }) => {
			await WebhookService.deleteWebhook(params.id)
			return { success: true }
		},
		{
			params: t.Object({ id: t.String() }),
		},
	)
