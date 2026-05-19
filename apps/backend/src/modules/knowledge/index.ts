import { Elysia, t } from 'elysia'
import { KnowledgeService } from './service'
import { KnowledgeModel, KnowledgeRequestModel } from './model'
import { appContext } from '../../plugins'

export const knowledge = new Elysia({
	prefix: '/knowledge',
	tags: ['Knowledge'],
})
	.use(appContext)
	// Categories
	.get(
		'/categories',
		async ({ resolvedAppId, query, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const cats = await KnowledgeService.getCategories(
				resolvedAppId,
				query.chatbotId || '',
			)
			return { success: true, payload: cats }
		},
		{
			query: t.Object({
				appId: t.Optional(t.String()),
				chatbotId: t.Optional(t.String()),
			}),
		},
	)
	.post(
		'/categories',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const cat = await KnowledgeService.createCategory(resolvedAppId, body)
			return { data: cat }
		},
		{
			body: KnowledgeRequestModel.createCategory,
		},
	)
	.delete(
		'/categories/:id',
		async ({ params, resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			await KnowledgeService.deleteCategory(params.id, resolvedAppId)
			return { success: true }
		},
		{
			params: t.Object({ id: t.String() }),
		},
	)

	// Sources (Mapped from FAQs for now or create service for it)
	.get(
		'/sources',
		async ({ resolvedAppId, query, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const faqs = await KnowledgeService.getFAQs(
				resolvedAppId,
				query.chatbotId || '',
				{
					category_id: query.categoryId,
					search: query.q,
				},
			)
			return { success: true, payload: faqs }
		},
		{
			query: t.Object({
				appId: t.Optional(t.String()),
				chatbotId: t.Optional(t.String()),
				categoryId: t.Optional(t.String()),
				q: t.Optional(t.String()),
			}),
		},
	)

	// FAQs
	.get(
		'/faqs',
		async ({ resolvedAppId, query, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const faqs = await KnowledgeService.getFAQs(
				resolvedAppId,
				query.chatbotId,
				{
					category_id: query.categoryId,
					search: query.q,
				},
			)
			return { success: true, payload: faqs }
		},
		{
			query: t.Object({
				appId: t.Optional(t.String()),
				chatbotId: t.String(),
				categoryId: t.Optional(t.String()),
				q: t.Optional(t.String()),
			}),
		},
	)
	.post(
		'/faqs',
		async ({ resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const faq = await KnowledgeService.createFAQ(resolvedAppId, body)
			return { data: faq }
		},
		{
			body: KnowledgeRequestModel.createFAQ,
		},
	)
	.patch(
		'/faqs/:id',
		async ({ params, resolvedAppId, body, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const faq = await KnowledgeService.updateFAQ(
				params.id,
				resolvedAppId,
				body,
			)
			return { data: faq }
		},
		{
			params: t.Object({ id: t.String() }),
			body: KnowledgeRequestModel.updateFAQ,
		},
	)
	.delete(
		'/faqs/:id',
		async ({ params, resolvedAppId, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			await KnowledgeService.deleteFAQ(params.id, resolvedAppId)
			return { success: true }
		},
		{
			params: t.Object({ id: t.String() }),
		},
	)

	// Stats
	.get(
		'/stats',
		async ({ resolvedAppId, query, set }) => {
			if (!resolvedAppId) {
				set.status = 400
				return { error: 'App ID required' }
			}
			const stats = await KnowledgeService.getStats(
				resolvedAppId,
				query.chatbotId,
			)
			return { success: true, payload: stats }
		},
		{
			query: t.Object({ appId: t.Optional(t.String()), chatbotId: t.String() }),
		},
	)
