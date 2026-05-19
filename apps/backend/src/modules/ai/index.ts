import { Elysia, t } from 'elysia'
import { AIService } from './service'
import { AIModel, AIRequestModel } from './model'
import { appContext } from '../../plugins'

export const ai = new Elysia({ prefix: '/ai', tags: ['AI'] })
	.use(appContext)
	.get(
		'/settings',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const settings = await AIService.getSettings(resolvedAppId)
			return { data: settings }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.patch(
		'/settings',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const settings = await AIService.updateSettings(resolvedAppId, body)
			return { data: settings }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
			body: AIRequestModel.updateSettings,
		},
	)
	.get('/providers', async () => {
		const providers = await AIService.getProviderConfigurations()
		return { data: providers }
	})
	.put(
		'/providers/:provider',
		async ({ params, body }) => {
			const config = await AIService.upsertProviderConfiguration(
				params.provider,
				body,
			)
			return { data: config }
		},
		{
			params: t.Object({
				provider: t.Union([t.Literal('azure'), t.Literal('sumopod')]),
			}),
			body: AIRequestModel.upsertProviderConfig,
		},
	)
	.patch(
		'/providers/active',
		async ({ body }) => {
			const provider = await AIService.setActiveProvider(body.provider)
			return { data: { active_provider: provider } }
		},
		{
			body: AIRequestModel.setActiveProvider,
		},
	)
	.get(
		'/suggest/:conversationId',
		async ({ params, resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}

			try {
				const suggestion = await AIService.getSuggestions(
					params.conversationId,
					resolvedAppId,
				)
				return { data: suggestion }
			} catch (error: any) {
				return { error: error.message }
			}
		},
		{
			params: t.Object({ conversationId: t.String() }),
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.post(
		'/generate',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}

			try {
				const response = await AIService.generateResponse(resolvedAppId, body)
				return { success: true, ...response }
			} catch (error: any) {
				return { error: error.message }
			}
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
			body: t.Object({
				message: t.String(),
				conversationId: t.Optional(t.String()),
			}),
		},
	)
	.post(
		'/evaluate',
		async ({ body, resolvedAppId, set }) => {
			const targetAppId = resolvedAppId || body.appId
			if (!targetAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const evaluation = await AIService.recordEvaluation({
				...body,
				appId: targetAppId,
			})
			return { data: evaluation }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
			body: t.Object({
				appId: t.Optional(t.String()),
				conversationId: t.String(),
				score: t.Number(),
				feedback: t.Optional(t.String()),
			}),
		},
	)
