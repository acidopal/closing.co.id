import { Elysia, t } from 'elysia'
import { MetricsService } from './service'
import { MetricsModel, MetricsRequestModel } from './model'
import { appContext } from '../../plugins'

export const metrics = new Elysia({ prefix: '/metrics', tags: ['Advanced'] })
	.use(appContext)
	.get(
		'/summary',
		async ({ resolvedAppId, query, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const summary = await MetricsService.getSummary(
				resolvedAppId,
				query.period,
			)
			return { data: summary }
		},
		{
			query: t.Object({
				appId: t.Optional(t.String()),
				period: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/dashboard',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			return MetricsService.getSummary(resolvedAppId, '24h')
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.get(
		'/ai',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const metrics = await MetricsService.getAIMetrics(resolvedAppId)
			return { data: metrics }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
