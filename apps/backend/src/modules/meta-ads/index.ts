import { Elysia, t } from 'elysia'
import { MetaAdsService } from './service'
import { appContext } from '../../plugins'

export const metaAds = new Elysia({ prefix: '/meta-ads', tags: ['Admin'] })
	.use(appContext)
	.get(
		'/accounts',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const accs = await MetaAdsService.getAccounts(resolvedAppId)
			return { success: true, accounts: accs }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.get(
		'/campaigns',
		async ({ resolvedAppId, query, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const camps = await MetaAdsService.getCampaigns(resolvedAppId, query)
			return { success: true, campaigns: camps }
		},
		{
			query: t.Object({
				appId: t.Optional(t.String()),
				status: t.Optional(t.String()),
				search: t.Optional(t.String()),
			}),
		},
	)
	.get(
		'/insights/summary',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const summary = await MetaAdsService.getInsightsSummary(resolvedAppId)
			return { success: true, summary }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
