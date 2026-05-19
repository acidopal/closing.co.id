import prisma from '../../lib/prisma'
import { getAllowedChannelTypesForUser } from '../../lib/agent-channel-access'
import { isUuid, resolveAppId } from '../../lib/utils'
import { BusinessWebhookDispatchService } from '../business-webhooks/dispatch-service'

interface ConversationFilter {
	status?: string
	inboxId?: string
	agentId?: string
	priority?: string
	page?: number
	limit?: number
	viewerUserId?: string | null
	// Advanced filters
	dateFrom?: string
	dateTo?: string
	labelIds?: string[]
	resolvedBy?: string
	aiAgentId?: string
	pipelineStageId?: string
	channelType?: string
}

export abstract class ConversationService {
	static async getConversations(
		accountId: string,
		filter: ConversationFilter = {},
	) {
		const targetAppId = await resolveAppId(accountId)
		const allowedChannelTypes = await getAllowedChannelTypesForUser({
			appId: targetAppId,
			userId: filter.viewerUserId,
		})

		const { status, inboxId, agentId, priority, page = 1, limit = 10 } = filter

		const where: any = {}
		if (targetAppId) {
			where.app_id = targetAppId
		}

		if (status) where.status = status
		if (inboxId && isUuid(inboxId)) where.inbox_id = inboxId
		if (agentId && isUuid(agentId)) where.assignee_id = agentId
		if (priority) where.priority = priority

		// Advanced filters
		if (filter.dateFrom || filter.dateTo) {
			where.created_at = {}
			if (filter.dateFrom) where.created_at.gte = new Date(filter.dateFrom)
			if (filter.dateTo) where.created_at.lte = new Date(filter.dateTo)
		}
		if (filter.labelIds?.length) {
			where.conversation_labels = {
				some: { label_id: { in: filter.labelIds } },
			}
		}
		if (filter.resolvedBy && isUuid(filter.resolvedBy)) {
			where.assignee_id = filter.resolvedBy
			where.status = 'resolved'
		}
		if (filter.aiAgentId && isUuid(filter.aiAgentId)) {
			where.inboxes = { chatbot_id: filter.aiAgentId }
		}
		if (filter.pipelineStageId && isUuid(filter.pipelineStageId)) {
			where.stage_id = filter.pipelineStageId
		}
		if (allowedChannelTypes?.length) {
			if (filter.channelType) {
				if (!allowedChannelTypes.includes(filter.channelType)) {
					return { data: [], total: 0, page, limit }
				}
				where.channel_type = filter.channelType
			} else {
				where.channel_type = { in: allowedChannelTypes }
			}
		} else if (filter.channelType) {
			where.channel_type = filter.channelType
		}

		const [conversations, total] = await Promise.all([
			prisma.conversations.findMany({
				where,
				include: {
					contacts: {
						select: {
							id: true,
							name: true,
							phone_number: true,
							whatsapp_id: true,
							email: true,
							avatar_url: true,
							identifier: true,
							window_expires_at: true,
							meta: true,
							metadata: true,
							instagram_igsid: true,
						},
					},
					inboxes: {
						select: {
							id: true,
							name: true,
							channel_type: true,
						},
					},
					messages: {
						orderBy: { created_at: 'desc' },
						take: 1,
						select: {
							id: true,
							content: true,
							message_type: true,
							content_type: true,
							sender_type: true,
							sender_id: true,
							status: true,
							metadata: true,
							content_attributes: true,
							additional_attributes: true,
							extras: true,
							created_at: true,
						},
					},
				},
				orderBy: { last_message_at: 'desc' },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prisma.conversations.count({ where }),
		])

		return { data: conversations, total, page, limit }
	}

	static async getConversationById(
		id: string,
		accountId?: string | null,
		viewerUserId?: string | null,
	) {
		if (!isUuid(id)) return null
		const targetAppId = accountId ? await resolveAppId(accountId) : null
		const allowedChannelTypes = await getAllowedChannelTypesForUser({
			appId: targetAppId,
			userId: viewerUserId,
		})

		return prisma.conversations.findFirst({
			where: {
				id,
				...(targetAppId ? { app_id: targetAppId } : {}),
				...(allowedChannelTypes?.length
					? { channel_type: { in: allowedChannelTypes } }
					: {}),
			},
			include: {
					contacts: {
						select: {
							id: true,
							name: true,
							phone_number: true,
							whatsapp_id: true,
							email: true,
							avatar_url: true,
							identifier: true,
							window_expires_at: true,
							meta: true,
							metadata: true,
							instagram_igsid: true,
						},
					},
				inboxes: {
					select: {
						id: true,
						name: true,
						channel_type: true,
					},
				},
				conversation_labels: {
					include: {
						labels: true,
					},
				},
			},
		})
	}

	static async updateStatus(id: string, status: string) {
		if (!isUuid(id)) return null

		const conv = await prisma.conversations.update({
			where: { id },
			data: {
				status,
				resolved_at: status === 'resolved' ? new Date() : null,
				updated_at: new Date(),
			},
		})

		const { app } = await import('../../index')
		const io = (app as any).io as any
		if (io) {
			const event =
				status === 'resolved'
					? 'conversation:resolved'
					: 'conversation:status_changed'
			io.to(`app:${conv.app_id}`).emit(event, { conversationId: id, status })
			io.to(`conversation:${id}`).emit(event, { conversationId: id, status })
		}

		return conv
	}

	static async assignAgent(
		id: string,
		agentId: string,
		assignmentType: 'manual' | 'takeover' = 'manual',
	) {
		if (!isUuid(id) || !isUuid(agentId)) return null

		const conversation = await prisma.conversations.findUnique({
			where: { id },
			select: { assignee_id: true, app_id: true },
		})

		if (conversation?.assignee_id !== agentId) {
			await prisma.assignment_history.create({
				data: {
					conversation_id: id,
					assigned_from: conversation?.assignee_id,
					assigned_to: agentId,
					assignment_type: assignmentType,
				},
			})

			await prisma.conversation_activity_log.create({
				data: {
					conversation_id: id,
					action: 'assigned',
					metadata: {
						assigned_from: conversation?.assignee_id,
						assigned_to: agentId,
					},
				},
			})
		}

		await prisma.conversation_agents.updateMany({
			where: {
				conversation_id: id,
				is_primary: true,
				agent_id: { not: agentId },
			},
			data: { is_primary: false },
		})

		const existingAgent = await prisma.conversation_agents.findFirst({
			where: {
				conversation_id: id,
				agent_id: agentId,
			},
		})

		if (existingAgent) {
			await prisma.conversation_agents.update({
				where: { id: existingAgent.id },
				data: {
					status: 'active',
					is_primary: true,
					removed_at: null,
				},
			})
		} else {
			await prisma.conversation_agents.create({
				data: {
					conversation_id: id,
					agent_id: agentId,
					is_primary: true,
					status: 'active',
					assigned_at: new Date(),
				},
			})
		}

		const updatedConv = await prisma.conversations.update({
			where: { id },
			data: {
				assignee_id: agentId,
				updated_at: new Date(),
			},
		})

		const { app } = await import('../../index')
		const io = (app as any).io as any
		if (io && conversation) {
			io.to(`app:${conversation.app_id}`).emit('conversation:assigned', {
				conversationId: id,
				agentId: agentId,
			})
			io.to(`conversation:${id}`).emit('conversation:assigned', {
				conversationId: id,
				agentId: agentId,
			})
		}

		if (conversation?.app_id && conversation.assignee_id !== agentId) {
			void BusinessWebhookDispatchService.dispatch({
				event: 'conversation.handled_by_updated',
				appId: conversation.app_id,
				inboxId: updatedConv.inbox_id,
				payload: {
					conversation_id: id,
					previous_assignee_id: conversation.assignee_id || null,
					current_assignee_id: agentId,
					assignment_type: assignmentType,
				},
			})
		}

		return updatedConv
	}

	static async markAsRead(id: string) {
		if (!isUuid(id)) return null

		const conv = await prisma.conversations.update({
			where: { id },
			data: {
				unread_count: 0,
				updated_at: new Date(),
			},
		})

		const { app } = await import('../../index')
		const io = (app as any).io as any
		if (io) {
			io.to(`app:${conv.app_id}`).emit('conversation:read', {
				conversationId: id,
			})
			io.to(`conversation:${id}`).emit('conversation:read', {
				conversationId: id,
			})
		}

		return conv
	}

	static async getStatusCounts(accountId: string, viewerUserId?: string | null) {
		const targetAppId = await resolveAppId(accountId)
		const allowedChannelTypes = await getAllowedChannelTypesForUser({
			appId: targetAppId,
			userId: viewerUserId,
		})
		const where: any = {}
		if (targetAppId) where.app_id = targetAppId
		if (allowedChannelTypes?.length) {
			where.channel_type = { in: allowedChannelTypes }
		}

		const all = await prisma.conversations.count({ where })
		const resolved = await prisma.conversations.count({
			where: { ...where, status: 'resolved' },
		})
		const served = await prisma.conversations.count({
			where: {
				...where,
				status: { not: 'resolved' },
				assignee_id: { not: null },
			},
		})
		const unserved = await prisma.conversations.count({
			where: {
				...where,
				status: { not: 'resolved' },
				assignee_id: null,
			},
		})

		return { all, unserved, served, resolved }
	}

	static async getConversationMessages(
		conversationId: string,
		limit = 50,
		before?: string,
		accountId?: string | null,
		viewerUserId?: string | null,
	) {
		if (!isUuid(conversationId)) return []
		const targetAppId = accountId ? await resolveAppId(accountId) : null
		const allowedChannelTypes = await getAllowedChannelTypesForUser({
			appId: targetAppId,
			userId: viewerUserId,
		})

		if (targetAppId || allowedChannelTypes?.length) {
			const conversation = await prisma.conversations.findFirst({
				where: {
					id: conversationId,
					...(targetAppId ? { app_id: targetAppId } : {}),
					...(allowedChannelTypes?.length
						? { channel_type: { in: allowedChannelTypes } }
						: {}),
				},
				select: { id: true },
			})

			if (!conversation) return []
		}

		const where: any = {
			conversation_id: conversationId,
			deleted_at: null,
			OR: [{ is_deleted: false }, { is_deleted: null }],
		}
		if (before) {
			where.created_at = { lt: new Date(before) }
		}

		return prisma.messages.findMany({
			where,
			orderBy: { created_at: 'desc' },
			take: limit,
		})
	}
}
