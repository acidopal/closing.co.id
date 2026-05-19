import { Elysia, t } from 'elysia'
import { AppCenterService } from './service'
import { AppCenterModel, AppCenterRequestModel } from './model'
import { appContext } from '../../plugins'

export const appCenter = new Elysia({ prefix: '/app-center', tags: ['Admin'] })
	.use(appContext)
	.get('/categories', async () => {
		const cats = await AppCenterService.getCategories()
		return { success: true, categories: cats }
	})
	.get(
		'/apps',
		async ({ query }) => {
			const apps = await AppCenterService.getApps(query)
			return { success: true, apps }
		},
		{
			query: t.Object({
				category: t.Optional(t.String()),
				search: t.Optional(t.String()),
			}),
		},
	)
	.get('/apps/:id', async ({ params }) => {
		const app = await AppCenterService.getAppById(params.id)
		if (!app) return { success: false, error: 'App not found' }
		return { success: true, app }
	})
	.get(
		'/installed',
		async ({ resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const apps = await AppCenterService.getInstalledApps(resolvedAppId)
			return { success: true, apps }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
		},
	)
	.post(
		'/install',
		async ({ body, resolvedAppId, set }) => {
			const targetAppId = resolvedAppId || body.appId
			if (!targetAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const inst = await AppCenterService.installApp({
				...body,
				appId: targetAppId,
			})
			return { success: true, installation: inst }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()) }),
			body: t.Object({
				pluginId: t.String(),
				appId: t.Optional(t.String()),
				config: t.Optional(t.Any()),
			}),
		},
	)
