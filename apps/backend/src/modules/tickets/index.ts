import { Elysia, t } from 'elysia'
import { appContext } from '../../plugins'
import { TicketsRequestModel } from './model'
import { TicketsService } from './service'

export const tickets = new Elysia({
	prefix: '/tickets',
	tags: ['Tickets'],
})
	.use(appContext)
	.get('/settings', async ({ resolvedAppId, set }) => {
		if (!resolvedAppId) {
			set.status = 400
			return { error: 'App ID required' }
		}

		const data = await TicketsService.getSettings(resolvedAppId)
		return { success: true, data }
	})
	.put(
		'/settings/default-board',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}

			try {
				const data = await TicketsService.setDefaultBoard(
					resolvedAppId,
					body.board_id,
				)
				return { success: true, data }
			} catch (error) {
				set.status = 400
				return {
					error:
						error instanceof Error ? error.message : 'Failed to set default board',
				}
			}
		},
		{
			body: TicketsRequestModel.setDefaultBoard,
		},
	)
	.post(
		'/kanban',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}

			try {
				const data = await TicketsService.getKanban(resolvedAppId, body)
				return { success: true, data }
			} catch (error) {
				set.status = 400
				return {
					error:
						error instanceof Error ? error.message : 'Failed to fetch ticket board',
				}
			}
		},
		{
			body: TicketsRequestModel.kanban,
		},
	)
	.get(
		'/conversations/:conversationId',
		async ({ resolvedAppId, params, query, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}

			const data = await TicketsService.getConversationSummary(
				resolvedAppId,
				params.conversationId,
				query.board_id,
			)
			return { success: true, data }
		},
		{
			params: t.Object({
				conversationId: t.String(),
			}),
			query: t.Object({
				board_id: t.Optional(t.String()),
			}),
		},
	)

