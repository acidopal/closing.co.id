/**
 * Frontend API Client
 *
 * All API calls go through Express proxy
 * Automatically includes auth token
 */

import { api as treatyApi } from './server'
import { getAppIdFromCookie, getOrgSlugFromCookie } from './organization'

export const API_BASE = import.meta.env.VITE_API_URL
	? `${import.meta.env.VITE_API_URL}/api`
	: 'http://localhost:3010/api'

function getAuthHeaders(): HeadersInit {
	const token =
		typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_token')
			: null

	let orgSlug = getOrgSlugFromCookie()
	if (!orgSlug && typeof localStorage !== 'undefined') {
		orgSlug = localStorage.getItem('scalechat_org_slug')
	}
	if (!orgSlug && typeof window !== 'undefined') {
		// Legacy fallback: /$lang/$orgSlug/...
		const pathMatch = window.location.pathname.match(/^\/[^/]+\/([^/]+)/)
		orgSlug = pathMatch?.[1] || null
	}

	// Legacy fallback: still support X-App-Id for transition period
	const appId =
		getAppIdFromCookie() ||
		(typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_app_id')
			: null)
	const appSecret =
		typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_app_secret') || 'scalesecret'
			: 'scalesecret'

	return {
		'Content-Type': 'application/json',
		...(token && { Authorization: `Bearer ${token}` }),
		// New: Use org slug from URL
		...(orgSlug && { 'X-Org-Slug': orgSlug }),
		// Legacy: Still send app_id during transition
		...(appId && { 'X-App-Id': appId }),
		...(appSecret && { 'X-App-Secret': appSecret }),
	}
}

function getMultipartAuthHeaders(): HeadersInit {
	const headers = getAuthHeaders() as Record<string, string>
	const multipartHeaders = { ...headers }
	delete multipartHeaders['Content-Type']
	delete multipartHeaders['content-type']
	return multipartHeaders
}

export interface ApiResponse<T = any> {
	success: boolean
	data?: T
	payload?: T
	error?: string
}

type ApiErrorPayload = {
	error?: unknown
	code?: unknown
	follow_up_url?: unknown
	[key: string]: unknown
}

type ApiRequestError = Error & {
	status?: number
	code?: string
	followUpUrl?: string
	details?: ApiErrorPayload
}

function buildApiRequestError(
	payload: ApiErrorPayload | null,
	status: number,
): ApiRequestError {
	const message =
		typeof payload?.error === 'string' && payload.error.trim().length > 0
			? payload.error
			: `HTTP ${status}`

	const error = new Error(message) as ApiRequestError
	error.status = status
	error.details = payload || undefined

	if (typeof payload?.code === 'string' && payload.code.trim().length > 0) {
		error.code = payload.code
	}

	if (
		typeof payload?.follow_up_url === 'string' &&
		payload.follow_up_url.trim().length > 0
	) {
		error.followUpUrl = payload.follow_up_url
	}

	return error
}

async function apiRequest<T>(
	endpoint: string,
	options?: RequestInit & { _retry?: boolean },
): Promise<T> {
	const response = await fetch(`${API_BASE}${endpoint}`, {
		...options,
		headers: {
			...getAuthHeaders(),
			...options?.headers,
		},
	})

	if (!response.ok) {
		if (
			response.status === 401 &&
			!options?._retry &&
			!endpoint.includes('/auth/refresh') &&
			!endpoint.includes('/auth/login')
		) {
			const refreshToken =
				typeof localStorage !== 'undefined'
					? localStorage.getItem('scalechat_refresh_token')
					: null

			if (refreshToken) {
				try {
					const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ refreshToken }),
					})

					if (refreshResponse.ok) {
						const data = await refreshResponse.json()
						if (typeof localStorage !== 'undefined') {
							localStorage.setItem('scalechat_token', data.token)
							if (data.refreshToken) {
								localStorage.setItem(
									'scalechat_refresh_token',
									data.refreshToken,
								)
							}
						}

						return apiRequest<T>(endpoint, {
							...options,
							_retry: true,
						})
					} else {
						if (typeof localStorage !== 'undefined') {
							localStorage.removeItem('scalechat_token')
							localStorage.removeItem('scalechat_refresh_token')
							localStorage.removeItem('scalechat_user')
						}
					}
				} catch (e) {
					console.error('Token refresh failed:', e)
				}
			}
		}

		const payload = (await response
			.json()
			.catch(() => ({ error: 'Request failed' }))) as ApiErrorPayload
		throw buildApiRequestError(payload, response.status)
	}

	return response.json() as Promise<T>
}

function getTreatyErrorMessage(error: unknown, status: number): string {
	if (typeof error === 'object' && error !== null && 'value' in error) {
		const value = (error as { value?: unknown }).value
		if (typeof value === 'string') {
			return value
		}
		if (typeof value === 'object' && value !== null && 'error' in value) {
			return String((value as { error?: unknown }).error ?? `HTTP ${status}`)
		}
	}

	return `HTTP ${status}`
}

function unwrapTreatyResponse<T>(response: {
	data: T | null
	error: unknown
	status: number
}): T {
	if (response.error || response.data === null) {
		throw new Error(getTreatyErrorMessage(response.error, response.status))
	}

	return response.data
}

// Auth
export const auth = {
	login: (
		email: string,
		password: string,
		appId?: string,
		appSecret?: string,
	) =>
		apiRequest('/auth/login', {
			method: 'POST',
			body: JSON.stringify({
				email,
				password,
				// Legacy: app_id is optional now, org context comes from session
				...(appId && { app_id: appId }),
				...(appSecret && { app_secret: appSecret }),
			}),
		}),

	logout: () => apiRequest('/auth/logout', { method: 'POST' }),

	me: () => apiRequest('/auth/me'),
}

// Conversations
export const conversations = {
	getCounts: () =>
		treatyApi.api.conversations.counts.get().then(unwrapTreatyResponse),

	list: (params?: {
		status?: 'open' | 'resolved' | 'pending'
		assignee_id?: string
		inbox_id?: string
		page?: number
		limit?: number
		dateFrom?: string
		dateTo?: string
		labelIds?: string
		resolvedBy?: string
		aiAgentId?: string
		pipelineStageId?: string
		channelType?: string
	}) =>
		treatyApi.api.conversations
			.get({
				query: {
					status: params?.status,
					agentId: params?.assignee_id,
					inboxId: params?.inbox_id,
					page: params?.page ? String(params.page) : undefined,
					limit: params?.limit ? String(params.limit) : undefined,
					dateFrom: params?.dateFrom,
					dateTo: params?.dateTo,
					labelIds: params?.labelIds,
					resolvedBy: params?.resolvedBy,
					aiAgentId: params?.aiAgentId,
					pipelineStageId: params?.pipelineStageId,
					channelType: params?.channelType,
				},
			})
			.then(unwrapTreatyResponse),

	get: (id: string) =>
		treatyApi.api.conversations({ id }).get().then(unwrapTreatyResponse),

	getMessages: (id: string) =>
		treatyApi.api
			.conversations({ id })
			.messages.get({ query: { limit: '50' } })
			.then(unwrapTreatyResponse),

	sendMessage: (
		id: string,
		data: {
			content: any
			message_type?: 'outgoing' | 'incoming'
			type?: 'text' | 'image' | 'template'
			content_type?: string
			media_url?: string
			private?: boolean
			reply_to_message_id?: string
			unique_temp_id?: string
			sender_type?: 'agent' | 'system'
			content_attributes?: Record<string, unknown>
		},
	) =>
		apiRequest(`/conversations/${id}/messages`, {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	assign: (
		id: string,
		data: {
			assignee_id: string
			team_id?: string
		},
	) =>
		treatyApi.api
			.conversations({ id })
			.assign.post({ agentId: data.assignee_id })
			.then(unwrapTreatyResponse),

	updateStatus: (id: string, status: 'open' | 'resolved' | 'pending') =>
		treatyApi.api
			.conversations({ id })
			.status.post({ status })
			.then(unwrapTreatyResponse),

	markAsRead: (id: string) =>
		treatyApi.api.conversations({ id }).read.post().then(unwrapTreatyResponse),

	suggestReply: (id: string) =>
		apiRequest(`/conversations/${id}/suggest-reply`, {
			method: 'POST',
		}),

	// Conversation Management (Advanced)
	resolve: (id: string) =>
		treatyApi.api
			.conversations({ id })
			.resolve.post()
			.then(unwrapTreatyResponse),

	bulkEdit: (data: {
		conversationIds: string[]
		collaboratorIds?: string[]
		handledById?: string
		labelId?: string
		pipelineStageId?: string
		resolveStatus?: 'open' | 'pending' | 'resolved'
	}) =>
		apiRequest('/conversations/bulk-edit', {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	getBulkEditJob: (jobId: string) =>
		apiRequest(`/conversations/bulk-edit/${jobId}`),

	getAgents: (id: string) =>
		treatyApi.api.conversations({ id }).agents.get().then(unwrapTreatyResponse),

	addAgent: (id: string, agentId: string) =>
		apiRequest(`/conversations/${id}/agents`, {
			method: 'POST',
			body: JSON.stringify({ agent_id: agentId }),
		}),

	removeAgent: (id: string, agentId: string) =>
		apiRequest(`/conversations/${id}/agents/${agentId}`, {
			method: 'DELETE',
		}),

	takeover: (id: string, agentId?: string) =>
		apiRequest(`/conversations/${id}/takeover`, {
			method: 'POST',
			...(agentId ? { body: JSON.stringify({ agentId }) } : {}),
		}),

	getActivity: (id: string) =>
		treatyApi.api
			.conversations({ id })
			.activity.get()
			.then(unwrapTreatyResponse),

	// Notes
	getNotes: (id: string) =>
		treatyApi.api.conversations({ id }).notes.get().then(unwrapTreatyResponse),

	addNote: (id: string, content: string) =>
		treatyApi.api
			.conversations({ id })
			.notes.post({ content })
			.then(unwrapTreatyResponse),

	deleteNote: (noteId: string) =>
		apiRequest(`/conversation-notes/${noteId}`, {
			method: 'DELETE',
		}),

	// Labels
	getLabels: (id: string) =>
		treatyApi.api.conversations({ id }).labels.get().then(unwrapTreatyResponse),

	addLabel: (id: string, labelId: string) =>
		treatyApi.api
			.conversations({ id })
			.labels.post({ labelId })
			.then(unwrapTreatyResponse),

	removeLabel: (id: string, labelId: string) =>
		treatyApi.api
			.conversations({ id })
			.labels({ labelId })
			.delete()
			.then(unwrapTreatyResponse),
}

// Contact conversations history
export const contactConversations = {
	list: async (contactId: string) => {
		const response: any = await apiRequest(
			`/contacts/${contactId}/conversations`,
		)
		const payload = Array.isArray(response?.payload)
			? response.payload
			: Array.isArray(response?.data)
				? response.data
				: []

		return {
			success: typeof response?.success === 'boolean' ? response.success : true,
			payload,
			data: payload,
		}
	},
}

// User Timezone
export const userTimezone = {
	get: () =>
		treatyApi.api.user.timezone.get().then((response) => {
			const data = unwrapTreatyResponse(response)
			return {
				success: true,
				payload: {
					timezone: data.timezone,
					timezone_auto_detected: false,
					timezone_updated_at: null,
				},
			}
		}),

	update: (timezone: string) =>
		apiRequest('/user/timezone', {
			method: 'PUT',
			body: JSON.stringify({ timezone }),
		}),

	detect: (detectedTimezone: string) =>
		apiRequest<{
			success: boolean
			payload: {
				timezone: string
				timezone_auto_detected: boolean
				updated: boolean
			}
		}>('/user/timezone/detect', {
			method: 'POST',
			body: JSON.stringify({ detected_timezone: detectedTimezone }),
		}),

	reset: () =>
		apiRequest('/user/timezone/reset', {
			method: 'POST',
		}),
}

// Agents
export const agents = {
	list: () =>
		treatyApi.api.agents.get().then((response) => {
			const data = unwrapTreatyResponse(response)
			return { success: true, data: (data.data ?? []) as any[] }
		}),
}

// Teams
export interface Team {
	id: string
	name: string
	description?: string
	allow_auto_assign: boolean
	created_at: string
	members?: TeamMember[]
}

export interface TeamMember {
	id: string
	name: string
	email: string
	role: string
	active: boolean
	joined_at: string
}

export const teams = {
	list: () =>
		treatyApi.api.teams.get().then((response) => {
			const data = unwrapTreatyResponse(response)
			return {
				success: true,
				payload: (data.data ?? []) as unknown as Team[],
			}
		}),

	get: (id: string) =>
		treatyApi.api
			.teams({ id })
			.get()
			.then((response) => {
				const data = unwrapTreatyResponse(response)
				return { success: true, payload: data.data as unknown as Team }
			}),

	create: (data: {
		name: string
		description?: string
		allow_auto_assign?: boolean
	}) =>
		treatyApi.api.teams.post(data).then((response) => {
			const payload = unwrapTreatyResponse(response)
			return { success: true, payload: payload.data as unknown as Team }
		}),

	update: (
		id: string,
		data: { name?: string; description?: string; allow_auto_assign?: boolean },
	) =>
		treatyApi.api
			.teams({ id })
			.patch(data)
			.then((response) => {
				const payload = unwrapTreatyResponse(response)
				return { success: true, payload: payload.data as unknown as Team }
			}),

	delete: (id: string) =>
		treatyApi.api
			.teams({ id })
			.delete()
			.then(() => ({
				success: true,
				message: 'Team deleted',
			})),

	addMember: (teamId: string, userId: string) =>
		treatyApi.api
			.teams({ id: teamId })
			.members.post({ userId })
			.then(() => ({ success: true, message: 'Member added' })),

	removeMember: (teamId: string, userId: string) =>
		treatyApi.api
			.teams({ id: teamId })
			.members({ userId })
			.delete()
			.then(() => ({ success: true, message: 'Member removed' })),
}

// Chatbots
export const chatbots = {
	list: () =>
		treatyApi.api.chatbots.get().then((response) => {
			const data = unwrapTreatyResponse(response)
			return { success: true, data: (data.data ?? []) as any[] }
		}),

	get: (id: string) =>
		treatyApi.api.chatbots({ id }).get().then(unwrapTreatyResponse),

	create: (data: {
		name: string
		description?: string
		prompt?: string
		model?: string
		is_active?: boolean
	}) => treatyApi.api.chatbots.post(data).then(unwrapTreatyResponse),

	update: (
		id: string,
		data: {
			name?: string
			description?: string
			prompt?: string
			model?: string
			is_active?: boolean
		},
	) => treatyApi.api.chatbots({ id }).patch(data).then(unwrapTreatyResponse),

	delete: (id: string) =>
		treatyApi.api.chatbots({ id }).delete().then(unwrapTreatyResponse),

	// Documents
	documents: {
		list: (chatbotId: string) =>
			treatyApi.api
				.chatbots({ id: chatbotId })
				.documents.get()
				.then(unwrapTreatyResponse),
		create: (
			chatbotId: string,
			data: { title: string; content: string; type?: string },
		) =>
			treatyApi.api
				.chatbots({ id: chatbotId })
				.documents.post(data)
				.then(unwrapTreatyResponse),
	},
}

// Labels
export const labels = {
	list: () => treatyApi.api.labels.get().then(unwrapTreatyResponse),
	create: (data: any) =>
		treatyApi.api.labels.post(data).then(unwrapTreatyResponse),
	update: (id: string, data: any) =>
		treatyApi.api.labels({ id }).patch(data).then(unwrapTreatyResponse),
	delete: (id: string) =>
		treatyApi.api.labels({ id }).delete().then(unwrapTreatyResponse),
}

// AI
export const ai = {
	// Note: Eden Treaty type inference issue - using apiRequest for now
	getSuggestion: (conversationId: string) =>
		apiRequest(`/ai/suggest/${conversationId}`),

	// Note: Backend doesn't have /ai/analyze endpoint yet
	analyze: (conversationId: string) =>
		apiRequest('/ai/analyze', {
			method: 'POST',
			body: JSON.stringify({ conversationId }),
		}),

	// Note: Backend doesn't have /ai/auto-respond endpoint yet
	autoRespond: (conversationId: string) =>
		apiRequest('/ai/auto-respond', {
			method: 'POST',
			body: JSON.stringify({ conversationId }),
		}),

	// Additional AI endpoints available in backend
	generateResponse: (message: string, conversationId?: string) =>
		treatyApi.api.ai.generate
			.post({ message, conversationId })
			.then(unwrapTreatyResponse),

	evaluate: (data: {
		conversationId: string
		score: number
		feedback?: string
	}) => treatyApi.api.ai.evaluate.post(data).then(unwrapTreatyResponse),

	getSettings: () => treatyApi.api.ai.settings.get().then(unwrapTreatyResponse),

	updateSettings: (data: any) =>
		treatyApi.api.ai.settings.patch(data).then(unwrapTreatyResponse),
}

// Routing
export const routing = {
	getRules: () => apiRequest('/routing/rules'),

	route: (conversationId: string) =>
		apiRequest('/routing/route', {
			method: 'POST',
			body: JSON.stringify({ conversationId }),
		}),
}

function mapDashboardSummaryToUiData(raw: any) {
	const totalMessages = Number(raw?.total_messages) || 0
	const activeConversations = Number(raw?.active_conversations) || 0
	const totalCustomers = Number(raw?.total_customers) || 0
	const avgResponseTime = Number(raw?.avg_response_time) || 0
	const aiHandlingRate = Number(raw?.ai_handling_rate) || 0
	const deliveredMessages = Number(raw?.delivered_messages) || 0
	const readMessages = Number(raw?.read_messages) || 0
	const deliveryRate = Number(raw?.delivery_rate) || 0
	const period =
		typeof raw?.period === 'string' && raw.period.trim() ? raw.period : '24h'

	return {
		messages: {
			total: totalMessages,
			today: totalMessages,
			thisWeek: totalMessages,
			thisMonth: totalMessages,
			sent: totalMessages,
			delivered: deliveredMessages,
			read: readMessages,
			failed: 0,
			growth: 0,
			deliveryRate,
			readRate: 0,
			byType: {
				text: totalMessages,
			},
			byChannel: {
				whatsapp: totalMessages,
				instagram: 0,
			},
			sentDetails: [],
		},
		customers: {
			total: totalCustomers,
			newThisWeek: 0,
			activeWindows: activeConversations,
			activeToday: activeConversations,
			growth: 0,
			customersDetails: [],
		},
		performance: {
			avgResponseTime: `${avgResponseTime}m`,
			resolutionRate: 0,
			satisfactionScore: 0,
			responseDetails: [],
		},
		channels: [
			{
				name: 'WhatsApp',
				value: totalMessages,
				color: '#10B981',
			},
			{
				name: 'Instagram',
				value: 0,
				color: '#EC4899',
			},
		],
		agents: [],
		whatsapp: {
			connected: totalMessages > 0 || activeConversations > 0,
		},
		instagram: {
			connected: false,
			conversations: 0,
			unreadCount: 0,
		},
		templates: {
			total: 0,
			approved: 0,
			pending: 0,
			rejected: 0,
			byCategory: {
				marketing: 0,
				utility: 0,
				authentication: 0,
			},
			usageThisMonth: 0,
		},
		quality: {
			rating: null,
			messagingTier: null,
			blockCount7days: 0,
			spamReportCount7days: 0,
			status: aiHandlingRate > 0 ? 'active' : 'unknown',
		},
		lastUpdated: new Date().toISOString(),
		source: {
			period,
			total_messages: totalMessages,
			active_conversations: activeConversations,
			avg_response_time: avgResponseTime,
			ai_handling_rate: aiHandlingRate,
		},
	}
}

// Metrics
export const metrics = {
	getSummary: (period?: string) =>
		treatyApi.api.metrics.summary
			.get({ query: period ? { period } : undefined })
			.then(unwrapTreatyResponse),

	getAI: () => treatyApi.api.metrics.ai.get().then(unwrapTreatyResponse),

	// Note: Backend doesn't have /metrics/routing endpoint yet
	getRouting: (period?: string) =>
		apiRequest(`/metrics/routing${period ? `?period=${period}` : ''}`),

	getDashboard: async (_period?: string) => {
		const raw = await apiRequest<any>('/metrics/dashboard')
		const payload =
			raw && typeof raw === 'object' && 'data' in raw && raw.data
				? raw.data
				: raw

		return {
			success: true,
			data: mapDashboardSummaryToUiData(payload),
		}
	},

	// Note: Backend doesn't have /metrics/agents endpoint yet
	getAgents: () => apiRequest('/metrics/agents'),

	// Note: Backend doesn't have /metrics/clear endpoint yet
	clear: () =>
		apiRequest('/metrics/clear', {
			method: 'POST',
		}),
}

// Contacts/Customers
export const contacts = {
	list: (params?: { page?: number; per_page?: number; search?: string }) =>
		treatyApi.api.contacts
			.get({
				query: {
					q: params?.search,
				},
			})
			.then(unwrapTreatyResponse),

	get: (id: string) => apiRequest(`/contacts/${id}/detail`),

	update: (
		id: string,
		data: {
			name?: string
			email?: string
			phone_number?: string
		},
	) => treatyApi.api.contacts({ id }).patch(data).then(unwrapTreatyResponse),

	block: (id: string, reason: string) =>
		apiRequest(`/contacts/${id}/block`, {
			method: 'POST',
			body: JSON.stringify({ reason }),
		}),

	blockCall: (id: string, reason: string) =>
		apiRequest(`/contacts/${id}/block-call`, {
			method: 'POST',
			body: JSON.stringify({ reason }),
		}),

	merge: (id: string, targetContactId: string) =>
		apiRequest(`/contacts/${id}/merge`, {
			method: 'POST',
			body: JSON.stringify({ target_contact_id: targetContactId }),
		}),

	settings: {
		get: () => apiRequest('/contacts/settings'),
		createStage: (data: {
			name: string
			color?: string
			isDefault?: boolean
		}) =>
			apiRequest('/contacts/settings/stages', {
				method: 'POST',
				body: JSON.stringify(data),
			}),
		updateStage: (
			id: string,
			data: {
				name?: string
				color?: string
				isDefault?: boolean
			},
		) =>
			apiRequest(`/contacts/settings/stages/${id}`, {
				method: 'PATCH',
				body: JSON.stringify(data),
			}),
		deleteStage: (id: string) =>
			apiRequest(`/contacts/settings/stages/${id}`, { method: 'DELETE' }),
		reorderStages: (stageIds: string[]) =>
			apiRequest('/contacts/settings/stages/reorder', {
				method: 'PATCH',
				body: JSON.stringify({ stageIds }),
			}),
		createField: (data: {
			fieldKey?: string
			fieldLabel: string
			fieldType: string
			options?: unknown[]
			isRequired?: boolean
			isVisible?: boolean
		}) =>
			apiRequest('/contacts/settings/fields', {
				method: 'POST',
				body: JSON.stringify(data),
			}),
		updateField: (
			id: string,
			data: {
				fieldKey?: string
				fieldLabel?: string
				fieldType?: string
				options?: unknown[]
				isRequired?: boolean
				isVisible?: boolean
			},
		) =>
			apiRequest(`/contacts/settings/fields/${id}`, {
				method: 'PATCH',
				body: JSON.stringify(data),
			}),
		deleteField: (id: string) =>
			apiRequest(`/contacts/settings/fields/${id}`, { method: 'DELETE' }),
		reorderFields: (fieldIds: string[]) =>
			apiRequest('/contacts/settings/fields/reorder', {
				method: 'PATCH',
				body: JSON.stringify({ fieldIds }),
			}),
	},
}

// Customers (Enhanced)
export const customers = {
	list: (params?: {
		page?: number
		per_page?: number
		search?: string
		pipeline_stage_id?: string
		consent_status?: string
		tag_id?: string
		channel?: string
		sort?: string
		order?: 'asc' | 'desc'
	}) => {
		const queryParams = new URLSearchParams()

		for (const [key, value] of Object.entries(params || {})) {
			if (value === undefined || value === null) continue

			if (typeof value === 'string') {
				const trimmed = value.trim()
				const lowered = trimmed.toLowerCase()
				if (!trimmed || lowered === 'undefined' || lowered === 'null') continue
				queryParams.set(key, trimmed)
				continue
			}

			queryParams.set(key, String(value))
		}

		const query = queryParams.toString()
		return apiRequest(`/customers${query ? `?${query}` : ''}`)
	},

	stats: () => apiRequest('/customers/stats'),

	get: (id: string) => apiRequest(`/customers/${id}`),

	update: (
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
	) =>
		apiRequest(`/customers/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		}),

	addTag: (id: string, data: { tag_name?: string; tag_id?: string }) =>
		apiRequest(`/customers/${id}/tags`, {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	removeTag: (id: string, tagId: string) =>
		apiRequest(`/customers/${id}/tags/${tagId}`, {
			method: 'DELETE',
		}),
}

// Inboxes (Omnichannel)
export const inboxes = {
	list: () => treatyApi.api.inboxes.get().then(unwrapTreatyResponse),

	get: (id: string) =>
		treatyApi.api.inboxes({ id }).get().then(unwrapTreatyResponse),

	create: (data: {
		name: string
		channel_type: 'whatsapp' | 'instagram' | 'tiktok' | 'web'
		channel_config: any
	}) =>
		treatyApi.api.inboxes
			.post({
				name: data.name,
				channel_type: data.channel_type,
				channel_config: data.channel_config,
			})
			.then(unwrapTreatyResponse),

	update: (id: string, data: any) =>
		treatyApi.api.inboxes({ id }).patch(data).then(unwrapTreatyResponse),

	delete: (id: string) =>
		treatyApi.api.inboxes({ id }).delete().then(unwrapTreatyResponse),
}

// Knowledge Base
export const knowledge = {
	list: () => apiRequest('/knowledge'),

	add: (data: {
		title: string
		content: string
		type?: 'text' | 'url' | 'pdf'
	}) =>
		apiRequest('/knowledge', {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	query: (query: string) =>
		apiRequest('/knowledge/query', {
			method: 'POST',
			body: JSON.stringify({ query }),
		}),
}

// WhatsApp Channels
export const whatsappChannels = {
	sync: (channelId: string) =>
		apiRequest(`/whatsapp/${channelId}/sync`, {
			method: 'POST',
		}),

	getDetails: (channelId: string) =>
		apiRequest<{
			success: boolean
			data: {
				id: string
				name: string
				phone_number: string
				phone_number_id: string
				business_id: string
				business_name: string
				timezone: string
				currency: string
				business_verification_status: string
				phone_number_status: string
				quality_rating: string
				messaging_limit: string
				verified_name: string
				is_active: boolean
				is_on_cloud: boolean
				is_bot_enabled: boolean
				is_auto_responder_enabled: boolean
				forward_enabled: boolean
				forward_url: string | null
				badge_url: string | null
				platform: string
				last_synced_at: string | null
				created_at: string
				updated_at: string
				quality_score: {
					percentage: number
					color: string
					label: string
				}
				limit_info: {
					daily_limit: string
					tier_level: number
				}
					metadata: {
						profile_picture_url?: string
						about?: string
						description?: string
						email?: string
						websites?: string[]
						vertical?: string
						// Configuration fields
						default_chatbot_id?: string
						default_flow_id?: string
						default_team_ids?: string[]
						default_agent_ids?: string[]
						distribution_method?: 'round_robin' | 'least_assigned'
						tags?: string[]
					}
			}
		}>(`/whatsapp/${channelId}/details`),

	uploadBadge: async (
		channelId: string,
		file: File,
	): Promise<{ success?: boolean; badge_url?: string | null }> => {
		const formData = new FormData()
		formData.append('badge', file)

		const response = await fetch(`${API_BASE}/whatsapp/${channelId}/badge`, {
			method: 'POST',
			headers: getMultipartAuthHeaders(),
			body: formData,
		})

		const payload = (await response
			.json()
			.catch(() => ({ error: 'Badge upload failed' }))) as ApiErrorPayload & {
			success?: boolean
			badge_url?: string | null
		}

		if (!response.ok) {
			throw buildApiRequestError(payload, response.status)
		}

		return payload
	},

	removeBadge: (channelId: string) =>
		apiRequest(`/whatsapp/${channelId}/badge`, {
			method: 'DELETE',
		}),

	update: (
			channelId: string,
			data: {
				name?: string
				tags?: string[]
				default_chatbot_id?: string | null
				default_flow_id?: string | null
				default_team_ids?: string[]
				default_agent_ids?: string[]
				distribution_method?: 'round_robin' | 'least_assigned'
			},
		) =>
		apiRequest(`/whatsapp-channels/${channelId}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		}),

	delete: (channelId: string) =>
		apiRequest(`/whatsapp-channels/${channelId}`, {
			method: 'DELETE',
		}),
}

export const whatsappTemplates = {
	list: (status?: string, category?: string) => {
		let q = ''
		if (status) q += `?status=${status}`
		if (category) q += `${q ? '&' : '?'}category=${category}`
		return apiRequest<{ success: boolean; data: any[] }>(
			`/whatsapp/templates${q}`,
		)
	},
	sync: (channelId: string) =>
		apiRequest<{ success: boolean; data: any }>(`/whatsapp/templates/sync`, {
			method: 'POST',
			body: JSON.stringify({ channelId }),
		}),
}

// Media Upload
export const media = {
	upload: async (
		file: File,
		platform: 'whatsapp' | 'instagram' | 'tiktok' = 'whatsapp',
	): Promise<{
		success: boolean
		payload?: {
			url: string
			type: 'image' | 'document' | 'video' | 'audio'
			mimeType: string
			fileName: string
			fileSize: number
			key: string
		}
		error?: string
	}> => {
		const formData = new FormData()
		formData.append('file', file)
		formData.append('platform', platform)

		const token =
			typeof localStorage !== 'undefined'
				? localStorage.getItem('scalechat_token')
				: null
		const headers: Record<string, string> = {}
		if (token) {
			headers.Authorization = `Bearer ${token}`
		}

		const response = await fetch(`${API_BASE}/media/upload`, {
			method: 'POST',
			headers,
			body: formData,
		})

		const text = await response.text()
		try {
			return JSON.parse(text)
		} catch {
			return { success: false, error: text || 'Upload failed' }
		}
	},
	gallery: async (options?: {
		type?: string
		take?: number
		cursor?: string
	}): Promise<{
		success: boolean
		payload?: Array<{
			id: string
			media_type: string | null
			mime_type: string | null
			filename: string | null
			file_size: number | null
			url: string | null
			created_at: string | null
		}>
		error?: string
	}> => {
		try {
			const params = new URLSearchParams()
			if (options?.type) params.set('type', options.type)
			if (options?.take) params.set('take', String(options.take))
			if (options?.cursor) params.set('cursor', options.cursor)
			const qs = params.toString()
			const data = await apiRequest<{ data: any[] }>(
				`/media/gallery${qs ? `?${qs}` : ''}`,
			)
			return { success: true, payload: data.data }
		} catch (err: unknown) {
			return {
				success: false,
				error: err instanceof Error ? err.message : 'Failed to load gallery',
			}
		}
	},
}
// Automation Flows
export const automationFlows = {
	list: () =>
		treatyApi.api.flows.get().then((response) => {
			const data = unwrapTreatyResponse(response)
			return { success: true, payload: (data.payload ?? []) as any[] }
		}),
	get: (id: string) =>
		treatyApi.api
			.flows({ id })
			.get()
			.then((response) => {
				const data = unwrapTreatyResponse(response)
				return { success: true, payload: data.data }
			}),
	create: (data: any) =>
		treatyApi.api.flows.post(data).then((response) => {
			const payload = unwrapTreatyResponse(response)
			return { success: true, payload: payload.data }
		}),
	update: (id: string, data: any) =>
		treatyApi.api
			.flows({ id })
			.patch(data)
			.then((response) => {
				const payload = unwrapTreatyResponse(response)
				return { success: true, payload: payload.data }
			}),
	delete: (id: string) =>
		treatyApi.api
			.flows({ id })
			.delete()
			.then(() => ({
				success: true,
			})),
}

export const n8nEmbed = {
	login: (force = false) =>
		apiRequest<{
			success: boolean
			embedUrl?: string
			error?: string
		}>(`/n8n/embed-login${force ? '?force=1' : ''}`, {
			method: 'POST',
			credentials: 'include',
		}),
}

// Broadcasts
export const broadcasts = {
	list: () =>
		treatyApi.api.broadcasts.get().then((response) => {
			const data = unwrapTreatyResponse(response)
			return { success: true, payload: (data.data ?? []) as any[] }
		}),
	listJobs: async (params?: {
		page?: number
		limit?: number
		status?: string[]
	}) => {
		const query = new URLSearchParams()
		if (params?.page) query.set('page', String(params.page))
		if (params?.limit) query.set('limit', String(params.limit))
		if (Array.isArray(params?.status)) {
			params.status
				.filter((value) => typeof value === 'string' && value.trim().length > 0)
				.forEach((value) => {
					query.append('status', value)
				})
		}

		const suffix = query.toString()
		const data = await apiRequest<{
			success: boolean
			data?: any[]
			pagination?: {
				page: number
				limit: number
				total: number
				totalPages: number
			}
		}>(`/broadcasts/jobs${suffix ? `?${suffix}` : ''}`)

		return {
			success: Boolean(data.success),
			payload: (data.data ?? []) as any[],
			pagination: data.pagination,
		}
	},
	getJob: async (id: string) => {
		const data = await apiRequest<{ success: boolean; data?: any }>(
			`/broadcasts/jobs/${id}`,
		)
		return {
			success: Boolean(data.success),
			payload: data.data ?? null,
		}
	},
	get: (id: string) =>
		apiRequest<{ success: boolean; payload: any }>(`/broadcasts/${id}`),
	create: (data: {
		title: string
		message_content: string
		message_type?: 'text' | 'template'
		template_name?: string
		template_language?: string
		template_params?: Record<string, any>
		target_audience?: Record<string, any>
		scheduled_at?: string
	}) =>
		treatyApi.api.broadcasts.post(data).then((response) => {
			const payload = unwrapTreatyResponse(response)
			return { success: true, payload: payload.data }
		}),
	send: (id: string) =>
		treatyApi.api
			.broadcasts({ id })
			.send.post()
			.then((response) => {
				const payload = unwrapTreatyResponse(response)
				return { success: true, payload }
			}),
	delete: (id: string) =>
		apiRequest<{ success: boolean }>(`/broadcasts/${id}`, {
			method: 'DELETE',
		}),
}

export interface OrdersListParams {
	page?: number
	limit?: number
	paymentType?: string
	orderStatus?: string
	inboxId?: string
	search?: string
	sortField?: string
	sortDirection?: 'asc' | 'desc'
	includeConversation?: boolean
}

export interface OrderReportParams {
	startDate?: string
	endDate?: string
}

export interface SubscriptionsListParams {
	page?: number
	limit?: number
	search?: string
	sortField?: string
	sortDirection?: 'asc' | 'desc'
}

export interface TicketStage {
	id: string
	name: string
	color: string
	stage_order: number
}

export interface TicketBoard {
	id: string
	board_name: string
	is_default: boolean
	created_at: string | null
	statuses: TicketStage[]
}

export interface TicketCard {
	conversation_id: string
	board_id: string
	stage_id: string | null
	stage_name?: string | null
	contact_name: string
	contact_phone: string | null
	last_message: string | null
	conversation_status: string | null
	deal_value: number
	created_at: string | null
	updated_at: string | null
}

export interface TicketKanbanColumn {
	id: string
	name: string
	color: string
	stage_order: number
	tickets: TicketCard[]
}

export interface TicketListItem extends TicketCard {
	stage_name: string | null
}

export interface ConversationTicketSummary {
	conversation_id: string
	board_id: string
	board_name: string
	stage_id: string | null
	stage_name: string | null
	stage_color: string | null
	deal_value: number
	contact_name: string
	contact_phone: string | null
	last_message: string | null
	conversation_status: string | null
	created_at: string | null
	updated_at: string | null
}

export interface TicketsSettingsResponse {
	boards: TicketBoard[]
	default_board_id: string | null
	empty_state: {
		has_boards: boolean
		message: string | null
	}
}

export interface TicketsBoardResponse {
	view: 'kanban' | 'list'
	board: {
		id: string
		board_name: string
	} | null
	pagination: {
		page: number
		limit: number
		total: number
	}
	columns: TicketKanbanColumn[]
	items: TicketListItem[]
}

export interface TicketsBoardParams {
	board_id?: string | null
	page?: number
	limit?: number
	search?: string
	sort?: {
		field: 'created_at' | 'updated_at' | 'deal_value' | 'contact_name'
		direction: 'asc' | 'desc'
	}
	view?: 'kanban' | 'list'
}

export const orders = {
	list: (params?: OrdersListParams) =>
		treatyApi.api.orders
			.get({
				query: {
					page: params?.page ? String(params.page) : undefined,
					limit: params?.limit ? String(params.limit) : undefined,
					payment_type: params?.paymentType,
					order_status: params?.orderStatus,
					inbox_id: params?.inboxId,
					search: params?.search,
					sort_field: params?.sortField,
					sort_direction: params?.sortDirection,
					include_conv:
						params?.includeConversation !== undefined
							? String(params.includeConversation)
							: undefined,
				},
			})
			.then(unwrapTreatyResponse),

	report: (params?: OrderReportParams) =>
		treatyApi.api.orders.report
			.get({
				query: {
					startDate: params?.startDate,
					endDate: params?.endDate,
				},
			})
			.then(unwrapTreatyResponse),

	listSubscriptions: (params?: SubscriptionsListParams) =>
		treatyApi.api.orders.subscriptions
			.get({
				query: {
					page: params?.page ? String(params.page) : undefined,
					limit: params?.limit ? String(params.limit) : undefined,
					search: params?.search,
					sort_field: params?.sortField,
					sort_direction: params?.sortDirection,
				},
			})
			.then(unwrapTreatyResponse),
}

export const tickets = {
	getSettings: () =>
		apiRequest<{ success: boolean; data: TicketsSettingsResponse }>(
			'/tickets/settings',
		).then((response) => response.data),

	setDefaultBoard: (board_id: string | null) =>
		apiRequest<{
			success: boolean
			data: {
				success: boolean
				default_board_id: string | null
			}
		}>('/tickets/settings/default-board', {
			method: 'PUT',
			body: JSON.stringify({ board_id }),
		}).then((response) => response.data),

	getBoard: (params: TicketsBoardParams) =>
		apiRequest<{ success: boolean; data: TicketsBoardResponse }>('/tickets/kanban', {
			method: 'POST',
			body: JSON.stringify(params),
		}).then((response) => response.data),

	getConversationSummary: (
		conversationId: string,
		boardId?: string | null,
	) =>
		apiRequest<{
			success: boolean
			data: ConversationTicketSummary | null
		}>(
			`/tickets/conversations/${conversationId}${boardId ? `?board_id=${encodeURIComponent(boardId)}` : ''}`,
		).then((response) => response.data),
}
