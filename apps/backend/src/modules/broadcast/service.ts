import prisma from '../../lib/prisma'
import { outboundMessageQueue } from '../../lib/queue'
import { resolveAppId } from '../../lib/utils'

type BroadcastCreateInput = {
	title: string
	message_type?: 'text' | 'template'
	message_content?: string
	template_name?: string
	template_language?: string
	template_params?: Record<string, unknown>
	target_audience?: Record<string, unknown>
	scheduled_at?: string
}

type BroadcastJobsQuery = {
	page?: number
	limit?: number
	statuses?: string[]
}

function toObject(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
	return value as Record<string, unknown>
}

function normalizeTemplateLanguage(value: unknown): string {
	if (typeof value === 'string' && value.trim().length > 0) {
		return value
	}

	if (
		value &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		typeof (value as Record<string, unknown>).code === 'string'
	) {
		return String((value as Record<string, unknown>).code)
	}

	return 'en_US'
}

function parseSchedule(value?: string): Date | null {
	if (!value || typeof value !== 'string') return null
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? null : parsed
}

function normalizeTemplatePayload(
	data: BroadcastCreateInput,
	templateName: string,
): Record<string, unknown> {
	const rawTemplateParams = toObject(data.template_params)
	const language =
		data.template_language ||
		normalizeTemplateLanguage(rawTemplateParams.language) ||
		'en_US'

	return {
		...rawTemplateParams,
		template_name: templateName,
		language,
		components: Array.isArray(rawTemplateParams.components)
			? rawTemplateParams.components
			: [{ type: 'body', parameters: [] }],
	}
}

function toIso(value: Date | null | undefined): string | null {
	if (!value) return null
	const parsed = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(parsed.getTime())) return null
	return parsed.toISOString()
}

function normalizePhone(value: unknown): string | null {
	if (typeof value !== 'string' && typeof value !== 'number') return null
	const digits = String(value).replace(/[^\d]/g, '')
	return digits.length >= 8 ? digits : null
}

function mapStoredStatusToHistoryStatus(value: unknown): string {
	const status = String(value || '').trim().toLowerCase()
	if (!status) return 'DRAFT'
	if (status === 'sending') return 'PROCESSING'
	if (status === 'completed') return 'COMPLETED'
	if (status === 'failed') return 'FAILED'
	if (status === 'cancelled') return 'CANCELLED'
	if (status === 'scheduled') return 'SCHEDULED'
	if (status === 'draft') return 'DRAFT'
	return status.toUpperCase()
}

function isTerminalHistoryStatus(value: unknown): boolean {
	const status = String(value || '').trim().toLowerCase()
	return status === 'completed' || status === 'failed' || status === 'cancelled'
}

function normalizeStatusFilters(value: unknown): string[] {
	const rawValues = Array.isArray(value) ? value : [value]
	const normalized = new Set<string>()

	for (const rawValue of rawValues) {
		if (typeof rawValue !== 'string') continue
		const parts = rawValue
			.split(',')
			.map((part) => part.trim())
			.filter((part) => part.length > 0)

		for (const part of parts) {
			switch (part.toUpperCase()) {
				case 'COMPLETED':
					normalized.add('completed')
					break
				case 'FAILED':
					normalized.add('failed')
					break
				case 'CANCELLED':
					normalized.add('cancelled')
					break
				case 'DRAFT':
					normalized.add('draft')
					break
				case 'SCHEDULED':
					normalized.add('scheduled')
					break
				case 'PROCESSING':
				case 'PENDING':
				case 'SENDING':
					normalized.add('sending')
					break
				default:
					break
			}
		}
	}

	return Array.from(normalized)
}

function flattenCsvDataRow(value: unknown): Record<string, string> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null
	const row = value as Record<string, unknown>
	const phoneNumber =
		normalizePhone(row.phoneNumber) ||
		normalizePhone(row.phone) ||
		normalizePhone(row.to)

	if (!phoneNumber) return null

	const output: Record<string, string> = { phoneNumber }

	for (const [rawKey, rawValue] of Object.entries(row)) {
		if (
			rawKey === 'phoneNumber' ||
			rawKey === 'phone' ||
			rawKey === 'to' ||
			rawKey === 'variables' ||
			rawKey === 'contactId' ||
			rawKey === 'contactName' ||
			rawKey === 'name'
		) {
			continue
		}

		if (rawValue === null || rawValue === undefined) continue
		const stringValue = String(rawValue).trim()
		if (!stringValue) continue
		const match = rawKey.match(/^\{\{\s*(\d+)\s*\}\}$/)
		const key = match ? match[1] : rawKey
		output[key] = stringValue
	}

	if (
		row.variables &&
		typeof row.variables === 'object' &&
		!Array.isArray(row.variables)
	) {
		for (const [rawKey, rawValue] of Object.entries(
			row.variables as Record<string, unknown>,
		)) {
			if (rawValue === null || rawValue === undefined) continue
			const stringValue = String(rawValue).trim()
			if (!stringValue) continue
			const match = rawKey.match(/^\{\{\s*(\d+)\s*\}\}$/)
			const key = match ? match[1] : rawKey
			output[key] = stringValue
		}
	}

	return output
}

function normalizeHistoryResult(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null
	const row = value as Record<string, unknown>

	const phoneNumber =
		normalizePhone(row.phoneNumber) ||
		normalizePhone(row.phone) ||
		normalizePhone(row.to)
	if (!phoneNumber) return null

	const success =
		typeof row.success === 'boolean'
			? row.success
			: String(row.status || '').toUpperCase() !== 'FAILED'
	const status =
		typeof row.status === 'string' && row.status.trim().length > 0
			? row.status.toUpperCase()
			: success
				? 'PENDING'
				: 'FAILED'

	return {
		phoneNumber,
		success,
		status,
		...(typeof row.messageId === 'string' && row.messageId.trim().length > 0
			? { messageId: row.messageId }
			: {}),
		...(typeof row.error === 'string' && row.error.trim().length > 0
			? { error: row.error }
			: {}),
	}
}

function mapBroadcastSummaryRow(item: {
	id: string
	title: string
	message_content: string | null
	status: string | null
	total_recipients: number | null
	success_count: number | null
	failed_count: number | null
	created_at: Date | null
	updated_at: Date | null
}) {
	return {
		id: item.id,
		title: item.title,
		templateName: String(item.message_content || ''),
		status: mapStoredStatusToHistoryStatus(item.status),
		totalRecipients: Number(item.total_recipients || 0),
		successCount: Number(item.success_count || 0),
		failedCount: Number(item.failed_count || 0),
		deliveredCount: 0,
		readCount: 0,
		createdAt: toIso(item.created_at),
		updatedAt: toIso(item.updated_at),
		completedAt: isTerminalHistoryStatus(item.status)
			? toIso(item.updated_at)
			: null,
	}
}

export abstract class BroadcastService {
	static async getBroadcasts(appId: string) {
		const targetAppId = await resolveAppId(appId)

		if (!targetAppId) {
			return []
		}

		return prisma.broadcasts.findMany({
			where: { app_id: targetAppId, deleted_at: null },
			orderBy: { created_at: 'desc' },
		})
	}

	static async getBroadcastJobs(appId: string, query: BroadcastJobsQuery) {
		const targetAppId = await resolveAppId(appId)
		const page = Math.max(1, Number(query.page || 1) || 1)
		const limit = Math.min(100, Math.max(1, Number(query.limit || 10) || 10))

		if (!targetAppId) {
			return {
				data: [],
				pagination: {
					page,
					limit,
					total: 0,
					totalPages: 0,
				},
			}
		}

		const normalizedStatuses = normalizeStatusFilters(query.statuses)
		const where: Record<string, unknown> = {
			app_id: targetAppId,
			deleted_at: null,
		}

		if (normalizedStatuses.length > 0) {
			where.status = { in: normalizedStatuses }
		}

		const [rows, total] = await Promise.all([
			prisma.broadcasts.findMany({
				where: where as any,
				orderBy: { created_at: 'desc' },
				skip: (page - 1) * limit,
				take: limit,
				select: {
					id: true,
					title: true,
					message_content: true,
					status: true,
					total_recipients: true,
					success_count: true,
					failed_count: true,
					created_at: true,
					updated_at: true,
				},
			}),
			prisma.broadcasts.count({ where: where as any }),
		])

		return {
			data: rows.map((row) => mapBroadcastSummaryRow(row)),
			pagination: {
				page,
				limit,
				total,
				totalPages: total === 0 ? 0 : Math.ceil(total / limit),
			},
		}
	}

	static async getBroadcastById(id: string, appId: string) {
		const targetAppId = await resolveAppId(appId)

		if (!targetAppId) {
			throw new Error('Invalid App ID')
		}

		return prisma.broadcasts.findFirst({
			where: {
				id,
				app_id: targetAppId,
				deleted_at: null,
			},
		})
	}

	static async getBroadcastJobDetail(id: string, appId: string) {
		const targetAppId = await resolveAppId(appId)

		if (!targetAppId) {
			throw new Error('Invalid App ID')
		}

		const broadcast = await prisma.broadcasts.findFirst({
			where: {
				id,
				app_id: targetAppId,
				deleted_at: null,
			},
		})

		if (!broadcast) {
			throw new Error('Broadcast not found')
		}

		const targetAudience = toObject(broadcast.target_audience)
		const rawStoredResults = Array.isArray(targetAudience.results)
			? targetAudience.results
			: []
		const rawStoredCsvData = Array.isArray(targetAudience.csvData)
			? targetAudience.csvData
			: Array.isArray(targetAudience.recipients)
				? targetAudience.recipients
				: []

		const storedResults = rawStoredResults
			.map((item) => normalizeHistoryResult(item))
			.filter((item): item is Record<string, unknown> => Boolean(item))
		const csvData = rawStoredCsvData
			.map((item) => flattenCsvDataRow(item))
			.filter((item): item is Record<string, string> => Boolean(item))

		const logs = await prisma.broadcast_logs.findMany({
			where: { broadcast_id: broadcast.id },
			orderBy: { created_at: 'asc' },
			include: {
				contacts: {
					select: {
						phone_number: true,
						whatsapp_id: true,
					},
				},
			},
		})

		const fallbackResults = logs
			.map((log) => {
				const phoneNumber =
					normalizePhone(log.contacts?.phone_number) ||
					normalizePhone(log.contacts?.whatsapp_id)
				if (!phoneNumber) return null

				const success = String(log.status || '').toLowerCase() === 'sent'
				return {
					phoneNumber,
					success,
					status: success ? 'PENDING' : 'FAILED',
					...(typeof log.error_message === 'string' && log.error_message
						? { error: log.error_message }
						: {}),
				}
			})
			.filter((item): item is Record<string, unknown> => Boolean(item))

		return {
			id: broadcast.id,
			title: broadcast.title,
			userId: broadcast.account_id || null,
			templateName: String(broadcast.message_content || ''),
			status: mapStoredStatusToHistoryStatus(broadcast.status),
			totalRecipients: Number(broadcast.total_recipients || 0),
			successCount: Number(broadcast.success_count || 0),
			failedCount: Number(broadcast.failed_count || 0),
			deliveredCount: Number(targetAudience.deliveredCount || 0),
			readCount: Number(targetAudience.readCount || 0),
			csvData,
			results: storedResults.length > 0 ? storedResults : fallbackResults,
			createdAt: toIso(broadcast.created_at),
			updatedAt: toIso(broadcast.updated_at),
			completedAt: isTerminalHistoryStatus(broadcast.status)
				? toIso(broadcast.updated_at)
				: null,
		}
	}

	static async createBroadcast(appId: string, data: BroadcastCreateInput) {
		const targetAppId = await resolveAppId(appId)

		if (!targetAppId) {
			throw new Error('Invalid App ID')
		}

		const title = String(data.title || '').trim()
		const messageType = data.message_type === 'template' ? 'template' : 'text'
		const scheduleAt = parseSchedule(data.scheduled_at)
		const rawMessageContent = String(data.message_content || '').trim()
		const templateName = String(
			data.template_name || rawMessageContent || '',
		).trim()
		const messageContent =
			messageType === 'template' ? templateName : rawMessageContent

		if (!title) {
			throw new Error('Broadcast title is required')
		}

		if (!messageContent) {
			throw new Error(
				messageType === 'template'
					? 'Template name is required'
					: 'Message content is required',
			)
		}

		const status =
			scheduleAt && scheduleAt.getTime() > Date.now() ? 'scheduled' : 'draft'
		const templatePayload =
			messageType === 'template'
				? normalizeTemplatePayload(data, templateName)
				: toObject(data.template_params)

		return prisma.broadcasts.create({
			data: {
				title,
				message_type: messageType,
				message_content: messageContent,
				template_params: templatePayload as any,
				target_audience: toObject(data.target_audience) as any,
				scheduled_at: scheduleAt,
				app_id: targetAppId,
				status,
				total_recipients: 0,
				success_count: 0,
				failed_count: 0,
			},
		})
	}

	static async sendBroadcast(id: string, appId: string) {
		const targetAppId = await resolveAppId(appId)

		if (!targetAppId) {
			throw new Error('Invalid App ID')
		}

		const broadcast = await prisma.broadcasts.findFirst({
			where: { id, app_id: targetAppId, deleted_at: null },
		})

		if (!broadcast) throw new Error('Broadcast not found')
		if (broadcast.status === 'sending') {
			throw new Error('Broadcast is already being processed')
		}

		if (
			broadcast.scheduled_at &&
			new Date(broadcast.scheduled_at).getTime() > Date.now()
		) {
			await prisma.broadcasts.update({
				where: { id },
				data: { status: 'scheduled', updated_at: new Date() },
			})

			return {
				success: true,
				status: 'scheduled',
				scheduled_at: broadcast.scheduled_at,
			}
		}

		await prisma.broadcasts.update({
			where: { id },
			data: {
				status: 'sending',
				total_recipients: 0,
				success_count: 0,
				failed_count: 0,
				updated_at: new Date(),
			},
		})

		await outboundMessageQueue.add(
			'broadcast',
			{ broadcastId: id, appId: targetAppId },
			{
				removeOnComplete: 1000,
				removeOnFail: 2000,
			},
		)

		return { success: true, status: 'queued' }
	}
}
