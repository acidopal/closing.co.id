import { Elysia, t } from 'elysia'
import { OrchestrationService } from './service'
import { OrchestrationModel, OrchestrationRequestModel } from './model'
import { appContext } from '../../plugins'

export const orchestration = new Elysia({
	prefix: '/orchestration',
	tags: ['AI'],
})
	.use(appContext)
	.post(
		'/decide',
		async ({ body, resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			// Mock decision logic
			return {
				success: true,
				decision: {
					action: 'handoff',
					reason: 'Customer requested human assistance',
					confidence: 0.98,
					agentId: 'human-agent-uuid',
				},
			}
		},
		{
			body: OrchestrationRequestModel.decide,
		},
	)
	.get(
		'/agents',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const agents =
				await OrchestrationService.getAvailableAgents(resolvedAppId)
			return { success: true, agents }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.post(
		'/handoff',
		async ({ body }) => {
			await OrchestrationService.executeHandoff(
				body.conversationId,
				body.fromAgentId,
				body.toAgentId,
				body.reason || 'Manual handoff',
			)
			return { success: true }
		},
		{
			body: OrchestrationRequestModel.handoff,
		},
	)
	.get(
		'/handoffs/:conversationId',
		async ({ params }) => {
			const handoffs = await OrchestrationService.getHandoffs(
				params.conversationId,
			)
			return { success: true, handoffs }
		},
		{
			params: t.Object({ conversationId: t.String() }),
		},
	)
