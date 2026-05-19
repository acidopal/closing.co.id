// My Inbox - Real API Integration
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
	type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import {
	Inbox,
	RefreshCw,
	ChevronDown,
	Users,
	Search,
	MessageSquare,
	Instagram,
	Check,
	User,
	UserX,
	Send,
	Sparkles,
	CheckCheck,
	Clock,
	Bot,
	Zap,
	MoreVertical,
	Smile,
	Paperclip,
	Mic,
	X,
	Edit2,
	ChevronRight,
	UserPlus,
	Info,
	ArrowLeft,
	Plus,
	PanelLeftOpen,
	CheckCircle2,
	Reply,
	FileText,
	Ticket,
	Pin,
	BellOff,
	ClipboardCheck,
	Image,
	ImageOff,
	Download,
	SlidersHorizontal,
	ListChecks,
	MessageCircle,
	Music2,
} from 'lucide-react'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'sonner'
import {
	conversations as conversationsApi,
	contactConversations,
	agents,
	chatbots,
	contacts,
	customers,
	inboxes,
	labels,
	media,
	ai,
	tickets as ticketsApi,
	type ConversationTicketSummary,
	type TicketsSettingsResponse,
	whatsappTemplates,
	API_BASE as API_HTTP_BASE,
} from '@/lib/api'
import { sendBrowserNotification } from '@/lib/notifications'
import { agentsManagement } from '@/lib/agents-api'
import { useAppContext } from '@/routes/_app'
import { ResolveConfirmModal } from '@/components/ResolveConfirmModal'
import { ConversationHistoryList } from '@/components/ConversationHistoryList'
import { AgentAssignmentPanel } from '@/components/AgentAssignmentPanel'
import { ActivityTimeline } from '@/components/ActivityTimeline'
import { TemplateSelector } from '@/components/TemplateSelector'
import { ConversationNotes } from '@/components/ConversationNotes'
import { ConversationLabels } from '@/components/ConversationLabels'
import { ChatRoomActionsMenu } from '@/components/ChatRoomActionsMenu'
import { EditCustomerModal } from '@/components/EditCustomerModal'
import { BlockCustomerModal } from '@/components/BlockCustomerModal'
import { PinChatModal } from '@/components/PinChatModal'
import { MuteNotificationsModal } from '@/components/MuteNotificationsModal'
import { ViewHistoryModal } from '@/components/ViewHistoryModal'
import { ManageLabelsModal } from '@/components/ManageLabelsModal'
import { MergeCustomerModal } from '@/components/MergeCustomerModal'
import { ExportChatModal } from '@/components/ExportChatModal'
import { ReportIssueModal } from '@/components/ReportIssueModal'
import { MediaGalleryModal } from '@/components/MediaGalleryModal'
import { formatChatDate, formatChatTime, formatTodayTime } from '@/lib/timezone'
import {
	getPinnedChats,
	isMuted,
	pinChat,
	unpinChat,
	muteChat,
} from '@/lib/chat-preferences'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const WEBHOOK_MEDIA_PROXY_BASE = API_HTTP_BASE

export const Route = createFileRoute('/_app/chat')({
	component: MyInbox,
	validateSearch: (search: Record<string, unknown>) => {
		const conversationId =
			typeof search.conversation_id === 'string'
				? search.conversation_id
				: typeof search.conversationId === 'string'
					? search.conversationId
					: undefined

		return {
			conversation_id: conversationId,
		}
	},
})

interface ChatMessage {
	id: string
	externalId?: string | null
	content: string
	type: 'incoming' | 'outgoing' | 'system'
	timestamp: Date
	status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
	isAI?: boolean
	contentType?: string
	replyToMessageId?: string | null
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
	contentAttributes?: Record<string, unknown> | null
	extras?: {
		media?: {
			type: string
			url: string
			mimeType?: string
			fileName?: string
		}
	}
}

interface ChatConversation {
	id: string
	name: string
	phone: string
	avatar: string
	avatarImageUrl?: string | null
	lastMessage: string
	timestamp: Date
	unread: number
	channel: 'whatsapp' | 'instagram' | 'tiktok'
	messages: ChatMessage[]
	assigneeId?: string | null
	status?: 'open' | 'resolved' | 'pending'
	contactIdentifier?: string
	contactId?: string // Added this to fix history lookup
	source?: string
	channelBadgeUrl?: string
	channelName?: string
	email?: string
	identifier?: string
	instagramUsername?: string | null
	instagramDisplayName?: string | null
	instagramBio?: string | null
	instagramFollowerCount?: number | null
	instagramIsUserFollowBusiness?: boolean | null
	instagramIsBusinessFollowUser?: boolean | null
	messagingWindowExpiresAt?: Date | null
	isWithinMessagingWindow?: boolean | null
	messagingWindowOpen?: boolean | null
	whatsappWindowExpired?: boolean
	whatsappFollowUpUrl?: string | null
}

type AdditionalFieldType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox'
type SidebarInfoTab = 'info' | 'ticket' | 'orders'

type AdditionalFieldDefinition = {
	id: string
	fieldKey: string
	fieldLabel: string
	fieldType: AdditionalFieldType | string
	options: string[]
	isRequired: boolean
	isVisible: boolean
	displayOrder: number
}

const AI_STATUS_TOOLS_TEXT = 'Successfully executed tool calls'
const AI_STATUS_LABEL_PREFIX = 'Successfully labeled conversation with:'
type SearchableOption = {
	value: string
	label: string
}

type DropdownPlacement = 'top' | 'bottom'

type DropdownPosition = {
	top: number
	left: number
	width: number
	maxHeight: number
	placement: DropdownPlacement
}

function getDropdownPosition(triggerRect: DOMRect): DropdownPosition {
	const viewportHeight = window.innerHeight
	const viewportWidth = window.innerWidth
	const viewportPadding = 8

	const spaceBelow = viewportHeight - triggerRect.bottom - viewportPadding
	const spaceAbove = triggerRect.top - viewportPadding

	const placement: DropdownPlacement =
		spaceBelow < 220 && spaceAbove > spaceBelow ? 'top' : 'bottom'

	const availableHeight =
		placement === 'top'
			? Math.max(140, spaceAbove - 12)
			: Math.max(140, spaceBelow - 12)

	const maxHeight = Math.min(320, availableHeight)
	const width = Math.min(
		Math.max(triggerRect.width, 220),
		viewportWidth - viewportPadding * 2,
	)
	const left = Math.min(
		Math.max(viewportPadding, triggerRect.left),
		viewportWidth - width - viewportPadding,
	)
	const top =
		placement === 'top'
			? Math.max(viewportPadding, triggerRect.top - 4)
			: Math.min(viewportHeight - viewportPadding, triggerRect.bottom + 4)

	return {
		top,
		left,
		width,
		maxHeight,
		placement,
	}
}

function getChannelLabel(channel: ChatConversation['channel']): string {
	switch (channel) {
		case 'whatsapp':
			return 'WhatsApp'
		case 'instagram':
			return 'Instagram'
		case 'tiktok':
			return 'TikTok'
		default:
			return channel
	}
}

function getChannelAvatarGradientClass(channel: ChatConversation['channel']): string {
	switch (channel) {
		case 'whatsapp':
			return 'bg-gradient-to-br from-green-400 to-green-600'
		case 'tiktok':
			return 'bg-black'
		case 'instagram':
		default:
			return 'bg-gradient-to-br from-pink-400 to-purple-600'
	}
}

function getChannelIconBackgroundClass(channel: ChatConversation['channel']): string {
	switch (channel) {
		case 'whatsapp':
			return 'bg-green-500'
		case 'tiktok':
			return 'bg-black'
		case 'instagram':
		default:
			return 'bg-gradient-to-br from-pink-500 to-purple-500'
	}
}

function getUnreadBadgeClass(channel: ChatConversation['channel']): string {
	switch (channel) {
		case 'instagram':
			return 'bg-gradient-to-r from-purple-500 to-pink-500'
		case 'tiktok':
			return 'bg-black'
		case 'whatsapp':
		default:
			return 'bg-blue-600'
	}
}

function renderChannelIcon(channel: ChatConversation['channel'], className: string) {
	switch (channel) {
		case 'whatsapp':
			return <MessageSquare className={className} />
		case 'tiktok':
			return <Music2 className={className} />
		case 'instagram':
		default:
			return <Instagram className={className} />
	}
}

function getConversationSourceLabel(conversation: ChatConversation): string {
	if (conversation.channel === 'whatsapp') {
		return conversation.source || 'Organic'
	}
	if (conversation.channel === 'tiktok') {
		return 'TikTok DM'
	}
	return 'Instagram DM'
}

type WhatsAppTemplateOption = {
	id: string
	name: string
	language: string
	components: any[]
}

type BulkEditFormState = {
	collaboratorIds: string[]
	handledById: string
	labelId: string
	pipelineStageId: string
	resolveStatus: '' | 'open' | 'pending' | 'resolved'
}

const EMPTY_BULK_EDIT_FORM: BulkEditFormState = {
	collaboratorIds: [],
	handledById: '',
	labelId: '',
	pipelineStageId: '',
	resolveStatus: '',
}

type SearchableSingleSelectProps = {
	value: string
	options: SearchableOption[]
	placeholder: string
	onChange: (nextValue: string) => void
}

function SearchableSingleSelect({
	value,
	options,
	placeholder,
	onChange,
}: SearchableSingleSelectProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [query, setQuery] = useState('')
	const containerRef = useRef<HTMLDivElement | null>(null)
	const triggerRef = useRef<HTMLButtonElement | null>(null)
	const dropdownRef = useRef<HTMLDivElement | null>(null)
	const inputRef = useRef<HTMLInputElement | null>(null)
	const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(
		null,
	)
	const canUseDom = typeof window !== 'undefined' && typeof document !== 'undefined'

	const selectedLabel =
		options.find((option) => option.value === value)?.label || placeholder
	const normalizedQuery = query.trim().toLowerCase()
	const filteredOptions = options.filter((option) =>
		option.label.toLowerCase().includes(normalizedQuery),
	)

	const updateDropdownPosition = useCallback(() => {
		if (!triggerRef.current || !canUseDom) return
		setDropdownPosition(getDropdownPosition(triggerRef.current.getBoundingClientRect()))
	}, [canUseDom])

	useEffect(() => {
		if (!isOpen) return

		const handleClickOutside = (event: MouseEvent) => {
			const targetNode = event.target as Node
			if (!containerRef.current) return
			if (
				containerRef.current.contains(targetNode) ||
				dropdownRef.current?.contains(targetNode)
			) {
				return
			}
			setIsOpen(false)
			setQuery('')
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isOpen])

	useEffect(() => {
		if (!isOpen || !canUseDom) {
			setDropdownPosition(null)
			return
		}

		updateDropdownPosition()
		const handleViewportUpdate = () => updateDropdownPosition()

		window.addEventListener('resize', handleViewportUpdate)
		window.addEventListener('scroll', handleViewportUpdate, true)
		return () => {
			window.removeEventListener('resize', handleViewportUpdate)
			window.removeEventListener('scroll', handleViewportUpdate, true)
		}
	}, [canUseDom, isOpen, updateDropdownPosition])

	useEffect(() => {
		if (!isOpen) return
		const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
		return () => window.clearTimeout(timer)
	}, [isOpen])

	const dropdownStyle: CSSProperties | undefined = dropdownPosition
		? {
				position: 'fixed',
				left: dropdownPosition.left,
				top: dropdownPosition.top,
				width: dropdownPosition.width,
				zIndex: 140,
				transform:
					dropdownPosition.placement === 'top' ? 'translateY(-100%)' : undefined,
			}
		: undefined

	const dropdown = isOpen && canUseDom && dropdownPosition && (
		<div
			ref={dropdownRef}
			style={dropdownStyle}
			className="rounded-lg border border-gray-200 bg-white p-1 shadow-xl"
		>
			<div className="relative border-b border-gray-100 p-1">
				<Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search..."
					className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-sm focus:border-blue-500 focus:outline-none"
				/>
			</div>
			<div className="overflow-y-auto py-1" style={{ maxHeight: dropdownPosition.maxHeight }}>
				{filteredOptions.length === 0 ? (
					<div className="px-3 py-2 text-sm text-gray-500">No options found</div>
				) : (
					filteredOptions.map((option) => {
						const isSelected = value === option.value
						return (
							<button
								key={option.value}
								type="button"
								onClick={() => {
									onChange(option.value)
									setIsOpen(false)
									setQuery('')
								}}
								className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
									isSelected
										? 'bg-blue-50 text-blue-700'
										: 'text-gray-700 hover:bg-gray-50'
								}`}
							>
								<span className="truncate">{option.label}</span>
								{isSelected && <Check className="ml-auto h-4 w-4 shrink-0" />}
							</button>
						)
					})
				)}
			</div>
		</div>
	)

	return (
		<div className="relative" ref={containerRef}>
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 px-3 py-2 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<span className="truncate">{selectedLabel}</span>
				<ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
			</button>

			{dropdown && createPortal(dropdown, document.body)}
		</div>
	)
}

type SearchableMultiSelectProps = {
	values: string[]
	options: SearchableOption[]
	placeholder: string
	onChange: (nextValues: string[]) => void
}

function SearchableMultiSelect({
	values,
	options,
	placeholder,
	onChange,
}: SearchableMultiSelectProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [query, setQuery] = useState('')
	const containerRef = useRef<HTMLDivElement | null>(null)
	const triggerRef = useRef<HTMLButtonElement | null>(null)
	const dropdownRef = useRef<HTMLDivElement | null>(null)
	const inputRef = useRef<HTMLInputElement | null>(null)
	const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(
		null,
	)
	const canUseDom = typeof window !== 'undefined' && typeof document !== 'undefined'

	const selectedLabels = options
		.filter((option) => values.includes(option.value))
		.map((option) => option.label)

	const triggerLabel =
		selectedLabels.length === 0
			? placeholder
			: selectedLabels.length <= 2
				? selectedLabels.join(', ')
				: `${selectedLabels.length} selected`

	const normalizedQuery = query.trim().toLowerCase()
	const filteredOptions = options.filter((option) =>
		option.label.toLowerCase().includes(normalizedQuery),
	)

	const updateDropdownPosition = useCallback(() => {
		if (!triggerRef.current || !canUseDom) return
		setDropdownPosition(getDropdownPosition(triggerRef.current.getBoundingClientRect()))
	}, [canUseDom])

	useEffect(() => {
		if (!isOpen) return

		const handleClickOutside = (event: MouseEvent) => {
			const targetNode = event.target as Node
			if (!containerRef.current) return
			if (
				containerRef.current.contains(targetNode) ||
				dropdownRef.current?.contains(targetNode)
			) {
				return
			}
			setIsOpen(false)
			setQuery('')
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isOpen])

	useEffect(() => {
		if (!isOpen || !canUseDom) {
			setDropdownPosition(null)
			return
		}

		updateDropdownPosition()
		const handleViewportUpdate = () => updateDropdownPosition()

		window.addEventListener('resize', handleViewportUpdate)
		window.addEventListener('scroll', handleViewportUpdate, true)
		return () => {
			window.removeEventListener('resize', handleViewportUpdate)
			window.removeEventListener('scroll', handleViewportUpdate, true)
		}
	}, [canUseDom, isOpen, updateDropdownPosition])

	useEffect(() => {
		if (!isOpen) return
		const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
		return () => window.clearTimeout(timer)
	}, [isOpen])

	const toggleValue = (nextValue: string) => {
		if (values.includes(nextValue)) {
			onChange(values.filter((valueItem) => valueItem !== nextValue))
			return
		}
		onChange([...values, nextValue])
	}

	const dropdownStyle: CSSProperties | undefined = dropdownPosition
		? {
				position: 'fixed',
				left: dropdownPosition.left,
				top: dropdownPosition.top,
				width: dropdownPosition.width,
				zIndex: 140,
				transform:
					dropdownPosition.placement === 'top' ? 'translateY(-100%)' : undefined,
			}
		: undefined

	const dropdown = isOpen && canUseDom && dropdownPosition && (
		<div
			ref={dropdownRef}
			style={dropdownStyle}
			className="rounded-lg border border-gray-200 bg-white p-1 shadow-xl"
		>
			<div className="relative border-b border-gray-100 p-1">
				<Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search..."
					className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-sm focus:border-blue-500 focus:outline-none"
				/>
			</div>
			<div className="flex items-center justify-between px-2 py-1 text-xs text-gray-500">
				<span>{values.length} selected</span>
				<button
					type="button"
					onClick={() => onChange([])}
					className="font-medium text-blue-600 hover:text-blue-700"
				>
					Clear
				</button>
			</div>
			<div className="overflow-y-auto py-1" style={{ maxHeight: dropdownPosition.maxHeight }}>
				{filteredOptions.length === 0 ? (
					<div className="px-3 py-2 text-sm text-gray-500">No options found</div>
				) : (
					filteredOptions.map((option) => {
						const isSelected = values.includes(option.value)
						return (
							<button
								key={option.value}
								type="button"
								onClick={() => toggleValue(option.value)}
								className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
									isSelected
										? 'bg-blue-50 text-blue-700'
										: 'text-gray-700 hover:bg-gray-50'
								}`}
							>
								<span
									className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
										isSelected
											? 'border-blue-600 bg-blue-600 text-white'
											: 'border-gray-300 bg-white'
									}`}
								>
									{isSelected ? <Check className="h-3 w-3" /> : null}
								</span>
								<span className="truncate">{option.label}</span>
							</button>
						)
					})
				)}
			</div>
		</div>
	)

	return (
		<div className="relative" ref={containerRef}>
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 px-3 py-2 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<span className="truncate">{triggerLabel}</span>
				<ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
			</button>

			{dropdown && createPortal(dropdown, document.body)}
		</div>
	)
}

const ADDITIONAL_FIELD_TYPE_OPTIONS: Array<{
	label: string
	value: AdditionalFieldType
}> = [
	{ label: 'Text', value: 'text' },
	{ label: 'Number', value: 'number' },
	{ label: 'Select Options', value: 'dropdown' },
	{ label: 'Date', value: 'date' },
	{ label: 'True or False', value: 'checkbox' },
]

function getMessageTimestamp(message: ChatMessage) {
	const value =
		message.timestamp instanceof Date
			? message.timestamp.getTime()
			: new Date(message.timestamp).getTime()
	return Number.isFinite(value) ? value : 0
}

function dedupeMessages(messages: ChatMessage[]) {
	const seenIds = new Set<string>()
	const seenExternalIds = new Set<string>()

	return messages.filter((message) => {
		if (seenIds.has(message.id)) return false
		seenIds.add(message.id)

		const externalId = String(message.externalId || '').trim()
		if (externalId) {
			if (seenExternalIds.has(externalId)) return false
			seenExternalIds.add(externalId)
		}

		return true
	})
}

function sortMessagesChronologically(messages: ChatMessage[]) {
	return dedupeMessages(messages)
		.map((message, index) => ({ message, index }))
		.sort((a, b) => {
			const timeDiff =
				getMessageTimestamp(a.message) - getMessageTimestamp(b.message)
			if (timeDiff !== 0) return timeDiff
			return a.index - b.index
		})
		.map(({ message }) => message)
}

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
	if (typeof value === 'string' && value.trim().length > 0) {
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

function normalizeMessageContent(message: any): string {
	const rawContent = message?.message ?? message?.content
	if (typeof rawContent === 'string') return rawContent
	if (rawContent == null) return ''
	try {
		return JSON.stringify(rawContent)
	} catch {
		return String(rawContent)
	}
}

function normalizeMessageStatus(rawStatus: unknown): ChatMessage['status'] {
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

function resolveMessageMetaLayers(message: any) {
	const metadata = toRecord(message?.metadata)
	const contentAttributes = toRecord(
		message?.content_attributes ?? message?.contentAttributes,
	)
	const additionalAttributes = toRecord(
		message?.additional_attributes ?? message?.additionalAttributes,
	)
	const extras = toRecord(message?.extras)

	return [metadata, contentAttributes, additionalAttributes, extras]
}

function resolveFlowNameFromLayers(
	layers: Array<Record<string, any> | null | undefined>,
): string | null {
	const directFlow = pickFirstStringFromLayers(layers, [
		'flow_name',
		'flowName',
		'automation_flow_name',
		'automationFlowName',
		'flow.name',
		'flow.display_name',
	])
	if (directFlow) return directFlow

	for (const layer of layers) {
		if (!layer) continue
		const flowObject = toRecord(layer.flow) || toRecord(layer.flow_info)
		if (!flowObject) continue
		const fromObject =
			toNullableString(flowObject.name) ||
			toNullableString(flowObject.display_name) ||
			toNullableString(flowObject.title)
		if (fromObject) return fromObject
	}

	return null
}

function resolveAiSourceFromLayers(
	layers: Array<Record<string, any> | null | undefined>,
): string | null {
	return pickFirstStringFromLayers(layers, [
		'ai_source',
		'aiSource',
		'ai.source',
		'ai.source_name',
		'source_name',
		'model_source',
		'modelSource',
	])
}

function toChatMessage(
	message: any,
	options?: {
		fallbackTimestamp?: unknown
		fallbackSenderLabel?: string | null
	},
): ChatMessage {
	const contentAttributes = toRecord(
		message?.content_attributes ?? message?.contentAttributes,
	)
	const senderType = toNullableString(
		message?.sender_type ?? message?.senderType,
	)
	const senderId = toNullableString(message?.sender_id ?? message?.senderId)
	const senderInfo = toRecord(message?.sender)
	const senderExtras = toRecord(senderInfo?.user_extras)
	const layers = resolveMessageMetaLayers(message)

	const flowName = resolveFlowNameFromLayers(layers)
	const aiSource = resolveAiSourceFromLayers(layers)
	const isAIFlag = pickFirstBooleanFromLayers(layers, [
		'is_ai',
		'isAI',
		'ai_generated',
		'aiGenerated',
		'generated_by_ai',
		'generatedByAI',
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

	const isAI =
		isAIFlag === true ||
		senderType === 'bot' ||
		senderExtras?.type === 'bot' ||
		(flowName !== null && flowName.length > 0)

	const messageTypeRaw = String(message?.message_type || '').toLowerCase()
	const type: ChatMessage['type'] =
		messageTypeRaw === 'system'
			? 'system'
			: messageTypeRaw === 'incoming'
				? 'incoming'
				: 'outgoing'

	const statusAt =
		toNullableDate(message?.status_at ?? message?.statusAt) ||
		pickFirstDateFromLayers(layers, [
			'status_at',
			'statusAt',
			'delivered_at',
			'deliveredAt',
			'read_at',
			'readAt',
		]) ||
		null

	return {
		id: message?.id || `msg-${Date.now()}`,
		externalId: message?.external_id || message?.externalId || null,
		content: normalizeMessageContent(message),
		type,
		timestamp: new Date(
			(options?.fallbackTimestamp as any) || message?.created_at || Date.now(),
		),
		status: normalizeMessageStatus(message?.status),
		isAI,
		contentType: normalizeContentType(
			message?.content_type || message?.contentType,
		),
		replyToMessageId:
			message?.reply_to_message_id || message?.replyToMessageId || null,
		senderType,
		senderId,
		statusAt,
		senderLabel,
		flowName,
		aiSource,
		aiStatusEnabled,
		aiToolsCalled,
		aiLabelApplied,
		aiStatusToolsText,
		aiStatusLabelText,
		aiCreditsUsed,
		contentAttributes,
		extras: normalizeMessageExtras(message),
	}
}

function getMessageGroupingClass(message: ChatMessage): string {
	if (message.type === 'system') return 'system'
	if (message.type === 'incoming') return 'incoming-contact'
	return message.isAI ? 'outgoing-ai' : 'outgoing-agent'
}

function getMessageMinuteBucket(message: ChatMessage): string {
	return `${formatChatDate(message.timestamp)}|${formatChatTime(message.timestamp)}`
}

function groupAdjacentMessagesByMinute(messages: ChatMessage[]) {
	const groups: Array<{ id: string; messages: ChatMessage[] }> = []

	for (const message of messages) {
		const previousGroup = groups[groups.length - 1]
		const previousMessage =
			previousGroup?.messages[previousGroup.messages.length - 1]
		const canGroup =
			Boolean(previousMessage) &&
			message.type !== 'system' &&
			previousMessage.type !== 'system' &&
			getMessageGroupingClass(previousMessage) ===
				getMessageGroupingClass(message) &&
			getMessageMinuteBucket(previousMessage) ===
				getMessageMinuteBucket(message)

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

function getOutgoingStatusLabel(status: ChatMessage['status']): string {
	if (status === 'sending') return 'Sending'
	if (status === 'sent') return 'Sent'
	if (status === 'delivered') return 'Delivered'
	if (status === 'read') return 'Read'
	if (status === 'failed') return 'Failed'
	return 'Sent'
}

function getMessageSenderContext(
	message: ChatMessage,
	conversationName: string,
): string {
	if (message.type === 'system') return 'system'
	if (message.type === 'incoming') return conversationName
	if (message.isAI) return 'ai'
	return 'agent'
}

function getReplyPreviewContent(message: ChatMessage): string {
	const plain = toNullableString(message.content)
	if (plain) return plain
	const contentType = toNullableString(message.contentType)
	return contentType ? `[${contentType}]` : '[Message]'
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
	return (
		role === 'assistant' &&
		typeof content === 'string' &&
		content.trim().length > 0
	)
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
	return (
		content === AI_STATUS_TOOLS_TEXT ||
		content.startsWith(AI_STATUS_LABEL_PREFIX)
	)
}

function getAiStatusChipTexts(message: ChatMessage): string[] {
	if (message.type !== 'outgoing' || !message.isAI) return []

	const chips: string[] = []
	const toolsText = toNullableString(message.aiStatusToolsText)
	const hasToolsCount =
		typeof message.aiToolsCalled === 'number' &&
		Number.isFinite(message.aiToolsCalled)
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

function normalizeAiSummaryPoints(raw: string): string[] {
	const points: string[] = []
	const seen = new Set<string>()
	const lines = raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((line) => !/^ai\s+summary[:\s-]*/i.test(line))

	const pushPoint = (value: string | null) => {
		const normalized = toNullableString(value)
		if (!normalized || seen.has(normalized)) return
		seen.add(normalized)
		points.push(normalized)
	}

	for (const line of lines) {
		const bullet = line.match(/^[-*•]\s+(.+)$/)
		if (bullet && bullet[1]) {
			pushPoint(bullet[1])
			continue
		}

		const labeled = line.match(
			/^(Intent|Detail Penting|Status|Next Action)\s*:\s*(.+)$/i,
		)
		if (labeled && labeled[2]) {
			pushPoint(labeled[2])
		}
	}

	if (points.length > 0) return points

	for (const line of lines) {
		pushPoint(line)
	}
	return points.slice(0, 5)
}

function extractAiSummaryPoints(message: ChatMessage): string[] {
	const attributes = toRecord(message.contentAttributes)
	const fromAttributes = Array.isArray(attributes?.summary_points)
		? attributes.summary_points
				.map((value) => toNullableString(value))
				.filter((value): value is string => Boolean(value))
		: []
	if (fromAttributes.length > 0) return fromAttributes.slice(0, 5)

	return normalizeAiSummaryPoints(message.content || '').slice(0, 5)
}

function isAiSummaryMessage(message: ChatMessage): boolean {
	const attributes = toRecord(message.contentAttributes)
	const attrFlag =
		attributes?.ai_summary === true ||
		toNullableString(attributes?.source)?.toLowerCase() === 'ai_summary'
	if (attrFlag) return true

	const normalizedContent = (message.content || '').trim()
	if (/^ai\s+summary[:\s-]*/i.test(normalizedContent)) return true

	if (message.type !== 'system' && message.senderType !== 'system') return false
	return /^[-*•]\s+/m.test(normalizedContent)
}

function normalizeAiAgentLabel(raw: string | null | undefined): string | null {
	const label = toNullableString(raw)
	if (!label) return null

	if (label.startsWith(AI_STATUS_LABEL_PREFIX)) {
		const extracted = toNullableString(
			label.slice(AI_STATUS_LABEL_PREFIX.length).trim(),
		)
		return extracted
	}

	if (label.toLowerCase().startsWith('ai agent:')) {
		const extracted = toNullableString(label.slice('ai agent:'.length).trim())
		return extracted
	}

	return label
}

function resolveAiAgentName(message: ChatMessage): string | null {
	return (
		normalizeAiAgentLabel(message.aiSource) ||
		normalizeAiAgentLabel(message.flowName) ||
		normalizeAiAgentLabel(message.aiLabelApplied) ||
		normalizeAiAgentLabel(message.aiStatusLabelText) ||
		(message.senderType === 'bot'
			? normalizeAiAgentLabel(message.senderLabel)
			: null)
	)
}

function extractAiAgentNameFromSystemContent(
	content: string | null | undefined,
): string | null {
	const normalized = toNullableString(content)
	if (!normalized) return null
	const lower = normalized.toLowerCase()
	if (
		normalized.startsWith(AI_STATUS_LABEL_PREFIX) ||
		lower.startsWith('ai agent:')
	) {
		return normalizeAiAgentLabel(normalized)
	}
	return null
}

function isSystemMessage(message: ChatMessage): boolean {
	return (
		message.type === 'system' ||
		message.content.includes('24-hour free entry point') ||
		message.content.includes('This conversation has expired')
	)
}

function formatInstagramHandle(
	value: string | null | undefined,
): string | null {
	const normalized = toNullableString(value)
	if (!normalized) return null
	return normalized.startsWith('@') ? normalized : `@${normalized}`
}

function getAvatarInitials(rawName: string | null | undefined): string {
	const normalized = toNullableString(rawName)
	if (!normalized) return 'U'
	const noAt = normalized.replace(/^@+/, '')
	return noAt.substring(0, 2).toUpperCase()
}

function extractInstagramProfile(contact: any) {
	const metadata = {
		...(toRecord(contact?.metadata) || {}),
		...(toRecord(contact?.meta) || {}),
	}
	const username =
		toNullableString(metadata.instagram_username) ||
		toNullableString(metadata.username) ||
		null
	const displayName =
		toNullableString(metadata.instagram_display_name) ||
		toNullableString(metadata.name) ||
		null
	const bio =
		toNullableString(metadata.instagram_bio) ||
		(toNullableString(displayName) &&
		username &&
		displayName?.toLowerCase() !== username?.toLowerCase()
			? displayName
			: null)
	const profilePictureUrl =
		toNullableString(contact?.avatar_url) ||
		toNullableString(metadata.instagram_profile_picture_url) ||
		toNullableString(metadata.profile_pic) ||
		toNullableString(metadata.profile_picture_url) ||
		null
	const followerCount =
		toNullableNumber(metadata.instagram_follower_count) ??
		toNullableNumber(metadata.follower_count)
	const isUserFollowBusiness =
		toNullableBoolean(metadata.instagram_is_user_follow_business) ??
		toNullableBoolean(metadata.is_user_follow_business) ??
		toNullableBoolean(metadata.is_user_follow_user)
	const isBusinessFollowUser =
		toNullableBoolean(metadata.instagram_is_business_follow_user) ??
		toNullableBoolean(metadata.is_business_follow_user)

	return {
		username,
		displayName,
		bio,
		profilePictureUrl,
		followerCount,
		isUserFollowBusiness,
		isBusinessFollowUser,
	}
}

function normalizeMessageExtras(
	message: any,
): ChatMessage['extras'] | undefined {
	const asObject = (value: unknown): Record<string, any> | null => {
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

	const normalizeMediaUrl = (rawUrl?: string) => {
		if (!rawUrl) return rawUrl
		const protectedMetaUrl =
			rawUrl.includes('lookaside.fbsbx.com') ||
			rawUrl.includes('graph.facebook.com')
		if (protectedMetaUrl && message?.id) {
			return `${WEBHOOK_MEDIA_PROXY_BASE}/webhooks/whatsapp/media/${message.id}`
		}
		return rawUrl
	}

	const explicitExtras = asObject(message?.extras)
	const contentAttributes = asObject(
		message?.content_attributes ?? message?.contentAttributes,
	)
	const rawPayload = asObject(message?.raw_payload ?? message?.rawPayload)
	const contentType = message?.content_type || message?.contentType

	if (explicitExtras?.media?.url) {
		return {
			media: {
				type: explicitExtras.media.type || contentType || 'document',
				url: normalizeMediaUrl(explicitExtras.media.url),
				mimeType:
					explicitExtras.media.mimeType || explicitExtras.media.mime_type,
				fileName:
					explicitExtras.media.fileName ||
					explicitExtras.media.file_name ||
					explicitExtras.media.filename,
			},
		}
	}

	const attrsMedia =
		asObject(contentAttributes?.media) ||
		asObject(contentAttributes?.[String(contentType || '')]) ||
		asObject(contentAttributes?.raw) ||
		asObject(contentAttributes?.file)
	const payloadMedia =
		asObject(rawPayload?.[String(contentType || '')]) ||
		asObject(rawPayload?.media) ||
		asObject(rawPayload?.file)

	const mediaId =
		attrsMedia?.id ||
		attrsMedia?.media_id ||
		explicitExtras?.media?.id ||
		payloadMedia?.id ||
		payloadMedia?.media_id
	const mediaUrl =
		attrsMedia?.url ||
		attrsMedia?.media_url ||
		attrsMedia?.link ||
		payloadMedia?.url ||
		payloadMedia?.media_url ||
		payloadMedia?.link
	const mediaMimeType =
		attrsMedia?.mimeType ||
		attrsMedia?.mime_type ||
		payloadMedia?.mimeType ||
		payloadMedia?.mime_type ||
		explicitExtras?.media?.mimeType ||
		explicitExtras?.media?.mime_type
	const mediaFileName =
		attrsMedia?.fileName ||
		attrsMedia?.file_name ||
		attrsMedia?.filename ||
		payloadMedia?.fileName ||
		payloadMedia?.file_name ||
		payloadMedia?.filename ||
		explicitExtras?.media?.fileName ||
		explicitExtras?.media?.file_name ||
		explicitExtras?.media?.filename
	const mediaType =
		attrsMedia?.type ||
		payloadMedia?.type ||
		explicitExtras?.media?.type ||
		contentType ||
		'document'

	if (mediaUrl) {
		return {
			media: {
				type: mediaType,
				url: normalizeMediaUrl(mediaUrl),
				mimeType: mediaMimeType,
				fileName: mediaFileName,
			},
		}
	}

	if (mediaId && message?.id) {
		return {
			media: {
				type: mediaType,
				url: `${WEBHOOK_MEDIA_PROXY_BASE}/webhooks/whatsapp/media/${message.id}`,
				mimeType: mediaMimeType,
				fileName: mediaFileName,
			},
		}
	}

	return undefined
}

const WHATSAPP_FREE_WINDOW_EXPIRED = 'WHATSAPP_FREE_WINDOW_EXPIRED'
const CONVERSATIONS_PAGE_SIZE = 10

type SendMessageError = Error & {
	code?: string
	followUpUrl?: string
}

function normalizePhoneForWaMe(
	value: string | null | undefined,
): string | null {
	if (typeof value !== 'string') return null

	const trimmed = value.trim()
	if (!trimmed) return null

	let normalized = trimmed.replace(/[^\d+]/g, '')
	if (normalized.startsWith('+')) normalized = normalized.slice(1)
	if (normalized.startsWith('00')) normalized = normalized.slice(2)
	if (normalized.startsWith('0')) normalized = `62${normalized.slice(1)}`

	const digitsOnly = normalized.replace(/\D/g, '')
	if (digitsOnly.length < 8) return null

	return digitsOnly
}

function buildWaMeFollowUpUrl(value: string | null | undefined): string | null {
	const phone = normalizePhoneForWaMe(value)
	if (!phone) return null
	return `https://wa.me/${phone}`
}

function getTemplateBodyPreview(components: any[]): string {
	if (!Array.isArray(components)) return ''
	const body = components.find(
		(component: any) => String(component?.type || '').toUpperCase() === 'BODY',
	)
	if (!body || typeof body.text !== 'string') return ''
	return body.text
}

function normalizeAdditionalField(
	field: any,
): AdditionalFieldDefinition | null {
	const fieldKey = toNullableString(field?.fieldKey ?? field?.field_key)
	const fieldLabel = toNullableString(field?.fieldLabel ?? field?.field_label)
	if (!fieldKey || !fieldLabel) return null

	const fieldType =
		toNullableString(field?.fieldType ?? field?.field_type) || 'text'
	const options = Array.isArray(field?.options)
		? field.options.filter((option: unknown) => typeof option === 'string')
		: []

	return {
		id: String(field?.id || fieldKey),
		fieldKey,
		fieldLabel,
		fieldType,
		options,
		isRequired: field?.isRequired === true || field?.is_required === true,
		isVisible: field?.isVisible !== false && field?.is_visible !== false,
		displayOrder:
			typeof field?.displayOrder === 'number'
				? field.displayOrder
				: typeof field?.display_order === 'number'
					? field.display_order
					: 0,
	}
}

function normalizeAdditionalFieldValue(
	fieldType: string,
	value: unknown,
): string | number | boolean | null {
	switch (fieldType) {
		case 'number': {
			if (value === null || value === undefined || value === '') return null
			const parsed = Number(value)
			return Number.isFinite(parsed) ? parsed : null
		}
		case 'checkbox': {
			if (typeof value === 'boolean') return value
			if (typeof value === 'string') {
				const lowered = value.trim().toLowerCase()
				if (lowered === 'true') return true
				if (lowered === 'false') return false
			}
			return null
		}
		case 'date': {
			if (value === null || value === undefined || value === '') return null
			if (value instanceof Date && !Number.isNaN(value.getTime())) {
				return value.toISOString().slice(0, 10)
			}
			const raw = String(value).trim()
			if (!raw) return null
			if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
			const parsed = new Date(raw)
			if (Number.isNaN(parsed.getTime())) return null
			return parsed.toISOString().slice(0, 10)
		}
		default: {
			if (value === null || value === undefined) return null
			const text = String(value).trim()
			return text.length > 0 ? text : null
		}
	}
}

function formatDateValueForInput(value: unknown): string {
	const normalized = normalizeAdditionalFieldValue('date', value)
	return typeof normalized === 'string' ? normalized : ''
}

function parseDropdownOptions(value: string): string[] {
	return value
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean)
}

function buildAdditionalInfoPayload(
	fields: AdditionalFieldDefinition[],
	values: Record<string, unknown>,
): Record<string, unknown> {
	return fields.reduce<Record<string, unknown>>((acc, field) => {
		acc[field.fieldKey] = normalizeAdditionalFieldValue(
			field.fieldType,
			values[field.fieldKey],
		)
		return acc
	}, {})
}

function isAdditionalInfoPayloadEqual(
	left: Record<string, unknown>,
	right: Record<string, unknown>,
): boolean {
	const keys = new Set([...Object.keys(left), ...Object.keys(right)])
	for (const key of keys) {
		const leftValue = left[key] ?? null
		const rightValue = right[key] ?? null
		if (leftValue !== rightValue) return false
	}
	return true
}

function formatTicketDealValue(value: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0,
	}).format(Number.isFinite(value) ? value : 0)
}

function formatTicketTimestamp(value: string | null): string {
	if (!value) return '-'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return '-'
	return date.toLocaleString('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

function MyInbox() {
	const { conversation_id: preselectedConversationId } = Route.useSearch()
	const navigate = useNavigate()
	const { toggleSidebar, appId } = useAppContext()

	// State
	const [conversations, setConversations] = useState<ChatConversation[]>([])
	const [selectedConversation, setSelectedConversation] =
		useState<ChatConversation | null>(null)
	const [newMessage, setNewMessage] = useState('')
	const [isSending, setIsSending] = useState(false)
	const [isGeneratingAiSuggestion, setIsGeneratingAiSuggestion] =
		useState(false)
	const [isTyping, setIsTyping] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [additionalFields, setAdditionalFields] = useState<
		AdditionalFieldDefinition[]
	>([])
	const [additionalInfoValues, setAdditionalInfoValues] = useState<
		Record<string, unknown>
	>({})
	const [isLoadingAdditionalFields, setIsLoadingAdditionalFields] =
		useState(false)
	const [isLoadingAdditionalInfo, setIsLoadingAdditionalInfo] = useState(false)
	const [savedAdditionalInfoValues, setSavedAdditionalInfoValues] = useState<
		Record<string, unknown>
	>({})
	const [isSavingAdditionalInfo, setIsSavingAdditionalInfo] = useState(false)
	const [isAdditionalDataExpanded, setIsAdditionalDataExpanded] =
		useState(false)
	const [showAddAdditionalInfoModal, setShowAddAdditionalInfoModal] =
		useState(false)
	const [newAdditionalFieldName, setNewAdditionalFieldName] = useState('')
	const [newAdditionalFieldType, setNewAdditionalFieldType] =
		useState<AdditionalFieldType>('text')
	const [newAdditionalFieldOptions, setNewAdditionalFieldOptions] = useState('')
	const [isCreatingAdditionalField, setIsCreatingAdditionalField] =
		useState(false)
	const [agentSettings, setAgentSettings] = useState<any>(null)
	const [conversationAgents, setConversationAgents] = useState<any[]>([])
	const [conversationActivity, setConversationActivity] = useState<any[]>([])
	const [availableAgents, setAvailableAgents] = useState<any[]>([])
	const [currentUserRole, setCurrentUserRole] = useState<
		'agent' | 'supervisor' | 'admin'
	>('agent')
	const [currentUserId, setCurrentUserId] = useState<string>('')
	const [currentUserName, setCurrentUserName] = useState<string>('')
	const [showAgentSelector, setShowAgentSelector] = useState(false)
	const [showTemplateModal, setShowTemplateModal] = useState(false)
	const [showGalleryModal, setShowGalleryModal] = useState(false)
	const [showStartNewChatModal, setShowStartNewChatModal] = useState(false)
	const [showCreateWhatsappGroupModal, setShowCreateWhatsappGroupModal] =
		useState(false)
	const [chatCreationInboxes, setChatCreationInboxes] = useState<any[]>([])
	const [chatCreationTemplates, setChatCreationTemplates] = useState<
		WhatsAppTemplateOption[]
	>([])
	const [isLoadingChatCreationData, setIsLoadingChatCreationData] =
		useState(false)
	const [chatCreationDataError, setChatCreationDataError] = useState('')
	const [startNewChatForm, setStartNewChatForm] = useState({
		inboxId: '',
		name: '',
		phoneNumber: '',
		templateName: '',
	})
	const [createWhatsappGroupForm, setCreateWhatsappGroupForm] = useState({
		name: '',
		description: '',
		inboxId: '',
	})

	const messagesEndRef = useRef<HTMLDivElement>(null)
	const socketRef = useRef<Socket | null>(null)
	const socketConnectionKeyRef = useRef<string | null>(null)
	const socketDisconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	)
	const searchInputRef = useRef<HTMLInputElement>(null)
	const selectedConversationIdRef = useRef<string | null>(null)
	const currentUserIdRef = useRef<string>('')
	const currentUserNameRef = useRef<string>('')
	const conversationsScrollRef = useRef<HTMLDivElement>(null)
	const loadMoreTriggerRef = useRef<HTMLDivElement>(null)
	const loadingPageRef = useRef<number | null>(null)
	const expiredWindowNotifiedConversationIdRef = useRef<string | null>(null)
	const [conversationPage, setConversationPage] = useState(1)
	const [hasMoreConversations, setHasMoreConversations] = useState(true)
	const [isLoadingMoreConversations, setIsLoadingMoreConversations] =
		useState(false)

	// API Configuration
	const API_BASE = import.meta.env.VITE_API_URL || 'https://api.scalebiz.chat'

	// Filter States
	const [channelFilter, setChannelFilter] = useState<
		'all' | 'whatsapp' | 'instagram' | 'tiktok'
	>('all')
	const [assignmentFilter, setAssignmentFilter] = useState<
		'all' | 'mine' | 'unassigned' | 'others'
	>('all')
	const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false)
	const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] =
		useState(false)
	const [showWarning, setShowWarning] = useState(false)
	const [statusFilter, setStatusFilter] = useState<
		'all' | 'unserved' | 'served' | 'resolved'
	>('all')
	const [unreadOnly, setUnreadOnly] = useState(false)
	const [statusCounts, setStatusCounts] = useState<{
		all: number
		unserved: number
		served: number
		resolved: number
	} | null>(null)
	const [isPipelineOpen, setIsPipelineOpen] = useState(false)
	const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null)

	// Advanced Filter States
	const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
	const [advancedFilters, setAdvancedFilters] = useState<{
		dateFrom: string
		dateTo: string
		inboxId: string
		labelIds: string[]
		resolvedBy: string
		agentIds: string[]
		aiAgentId: string
		status: string
		pipelineStageId: string
	}>({
		dateFrom: '',
		dateTo: '',
		inboxId: '',
		labelIds: [],
		resolvedBy: '',
		agentIds: [],
		aiAgentId: '',
		status: '',
		pipelineStageId: '',
	})
	const [filterOptions, setFilterOptions] = useState<{
		labels: any[]
		inboxes: any[]
		agents: any[]
		chatbots: any[]
		pipelines: any[]
	}>({ labels: [], inboxes: [], agents: [], chatbots: [], pipelines: [] })
	const advancedFiltersRef = useRef(advancedFilters)
	const hasActiveAdvancedFilters = Object.values(advancedFilters).some((v) =>
		Array.isArray(v) ? v.length > 0 : v !== '',
	)
	const activeAdvancedFilterCount = Object.values(advancedFilters).reduce(
		(count, value) => {
			if (Array.isArray(value)) {
				return count + (value.length > 0 ? 1 : 0)
			}

			return count + (value !== '' ? 1 : 0)
		},
		0,
	)
	const inboxFilterOptions = useMemo<SearchableOption[]>(
		() => [
			{ value: '', label: 'All Inboxes' },
			...filterOptions.inboxes.map((inbox: any) => ({
				value: String(inbox.id),
				label: String(inbox.name || inbox.id),
			})),
		],
		[filterOptions.inboxes],
	)
	const labelFilterOptions = useMemo<SearchableOption[]>(
		() =>
			filterOptions.labels.map((label: any) => ({
				value: String(label.id),
				label: String(label.title || label.name || label.id),
			})),
		[filterOptions.labels],
	)
	const agentFilterOptions = useMemo<SearchableOption[]>(
		() =>
			filterOptions.agents.map((agent: any) => ({
				value: String(agent.id),
				label: String(agent.name || agent.email || agent.id),
			})),
		[filterOptions.agents],
	)
	const resolvedByFilterOptions = useMemo<SearchableOption[]>(
		() => [{ value: '', label: 'Choose Agent' }, ...agentFilterOptions],
		[agentFilterOptions],
	)
	const aiAgentFilterOptions = useMemo<SearchableOption[]>(
		() => [
			{ value: '', label: 'Choose AI Agent' },
			...filterOptions.chatbots.map((bot: any) => ({
				value: String(bot.id),
				label: String(bot.name || bot.id),
			})),
		],
		[filterOptions.chatbots],
	)
	const statusFilterOptions = useMemo<SearchableOption[]>(
		() => [
			{ value: '', label: 'All Statuses' },
			{ value: 'open', label: 'Open' },
			{ value: 'pending', label: 'Pending' },
			{ value: 'resolved', label: 'Resolved' },
		],
		[],
	)
	const pipelineStatusFilterOptions = useMemo<SearchableOption[]>(
		() => [
			{ value: '', label: 'All Statuses' },
			...filterOptions.pipelines.flatMap((pipeline: any) =>
				(pipeline.stages || []).map((stage: any) => ({
					value: String(stage.id),
					label: `${pipeline.name} - ${stage.name}`,
				})),
			),
		],
		[filterOptions.pipelines],
	)
	const bulkAgentOptions = useMemo<SearchableOption[]>(
		() =>
			(availableAgents || []).map((agent: any) => ({
				value: String(agent.id),
				label: String(agent.name || agent.email || agent.id),
			})),
		[availableAgents],
	)
	const bulkLabelOptions = useMemo<SearchableOption[]>(
		() => [{ value: '', label: 'Choose Label' }, ...labelFilterOptions],
		[labelFilterOptions],
	)
	const bulkPipelineOptions = useMemo<SearchableOption[]>(
		() => [
			{ value: '', label: 'Choose Pipeline' },
			...filterOptions.pipelines.flatMap((pipeline: any) =>
				(pipeline.stages || []).map((stage: any) => ({
					value: String(stage.id),
					label: `${pipeline.name} - ${stage.name}`,
				})),
			),
		],
		[filterOptions.pipelines],
	)
	const bulkResolveOptions = useMemo<SearchableOption[]>(
		() => [
			{ value: '', label: 'Choose Resolve' },
			{ value: 'open', label: 'Open' },
			{ value: 'pending', label: 'Pending' },
			{ value: 'resolved', label: 'Resolved' },
		],
		[],
	)
	const whatsappInboxCreationOptions = useMemo(
		() =>
			(chatCreationInboxes || []).filter(
				(inbox) => String(inbox?.channel_type || '').toLowerCase() === 'whatsapp',
			),
		[chatCreationInboxes],
	)
	const selectedStartNewChatTemplate = useMemo(
		() =>
			chatCreationTemplates.find(
				(template) => template.name === startNewChatForm.templateName,
			) || null,
		[chatCreationTemplates, startNewChatForm.templateName],
	)
	const selectedStartNewChatTemplatePreview = useMemo(
		() => getTemplateBodyPreview(selectedStartNewChatTemplate?.components || []),
		[selectedStartNewChatTemplate],
	)
	const canStartNewChat = useMemo(
		() =>
			Boolean(
				startNewChatForm.inboxId &&
					startNewChatForm.templateName &&
					startNewChatForm.name.trim() &&
					normalizePhoneForWaMe(startNewChatForm.phoneNumber),
			),
		[startNewChatForm],
	)
	const canCreateWhatsappGroup = useMemo(
		() =>
			Boolean(
				createWhatsappGroupForm.inboxId &&
					createWhatsappGroupForm.name.trim() &&
					createWhatsappGroupForm.name.trim().length <= 50 &&
					createWhatsappGroupForm.description.trim().length <= 300,
			),
		[createWhatsappGroupForm],
	)
	const visibleAdditionalFields = useMemo(
		() =>
			additionalFields
				.filter((field) => field.isVisible !== false)
				.sort((a, b) => a.displayOrder - b.displayOrder),
		[additionalFields],
	)
	const normalizedAdditionalInfoPayload = useMemo(
		() =>
			buildAdditionalInfoPayload(visibleAdditionalFields, additionalInfoValues),
		[additionalInfoValues, visibleAdditionalFields],
	)
	const normalizedSavedAdditionalInfoPayload = useMemo(
		() =>
			buildAdditionalInfoPayload(
				visibleAdditionalFields,
				savedAdditionalInfoValues,
			),
		[savedAdditionalInfoValues, visibleAdditionalFields],
	)
	const hasAdditionalInfoChanges = useMemo(
		() =>
			!isAdditionalInfoPayloadEqual(
				normalizedAdditionalInfoPayload,
				normalizedSavedAdditionalInfoPayload,
			),
		[normalizedAdditionalInfoPayload, normalizedSavedAdditionalInfoPayload],
	)
	const loadChatCreationData = useCallback(async () => {
		setIsLoadingChatCreationData(true)
		setChatCreationDataError('')

		try {
			const [inboxesResponse, templatesResponse] = await Promise.all([
				inboxes.list(),
				whatsappTemplates.list('APPROVED'),
			])

			const parsedInboxes = Array.isArray((inboxesResponse as any)?.data)
				? (inboxesResponse as any).data
				: Array.isArray((inboxesResponse as any)?.payload)
					? (inboxesResponse as any).payload
					: Array.isArray(inboxesResponse)
						? inboxesResponse
						: []
			const parsedTemplates = Array.isArray((templatesResponse as any)?.data)
				? (templatesResponse as any).data
				: Array.isArray((templatesResponse as any)?.payload)
					? (templatesResponse as any).payload
					: []

			setChatCreationInboxes(parsedInboxes)
			setChatCreationTemplates(
				parsedTemplates
					.map((template: any) => ({
						id: String(template?.id || template?.name || ''),
						name: String(template?.name || ''),
						language: String(template?.language || ''),
						components: Array.isArray(template?.components)
							? template.components
							: [],
					}))
					.filter((template: WhatsAppTemplateOption) => template.name.length > 0),
			)
		} catch (error) {
			console.error('Failed to load chat creation modal data:', error)
			setChatCreationDataError('Failed to load inbox and template options')
		} finally {
			setIsLoadingChatCreationData(false)
		}
	}, [])
	const openStartNewChatModal = useCallback(() => {
		setStartNewChatForm({
			inboxId: '',
			name: '',
			phoneNumber: '',
			templateName: '',
		})
		setShowStartNewChatModal(true)
		void loadChatCreationData()
	}, [loadChatCreationData])
	const openCreateWhatsappGroupModal = useCallback(() => {
		setCreateWhatsappGroupForm({
			name: '',
			description: '',
			inboxId: '',
		})
		setShowCreateWhatsappGroupModal(true)
		void loadChatCreationData()
	}, [loadChatCreationData])
	const handleStartNewChatSubmit = useCallback(() => {
		toast.info(
			'Start chat action will be enabled in next step. Inbox and template data are now loaded successfully.',
		)
	}, [])
	const handleCreateWhatsappGroupSubmit = useCallback(() => {
		toast.info(
			'Create WhatsApp Group action will be enabled in next step. Platform list is loaded successfully.',
		)
	}, [])

	useEffect(() => {
		advancedFiltersRef.current = advancedFilters
	}, [advancedFilters])

	// View States
	const [showCustomerInfo, setShowCustomerInfo] = useState(true)
	const [desktopSidebarTab, setDesktopSidebarTab] =
		useState<SidebarInfoTab>('info')
	const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
	const [showMobileCustomerInfo, setShowMobileCustomerInfo] = useState(false)
	const [mobileSidebarTab, setMobileSidebarTab] =
		useState<SidebarInfoTab>('info')
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')

	const [ticketSettings, setTicketSettings] =
		useState<TicketsSettingsResponse | null>(null)
	const [isLoadingTicketSettings, setIsLoadingTicketSettings] = useState(false)
	const [selectedTicketBoardId, setSelectedTicketBoardId] = useState<
		string | null
	>(null)
	const [isUpdatingTicketDefaultBoard, setIsUpdatingTicketDefaultBoard] =
		useState(false)
	const [conversationTicketSummary, setConversationTicketSummary] =
		useState<ConversationTicketSummary | null>(null)
	const [
		isLoadingConversationTicketSummary,
		setIsLoadingConversationTicketSummary,
	] = useState(false)
	const [isCreateOrderExpanded, setIsCreateOrderExpanded] = useState(true)
	const [orderProductSearch, setOrderProductSearch] = useState('')
	const [orderAddress, setOrderAddress] = useState('')
	const [orderNotes, setOrderNotes] = useState('')
	const [orderShipping, setOrderShipping] = useState('0')
	const [orderDiscount, setOrderDiscount] = useState('0')
	const [orderVat, setOrderVat] = useState('0')

	// Modal & Action States
	const [showResolveModal, setShowResolveModal] = useState(false)
	const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
	const [conversationHistory, setConversationHistory] = useState<any[]>([])
	const [showActionsMenu, setShowActionsMenu] = useState(false)
	const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
	const [showBlockCustomerModal, setShowBlockCustomerModal] = useState(false)
	const [blockType, setBlockType] = useState<'chat' | 'call' | 'both'>('chat')
	const [showPinChatModal, setShowPinChatModal] = useState(false)
	const [showMuteModal, setShowMuteModal] = useState(false)
	const [showHistoryModal, setShowHistoryModal] = useState(false)
	const [showManageLabelsModal, setShowManageLabelsModal] = useState(false)
	const [showMergeCustomerModal, setShowMergeCustomerModal] = useState(false)
	const [showExportChatModal, setShowExportChatModal] = useState(false)
	const [showReportIssueModal, setShowReportIssueModal] = useState(false)
	const [activeImageMessageId, setActiveImageMessageId] = useState<
		string | null
	>(null)
	const [isImageViewerLoadError, setIsImageViewerLoadError] = useState(false)
	const [isDownloadingImage, setIsDownloadingImage] = useState(false)
	const [isSelectionMode, setIsSelectionMode] = useState(false)
	const [selectedConversationIds, setSelectedConversationIds] = useState<
		Set<string>
	>(new Set<string>())
	const selectedConversationCount = selectedConversationIds.size
	const [showBulkEditModal, setShowBulkEditModal] = useState(false)
	const [bulkEditForm, setBulkEditForm] =
		useState<BulkEditFormState>(EMPTY_BULK_EDIT_FORM)
	const [isSubmittingBulkEdit, setIsSubmittingBulkEdit] = useState(false)
	const [isPollingBulkEditJob, setIsPollingBulkEditJob] = useState(false)
	const [isLoadingBulkOptions, setIsLoadingBulkOptions] = useState(false)

	// AI Evaluation States
	const [evaluatingMessage, setEvaluatingMessage] =
		useState<ChatMessage | null>(null)
	const [expectedResponse, setExpectedResponse] = useState('')
	const [isExpandedEval, setIsExpandedEval] = useState(false)
	const [selectedEvalMessage, setSelectedEvalMessage] = useState<string | null>(
		null,
	)
	const [savingEvaluation, setSavingEvaluation] = useState(false)

	// Chat Preferences States
	const [pinnedChats, setPinnedChats] = useState<string[]>([])
	const [mutedChats, setMutedChats] = useState<Set<string>>(new Set())
	const showSendMessageError = useCallback(
		(error: unknown, fallbackPhone?: string | null) => {
			const parsedError = error as SendMessageError
			const followUpUrl =
				typeof parsedError?.followUpUrl === 'string' &&
				parsedError.followUpUrl.trim().length > 0
					? parsedError.followUpUrl
					: buildWaMeFollowUpUrl(fallbackPhone)

			if (parsedError?.code === WHATSAPP_FREE_WINDOW_EXPIRED) {
				toast.error(
					'Window gratis 24 jam WhatsApp customer sudah habis. Tidak bisa kirim pesan lagi.',
					{
						description: followUpUrl
							? `Follow up WhatsApp biasa: ${followUpUrl}`
							: 'Silakan follow up lewat WhatsApp biasa ke nomor customer.',
					},
				)
				return
			}

			const message =
				parsedError instanceof Error && parsedError.message
					? parsedError.message
					: 'Failed to send message'
			toast.error(message)
		},
		[],
	)
	const isSelectedConversationWindowExpired = Boolean(
		selectedConversation &&
			selectedConversation.channel === 'whatsapp' &&
			selectedConversation.whatsappWindowExpired,
	)
	const selectedConversationFollowUpUrl =
		selectedConversation?.channel === 'whatsapp'
			? selectedConversation.whatsappFollowUpUrl ||
				buildWaMeFollowUpUrl(
					selectedConversation.phone || selectedConversation.identifier,
				)
			: null
	const notifyMessagingWindowExpired = useCallback(
		(conversation?: ChatConversation | null) => {
			const targetConversation = conversation || selectedConversation
			if (!targetConversation) return

			const error = new Error(
				'Window gratis 24 jam WhatsApp customer sudah habis.',
			) as SendMessageError
			error.code = WHATSAPP_FREE_WINDOW_EXPIRED
			error.followUpUrl =
				targetConversation.whatsappFollowUpUrl ||
				buildWaMeFollowUpUrl(
					targetConversation.phone || targetConversation.identifier,
				) ||
				undefined

			showSendMessageError(
				error,
				targetConversation.phone || targetConversation.identifier,
			)
		},
		[selectedConversation, showSendMessageError],
	)

	const chatroomImageMessages = useMemo(() => {
		if (!selectedConversation?.messages?.length) return []

		return sortMessagesChronologically(selectedConversation.messages)
			.filter((message) => {
				return (
					message.contentType === 'image' &&
					typeof message.extras?.media?.url === 'string' &&
					message.extras.media.url.length > 0
				)
			})
			.map((message) => ({
				id: message.id,
				url: message.extras!.media!.url,
				fileName: message.extras?.media?.fileName || null,
				timestamp: message.timestamp,
			}))
	}, [selectedConversation?.messages])

	const activeImageIndex = useMemo(() => {
		if (!activeImageMessageId) return -1
		return chatroomImageMessages.findIndex(
			(image) => image.id === activeImageMessageId,
		)
	}, [activeImageMessageId, chatroomImageMessages])

	const activeImage =
		activeImageIndex >= 0 ? chatroomImageMessages[activeImageIndex] : null

	const closeImageViewer = useCallback(() => {
		setActiveImageMessageId(null)
		setIsImageViewerLoadError(false)
	}, [])

	const showPreviousImage = useCallback(() => {
		if (!chatroomImageMessages.length || activeImageIndex < 0) return
		const previousIndex =
			(activeImageIndex - 1 + chatroomImageMessages.length) %
			chatroomImageMessages.length
		setActiveImageMessageId(chatroomImageMessages[previousIndex]?.id || null)
		setIsImageViewerLoadError(false)
	}, [activeImageIndex, chatroomImageMessages])

	const showNextImage = useCallback(() => {
		if (!chatroomImageMessages.length || activeImageIndex < 0) return
		const nextIndex = (activeImageIndex + 1) % chatroomImageMessages.length
		setActiveImageMessageId(chatroomImageMessages[nextIndex]?.id || null)
		setIsImageViewerLoadError(false)
	}, [activeImageIndex, chatroomImageMessages])

	const handleDownloadActiveImage = useCallback(async () => {
		if (!activeImage || isDownloadingImage) return

		try {
			setIsDownloadingImage(true)

			const response = await fetch(activeImage.url)
			if (!response.ok) {
				throw new Error(`Download failed with status ${response.status}`)
			}

			const blob = await response.blob()
			const blobUrl = URL.createObjectURL(blob)
			const extensionFromMime =
				blob.type?.split('/')[1]?.split(';')[0]?.trim() || 'jpg'
			const fallbackName = `image-${new Date(activeImage.timestamp).toISOString().replace(/[:.]/g, '-')}.${extensionFromMime}`
			const filename = activeImage.fileName || fallbackName

			const link = document.createElement('a')
			link.href = blobUrl
			link.download = filename
			document.body.appendChild(link)
			link.click()
			link.remove()
			URL.revokeObjectURL(blobUrl)
		} catch (error) {
			console.error(
				'Failed to download image directly, fallback to new tab:',
				error,
			)
			window.open(activeImage.url, '_blank', 'noopener,noreferrer')
		} finally {
			setIsDownloadingImage(false)
		}
	}, [activeImage, isDownloadingImage])

	const loadAdditionalFields = useCallback(async () => {
		setIsLoadingAdditionalFields(true)
		try {
			const response: any = await contacts.settings.get()
			const payload = response?.payload || response?.data || response || {}
			const fieldsRaw = Array.isArray(payload?.fields) ? payload.fields : []
			setAdditionalFields(
				fieldsRaw
					.map((field: any) => normalizeAdditionalField(field))
					.filter(Boolean) as AdditionalFieldDefinition[],
			)
		} catch (error) {
			console.error('Failed to load additional fields:', error)
		} finally {
			setIsLoadingAdditionalFields(false)
		}
	}, [])

	const loadAdditionalInfoValues = useCallback(async (contactId: string) => {
		setIsLoadingAdditionalInfo(true)
		try {
			const response: any = await customers.get(contactId)
			const payload = response?.payload || response?.data || response || {}
			const attributes = toRecord(payload?.custom_attributes) || {}
			setAdditionalInfoValues(attributes)
			setSavedAdditionalInfoValues(attributes)
		} catch (error) {
			console.error('Failed to load additional info values:', error)
			setAdditionalInfoValues({})
			setSavedAdditionalInfoValues({})
		} finally {
			setIsLoadingAdditionalInfo(false)
		}
	}, [])

	const handleGenerateAiSummary = useCallback(async () => {
		if (!selectedConversation) return
		setIsGeneratingAiSuggestion(true)
		const conversationId = selectedConversation.id
		const optimisticMessageId = `ai-summary-${Date.now()}`

		const removeOptimisticSummary = () => {
			setSelectedConversation((prev) => {
				if (!prev || prev.id !== conversationId) return prev
				return {
					...prev,
					messages: prev.messages.filter((message) => message.id !== optimisticMessageId),
				}
			})
			setConversations((prev) =>
				prev.map((conversation) =>
					conversation.id === conversationId
						? {
								...conversation,
								messages: conversation.messages.filter(
									(message) => message.id !== optimisticMessageId,
								),
							}
						: conversation,
				),
			)
		}

		try {
			const response: any = await ai.getSuggestion(conversationId)
			const payload = response?.data || response?.payload || response || {}
			const suggestion =
				typeof payload?.suggestion === 'string'
					? payload.suggestion.trim()
					: typeof response?.suggestion === 'string'
						? response.suggestion.trim()
						: ''

			if (!suggestion) {
				toast.error('AI summary is not available yet')
				return
			}

			const summaryPoints = normalizeAiSummaryPoints(suggestion)
			if (summaryPoints.length === 0) {
				toast.error('AI summary is not available yet')
				return
			}

			const content = summaryPoints.map((point) => `- ${point}`).join('\n')
			const createdAt = new Date()
			const optimisticSummaryMessage: ChatMessage = {
				id: optimisticMessageId,
				content,
				type: 'system',
				timestamp: createdAt,
				status: 'sent',
				contentType: 'text',
				senderType: 'system',
				senderId: null,
				statusAt: createdAt,
				senderLabel: 'system',
				contentAttributes: {
					ai_summary: true,
					source: 'ai_summary',
					summary_points: summaryPoints,
				},
			}

			setSelectedConversation((prev) => {
				if (!prev || prev.id !== conversationId) return prev
				return {
					...prev,
					lastMessage: 'AI Summary generated',
					timestamp: createdAt,
					messages: sortMessagesChronologically([
						...(prev.messages || []),
						optimisticSummaryMessage,
					]),
				}
			})

			setConversations((prev) =>
				prev.map((conversation) =>
					conversation.id === conversationId
						? {
								...conversation,
								lastMessage: 'AI Summary generated',
								timestamp: createdAt,
								messages: sortMessagesChronologically([
									...(conversation.messages || []),
									optimisticSummaryMessage,
								]),
							}
						: conversation,
				),
			)

			await conversationsApi.sendMessage(conversationId, {
				content,
				content_type: 'text',
				sender_type: 'system',
				unique_temp_id: optimisticMessageId,
				content_attributes: {
					ai_summary: true,
					source: 'ai_summary',
					summary_points: summaryPoints,
				},
			})
			toast.success('AI summary added to chat')
		} catch (error: any) {
			console.error('Failed to generate AI summary:', error)
			removeOptimisticSummary()
			toast.error(error?.message || 'Failed to generate AI summary')
		} finally {
			setIsGeneratingAiSuggestion(false)
		}
	}, [selectedConversation])

	const handleAdditionalInfoValueChange = useCallback(
		(fieldKey: string, value: unknown) => {
			setAdditionalInfoValues((prev) => ({
				...prev,
				[fieldKey]: value,
			}))
		},
		[],
	)

	const handleSaveAdditionalInfo = useCallback(async () => {
		const contactId = selectedConversation?.contactId
		if (!contactId) return

		for (const field of visibleAdditionalFields) {
			const normalizedValue = normalizedAdditionalInfoPayload[field.fieldKey]
			if (
				field.isRequired &&
				(normalizedValue === null || normalizedValue === '')
			) {
				toast.error(`${field.fieldLabel} is required`)
				return
			}
		}

		setIsSavingAdditionalInfo(true)
		try {
			await customers.update(contactId, {
				custom_attributes: normalizedAdditionalInfoPayload,
			})

			setAdditionalInfoValues((prev) => ({
				...prev,
				...normalizedAdditionalInfoPayload,
			}))
			setSavedAdditionalInfoValues((prev) => ({
				...prev,
				...normalizedAdditionalInfoPayload,
			}))
			toast.success('Additional info saved')
		} catch (error: any) {
			console.error('Failed to save additional info:', error)
			toast.error(error?.message || 'Failed to save additional info')
		} finally {
			setIsSavingAdditionalInfo(false)
		}
	}, [
		normalizedAdditionalInfoPayload,
		selectedConversation?.contactId,
		visibleAdditionalFields,
	])

	const handleCreateAdditionalField = useCallback(async () => {
		const fieldLabel = newAdditionalFieldName.trim()
		if (!fieldLabel) {
			toast.error('Name is required')
			return
		}

		const options =
			newAdditionalFieldType === 'dropdown'
				? parseDropdownOptions(newAdditionalFieldOptions)
				: []

		if (newAdditionalFieldType === 'dropdown' && options.length === 0) {
			toast.error('Select options are required for this type')
			return
		}

		setIsCreatingAdditionalField(true)
		try {
			const response: any = await contacts.settings.createField({
				fieldLabel,
				fieldType: newAdditionalFieldType,
				options,
				isVisible: true,
			})
			const fieldsRaw = Array.isArray(response?.payload)
				? response.payload
				: null
			if (fieldsRaw) {
				setAdditionalFields(
					fieldsRaw
						.map((field: any) => normalizeAdditionalField(field))
						.filter(Boolean) as AdditionalFieldDefinition[],
				)
			} else {
				await loadAdditionalFields()
			}
			setNewAdditionalFieldName('')
			setNewAdditionalFieldType('text')
			setNewAdditionalFieldOptions('')
			setIsAdditionalDataExpanded(true)
			setShowAddAdditionalInfoModal(false)
			toast.success('Additional info column created')
		} catch (error: any) {
			console.error('Failed to create additional field:', error)
			toast.error(error?.message || 'Failed to create additional info column')
		} finally {
			setIsCreatingAdditionalField(false)
		}
	}, [
		loadAdditionalFields,
		newAdditionalFieldName,
		newAdditionalFieldOptions,
		newAdditionalFieldType,
	])

	const loadTicketSettings = useCallback(async () => {
		setIsLoadingTicketSettings(true)
		try {
			const data = await ticketsApi.getSettings()
			setTicketSettings(data)
			setSelectedTicketBoardId((prev) => {
				if (prev && data.boards.some((board) => board.id === prev)) return prev
				if (
					data.default_board_id &&
					data.boards.some((board) => board.id === data.default_board_id)
				) {
					return data.default_board_id
				}
				return data.boards[0]?.id || null
			})
		} catch (error) {
			console.error('Failed to load ticket settings:', error)
			toast.error('Failed to load ticket settings')
		} finally {
			setIsLoadingTicketSettings(false)
		}
	}, [])

	const handleSelectTicketBoard = useCallback(
		async (boardId: string | null) => {
			setSelectedTicketBoardId(boardId)
			setTicketSettings((prev) =>
				prev ? { ...prev, default_board_id: boardId } : prev,
			)
			setIsUpdatingTicketDefaultBoard(true)
			try {
				await ticketsApi.setDefaultBoard(boardId)
			} catch (error: any) {
				console.error('Failed to update ticket default board:', error)
				toast.error(error?.message || 'Failed to update default board')
				await loadTicketSettings()
			} finally {
				setIsUpdatingTicketDefaultBoard(false)
			}
		},
		[loadTicketSettings],
	)

	const openFullTicketBoard = useCallback(() => {
		void navigate({
			to: '/tickets' as any,
			search: {
				board_id: selectedTicketBoardId || undefined,
				conversation_id: selectedConversation?.id || undefined,
			},
		})
	}, [navigate, selectedConversation?.id, selectedTicketBoardId])

	// --- Effects ---

	// Fetch initial settings
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const res: any = await agentsManagement.settings.get()
				if (res.success) {
					setAgentSettings(res.settings)
				}
			} catch (e) {
				console.error('Failed to load agent settings for Inbox:', e)
			}
		}
		loadSettings()

		// Load current user role and ID
		try {
			const userStr = localStorage.getItem('scalechat_user')
			if (userStr) {
				const user = JSON.parse(userStr)
				setCurrentUserRole(user.role || 'agent')
				setCurrentUserId(user.id || '')
				setCurrentUserName(user.name || user.full_name || '')
			}
		} catch (e) {
			console.error('Failed to get user role:', e)
		}

			// Load available agents
			const loadAvailableAgents = async () => {
				try {
					const agentsList: any = await agents.list()
					const normalizedAgents = Array.isArray(agentsList)
						? agentsList
						: (agentsList?.payload ?? agentsList?.data ?? [])
					setAvailableAgents(
						Array.isArray(normalizedAgents) ? normalizedAgents : [],
					)
				} catch (e) {
					console.error('Failed to load agents:', e)
					setAvailableAgents([])
				}
		}
		loadAvailableAgents()

		// Load chat preferences
		const loadChatPreferences = async () => {
			try {
				const pinned = getPinnedChats()
				setPinnedChats(pinned)

				// Check muted status for all conversations
				const muted = new Set<string>()
				conversations.forEach((conv) => {
					if (isMuted(conv.id)) {
						muted.add(conv.id)
					}
				})
				setMutedChats(muted)
			} catch (e) {
				console.error('Failed to load chat preferences:', e)
			}
		}
		loadChatPreferences()
	}, [])

	// Load status counts
	const loadStatusCounts = useCallback(async () => {
		try {
			const counts: any = await conversationsApi.getCounts()
			if (counts && typeof counts.all === 'number') {
				setStatusCounts(counts)
			}
		} catch (e) {
			console.error('Failed to load status counts:', e)
		}
	}, [])

	const loadConversationFilterOptions = useCallback(async () => {
		setIsLoadingBulkOptions(true)

		const token = localStorage.getItem('scalechat_token') || ''
		const legacyAppId = localStorage.getItem('scalechat_app_id') || ''
		const legacyAppSecret =
			localStorage.getItem('scalechat_app_secret') || 'scalesecret'
		const orgSlug = appId || localStorage.getItem('scalechat_org_slug') || ''
		const requestHeaders: HeadersInit = {
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(orgSlug ? { 'X-Org-Slug': orgSlug } : {}),
			...(legacyAppId ? { 'X-App-Id': legacyAppId } : {}),
			...(legacyAppSecret ? { 'X-App-Secret': legacyAppSecret } : {}),
		}

		const extractCollection = (response: any, nestedKey?: string): any[] => {
			const candidates = [response?.payload, response?.data, response]
			for (const candidate of candidates) {
				if (Array.isArray(candidate)) return candidate
				if (nestedKey && candidate && typeof candidate === 'object') {
					const nestedValue = (candidate as Record<string, unknown>)[nestedKey]
					if (Array.isArray(nestedValue)) return nestedValue
				}
			}
			return []
		}

		const fetchPipelineOptions = async () => {
			const pipelineEndpoints = [
				`${API_HTTP_BASE}/crm/pipelines`,
				`${API_HTTP_BASE}/pipelines`,
			]

			for (const endpoint of pipelineEndpoints) {
				try {
					const response = await fetch(endpoint, {
						headers: requestHeaders,
					})
					if (!response.ok) continue
					return await response.json()
				} catch {
					continue
				}
			}

			return null
		}

		try {
			const [labelsRes, inboxesRes, agentsRes, chatbotsRes, pipelinesRes] =
				await Promise.all([
					labels.list().catch(() => ({ data: [] })),
					inboxes.list().catch(() => ({ data: [] })),
					agents.list().catch(() => ({ data: [] })),
					chatbots.list().catch(() => ({ data: [] })),
					fetchPipelineOptions(),
				])

			const nextOptions = {
				labels: extractCollection(labelsRes, 'labels'),
				inboxes: extractCollection(inboxesRes, 'inboxes'),
				agents: extractCollection(agentsRes, 'agents'),
				chatbots: extractCollection(chatbotsRes, 'chatbots'),
				pipelines: extractCollection(pipelinesRes, 'pipelines'),
			}

			setFilterOptions(nextOptions)
			return nextOptions
		} catch (error) {
			console.error('Failed to load conversation filter options:', error)
			return null
		} finally {
			setIsLoadingBulkOptions(false)
		}
	}, [appId])

	useEffect(() => {
		loadStatusCounts()
	}, [loadStatusCounts])

	useEffect(() => {
		void loadAdditionalFields()
	}, [loadAdditionalFields])

	useEffect(() => {
		void loadTicketSettings()
	}, [loadTicketSettings])

	useEffect(() => {
		if (!selectedConversation?.contactId) {
			setAdditionalInfoValues({})
			setSavedAdditionalInfoValues({})
			setIsLoadingAdditionalInfo(false)
			return
		}
		void loadAdditionalInfoValues(selectedConversation.contactId)
	}, [
		loadAdditionalInfoValues,
		selectedConversation?.contactId,
		selectedConversation?.id,
	])

	useEffect(() => {
		if (!selectedConversation?.id || !selectedTicketBoardId) {
			setConversationTicketSummary(null)
			setIsLoadingConversationTicketSummary(false)
			return
		}

		let cancelled = false
		setIsLoadingConversationTicketSummary(true)

		void ticketsApi
			.getConversationSummary(selectedConversation.id, selectedTicketBoardId)
			.then((summary) => {
				if (cancelled) return
				setConversationTicketSummary(summary)
			})
			.catch((error) => {
				if (cancelled) return
				console.error('Failed to load conversation ticket summary:', error)
				setConversationTicketSummary(null)
			})
			.finally(() => {
				if (cancelled) return
				setIsLoadingConversationTicketSummary(false)
			})

		return () => {
			cancelled = true
		}
	}, [selectedConversation?.id, selectedTicketBoardId])

	// Load conversations
	const mapRawConversation = useCallback(
		(rawConversation: any, existing?: ChatConversation): ChatConversation => {
			const contact = rawConversation.contacts || rawConversation.contact
			const rawChannelType = String(rawConversation.channel_type || '')
				.trim()
				.toLowerCase()
			const channel =
				rawChannelType === 'instagram'
					? 'instagram'
					: rawChannelType === 'tiktok'
						? 'tiktok'
					: ('whatsapp' as const)
			const instagramProfile =
				channel === 'instagram' ? extractInstagramProfile(contact) : null
			const instagramHandle = formatInstagramHandle(instagramProfile?.username)
			const fallbackName = contact?.name || contact?.identifier || 'Unknown'
			const resolvedName =
				channel === 'instagram' ? instagramHandle || fallbackName : fallbackName
			const resolvedAvatarLabel =
				channel === 'instagram' ? instagramHandle || fallbackName : fallbackName
			const messagingWindowExpiresAt =
				channel === 'whatsapp'
					? toNullableDate(
							rawConversation.messaging_window_expires_at ||
								rawConversation.messagingWindowExpiresAt ||
								contact?.window_expires_at ||
								contact?.windowExpiresAt,
						) ||
						existing?.messagingWindowExpiresAt ||
						null
					: null
			const explicitWithinWindow = toNullableBoolean(
				rawConversation.is_within_messaging_window ??
					rawConversation.isWithinMessagingWindow,
			)
			const explicitWindowOpen = toNullableBoolean(
				rawConversation.messaging_window_open ??
					rawConversation.messagingWindowOpen,
			)
			const isWithinMessagingWindow =
				channel === 'whatsapp'
					? messagingWindowExpiresAt
						? messagingWindowExpiresAt.getTime() > Date.now()
						: (explicitWithinWindow ??
							explicitWindowOpen ??
							existing?.isWithinMessagingWindow ??
							true)
					: true
			const messagingWindowOpen =
				channel === 'whatsapp'
					? (explicitWindowOpen ??
						existing?.messagingWindowOpen ??
						isWithinMessagingWindow)
					: null
			const whatsappWindowExpired =
				channel === 'whatsapp' ? !isWithinMessagingWindow : false
			const whatsappFollowUpUrl =
				channel === 'whatsapp'
					? buildWaMeFollowUpUrl(
							contact?.phone_number ||
								contact?.identifier ||
								existing?.phone ||
								existing?.identifier ||
								null,
						)
					: null
			const hydratedMessages =
				existing?.messages?.length && Array.isArray(existing.messages)
					? existing.messages
					: sortMessagesChronologically(
							(rawConversation.messages || []).map((m: any) =>
								toChatMessage(m, {
									fallbackTimestamp:
										m?.created_at || rawConversation.created_at || Date.now(),
								}),
							),
						)
			return {
				id: rawConversation.id,
				name: resolvedName,
				phone:
					channel === 'instagram'
						? contact?.phone_number || ''
						: contact?.phone_number || contact?.identifier || '',
				avatar: getAvatarInitials(resolvedAvatarLabel),
				avatarImageUrl:
					instagramProfile?.profilePictureUrl || contact?.avatar_url,
				lastMessage:
					rawConversation.last_message ||
					rawConversation.messages?.[0]?.message ||
					rawConversation.messages?.[0]?.content ||
					hydratedMessages[hydratedMessages.length - 1]?.content ||
					'',
				timestamp: new Date(
					rawConversation.last_message_at || rawConversation.created_at,
				),
				unread: rawConversation.unread_count || 0,
				channel,
				messages: hydratedMessages,
				contactIdentifier: contact?.identifier || '',
				contactId: contact?.id || rawConversation.contact_id,
				assigneeId: rawConversation.assignee_id || null,
				status: rawConversation.status || 'open',
				source: rawConversation.source || 'Organic',
				channelBadgeUrl: rawConversation.channel_badge_url,
				channelName:
					rawConversation.inboxes?.name || rawConversation.channel_name,
				email: contact?.email || '',
				identifier: contact?.identifier || '',
				instagramUsername: instagramProfile?.username,
				instagramDisplayName: instagramProfile?.displayName,
				instagramBio: instagramProfile?.bio,
				instagramFollowerCount: instagramProfile?.followerCount,
				instagramIsUserFollowBusiness: instagramProfile?.isUserFollowBusiness,
				instagramIsBusinessFollowUser: instagramProfile?.isBusinessFollowUser,
				messagingWindowExpiresAt,
				isWithinMessagingWindow,
				messagingWindowOpen,
				whatsappWindowExpired,
				whatsappFollowUpUrl,
			}
		},
		[],
	)

	const loadConversations = useCallback(
		async (options?: { page?: number; reset?: boolean }) => {
			const requestedPage = options?.page ?? 1
			const reset = options?.reset ?? requestedPage === 1

			if (loadingPageRef.current === requestedPage) return
			loadingPageRef.current = requestedPage

			if (reset) {
				setIsLoading(true)
				setHasMoreConversations(true)
			} else {
				setIsLoadingMoreConversations(true)
			}

				try {
					const currentAdvancedFilters = advancedFiltersRef.current
					const data: any = await conversationsApi.list({
						page: requestedPage,
						limit: CONVERSATIONS_PAGE_SIZE,
						...(currentAdvancedFilters.dateFrom && {
							dateFrom: currentAdvancedFilters.dateFrom,
						}),
						...(currentAdvancedFilters.dateTo && {
							dateTo: currentAdvancedFilters.dateTo,
						}),
						...(currentAdvancedFilters.inboxId && {
							inbox_id: currentAdvancedFilters.inboxId,
						}),
						...(currentAdvancedFilters.labelIds.length > 0 && {
							labelIds: currentAdvancedFilters.labelIds.join(','),
						}),
						...(currentAdvancedFilters.resolvedBy && {
							resolvedBy: currentAdvancedFilters.resolvedBy,
						}),
						...(currentAdvancedFilters.agentIds.length > 0 && {
							assignee_id: currentAdvancedFilters.agentIds[0],
						}),
						...(currentAdvancedFilters.aiAgentId && {
							aiAgentId: currentAdvancedFilters.aiAgentId,
						}),
						...(currentAdvancedFilters.status && {
							status: currentAdvancedFilters.status as any,
						}),
						...(currentAdvancedFilters.pipelineStageId && {
							pipelineStageId: currentAdvancedFilters.pipelineStageId,
						}),
					})
				const rawConversations = data.data || data.payload || []
				const totalRaw = Number(data.total ?? 0)
				const total = Number.isFinite(totalRaw) ? totalRaw : 0
				const perPageRaw = Number(data.limit ?? CONVERSATIONS_PAGE_SIZE)
				const perPage =
					Number.isFinite(perPageRaw) && perPageRaw > 0
						? perPageRaw
						: CONVERSATIONS_PAGE_SIZE

				setConversations((previous) => {
					const previousById = new Map(
						previous.map((conversation) => [conversation.id, conversation]),
					)
					const incoming = rawConversations.map((conversation: any) =>
						mapRawConversation(conversation, previousById.get(conversation.id)),
					)

					const merged = reset
						? incoming
						: [
								...previous,
								...incoming.filter(
									(conversation: ChatConversation) =>
										!previousById.has(conversation.id),
								),
							]

					return merged.sort(
						(a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
					)
				})

				const hasMore =
					total > 0
						? requestedPage * perPage < total
						: rawConversations.length >= perPage
				setHasMoreConversations(hasMore)
				setConversationPage(requestedPage)
			} catch (error) {
				console.error('Failed to load conversations:', error)
				if (reset) {
					setConversations([])
					setHasMoreConversations(false)
				}
			} finally {
				if (loadingPageRef.current === requestedPage) {
					loadingPageRef.current = null
				}

				if (reset) {
					setIsLoading(false)
					loadStatusCounts()
				} else {
					setIsLoadingMoreConversations(false)
				}
			}
		},
		[mapRawConversation, loadStatusCounts],
	)

	const loadMoreConversations = useCallback(() => {
		if (isLoading || isLoadingMoreConversations || !hasMoreConversations) return
		void loadConversations({
			page: conversationPage + 1,
			reset: false,
		})
	}, [
		conversationPage,
		hasMoreConversations,
		isLoading,
		isLoadingMoreConversations,
		loadConversations,
	])

	// Clear title notification on focus
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				document.title = 'ScaleChat'
			}
		}
		document.addEventListener('visibilitychange', handleVisibilityChange)
		return () =>
			document.removeEventListener('visibilitychange', handleVisibilityChange)
	}, [])

	useEffect(() => {
		selectedConversationIdRef.current = selectedConversation?.id || null
	}, [selectedConversation?.id])

	useEffect(() => {
		currentUserIdRef.current = currentUserId
		currentUserNameRef.current = currentUserName
	}, [currentUserId, currentUserName])

	useEffect(() => {
		if (
			!selectedConversation ||
			selectedConversation.channel !== 'whatsapp' ||
			!selectedConversation.whatsappWindowExpired
		) {
			expiredWindowNotifiedConversationIdRef.current = null
			return
		}

		if (
			expiredWindowNotifiedConversationIdRef.current === selectedConversation.id
		) {
			return
		}

		expiredWindowNotifiedConversationIdRef.current = selectedConversation.id
		notifyMessagingWindowExpired(selectedConversation)
	}, [
		selectedConversation?.id,
		selectedConversation?.channel,
		selectedConversation?.whatsappWindowExpired,
		selectedConversation?.whatsappFollowUpUrl,
		notifyMessagingWindowExpired,
	])

	// Initialize Socket.io
	useEffect(() => {
		const token = localStorage.getItem('scalechat_token')
		if (socketDisconnectTimeoutRef.current) {
			clearTimeout(socketDisconnectTimeoutRef.current)
			socketDisconnectTimeoutRef.current = null
		}
		if (!token) {
			socketRef.current?.disconnect()
			socketRef.current = null
			socketConnectionKeyRef.current = null
			return
		}

		// Setup Socket URL: If API is on 3010 (Elysia), Socket.IO is on 3011 (Standalone)
		const socketUrl = API_BASE.includes(':3010')
			? API_BASE.replace(':3010', ':3011')
			: API_BASE
		const connectionKey = `${socketUrl}::${token}`
		let socket = socketRef.current

		if (!socket || socketConnectionKeyRef.current !== connectionKey) {
			socket?.disconnect()
			socket = io(socketUrl, {
				auth: { token },
				transports: ['websocket'],
			})
			socketRef.current = socket
			socketConnectionKeyRef.current = connectionKey
		}

		const joinConversationRooms = () => {
			socket.emit('join', { appId })
			const appUuid = localStorage.getItem('scalechat_app_id')
			if (appUuid && appUuid !== appId) {
				socket.emit('join', { appId: appUuid })
			}
		}

		const handleConnect = () => {
			console.log('[Socket] Connected')
			joinConversationRooms()
		}

		const handleMessageCreated = (data: any) => {
			console.log('[Socket] New message:', data)
			const { message, conversation } = data || {}
			if (!message || !conversation?.id) return

			const fallbackSenderLabel =
				toNullableString(message?.sender_id) === String(currentUserIdRef.current)
					? currentUserNameRef.current
					: null
			const incomingMessage = toChatMessage(message, {
				fallbackTimestamp: message.created_at || Date.now(),
				fallbackSenderLabel,
			})
			const messageType = incomingMessage.type
			const messageTimestamp = incomingMessage.timestamp
			const isViewingConversation =
				selectedConversationIdRef.current === conversation.id

			if (
				messageType === 'incoming' &&
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
						message.content || 'You have a new message',
					)
				}
				document.title = '(1) New Message - ScaleChat'
			}

			setConversations((prev) =>
				(() => {
					const existingConversation = prev.find(
						(c) => c.id === conversation.id,
					)
					const baseConversation = mapRawConversation(
						conversation,
						existingConversation,
					)

					const existingMessages = baseConversation.messages || []
					const exists = existingMessages.some(
						(m) =>
							m.id === message.id ||
							(message.unique_temp_id && m.id === message.unique_temp_id),
					)
					const nextMessages = exists
						? existingMessages.map((m) =>
								m.id === message.id ||
								(message.unique_temp_id && m.id === message.unique_temp_id)
									? incomingMessage
									: m,
							)
						: [...existingMessages, incomingMessage]

					const updatedConversation: ChatConversation = {
						...baseConversation,
						lastMessage: message.content || '',
						timestamp: messageTimestamp,
						unread:
							isViewingConversation || messageType !== 'incoming'
								? baseConversation.unread
								: baseConversation.unread + 1,
						messages: sortMessagesChronologically(nextMessages),
					}

					const nextConversations = existingConversation
						? prev.map((c) =>
								c.id === conversation.id ? updatedConversation : c,
							)
						: [updatedConversation, ...prev]

					return nextConversations.sort(
						(a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
					)
				})(),
			)

			setSelectedConversation((prev) => {
				if (!prev || prev.id !== conversation.id) return prev

				const existingMessages = prev.messages || []
				const exists = existingMessages.some(
					(m) =>
						m.id === message.id ||
						(message.unique_temp_id && m.id === message.unique_temp_id),
				)
				const nextMessages = exists
					? existingMessages.map((m) =>
							m.id === message.id ||
							(message.unique_temp_id && m.id === message.unique_temp_id)
								? incomingMessage
								: m,
						)
					: [...existingMessages, incomingMessage]

				const mergedSelectedConversation = mapRawConversation(conversation, prev)

				return {
					...mergedSelectedConversation,
					lastMessage: message.content,
					timestamp: messageTimestamp,
					unread: 0,
					messages: sortMessagesChronologically(nextMessages),
				}
			})
		}

		const handleMessageStatusUpdated = (data: {
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
		}

		const handleConversationRead = (data: { conversation_id: string }) => {
			setConversations((prev) =>
				prev.map((c) =>
					c.id === data.conversation_id ? { ...c, unread: 0 } : c,
				),
			)
		}

		const handleConversationAssigned = (data: {
			conversation_id: string
			assignee_id: string
		}) => {
			setConversations((prev) =>
				prev.map((c) =>
					c.id === data.conversation_id
						? { ...c, assigneeId: data.assignee_id, status: 'open' }
						: c,
				),
			)
			setSelectedConversation((prev) =>
				prev && prev.id === data.conversation_id
					? { ...prev, assigneeId: data.assignee_id, status: 'open' }
					: prev,
			)
		}

		const handleConversationResolved = (data: { conversationId: string }) => {
			setConversations((prev) =>
				prev.map((c) =>
					c.id === data.conversationId ? { ...c, status: 'resolved' } : c,
				),
			)
			setSelectedConversation((prev) =>
				prev && prev.id === data.conversationId
					? { ...prev, status: 'resolved' }
					: prev,
			)
		}

		const handleDisconnect = () => {
			console.log('[Socket] Disconnected')
		}

		socket.on('connect', handleConnect)
		socket.on('message:created', handleMessageCreated)
		socket.on('message:status_updated', handleMessageStatusUpdated)
		socket.on('conversation:read', handleConversationRead)
		socket.on('conversation:assigned', handleConversationAssigned)
		socket.on('conversation:resolved', handleConversationResolved)
		socket.on('disconnect', handleDisconnect)

		if (socket.connected) {
			joinConversationRooms()
		}

		socketRef.current = socket
		return () => {
			socket.off('connect', handleConnect)
			socket.off('message:created', handleMessageCreated)
			socket.off('message:status_updated', handleMessageStatusUpdated)
			socket.off('conversation:read', handleConversationRead)
			socket.off('conversation:assigned', handleConversationAssigned)
			socket.off('conversation:resolved', handleConversationResolved)
			socket.off('disconnect', handleDisconnect)
			socketDisconnectTimeoutRef.current = setTimeout(() => {
				if (
					socketRef.current !== socket ||
					socketConnectionKeyRef.current !== connectionKey
				) {
					return
				}
				socket.disconnect()
				socketRef.current = null
				socketConnectionKeyRef.current = null
				socketDisconnectTimeoutRef.current = null
			}, 0)
		}
	}, [appId, API_BASE, mapRawConversation])

	useEffect(() => {
		loadConversations()
	}, [loadConversations])

	// Auto-select conversation if coming back from customer detail
	useEffect(() => {
		if (
			!preselectedConversationId ||
			conversations.length === 0 ||
			selectedConversation
		) {
			return
		}

		const conv = conversations.find((c) => c.id === preselectedConversationId)
		if (conv) {
			void handleSelectConversation(conv)
		}
	}, [preselectedConversationId, conversations, selectedConversation])

	// Keep URL query in sync with selected chat for direct linking
	useEffect(() => {
		const selectedConversationId = selectedConversation?.id
		if (!selectedConversationId) return
		if (selectedConversationId === preselectedConversationId) return

		void navigate({
			to: '/chat',
			search: { conversation_id: selectedConversationId },
			replace: true,
		})
	}, [navigate, preselectedConversationId, selectedConversation?.id])

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [selectedConversation?.messages])

	useEffect(() => {
		if (typeof window === 'undefined') return

		const hidden = mobileView === 'chat' && Boolean(selectedConversation?.id)
		window.dispatchEvent(
			new CustomEvent('scalechat:bottom-nav-visibility', {
				detail: { hidden },
			}),
		)

		return () => {
			window.dispatchEvent(
				new CustomEvent('scalechat:bottom-nav-visibility', {
					detail: { hidden: false },
				}),
			)
		}
	}, [mobileView, selectedConversation?.id])

	useEffect(() => {
		if (!activeImageMessageId) return
		const exists = chatroomImageMessages.some(
			(image) => image.id === activeImageMessageId,
		)
		if (!exists) {
			setActiveImageMessageId(null)
			setIsImageViewerLoadError(false)
		}
	}, [activeImageMessageId, chatroomImageMessages])

	useEffect(() => {
		if (!activeImage) return

		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closeImageViewer()
				return
			}
			if (event.key === 'ArrowLeft') {
				event.preventDefault()
				showPreviousImage()
				return
			}
			if (event.key === 'ArrowRight') {
				event.preventDefault()
				showNextImage()
			}
		}

		window.addEventListener('keydown', handleKeyDown)

		return () => {
			window.removeEventListener('keydown', handleKeyDown)
			document.body.style.overflow = previousOverflow
		}
	}, [activeImage, closeImageViewer, showNextImage, showPreviousImage])

	// --- Handlers ---

	const handleSelectConversation = async (conv: ChatConversation) => {
		setMobileView('chat')
		setShowAgentSelector(false)

		if (conv.id) {
			try {
				const data: any = await conversationsApi.getMessages(conv.id)
				const rawMessages =
					data.results?.messages || data.payload || data.data || []
				const messages = sortMessagesChronologically(
					rawMessages.map((m: any) =>
						toChatMessage(m, {
							fallbackTimestamp: m?.created_at || Date.now(),
						}),
					),
				)

				const updatedConv = { ...conv, messages, unread: 0 }
				setSelectedConversation(updatedConv)
				setConversations((prev) =>
					prev.map((c) => (c.id === conv.id ? updatedConv : c)),
				)

				// Mark as read in API
				try {
					await conversationsApi.markAsRead(conv.id)
				} catch (err) {
					console.error('Failed to mark as read in API:', err)
				}

				// Load Agents
				try {
					const agentsData: any = await conversationsApi.getAgents(conv.id)
					if (agentsData.success)
						setConversationAgents(agentsData.payload || [])
				} catch (e) {
					console.error('Failed to load conversation agents:', e)
					setConversationAgents([])
				}

				// Load Activity
				try {
					const activityData: any = await conversationsApi.getActivity(conv.id)
					if (activityData.success)
						setConversationActivity(activityData.payload || [])
				} catch (e) {
					console.error('Failed to load conversation activity:', e)
					setConversationActivity([])
				}

				// Load History
				if (conv.contactId) {
					try {
						const historyData: any = await contactConversations.list(
							conv.contactId,
						)
						const historyPayload = Array.isArray(historyData?.payload)
							? historyData.payload
							: Array.isArray(historyData?.data)
								? historyData.data
								: []
						setConversationHistory(historyPayload)
					} catch (e) {
						console.error('Failed to load history:', e)
						setConversationHistory([])
					}
				} else {
					setConversationHistory([])
				}
			} catch (error) {
				console.error('Failed to load messages:', error)
				setSelectedConversation({ ...conv, unread: 0 })
				setConversationAgents([])
				setConversationActivity([])
				setConversationHistory([])
			}
		}
	}

	const handleSendMessage = async (messageContent?: string) => {
		const content = messageContent || newMessage
		if (!content.trim() || !selectedConversation || isSending) return
		if (
			selectedConversation.channel === 'whatsapp' &&
			selectedConversation.whatsappWindowExpired
		) {
			notifyMessagingWindowExpired(selectedConversation)
			return
		}

		setIsSending(true)

		const tempId = Date.now().toString()
		const createdAt = new Date()
		const newMsg: ChatMessage = {
			id: tempId,
			content: content.trim(),
			type: 'outgoing',
			timestamp: createdAt,
			status: 'sending',
			isAI: !!messageContent,
			replyToMessageId: replyingTo?.id || null,
			senderType: 'agent',
			senderId: currentUserId || null,
			statusAt: createdAt,
			senderLabel: currentUserName || null,
		}

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
		setReplyingTo(null)
		setNewMessage('')

		try {
			const result: any = await conversationsApi.sendMessage(
				selectedConversation.id,
				{
					content: content.trim(),
					unique_temp_id: tempId,
					...(replyingTo ? { reply_to_message_id: replyingTo.id } : {}),
				},
			)
			const serverMessageId = result?.data?.id || result?.id

			// Simulation of status updates for UX
			await new Promise((r) => setTimeout(r, 500))
			const sentAt = new Date()
			const sentConv = {
				...updatedConv,
				messages: updatedConv.messages.map((m) =>
					m.id === newMsg.id
						? {
								...m,
								id: serverMessageId || m.id,
								status: 'sent' as const,
								statusAt: sentAt,
							}
						: m,
				),
			}
			setSelectedConversation(sentConv)
			setConversations((prev) =>
				prev.map((c) => (c.id === sentConv.id ? sentConv : c)),
			)

			await new Promise((r) => setTimeout(r, 800))
			const resolvedId = serverMessageId || newMsg.id
			const deliveredAt = new Date()
			const deliveredConv = {
				...sentConv,
				messages: sentConv.messages.map((m) =>
					m.id === resolvedId
						? { ...m, status: 'delivered' as const, statusAt: deliveredAt }
						: m,
				),
			}
			setSelectedConversation(deliveredConv)
			setConversations((prev) =>
				prev.map((c) => (c.id === deliveredConv.id ? deliveredConv : c)),
			)
		} catch (error: any) {
			console.error('Failed to send message:', error)
			showSendMessageError(
				error,
				selectedConversation.phone || selectedConversation.identifier,
			)
			// Revert optimistic update — mark message as failed
			setSelectedConversation((prev) => {
				if (!prev) return prev
				const failedAt = new Date()
				return {
					...prev,
					messages: prev.messages.map((m) =>
						m.id === tempId
							? { ...m, status: 'failed' as const, statusAt: failedAt }
							: m,
					),
				}
			})
		} finally {
			setIsSending(false)
		}
	}

	const handleSendTemplate = async (template: any) => {
		if (!selectedConversation) return
		if (
			selectedConversation.channel === 'whatsapp' &&
			selectedConversation.whatsappWindowExpired
		) {
			notifyMessagingWindowExpired(selectedConversation)
			return
		}
		try {
			const content = {
				name: template.name,
				language: { code: template.language },
				components: [{ type: 'body', parameters: [] }],
			}
			const createdAt = new Date()
			const optimisticMsg: ChatMessage = {
				id: 'temp-' + Date.now(),
				content: `Template: ${template.name}`,
				type: 'outgoing',
				timestamp: createdAt,
				status: 'sending',
				senderType: 'agent',
				senderId: currentUserId || null,
				statusAt: createdAt,
				senderLabel: currentUserName || null,
			}
			const updatedConv = {
				...selectedConversation,
				messages: [...selectedConversation.messages, optimisticMsg],
				lastMessage: `Template: ${template.name}`,
				timestamp: new Date(),
			}
			setSelectedConversation(updatedConv)
			setConversations((prev) =>
				prev.map((c) => (c.id === selectedConversation.id ? updatedConv : c)),
			)

			await conversationsApi.sendMessage(selectedConversation.id, {
				content: content,
				type: 'template',
			} as any)
			setShowTemplateModal(false)
		} catch (error: unknown) {
			console.error('Failed to send template:', error)
			showSendMessageError(
				error,
				selectedConversation.phone || selectedConversation.identifier,
			)
		}
	}

	const handleCopySessionId = useCallback(async (sessionId: string) => {
		if (!sessionId) return

		try {
			if (
				typeof navigator !== 'undefined' &&
				navigator.clipboard &&
				typeof navigator.clipboard.writeText === 'function'
			) {
				await navigator.clipboard.writeText(sessionId)
			} else if (typeof document !== 'undefined') {
				const textarea = document.createElement('textarea')
				textarea.value = sessionId
				textarea.style.position = 'fixed'
				textarea.style.opacity = '0'
				document.body.appendChild(textarea)
				textarea.select()
				document.execCommand('copy')
				document.body.removeChild(textarea)
			}

			toast.success('Session ID copied')
		} catch (error) {
			console.error('Failed to copy session id:', error)
			toast.error('Failed to copy session ID')
		}
	}, [])

	const channelFilterLabel =
		channelFilter === 'all'
			? 'Channel'
			: channelFilter === 'whatsapp'
				? 'WhatsApp'
				: channelFilter === 'instagram'
					? 'Instagram'
					: 'TikTok'
	const assignmentFilterLabel =
		assignmentFilter === 'all'
			? 'Owner'
			: assignmentFilter === 'mine'
				? 'Mine'
				: assignmentFilter === 'unassigned'
					? 'Unassigned'
					: 'Others'

	const filteredConversations = conversations.filter((conv) => {
		if (channelFilter !== 'all' && conv.channel !== channelFilter) return false

		// Status Filter
		if (
			statusFilter === 'unserved' &&
			(conv.assigneeId || conv.status === 'resolved')
		)
			return false
		if (
			statusFilter === 'served' &&
			(!conv.assigneeId || conv.status === 'resolved')
		)
			return false
		if (statusFilter === 'resolved' && conv.status !== 'resolved') return false

		// Assignment Filter
		if (
			assignmentFilter === 'mine' &&
			conv.assigneeId !== String(currentUserId)
		)
			return false
		if (assignmentFilter === 'unassigned' && conv.assigneeId) return false
		if (
			assignmentFilter === 'others' &&
			(!conv.assigneeId || conv.assigneeId === String(currentUserId))
		)
			return false

		if (unreadOnly && conv.unread <= 0) return false

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			const matchesName = conv.name.toLowerCase().includes(query)
			const matchesPhone = conv.phone.toLowerCase().includes(query)
			const matchesMessage = conv.lastMessage.toLowerCase().includes(query)
			if (!matchesName && !matchesPhone && !matchesMessage) return false
		}
		return true
	})

	const visibleConversationIds = useMemo(
		() => filteredConversations.map((conversation) => conversation.id),
		[filteredConversations],
	)
	const allVisibleSelected =
		visibleConversationIds.length > 0 &&
		visibleConversationIds.every((conversationId) =>
			selectedConversationIds.has(conversationId),
		)
	const someVisibleSelected =
		!allVisibleSelected &&
		visibleConversationIds.some((conversationId) =>
			selectedConversationIds.has(conversationId),
		)

	const toggleConversationSelection = useCallback((conversationId: string) => {
		setSelectedConversationIds((previous) => {
			const next = new Set(previous)
			if (next.has(conversationId)) {
				next.delete(conversationId)
			} else {
				next.add(conversationId)
			}
			return next
		})
	}, [])

	const toggleSelectAllVisible = useCallback(() => {
		setSelectedConversationIds((previous) => {
			const next = new Set(previous)
			if (visibleConversationIds.length === 0) return next

			const shouldSelectAll = !visibleConversationIds.every((conversationId) =>
				next.has(conversationId),
			)

			for (const conversationId of visibleConversationIds) {
				if (shouldSelectAll) {
					next.add(conversationId)
				} else {
					next.delete(conversationId)
				}
			}

			return next
		})
	}, [visibleConversationIds])

	const closeSelectionMode = useCallback(() => {
		setIsSelectionMode(false)
		setSelectedConversationIds(new Set<string>())
		setShowBulkEditModal(false)
		setBulkEditForm(EMPTY_BULK_EDIT_FORM)
	}, [])

	const openBulkEditModal = useCallback(() => {
		if (selectedConversationCount === 0) {
			toast.error('Please select at least one conversation')
			return
		}

		setShowBulkEditModal(true)
		void loadConversationFilterOptions()
	}, [loadConversationFilterOptions, selectedConversationCount])

	const pollBulkEditJob = useCallback(
		async (jobId: string, requested: number) => {
			setIsPollingBulkEditJob(true)
			const maxAttempts = 80

			try {
				for (let attempt = 0; attempt < maxAttempts; attempt++) {
					const response: any = await conversationsApi.getBulkEditJob(jobId)
					const payload = response?.payload || response?.data || response || {}
					const state = String(payload?.state || '')

					if (state === 'completed') {
						const result = payload?.result || {}
						const updated = Number(result?.updated ?? result?.processed ?? 0)
						const failed = Number(result?.failed ?? 0)

						if (failed > 0) {
							toast.error(
								`Bulk update completed with ${failed} failed conversation(s)`,
							)
						} else {
							const fallbackUpdated = updated > 0 ? updated : requested
							toast.success(
								`Bulk update completed for ${fallbackUpdated} conversation${fallbackUpdated === 1 ? '' : 's'}`,
							)
						}

						void loadConversations({ reset: true })
						return
					}

					if (state === 'failed') {
						toast.error(
							payload?.error || 'Bulk update failed while processing changes',
						)
						return
					}

					await new Promise((resolve) => setTimeout(resolve, 1500))
				}

				toast.message('Bulk update is still running. Refreshing conversations...')
			} catch (error: any) {
				console.error('Failed polling bulk edit job:', error)
				toast.error(error?.message || 'Failed to check bulk update status')
			} finally {
				setIsPollingBulkEditJob(false)
				void loadConversations({ reset: true })
			}
		},
		[loadConversations],
	)

	const handleSubmitBulkEdit = useCallback(async () => {
		const conversationIds = Array.from(selectedConversationIds)
		if (conversationIds.length === 0) {
			toast.error('Please select at least one conversation')
			return
		}

		const payload: {
			conversationIds: string[]
			collaboratorIds?: string[]
			handledById?: string
			labelId?: string
			pipelineStageId?: string
			resolveStatus?: 'open' | 'pending' | 'resolved'
		} = {
			conversationIds,
		}

		if (bulkEditForm.collaboratorIds.length > 0) {
			payload.collaboratorIds = bulkEditForm.collaboratorIds
		}
		if (bulkEditForm.handledById) payload.handledById = bulkEditForm.handledById
		if (bulkEditForm.labelId) payload.labelId = bulkEditForm.labelId
		if (bulkEditForm.pipelineStageId) {
			payload.pipelineStageId = bulkEditForm.pipelineStageId
		}
		if (bulkEditForm.resolveStatus) {
			payload.resolveStatus = bulkEditForm.resolveStatus
		}

		const hasActionSelected = Object.keys(payload).some(
			(key) => key !== 'conversationIds',
		)
		if (!hasActionSelected) {
			toast.error('Please choose at least one field to update')
			return
		}

		setIsSubmittingBulkEdit(true)
		try {
			const response: any = await conversationsApi.bulkEdit(payload)
			const queued = response?.payload || response?.data || response || {}
			const jobId = queued.jobId ? String(queued.jobId) : ''
			if (!jobId) {
				throw new Error('Bulk update job was queued without a valid job id')
			}

			toast.success(
				`Queued bulk update for ${conversationIds.length} conversation${conversationIds.length === 1 ? '' : 's'}`,
			)
			setShowBulkEditModal(false)
			setIsSelectionMode(false)
			setSelectedConversationIds(new Set<string>())
			setBulkEditForm(EMPTY_BULK_EDIT_FORM)
			void pollBulkEditJob(jobId, conversationIds.length)
		} catch (error: any) {
			console.error('Failed to queue bulk update:', error)
			toast.error(error?.message || 'Failed to queue bulk update')
		} finally {
			setIsSubmittingBulkEdit(false)
		}
	}, [bulkEditForm, pollBulkEditJob, selectedConversationIds])

	const selectedMessages = selectedConversation?.messages || []

	const selectedMessageById = useMemo(() => {
		const lookup = new Map<string, ChatMessage>()
		for (const message of selectedMessages) {
			lookup.set(message.id, message)
		}
		return lookup
	}, [selectedMessages])

	const groupedConversationMessages = useMemo(
		() => groupAdjacentMessagesByMinute(selectedMessages),
		[selectedMessages],
	)

	const aiAgentNameByMessageId = useMemo(() => {
		const mapping = new Map<string, string>()
		if (!selectedMessages.length) return mapping

		const orderedMessages = sortMessagesChronologically(selectedMessages)
		let latestKnownAiAgent: string | null = null

		for (const message of orderedMessages) {
			if (message.type === 'system') {
				const systemAgentLabel = extractAiAgentNameFromSystemContent(
					message.content,
				)
				if (systemAgentLabel) latestKnownAiAgent = systemAgentLabel
				continue
			}

			if (message.type !== 'outgoing' || !message.isAI) continue

			const directAiAgent = resolveAiAgentName(message)
			if (directAiAgent) latestKnownAiAgent = directAiAgent

			if (latestKnownAiAgent) {
				mapping.set(message.id, latestKnownAiAgent)
			}
		}

		let nearestNextAiAgent: string | null = null
		for (let idx = orderedMessages.length - 1; idx >= 0; idx -= 1) {
			const message = orderedMessages[idx]
			if (message.type !== 'outgoing' || !message.isAI) continue

			const directAiAgent = resolveAiAgentName(message)
			if (directAiAgent) nearestNextAiAgent = directAiAgent

			if (!mapping.has(message.id) && nearestNextAiAgent) {
				mapping.set(message.id, nearestNextAiAgent)
			}
		}

		return mapping
	}, [selectedMessages])

	useEffect(() => {
		const container = conversationsScrollRef.current
		const trigger = loadMoreTriggerRef.current
		if (!container || !trigger || !hasMoreConversations) return

		const observer = new IntersectionObserver(
			(entries) => {
				const shouldLoad = entries.some((entry) => entry.isIntersecting)
				if (shouldLoad) {
					loadMoreConversations()
				}
			},
			{
				root: container,
				rootMargin: '220px 0px',
				threshold: 0.01,
			},
		)

		observer.observe(trigger)
		return () => observer.disconnect()
	}, [
		filteredConversations.length,
		hasMoreConversations,
		loadMoreConversations,
	])

	useEffect(() => {
		setSelectedConversationIds((previous) => {
			if (previous.size === 0) return previous

			const existingIds = new Set(conversations.map((conversation) => conversation.id))
			let changed = false
			const next = new Set<string>()

			previous.forEach((conversationId) => {
				if (existingIds.has(conversationId)) {
					next.add(conversationId)
				} else {
					changed = true
				}
			})

			return changed ? next : previous
		})
	}, [conversations])

	const renderAiSummarySection = (paddingClass: string) => (
		<div className={`${paddingClass} border-t border-gray-100`}>
			<div className="flex items-center justify-between">
				<h5 className="text-sm font-semibold text-gray-900">AI Summary</h5>
				{isGeneratingAiSuggestion && (
					<RefreshCw className="h-4 w-4 text-emerald-600 animate-spin" />
				)}
			</div>
			<button
				type="button"
				onClick={() => void handleGenerateAiSummary()}
				disabled={isGeneratingAiSuggestion || !selectedConversation}
				className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
			>
				<Sparkles className="h-4 w-4" />
				Generate AI Summary
			</button>
			<p className="mt-2 text-xs text-gray-500">
				Ringkasan akan dikirim sebagai message system di timeline chat.
			</p>
		</div>
	)

	const renderAdditionalFieldInput = (field: AdditionalFieldDefinition) => {
		const value = additionalInfoValues[field.fieldKey]

		return (
			<div key={field.id} className="space-y-1">
				<label className="text-xs font-medium text-gray-600">
					{field.fieldLabel}
					{field.isRequired ? (
						<span className="text-red-500 ml-1">*</span>
					) : null}
				</label>

				{field.fieldType === 'dropdown' ? (
					<select
						value={typeof value === 'string' ? value : ''}
						onChange={(event) => {
							const nextValue = event.target.value
							handleAdditionalInfoValueChange(field.fieldKey, nextValue)
						}}
						className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
					>
						<option value="">Select option</option>
						{field.options.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				) : field.fieldType === 'checkbox' ? (
					<select
						value={value === true ? 'true' : value === false ? 'false' : ''}
						onChange={(event) => {
							const selected = event.target.value
							const nextValue = selected === '' ? null : selected === 'true'
							handleAdditionalInfoValueChange(field.fieldKey, nextValue)
						}}
						className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
					>
						<option value="">Select value</option>
						<option value="true">True</option>
						<option value="false">False</option>
					</select>
				) : field.fieldType === 'number' ? (
					<input
						type="number"
						value={value === null || value === undefined ? '' : String(value)}
						onChange={(event) =>
							handleAdditionalInfoValueChange(
								field.fieldKey,
								event.target.value,
							)
						}
						placeholder="Enter number"
						className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
					/>
				) : field.fieldType === 'date' ? (
					<input
						type="date"
						value={formatDateValueForInput(value)}
						onChange={(event) =>
							handleAdditionalInfoValueChange(
								field.fieldKey,
								event.target.value,
							)
						}
						className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
					/>
				) : (
					<input
						type="text"
						value={
							typeof value === 'string'
								? value
								: value === null || value === undefined
									? ''
									: String(value)
						}
						onChange={(event) =>
							handleAdditionalInfoValueChange(
								field.fieldKey,
								event.target.value,
							)
						}
						placeholder="Type value"
						className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
					/>
				)}
			</div>
		)
	}

	const renderAdditionalDataSection = (paddingClass: string) => (
		<div className={`${paddingClass} border-t border-gray-100`}>
			<button
				type="button"
				onClick={() => setIsAdditionalDataExpanded((prev) => !prev)}
				className="flex w-full items-center justify-between"
			>
				<h5 className="text-sm font-semibold text-gray-900">Additional Data</h5>
				<ChevronDown
					className={`h-4 w-4 text-gray-500 transition-transform ${isAdditionalDataExpanded ? 'rotate-180' : ''}`}
				/>
			</button>

			{isAdditionalDataExpanded && (
				<div className="mt-3 space-y-3">
					<button
						type="button"
						onClick={() => setShowAddAdditionalInfoModal(true)}
						className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						<Plus className="h-4 w-4" />
						Add New Additional Info
					</button>

					{isLoadingAdditionalFields || isLoadingAdditionalInfo ? (
						<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
							Loading additional data...
						</div>
					) : !selectedConversation?.contactId ? (
						<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
							Customer is not linked yet for this conversation.
						</div>
					) : visibleAdditionalFields.length === 0 ? (
						<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
							No additional fields configured.
						</div>
					) : (
						<div className="space-y-3">
							{visibleAdditionalFields.map((field) =>
								renderAdditionalFieldInput(field),
							)}
							<div className="pt-2">
								<button
									type="button"
									onClick={() => void handleSaveAdditionalInfo()}
									disabled={
										isSavingAdditionalInfo ||
										!hasAdditionalInfoChanges ||
										!selectedConversation?.contactId
									}
									className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
								>
									{isSavingAdditionalInfo && (
										<RefreshCw className="h-4 w-4 animate-spin" />
									)}
									Save
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)

	const ticketBoards = ticketSettings?.boards || []
	const hasTicketBoards = ticketBoards.length > 0

	const renderSidebarTabs = (
		_activeTab: SidebarInfoTab,
		_onChange: (tab: SidebarInfoTab) => void,
	) => null

	const renderOrdersTabContent = (paddingClass: string) => (
		<div className={paddingClass}>
			<div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
				<button
					type="button"
					onClick={() => setIsCreateOrderExpanded((prev) => !prev)}
					className="flex w-full items-center justify-between border-b border-gray-200 px-4 py-3 text-left"
				>
					<span className="text-sm font-semibold text-gray-900">
						Create Order
					</span>
					<ChevronDown
						className={`h-4 w-4 text-gray-500 transition-transform ${
							isCreateOrderExpanded ? 'rotate-180' : ''
						}`}
					/>
				</button>

				{isCreateOrderExpanded ? (
					<div className="space-y-2 p-3">
						<div>
							<label className="mb-1.5 block text-sm font-medium text-gray-700">
								Products <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								value={orderProductSearch}
								onChange={(event) => setOrderProductSearch(event.target.value)}
								placeholder="Search Product"
								className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400"
							/>
							<div className="mt-2 grid grid-cols-2 gap-2">
								<button
									type="button"
									onClick={() =>
										toast.info('Product picker will be available soon')
									}
									className="h-10 rounded-md border border-blue-500 bg-white text-sm font-semibold text-blue-600 hover:bg-blue-50"
								>
									Select products
								</button>
								<button
									type="button"
									onClick={() =>
										toast.info('Custom product flow will be available soon')
									}
									className="h-10 rounded-md border border-blue-500 bg-white text-sm font-semibold text-blue-600 hover:bg-blue-50"
								>
									Add custom
								</button>
							</div>
						</div>

						<div>
							<div className="mb-1.5 flex items-center justify-between">
								<label className="text-sm font-medium text-gray-700">
									Address
								</label>
								<button
									type="button"
									onClick={() =>
										toast.info('Map picker will be available soon')
									}
									className="text-xs font-semibold text-blue-600 hover:text-blue-700"
								>
									Select from map
								</button>
							</div>
							<textarea
								value={orderAddress}
								onChange={(event) => setOrderAddress(event.target.value)}
								placeholder="Type address here..."
								rows={2}
								className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
							/>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-medium text-gray-700">
								Notes
							</label>
							<textarea
								value={orderNotes}
								onChange={(event) => setOrderNotes(event.target.value)}
								placeholder="Type notes here..."
								rows={2}
								className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
							/>
						</div>

						<div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
							<p className="text-sm text-amber-800">
								Xendit is not configured. Please set up Xendit to enable Link
								payment.
							</p>
							<button
								type="button"
								onClick={() =>
									toast.info('Xendit setup flow will be available soon')
								}
								className="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
							>
								Setup Xendit
							</button>
						</div>

						<div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
							<p className="text-sm text-amber-800">
								No bank accounts found. Please add a bank account to enable
								Manual payment.
							</p>
							<button
								type="button"
								onClick={() =>
									toast.info('Bank account setup flow will be available soon')
								}
								className="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
							>
								Setup Bank Account
							</button>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-medium text-gray-700">
								Shipping
							</label>
							<input
								type="number"
								value={orderShipping}
								onChange={(event) => setOrderShipping(event.target.value)}
								className="h-10 w-full rounded-md border border-gray-200 px-3 text-right text-sm text-gray-900"
							/>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-medium text-gray-700">
								Discount
							</label>
							<input
								type="number"
								value={orderDiscount}
								onChange={(event) => setOrderDiscount(event.target.value)}
								className="h-10 w-full rounded-md border border-gray-200 px-3 text-right text-sm text-gray-900"
							/>
						</div>

						<div>
							<label className="mb-1.5 block text-sm font-medium text-gray-700">
								VAT
							</label>
							<input
								type="number"
								value={orderVat}
								onChange={(event) => setOrderVat(event.target.value)}
								className="h-10 w-full rounded-md border border-gray-200 px-3 text-right text-sm text-gray-900"
							/>
						</div>
					</div>
				) : null}
			</div>
		</div>
	)

	const renderTicketTabContent = (paddingClass: string) => (
		<div className={paddingClass}>
			<div className="space-y-4">
				<div>
					<label className="mb-1 block text-xs font-medium text-gray-500">
						Ticket Board
					</label>
					<select
						value={selectedTicketBoardId || ''}
						onChange={(event) =>
							void handleSelectTicketBoard(event.target.value || null)
						}
						disabled={
							isLoadingTicketSettings ||
							isUpdatingTicketDefaultBoard ||
							!hasTicketBoards
						}
						className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{hasTicketBoards ? (
							ticketBoards.map((board) => (
								<option key={board.id} value={board.id}>
									{board.board_name}
								</option>
							))
						) : (
							<option value="">No ticket boards available</option>
						)}
					</select>
				</div>

				{!hasTicketBoards ? (
					<div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
						No ticket board configured yet. Setup board and statuses first.
					</div>
				) : isLoadingConversationTicketSummary ? (
					<div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
						Loading conversation ticket summary...
					</div>
				) : conversationTicketSummary ? (
					<div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
						<div className="flex items-center justify-between gap-2">
							<h4 className="text-sm font-semibold text-blue-900">
								Conversation Ticket
							</h4>
							<span className="text-xs text-blue-700">
								{conversationTicketSummary.stage_name || 'Unassigned'}
							</span>
						</div>
						<div className="mt-3 space-y-2 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-blue-700/80">Board</span>
								<span className="font-medium text-blue-900">
									{conversationTicketSummary.board_name}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-blue-700/80">Deal Value</span>
								<span className="font-semibold text-blue-900">
									{formatTicketDealValue(conversationTicketSummary.deal_value)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-blue-700/80">Status</span>
								<span className="font-medium text-blue-900">
									{conversationTicketSummary.conversation_status || '-'}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-blue-700/80">Updated</span>
								<span className="text-xs font-medium text-blue-900">
									{formatTicketTimestamp(conversationTicketSummary.updated_at)}
								</span>
							</div>
						</div>
					</div>
				) : (
					<div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
						This conversation is not linked to a ticket in the selected board.
					</div>
				)}

				<button
					type="button"
					onClick={openFullTicketBoard}
					disabled={!hasTicketBoards}
					className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
				>
					<Ticket className="h-4 w-4" />
					Open Tickets Board
				</button>
			</div>
		</div>
	)

	return (
		<div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background md:flex-row">
			{/* Left Panel: Conversation List */}
			<div
				className={`flex min-h-0 w-full flex-col overflow-hidden border-r border-gray-200 bg-card md:w-[320px] lg:w-[420px] ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}
			>
				<div className="sticky top-0 z-20 shrink-0 border-b border-gray-100 bg-background/95 backdrop-blur">
					{/* Header */}
					<div className="space-y-2 p-3">
						{/* Warning Alert */}
						{showWarning && (
							<div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 relative animate-in fade-in slide-in-from-top-2 duration-300">
								<div className="p-2 bg-white rounded-lg shadow-sm">
									<Instagram className="h-4 w-4 text-gray-700" />
								</div>
								<div className="flex-1">
									<p className="text-[13px] font-medium text-amber-900 leading-tight">
										Instagram not connected. Some messages may not appear.
									</p>
								</div>
								<button className="px-3 py-1.5 bg-white border border-amber-200 text-amber-900 text-xs font-semibold rounded-lg shadow-sm hover:bg-amber-100 transition-colors">
									Connect
								</button>
								<button
									onClick={() => setShowWarning(false)}
									className="p-1 hover:bg-amber-100 rounded-full transition-colors"
								>
									<ChevronDown className="h-4 w-4 text-amber-800 rotate-90" />
								</button>
							</div>
						)}

						{/* Header Row */}
						{isSearchOpen ? (
							<div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right duration-200">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
									<input
										ref={searchInputRef}
										type="text"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search conversations..."
										className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm transition-all focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
										autoFocus
									/>
								</div>
								<button
									onClick={() => {
										setIsSearchOpen(false)
										setSearchQuery('')
									}}
									className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						) : isSelectionMode ? (
							<div className="border-b border-gray-100 bg-white pb-2">
								<div className="flex items-center justify-between gap-3 px-1 py-1 md:px-2 md:py-1.5">
									<button
										type="button"
										onClick={toggleSelectAllVisible}
										className="inline-flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-gray-100"
									>
										<span
											className={`flex h-5 w-5 items-center justify-center rounded-md border text-white ${
												allVisibleSelected || someVisibleSelected
													? 'border-blue-600 bg-blue-600'
													: 'border-gray-300 bg-white'
											}`}
										>
											{allVisibleSelected ? (
												<Check className="h-3.5 w-3.5" />
											) : someVisibleSelected ? (
												<span className="h-0.5 w-2.5 rounded bg-white" />
											) : null}
										</span>
										<span className="text-[15px] font-semibold text-gray-900">
											Select All
										</span>
									</button>

									<div className="flex items-center gap-3">
										<button
											type="button"
											onClick={openBulkEditModal}
											disabled={
												selectedConversationCount === 0 || isPollingBulkEditJob
											}
											className="text-[15px] font-semibold text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:text-gray-300"
										>
											Edit
										</button>
										{selectedConversationCount > 0 && (
											<span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-blue-700 px-2 text-sm font-semibold text-white">
												{selectedConversationCount}
											</span>
										)}
										<button
											type="button"
											onClick={closeSelectionMode}
											className="text-[15px] font-semibold text-green-600 transition-colors hover:text-green-700"
										>
											Done
										</button>
									</div>
								</div>
								{isPollingBulkEditJob && (
									<p className="px-2 pb-1 text-xs font-medium text-blue-600">
										Applying bulk update in background...
									</p>
								)}
							</div>
						) : (
							<div className="border-b border-gray-100 bg-white pb-2">
								<div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-1 py-1 md:px-2 md:py-1.5">
									<div className="relative z-30 min-w-0">
										<button
											onClick={() => {
												setIsPipelineOpen(!isPipelineOpen)
											}}
											className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
										>
											<span className="truncate">
												{selectedPipeline === null
													? 'All Agents'
													: (availableAgents.find(
															(a) => a.id === selectedPipeline,
														)?.name || 'All Agents')}
											</span>
											<ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
										</button>
										{isPipelineOpen && (
											<>
												<div
													className="fixed inset-0 z-10"
													onClick={() => setIsPipelineOpen(false)}
												/>
												<div className="absolute left-0 top-full z-50 mt-2 w-[calc(100vw-40px)] min-w-[14rem] max-w-[calc(100vw-40px)] rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150 sm:w-full sm:max-w-none">
													<div className="mb-1 border-b border-gray-100 px-2 pb-2 pt-1">
														<div className="relative">
															<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
															<input
																type="text"
																placeholder="Search agents..."
																className="w-full rounded-md border-none bg-gray-50 py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-200"
																onClick={(e) => e.stopPropagation()}
																onChange={(e) => {
																	const val = e.target.value.toLowerCase()
																	document
																		.querySelectorAll('.agent-filter-item')
																		.forEach((el: any) => {
																			if (el.textContent.toLowerCase().includes(val))
																				el.style.display = 'flex'
																			else el.style.display = 'none'
																		})
																}}
															/>
														</div>
													</div>
													<div className="max-h-60 overflow-y-auto overflow-x-hidden">
														<button
															onClick={() => {
																setSelectedPipeline(null)
																setIsPipelineOpen(false)
															}}
															className={`agent-filter-item flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
																!selectedPipeline
																	? 'bg-blue-50 text-blue-700'
																	: 'text-gray-700 hover:bg-gray-50'
															}`}
														>
															<span className="font-medium">All Agents</span>
															{!selectedPipeline && (
																<Check className="ml-auto h-4 w-4" />
															)}
														</button>
														{availableAgents.map((agent: any) => (
															<button
																key={agent.id}
																className={`agent-filter-item flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
																	selectedPipeline === agent.id
																		? 'bg-blue-50 text-blue-700'
																		: 'text-gray-700 hover:bg-gray-50'
																}`}
																onClick={() => {
																	setSelectedPipeline(agent.id)
																	setIsPipelineOpen(false)
																}}
															>
																<div className="truncate text-left font-medium">
																	{agent.name || agent.email}
																</div>
																{selectedPipeline === agent.id && (
																	<Check className="ml-auto h-4 w-4 shrink-0" />
																)}
															</button>
														))}
													</div>
												</div>
											</>
										)}
									</div>

										<TooltipProvider delayDuration={0}>
											<div className="flex shrink-0 items-center gap-0.5 text-gray-700">
												<Tooltip>
														<TooltipTrigger
															className="inline-flex rounded-full p-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
														onClick={() => {
															setIsSearchOpen(true)
															setTimeout(() => searchInputRef.current?.focus(), 100)
														}}
													>
														<Search className="h-4 w-4" />
													</TooltipTrigger>
													<TooltipContent side="bottom">
														<p>Search</p>
													</TooltipContent>
												</Tooltip>

												<div className="relative flex items-center">
													<Tooltip>
															<TooltipTrigger
																className="rounded-full p-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
															onClick={() => {
																setShowAdvancedFilter(true)
																void loadConversationFilterOptions()
															}}
														>
															<SlidersHorizontal className="h-4 w-4" />
														</TooltipTrigger>
														<TooltipContent side="bottom">
															<p>Filter</p>
														</TooltipContent>
													</Tooltip>
													{activeAdvancedFilterCount > 0 && (
														<span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-background" />
													)}
											</div>

													<DropdownMenu>
														<Tooltip>
															<TooltipTrigger asChild>
																<DropdownMenuTrigger className="flex items-center gap-0.5 rounded-full p-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
																	<Plus className="h-4 w-4" />
																	<ChevronDown className="h-3 w-3" />
																</DropdownMenuTrigger>
															</TooltipTrigger>
															<TooltipContent side="bottom">
																<p>Add New Chat</p>
															</TooltipContent>
														</Tooltip>
														<DropdownMenuContent
															align="end"
															className="w-56 rounded-xl"
														>
															<DropdownMenuItem
																className="cursor-pointer py-2.5 text-[15px]"
																onClick={() => openStartNewChatModal()}
															>
																Start new chat
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																className="cursor-pointer py-2.5 text-[15px]"
																onClick={() => openCreateWhatsappGroupModal()}
															>
																Create Whatsapp Group
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>

													<Tooltip>
														<TooltipTrigger
															className="rounded-full p-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
															onClick={() => {
																setIsSelectionMode(true)
																setMobileView('list')
															}}
														>
															<ListChecks className="h-4 w-4" />
														</TooltipTrigger>
													<TooltipContent side="bottom">
														<p>Selection</p>
													</TooltipContent>
												</Tooltip>

														<Tooltip>
															<TooltipTrigger
																className={`relative rounded-full p-1.5 transition-colors ${
																	unreadOnly
																		? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60'
																		: 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
																}`}
																onClick={() => setUnreadOnly((prev) => !prev)}
																aria-pressed={unreadOnly}
															>
																<MessageCircle className="h-4 w-4" />
																<span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-background bg-gray-900 dark:bg-emerald-400" />
															</TooltipTrigger>
														<TooltipContent side="bottom">
															<p>{unreadOnly ? 'Unread Filter On' : 'Filter Unread'}</p>
														</TooltipContent>
													</Tooltip>
										</div>
									</TooltipProvider>
								</div>
							</div>
						)}

						{/* Tabs */}
							<div className="mt-0.5 px-2 pb-1">
								<div className="w-full">
										<div className="grid w-full grid-cols-4 gap-1 rounded-2xl bg-gray-50 dark:bg-zinc-900/90 p-0.5">
										<button
											onClick={() => setStatusFilter('all')}
											className={`inline-flex w-full items-center justify-center gap-0.5 whitespace-nowrap rounded-xl py-1 text-[11px] leading-tight transition-all sm:gap-1 sm:text-[11px] md:text-[12px] ${
												statusFilter === 'all'
													? 'bg-white text-gray-900 shadow-sm font-bold dark:bg-zinc-800/90 dark:text-zinc-100'
													: 'text-gray-500 hover:text-gray-800 font-semibold dark:text-zinc-400 dark:hover:text-zinc-100'
											}`}
										>
										All
											<span
												className={`rounded-full px-1 py-0.5 text-[9px] leading-none font-bold sm:px-1.5 sm:text-[10px] md:text-[11px] ${
													statusFilter === 'all'
														? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/45 dark:text-emerald-200'
														: 'bg-gray-200/80 text-gray-500 dark:bg-zinc-800/80 dark:text-zinc-200'
												}`}
											>
											{statusCounts?.all ?? 0}
										</span>
									</button>

										<button
											onClick={() => setStatusFilter('unserved')}
											className={`inline-flex w-full items-center justify-center gap-0.5 whitespace-nowrap rounded-xl py-1 text-[11px] leading-tight transition-all sm:gap-1 sm:text-[11px] md:text-[12px] ${
												statusFilter === 'unserved'
													? 'bg-white text-gray-900 shadow-sm font-bold dark:bg-zinc-800/90 dark:text-zinc-100'
													: 'text-gray-500 hover:text-gray-800 font-semibold dark:text-zinc-400 dark:hover:text-zinc-100'
											}`}
										>
										Unserved
											<span
												className={`rounded-full px-1 py-0.5 text-[9px] leading-none font-bold sm:px-1.5 sm:text-[10px] md:text-[11px] ${
													statusFilter === 'unserved'
														? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/45 dark:text-emerald-200'
														: 'bg-gray-200/80 text-gray-500 dark:bg-zinc-800/80 dark:text-zinc-200'
												}`}
											>
											{statusCounts?.unserved ?? 0}
										</span>
									</button>

										<button
											onClick={() => setStatusFilter('served')}
											className={`inline-flex w-full items-center justify-center gap-0.5 whitespace-nowrap rounded-xl py-1 text-[11px] leading-tight transition-all sm:gap-1 sm:text-[11px] md:text-[12px] ${
												statusFilter === 'served'
													? 'bg-white text-gray-900 shadow-sm font-bold dark:bg-zinc-800/90 dark:text-zinc-100'
													: 'text-gray-500 hover:text-gray-800 font-semibold dark:text-zinc-400 dark:hover:text-zinc-100'
											}`}
										>
										Served
											<span
												className={`rounded-full px-1 py-0.5 text-[9px] leading-none font-bold sm:px-1.5 sm:text-[10px] md:text-[11px] ${
													statusFilter === 'served'
														? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/45 dark:text-emerald-200'
														: 'bg-gray-200/80 text-gray-500 dark:bg-zinc-800/80 dark:text-zinc-200'
												}`}
											>
											{statusCounts?.served ?? 0}
										</span>
									</button>

										<button
											onClick={() => setStatusFilter('resolved')}
											className={`inline-flex w-full items-center justify-center gap-0.5 whitespace-nowrap rounded-xl py-1 text-[11px] leading-tight transition-all sm:gap-1 sm:text-[11px] md:text-[12px] ${
												statusFilter === 'resolved'
													? 'bg-white text-gray-900 shadow-sm font-bold dark:bg-zinc-800/90 dark:text-zinc-100'
													: 'text-gray-500 hover:text-gray-800 font-semibold dark:text-zinc-400 dark:hover:text-zinc-100'
											}`}
										>
										Resolved
											<span
												className={`rounded-full px-1 py-0.5 text-[9px] leading-none font-bold sm:px-1.5 sm:text-[10px] md:text-[11px] ${
													statusFilter === 'resolved'
														? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/45 dark:text-emerald-200'
														: 'bg-gray-200/80 text-gray-500 dark:bg-zinc-800/80 dark:text-zinc-200'
												}`}
											>
											{statusCounts?.resolved ?? 0}
										</span>
									</button>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Conversation List */}
					<div
					ref={conversationsScrollRef}
						className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-card"
					>
					{filteredConversations.length === 0 ? (
						<div className="h-full w-full flex items-center justify-center p-8 text-center">
							<div className="animate-in fade-in zoom-in duration-500">
									<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 mb-4 shadow-inner relative">
									<div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20 duration-[2000ms]"></div>
									<Inbox className="h-8 w-8 text-emerald-600 relative z-10" />
								</div>
									<h4 className="text-base font-bold text-gray-900 dark:text-zinc-100 mb-1">
									No conversations yet
								</h4>
								<p className="text-xs text-gray-500 dark:text-zinc-400 max-w-[200px] leading-relaxed">
									Messages from WhatsApp, Instagram, and TikTok will appear here
								</p>
							</div>
						</div>
					) : (
							<div className="divide-y divide-gray-100 dark:divide-zinc-800">
							{filteredConversations.map((conv) => (
								<button
									key={conv.id}
									onClick={() => {
										if (isSelectionMode) {
											toggleConversationSelection(conv.id)
											return
										}
										void handleSelectConversation(conv)
									}}
											className={`w-full overflow-hidden py-2.5 px-3 text-left transition-all border-l-3 ${
												isSelectionMode
													? selectedConversationIds.has(conv.id)
														? 'bg-blue-50 border-blue-500 dark:bg-blue-950/35 dark:border-blue-600'
														: 'hover:bg-gray-50 border-transparent dark:hover:bg-zinc-900/70'
													: selectedConversation?.id === conv.id
														? 'bg-emerald-50 border-emerald-500 shadow-sm z-10 dark:bg-zinc-800/95 dark:border-emerald-500'
														: conv.unread > 0
															? conv.channel === 'instagram'
																? 'bg-pink-100/60 border-pink-500 hover:bg-pink-100/80 dark:bg-pink-950/30 dark:border-pink-600 dark:hover:bg-pink-950/40'
																: conv.channel === 'tiktok'
																	? 'bg-zinc-100/80 border-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800'
																: 'bg-blue-100/60 border-blue-500 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:border-blue-600 dark:hover:bg-blue-950/40'
														: 'hover:bg-gray-50 border-transparent dark:hover:bg-zinc-900/70'
										}`}
								>
									<div className="flex items-center gap-2.5">
										{isSelectionMode && (
											<span
												className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border ${
													selectedConversationIds.has(conv.id)
														? 'border-blue-600 bg-blue-600 text-white'
														: 'border-gray-300 bg-white text-transparent dark:border-zinc-600 dark:bg-zinc-900'
												}`}
											>
												{selectedConversationIds.has(conv.id) ? (
													<Check className="h-4 w-4" />
												) : null}
											</span>
										)}
										<div className="relative flex-shrink-0">
											<div
													className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden text-white font-medium text-xs shadow-sm ${conv.avatarImageUrl ? 'bg-gray-100 dark:bg-zinc-700' : getChannelAvatarGradientClass(conv.channel)}`}
												>
												{conv.avatarImageUrl ? (
													<img
														src={conv.avatarImageUrl}
														alt={conv.name}
														className="w-full h-full object-cover"
														loading="lazy"
														referrerPolicy="no-referrer"
													/>
												) : (
													conv.avatar
												)}
											</div>
											<div
													className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center bg-white dark:bg-zinc-900 overflow-hidden shadow-sm`}
												title={conv.channelName}
											>
												{conv.channel === 'whatsapp' && conv.channelBadgeUrl ? (
													<img
														src={conv.channelBadgeUrl}
														alt="ch"
														className="w-full h-full object-cover"
													/>
												) : (
													<div
														className={`w-full h-full flex items-center justify-center ${getChannelIconBackgroundClass(conv.channel)}`}
													>
														{renderChannelIcon(conv.channel, 'w-2.5 h-2.5 text-white')}
													</div>
												)}
											</div>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-1.5 min-w-0">
													<span
															className={`block max-w-[150px] truncate text-sm sm:max-w-[190px] md:max-w-none ${
																selectedConversation?.id === conv.id && !isSelectionMode
																	? 'font-bold text-gray-900 dark:text-zinc-50'
																	: conv.unread > 0
																		? 'font-bold text-blue-900 dark:text-blue-200'
																		: 'font-semibold text-gray-700 dark:text-zinc-200'
															}`}
													>
														{conv.name}
													</span>
														<span
															className={`text-[10px] px-1.5 py-0.5 rounded-md truncate max-w-[80px] font-medium ${
																selectedConversation?.id === conv.id && !isSelectionMode
																	? 'bg-white/90 text-gray-600 dark:bg-zinc-700 dark:text-zinc-100'
																	: 'bg-gray-100/80 text-gray-500 dark:bg-zinc-800 dark:text-zinc-200'
															}`}
														>
														{conv.channelName}
													</span>
													{pinnedChats.includes(conv.id) && (
														<Pin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
													)}
												</div>
												<div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
													<span
															className={`text-[10px] ${
																selectedConversation?.id === conv.id && !isSelectionMode
																	? 'text-gray-600 dark:text-zinc-300 font-semibold'
																	: conv.unread > 0
																		? 'text-blue-600 dark:text-blue-300 font-bold'
																		: 'text-gray-400 dark:text-zinc-500'
															}`}
													>
														{formatTodayTime(conv.timestamp)}
													</span>
													{conv.unread > 0 && (
														<span
															className={`text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm ${getUnreadBadgeClass(conv.channel)}`}
														>
															{conv.unread > 99 ? '99+' : conv.unread}
														</span>
													)}
												</div>
											</div>
											<div className="mt-0.5 flex min-w-0 items-center justify-between">
												<p
														className={`text-xs truncate min-w-0 basis-0 flex-1 max-w-[145px] sm:max-w-none transition-colors ${
															selectedConversation?.id === conv.id && !isSelectionMode
																? 'text-gray-700 dark:text-zinc-200 font-medium'
																: conv.unread > 0
																	? 'text-gray-900 dark:text-zinc-100 font-medium'
																	: 'text-gray-500 dark:text-zinc-400'
														}`}
												>
													{conv.lastMessage}
												</p>
												<div className="flex items-center gap-1 ml-2 flex-shrink-0">
													{conv.status === 'resolved' ? (
															<span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/55 dark:text-emerald-200 text-[10px] font-semibold rounded-full">
															Resolved
														</span>
													) : conv.assigneeId ? (
															<span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/55 dark:text-blue-200 text-[10px] font-semibold rounded-full">
															Served
														</span>
													) : (
															<span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 dark:bg-orange-900/55 dark:text-orange-200 text-[10px] font-semibold rounded-full">
															Unserved
														</span>
													)}
												</div>
											</div>
										</div>
									</div>
								</button>
							))}
							<div
								ref={loadMoreTriggerRef}
									className="flex items-center justify-center py-3 text-xs text-gray-400 dark:text-zinc-500"
							>
								{isLoadingMoreConversations ? (
									<span className="inline-flex items-center gap-2">
										<RefreshCw className="h-3.5 w-3.5 animate-spin" />
										Loading more conversations...
									</span>
								) : hasMoreConversations ? (
									<span>Scroll to load more</span>
								) : (
									<span>No more conversations</span>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
			{/* Right Panel: Chat View */}
			<div
				className={`min-h-0 flex-1 flex-col overflow-hidden bg-muted/30 ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}`}
			>
				{selectedConversation ? (
					<>
						{/* Chat Header */}
						<div className="shrink-0 border-b border-gray-100 bg-background/95 px-4 py-3 backdrop-blur md:px-6 md:py-4">
							<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
								<div className="flex min-w-0 items-start gap-3 md:gap-4">
									<button
										onClick={() => setMobileView('list')}
										className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
									>
										<ArrowLeft className="w-5 h-5" />
									</button>
									<div
										className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center overflow-hidden text-white font-semibold text-sm md:text-base ${selectedConversation.avatarImageUrl ? 'bg-gray-100' : getChannelAvatarGradientClass(selectedConversation.channel)}`}
									>
										{selectedConversation.avatarImageUrl ? (
											<img
												src={selectedConversation.avatarImageUrl}
												alt={selectedConversation.name}
												className="w-full h-full object-cover"
												referrerPolicy="no-referrer"
											/>
										) : (
											selectedConversation.avatar
										)}
									</div>
									<div className="min-w-0">
										<h3 className="truncate font-semibold text-gray-900 text-sm md:text-base">
											{selectedConversation.name}
										</h3>
										<p className="flex flex-wrap items-center gap-2 text-xs text-gray-500 md:text-sm">
											{selectedConversation.channel === 'instagram'
												? (selectedConversation.instagramBio ||
														selectedConversation.instagramDisplayName) && (
														<span className="hidden sm:inline truncate max-w-[220px]">
															{selectedConversation.instagramBio ||
																selectedConversation.instagramDisplayName}
														</span>
													)
												: !agentSettings?.hide_customer_id && (
														<span className="hidden sm:inline">
															{selectedConversation.phone}
														</span>
													)}
											<span
												className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
													selectedConversation.channel === 'whatsapp'
														? 'bg-green-100 text-green-700'
														: selectedConversation.channel === 'tiktok'
															? 'bg-zinc-100 text-zinc-800'
															: 'bg-pink-100 text-pink-700'
												}`}
											>
												{renderChannelIcon(selectedConversation.channel, 'w-3 h-3')}
												{getChannelLabel(selectedConversation.channel)}
											</span>
										</p>
										{selectedConversation.channel === 'instagram' &&
											(selectedConversation.instagramIsBusinessFollowUser ||
												selectedConversation.instagramIsUserFollowBusiness ||
												typeof selectedConversation.instagramFollowerCount ===
													'number') && (
												<div className="mt-1 flex flex-wrap items-center gap-1.5">
													{selectedConversation.instagramIsBusinessFollowUser && (
														<span className="inline-flex items-center rounded-xl bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
															Follower
														</span>
													)}
													{selectedConversation.instagramIsUserFollowBusiness && (
														<span className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-800">
															Following
														</span>
													)}
													{typeof selectedConversation.instagramFollowerCount ===
														'number' && (
														<span className="inline-flex items-center rounded-xl bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
															{selectedConversation.instagramFollowerCount}{' '}
															Followers
														</span>
													)}
												</div>
											)}
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-1 self-end md:gap-2">
									<button
										onClick={() => {
											setMobileSidebarTab('info')
											setShowMobileCustomerInfo(true)
										}}
										className="xl:hidden p-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-500"
									>
										<Info className="w-5 h-5" />
									</button>
									{selectedConversation.status !== 'resolved' && (
										<button
											onClick={() => setShowResolveModal(true)}
											className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
										>
											<CheckCircle2 className="w-4 h-4" />
											<span className="hidden md:inline">Resolve</span>
										</button>
									)}
									<button
										onClick={() => {
											if (!showCustomerInfo) {
												setDesktopSidebarTab('info')
											}
											setShowCustomerInfo(!showCustomerInfo)
										}}
										className={`hidden xl:flex p-2 rounded-lg transition-colors ${showCustomerInfo ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-100 text-gray-500'}`}
									>
										<Info className="w-5 h-5" />
									</button>
									<div className="relative">
										<button
											onClick={() => setShowActionsMenu(!showActionsMenu)}
											className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
										>
											<MoreVertical className="w-5 h-5" />
										</button>

										{/* Actions Menu */}
										{showActionsMenu && (
											<ChatRoomActionsMenu
												conversationId={selectedConversation.id}
												assignedAgents={conversationAgents}
												availableAgents={availableAgents}
												currentUserId={currentUserId}
												currentUserRole={currentUserRole}
												conversationStatus={
													selectedConversation.status || 'open'
												}
												isAssignedToMe={conversationAgents.some(
													(a: any) => a.id === currentUserId,
												)}
												onAddAgent={async (agentId) => {
													try {
														await conversationsApi.addAgent(
															selectedConversation.id,
															agentId,
														)
														const agentsData: any =
															await conversationsApi.getAgents(
																selectedConversation.id,
															)
														if (agentsData.success)
															setConversationAgents(agentsData.payload || [])
													} catch (e) {
														console.error('Failed to add agent:', e)
														throw e
													}
												}}
												onRemoveAgent={async (agentId) => {
													try {
														await conversationsApi.removeAgent(
															selectedConversation.id,
															agentId,
														)
														const agentsData: any =
															await conversationsApi.getAgents(
																selectedConversation.id,
															)
														if (agentsData.success)
															setConversationAgents(agentsData.payload || [])
													} catch (e) {
														console.error('Failed to remove agent:', e)
														throw e
													}
												}}
												onTakeover={async () => {
													try {
														await conversationsApi.takeover(
															selectedConversation.id,
															currentUserId || undefined,
														)
														const agentsData: any =
															await conversationsApi.getAgents(
																selectedConversation.id,
															)
														if (agentsData.success)
															setConversationAgents(agentsData.payload || [])
													} catch (e) {
														console.error('Failed to takeover:', e)
														throw e
													}
												}}
												onResolve={() => setShowResolveModal(true)}
												onAddNote={() => {
													// Scroll to notes section if needed
													// The ConversationNotes component already has its own modal
												}}
												onEditCustomer={() => setShowEditCustomerModal(true)}
												onBlockChat={() => {
													setBlockType('chat')
													setShowBlockCustomerModal(true)
												}}
												onBlockCall={() => {
													setBlockType('call')
													setShowBlockCustomerModal(true)
												}}
												isPinned={pinnedChats.includes(selectedConversation.id)}
												onPinChat={() => setShowPinChatModal(true)}
												onUnpinChat={async () => {
													// unpinChat and getPinnedChats available from static import
													unpinChat(selectedConversation.id)
													setPinnedChats(getPinnedChats())
													loadConversations()
												}}
												onMuteNotifications={() => setShowMuteModal(true)}
												onViewHistory={() => setShowHistoryModal(true)}
												onManageLabels={() => setShowManageLabelsModal(true)}
												onMergeCustomer={() => setShowMergeCustomerModal(true)}
												onExportChat={() => setShowExportChatModal(true)}
												onReportIssue={() => setShowReportIssueModal(true)}
												onClose={() => setShowActionsMenu(false)}
											/>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Messages */}
						<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 md:p-6 space-y-3 md:space-y-4">
							{groupedConversationMessages.map((messageGroup) => (
								<div key={messageGroup.id} className="space-y-1.5">
									{messageGroup.messages.map((msg, groupIndex) => {
										const isLastInGroup =
											groupIndex === messageGroup.messages.length - 1
										const repliedMsg = msg.replyToMessageId
											? selectedMessageById.get(msg.replyToMessageId) || null
											: null
										const isSystem = isSystemMessage(msg)
										const normalizedSystemContent = msg.content.trim()
										const isAiSummary = isAiSummaryMessage(msg)
										const aiSummaryPoints = isAiSummary
											? extractAiSummaryPoints(msg)
											: []
										const isAiStatusSystem = isAiStatusSystemMessage(
											normalizedSystemContent,
										)
										const shouldHideSystemMessage =
											isSystem &&
											!isAiSummary &&
											isInternalAiSystemPayload(normalizedSystemContent)
										const aiStatusChipTexts = getAiStatusChipTexts(msg)
										const statusMetaParts: string[] = [
											formatTodayTime(msg.statusAt || msg.timestamp),
										]
										const showMessageMeta = isLastInGroup && !isSystem
										const statusLabel =
											msg.type === 'outgoing'
												? getOutgoingStatusLabel(msg.status)
												: 'Sent'

										if (msg.type === 'incoming') {
											const incomingSenderName =
												msg.senderLabel ||
												selectedConversation?.name ||
												'Customer'
											if (incomingSenderName) {
												statusMetaParts.push(incomingSenderName)
											}
										}

										if (msg.type === 'outgoing' && msg.isAI) {
											const aiContext =
												resolveAiAgentName(msg) ||
												aiAgentNameByMessageId.get(msg.id) ||
												null
											if (aiContext) {
												statusMetaParts.push(`AI Agent: ${aiContext}`)
											}
										}

										if (isAiSummary) {
											return (
												<div key={msg.id} className="my-4 flex justify-center">
													<div className="w-full max-w-[92%] md:max-w-[74%]">
														<div className="rounded-2xl border border-[#ced8ea] bg-[#e9edf8] px-5 py-4 md:px-7 md:py-5">
															<h4 className="mb-3 flex items-center gap-2 text-xl font-semibold text-[#1f2937]">
																AI Summary
																<Sparkles className="h-5 w-5 text-[#4b5563]" />
															</h4>
															<ul className="list-disc space-y-1.5 pl-6 text-[15px] leading-relaxed text-[#4b5563] marker:text-[#4b5563] md:text-[16px]">
																{aiSummaryPoints.map((point, pointIndex) => (
																	<li
																		key={`${msg.id}-summary-point-${pointIndex}`}
																		className="break-words"
																	>
																		{point}
																	</li>
																))}
															</ul>
														</div>
														<div className="mt-2 text-center text-[13px] font-medium text-[#6b7280]">
															{formatTodayTime(msg.statusAt || msg.timestamp)} • system •
														</div>
													</div>
												</div>
											)
										}

										if (isSystem) {
											if (shouldHideSystemMessage) return null

											if (isAiStatusSystem) {
												return (
													<div
														key={msg.id}
														className="flex justify-center my-3"
													>
														<div className="text-center text-gray-500 text-sm font-medium whitespace-pre-line">
															{msg.content}
														</div>
													</div>
												)
											}

											return (
												<div key={msg.id} className="flex justify-center my-3">
													<div className="bg-gray-100 text-gray-500 border border-gray-200 text-xs px-4 py-1.5 rounded-lg shadow-sm font-medium flex items-center gap-2">
														<Info className="w-3 h-3" />
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
														<div className="max-w-[88%] md:max-w-[74%] flex flex-col gap-1">
															<div className="flex items-end gap-2">
															{msg.type === 'outgoing' && repliedMsg ? (
																<Reply className="w-4 h-4 text-[#6b7280] mb-2 scale-x-[-1] shrink-0" />
															) : null}
														<div
															className={`px-3 md:px-4 py-2.5 md:py-3 rounded-2xl ${
																msg.type === 'outgoing'
																	? 'bg-[#1f57c3] text-white rounded-br-md'
																	: 'bg-[#dbe7f8] text-[#111827] rounded-bl-md border border-[#c2d5f1]'
															}`}
														>
															{msg.isAI && (
																<div className="flex items-center gap-1 text-[11px] text-blue-100 mb-1.5">
																	<Sparkles className="w-3 h-3" />
																	AI Generated
																</div>
															)}
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
																			repliedMsg.statusAt ||
																				repliedMsg.timestamp,
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
																	<>
																		<img
																			src={msg.extras.media.url}
																			alt="Sent image"
																			className="max-w-[240px] max-h-[300px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
																			onClick={() => {
																				setActiveImageMessageId(msg.id)
																				setIsImageViewerLoadError(false)
																			}}
																			onError={(e) => {
																				const target =
																					e.target as HTMLImageElement
																				target.style.display = 'none'
																				target.nextElementSibling?.classList.remove(
																					'hidden',
																				)
																			}}
																		/>
																		<div
																			className={`hidden flex items-center gap-2 p-3 rounded-lg ${msg.type === 'outgoing' ? 'bg-blue-600/40' : 'bg-blue-100'}`}
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
																	</>
																) : null
															) : null}
															{msg.contentType === 'image' &&
																!msg.extras?.media?.url && (
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
																)}
															{msg.contentType === 'video' &&
															msg.extras?.media?.url ? (
																<video
																	controls
																	className="max-w-[240px] rounded-lg"
																>
																	<source src={msg.extras.media.url} />
																</video>
															) : msg.contentType === 'video' &&
																!msg.extras?.media?.url ? (
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
															) : null}
															{msg.contentType === 'audio' &&
															msg.extras?.media?.url ? (
																<audio
																	controls
																	className="w-full max-w-[240px]"
																>
																	<source src={msg.extras.media.url} />
																</audio>
															) : msg.contentType === 'audio' &&
																!msg.extras?.media?.url ? (
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
															) : null}
															{msg.contentType === 'document' &&
															msg.extras?.media?.url ? (
																<a
																	href={msg.extras.media.url}
																	target="_blank"
																	rel="noreferrer"
																	className={`flex items-center gap-2 p-2 rounded-lg ${msg.type === 'outgoing' ? 'bg-blue-600/40 hover:bg-blue-600/60' : 'bg-blue-100 hover:bg-blue-200'} transition`}
																>
																	<FileText className="w-5 h-5" />
																	<span className="text-sm truncate max-w-[160px]">
																		{msg.extras.media.fileName || 'Document'}
																	</span>
																</a>
															) : msg.contentType === 'document' &&
																!msg.extras?.media?.url ? (
																<div
																	className={`flex items-center gap-2 p-3 rounded-lg ${msg.type === 'outgoing' ? 'bg-blue-600/40' : 'bg-blue-100'}`}
																>
																	<FileText
																		className={`w-5 h-5 ${msg.type === 'outgoing' ? 'text-blue-100' : 'text-blue-500'}`}
																	/>
																	<span
																		className={`text-sm ${msg.type === 'outgoing' ? 'text-blue-100' : 'text-blue-700'}`}
																	>
																		{msg.extras?.media?.fileName ||
																			'Document unavailable'}
																	</span>
																</div>
															) : null}
																{msg.contentType === 'text' ||
																(!msg.contentType && !msg.extras?.media) ? (
																	<p className="text-sm md:text-[15px] leading-relaxed break-words">
																		{msg.content}
																	</p>
																) : null}
															</div>
															{msg.isAI && (
																<button
																onClick={() => setEvaluatingMessage(msg)}
																title="Evaluasi Pesan ini"
																className={`p-1.5 rounded-full bg-gray-100 text-gray-400 hover:text-blue-500 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all duration-200 transform ${msg.type === 'outgoing' ? '-translate-x-2' : 'translate-x-2'} group-hover:translate-x-0`}
															>
																<ClipboardCheck className="w-4 h-4" />
															</button>
														)}
															<button
																onClick={() => setReplyingTo(msg)}
																className={`p-1.5 rounded-full bg-gray-100 text-gray-400 hover:text-blue-500 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all duration-200 transform ${msg.type === 'outgoing' ? '-translate-x-2' : 'translate-x-2'} group-hover:translate-x-0`}
															>
																<Reply className="w-4 h-4" />
															</button>
														</div>
														{showMessageMeta && (
															<div
																className={`flex items-center gap-1.5 text-[12px] font-medium ${
																	msg.type === 'outgoing'
																		? 'justify-end text-[#5d8eed] dark:text-blue-300'
																		: 'justify-start text-[#6b7280] dark:text-zinc-400'
																}`}
															>
																{msg.type === 'outgoing' ? (
																	<>
																		{msg.status === 'sending' && (
																			<Clock className="w-3.5 h-3.5" />
																		)}
																		{msg.status === 'sent' && (
																			<Check className="w-3.5 h-3.5" />
																		)}
																		{msg.status === 'delivered' && (
																			<CheckCheck className="w-3.5 h-3.5" />
																		)}
																		{msg.status === 'read' && (
																			<CheckCheck className="w-3.5 h-3.5 text-[#3d7bff] dark:text-blue-300" />
																		)}
																		{msg.status === 'failed' && (
																			<X className="w-3.5 h-3.5 text-red-400" />
																		)}
																		{!msg.status && (
																			<Check className="w-3.5 h-3.5" />
																		)}
																	</>
																) : (
																	<Check className="w-3.5 h-3.5" />
																)}
																<span>{statusLabel}</span>
																{statusMetaParts.length > 0 && (
																	<span>• {statusMetaParts.join(' • ')}</span>
																)}
															</div>
														)}
														</div>
													</div>
												</div>
											)
									})}
								</div>
							))}

							{isTyping && (
								<div className="flex justify-start">
									<div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
										<div className="flex gap-1">
											<div
												className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
												style={{ animationDelay: '0ms' }}
											></div>
											<div
												className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
												style={{ animationDelay: '150ms' }}
											></div>
											<div
												className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
												style={{ animationDelay: '300ms' }}
											></div>
										</div>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Reply Preview */}
						{replyingTo && (
							<div className="shrink-0 bg-gray-50 border-t border-gray-100 px-3 py-2 animate-in slide-in-from-bottom-2 duration-200 flex items-center justify-between md:px-6">
								<div className="flex-1 border-l-4 border-emerald-500 pl-3 py-1 bg-white/50 rounded-r-lg">
									<p className="text-xs font-semibold text-emerald-600 mb-0.5">
										{replyingTo.type === 'outgoing'
											? 'You'
											: selectedConversation.name}
									</p>
									<p className="text-xs text-gray-500 truncate">
										{replyingTo.content}
									</p>
								</div>
								<button
									onClick={() => setReplyingTo(null)}
									className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors ml-2"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						)}

						{/* Message Input */}
						<div className="shrink-0 border-t border-gray-100 bg-white/95 px-3 py-3 backdrop-blur md:px-6 md:py-4">
							{isSelectedConversationWindowExpired && (
								<div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
									<p className="text-xs md:text-sm text-amber-900 leading-relaxed">
										Window gratis 24 jam customer sudah habis. Kirim pesan
										dinonaktifkan.
									</p>
									{selectedConversationFollowUpUrl && (
										<a
											href={selectedConversationFollowUpUrl}
											target="_blank"
											rel="noreferrer"
											className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
										>
											Follow up WA
										</a>
									)}
								</div>
							)}
							<form
								onSubmit={(e) => {
									e.preventDefault()
									handleSendMessage()
								}}
								className="flex items-end gap-2 md:gap-3"
							>
								<button
									type="button"
									className="hidden sm:block p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
								>
									<Smile className="w-5 h-5" />
								</button>
								<button
									type="button"
									onClick={() => setShowTemplateModal(true)}
									disabled={isSending || isSelectedConversationWindowExpired}
									className="p-2 md:p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<FileText className="w-5 h-5" />
								</button>
								<input
									type="file"
									id="media-upload"
									className="hidden"
									accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
									disabled={isSending || isSelectedConversationWindowExpired}
									onChange={async (e) => {
										const file = e.target.files?.[0]
										if (!file || !selectedConversation) return
										if (
											selectedConversation.channel === 'whatsapp' &&
											selectedConversation.whatsappWindowExpired
										) {
											notifyMessagingWindowExpired(selectedConversation)
											e.target.value = ''
											return
										}

										// Basic file size validation
										const maxImageSize =
											selectedConversation.channel === 'whatsapp'
												? 5 * 1024 * 1024
												: 8 * 1024 * 1024
										const maxVideoSize = 16 * 1024 * 1024
										const maxDocSize = 100 * 1024 * 1024

										let type: 'image' | 'video' | 'audio' | 'document' =
											'document'
										if (file.type.startsWith('image/')) type = 'image'
										else if (file.type.startsWith('video/')) type = 'video'
										else if (file.type.startsWith('audio/')) type = 'audio'

										const maxSize =
											type === 'image'
												? maxImageSize
												: type === 'video' || type === 'audio'
													? maxVideoSize
													: maxDocSize
										if (file.size > maxSize) {
											alert(
												`File is too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`,
											)
											e.target.value = ''
											return
										}

										setIsSending(true)

										try {
											// 1. Upload to R2
											const uploadResult = await media.upload(
												file,
												selectedConversation.channel as
													| 'whatsapp'
													| 'instagram'
													| 'tiktok',
											)

											if (!uploadResult.success || !uploadResult.payload) {
												throw new Error(uploadResult.error || 'Upload failed')
											}

											// 2. Send message with media
											await conversationsApi.sendMessage(
												selectedConversation.id,
												{
													content: '',
													media: {
														type: uploadResult.payload.type,
														url: uploadResult.payload.url,
														mimeType: uploadResult.payload.mimeType,
														fileName: uploadResult.payload.fileName,
													},
												} as any,
											)

											// Reload conversation
											handleSelectConversation(selectedConversation)
										} catch (err: any) {
											console.error('Media send failed:', err)
											showSendMessageError(
												err,
												selectedConversation.phone ||
													selectedConversation.identifier,
											)
										} finally {
											setIsSending(false)
											e.target.value = ''
										}
									}}
								/>
								<button
									type="button"
									onClick={() => setShowGalleryModal(true)}
									disabled={isSending || isSelectedConversationWindowExpired}
									className="p-2 md:p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors disabled:opacity-50"
								>
									<Paperclip className="w-5 h-5" />
								</button>
								<div className="flex-1 relative">
									<input
										type="text"
										value={newMessage}
										onChange={(e) => setNewMessage(e.target.value)}
										placeholder={
											isSelectedConversationWindowExpired
												? 'Window 24 jam habis. Pesan dinonaktifkan.'
												: 'Type a message...'
										}
										className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-gray-100 rounded-xl text-sm md:text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
										disabled={isSending || isSelectedConversationWindowExpired}
									/>
								</div>
								{newMessage.trim() ? (
									<button
										type="submit"
										disabled={isSending || isSelectedConversationWindowExpired}
										className="p-2.5 md:p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<Send className="w-5 h-5" />
									</button>
								) : (
									<button
										type="button"
										disabled={isSending || isSelectedConversationWindowExpired}
										className="p-2.5 md:p-3 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<Mic className="w-5 h-5" />
									</button>
								)}
							</form>
						</div>
					</>
				) : (
					<div className="hidden flex-1 flex-col items-center justify-center text-center xl:flex">
						<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-4 shadow-sm">
							<Inbox className="h-10 w-10 text-emerald-600" />
						</div>
						<h3 className="text-xl font-semibold text-gray-900 mb-2">Inbox</h3>
						<p className="text-gray-500 mb-6 font-medium">
							Select a conversation from the list to view and reply to messages
						</p>
						<div className="flex items-center justify-center gap-4 text-sm text-gray-500 bg-white py-2 px-4 rounded-full border border-gray-100/50 shadow-sm">
							<div className="flex items-center gap-1.5">
								<MessageSquare className="h-4 w-4 text-green-500" />
								<span className="font-medium">WhatsApp</span>
							</div>
							<span className="text-gray-300">•</span>
							<div className="flex items-center gap-1.5">
								<Instagram className="h-4 w-4 text-pink-500" />
								<span className="font-medium">Instagram</span>
							</div>
							<span className="text-gray-300">•</span>
							<div className="flex items-center gap-1.5">
								<Music2 className="h-4 w-4 text-gray-900" />
								<span className="font-medium">TikTok</span>
							</div>
						</div>
					</div>
				)}
			</div>
			{/* Right Panel: Customer Info (Desktop) */}
				{selectedConversation && showCustomerInfo && (
					<div className="hidden min-h-0 w-[320px] flex-col overflow-hidden border-l border-gray-100 bg-white xl:flex">
						<div className="border-b border-gray-100">
							<div className="flex items-center justify-between gap-2 px-3 py-2">
								<button
									type="button"
									onClick={() => void handleCopySessionId(selectedConversation.id)}
									className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
								>
									<ClipboardCheck className="h-3.5 w-3.5" />
									Copy Session ID
								</button>
								<button
									onClick={() => setShowCustomerInfo(false)}
									className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
							{renderSidebarTabs(desktopSidebarTab, setDesktopSidebarTab)}
					</div>

					<div className="min-h-0 flex-1 overflow-y-auto">
						{desktopSidebarTab === 'info' ? (
							<>
								{/* Customer Profile */}
									<div className="p-4 border-b border-gray-100">
										<div className="flex items-center gap-3">
											<div
												className="relative cursor-pointer group"
											onClick={() => {
												if (selectedConversation.contactId) {
													// Store conversation ID for back navigation
													sessionStorage.setItem(
														'returnToConversationId',
														selectedConversation.id,
													)
													navigate({
														to: '/customers/$customerId' as any,
														params: {
															customerId: selectedConversation.contactId,
														},
													})
												}
											}}
										>
												<div
													className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden text-white font-bold text-base ${selectedConversation.avatarImageUrl ? 'bg-gray-100' : getChannelAvatarGradientClass(selectedConversation.channel)} group-hover:ring-4 group-hover:ring-emerald-200 transition-all`}
												>
												{selectedConversation.avatarImageUrl ? (
													<img
														src={selectedConversation.avatarImageUrl}
														alt={selectedConversation.name}
														className="w-full h-full object-cover"
														referrerPolicy="no-referrer"
													/>
												) : (
													selectedConversation.avatar
												)}
											</div>
											{/* Bottom Right: Channel Type Icon */}
											<div
												className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full border-2 border-white ${getChannelIconBackgroundClass(selectedConversation.channel)} flex items-center justify-center`}
											>
												{renderChannelIcon(selectedConversation.channel, 'w-3 h-3 text-white')}
											</div>
											{/* Top Left: Channel Badge Overlay */}
											{selectedConversation.channelBadgeUrl && (
												<div className="absolute -top-0.5 -left-0.5 w-6 h-6 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm">
													<img
														src={selectedConversation.channelBadgeUrl}
														alt="Badge"
														className="w-full h-full object-cover"
													/>
												</div>
											)}
											{/* Hover indicator */}
											<div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
												<ChevronRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
											</div>
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<h4
													className="font-semibold text-gray-900 hover:text-emerald-600 cursor-pointer transition-colors truncate"
													onClick={() => {
														if (selectedConversation.contactId) {
															sessionStorage.setItem(
																'returnToConversationId',
																selectedConversation.id,
															)
															navigate({
																to: '/customers/$customerId' as any,
																params: {
																	customerId: selectedConversation.contactId,
																},
															})
														}
													}}
												>
													{selectedConversation.name}
												</h4>
												<button
													onClick={() => setShowEditCustomerModal(true)}
													className="p-1 hover:bg-gray-100 rounded text-emerald-600"
												>
													<Edit2 className="w-4 h-4" />
												</button>
											</div>
											{selectedConversation.channel === 'instagram'
												? (selectedConversation.instagramBio ||
														selectedConversation.instagramDisplayName) && (
														<p className="text-sm text-gray-500 truncate">
															{selectedConversation.instagramBio ||
																selectedConversation.instagramDisplayName}
														</p>
													)
												: !agentSettings?.hide_customer_id && (
														<p className="text-sm text-gray-500 truncate">
															{selectedConversation.phone}
														</p>
													)}
											{selectedConversation.channel === 'instagram' &&
												(selectedConversation.instagramIsBusinessFollowUser ||
													selectedConversation.instagramIsUserFollowBusiness ||
													typeof selectedConversation.instagramFollowerCount ===
														'number') && (
													<div className="mt-2 flex flex-wrap items-center gap-2">
														{selectedConversation.instagramIsBusinessFollowUser && (
															<span className="inline-flex items-center rounded-2xl bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-900">
																Follower
															</span>
														)}
														{selectedConversation.instagramIsUserFollowBusiness && (
															<span className="inline-flex items-center rounded-2xl border border-gray-300 bg-white px-3 py-1 text-sm font-semibold text-gray-800">
																Following
															</span>
														)}
														{typeof selectedConversation.instagramFollowerCount ===
															'number' && (
															<span className="inline-flex items-center rounded-2xl bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
																{selectedConversation.instagramFollowerCount}{' '}
																Followers
															</span>
														)}
													</div>
												)}
										</div>
									</div>
										<div className="mt-3 space-y-2.5">
										<div>
											<p className="text-xs text-gray-500 mb-1">
												Contact you on channel
											</p>
											<p className="text-sm font-semibold text-gray-900">
												{`${getChannelLabel(selectedConversation.channel)} - ScaleChat`}
											</p>
										</div>
										<div>
											<p className="text-xs text-gray-500 mb-1">
												Conversation ID
											</p>
											<p
												className="text-xs font-mono text-gray-900 break-all"
												title={selectedConversation.id}
											>
												{selectedConversation.id}
											</p>
										</div>
										<div>
											<p className="text-xs text-gray-500 mb-1">Source</p>
											<p className="text-sm font-semibold text-gray-900">
												{getConversationSourceLabel(selectedConversation)}
											</p>
											{selectedConversation.channelName && (
												<p className="text-[11px] text-gray-400 mt-0.5 font-medium">
													{selectedConversation.channelName}
												</p>
											)}
										</div>
									</div>
								</div>

								{/* Agent Assignment */}
									<AgentAssignmentPanel
										conversationId={selectedConversation.id}
										assignedAgents={conversationAgents}
									availableAgents={availableAgents}
									currentUserRole={currentUserRole}
									currentUserId={
										agentSettings?.current_agent_id ||
										JSON.parse(localStorage.getItem('scalechat_user') || '{}')
											.id
									}
										canTakeover={
											(agentSettings?.agent_can_takeover_unserved !== false ||
												currentUserRole !== 'agent') &&
											!selectedConversation.assigneeId
										}
										compact
										onAddAgent={async (agentId) => {
										if (!selectedConversation) return
										try {
											await conversationsApi.addAgent(
												selectedConversation.id,
												agentId,
											)
											const agentsData: any = await conversationsApi.getAgents(
												selectedConversation.id,
											)
											if (agentsData.success)
												setConversationAgents(agentsData.payload || [])
											if (conversationAgents.length === 0) {
												setConversations((prev) =>
													prev.map((c) =>
														c.id === selectedConversation.id
															? { ...c, assigneeId: agentId }
															: c,
													),
												)
												setSelectedConversation({
													...selectedConversation,
													assigneeId: agentId,
												} as any)
											}
										} catch (e: any) {
											alert(e.message || 'Failed to add agent')
										}
									}}
									onRemoveAgent={async (agentId) => {
										if (!selectedConversation) return
										try {
											await conversationsApi.removeAgent(
												selectedConversation.id,
												agentId,
											)
											const agentsData: any = await conversationsApi.getAgents(
												selectedConversation.id,
											)
											if (agentsData.success) {
												setConversationAgents(agentsData.payload || [])
												if (agentsData.payload.length === 0) {
													setConversations((prev) =>
														prev.map((c) =>
															c.id === selectedConversation.id
																? { ...c, assigneeId: null }
																: c,
														),
													)
													setSelectedConversation({
														...selectedConversation,
														assigneeId: null,
													} as any)
												}
											}
										} catch (e: any) {
											alert(e.message || 'Failed to remove agent')
										}
									}}
									onTakeover={async () => {
										if (!selectedConversation) return
										try {
											await conversationsApi.takeover(
												selectedConversation.id,
												currentUserId || undefined,
											)
											const agentsData: any = await conversationsApi.getAgents(
												selectedConversation.id,
											)
											if (agentsData.success)
												setConversationAgents(agentsData.payload || [])
											const userStr = localStorage.getItem('scalechat_user')
											const currentUserId = userStr
												? JSON.parse(userStr).id
												: null
											setConversations((prev) =>
												prev.map((c) =>
													c.id === selectedConversation.id
														? { ...c, assigneeId: currentUserId }
														: c,
												),
											)
											setSelectedConversation({
												...selectedConversation,
												assigneeId: currentUserId,
											} as any)
										} catch (e: any) {
											alert(e.message || 'Failed to takeover conversation')
										}
									}}
								/>

								{/* Tags Management */}
									<ConversationLabels
										conversationId={selectedConversation.id}
										compact
									/>

									{/* Internal Notes */}
									<ConversationNotes
										conversationId={selectedConversation.id}
										compact
									/>

								{/* AI Summary */}
									{renderAiSummarySection('p-4')}

								{/* Additional Data */}
									{renderAdditionalDataSection('p-4')}

								{/* Activity */}
								<ActivityTimeline activities={conversationActivity} />

								{/* History */}
									<div className="p-4 border-t border-gray-100">
										<h5 className="text-sm font-semibold text-gray-900 mb-3">
											Previous Conversations
										</h5>
									<ConversationHistoryList
										history={conversationHistory}
										currentConversationId={selectedConversation.id}
										onSelect={(conv) => {
											const existingConv = conversations.find(
												(c) => c.id === conv.id,
											)
											if (existingConv) {
												handleSelectConversation(existingConv)
											}
										}}
									/>
								</div>
							</>
							) : desktopSidebarTab === 'ticket' ? (
								renderTicketTabContent('p-4')
							) : (
								renderOrdersTabContent('p-4')
							)}
					</div>
				</div>
			)}
			{/* Mobile Customer Info Drawer */}
				{selectedConversation && showMobileCustomerInfo && (
					<div className="xl:hidden fixed inset-0 z-50">
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => setShowMobileCustomerInfo(false)}
					/>
						<div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
							<div className="border-b border-gray-100">
								<div className="flex items-center justify-between gap-2 px-3 py-2">
									<button
										type="button"
										onClick={() => void handleCopySessionId(selectedConversation.id)}
										className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
									>
										<ClipboardCheck className="h-3.5 w-3.5" />
										Copy Session ID
									</button>
									<button
										onClick={() => setShowMobileCustomerInfo(false)}
										className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
							{renderSidebarTabs(mobileSidebarTab, setMobileSidebarTab)}
						</div>
						<div className="flex-1 overflow-y-auto">
							{mobileSidebarTab === 'info' ? (
								<>
									<div className="p-4 border-b border-gray-100">
										<div className="flex items-center gap-3">
											<div className="relative">
												<div
													className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden text-white font-bold text-base ${selectedConversation.avatarImageUrl ? 'bg-gray-100' : getChannelAvatarGradientClass(selectedConversation.channel)}`}
												>
													{selectedConversation.avatarImageUrl ? (
														<img
															src={selectedConversation.avatarImageUrl}
															alt={selectedConversation.name}
															className="w-full h-full object-cover"
															referrerPolicy="no-referrer"
														/>
													) : (
														selectedConversation.avatar
													)}
												</div>
												{/* Mobile Overlay Badge */}
												{selectedConversation.channelBadgeUrl && (
													<div className="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm">
														<img
															src={selectedConversation.channelBadgeUrl}
															alt="Badge"
															className="w-full h-full object-cover"
														/>
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<h4 className="font-semibold text-gray-900">
													{selectedConversation.name}
												</h4>
												{selectedConversation.channel === 'instagram'
													? (selectedConversation.instagramBio ||
															selectedConversation.instagramDisplayName) && (
															<p className="text-sm text-gray-500 truncate">
																{selectedConversation.instagramBio ||
																	selectedConversation.instagramDisplayName}
															</p>
														)
													: !agentSettings?.hide_customer_id && (
															<p className="text-sm text-gray-500 truncate">
																{selectedConversation.phone}
															</p>
														)}
												{selectedConversation.channel === 'instagram' &&
													(selectedConversation.instagramIsBusinessFollowUser ||
														selectedConversation.instagramIsUserFollowBusiness ||
														typeof selectedConversation.instagramFollowerCount ===
															'number') && (
														<div className="mt-2 flex flex-wrap items-center gap-2">
															{selectedConversation.instagramIsBusinessFollowUser && (
																<span className="inline-flex items-center rounded-2xl bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
																	Follower
																</span>
															)}
															{selectedConversation.instagramIsUserFollowBusiness && (
																<span className="inline-flex items-center rounded-2xl border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-800">
																	Following
																</span>
															)}
															{typeof selectedConversation.instagramFollowerCount ===
																'number' && (
																<span className="inline-flex items-center rounded-2xl bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
																	{selectedConversation.instagramFollowerCount}{' '}
																	Followers
																</span>
															)}
														</div>
													)}
											</div>
										</div>

										<div className="mt-4 space-y-2">
											<div className="flex justify-between items-center text-sm">
												<span className="text-gray-500">Channel</span>
												<span className="font-medium text-gray-900 capitalize">
													{selectedConversation.channel}
												</span>
											</div>
											<div className="text-sm">
												<span className="text-gray-500 block">
													Conversation ID
												</span>
												<span
													className="font-mono text-xs text-gray-900 break-all"
													title={selectedConversation.id}
												>
													{selectedConversation.id}
												</span>
											</div>
											<div className="flex justify-between items-center text-sm">
												<span className="text-gray-500">Source</span>
												<span className="font-medium text-gray-900">
													{getConversationSourceLabel(selectedConversation)}
												</span>
											</div>
											{selectedConversation.channelName && (
												<div className="flex justify-between items-center text-sm">
													<span className="text-gray-500">Channel Name</span>
													<span className="font-medium text-gray-900">
														{selectedConversation.channelName}
													</span>
												</div>
											)}
										</div>
									</div>

									{/* Tags & Notes (Mobile) */}
										<div className="border-t border-gray-50">
											<ConversationLabels
												conversationId={selectedConversation.id}
												compact
											/>
											<ConversationNotes
												conversationId={selectedConversation.id}
												compact
											/>
										{renderAiSummarySection('p-4')}
										{renderAdditionalDataSection('p-4')}
									</div>
								</>
							) : mobileSidebarTab === 'ticket' ? (
								renderTicketTabContent('p-4')
							) : (
								renderOrdersTabContent('p-4')
							)}
						</div>
					</div>
				</div>
			)}
			{/* Image Viewer Modal */}
			{activeImage && (
				<div
					className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center"
					onClick={closeImageViewer}
				>
					<div
						className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="absolute top-2 right-2 md:top-4 md:right-4 z-20 flex items-center gap-2">
							<button
								type="button"
								onClick={handleDownloadActiveImage}
								disabled={isDownloadingImage}
								className="inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-2 text-xs text-white hover:bg-black/80 transition disabled:opacity-60"
								aria-label="Download image"
							>
								{isDownloadingImage ? (
									<RefreshCw className="w-4 h-4 animate-spin" />
								) : (
									<Download className="w-4 h-4" />
								)}
								<span className="hidden md:inline">Download</span>
							</button>
							<button
								type="button"
								onClick={closeImageViewer}
								className="rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition"
								aria-label="Close image viewer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
							{activeImageIndex + 1} / {chatroomImageMessages.length}
						</div>

						<div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 z-20 rounded-lg bg-black/60 px-3 py-2 text-xs text-white">
							<div>{activeImage.fileName || 'Image'}</div>
							<div className="text-white/70">
								{formatChatTime(activeImage.timestamp)}
							</div>
						</div>

						{chatroomImageMessages.length > 1 && (
							<>
								<button
									type="button"
									onClick={showPreviousImage}
									className="absolute left-1 md:left-4 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition"
									aria-label="Previous image"
								>
									<ChevronRight className="w-6 h-6 rotate-180" />
								</button>
								<button
									type="button"
									onClick={showNextImage}
									className="absolute right-1 md:right-4 z-20 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition"
									aria-label="Next image"
								>
									<ChevronRight className="w-6 h-6" />
								</button>
							</>
						)}

						{isImageViewerLoadError ? (
							<div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-6 py-4 text-white">
								<ImageOff className="w-6 h-6" />
								<span className="text-sm">Image unavailable</span>
							</div>
						) : (
							<img
								src={activeImage.url}
								alt={activeImage.fileName || 'Image'}
								className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
								onError={() => setIsImageViewerLoadError(true)}
							/>
						)}
					</div>
				</div>
			)}
			{/* Resolve Modal */}
			<ResolveConfirmModal
				isOpen={showResolveModal}
				onClose={() => setShowResolveModal(false)}
				onConfirm={async () => {
					if (!selectedConversation) return
					try {
						await conversationsApi.resolve(selectedConversation.id)
						setConversations((prev) =>
							prev.map((c) =>
								c.id === selectedConversation.id
									? { ...c, status: 'resolved' as const }
									: c,
							),
						)
						setSelectedConversation({
							...selectedConversation,
							status: 'resolved',
						} as any)
						setConversationActivity((prev) => [
							{
								id: 'temp-' + Date.now(),
								action: 'resolved',
								created_at: new Date().toISOString(),
								actor: { name: 'You' },
							},
							...prev,
						])
						setShowResolveModal(false)
					} catch (error) {
						console.error('Failed to resolve:', error)
						alert('Failed to resolve conversation')
					}
				}}
				data={{
					name: selectedConversation?.name || '',
					totalMessages: selectedConversation?.messages.length || 0,
				}}
			/>
				{showBulkEditModal && (
					<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
					<div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
						<div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
							<div className="flex items-center gap-2">
								<h3 className="text-xl font-semibold text-gray-900">
									Edit Selected Conversation
								</h3>
								<span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-blue-100 px-2 text-sm font-semibold text-blue-700">
									{selectedConversationCount}
								</span>
							</div>
							<button
								type="button"
								onClick={() => {
									if (isSubmittingBulkEdit) return
									setShowBulkEditModal(false)
								}}
								className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
							>
								<X className="h-6 w-6" />
							</button>
						</div>

						<div className="max-h-[65vh] overflow-y-auto px-5 py-5 sm:px-6">
							{isLoadingBulkOptions ? (
								<div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
									<RefreshCw className="h-4 w-4 animate-spin" />
									Loading options...
								</div>
							) : null}
							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<div className="space-y-1.5">
									<label className="text-sm font-medium text-gray-600">
										Collaborators
									</label>
									<SearchableMultiSelect
										values={bulkEditForm.collaboratorIds}
										onChange={(nextValues) =>
											setBulkEditForm((previous) => ({
												...previous,
												collaboratorIds: nextValues,
											}))
										}
										options={bulkAgentOptions}
										placeholder="Choose Collaborators"
									/>
								</div>

								<div className="space-y-1.5">
									<label className="text-sm font-medium text-gray-600">
										Handled By
									</label>
									<SearchableSingleSelect
										value={bulkEditForm.handledById}
										onChange={(nextValue) =>
											setBulkEditForm((previous) => ({
												...previous,
												handledById: nextValue,
											}))
										}
										options={[
											{ value: '', label: 'Choose Agent' },
											...bulkAgentOptions,
										]}
										placeholder="Choose Agent"
									/>
								</div>

								<div className="space-y-1.5">
									<label className="text-sm font-medium text-gray-600">
										Label
									</label>
									<SearchableSingleSelect
										value={bulkEditForm.labelId}
										onChange={(nextValue) =>
											setBulkEditForm((previous) => ({
												...previous,
												labelId: nextValue,
											}))
										}
										options={bulkLabelOptions}
										placeholder="Choose Label"
									/>
								</div>

								<div className="space-y-1.5">
									<label className="text-sm font-medium text-gray-600">
										Pipeline
									</label>
									<SearchableSingleSelect
										value={bulkEditForm.pipelineStageId}
										onChange={(nextValue) =>
											setBulkEditForm((previous) => ({
												...previous,
												pipelineStageId: nextValue,
											}))
										}
										options={bulkPipelineOptions}
										placeholder="Choose Pipeline"
									/>
								</div>

								<div className="space-y-1.5 md:col-span-1">
									<label className="text-sm font-medium text-gray-600">
										Resolve
									</label>
									<SearchableSingleSelect
										value={bulkEditForm.resolveStatus}
										onChange={(nextValue) =>
											setBulkEditForm((previous) => ({
												...previous,
												resolveStatus:
													nextValue as BulkEditFormState['resolveStatus'],
											}))
										}
										options={bulkResolveOptions}
										placeholder="Choose Resolve"
									/>
								</div>
							</div>
						</div>

						<div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4 sm:px-6">
							<button
								type="button"
								onClick={() => {
									if (isSubmittingBulkEdit) return
									setShowBulkEditModal(false)
								}}
								className="rounded-xl border border-red-300 px-5 py-2.5 text-lg font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
								disabled={isSubmittingBulkEdit}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void handleSubmitBulkEdit()}
								disabled={isSubmittingBulkEdit || selectedConversationCount === 0}
								className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
							>
								{isSubmittingBulkEdit && (
									<RefreshCw className="h-4 w-4 animate-spin" />
								)}
								Update All
							</button>
						</div>
						</div>
					</div>
				)}
				{showStartNewChatModal && (
					<div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4">
						<div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
							<div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_420px]">
								<div className="border-b border-gray-100 md:border-b-0 md:border-r md:border-gray-100">
									<div className="flex items-center justify-between px-6 py-5 md:px-8">
										<h3 className="text-3xl font-bold text-gray-900">New Chat</h3>
										<button
											type="button"
											onClick={() => setShowStartNewChatModal(false)}
											className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
										>
											<X className="h-5 w-5" />
										</button>
									</div>
									<div className="space-y-5 px-6 pb-6 md:px-8 md:pb-8">
										{chatCreationDataError ? (
											<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
												<div className="flex items-center justify-between gap-3">
													<span>{chatCreationDataError}</span>
													<button
														type="button"
														onClick={() => void loadChatCreationData()}
														className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
													>
														Retry
													</button>
												</div>
											</div>
										) : null}
										<div className="space-y-2">
											<label className="text-2xl font-semibold text-gray-900">
												Select Inbox
											</label>
											<select
												value={startNewChatForm.inboxId}
												onChange={(event) =>
													setStartNewChatForm((previous) => ({
														...previous,
														inboxId: event.target.value,
													}))
												}
												disabled={isLoadingChatCreationData}
												className="h-14 w-full rounded-xl border border-gray-200 px-4 text-xl text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
											>
												<option value="">
													{isLoadingChatCreationData
														? 'Loading inboxes...'
														: 'Select Inbox'}
												</option>
												{whatsappInboxCreationOptions.map((inbox: any) => (
													<option key={String(inbox.id)} value={String(inbox.id)}>
														{String(inbox.name || inbox.id)}
													</option>
												))}
											</select>
										</div>
										<div className="space-y-2">
											<label className="text-2xl font-semibold text-gray-900">
												Name
											</label>
											<input
												type="text"
												value={startNewChatForm.name}
												onChange={(event) =>
													setStartNewChatForm((previous) => ({
														...previous,
														name: event.target.value,
													}))
												}
												placeholder="Input Name"
												className="h-14 w-full rounded-xl border border-gray-200 px-4 text-xl text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
											/>
										</div>
										<div className="space-y-2">
											<label className="text-2xl font-semibold text-gray-900">
												Phone Number
											</label>
											<div className="flex h-14 w-full items-center gap-3 rounded-xl border border-gray-200 px-4">
												<span className="text-xl text-gray-500">+62</span>
												<input
													type="tel"
													value={startNewChatForm.phoneNumber}
													onChange={(event) =>
														setStartNewChatForm((previous) => ({
															...previous,
															phoneNumber: event.target.value,
														}))
													}
													placeholder="85710369281"
													className="w-full border-0 bg-transparent text-xl text-gray-900 placeholder:text-gray-400 outline-none"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<label className="text-2xl font-semibold text-gray-900">
												Select Template
											</label>
											<select
												value={startNewChatForm.templateName}
												onChange={(event) =>
													setStartNewChatForm((previous) => ({
														...previous,
														templateName: event.target.value,
													}))
												}
												disabled={isLoadingChatCreationData}
												className="h-14 w-full rounded-xl border border-gray-200 px-4 text-xl text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
											>
												<option value="">
													{isLoadingChatCreationData
														? 'Loading templates...'
														: 'Select Template'}
												</option>
												{chatCreationTemplates.map((template) => (
													<option key={template.id} value={template.name}>
														{template.name}
														{template.language ? ` (${template.language})` : ''}
													</option>
												))}
											</select>
										</div>
									</div>
								</div>
								<div className="bg-[#f8f5f2] p-6 md:p-8">
									<h4 className="text-2xl font-semibold text-gray-900">Preview</h4>
									<div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
										<p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-500">
											{selectedStartNewChatTemplatePreview ||
												'Your Message will show here'}
										</p>
									</div>
								</div>
							</div>
							<div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 md:px-8">
								<button
									type="button"
									onClick={() => setShowStartNewChatModal(false)}
									className="rounded-full border border-blue-400 px-6 py-2 text-xl font-semibold text-blue-600 transition-colors hover:bg-blue-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleStartNewChatSubmit}
									disabled={!canStartNewChat || isLoadingChatCreationData}
									className="rounded-full bg-blue-500 px-6 py-2 text-xl font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
								>
									Start Chat
								</button>
							</div>
						</div>
					</div>
				)}
				{showCreateWhatsappGroupModal && (
					<div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4">
						<div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
							<div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
								<h3 className="w-full text-center text-3xl font-bold text-gray-900">
									Create Whatsapp Group
								</h3>
								<button
									type="button"
									onClick={() => setShowCreateWhatsappGroupModal(false)}
									className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
							<div className="space-y-6 px-6 py-6">
								{chatCreationDataError ? (
									<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
										<div className="flex items-center justify-between gap-3">
											<span>{chatCreationDataError}</span>
											<button
												type="button"
												onClick={() => void loadChatCreationData()}
												className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
											>
												Retry
											</button>
										</div>
									</div>
								) : null}
								<div className="space-y-2">
									<label className="text-xl font-semibold text-gray-900">
										Group name <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										maxLength={50}
										value={createWhatsappGroupForm.name}
										onChange={(event) =>
											setCreateWhatsappGroupForm((previous) => ({
												...previous,
												name: event.target.value,
											}))
										}
										placeholder="Input group name"
										className="h-12 w-full rounded-xl border border-gray-200 px-4 text-lg text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
									/>
									<p className="text-base text-gray-500">
										{createWhatsappGroupForm.name.length}/50
									</p>
								</div>
								<div className="space-y-2">
									<label className="text-xl font-semibold text-gray-900">
										Group description
									</label>
									<textarea
										maxLength={300}
										value={createWhatsappGroupForm.description}
										onChange={(event) =>
											setCreateWhatsappGroupForm((previous) => ({
												...previous,
												description: event.target.value,
											}))
										}
										placeholder="Input group description"
										rows={4}
										className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-lg text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
									/>
									<p className="text-base text-gray-500">
										{createWhatsappGroupForm.description.length}/300
									</p>
								</div>
								<div className="space-y-2">
									<label className="text-xl font-semibold text-gray-900">
										Whatsapp platform <span className="text-red-500">*</span>
									</label>
									<select
										value={createWhatsappGroupForm.inboxId}
										onChange={(event) =>
											setCreateWhatsappGroupForm((previous) => ({
												...previous,
												inboxId: event.target.value,
											}))
										}
										disabled={isLoadingChatCreationData}
										className="h-12 w-full rounded-xl border border-gray-200 px-4 text-lg text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
									>
										<option value="">
											{isLoadingChatCreationData
												? 'Loading platforms...'
												: 'Select or search platform...'}
										</option>
										{whatsappInboxCreationOptions.map((inbox: any) => (
											<option key={String(inbox.id)} value={String(inbox.id)}>
												{String(inbox.name || inbox.id)}
											</option>
										))}
									</select>
								</div>
								<div className="rounded-lg bg-amber-50 px-3 py-2 text-base italic text-amber-700">
									*This feature is only available for WhatsApp Cloud API numbers with
									a minimum tier of 100.000+ messages.
									<br />
									*Numbers using WhatsApp Coexistence cannot use this feature.
								</div>
							</div>
							<div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
								<button
									type="button"
									onClick={() => setShowCreateWhatsappGroupModal(false)}
									className="rounded-xl border border-gray-200 px-5 py-2 text-xl font-semibold text-gray-700 transition-colors hover:bg-gray-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleCreateWhatsappGroupSubmit}
									disabled={!canCreateWhatsappGroup || isLoadingChatCreationData}
									className="rounded-xl bg-blue-500 px-5 py-2 text-xl font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
								>
									Create group
								</button>
							</div>
						</div>
					</div>
				)}
				{/* Template Modal */}
				{showTemplateModal && (
					<TemplateSelector
						onAssign={(t) => handleSendTemplate(t)}
					onClose={() => setShowTemplateModal(false)}
				/>
			)}
			{/* Edit Customer Modal */}
			{showEditCustomerModal && selectedConversation?.contactId && (
				<EditCustomerModal
					customer={{
						id: selectedConversation.contactId,
						name: selectedConversation.name,
						email: selectedConversation.email,
						phone_number:
							selectedConversation.phone || selectedConversation.identifier,
					}}
					onSave={async (data) => {
						try {
							await customers.update(selectedConversation.contactId!, data)

							// Update local state
							setSelectedConversation({
								...selectedConversation,
								name: data.name || selectedConversation.name,
								email: data.email,
								phone: data.phone_number || selectedConversation.phone,
							} as any)

							// Refresh conversation list
							loadConversations()

							// Show success message
							alert('Customer information updated successfully')
						} catch (error) {
							console.error('Failed to update customer:', error)
							throw error
						}
					}}
					onClose={() => setShowEditCustomerModal(false)}
				/>
			)}
			{/* Add Additional Info Column Modal */}
			{showAddAdditionalInfoModal && (
				<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
						<div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
							<h3 className="text-base font-semibold text-gray-900">
								New Additional Info Column
							</h3>
							<button
								type="button"
								onClick={() => {
									if (isCreatingAdditionalField) return
									setShowAddAdditionalInfoModal(false)
								}}
								className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							>
								<X className="h-5 w-5" />
							</button>
						</div>

						<div className="space-y-4 px-5 py-4">
							<div className="space-y-1.5">
								<label className="text-sm font-medium text-gray-700">
									Name
								</label>
								<input
									type="text"
									value={newAdditionalFieldName}
									onChange={(event) =>
										setNewAdditionalFieldName(event.target.value)
									}
									placeholder="e.g. DOB"
									className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
								/>
							</div>

							<div className="space-y-1.5">
								<label className="text-sm font-medium text-gray-700">
									Type
								</label>
								<select
									value={newAdditionalFieldType}
									onChange={(event) =>
										setNewAdditionalFieldType(
											event.target.value as AdditionalFieldType,
										)
									}
									className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-200"
								>
									{ADDITIONAL_FIELD_TYPE_OPTIONS.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</div>

							{newAdditionalFieldType === 'dropdown' && (
								<div className="space-y-1.5">
									<label className="text-sm font-medium text-gray-700">
										Select Options
									</label>
									<input
										type="text"
										value={newAdditionalFieldOptions}
										onChange={(event) =>
											setNewAdditionalFieldOptions(event.target.value)
										}
										placeholder="Option A, Option B, Option C"
										className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
									/>
								</div>
							)}
						</div>

						<div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
							<button
								type="button"
								onClick={() => setShowAddAdditionalInfoModal(false)}
								disabled={isCreatingAdditionalField}
								className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => void handleCreateAdditionalField()}
								disabled={isCreatingAdditionalField}
								className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
							>
								{isCreatingAdditionalField && (
									<RefreshCw className="h-4 w-4 animate-spin" />
								)}
								Create
							</button>
						</div>
					</div>
				</div>
			)}
			{/* Block Customer Modal */}
			{showBlockCustomerModal && selectedConversation && (
				<BlockCustomerModal
					customerName={selectedConversation.name}
					customerPhone={
						selectedConversation.phone ||
						selectedConversation.identifier ||
						'Unknown'
					}
					blockType={blockType}
					onConfirm={async (reason) => {
						try {
							// contacts available from static import

							if (blockType === 'chat') {
								await contacts.block(selectedConversation.contactId!, reason)
							} else if (blockType === 'call') {
								await contacts.blockCall(
									selectedConversation.contactId!,
									reason,
								)
							}

							// Update conversation status to resolved
							setConversations((prev) =>
								prev.map((c) =>
									c.id === selectedConversation.id
										? { ...c, status: 'resolved' as const }
										: c,
								),
							)

							// Refresh conversation list
							loadConversations()

							// Show success message
							const action =
								blockType === 'chat' ? 'blocked' : 'blocked from calls'
							alert(`Customer ${action} successfully`)

							// Close chat view if blocking chat
							if (blockType === 'chat') {
								setSelectedConversation(null)
							}
						} catch (error) {
							console.error('Failed to block customer:', error)
							throw error
						}
					}}
					onClose={() => setShowBlockCustomerModal(false)}
				/>
			)}
			{/* Pin Chat Modal */}
			{showPinChatModal && selectedConversation && (
				<PinChatModal
					conversationId={selectedConversation.id}
					conversationName={selectedConversation.name}
					onConfirm={async () => {
						// pinChat and getPinnedChats available from static import
						pinChat(selectedConversation.id)

						// Update local state
						setPinnedChats(getPinnedChats())

						// Re-sort conversations to show pinned at top
						loadConversations()
					}}
					onClose={() => setShowPinChatModal(false)}
				/>
			)}
			{/* Mute Notifications Modal */}
			{showMuteModal && selectedConversation && (
				<MuteNotificationsModal
					conversationName={selectedConversation.name}
					onConfirm={async (duration) => {
						// muteChat available from static import
						muteChat(selectedConversation.id, duration)

						// Update local state
						setMutedChats((prev) => new Set(prev).add(selectedConversation.id))

						alert('Notifications muted successfully')
					}}
					onClose={() => setShowMuteModal(false)}
				/>
			)}
			{/* View History Modal */}
			{showHistoryModal && selectedConversation?.contactId && (
				<ViewHistoryModal
					contactId={selectedConversation.contactId}
					contactName={selectedConversation.name}
					currentConversationId={selectedConversation.id}
					onSelectConversation={(convId) => {
						// Find and select the conversation by ID
						const conv = conversations.find((c) => c.id === convId)
						if (conv) {
							handleSelectConversation(conv)
						}
					}}
					onClose={() => setShowHistoryModal(false)}
				/>
			)}
			{/* Manage Labels Modal */}
			{showManageLabelsModal && selectedConversation && (
				<ManageLabelsModal
					conversationId={selectedConversation.id}
					onClose={() => setShowManageLabelsModal(false)}
				/>
			)}
			{/* Merge Customer Modal */}
			{showMergeCustomerModal && selectedConversation?.contactId && (
				<MergeCustomerModal
					sourceContactId={selectedConversation.contactId}
					sourceContactName={selectedConversation.name}
					onClose={() => setShowMergeCustomerModal(false)}
					onSuccess={() => {
						setShowMergeCustomerModal(false)
						setSelectedConversation(null) // Deselect as it might be deleted/moved
						loadConversations() // Refresh list
					}}
				/>
			)}
			{/* Export Chat Modal */}
			{showExportChatModal && selectedConversation && (
				<ExportChatModal
					conversationId={selectedConversation.id}
					onClose={() => setShowExportChatModal(false)}
				/>
			)}
			{/* Report Issue Modal */}
			{showReportIssueModal && selectedConversation && (
				<ReportIssueModal
					conversationId={selectedConversation.id}
					onClose={() => setShowReportIssueModal(false)}
				/>
			)}
			{selectedConversation && (
				<MediaGalleryModal
					open={showGalleryModal}
					onClose={() => setShowGalleryModal(false)}
					platform={
						selectedConversation.channel as
							| 'whatsapp'
							| 'instagram'
							| 'tiktok'
							| undefined
					}
					onUploadNew={() => {
						if (
							selectedConversation.channel === 'whatsapp' &&
							selectedConversation.whatsappWindowExpired
						) {
							notifyMessagingWindowExpired(selectedConversation)
							return
						}
						document.getElementById('media-upload')?.click()
					}}
					onSelectFile={async (file) => {
						if (!file.url || !selectedConversation) return
						if (
							selectedConversation.channel === 'whatsapp' &&
							selectedConversation.whatsappWindowExpired
						) {
							notifyMessagingWindowExpired(selectedConversation)
							return
						}
						setIsSending(true)
						try {
							await conversationsApi.sendMessage(selectedConversation.id, {
								content: '',
								media: {
									type: file.media_type || 'document',
									url: file.url,
									mimeType: file.mime_type || 'application/octet-stream',
									fileName: file.filename || 'file',
								},
							} as any)
							handleSelectConversation(selectedConversation)
						} catch (err: unknown) {
							console.error('Gallery send failed:', err)
							showSendMessageError(
								err,
								selectedConversation.phone || selectedConversation.identifier,
							)
						} finally {
							setIsSending(false)
						}
					}}
				/>
			)}
			{/* AI Evaluation Modal */}
			{evaluatingMessage && selectedConversation && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
					<div
						className={`bg-white rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 ${isExpandedEval ? 'w-full max-w-4xl max-h-[90vh]' : 'w-full max-w-lg max-h-[80vh]'}`}
					>
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-50 rounded-xl">
									<ClipboardCheck className="w-5 h-5 text-blue-600" />
								</div>
								<h3 className="text-lg font-bold text-gray-900">
									Evaluasi Pesan AI
								</h3>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={() => setIsExpandedEval(!isExpandedEval)}
									className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
									title={isExpandedEval ? 'Collapse' : 'Expand'}
								>
									{isExpandedEval ? (
										<ChevronDown className="w-5 h-5" />
									) : (
										<ChevronRight className="w-5 h-5" />
									)}
								</button>
								<button
									onClick={() => {
										setEvaluatingMessage(null)
										setExpectedResponse('')
										setIsExpandedEval(false)
										setSelectedEvalMessage(null)
									}}
									className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
						</div>

						{/* Content */}
						<div className="flex-1 overflow-y-auto p-6">
							{isExpandedEval ? (
								// Expanded View - Two columns
								<div className="grid grid-cols-2 gap-6">
									{/* Left: Message History */}
									<div>
										<div className="flex items-center gap-2 mb-4">
											<span className="text-sm font-semibold text-gray-700">
												Riwayat Pesan
											</span>
											<Info className="w-4 h-4 text-gray-400" />
										</div>
										<div className="space-y-3 max-h-[400px] overflow-y-auto">
											{selectedConversation.messages.map((msg, idx) => {
												const isSelected =
													selectedEvalMessage === msg.id ||
													(!selectedEvalMessage &&
														msg.id === evaluatingMessage.id)
												const prevMsg =
													idx > 0
														? selectedConversation.messages[idx - 1]
														: null

												return (
													<div
														key={msg.id}
														className={`p-3 rounded-xl cursor-pointer transition ${isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}
														onClick={() => setSelectedEvalMessage(msg.id)}
													>
														<div className="flex items-start gap-3">
															<div
																className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}
															>
																{isSelected && (
																	<Check className="w-3 h-3 text-white" />
																)}
															</div>
															<div className="flex-1">
																<p
																	className={`text-sm ${msg.type === 'outgoing' && msg.isAI ? 'bg-blue-50 text-blue-900 p-2 rounded-lg' : ''}`}
																>
																	{msg.content}
																</p>
																<p className="text-[10px] text-gray-400 mt-1">
																	{new Date(msg.timestamp).toLocaleString(
																		'id-ID',
																		{
																			month: 'numeric',
																			day: 'numeric',
																			year: 'numeric',
																			hour: '2-digit',
																			minute: '2-digit',
																		},
																	)}{' '}
																	•{' '}
																	{msg.type === 'incoming'
																		? selectedConversation.name
																		: msg.isAI
																			? 'AI Agent'
																			: 'Agent'}
																</p>
															</div>
														</div>
													</div>
												)
											})}
										</div>
									</div>
									{/* Right: Expected Response */}
									<div>
										<div className="flex items-center gap-2 mb-4">
											<span className="text-sm font-semibold text-gray-700">
												Respon AI yang Diharapkan
											</span>
											<Info className="w-4 h-4 text-gray-400" />
										</div>

										{/* Context Message */}
										<div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
											{(() => {
												const selectedMsg = selectedConversation.messages.find(
													(m) =>
														m.id ===
														(selectedEvalMessage || evaluatingMessage.id),
												)
												const msgIdx = selectedConversation.messages.findIndex(
													(m) =>
														m.id ===
														(selectedEvalMessage || evaluatingMessage.id),
												)
												const prevMsg =
													msgIdx > 0
														? selectedConversation.messages[msgIdx - 1]
														: null

												return (
													<>
														{prevMsg && prevMsg.type === 'incoming' && (
															<div className="mb-3 pb-3 border-b border-gray-200">
																<p className="text-sm text-gray-700">
																	{prevMsg.content}
																</p>
																<p className="text-[10px] text-gray-400 mt-1">
																	{new Date(prevMsg.timestamp).toLocaleString(
																		'id-ID',
																	)}{' '}
																	• User
																</p>
															</div>
														)}
														{selectedMsg && (
															<div className="bg-blue-50 rounded-lg p-3">
																<p className="text-sm text-blue-900">
																	{selectedMsg.content}
																</p>
																<p className="text-[10px] text-blue-600 mt-2">
																	+ ↺ • AI Agent •{' '}
																	{new Date(
																		selectedMsg.timestamp,
																	).toLocaleString('id-ID')}
																</p>
															</div>
														)}
													</>
												)
											})()}
										</div>

										{/* Expected Response Input */}
										<textarea
											value={expectedResponse}
											onChange={(e) => setExpectedResponse(e.target.value)}
											placeholder="Tulis respon AI yang seharusnya dihasilkan..."
											className="w-full h-32 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
										/>
									</div>
								</div>
							) : (
								// Collapsed View - Simple
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div className="p-1.5 bg-gray-100 rounded-lg">
											<FileText className="w-4 h-4 text-gray-500" />
										</div>
										<span className="text-sm font-semibold text-gray-700">
											Respon AI yang Diharapkan
										</span>
										<Info className="w-4 h-4 text-gray-400" />
									</div>
									{/* Show context - previous incoming message */}
									{(() => {
										const msgIdx = selectedConversation.messages.findIndex(
											(m) => m.id === evaluatingMessage.id,
										)
										const prevMsg =
											msgIdx > 0
												? selectedConversation.messages[msgIdx - 1]
												: null

										return prevMsg && prevMsg.type === 'incoming' ? (
											<div className="bg-gray-50 rounded-xl p-4 mb-4 border-l-4 border-gray-300">
												<p className="text-sm text-gray-700">
													{prevMsg.content}
												</p>
												<p className="text-[10px] text-gray-400 mt-2">
													{new Date(prevMsg.timestamp).toLocaleString('id-ID')}{' '}
													• User
												</p>
											</div>
										) : null
									})()}
									{/* Current AI Response */}
									<div className="flex justify-end mb-4">
										<div className="bg-blue-50 rounded-xl p-4 max-w-[85%] border border-blue-100">
											<p className="text-sm text-blue-900">
												{evaluatingMessage.content}
											</p>
											<p className="text-[10px] text-blue-600 mt-2 text-right">
												+ ↺ • AI Agent •{' '}
												{new Date(evaluatingMessage.timestamp).toLocaleString(
													'id-ID',
												)}
											</p>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
							<button
								onClick={() => {
									setEvaluatingMessage(null)
									setExpectedResponse('')
									setIsExpandedEval(false)
									setSelectedEvalMessage(null)
								}}
								className="px-6 py-2.5 text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-100 transition"
							>
								Cancel
							</button>
							<button
								onClick={async () => {
									if (!expectedResponse.trim()) {
										alert('Silakan tulis respon AI yang diharapkan')
										return
									}

									setSavingEvaluation(true)
									try {
										// Save evaluation via API
										const response = await fetch(
											`${import.meta.env.VITE_API_URL}/api/evaluations`,
											{
												method: 'POST',
												headers: {
													'Content-Type': 'application/json',
													Authorization: `Bearer ${localStorage.getItem('scalechat_token')}`,
												},
												body: JSON.stringify({
													conversation_id: selectedConversation.id,
													message_id:
														selectedEvalMessage || evaluatingMessage.id,
													expected_response: expectedResponse,
													actual_response: evaluatingMessage.content,
													type: 'correction',
												}),
											},
										)

										if (response.ok) {
											alert('Evaluasi berhasil disimpan!')
											setEvaluatingMessage(null)
											setExpectedResponse('')
											setIsExpandedEval(false)
											setSelectedEvalMessage(null)
										} else {
											throw new Error('Failed to save evaluation')
										}
									} catch (error) {
										console.error('Save evaluation error:', error)
										alert('Gagal menyimpan evaluasi')
									} finally {
										setSavingEvaluation(false)
									}
								}}
								disabled={savingEvaluation}
								className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2"
							>
								{savingEvaluation ? (
									<RefreshCw className="w-4 h-4 animate-spin" />
								) : null}
								Save
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Advanced Filter Modal */}
			{showAdvancedFilter && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={() => setShowAdvancedFilter(false)}
				>
						<div
							className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-visible"
							onClick={(e) => e.stopPropagation()}
						>
						<div className="flex items-center justify-between p-6 pb-4">
							<h2 className="text-lg font-semibold text-gray-900">Filter</h2>
							<button
								onClick={() => setShowAdvancedFilter(false)}
								className="p-1 hover:bg-gray-100 rounded-lg"
							>
								<X className="h-5 w-5 text-gray-500" />
							</button>
						</div>

							<div className="grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-2">
							{/* Date Range */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Date Range
								</label>
								<div className="flex gap-2">
									<input
										type="date"
										value={advancedFilters.dateFrom}
										onChange={(e) =>
											setAdvancedFilters((f) => ({
												...f,
												dateFrom: e.target.value,
											}))
										}
										className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
									<input
										type="date"
										value={advancedFilters.dateTo}
										onChange={(e) =>
											setAdvancedFilters((f) => ({
												...f,
												dateTo: e.target.value,
											}))
										}
										className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
							</div>

							{/* Inbox */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Inbox
									</label>
									<SearchableSingleSelect
										value={advancedFilters.inboxId}
										onChange={(nextValue) =>
											setAdvancedFilters((f) => ({
												...f,
												inboxId: nextValue,
											}))
										}
										options={inboxFilterOptions}
										placeholder="All Inboxes"
									/>
								</div>

							{/* Label */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Label
									</label>
									<SearchableMultiSelect
										values={advancedFilters.labelIds}
										onChange={(nextValues) =>
											setAdvancedFilters((f) => ({
												...f,
												labelIds: nextValues,
											}))
										}
										options={labelFilterOptions}
										placeholder="All Labels"
									/>
								</div>

							{/* Resolved By */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Resolved By
									</label>
									<SearchableSingleSelect
										value={advancedFilters.resolvedBy}
										onChange={(nextValue) =>
											setAdvancedFilters((f) => ({
												...f,
												resolvedBy: nextValue,
											}))
										}
										options={resolvedByFilterOptions}
										placeholder="Choose Agent"
									/>
								</div>

							{/* Agent */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Agent
									</label>
									<SearchableMultiSelect
										values={advancedFilters.agentIds}
										onChange={(nextValues) =>
											setAdvancedFilters((f) => ({
												...f,
												agentIds: nextValues,
											}))
										}
										options={agentFilterOptions}
										placeholder="Choose Agents"
									/>
								</div>

							{/* AI Agent */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										AI Agent
									</label>
									<SearchableSingleSelect
										value={advancedFilters.aiAgentId}
										onChange={(nextValue) =>
											setAdvancedFilters((f) => ({
												...f,
												aiAgentId: nextValue,
											}))
										}
										options={aiAgentFilterOptions}
										placeholder="Choose AI Agent"
									/>
								</div>

							{/* Status */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Status
									</label>
									<SearchableSingleSelect
										value={advancedFilters.status}
										onChange={(nextValue) =>
											setAdvancedFilters((f) => ({
												...f,
												status: nextValue,
											}))
										}
										options={statusFilterOptions}
										placeholder="All Statuses"
									/>
								</div>

							{/* Pipeline Status */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Pipeline Status
									</label>
									<SearchableSingleSelect
										value={advancedFilters.pipelineStageId}
										onChange={(nextValue) =>
											setAdvancedFilters((f) => ({
												...f,
												pipelineStageId: nextValue,
											}))
										}
										options={pipelineStatusFilterOptions}
										placeholder="All Statuses"
									/>
								</div>
						</div>

						<div className="flex justify-end gap-3 px-6 pb-6">
							<button
								onClick={() => {
									setAdvancedFilters({
										dateFrom: '',
										dateTo: '',
										inboxId: '',
										labelIds: [],
										resolvedBy: '',
										agentIds: [],
										aiAgentId: '',
										status: '',
										pipelineStageId: '',
									})
								}}
								className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
							>
								Reset
							</button>
							<button
								onClick={() => {
									setShowAdvancedFilter(false)
									loadConversations({ reset: true })
								}}
								className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
							>
								Apply
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
