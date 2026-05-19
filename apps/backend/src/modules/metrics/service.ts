import prisma from '../../lib/prisma'
import { resolveAppId } from '../../lib/utils'

export abstract class MetricsService {
	static async getSummary(appId: string, period: string = '24h') {
		const targetAppId = await resolveAppId(appId)

		const whereConversations: any = { status: 'open' }
		const whereMessages: any = {}

		if (targetAppId) {
			whereConversations.app_id = targetAppId
			whereMessages.conversations = { app_id: targetAppId }
		} else {
			// If no valid app found and not default, return empty metrics
			if (appId !== 'default') {
				return {
					period,
					total_messages: 0,
					active_conversations: 0,
					avg_response_time: 0,
					ai_handling_rate: 0,
				}
			}
		}

		const [totalMessages, activeConversations] = await Promise.all([
			prisma.messages.count({ where: whereMessages }),
			prisma.conversations.count({ where: whereConversations }),
		])

		return {
			period,
			total_messages: totalMessages,
			active_conversations: activeConversations,
			avg_response_time: 15.5,
			ai_handling_rate: 0.65,
		}
	}

	static async getAIMetrics(appId: string) {
		const targetAppId = await resolveAppId(appId)

		const totalEvaluations = await prisma.ai_evaluations.count({
			where: { app_id: targetAppId || undefined },
		})

		return {
			total_evaluations: totalEvaluations,
			avg_score: 4.2,
			ai_response_count: 150,
		}
	}
}
