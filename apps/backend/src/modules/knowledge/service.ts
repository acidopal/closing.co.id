import prisma from '../../lib/prisma'
import { resolveAppId } from '../../lib/utils'
import { KnowledgeIndexService } from './indexing-service'

export abstract class KnowledgeService {
	// Categories
	static async getCategories(appId: string, chatbotId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.knowledge_categories.findMany({
			where: {
				app_id: targetAppId || undefined,
				chatbot_id: chatbotId || undefined,
			},
			orderBy: [{ position: 'asc' }, { name: 'asc' }],
		})
	}

	static async createCategory(appId: string, data: any) {
		const targetAppId = await resolveAppId(appId)
		return prisma.knowledge_categories.create({
			data: {
				...data,
				app_id: targetAppId || appId,
			},
		})
	}

	static async deleteCategory(id: string, appId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.knowledge_categories.delete({
			where: { id, app_id: targetAppId || undefined },
		})
	}

	// FAQs
	static async getFAQs(appId: string, chatbotId: string, filter: any = {}) {
		const targetAppId = await resolveAppId(appId)
		return prisma.knowledge_faqs.findMany({
			where: {
				app_id: targetAppId || undefined,
				chatbot_id: chatbotId || undefined,
				is_active: true,
				category_id: filter.category_id || undefined,
				OR: filter.search
					? [
							{ question: { contains: filter.search, mode: 'insensitive' } },
							{ answer: { contains: filter.search, mode: 'insensitive' } },
						]
					: undefined,
			},
			orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
		})
	}

	static async createFAQ(appId: string, data: any) {
		const targetAppId = await resolveAppId(appId)
		const created = await prisma.knowledge_faqs.create({
			data: {
				...data,
				app_id: targetAppId || appId,
			},
		})

		const appIdForEvent = targetAppId || appId
		if (created?.id && created.chatbot_id && appIdForEvent) {
			void KnowledgeIndexService.enqueueKnowledgeChangeEvent({
				action: 'create',
				entity: 'faq',
				app_id: appIdForEvent,
				chatbot_id: created.chatbot_id,
				knowledge_id: created.id,
				timestamp: new Date().toISOString(),
			}).catch((error) => {
				console.error(
					'[KnowledgeService] Failed enqueue knowledge_change_events for faq create',
					error,
				)
			})
		}

		return created
	}

	static async updateFAQ(id: string, appId: string, data: any) {
		const targetAppId = await resolveAppId(appId)
		const updated = await prisma.knowledge_faqs.update({
			where: { id, app_id: targetAppId || undefined },
			data: {
				...data,
				updated_at: new Date(),
			},
		})

		const appIdForEvent = targetAppId || appId
		if (updated?.id && updated.chatbot_id && appIdForEvent) {
			void KnowledgeIndexService.enqueueKnowledgeChangeEvent({
				action: 'update',
				entity: 'faq',
				app_id: appIdForEvent,
				chatbot_id: updated.chatbot_id,
				knowledge_id: updated.id,
				timestamp: new Date().toISOString(),
			}).catch((error) => {
				console.error(
					'[KnowledgeService] Failed enqueue knowledge_change_events for faq update',
					error,
				)
			})
		}

		return updated
	}

	static async deleteFAQ(id: string, appId: string) {
		const targetAppId = await resolveAppId(appId)
		const deleted = await prisma.knowledge_faqs.update({
			where: { id, app_id: targetAppId || undefined },
			data: {
				is_active: false,
				updated_at: new Date(),
			},
		})

		const appIdForEvent = targetAppId || appId
		if (deleted?.id && deleted.chatbot_id && appIdForEvent) {
			void KnowledgeIndexService.enqueueKnowledgeChangeEvent({
				action: 'delete',
				entity: 'faq',
				app_id: appIdForEvent,
				chatbot_id: deleted.chatbot_id,
				knowledge_id: deleted.id,
				timestamp: new Date().toISOString(),
			}).catch((error) => {
				console.error(
					'[KnowledgeService] Failed enqueue knowledge_change_events for faq delete',
					error,
				)
			})
		}

		return deleted
	}

	// Stats
	static async getStats(appId: string, chatbotId: string) {
		const targetAppId = await resolveAppId(appId)
		const [sourcesCount, faqsCount, categoriesCount] = await Promise.all([
			prisma.knowledge_sources.count({
				where: {
					app_id: targetAppId || undefined,
					chatbot_id: chatbotId || undefined,
					is_active: true,
				},
			}),
			prisma.knowledge_faqs.count({
				where: {
					app_id: targetAppId || undefined,
					chatbot_id: chatbotId || undefined,
					is_active: true,
				},
			}),
			prisma.knowledge_categories.count({
				where: {
					app_id: targetAppId || undefined,
					chatbot_id: chatbotId || undefined,
				},
			}),
		])

		return {
			sources_count: sourcesCount,
			faqs_count: faqsCount,
			categories_count: categoriesCount,
		}
	}
}
