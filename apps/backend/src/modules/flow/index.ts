import { Elysia, t } from 'elysia'
import { FlowService } from './service'
import { FlowModel, FlowRequestModel } from './model'
import { appContext } from '../../plugins'

export const flow = new Elysia({ prefix: '/flows', tags: ['Flow'] })
	.use(appContext)
	.get(
		'/',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const flows = await FlowService.getFlows(resolvedAppId)
			return { success: true, payload: flows }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.get(
		'/:id',
		async ({ params, resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const fl = await FlowService.getFlowById(params.id, resolvedAppId)
			if (!fl) return { error: 'Flow not found' }
			return { data: fl }
		},
		{
			params: t.Object({ id: t.String() }),
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.post(
		'/',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const fl = await FlowService.createFlow(resolvedAppId, body)
			return { data: fl }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
			body: FlowRequestModel.create,
		},
	)
	.patch(
		'/:id',
		async ({ params, resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const fl = await FlowService.updateFlow(params.id, resolvedAppId, body)
			return { data: fl }
		},
		{
			params: t.Object({ id: t.String() }),
			query: t.Object({ appId: t.Optional(t.String()) }),
			body: FlowRequestModel.update,
		},
	)
	.delete(
		'/:id',
		async ({ params, resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			await FlowService.deleteFlow(params.id, resolvedAppId)
			return { success: true }
		},
		{
			params: t.Object({ id: t.String() }),
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
