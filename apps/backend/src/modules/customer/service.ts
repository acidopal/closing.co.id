import prisma from '../../lib/prisma'
import { Prisma } from '../../generated/prisma'
import { isUuid, resolveAppId } from '../../lib/utils'
import { BusinessWebhookDispatchService } from '../business-webhooks/dispatch-service'

type CustomerTag = {
	id: string
	name: string
	color: string
}

type CustomerDTO = {
	id: string
	name: string
	email: string | null
	phone_number: string | null
	avatar_url: string | null
	source: string | null
	created_at: Date | null
	last_contact_at: Date | null
	pipeline_stage_id: string | null
	pipeline_stage_name: string | null
	pipeline_stage_color: string | null
	is_window_active: boolean
	message_count: number
	notes: string | null
	lead_score: number
	consent_status: string | null
	custom_attributes: Record<string, unknown>
	tags: CustomerTag[]
}

type CustomerStatsDTO = {
	total: number
	consented: number
	active_window: number
	blacklisted: number
}

type CustomerSortField =
	| 'name'
	| 'contact'
	| 'stage'
	| 'tags'
	| 'window'
	| 'messages'
	| 'last_contact'
	| 'created_at'

type CustomerSortOrder = 'asc' | 'desc'

type SortedCustomerRow = {
	id: string
	message_count: number | bigint
	last_contact_at: Date | string | null
}

const CUSTOMER_SORT_SQL: Record<CustomerSortField, Prisma.Sql> = {
	name: Prisma.sql`LOWER(COALESCE(c.name, ''))`,
	contact: Prisma.sql`LOWER(COALESCE(NULLIF(c.phone_number, ''), NULLIF(c.email, ''), ''))`,
	stage: Prisma.sql`LOWER(COALESCE(c.custom_attributes->>'pipeline_stage_name', ''))`,
	tags: Prisma.sql`COALESCE(tag_stats.tag_count, 0)`,
	window: Prisma.sql`CASE WHEN c.window_expires_at IS NOT NULL AND c.window_expires_at > NOW() THEN 1 ELSE 0 END`,
	messages: Prisma.sql`COALESCE(conv_stats.message_count, 0)`,
	last_contact: Prisma.sql`COALESCE(conv_stats.last_contact_at, c.last_message_at, c.created_at)`,
	created_at: Prisma.sql`COALESCE(c.created_at, NOW())`,
}

function parseJsonObject(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
	return value as Record<string, unknown>
}

function toNumber(value: unknown, fallback = 0): number {
	const num = Number(value)
	return Number.isFinite(num) ? num : fallback
}

function toDateOrNull(value: unknown): Date | null {
	if (value instanceof Date && !Number.isNaN(value.getTime())) return value
	if (typeof value === 'string' || typeof value === 'number') {
		const parsed = new Date(value)
		if (!Number.isNaN(parsed.getTime())) return parsed
	}
	return null
}

function resolveSortField(value?: string): CustomerSortField {
	const normalized = (value || '').trim().toLowerCase()
	if (normalized in CUSTOMER_SORT_SQL) return normalized as CustomerSortField
	return 'created_at'
}

function resolveSortOrder(value?: string): CustomerSortOrder {
	return value?.toLowerCase() === 'asc' ? 'asc' : 'desc'
}

function normalizeSearch(value?: string): string | undefined {
	const normalized = value?.trim()
	if (!normalized) return undefined

	const lowered = normalized.toLowerCase()
	if (lowered === 'undefined' || lowered === 'null') return undefined

	return normalized
}

function mapContactToCustomer(
	contact: {
		id: string
		name: string | null
		email: string | null
		phone_number: string | null
		avatar_url: string | null
		source: string | null
		channel_type: string | null
		created_at: Date | null
		window_expires_at: Date | null
		consent_status: string | null
		custom_attributes: unknown
	},
	messageCount: number,
	lastContactAt: Date | null,
	tags: CustomerTag[],
	stageMap?: Map<string, { name: string; color: string | null }>,
): CustomerDTO {
	const customAttributes = parseJsonObject(contact.custom_attributes)
	const stageId =
		typeof customAttributes.pipeline_stage_id === 'string'
			? customAttributes.pipeline_stage_id
			: null
	const stageMeta = stageId && stageMap ? stageMap.get(stageId) : undefined

	return {
		id: contact.id,
		name: contact.name || 'Unknown',
		email: contact.email,
		phone_number: contact.phone_number,
		avatar_url: contact.avatar_url,
		source: contact.source || contact.channel_type || 'direct',
		created_at: contact.created_at,
		last_contact_at: lastContactAt,
		pipeline_stage_id: stageId,
		pipeline_stage_name:
			stageMeta?.name ||
			(typeof customAttributes.pipeline_stage_name === 'string'
				? customAttributes.pipeline_stage_name
				: null),
		pipeline_stage_color:
			stageMeta?.color ||
			(typeof customAttributes.pipeline_stage_color === 'string'
				? customAttributes.pipeline_stage_color
				: null),
		is_window_active:
			contact.window_expires_at instanceof Date
				? contact.window_expires_at.getTime() > Date.now()
				: false,
		message_count: messageCount,
		notes:
			typeof customAttributes.notes === 'string'
				? customAttributes.notes
				: null,
		lead_score: toNumber(customAttributes.lead_score, 0),
		consent_status: contact.consent_status,
		custom_attributes: customAttributes,
		tags,
	}
}

// biome-ignore lint/complexity/noStaticOnlyClass: This service module intentionally uses static methods.
export abstract class CustomerService {
	static async getCustomerStats(params: {
		appId: string
	}): Promise<CustomerStatsDTO> {
		const targetAppId = await resolveAppId(params.appId)
		if (!targetAppId) {
			return {
				total: 0,
				consented: 0,
				active_window: 0,
				blacklisted: 0,
			}
		}

		const statsResult = await prisma.$queryRaw<
			{
				total: number | bigint
				consented: number | bigint
				active_window: number | bigint
				blacklisted: number | bigint
			}[]
		>(Prisma.sql`
			SELECT
				COUNT(*)::bigint AS total,
				COUNT(*) FILTER (
					WHERE LOWER(COALESCE(c.consent_status, '')) IN (
						'granted',
						'consented',
						'consent_given',
						'opted_in',
						'opt_in',
						'approved'
					)
				)::bigint AS consented,
				COUNT(*) FILTER (
					WHERE c.window_expires_at IS NOT NULL
						AND c.window_expires_at > NOW()
				)::bigint AS active_window,
				COUNT(*) FILTER (
					WHERE
						LOWER(COALESCE(c.consent_status, '')) IN (
							'blacklisted',
							'blocked',
							'revoked',
							'opted_out',
							'opt_out',
							'unsubscribed'
						)
						OR LOWER(COALESCE(c.additional_attributes->>'is_blacklisted', 'false')) IN ('true', '1', 'yes')
						OR LOWER(COALESCE(c.custom_attributes->>'is_blacklisted', 'false')) IN ('true', '1', 'yes')
				)::bigint AS blacklisted
			FROM contacts c
			WHERE
				(c.account_id = ${targetAppId}::uuid OR c.app_id = ${targetAppId}::uuid)
				AND c.deleted_at IS NULL
		`)

		const row = statsResult[0]

		return {
			total: toNumber(row?.total, 0),
			consented: toNumber(row?.consented, 0),
			active_window: toNumber(row?.active_window, 0),
			blacklisted: toNumber(row?.blacklisted, 0),
		}
	}

	static async listCustomers(params: {
		appId: string
		search?: string
		page?: number
		perPage?: number
		sort?: string
		order?: string
	}) {
		const targetAppId = await resolveAppId(params.appId)
		if (!targetAppId)
			return { payload: [], meta: { page: 1, per_page: 0, total: 0 } }

		const page = Math.max(1, params.page || 1)
		const perPage = Math.min(100, Math.max(1, params.perPage || 20))

		const sortField = resolveSortField(params.sort)
		const sortOrder = resolveSortOrder(params.order)
		const sortSql = CUSTOMER_SORT_SQL[sortField]
		const sortDirectionSql =
			sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`
		const search = normalizeSearch(params.search)

		const whereParts: Prisma.Sql[] = [
			Prisma.sql`(c.account_id = ${targetAppId}::uuid OR c.app_id = ${targetAppId}::uuid)`,
			Prisma.sql`c.deleted_at IS NULL`,
		]

		if (search) {
			const pattern = `%${search}%`
			whereParts.push(
				Prisma.sql`(
					c.name ILIKE ${pattern}
					OR c.email ILIKE ${pattern}
					OR c.phone_number ILIKE ${pattern}
				)`,
			)
		}

		const whereClause = Prisma.sql`${Prisma.join(whereParts, ' AND ')}`

		const totalResult = await prisma.$queryRaw<{ total: number | bigint }[]>(
			Prisma.sql`
				SELECT COUNT(*)::bigint AS total
				FROM contacts c
				WHERE ${whereClause}
			`,
		)
		const total = toNumber(totalResult[0]?.total, 0)

		const sortedRows = await prisma.$queryRaw<SortedCustomerRow[]>(
			Prisma.sql`
				SELECT
					c.id,
					COALESCE(conv_stats.message_count, 0)::int AS message_count,
					COALESCE(conv_stats.last_contact_at, c.last_message_at) AS last_contact_at
				FROM contacts c
				LEFT JOIN (
					SELECT
						conv.contact_id,
						COUNT(m.id)::int AS message_count,
						MAX(conv.last_message_at) AS last_contact_at
					FROM conversations conv
					LEFT JOIN messages m ON m.conversation_id = conv.id
					WHERE conv.contact_id IS NOT NULL
					GROUP BY conv.contact_id
				) AS conv_stats ON conv_stats.contact_id = c.id
				LEFT JOIN (
					SELECT
						cta.contact_id,
						COUNT(*)::int AS tag_count
					FROM contact_tag_assignments cta
					GROUP BY cta.contact_id
				) AS tag_stats ON tag_stats.contact_id = c.id
				WHERE ${whereClause}
				ORDER BY ${sortSql} ${sortDirectionSql} NULLS LAST, c.id ASC
				OFFSET ${(page - 1) * perPage}
				LIMIT ${perPage}
			`,
		)

		const contactIds = sortedRows.map((row) => row.id)
		if (contactIds.length === 0) {
			return {
				payload: [],
				meta: { page, per_page: perPage, total },
			}
		}

		const [contacts, tagAssignments] = await Promise.all([
			prisma.contacts.findMany({
				where: {
					id: { in: contactIds },
					deleted_at: null,
				},
				select: {
					id: true,
					name: true,
					email: true,
					phone_number: true,
					avatar_url: true,
					source: true,
					channel_type: true,
					created_at: true,
					window_expires_at: true,
					consent_status: true,
					custom_attributes: true,
				},
			}),
			prisma.contact_tag_assignments.findMany({
				where: { contact_id: { in: contactIds } },
				select: {
					contact_id: true,
					contact_tags: {
						select: { id: true, name: true, color: true },
					},
				},
			}),
		])

		const stageIds = Array.from(
			new Set(
				contacts
					.map((contact) => parseJsonObject(contact.custom_attributes).pipeline_stage_id)
					.filter((value): value is string => typeof value === 'string'),
			),
		)

		const stageRows =
			stageIds.length > 0
				? await prisma.pipeline_stages.findMany({
						where: { id: { in: stageIds } },
						select: { id: true, name: true, color: true },
					})
				: []
		const stageMap = new Map(
			stageRows.map((stage) => [stage.id, { name: stage.name, color: stage.color }]),
		)

		const contactsById = new Map(
			contacts.map((contact) => [contact.id, contact]),
		)
		const messageCountByContactId = new Map<string, number>()
		const lastContactAtByContactId = new Map<string, Date>()
		for (const row of sortedRows) {
			messageCountByContactId.set(row.id, toNumber(row.message_count, 0))
			const lastContactAt = toDateOrNull(row.last_contact_at)
			if (lastContactAt) {
				lastContactAtByContactId.set(row.id, lastContactAt)
			}
		}

		const tagsByContactId = new Map<string, CustomerTag[]>()
		for (const assignment of tagAssignments) {
			const existing = tagsByContactId.get(assignment.contact_id) || []
			existing.push({
				id: assignment.contact_tags.id,
				name: assignment.contact_tags.name,
				color: assignment.contact_tags.color || '#3B82F6',
			})
			tagsByContactId.set(assignment.contact_id, existing)
		}

		const payload = contactIds.flatMap((contactId) => {
			const contact = contactsById.get(contactId)
			if (!contact) return []

			return [
				mapContactToCustomer(
					contact,
					messageCountByContactId.get(contact.id) || 0,
					lastContactAtByContactId.get(contact.id) || null,
					tagsByContactId.get(contact.id) || [],
					stageMap,
				),
			]
		})

		return {
			payload,
			meta: { page, per_page: perPage, total },
		}
	}

	static async getCustomerById(id: string) {
		if (!isUuid(id)) return null

		const contact = await prisma.contacts.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				email: true,
				phone_number: true,
				avatar_url: true,
				source: true,
				channel_type: true,
				created_at: true,
				window_expires_at: true,
				consent_status: true,
				custom_attributes: true,
			},
		})
		if (!contact) return null

		const stageId =
			typeof parseJsonObject(contact.custom_attributes).pipeline_stage_id === 'string'
				? (parseJsonObject(contact.custom_attributes).pipeline_stage_id as string)
				: null
		const stageMeta =
			stageId &&
			(await prisma.pipeline_stages.findUnique({
				where: { id: stageId },
				select: { id: true, name: true, color: true },
			}))
		const stageMap = new Map<string, { name: string; color: string | null }>()
		if (stageMeta) {
			stageMap.set(stageMeta.id, {
				name: stageMeta.name,
				color: stageMeta.color,
			})
		}

		const [conversations, tagAssignments] = await Promise.all([
			prisma.conversations.findMany({
				where: { contact_id: id },
				select: { id: true, last_message_at: true },
			}),
			prisma.contact_tag_assignments.findMany({
				where: { contact_id: id },
				select: {
					contact_tags: { select: { id: true, name: true, color: true } },
				},
			}),
		])

		const conversationIds = conversations.map((c) => c.id)
		const messageCount =
			conversationIds.length > 0
				? await prisma.messages.count({
						where: { conversation_id: { in: conversationIds } },
					})
				: 0

		const lastContactAt = conversations.reduce<Date | null>((latest, conv) => {
			if (!(conv.last_message_at instanceof Date)) return latest
			if (!latest || conv.last_message_at.getTime() > latest.getTime()) {
				return conv.last_message_at
			}
			return latest
		}, null)

		const tags = tagAssignments.map((assignment) => ({
			id: assignment.contact_tags.id,
			name: assignment.contact_tags.name,
			color: assignment.contact_tags.color || '#3B82F6',
		}))

		return mapContactToCustomer(
			contact,
			messageCount,
			lastContactAt,
			tags,
			stageMap,
		)
	}

	static async updateCustomer(
		id: string,
		data: {
			name?: string
			email?: string
			phone_number?: string
			notes?: string
			lead_score?: number
			pipeline_stage_id?: string
			consent_status?: string
			consent_purpose?: string
			consent_source?: string
			custom_attributes?: Record<string, unknown>
		},
	) {
		if (!isUuid(id)) return null

		const existing = await prisma.contacts.findUnique({
			where: { id },
			select: {
				custom_attributes: true,
				app_id: true,
				account_id: true,
			},
		})
		if (!existing) return null

		const existingCustom = parseJsonObject(existing.custom_attributes)
		const dynamicCustom = parseJsonObject(data.custom_attributes)
		let stagePayload: {
			pipeline_stage_id?: string | null
			pipeline_stage_name?: string | null
			pipeline_stage_color?: string | null
		} = {}

		if (data.pipeline_stage_id !== undefined) {
			if (!data.pipeline_stage_id) {
				stagePayload = {
					pipeline_stage_id: null,
					pipeline_stage_name: null,
					pipeline_stage_color: null,
				}
			} else {
				const appId = existing.app_id || existing.account_id
				if (!appId) {
					throw new Error('App ID not found for this customer')
				}
				const stage = await prisma.pipeline_stages.findFirst({
					where: {
						id: data.pipeline_stage_id,
						pipelines: {
							app_id: appId,
							pipeline_type: 'contact',
						},
					},
					select: {
						id: true,
						name: true,
						color: true,
					},
				})
				if (!stage) {
					throw new Error('Invalid contact stage')
				}
				stagePayload = {
					pipeline_stage_id: stage.id,
					pipeline_stage_name: stage.name,
					pipeline_stage_color: stage.color || '#3B82F6',
				}
			}
		}

		const mergedCustom = {
			...existingCustom,
			...dynamicCustom,
			...(data.notes !== undefined ? { notes: data.notes } : {}),
			...(data.lead_score !== undefined ? { lead_score: data.lead_score } : {}),
			...stagePayload,
			...(data.consent_purpose !== undefined
				? { consent_purpose: data.consent_purpose }
				: {}),
			...(data.consent_source !== undefined
				? { consent_source: data.consent_source }
				: {}),
		}

		const updatedContact = await prisma.contacts.update({
			where: { id },
			data: {
				...(data.name !== undefined ? { name: data.name } : {}),
				...(data.email !== undefined ? { email: data.email } : {}),
				...(data.phone_number !== undefined
					? { phone_number: data.phone_number }
					: {}),
				...(data.consent_status !== undefined
					? { consent_status: data.consent_status }
					: {}),
				custom_attributes: mergedCustom,
				updated_at: new Date(),
			},
		})
		const payload = await CustomerService.getCustomerById(id)

		const effectiveAppId = existing.app_id || existing.account_id || null
		if (effectiveAppId) {
			void BusinessWebhookDispatchService.dispatch({
				event: 'contact.updated',
				appId: effectiveAppId,
				payload: {
					source: 'customers.update',
					contact: {
						id: updatedContact.id,
						name: updatedContact.name,
						email: updatedContact.email,
						phone_number: updatedContact.phone_number,
						updated_at: updatedContact.updated_at,
						custom_attributes: updatedContact.custom_attributes,
					},
					customer: payload,
				},
			})
		}

		return payload
	}

	static async addTagToCustomer(
		customerId: string,
		appId: string,
		input: { tag_id?: string; tag_name?: string },
	) {
		if (!isUuid(customerId)) return null

		const targetAppId = await resolveAppId(appId)
		if (!targetAppId) return null

		let tagId = input.tag_id
		if (!tagId && input.tag_name?.trim()) {
			const tagName = input.tag_name.trim()
			const tag = await prisma.contact_tags.upsert({
				where: {
					app_id_name: {
						app_id: targetAppId,
						name: tagName,
					},
				},
				update: {},
				create: {
					app_id: targetAppId,
					name: tagName,
					color: '#3B82F6',
				},
				select: { id: true },
			})
			tagId = tag.id
		}

		if (!tagId || !isUuid(tagId)) return null

		await prisma.contact_tag_assignments.upsert({
			where: {
				contact_id_tag_id: {
					contact_id: customerId,
					tag_id: tagId,
				},
			},
			update: {},
			create: {
				contact_id: customerId,
				tag_id: tagId,
			},
		})

		return CustomerService.getCustomerById(customerId)
	}

	static async removeTagFromCustomer(customerId: string, tagId: string) {
		if (!isUuid(customerId) || !isUuid(tagId)) return null

		await prisma.contact_tag_assignments.deleteMany({
			where: {
				contact_id: customerId,
				tag_id: tagId,
			},
		})

		return CustomerService.getCustomerById(customerId)
	}
}
