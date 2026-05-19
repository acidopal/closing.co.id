import { Elysia, t } from 'elysia'
import { TikTokService } from './service'
import { appContext } from '../../plugins'

const CALLBACK_HEADERS = {
	'content-type': 'text/html; charset=utf-8',
	'cache-control': 'no-store, no-cache, must-revalidate, private',
	pragma: 'no-cache',
	expires: '0',
}

const escapeForHtml = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')

const escapeForJs = (value: string) =>
	value
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/\r/g, '')
		.replace(/\n/g, '\\n')

const getOAuthErrorDetails = (message?: string) => {
	const normalizedMessage = String(message || '').trim()
	return {
		reason: 'tiktok_oauth_error',
		message:
			normalizedMessage ||
			'TikTok connection failed. Please try again from the Integrations page.',
	}
}

export const tiktok = new Elysia({ tags: ['TikTok'] })
	.use(appContext)
	.get(
		'/',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}

			const channels = await TikTokService.getChannels(resolvedAppId)
			return { data: channels }
		},
		{
			query: t.Object({
				appId: t.Optional(t.String()),
				accountId: t.Optional(t.String()),
				search: t.Optional(t.String()),
			}),
		},
	)
	.post('/init-login', async ({ resolvedAppId, set }) => {
		if (!resolvedAppId) {
			set.status = 400
			return { error: 'App ID required' }
		}

		try {
			const loginUrl = TikTokService.buildLoginUrl(resolvedAppId)
			const redirectUri = (() => {
				try {
					return new URL(loginUrl).searchParams.get('redirect_uri')
				} catch {
					return null
				}
			})()
			return {
				success: true,
				data: {
					loginUrl,
					redirectUri,
				},
			}
		} catch (error: any) {
			set.status = 500
			return {
				error: error?.message || 'Failed to initialize TikTok login',
			}
		}
	})
	.get(
		'/callback',
		async ({ query }) => {
			const { code, state } = query as any

			if (!code || !state) {
				const reason = 'missing_code_or_state'
				const message =
					'TikTok did not return a valid authorization code. Please click Connect TikTok and try again.'

				return new Response(
					`<html><body><script>
						try { window.history.replaceState({}, document.title, window.location.pathname); } catch (error) {}
						if (window.opener) {
							window.opener.postMessage({ type: 'TT_ERROR', reason: '${reason}', message: '${escapeForJs(message)}' }, '*');
							setTimeout(() => window.close(), 500);
						}
					</script><h2>Connection failed</h2><p>${escapeForHtml(message)}</p></body></html>`,
					{ headers: CALLBACK_HEADERS },
				)
			}

			try {
				const stateData = TikTokService.parseState(state)
				const appId = stateData.appId
				const redirectUri = stateData.redirectUri

				if (!appId) {
					throw new Error('Invalid state payload')
				}

				const result = await TikTokService.handleCallback(
					code,
					appId,
					redirectUri,
				)

				return new Response(
					`<!DOCTYPE html>
					<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
					<title>TikTok Connected</title>
					<style>
						*{margin:0;padding:0;box-sizing:border-box}
						body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh}
						.card{background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:48px 40px;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.06)}
						.icon{width:72px;height:72px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:#fff;font-weight:700}
						h1{font-size:22px;font-weight:700;color:#111827;margin-bottom:20px}
						.check{width:48px;height:48px;border-radius:50%;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
						.check svg{width:24px;height:24px;color:#059669}
						.username{font-size:16px;color:#374151;margin-bottom:6px}
						.closing{font-size:13px;color:#9ca3af}
					</style></head>
					<body><div class="card">
						<div class="icon">TT</div>
						<h1>Connection Successful!</h1>
						<div class="check"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
						<p class="username">Successfully connected ${escapeForHtml(result.displayName)}.</p>
						<p class="closing">Closing window...</p>
					</div>
					<script>
						try { window.history.replaceState({}, document.title, window.location.pathname); } catch (error) {}
						if (window.opener) {
							window.opener.postMessage({ type: 'TIKTOK_CONNECTED', inboxId: '${result.inboxId}' }, '*');
							setTimeout(() => window.close(), 1500);
						} else {
							setTimeout(() => window.close(), 3000);
						}
					</script>
					</body></html>`,
					{ headers: CALLBACK_HEADERS },
				)
			} catch (error: any) {
				const { reason, message } = getOAuthErrorDetails(error?.message)
				return new Response(
					`<html><body>
					<h2>Connection failed</h2>
					<p>${escapeForHtml(message)}</p>
					<script>
						try { window.history.replaceState({}, document.title, window.location.pathname); } catch (error) {}
						if (window.opener) {
							window.opener.postMessage({ type: 'TT_ERROR', reason: '${escapeForJs(reason)}', message: '${escapeForJs(message)}' }, '*');
							setTimeout(() => window.close(), 2000);
						}
					</script>
					</body></html>`,
					{ headers: CALLBACK_HEADERS },
				)
			}
		},
		{
			query: t.Object({
				code: t.Optional(t.String()),
				state: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/:id/status',
		async ({ params }) => {
			const status = await TikTokService.getStatus(params.id)
			return { data: status }
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.delete(
		'/:id',
		async ({ params }) => {
			await TikTokService.deleteConnection(params.id)
			return { success: true }
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
