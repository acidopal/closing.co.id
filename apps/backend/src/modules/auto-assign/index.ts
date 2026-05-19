import { Elysia, t } from 'elysia'
import { AutoAssignService } from './service'
import { AutoAssignModel, AutoAssignRequestModel } from './model'
import { appContext } from '../../plugins'

export const autoAssign = new Elysia({
	prefix: '/auto-assign',
	tags: ['Advanced'],
})
	.use(appContext)
	// Rules
	.get(
		'/rules',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const rules = await AutoAssignService.getRules(resolvedAppId)
			return { success: true, payload: rules }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.post(
		'/rules',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const rule = await AutoAssignService.createRule(resolvedAppId, body)
			return { data: rule }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
			body: AutoAssignRequestModel.createRule,
		},
	)
	.patch(
		'/rules/:id',
		async ({ params, resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const rule = await AutoAssignService.updateRule(
				params.id,
				resolvedAppId,
				body,
			)
			return { data: rule }
		},
		{
			params: t.Object({ id: t.String() }),
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.delete(
		'/rules/:id',
		async ({ params, resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			await AutoAssignService.deleteRule(params.id, resolvedAppId)
			return { success: true }
		},
		{
			params: t.Object({ id: t.String() }),
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)

	// SLA Policies
	.get(
		'/sla',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const policies = await AutoAssignService.getSLAPolicies(resolvedAppId)
			return { success: true, payload: policies }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.post(
		'/sla',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const policy = await AutoAssignService.createSLAPolicy(
				resolvedAppId,
				body,
			)
			return { data: policy }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
			body: AutoAssignRequestModel.createPolicy,
		},
	)
	.delete(
		'/sla/:id',
		async ({ params, resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			await AutoAssignService.deleteSLAPolicy(params.id, resolvedAppId)
			return { success: true }
		},
		{
			params: t.Object({ id: t.String() }),
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)

	// Breaches
	.get(
		'/sla/breaches',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const breaches = await AutoAssignService.getSLABreaches(resolvedAppId)
			return { data: breaches }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
