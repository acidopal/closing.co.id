import { Elysia, t } from 'elysia'
import { WhatsAppService } from './service'
import { WhatsAppRequestModel } from './model'
import { appContext } from '../../plugins'

export const whatsapp = new Elysia({ tags: ['WhatsApp'] })
	.use(appContext)
	.get(
		'/',
		async ({ resolvedAppId, query, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const channels = await WhatsAppService.getChannels(
				resolvedAppId,
				query.search,
			)
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
	.get(
		'/:id/details',
		async ({ params, set }) => {
			const channel = await WhatsAppService.getChannelById(params.id)
			if (!channel) {
				set.status = 404
				return { error: 'Channel not found' }
			}

			// Map quality and limits for the frontend expected shapes
			const getQualityScore = (rating: string | null) => {
				if (rating === 'GREEN') return { percentage: 100, color: 'emerald', label: 'High' }
				if (rating === 'YELLOW') return { percentage: 50, color: 'yellow', label: 'Medium' }
				if (rating === 'RED') return { percentage: 20, color: 'red', label: 'Low' }
				return { percentage: 0, color: 'gray', label: 'Unknown' }
			}
			
			const getTierLimit = (tier: string | null) => {
				switch (tier) {
					case 'TIER_50': return { tier_level: 0, daily_limit: '50' }
					case 'TIER_250': return { tier_level: 0, daily_limit: '250' }
					case 'TIER_1K': return { tier_level: 1, daily_limit: '1K' }
					case 'TIER_10K': return { tier_level: 2, daily_limit: '10K' }
					case 'TIER_100K': return { tier_level: 3, daily_limit: '100K' }
					case 'TIER_UNLIMITED': return { tier_level: 4, daily_limit: 'Unlimited' }
					default: return { tier_level: -1, daily_limit: 'Unknown' }
				}
			}

			const enrichedChannel = {
				...channel,
				metadata:
					channel.extended_metadata &&
					typeof channel.extended_metadata === 'object' &&
					!Array.isArray(channel.extended_metadata)
						? channel.extended_metadata
						: {},
				quality_rating: channel.quality_rating || 'UNKNOWN',
				quality_score: getQualityScore(channel.quality_rating),
				limit_info: getTierLimit(channel.messaging_limit_tier),
				messaging_limit: channel.messaging_limit_tier || 'UNKNOWN'
			}

			return { data: enrichedChannel, success: true }
		},
		{
			params: t.Object({ id: t.String() }),
		},
	)
	.post(
		'/:id/badge',
		async ({ params, body, set }) => {
			try {
				const file = (body as any).badge as File
				if (!file) {
					set.status = 400
					return { error: 'No file provided. Use "badge" field.' }
				}
				const result = await WhatsAppService.uploadBadge(params.id, file)
				return { success: true, ...result }
			} catch (error: any) {
				console.error('[Badge Upload Error]', error.message)
				set.status = error.message.includes('not found') ? 404 : 400
				return { error: error.message }
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				badge: t.File({
					type: ['image/jpeg', 'image/jpg', 'image/png'],
					maxSize: '2m',
				}),
			}),
		},
	)
	.delete(
		'/:id/badge',
		async ({ params, set }) => {
			try {
				const result = await WhatsAppService.removeBadge(params.id)
				return { success: true, ...result }
			} catch (error: any) {
				console.error('[Badge Remove Error]', error.message)
				set.status = error.message.includes('not found') ? 404 : 400
				return { error: error.message }
			}
		},
		{
			params: t.Object({ id: t.String() }),
		},
	)
	.get(
		'/callback',
		async ({ query, set }) => {
			try {
				const {
					code,
					state,
					waba_id,
					whatsapp_business_account_id,
					phone_number_id,
					phone_number_ids,
				} = query as any
				const queryWabaId = waba_id || whatsapp_business_account_id
				const queryPhoneNumberId = phone_number_id || phone_number_ids

				console.log('[WhatsApp Callback] Received query params:', {
					hasCode: !!code,
					hasState: !!state,
					queryWabaId,
					queryPhoneNumberId,
				})

				if (!code) {
					return new Response(
						`
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'WA_ERROR', reason: 'missing_code' }, '*');
                window.close();
              } else {
                window.location.href = '/?error=missing_code';
              }
            </script>
          `,
						{ headers: { 'content-type': 'text/html' } },
					)
				}

				const stateData = state
					? JSON.parse(Buffer.from(state, 'base64').toString())
					: {}
				const appId = stateData.appId
				const lang = stateData.lang || 'en'

				console.log('[WhatsApp Callback] Decoded state:', { appId, lang })

				// Exchange code for token
				const redirectUri = process.env.WHATSAPP_REDIRECT_URI ||
					'https://api.scalebiz.chat/api/whatsapp-channels/callback'

				console.log('[WhatsApp Callback] Token exchange params:', {
					client_id: process.env.FB_APP_ID,
					redirect_uri: redirectUri,
					codePrefix: code?.substring(0, 10) + '...',
				})

				const tokenParams = new URLSearchParams({
					client_id: process.env.FB_APP_ID!,
					client_secret: process.env.FB_APP_SECRET!,
					code: code,
					redirect_uri: redirectUri,
				})

				const tokenResponse = await fetch(
					`https://graph.facebook.com/v23.0/oauth/access_token?${tokenParams.toString()}`,
				)
				const tokenData = (await tokenResponse.json()) as any

				console.log('[WhatsApp Callback] Token exchange result:', {
					success: !tokenData.error,
					error: tokenData.error,
					hasAccessToken: !!tokenData.access_token,
					tokenType: tokenData.token_type,
				})

				if (tokenData.error) {
					throw new Error(`Token exchange failed: ${tokenData.error.message || JSON.stringify(tokenData.error)}`)
				}

				const accessToken = tokenData.access_token
				const seeds = {
					wabaIds: queryWabaId ? queryWabaId.split(',') : [],
					phoneIds: queryPhoneNumberId ? queryPhoneNumberId.split(',') : [],
				}

				console.log('[WhatsApp Callback] Calling completeWabaSync with:', {
					appId,
					seeds,
					hasAccessToken: !!accessToken,
				})

				const createdChannels = await WhatsAppService.completeWabaSync(
					accessToken,
					appId,
					seeds,
				)

				console.log('[WhatsApp Callback] Sync result:', {
					channelCount: createdChannels.length,
					channels: createdChannels.map((c: any) => ({ id: c.id, name: c.name })),
				})

				if (createdChannels.length === 0) {
					// Instead of throwing, redirect with error info
					const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'https://app.scalebiz.chat'
					return new Response(
						`
						<html>
						<body>
						<h2>Connection completed but no channels were created</h2>
						<p>This may happen if:</p>
						<ul>
							<li>No WhatsApp Business Account was shared during signup</li>
							<li>The WABA has no phone numbers assigned</li>
							<li>The Facebook token exchange failed silently</li>
						</ul>
						<p><a href="${frontendUrl}/${lang}/${appId}/channels">Go back to Channels</a></p>
						<script>
							if (window.opener) {
								window.opener.postMessage({ type: 'WA_ERROR', reason: 'no_channels_created' }, '*');
							}
						</script>
						</body>
						</html>
						`,
						{ headers: { 'content-type': 'text/html' } },
					)
				}

				const mainChannelId = createdChannels[0].id
				return new Response(
					`
					<html>
					<body>
					<h2>Connection successful!</h2>
					<p>Loading your channel... you can close this window.</p>
					<script>
						if (window.opener) {
							window.opener.postMessage({ type: 'WA_SUCCESS', channelId: '${mainChannelId}', appId: '${appId}' }, '*');
							setTimeout(() => window.close(), 500);
						} else {
							window.location.href = '/${lang}/${appId}/channels/whatsapp/success?channelId=${mainChannelId}';
						}
					</script>
					</body>
					</html>
					`,
					{ headers: { 'content-type': 'text/html' } },
				)
			} catch (error: any) {
				console.error('[WhatsApp Callback] ERROR:', error.message, error.stack)
				return new Response(
					`
            <html>
            <body>
            <h2>Connection failed: ${error.message}</h2>
            <p>Please try again or contact support.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'WA_ERROR', reason: '${error.message.replace(/'/g, "\\'")}' }, '*');
              }
            </script>
            </body>
            </html>
          `,
					{ headers: { 'content-type': 'text/html' } },
				)
			}
		},
		{
			query: t.Object({
				code: t.Optional(t.String()),
				state: t.Optional(t.String()),
				waba_id: t.Optional(t.String()),
				whatsapp_business_account_id: t.Optional(t.String()),
				phone_number_id: t.Optional(t.String()),
				phone_number_ids: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/config',
		async ({ set }) => {
			const fbAppId = process.env.FB_APP_ID
			const configId = process.env.WABA_CONFIG_ID

			if (!fbAppId) {
				set.status = 500
				return { error: 'FB_APP_ID not configured' }
			}

			return {
				data: {
					fbAppId,
					configId: configId || null,
				},
			}
		},
		{},
	)
	.get(
		'/:id',
		async ({ params, set }) => {
			const channel = await WhatsAppService.getChannelById(params.id)
			if (!channel) {
				set.status = 404
				return { error: 'Channel not found' }
			}
			return { data: channel }
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.post(
		'/',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const channel = await WhatsAppService.createChannel(body, resolvedAppId)
			return { data: channel }
		},
		{
			body: WhatsAppRequestModel.create,
		},
	)
	.patch(
		'/:id',
		async ({ params, body, set }) => {
			const channel = await WhatsAppService.updateChannel(params.id, body)
			if (!channel) {
				set.status = 404
				return { error: 'Channel not found' }
			}
			return { data: channel }
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: WhatsAppRequestModel.update,
		},
	)
	.delete(
		'/:id',
		async ({ params }) => {
			await WhatsAppService.deleteChannel(params.id)
			return { success: true }
		},
		{
			params: t.Object({ id: t.String() }),
		},
	)
	.post(
		'/exchange-token',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}

			try {
				const { code } = body

				// Exchange the code from FB.login() for an access token
				const tokenParams = new URLSearchParams({
					client_id: process.env.FB_APP_ID!,
					client_secret: process.env.FB_APP_SECRET!,
					code: code,
					redirect_uri:
						process.env.WHATSAPP_REDIRECT_URI ||
						'https://api.scalebiz.chat/api/whatsapp-channels/callback',
				})

				const tokenResponse = await fetch(
					`https://graph.facebook.com/v23.0/oauth/access_token?${tokenParams.toString()}`,
				)
				const tokenData = (await tokenResponse.json()) as any

				if (tokenData.error) {
					set.status = 400
					return { error: tokenData.error.message || 'Token exchange failed' }
				}

				const accessToken = tokenData.access_token

				// Sync WABAs and create channels
				const createdChannels = await WhatsAppService.completeWabaSync(
					accessToken,
					resolvedAppId,
					{ wabaIds: [], phoneIds: [] },
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
					},
				}
			} catch (error: any) {
				console.error('[WhatsApp] Exchange token error:', error)
				set.status = 500
				return { error: error.message || 'Failed to exchange token' }
			}
		},
		{
			body: WhatsAppRequestModel.exchangeToken,
		},
	)
	.post(
		'/init-signup',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}

			const fbAppId = process.env.FB_APP_ID
			const redirectUri =
				process.env.WHATSAPP_REDIRECT_URI ||
				'https://api.scalebiz.chat/api/whatsapp-channels/callback'
			const configId = process.env.WABA_CONFIG_ID
			const lang = (body as any)?.lang || 'en'

			// Generate state parameter for security (contains context)
			const state = Buffer.from(
				JSON.stringify({
					appId: resolvedAppId,
					lang: lang,
					timestamp: Date.now(),
				}),
			).toString('base64')

			// Construct the Meta Embedded Signup URL (Modern Flow)
			const params = new URLSearchParams({
				client_id: fbAppId || '',
				redirect_uri: redirectUri,
				state: state,
				response_type: 'code',
				scope: 'whatsapp_business_management,whatsapp_business_messaging,business_management',
				display: 'popup',
			})

			if (configId) {
				params.append('config_id', configId)
			}

			const extras = JSON.stringify({
				setup: {
					business: {
						name: '',
					},
				},
				featureType: 'whatsapp_business_app_onboarding',
				sessionInfoVersion: '3',
			})
			params.append('extras', extras)

			const signupUrl = `https://web.facebook.com/v23.0/dialog/oauth?${params.toString()}`

			return {
				success: true,
				data: {
					signupUrl: signupUrl,
				},
			}
		},
		{
			body: WhatsAppRequestModel.initSignup,
		},
	)
