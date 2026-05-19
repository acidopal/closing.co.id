import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
	Inbox,
	RefreshCw,
	Search,
	MessageSquare,
	Instagram,
	Check,
	CheckCheck,
	Send,
	Sparkles,
	Clock,
	Bot,
	Zap,
	MoreVertical,
	Smile,
	Paperclip,
	Mic,
	ImageOff,
	FileText,
	X,
	Edit2,
	ChevronRight,
	UserPlus,
	Info,
	ArrowLeft,
	Plus,
	Reply,
} from 'lucide-react'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { conversations as conversationsApi, ai as aiApi } from '@/lib/api'
import { sendBrowserNotification } from '@/lib/notifications'
import {
	formatChatDate,
	formatChatTime,
	formatRelativeTime,
	formatTodayTime,
} from '@/lib/timezone'

export const Route = createFileRoute('/_app/instagram/inbox')({
	component: InstagramInbox,
})

interface DemoMessage {
	id: string
	content: string
	type: 'incoming' | 'outgoing' | 'system'
	timestamp: Date
	status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
	isAI?: boolean
	contentType?: string
	replyToMessageId?: string | null
	externalId?: string | null
	senderType?: string | null
	senderId?: string | null
	statusAt?: Date | null
	senderLabel?: string | null
	flowName?: string | null
	aiSource?: string | null
	aiStatusEnabled?: boolean
	aiToolsCalled?: number | null
	aiLabelApplied?: string | null
	aiStatusToolsText?: string | null
	aiStatusLabelText?: string | null
	aiCreditsUsed?: number | null
	extras?: {
		media?: {
			type: string
			url?: string
			mimeType?: string
			caption?: string
			fileName?: string
			sha256?: string
			id?: string
		}
	}
}

interface DemoConversation {
	id: string
	name: string
	phone: string
	avatar: string
	lastMessage: string
	timestamp: Date
	unread: number
	channel: 'whatsapp' | 'instagram'
	messages: DemoMessage[]
}

const AI_STATUS_TOOLS_TEXT = 'Successfully executed tool calls'
const AI_STATUS_LABEL_PREFIX = 'Successfully labeled conversation with:'

function toRecord(value: unknown): Record<string, any> | null {
	if (!value) return null
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value)
			return parsed && typeof parsed === 'object'
				? (parsed as Record<string, any>)
				: null
		} catch {
			return null
		}
	}
	return typeof value === 'object' ? (value as Record<string, any>) : null
}

function toNullableString(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const normalized = value.trim()
	return normalized.length > 0 ? normalized : null
}

function toNullableNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value
	if (typeof value === 'string') {
		const parsed = Number(value)
		return Number.isFinite(parsed) ? parsed : null
	}
	return null
}

function toNullableBoolean(value: unknown): boolean | null {
	if (typeof value === 'boolean') return value
	if (typeof value === 'string') {
		if (value === 'true') return true
		if (value === 'false') return false
	}
	return null
}

function toNullableDate(value: unknown): Date | null {
	if (value instanceof Date) {
		return Number.isFinite(value.getTime()) ? value : null
	}
	if (typeof value === 'string' || typeof value === 'number') {
		const parsed = new Date(value)
		return Number.isFinite(parsed.getTime()) ? parsed : null
	}
	return null
}

function getNestedValue(source: Record<string, any>, path: string): unknown {
	if (!path.includes('.')) return source[path]
	return path.split('.').reduce<unknown>((acc, key) => {
		if (!acc || typeof acc !== 'object') return undefined
		return (acc as Record<string, any>)[key]
	}, source)
}

function pickFirstStringFromLayers(
	layers: Array<Record<string, any> | null | undefined>,
	keys: string[],
): string | null {
	for (const layer of layers) {
		if (!layer) continue
		for (const key of keys) {
			const value = getNestedValue(layer, key)
			const normalized = toNullableString(value)
			if (normalized) return normalized
		}
	}
	return null
}

function pickFirstBooleanFromLayers(
	layers: Array<Record<string, any> | null | undefined>,
	keys: string[],
): boolean | null {
	for (const layer of layers) {
		if (!layer) continue
		for (const key of keys) {
			const value = getNestedValue(layer, key)
			const normalized = toNullableBoolean(value)
			if (normalized !== null) return normalized
		}
	}
	return null
}

function pickFirstNumberFromLayers(
	layers: Array<Record<string, any> | null | undefined>,
	keys: string[],
): number | null {
	for (const layer of layers) {
		if (!layer) continue
		for (const key of keys) {
			const value = getNestedValue(layer, key)
			const normalized = toNullableNumber(value)
			if (normalized !== null) return normalized
		}
	}
	return null
}

function pickFirstDateFromLayers(
	layers: Array<Record<string, any> | null | undefined>,
	keys: string[],
): Date | null {
	for (const layer of layers) {
		if (!layer) continue
		for (const key of keys) {
			const value = getNestedValue(layer, key)
			const normalized = toNullableDate(value)
			if (normalized) return normalized
		}
	}
	return null
}

function resolveMessageMetaLayers(message: any) {
	return [
		toRecord(message?.metadata),
		toRecord(message?.content_attributes ?? message?.contentAttributes),
		toRecord(message?.additional_attributes ?? message?.additionalAttributes),
		toRecord(message?.extras),
	]
}

function normalizeMessageExtras(message: any): DemoMessage['extras'] | undefined {
	const explicitExtras = toRecord(message?.extras)
	const contentAttributes = toRecord(
		message?.content_attributes ?? message?.contentAttributes,
	)
	const rawPayload = toRecord(message?.raw_payload ?? message?.rawPayload)
	const directMedia = toRecord(message?.media)

	const mergedMedia = {
		...(toRecord(rawPayload?.[message?.content_type || message?.contentType || '']) || {}),
		...(toRecord(contentAttributes?.media) || {}),
		...(toRecord(explicitExtras?.media) || {}),
		...(directMedia || {}),
	}

	const mediaTypeRaw =
		toNullableString(mergedMedia.type) ||
		toNullableString(message?.content_type || message?.contentType)
	const normalizedType = mediaTypeRaw
		? mediaTypeRaw.toLowerCase()
		: undefined
	if (
		normalizedType !== 'image' &&
		normalizedType !== 'video' &&
		normalizedType !== 'audio' &&
		normalizedType !== 'document'
	) {
		return undefined
	}

	const mediaUrl =
		toNullableString(mergedMedia.url) ||
		toNullableString(mergedMedia.link) ||
		toNullableString(mergedMedia.src) ||
		toNullableString(mergedMedia.media_url) ||
		toNullableString(mergedMedia.mediaUrl)

	return {
		media: {
			type: normalizedType,
			url: mediaUrl || undefined,
			mimeType:
				toNullableString(mergedMedia.mime_type) ||
				toNullableString(mergedMedia.mimeType) ||
				undefined,
			caption: toNullableString(mergedMedia.caption) || undefined,
			fileName:
				toNullableString(mergedMedia.filename) ||
				toNullableString(mergedMedia.file_name) ||
				toNullableString(mergedMedia.fileName) ||
				undefined,
			sha256: toNullableString(mergedMedia.sha256) || undefined,
			id:
				toNullableString(mergedMedia.id) ||
				toNullableString(mergedMedia.media_id) ||
				undefined,
		},
	}
}

function resolveFlowNameFromLayers(
	layers: Array<Record<string, any> | null | undefined>,
): string | null {
	const direct = pickFirstStringFromLayers(layers, [
		'flow_name',
		'flowName',
		'automation_flow_name',
		'automationFlowName',
		'flow.name',
		'flow.display_name',
	])
	if (direct) return direct

	for (const layer of layers) {
		if (!layer) continue
		const flow = toRecord(layer.flow) || toRecord(layer.flow_info)
		if (!flow) continue
		const name =
			toNullableString(flow.name) ||
			toNullableString(flow.display_name) ||
			toNullableString(flow.title)
		if (name) return name
	}
	return null
}

function normalizeMessageStatus(rawStatus: unknown): DemoMessage['status'] {
	const status = String(rawStatus || 'read').toLowerCase()
	if (status === 'sending') return 'sending'
	if (status === 'sent') return 'sent'
	if (status === 'delivered') return 'delivered'
	if (status === 'read') return 'read'
	if (status === 'failed') return 'failed'
	return 'read'
}

function normalizeContentType(value: unknown): string {
	const normalized = toNullableString(value)?.toLowerCase()
	if (
		normalized === 'text' ||
		normalized === 'image' ||
		normalized === 'video' ||
		normalized === 'audio' ||
		normalized === 'document'
	) {
		return normalized
	}
	return 'text'
}

function toDemoMessage(
	message: any,
	options?: { fallbackTimestamp?: unknown; fallbackSenderLabel?: string | null },
): DemoMessage {
	const layers = resolveMessageMetaLayers(message)
	const senderType = toNullableString(message?.sender_type ?? message?.senderType)
	const senderInfo = toRecord(message?.sender)
	const senderExtras = toRecord(senderInfo?.user_extras)
	const flowName = resolveFlowNameFromLayers(layers)
	const aiSource = pickFirstStringFromLayers(layers, [
		'ai_source',
		'aiSource',
		'ai.source',
		'ai.source_name',
		'source_name',
		'model_source',
		'modelSource',
	])
	const isAI =
		pickFirstBooleanFromLayers(layers, [
			'is_ai',
			'isAI',
			'ai_generated',
			'aiGenerated',
			'generated_by_ai',
			'generatedByAI',
		]) === true ||
		senderType === 'bot' ||
		senderExtras?.type === 'bot' ||
		Boolean(flowName)
	const aiStatusEnabledRaw = pickFirstBooleanFromLayers(layers, [
		'ai_status_enabled',
		'aiStatusEnabled',
	])
	const aiStatusEnabled =
		aiStatusEnabledRaw === null ? undefined : aiStatusEnabledRaw
	const aiToolsCalled = pickFirstNumberFromLayers(layers, [
		'ai_tools_called',
		'aiToolsCalled',
	])
	const aiCreditsUsed = pickFirstNumberFromLayers(layers, [
		'ai_credits_used',
		'aiCreditsUsed',
		'credits_used',
		'creditsUsed',
	])
	const aiLabelApplied = pickFirstStringFromLayers(layers, [
		'ai_label_applied',
		'aiLabelApplied',
	])
	const aiStatusToolsText = pickFirstStringFromLayers(layers, [
		'ai_status_tools_text',
		'aiStatusToolsText',
	])
	const aiStatusLabelText = pickFirstStringFromLayers(layers, [
		'ai_status_label_text',
		'aiStatusLabelText',
	])
	const senderLabel =
		pickFirstStringFromLayers(layers, [
			'sender_label',
			'senderLabel',
			'sender_name',
			'senderName',
			'agent_name',
			'agentName',
			'sender.name',
			'sender.display_name',
		]) ||
		toNullableString(senderInfo?.name) ||
		toNullableString(senderInfo?.full_name) ||
		toNullableString(senderInfo?.username) ||
		toNullableString(options?.fallbackSenderLabel) ||
		null
	const messageTypeRaw = String(message?.message_type || '').toLowerCase()

	return {
		id: message?.id || `msg-${Date.now()}`,
		externalId: message?.external_id || message?.externalId || null,
		content:
			typeof (message?.message ?? message?.content) === 'string'
				? (message?.message ?? message?.content)
				: message?.message ?? message?.content
					? JSON.stringify(message?.message ?? message?.content)
					: '',
		type:
			messageTypeRaw === 'system'
				? 'system'
				: messageTypeRaw === 'incoming'
					? 'incoming'
					: 'outgoing',
		timestamp: new Date(
			(options?.fallbackTimestamp as any) || message?.created_at || Date.now(),
		),
		status: normalizeMessageStatus(message?.status),
		isAI,
		contentType: normalizeContentType(
			message?.content_type || message?.contentType,
		),
		replyToMessageId: message?.reply_to_message_id || message?.replyToMessageId || null,
		senderType,
		senderId: toNullableString(message?.sender_id ?? message?.senderId),
		statusAt:
			toNullableDate(message?.status_at || message?.statusAt) ||
			pickFirstDateFromLayers(layers, [
				'status_at',
				'statusAt',
				'delivered_at',
				'deliveredAt',
				'read_at',
				'readAt',
			]),
			senderLabel,
			flowName,
			aiSource,
			aiStatusEnabled,
			aiToolsCalled,
			aiLabelApplied,
			aiStatusToolsText,
			aiStatusLabelText,
			aiCreditsUsed,
			extras: normalizeMessageExtras(message),
		}
}

function getMessageGroupClass(message: DemoMessage): string {
	if (message.type === 'system') return 'system'
	if (message.type === 'incoming') return 'incoming-contact'
	return message.isAI ? 'outgoing-ai' : 'outgoing-agent'
}

function getMessageMinuteBucket(message: DemoMessage): string {
	return `${formatChatDate(message.timestamp)}|${formatChatTime(message.timestamp)}`
}

function groupAdjacentMessagesByMinute(messages: DemoMessage[]) {
	const groups: Array<{ id: string; messages: DemoMessage[] }> = []
	for (const message of messages) {
		const previousGroup = groups[groups.length - 1]
		const previousMessage = previousGroup?.messages[previousGroup.messages.length - 1]
		const canGroup =
			Boolean(previousMessage) &&
			message.type !== 'system' &&
			previousMessage.type !== 'system' &&
			getMessageGroupClass(previousMessage) === getMessageGroupClass(message) &&
			getMessageMinuteBucket(previousMessage) === getMessageMinuteBucket(message)

		if (canGroup && previousGroup) {
			previousGroup.messages.push(message)
			continue
		}

		groups.push({
			id: message.id,
			messages: [message],
		})
	}
	return groups
}

function getOutgoingStatusLabel(status: DemoMessage['status']): string {
	if (status === 'sending') return 'Sending'
	if (status === 'sent') return 'Sent'
	if (status === 'delivered') return 'Delivered'
	if (status === 'read') return 'Read'
	if (status === 'failed') return 'Failed'
	return 'Sent'
}

function getMessageSenderContext(message: DemoMessage, conversationName: string): string {
	if (message.type === 'system') return 'system'
	if (message.type === 'incoming') return conversationName
	if (message.isAI) return 'ai'
	return 'agent'
}

function getReplyPreviewContent(message: DemoMessage): string {
	const value = toNullableString(message.content)
	if (value) return value
	return message.contentType ? `[${message.contentType}]` : '[Message]'
}

function parseJsonContent(value: string): unknown | null {
	try {
		return JSON.parse(value)
	} catch {
		return null
	}
}

function isAssistantPayloadShape(value: unknown): boolean {
	if (!value || typeof value !== 'object') return false
	const record = value as Record<string, unknown>
	const role = String(record.role || '').toLowerCase()
	const content = record.content
	return role === 'assistant' && typeof content === 'string' && content.trim().length > 0
}

function isInternalAiSystemPayload(content: string): boolean {
	const parsed = parseJsonContent(content)
	if (!parsed) return false

	if (Array.isArray(parsed)) {
		return parsed.some((item) => isAssistantPayloadShape(item))
	}

	if (isAssistantPayloadShape(parsed)) return true

	if (parsed && typeof parsed === 'object') {
		const messages = (parsed as Record<string, unknown>).messages
		if (Array.isArray(messages)) {
			return messages.some((item) => isAssistantPayloadShape(item))
		}
	}

	return false
}

function isAiStatusSystemMessage(content: string): boolean {
	return content === AI_STATUS_TOOLS_TEXT || content.startsWith(AI_STATUS_LABEL_PREFIX)
}

function getAiStatusChipTexts(message: DemoMessage): string[] {
	if (message.type !== 'outgoing' || !message.isAI) return []

	const chips: string[] = []
	const toolsText = toNullableString(message.aiStatusToolsText)
	const hasToolsCount =
		typeof message.aiToolsCalled === 'number' && Number.isFinite(message.aiToolsCalled)
	if (toolsText || message.aiStatusEnabled === true || hasToolsCount) {
		chips.push(toolsText || AI_STATUS_TOOLS_TEXT)
	}

	const labelText =
		toNullableString(message.aiStatusLabelText) ||
		(toNullableString(message.aiLabelApplied)
			? `${AI_STATUS_LABEL_PREFIX} ${message.aiLabelApplied}`
			: null)
	if (labelText) chips.push(labelText)

	return Array.from(new Set(chips)).filter(
		(chipText) => !isAiStatusSystemMessage(chipText.trim()),
	)
}

function getMessageTimestamp(message: DemoMessage): number {
	const value =
		message.timestamp instanceof Date
			? message.timestamp.getTime()
			: new Date(message.timestamp).getTime()
	return Number.isFinite(value) ? value : 0
}

function sortMessagesChronologically(messages: DemoMessage[]) {
	return messages
		.map((message, index) => ({ message, index }))
		.sort((a, b) => {
			const timeDiff = getMessageTimestamp(a.message) - getMessageTimestamp(b.message)
			if (timeDiff !== 0) return timeDiff
			return a.index - b.index
		})
		.map(({ message }) => message)
}

function InstagramInbox() {
	const routeParams = Route.useParams({ strict: false }) as { appId?: string }
	const appId =
		routeParams.appId ||
		(typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_org_slug') ||
				localStorage.getItem('scalechat_app_id') ||
				''
			: '')

	// State
	const [conversations, setConversations] = useState<DemoConversation[]>([])
	const [selectedConversation, setSelectedConversation] =
		useState<DemoConversation | null>(null)
	const [newMessage, setNewMessage] = useState('')
	const [isSending, setIsSending] = useState(false)
	const [aiSuggestion, setAiSuggestion] = useState('')
	const [showAiSuggestion, setShowAiSuggestion] = useState(false)
	const [isTyping, setIsTyping] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [currentUserId, setCurrentUserId] = useState('')
	const [currentUserName, setCurrentUserName] = useState('')
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const socketRef = useRef<Socket | null>(null)
	const selectedConversationIdRef = useRef<string | null>(null)
	const currentUserIdRef = useRef<string>('')
	const currentUserNameRef = useRef<string>('')

	const [showCustomerInfo, setShowCustomerInfo] = useState(true)
	const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
	const [showMobileCustomerInfo, setShowMobileCustomerInfo] = useState(false)

	const API_BASE = import.meta.env.VITE_API_URL || 'https://api.scalebiz.chat'

	useEffect(() => {
		selectedConversationIdRef.current = selectedConversation?.id || null
	}, [selectedConversation?.id])

	useEffect(() => {
		currentUserIdRef.current = currentUserId
		currentUserNameRef.current = currentUserName
	}, [currentUserId, currentUserName])

	useEffect(() => {
		try {
			const userStr = localStorage.getItem('scalechat_user')
			if (!userStr) return
			const user = JSON.parse(userStr)
			setCurrentUserId(user.id || '')
			setCurrentUserName(user.name || user.full_name || '')
		} catch (error) {
			console.error('Failed to read current user for Instagram inbox:', error)
		}
	}, [])

	// Load conversations from API
	const loadConversations = useCallback(async () => {
		try {
			const data: any = await conversationsApi.list()
			const convs = (data.payload || []).map((c: any) => ({
				id: c.id,
				name: c.contact?.name || c.contact?.identifier || 'Unknown',
				phone: c.contact?.phone_number || c.contact?.identifier || '',
				avatar: (c.contact?.name || 'U').substring(0, 2).toUpperCase(),
				lastMessage: c.last_message || '',
				timestamp: new Date(c.last_message_at || c.created_at),
				unread: c.unread_count || 0,
				channel: c.channel_type || 'whatsapp',
				messages: [],
				contactIdentifier: c.contact?.identifier || '',
			}))

			// Filter for Instagram ONLY
			const instagramConvs = convs.filter((c: any) => c.channel === 'instagram')
			setConversations(instagramConvs)
		} catch (error) {
			console.error('Failed to load conversations:', error)
			setConversations([])
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Load messages for selected conversation
	const loadMessages = useCallback(
		async (conversationId: string) => {
			try {
				const data: any = await conversationsApi.getMessages(conversationId)
				const rawMessages = data.results?.messages || data.payload || data.data || []
				const messages = sortMessagesChronologically(
					rawMessages.map((message: any) =>
						toDemoMessage(message, {
							fallbackTimestamp: message?.created_at || Date.now(),
						}),
					),
				)
				setConversations((prev) =>
					prev.map((c) => (c.id === conversationId ? { ...c, messages } : c)),
				)
				if (selectedConversation?.id === conversationId) {
					setSelectedConversation((prev) =>
						prev ? { ...prev, messages } : null,
					)
				}
			} catch (error) {
				console.error('Failed to load messages:', error)
			}
		},
		[selectedConversation?.id],
	)

	// Initialize Socket.io
	useEffect(() => {
		const token = localStorage.getItem('scalechat_token')
		if (!token) return

		const socket = io(API_BASE, {
			auth: { token },
			transports: ['websocket'],
		})

		socket.on('connect', () => {
			console.log('[Socket] Connected')
			socket.emit('join', { appId })
		})

		socket.on('message:created', (data: any) => {
			console.log('[Socket] New message:', data)
			const { message, conversation } = data || {}
			if (!message || !conversation?.id) return

			// Only care about Instagram messages
			if (conversation?.channel_type !== 'instagram') return
			const fallbackSenderLabel =
				toNullableString(message?.sender_id) === String(currentUserIdRef.current)
					? currentUserNameRef.current
					: null
			const incomingMessage = toDemoMessage(message, {
				fallbackTimestamp: message?.created_at || Date.now(),
				fallbackSenderLabel,
			})
			const isViewingConversation =
				selectedConversationIdRef.current === conversation.id

			// Update conversation list
			setConversations((prev) => {
				const existingDefault = prev.find((c) => c.id === conversation?.id)

				if (existingDefault) {
					return prev.map((c) => {
						if (c.id === conversation?.id) {
							// Update existing
							if (
								incomingMessage.type === 'incoming' &&
								(document.hidden || !isViewingConversation)
							) {
								const rawSound = localStorage.getItem('scalechat_sound_enabled')
								const soundEnabled = rawSound === null ? true : rawSound === 'true'
								const rawNotifications = localStorage.getItem(
									'scalechat_notifications_enabled',
								)
								const notificationsEnabled =
									rawNotifications === null ? true : rawNotifications === 'true'

								if (soundEnabled) {
									const audio = new Audio('/sounds/notification.mp3')
									audio.play().catch((e) => console.log('Audio play failed', e))
								}
								if (notificationsEnabled) {
									sendBrowserNotification(
										'New Message',
										incomingMessage.content || 'You have a new message',
									)
								}
								document.title = '(1) New Message - ScaleChat'
							}

							const exists = c.messages.some(
								(m) =>
									m.id === incomingMessage.id ||
									(message.unique_temp_id && m.id === message.unique_temp_id),
							)
							const nextMessages = exists
								? c.messages.map((m) =>
										m.id === incomingMessage.id ||
										(message.unique_temp_id && m.id === message.unique_temp_id)
											? incomingMessage
											: m,
									)
								: [...c.messages, incomingMessage]

							return {
								...c,
								lastMessage: incomingMessage.content || c.lastMessage,
								timestamp: incomingMessage.timestamp,
								unread:
									isViewingConversation || incomingMessage.type !== 'incoming'
										? c.unread
										: c.unread + 1,
								messages: sortMessagesChronologically(nextMessages),
							}
						}
						return c
					})
				}

				loadConversations() // Reload if new conversation
				return prev
			})

			// Update selected conversation if it's the same
			if (selectedConversationIdRef.current === conversation?.id) {
				setSelectedConversation((prev) =>
					prev
						? {
								...prev,
								lastMessage: incomingMessage.content || prev.lastMessage,
								timestamp: incomingMessage.timestamp,
								messages: sortMessagesChronologically(
									(() => {
										const exists = prev.messages.some(
											(m) =>
												m.id === incomingMessage.id ||
												(message.unique_temp_id &&
													m.id === message.unique_temp_id),
										)
										return exists
											? prev.messages.map((m) =>
													m.id === incomingMessage.id ||
													(message.unique_temp_id &&
														m.id === message.unique_temp_id)
														? incomingMessage
														: m,
												)
											: [...prev.messages, incomingMessage]
									})(),
								),
							}
						: null,
				)
			}
		})

		socket.on(
			'message:status_updated',
			(data: {
				message_id?: string
				external_id?: string | null
				conversation_id?: string
				status?: string
				status_at?: string
			}) => {
				const messageId = toNullableString(data?.message_id)
				const conversationId = toNullableString(data?.conversation_id)
				if (!messageId || !conversationId) return

				const nextStatus = normalizeMessageStatus(data?.status)
				const statusAt = toNullableDate(data?.status_at) || new Date()

				setConversations((prev) =>
					prev.map((conversation) => {
						if (conversation.id !== conversationId) return conversation
						let hasChanges = false
						const messages = conversation.messages.map((message) => {
							const matchesById = message.id === messageId
							const matchesByExternalId =
								!!data?.external_id &&
								!!message.externalId &&
								message.externalId === data.external_id
							if (!matchesById && !matchesByExternalId) return message
							hasChanges = true
							return {
								...message,
								status: nextStatus,
								statusAt,
							}
						})

						if (!hasChanges) return conversation
						return {
							...conversation,
							messages: sortMessagesChronologically(messages),
						}
					}),
				)

				setSelectedConversation((prev) => {
					if (!prev || prev.id !== conversationId) return prev
					let hasChanges = false
					const messages = prev.messages.map((message) => {
						const matchesById = message.id === messageId
						const matchesByExternalId =
							!!data?.external_id &&
							!!message.externalId &&
							message.externalId === data.external_id
						if (!matchesById && !matchesByExternalId) return message
						hasChanges = true
						return {
							...message,
							status: nextStatus,
							statusAt,
						}
					})

					if (!hasChanges) return prev
					return {
						...prev,
						messages: sortMessagesChronologically(messages),
					}
				})
			},
		)

		socketRef.current = socket

		return () => {
			socket.disconnect()
		}
	}, [appId, API_BASE, loadConversations])

	// Initial load
	useEffect(() => {
		loadConversations()
	}, [loadConversations])

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [selectedConversation?.messages])

	const handleSelectConversation = async (conv: DemoConversation) => {
		setMobileView('chat')

		try {
			const data: any = await conversationsApi.getMessages(conv.id)
			const rawMessages = data.results?.messages || data.payload || data.data || []
			const messages = sortMessagesChronologically(
				rawMessages.map((message: any) =>
					toDemoMessage(message, {
						fallbackTimestamp: message?.created_at || Date.now(),
						fallbackSenderLabel:
							toNullableString(message?.sender_id) === String(currentUserId)
								? currentUserName
								: null,
					}),
				),
			)
			const updatedConv = { ...conv, messages, unread: 0 }
			setSelectedConversation(updatedConv)
			setConversations((prev) =>
				prev.map((c) => (c.id === conv.id ? updatedConv : c)),
			)
		} catch (error) {
			console.error('Failed to load messages:', error)
			setSelectedConversation({ ...conv, unread: 0 })
		}
	}

	const handleBackToList = () => {
		setMobileView('list')
	}

	const handleSendMessage = async (messageContent?: string) => {
		const content = messageContent || newMessage
		if (!content.trim() || !selectedConversation || isSending) return

		setIsSending(true)
		setShowAiSuggestion(false)

		const tempId = Date.now().toString()
		const newMsg: DemoMessage = {
			id: tempId,
			content: content.trim(),
			type: 'outgoing',
			timestamp: new Date(),
			status: 'sending',
			isAI: !!messageContent,
			contentType: 'text',
			senderType: messageContent ? 'bot' : 'agent',
			senderId: currentUserId || null,
			senderLabel: currentUserName || null,
			statusAt: new Date(),
		}

		// Optimistic update
		const updatedConv = {
			...selectedConversation,
			messages: [...selectedConversation.messages, newMsg],
			lastMessage: content.trim(),
			timestamp: new Date(),
		}

		setSelectedConversation(updatedConv)
		setConversations((prev) =>
			prev.map((c) => (c.id === updatedConv.id ? updatedConv : c)),
		)
		setNewMessage('')

		try {
			await conversationsApi.sendMessage(selectedConversation.id, {
				content: content.trim(),
				message_type: 'outgoing',
			})

			// Success - Socket will likely handle the real message insertion/update
			// But we can update locally to 'sent' just in case
				const sentConv = {
					...updatedConv,
					messages: updatedConv.messages.map((m) =>
						m.id === tempId
							? { ...m, status: 'sent' as const, statusAt: new Date() }
							: m,
					),
				}
			setSelectedConversation(sentConv)
			setConversations((prev) =>
				prev.map((c) => (c.id === sentConv.id ? sentConv : c)),
			)
		} catch (error: any) {
			console.error('Failed to send message:', error)
			toast.error(error?.message || 'Failed to send message')
			// Revert optimistic update — mark message as failed
			setSelectedConversation((prev) => {
				if (!prev) return prev
				return {
					...prev,
					messages: prev.messages.map((m: any) =>
						m.id === tempId ? { ...m, status: 'failed' } : m,
					),
				}
			})
		} finally {
			setIsSending(false)
		}
	}

	const handleRefresh = () => {
		setIsLoading(true)
		loadConversations()
	}

	const handleGenerateAiSuggestion = async () => {
		if (!selectedConversation) return
		setAiSuggestion('Generating suggestion...')
		setShowAiSuggestion(true)
		try {
			const res: any = await aiApi.getSuggestion(selectedConversation.id)
			if (res.suggestion) {
				setAiSuggestion(res.suggestion)
			} else {
				setAiSuggestion('No suggestion available.')
				setTimeout(() => setShowAiSuggestion(false), 2000)
			}
		} catch (error) {
			console.error('AI Error:', error)
			setAiSuggestion('Failed to generate suggestion.')
			setTimeout(() => setShowAiSuggestion(false), 2000)
		}
	}

	const handleUseAiSuggestion = () => {
		setNewMessage(aiSuggestion)
		setShowAiSuggestion(false)
		setAiSuggestion('')
	}

	const selectedMessages = selectedConversation?.messages || []
	const selectedMessageById = useMemo(() => {
		const map = new Map<string, DemoMessage>()
		for (const message of selectedMessages) {
			map.set(message.id, message)
		}
		return map
	}, [selectedMessages])
	const groupedConversationMessages = useMemo(
		() => groupAdjacentMessagesByMinute(selectedMessages),
		[selectedMessages],
	)

	return (
        <div className="flex h-full w-full bg-white flex-col lg:flex-row">
            {/* Left Panel: Conversation List */}
            <div
				className={`w-full md:w-[320px] border-r flex flex-col h-full bg-white ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}
			>
				{/* Header from User Request */}
				<div className="p-4 border-b">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-lg font-semibold flex items-center gap-2">
							<Instagram className="h-5 w-5 text-pink-500" />
							Instagram DMs
						</h3>
						<button
							onClick={handleRefresh}
							className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-gray-100 hover:text-gray-900 rounded-md text-xs h-8 w-8 p-0"
						>
							<RefreshCw
								className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
							/>
						</button>
					</div>
				</div>

				{/* Search */}
				<form className="p-3 border-b" onSubmit={(e) => e.preventDefault()}>
					<div className="relative">
						<input
							className="border-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-9"
							placeholder="Search conversations..."
							value=''
							readOnly
						/>
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					</div>
				</form>

				{/* Conversation List */}
				<div dir="ltr" className="relative overflow-hidden flex-1">
					<div className="h-full w-full overflow-y-auto">
						{conversations.length === 0 ? (
							/* Empty State from User Request */
							(<div
								style={{ minWidth: '100%', display: 'table', height: '100%' }}
							>
                                <div className="p-12 text-center flex flex-col items-center justify-center h-full">
									<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4 text-white">
										<Instagram className="h-8 w-8" />
									</div>
									<p className="text-sm font-medium mb-1">
										No conversations yet
									</p>
									<p className="text-xs text-muted-foreground text-gray-500">
										Conversations will appear when users message you on
										Instagram
									</p>
								</div>
                            </div>)
						) : (
							<div className="divide-y divide-gray-100">
								{conversations.map((conv) => (
									<button
										key={conv.id}
										onClick={() => handleSelectConversation(conv)}
										className={`w-full p-4 text-left hover:bg-gray-50 transition-all ${selectedConversation?.id === conv.id ? 'bg-pink-50 border-l-4 border-pink-500' : ''}`}
									>
										<div className='flex gap-3'>
											<div className="relative flex-shrink-0">
												<div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
													{conv.avatar}
												</div>
												{conv.unread > 0 && (
													<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
														{conv.unread}
													</div>
												)}
											</div>
											<div className='flex-1 min-w-0'>
												<div className="flex items-center justify-between mb-0.5">
													<span
														className={`text-sm font-medium truncate ${conv.unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}
													>
														{conv.name}
													</span>
													<span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
														{formatRelativeTime(conv.timestamp)}
													</span>
												</div>
												<p
													className={`text-xs truncate ${conv.unread > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}
												>
													{conv.lastMessage}
												</p>
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
            {/* Right Panel: Chat View (Simplified for Instagram) */}
            <div
				className={`flex-1 flex-col bg-gray-50 ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}
			>
				{selectedConversation ? (
					<>
						{/* Chat Header */}
						<div className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3 md:gap-4">
									<button
										onClick={handleBackToList}
										className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
									>
										<ArrowLeft className="w-5 h-5" />
									</button>
									<div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base bg-gradient-to-br from-pink-400 to-purple-600">
										{selectedConversation.avatar}
									</div>
									<div>
										<h3 className="font-semibold text-gray-900 text-sm md:text-base">
											{selectedConversation.name}
										</h3>
										<p className="text-xs md:text-sm text-gray-500 flex items-center gap-2">
											<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
												<Instagram className='w-3 h-3' />
												Instagram
											</span>
										</p>
									</div>
								</div>
								<div className="flex items-center gap-1 md:gap-2">
									<button
										onClick={() => setShowCustomerInfo(!showCustomerInfo)}
										className={`hidden xl:flex p-2 rounded-lg transition-colors ${showCustomerInfo ? 'bg-pink-100 text-pink-600' : 'hover:bg-gray-100 text-gray-500'}`}
									>
										<Info className='w-5 h-5' />
									</button>
								</div>
							</div>
						</div>

							{/* Messages */}
							<div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
								{groupedConversationMessages.map((messageGroup) => (
										<div key={messageGroup.id} className="space-y-1.5">
											{messageGroup.messages.map((msg, groupIndex) => {
												const isLastInGroup =
													groupIndex === messageGroup.messages.length - 1
												const repliedMsg = msg.replyToMessageId
													? selectedMessageById.get(msg.replyToMessageId) || null
													: null
												const normalizedSystemContent = msg.content.trim()
												const isAiStatusSystem = isAiStatusSystemMessage(
													normalizedSystemContent,
												)
												const shouldHideSystemMessage =
													msg.type === 'system' &&
													isInternalAiSystemPayload(normalizedSystemContent)
												const aiStatusChipTexts = getAiStatusChipTexts(msg)
												const statusMetaParts: string[] = []

											if (msg.type === 'outgoing') {
												statusMetaParts.push(
													formatTodayTime(msg.statusAt || msg.timestamp),
												)
												if (msg.isAI) {
													if (msg.flowName) statusMetaParts.push(msg.flowName)
													if (msg.aiSource) statusMetaParts.push('AI Source ›')
												} else if (msg.senderLabel) {
													statusMetaParts.push(msg.senderLabel)
												}
											}

											if (msg.type === 'system') {
												if (shouldHideSystemMessage || isAiStatusSystem) return null

												return (
													<div key={msg.id} className="flex justify-center my-3">
														<div className="bg-gray-100 text-gray-500 border border-gray-200 text-xs px-4 py-1.5 rounded-lg shadow-sm font-medium">
															{msg.content}
														</div>
													</div>
												)
											}

												return (
													<div key={msg.id} className="space-y-1.5">
														{aiStatusChipTexts.length > 0 && (
															<div className="space-y-1.5">
																{aiStatusChipTexts.map((chipText, chipIndex) => (
																	<div
																		key={`${msg.id}-ai-status-${chipIndex}`}
																		className="flex justify-center"
																	>
																		<div className="bg-gray-200 text-gray-600 text-xs px-4 py-1.5 rounded-full font-medium">
																			{chipText}
																		</div>
																	</div>
																))}
															</div>
														)}
														<div
															className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'} group relative`}
														>
															<div className="max-w-[88%] md:max-w-[74%] flex items-end gap-2">
														{msg.type === 'outgoing' && repliedMsg ? (
															<Reply className='w-4 h-4 text-[#6b7280] mb-2 scale-x-[-1] shrink-0' />
														) : null}
														<div
															className={`px-3 md:px-4 py-2.5 md:py-3 rounded-2xl ${
																msg.type === 'outgoing'
																	? 'bg-[#1f57c3] text-white rounded-br-md'
																	: 'bg-[#dbe7f8] text-[#111827] rounded-bl-md border border-[#c2d5f1]'
															}`}
														>
															{repliedMsg && (
																<div className="mb-2.5">
																	<p
																		className={`text-[11px] mb-1 ${
																			msg.type === 'outgoing'
																				? 'text-blue-100'
																				: 'text-[#5b6b84]'
																		}`}
																	>
																		{formatTodayTime(
																			repliedMsg.statusAt || repliedMsg.timestamp,
																		)}{' '}
																		•{' '}
																		{getMessageSenderContext(
																			repliedMsg,
																			selectedConversation?.name || 'Customer',
																		)}{' '}
																		•
																	</p>
																	<div className="rounded-xl border border-[#7086aa] bg-[#d7deea] px-3 py-2 text-[#1f2937]">
																		<p className="text-[12px] font-medium text-[#4b5d79]">
																			Replied to:
																		</p>
																		<p className="text-[13px] leading-snug break-words">
																			{getReplyPreviewContent(repliedMsg)}
																		</p>
																	</div>
																</div>
															)}

															{msg.contentType === 'image' ? (
																msg.extras?.media?.url ? (
																	<img
																		src={msg.extras.media.url}
																		alt='Sent image'
																		className='max-w-[240px] max-h-[300px] object-cover rounded-lg'
																	/>
																) : (
																	<div
																		className={`flex items-center gap-2 p-3 rounded-lg ${msg.type === 'outgoing' ? 'bg-blue-600/40' : 'bg-blue-100'}`}
																	>
																		<ImageOff
																			className={`w-5 h-5 ${msg.type === 'outgoing' ? 'text-blue-100' : 'text-blue-500'}`}
																		/>
																		<span
																			className={`text-sm ${msg.type === 'outgoing' ? 'text-blue-100' : 'text-blue-700'}`}
																		>
																			Image unavailable
																		</span>
																	</div>
																)
															) : null}
															{msg.contentType === 'video' ? (
																msg.extras?.media?.url ? (
																	<video controls className='max-w-[240px] rounded-lg'>
																		<source src={msg.extras.media.url} />
																	</video>
																) : (
																	<div
																		className={`flex items-center gap-2 p-3 rounded-lg ${msg.type === 'outgoing' ? 'bg-blue-600/40' : 'bg-blue-100'}`}
																	>
																		<ImageOff
																			className={`w-5 h-5 ${msg.type === 'outgoing' ? 'text-blue-100' : 'text-blue-500'}`}
																		/>
																		<span
																			className={`text-sm ${msg.type === 'outgoing' ? 'text-blue-100' : 'text-blue-700'}`}
																		>
																			Video unavailable
																		</span>
																	</div>
																)
															) : null}
															{msg.contentType === 'audio' ? (
																msg.extras?.media?.url ? (
																	<audio controls className='w-full max-w-[240px]'>
																		<source src={msg.extras.media.url} />
																	</audio>
																) : (
																	<div
																		className={`flex items-center gap-2 p-3 rounded-lg ${msg.type === 'outgoing' ? 'bg-blue-600/40' : 'bg-blue-100'}`}
																	>
																		<Mic
																			className={`w-5 h-5 ${msg.type === 'outgoing' ? 'text-blue-100' : 'text-blue-500'}`}
																		/>
																		<span
																			className={`text-sm ${msg.type === 'outgoing' ? 'text-blue-100' : 'text-blue-700'}`}
																		>
																			Audio unavailable
																		</span>
																	</div>
																)
															) : null}
															{msg.contentType === 'document' ? (
																msg.extras?.media?.url ? (
																	<a
																		href={msg.extras.media.url}
																		target='_blank'
																		rel='noreferrer'
																		className={`inline-flex items-center gap-2 p-2 rounded-lg ${
																			msg.type === 'outgoing'
																				? 'bg-blue-600/40 hover:bg-blue-600/60'
																				: 'bg-blue-100 hover:bg-blue-200'
																		} transition`}
																	>
																		<FileText className='w-4 h-4' />
																		<span className='text-sm truncate max-w-[180px]'>
																			{msg.extras.media.fileName || 'Document'}
																		</span>
																	</a>
																) : (
																	<div
																		className={`flex items-center gap-2 p-3 rounded-lg ${msg.type === 'outgoing' ? 'bg-blue-600/40' : 'bg-blue-100'}`}
																	>
																		<Paperclip
																			className={`w-5 h-5 ${msg.type === 'outgoing' ? 'text-blue-100' : 'text-blue-500'}`}
																		/>
																		<span
																			className={`text-sm ${msg.type === 'outgoing' ? 'text-blue-100' : 'text-blue-700'}`}
																		>
																			Document unavailable
																		</span>
																	</div>
																)
															) : null}
															{(!msg.contentType || msg.contentType === 'text') && (
																<p className="text-sm md:text-[15px] leading-relaxed break-words">
																	{msg.content}
																</p>
															)}

															{msg.type === 'outgoing' &&
																msg.status &&
																isLastInGroup && (
																	<div className="flex items-center gap-1.5 mt-2 text-[12px] justify-end text-[#5d8eed] font-medium">
																		{msg.status === 'sending' && (
																			<Clock className='w-3.5 h-3.5' />
																		)}
																		{msg.status === 'sent' && (
																			<Check className='w-3.5 h-3.5' />
																		)}
																		{msg.status === 'delivered' && (
																			<CheckCheck className='w-3.5 h-3.5' />
																		)}
																		{msg.status === 'read' && (
																			<CheckCheck className='w-3.5 h-3.5 text-[#3d7bff]' />
																		)}
																		{msg.status === 'failed' && (
																			<X className='w-3.5 h-3.5 text-red-300' />
																		)}
																		<span>{getOutgoingStatusLabel(msg.status)}</span>
																		{statusMetaParts.length > 0 && (
																			<span>• {statusMetaParts.join(' • ')}</span>
																		)}
																	</div>
																)}
														</div>
															</div>
														</div>
													</div>
												)
											})}
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>

						{/* Message Input */}
						<div className="bg-white border-t border-gray-100 px-3 md:px-6 py-3 md:py-4">
							<form
								onSubmit={(e) => {
									e.preventDefault()
									handleSendMessage()
								}}
								className="flex items-end gap-2 md:gap-3"
							>
								<button
									type='button'
									onClick={handleGenerateAiSuggestion}
									className="hidden sm:flex p-2.5 hover:bg-purple-50 hover:text-purple-600 rounded-lg text-gray-400 transition-colors"
									title='Generate AI Reply'
								>
									<Sparkles className="w-5 h-5" />
								</button>
								<div className="flex-1 relative">
									<input
										type='text'
										value={newMessage}
										onChange={(e) => setNewMessage(e.target.value)}
										placeholder="Type a message..."
										className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-100 rounded-xl text-sm md:text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white transition-all"
										disabled={isSending}
									/>
								</div>
								<button
									type='submit'
									disabled={isSending || !newMessage.trim()}
									className="p-2.5 md:p-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50"
								>
									<Send className="w-5 h-5" />
								</button>
							</form>
						</div>
					</>
				) : (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center max-w-md">
							<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-pink-50 mb-4 shadow-sm">
								<Instagram className="h-10 w-10 text-pink-600" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Instagram Inbox
							</h3>
							<p className="text-gray-500 mb-6 font-medium">
								Select a conversation to start chatting
							</p>
						</div>
					</div>
				)}
			</div>
            {/* Right Panel: Customer Info (Simplified) */}
            {selectedConversation && showCustomerInfo && (
				<div className="hidden xl:flex w-[340px] border-l border-gray-100 flex-col bg-white">
					<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
						<span className="text-base font-semibold text-gray-700">
							Customer Info
						</span>
						<button
							onClick={() => setShowCustomerInfo(false)}
							className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					</div>
					<div className="flex-1 overflow-y-auto p-6 pt-3">
						<div className="flex items-center gap-4 mb-6">
							<div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
								{selectedConversation.avatar}
							</div>
							<div>
								<h4 className="font-semibold text-gray-900">
									{selectedConversation.name}
								</h4>
								<p className="text-sm text-gray-500">Instagram User</p>
							</div>
						</div>
						<div className="space-y-4">
							<div>
								<p className="text-xs text-gray-500 mb-1">Source</p>
								<div className="flex items-center gap-2">
									<Instagram className="w-4 h-4 text-pink-600" />
									<span className="text-sm font-medium">
										Instagram Direct Message
									</span>
								</div>
							</div>
							<div>
								<p className="text-xs text-gray-500 mb-1">Status</p>
								<span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
									Open
								</span>
							</div>
						</div>
					</div>
				</div>
			)}
        </div>
    )
}
