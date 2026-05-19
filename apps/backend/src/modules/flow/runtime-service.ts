import prisma from '../../lib/prisma'
import { isUuid } from '../../lib/utils'
import { ChatbotFollowupService } from '../chatbot/followup-service'
import { AIResponseLogService } from '../chatbot/response-log-service'
import { ChatbotService } from '../chatbot/service'
import { ConversationService } from '../conversation/service'
import { LabelService } from '../label/service'
import { MessageService } from '../message/service'

const FLOW_RUNTIME_STATE_KEY = 'flow_runtime'
const FLOW_TIMEZONE = 'Asia/Jakarta'
const FLOW_MAX_STEPS = 80

type FlowRuntimeExecuteInboundParams = {
	appId: string
	inboxId: string
	conversationId: string
	incomingMessage: {
		id?: string | null
		content?: string | null
		content_type?: string | null
		created_at?: Date | string | null
		content_attributes?: unknown
	}
	contact: {
		id: string
		name?: string | null
		phone_number?: string | null
		identifier?: string | null
		avatar_url?: string | null
		meta?: unknown
		metadata?: unknown
	}
	channelType: 'whatsapp' | 'instagram' | 'tiktok'
	channelName: string | null
	channelBadgeUrl: string | null
}

type FlowRuntimeExecuteInboundResult = {
	matched: boolean
	skipChatbot: boolean
	flowId: string | null
	reason:
		| 'no_active_flow'
		| 'no_start_node'
		| 'no_condition_match'
		| 'waiting_for_button'
		| 'completed'
		| 'error'
		| 'executed'
}

type FlowRuntimeState = {
	flow_id: string
	cursor_node_id: string | null
	waiting_button: null | {
		node_id: string
		options: string[]
	}
	variables: Record<string, unknown>
	last_error: string | null
	last_executed_at: string
	status: 'running' | 'waiting_button' | 'completed' | 'idle' | 'error'
}

type RuntimeFlowNode = {
	id: string
	type:
		| 'start'
		| 'condition'
		| 'action'
		| 'end'
		| 'ai_generate'
		| 'ai_classify'
		| 'ai_handoff'
	data: Record<string, unknown>
}

type RuntimeFlowEdge = {
	source: string
	target: string
	index: number
}

type RuntimeFlowGraph = {
	nodes: RuntimeFlowNode[]
	edges: RuntimeFlowEdge[]
	nodeById: Map<string, RuntimeFlowNode>
	childrenByNodeId: Map<string, string[]>
	startNodeId: string | null
}

type RuntimeHistoryItem = {
	role: 'user' | 'assistant'
	content: string
}

type DistributionMethod = 'round_robin' | 'least_assigned'

type RuntimeContext = {
	appId: string
	inboxId: string
	conversationId: string
	flowId: string
	channelType: 'whatsapp' | 'instagram' | 'tiktok'
	channelName: string | null
	channelBadgeUrl: string | null
	contact: FlowRuntimeExecuteInboundParams['contact']
	incomingMessage: FlowRuntimeExecuteInboundParams['incomingMessage']
	incomingText: string
	incomingAt: Date
	isFirstContactMessage: boolean
	defaultChatbotId: string | null
	defaultTeamIds: string[]
	defaultAgentIds: string[]
	distributionMethod: DistributionMethod
	history: RuntimeHistoryItem[]
	state: FlowRuntimeState
}

type BranchResolution = {
	nextNodeId: string | null
	hasConditionChildren: boolean
	matchedCondition: boolean
}

type ActionExecutionResult = {
	paused: boolean
	jumpToNodeId: string | null
}

const LEGACY_CONDITION_TYPE_MAP: Record<string, 'text' | 'time' | 'button' | 'else'> = {
	first_message_text: 'text',
	first_message_time: 'time',
	button_answer: 'button',
	else: 'else',
}

const NEGATIVE_SENTIMENT_KEYWORDS = [
	'kecewa',
	'buruk',
	'jelek',
	'marah',
	'kesal',
	'complain',
	'komplain',
	'bad',
	'terrible',
	'worst',
]

const ESCALATION_KEYWORDS = [
	'agent',
	'human',
	'orang',
	'admin',
	'supervisor',
	'cs',
	'customer service',
	'team',
]

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
	return value as Record<string, unknown>
}

function asString(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const normalized = value.trim()
	return normalized.length > 0 ? normalized : null
}

function toStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return []
	return value
		.map((item) => String(item || '').trim())
		.filter((item) => item.length > 0)
}

function asUuidOrNull(value: unknown): string | null {
	const normalized = asString(value)
	if (!normalized) return null
	return isUuid(normalized) ? normalized : null
}

function getPrismaErrorCode(error: unknown): string | null {
	if (!error || typeof error !== 'object') return null
	const rawCode = (error as { code?: unknown }).code
	if (typeof rawCode !== 'string') return null
	const code = rawCode.trim().toUpperCase()
	return code.length > 0 ? code : null
}

function isRecoverableLabelAssignmentError(error: unknown): boolean {
	const code = getPrismaErrorCode(error)
	if (code === 'P2002' || code === 'P2003' || code === 'P2025') {
		return true
	}

	const message = String((error as { message?: unknown })?.message || '').toLowerCase()
	return (
		message.includes('foreign key constraint') ||
		message.includes('unique constraint') ||
		message.includes('duplicate key value')
	)
}

function extractConfiguredChatbotId(config: Record<string, unknown>): string | null {
	return (
		asUuidOrNull(config.default_chatbot_id) ||
		asUuidOrNull(config.defaultChatbotId) ||
		null
	)
}

function extractConfiguredFlowId(config: Record<string, unknown>): string | null {
	return (
		asUuidOrNull(config.default_flow_id) ||
		asUuidOrNull(config.defaultFlowId) ||
		null
	)
}

function extractConfiguredTeamIds(config: Record<string, unknown>): string[] {
	const snakeCase = toStringArray(config.default_team_ids).filter((teamId) => isUuid(teamId))
	const camelCase = toStringArray(config.defaultTeamIds).filter((teamId) => isUuid(teamId))
	return Array.from(new Set([...snakeCase, ...camelCase]))
}

function extractConfiguredAgentIds(config: Record<string, unknown>): string[] {
	const snakeCase = toStringArray(config.default_agent_ids).filter((agentId) =>
		isUuid(agentId),
	)
	const camelCase = toStringArray(config.defaultAgentIds).filter((agentId) =>
		isUuid(agentId),
	)
	return Array.from(new Set([...snakeCase, ...camelCase]))
}

function extractConfiguredDistributionMethod(
	config: Record<string, unknown>,
): DistributionMethod | null {
	const normalized = (
		asString(config.distribution_method) ||
		asString(config.distributionMethod) ||
		''
	)
		.trim()
		.toLowerCase()

	if (normalized === 'least_assigned') return 'least_assigned'
	if (normalized === 'round_robin') return 'round_robin'
	return null
}

function buildFlowRuntimeAdditionalAttributes(params: {
	baseAttributes: Record<string, unknown>
	state: FlowRuntimeState
	executedAt?: Date
}) {
	const executedAt = params.executedAt || new Date()
	return {
		...params.baseAttributes,
		[FLOW_RUNTIME_STATE_KEY]: {
			...params.state,
			last_error: null,
			last_executed_at: executedAt.toISOString(),
		},
	}
}

function normalizeRuntimeActionType(value: unknown): string {
	const normalized = String(value || '')
		.trim()
		.toLowerCase()
	if (!normalized) return 'send_message'
	if (normalized === 'message') return 'send_message'
	if (normalized === 'jump') return 'jump_to_action'
	return normalized
}

function normalizeConditionType(nodeData: Record<string, unknown>): 'text' | 'time' | 'button' | 'else' {
	const primary = asString(nodeData.type)
	if (primary === 'text' || primary === 'time' || primary === 'button' || primary === 'else') {
		return primary
	}
	const legacy = asString(nodeData.conditionType)
	if (legacy && LEGACY_CONDITION_TYPE_MAP[legacy]) return LEGACY_CONDITION_TYPE_MAP[legacy]
	if (nodeData.isElse === true) return 'else'
	return 'text'
}

function normalizeEndType(nodeData: Record<string, unknown>): 'ai_agent' | 'human_agent' {
	const raw = (
		asString(nodeData.type) ||
		asString(nodeData.endType) ||
		asString(nodeData.end_type) ||
		'human_agent'
	).toLowerCase()
	if (raw === 'ai' || raw === 'ai_agent') return 'ai_agent'
	return 'human_agent'
}

function normalizeFlowNode(rawNode: unknown): RuntimeFlowNode | null {
	const nodeRecord = asRecord(rawNode)
	const id = asString(nodeRecord.id)
	if (!id) return null

	const nodeTypeRaw = asString(nodeRecord.type)
	const nodeData = asRecord(nodeRecord.data)

	if (nodeTypeRaw === 'start') {
		return { id, type: 'start', data: nodeData }
	}

	if (nodeTypeRaw === 'condition') {
		const conditionType = normalizeConditionType(nodeData)
		return {
			id,
			type: 'condition',
			data: {
				...nodeData,
				type: conditionType,
			},
		}
	}

	if (nodeTypeRaw === 'send_message_buttons') {
		return {
			id,
			type: 'action',
			data: {
				...nodeData,
				type: 'buttons',
				actionType: 'buttons',
				messageText:
					asString(nodeData.messageText) ||
					asString(nodeData.text) ||
					'',
				buttons: toStringArray(nodeData.buttons),
			},
		}
	}

	if (nodeTypeRaw === 'action') {
		const actionType = normalizeRuntimeActionType(
			asString(nodeData.actionType) || asString(nodeData.type) || 'send_message',
		)
		return {
			id,
			type: 'action',
			data: {
				...nodeData,
				type: actionType,
				actionType,
			},
		}
	}

	if (nodeTypeRaw === 'end') {
		const endType = normalizeEndType(nodeData)
		return {
			id,
			type: 'end',
			data: {
				...nodeData,
				type: endType,
			},
		}
	}

	if (nodeTypeRaw === 'ai_generate' || nodeTypeRaw === 'ai_classify' || nodeTypeRaw === 'ai_handoff') {
		return {
			id,
			type: nodeTypeRaw,
			data: nodeData,
		}
	}

	return null
}

function normalizeFlowEdge(rawEdge: unknown, index: number): RuntimeFlowEdge | null {
	const edgeRecord = asRecord(rawEdge)
	const source = asString(edgeRecord.source)
	const target = asString(edgeRecord.target)
	if (!source || !target) return null
	return {
		source,
		target,
		index,
	}
}

function normalizeFlowGraph(nodesRaw: unknown, edgesRaw: unknown): RuntimeFlowGraph {
	const nodes = (Array.isArray(nodesRaw) ? nodesRaw : [])
		.map((node) => normalizeFlowNode(node))
		.filter((node): node is RuntimeFlowNode => Boolean(node))

	const nodeById = new Map(nodes.map((node) => [node.id, node]))

	const edges = (Array.isArray(edgesRaw) ? edgesRaw : [])
		.map((edge, index) => normalizeFlowEdge(edge, index))
		.filter((edge): edge is RuntimeFlowEdge => Boolean(edge))
		.filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target))
		.sort((left, right) => left.index - right.index)

	const childrenByNodeId = new Map<string, string[]>()
	for (const edge of edges) {
		const existing = childrenByNodeId.get(edge.source) || []
		existing.push(edge.target)
		childrenByNodeId.set(edge.source, existing)
	}

	const startNode = nodes.find((node) => node.type === 'start') || null

	return {
		nodes,
		edges,
		nodeById,
		childrenByNodeId,
		startNodeId: startNode?.id || null,
	}
}

function parseTimeRangeMinutes(value: string): Array<{ start: number; end: number }> {
	const segments = value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)

	const parsedRanges: Array<{ start: number; end: number }> = []
	for (const segment of segments) {
		const [startRaw, endRaw] = segment.split('-').map((part) => part.trim())
		if (!startRaw || !endRaw) continue
		const start = parseClockMinutes(startRaw)
		const end = parseClockMinutes(endRaw)
		if (start === null || end === null) continue
		parsedRanges.push({ start, end })
	}
	return parsedRanges
}

function parseClockMinutes(value: string): number | null {
	const match = value.match(/^(\d{1,2}):(\d{2})$/)
	if (!match) return null
	const hour = Number(match[1])
	const minute = Number(match[2])
	if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
	if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
	return hour * 60 + minute
}

function toJakartaMinutes(date: Date): number {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: FLOW_TIMEZONE,
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
	})
		.formatToParts(date)
		.reduce<Record<string, string>>((acc, part) => {
			acc[part.type] = part.value
			return acc
		}, {})

	const hour = Number(parts.hour || '0')
	const minute = Number(parts.minute || '0')
	return hour * 60 + minute
}

function normalizeText(value: string): string {
	return value.trim().toLowerCase()
}

function evaluateConditionNode(node: RuntimeFlowNode, context: RuntimeContext): boolean {
	const conditionType = normalizeConditionType(node.data)
	const rawConditionText = asString(node.data.text) || ''

	if (conditionType === 'else') return true

	if (conditionType === 'text') {
		if (!context.isFirstContactMessage) return false
		const incomingText = normalizeText(context.incomingText)
		if (!incomingText) return false
		const keywords = rawConditionText
			.split(',')
			.map((item) => normalizeText(item))
			.filter(Boolean)
		if (keywords.length === 0) return false
		return keywords.some((keyword) => incomingText.includes(keyword))
	}

	if (conditionType === 'time') {
		if (!context.isFirstContactMessage) return false
		const ranges = parseTimeRangeMinutes(rawConditionText)
		if (ranges.length === 0) return false
		const jakartaMinutes = toJakartaMinutes(context.incomingAt)
		return ranges.some((range) =>
			range.start <= range.end
				? jakartaMinutes >= range.start && jakartaMinutes <= range.end
				: jakartaMinutes >= range.start || jakartaMinutes <= range.end,
		)
	}

	if (conditionType === 'button') {
		const expected = normalizeText(rawConditionText)
		if (!expected) return false
		const incomingText = normalizeText(context.incomingText)
		if (!incomingText) return false
		if (incomingText === expected) return true
		if (/^\d+$/.test(incomingText)) {
			const index = Number(incomingText) - 1
			const option = context.state.waiting_button?.options?.[index]
			if (option && normalizeText(option) === expected) return true
		}
		return false
	}

	return false
}

function resolveNextBranch(graph: RuntimeFlowGraph, nodeId: string, context: RuntimeContext): BranchResolution {
	const childIds = graph.childrenByNodeId.get(nodeId) || []
	if (childIds.length === 0) {
		return {
			nextNodeId: null,
			hasConditionChildren: false,
			matchedCondition: false,
		}
	}

	const children = childIds
		.map((childId) => graph.nodeById.get(childId))
		.filter((item): item is RuntimeFlowNode => Boolean(item))

	const conditionChildren = children.filter((child) => child.type === 'condition')
	if (conditionChildren.length === 0) {
		return {
			nextNodeId: children[0]?.id || null,
			hasConditionChildren: false,
			matchedCondition: Boolean(children[0]),
		}
	}

	const nonElseConditions = conditionChildren.filter(
		(node) => normalizeConditionType(node.data) !== 'else',
	)

	for (const conditionNode of nonElseConditions) {
		if (evaluateConditionNode(conditionNode, context)) {
			return {
				nextNodeId: conditionNode.id,
				hasConditionChildren: true,
				matchedCondition: true,
			}
		}
	}

	const elseNode = conditionChildren.find(
		(node) => normalizeConditionType(node.data) === 'else',
	)
	if (elseNode) {
		return {
			nextNodeId: elseNode.id,
			hasConditionChildren: true,
			matchedCondition: true,
		}
	}

	return {
		nextNodeId: null,
		hasConditionChildren: true,
		matchedCondition: false,
	}
}

function normalizeImageList(value: unknown): Array<{ url: string; fileName: string | null }> {
	if (!Array.isArray(value)) return []
	return value
		.map((item) => {
			if (typeof item === 'string') {
				const url = asString(item)
				return url ? { url, fileName: null } : null
			}
			const record = asRecord(item)
			const url = asString(record.url)
			if (!url) return null
			return {
				url,
				fileName: asString(record.fileName || record.file_name),
			}
		})
		.filter((item): item is { url: string; fileName: string | null } => Boolean(item))
}

function interpolateTemplate(template: string, context: RuntimeContext): string {
	if (!template.includes('{{')) return template
	return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, keyRaw) => {
		const key = String(keyRaw || '').trim()
		if (!key) return ''
		if (key === 'contact.display_name' || key === 'contact.name') {
			return String(context.contact.name || '').trim()
		}
		if (key === 'contact.phone' || key === 'contact.phone_number') {
			return String(context.contact.phone_number || '').trim()
		}
		if (key === 'conversation.id') {
			return context.conversationId
		}
		if (key === 'message.content') {
			return context.incomingText
		}
		if (Object.prototype.hasOwnProperty.call(context.state.variables, key)) {
			const value = context.state.variables[key]
			if (value === null || value === undefined) return ''
			return String(value)
		}
		return ''
	})
}

function toHistoryMessageRole(senderType: string | null | undefined): 'user' | 'assistant' | null {
	if (senderType === 'contact') return 'user'
	if (senderType === 'bot') return 'assistant'
	return null
}

async function dispatchActionWebhook(url: string, payload: Record<string, unknown>) {
	try {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 3_500)
		await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
			signal: controller.signal,
		})
		clearTimeout(timeoutId)
	} catch {
		// Fail-open by design.
	}
}

function extractChatbotIdFromNodeData(nodeData: Record<string, unknown>): string | null {
	const direct =
		asString(nodeData.chatbotId) ||
		asString(nodeData.chatbot_id) ||
		asString(nodeData.aiAgentId)
	if (direct && isUuid(direct)) return direct
	const chatbotRecord = asRecord(nodeData.chatbot)
	const nested = asString(chatbotRecord.id)
	return nested && isUuid(nested) ? nested : null
}

function resolvePreferredChatbotCandidates(
	context: Pick<RuntimeContext, 'defaultChatbotId'>,
	nodeData: Record<string, unknown>,
): string[] {
	const candidates: string[] = []
	const activeInboxChatbotId =
		context.defaultChatbotId && isUuid(context.defaultChatbotId)
			? context.defaultChatbotId
			: null
	const nodeChatbotId = extractChatbotIdFromNodeData(nodeData)

	if (activeInboxChatbotId) {
		candidates.push(activeInboxChatbotId)
	}
	if (nodeChatbotId && !candidates.includes(nodeChatbotId)) {
		candidates.push(nodeChatbotId)
	}
	return candidates
}

function extractAgentIdsFromNodeData(nodeData: Record<string, unknown>): string[] {
	const directIds = toStringArray(nodeData.agentIds).filter((item) => isUuid(item))
	if (directIds.length > 0) return directIds
	const agents = Array.isArray(nodeData.agents) ? nodeData.agents : []
	return agents
		.map((agent) => asString(asRecord(agent).id))
		.filter((item): item is string => Boolean(item) && isUuid(item))
}

function extractTeamIdsFromNodeData(nodeData: Record<string, unknown>): string[] {
	const directIds = toStringArray(nodeData.teamIds).filter((item) => isUuid(item))
	if (directIds.length > 0) return directIds
	const teams = Array.isArray(nodeData.teams) ? nodeData.teams : []
	return teams
		.map((team) => asString(asRecord(team).id))
		.filter((item): item is string => Boolean(item) && isUuid(item))
}

function scoreTextOverlap(input: string, candidate: string): number {
	const inputTokens = new Set(
		input
			.toLowerCase()
			.split(/[^a-z0-9]+/g)
			.map((item) => item.trim())
			.filter(Boolean),
	)
	if (inputTokens.size === 0) return 0
	const candidateTokens = candidate
		.toLowerCase()
		.split(/[^a-z0-9]+/g)
		.map((item) => item.trim())
		.filter(Boolean)
	let score = 0
	for (const token of candidateTokens) {
		if (inputTokens.has(token)) score += 1
	}
	return score
}

export abstract class FlowRuntimeService {
	private static async sendBotText(
		context: RuntimeContext,
		text: string,
		contentAttributes: Record<string, unknown> = {},
	): Promise<string | null> {
		const normalized = text.trim()
		if (!normalized) return null
		const message = await MessageService.sendMessage({
			conversationId: context.conversationId,
			senderType: 'bot',
			content: normalized,
			contentType: 'text',
			contentAttributes: {
				type: 'text',
				source: 'flow_runtime',
				flow_id: context.flowId,
				...contentAttributes,
			},
		})
		return message?.id || null
	}

	private static async sendBotImage(
		context: RuntimeContext,
		url: string,
		fileName?: string | null,
		contentAttributes: Record<string, unknown> = {},
	): Promise<string | null> {
		const mediaUrl = String(url || '').trim()
		if (!mediaUrl) return null
		const message = await MessageService.sendMessage({
			conversationId: context.conversationId,
			senderType: 'bot',
			content: mediaUrl,
			contentType: 'image',
			contentAttributes: {
				type: 'image',
				source: 'flow_runtime',
				flow_id: context.flowId,
				media_type: 'image',
				media_url: mediaUrl,
				...(fileName ? { file_name: fileName } : {}),
				...contentAttributes,
			},
		})
		return message?.id || null
	}

	private static async generateReplyWithChatbot(
		context: RuntimeContext,
		chatbotId: string,
		message: string,
		runTools: boolean,
	) {
		const response = await ChatbotService.generateAgentReply(chatbotId, context.appId, {
			message,
			history: context.history,
			runTools,
			mode: 'live',
			entrypoint: 'flow_runtime',
			conversationId: context.conversationId,
			sourceMessageIds: context.incomingMessage.id
				? [String(context.incomingMessage.id)]
				: [],
		})
		const telemetryAttributes: Record<string, unknown> = {
			ai_response_log_id: response.meta.ai_response_log_id || null,
			ai_tokens_prompt: Number(response.meta.ai_tokens_prompt || 0),
			ai_tokens_completion: Number(response.meta.ai_tokens_completion || 0),
			ai_tokens_total: Number(response.meta.ai_tokens_total || 0),
			ai_cost_credits: Number(response.meta.ai_cost_credits || 0),
			ai_cost_usd: Number(response.meta.ai_cost_usd || 0),
			ai_cost_idr: Number(response.meta.ai_cost_idr || 0),
			ai_knowledge_references: Array.isArray(
				response.meta.ai_knowledge_references,
			)
				? response.meta.ai_knowledge_references
				: [],
			ai_rtk_summary:
				response.meta.ai_rtk_summary &&
				typeof response.meta.ai_rtk_summary === 'object'
					? response.meta.ai_rtk_summary
					: {},
			knowledge_snapshot_at: response.meta.knowledge_snapshot_at || null,
		}

		const timeline = Array.isArray(response.preview?.timeline) ? response.preview.timeline : []
		let sentSomething = false
		const sentMessageIds: string[] = []
		for (const item of timeline) {
			if (!item || typeof item !== 'object') continue
			if (item.type === 'text') {
				const text = asString(item.content)
				if (!text) continue
				const sentId = await this.sendBotText(context, text, {
					ai_generated: true,
					ai_source: response.meta.ai_source,
					ai_agent_id: response.meta.ai_agent_id,
					ai_agent_name: response.meta.ai_agent_name,
					ai_credits_used: response.meta.credits_used,
					...telemetryAttributes,
				})
				if (sentId) sentMessageIds.push(sentId)
				sentSomething = true
			}
			if (item.type === 'image') {
				const imageUrl = asString(item.url)
				if (!imageUrl) continue
				const sentId = await this.sendBotImage(context, imageUrl, null, {
					ai_generated: true,
					ai_source: response.meta.ai_source,
					ai_agent_id: response.meta.ai_agent_id,
					ai_agent_name: response.meta.ai_agent_name,
					ai_credits_used: response.meta.credits_used,
					...telemetryAttributes,
				})
				if (sentId) sentMessageIds.push(sentId)
				sentSomething = true
			}
		}

		if (!sentSomething) {
			const fallbackText = asString(response.content)
			if (fallbackText) {
				const sentId = await this.sendBotText(context, fallbackText, {
					ai_generated: true,
					ai_source: response.meta.ai_source,
					ai_agent_id: response.meta.ai_agent_id,
					ai_agent_name: response.meta.ai_agent_name,
					ai_credits_used: response.meta.credits_used,
					...telemetryAttributes,
				})
				if (sentId) sentMessageIds.push(sentId)
				sentSomething = true
			}
		}

		void AIResponseLogService.attachMessageIds({
			logId: response.meta.ai_response_log_id,
			messageIds: sentMessageIds,
			status: sentSomething ? 'delivered' : 'generated',
		}).catch((error) => {
			console.error(
				'[FlowRuntimeService] Failed attaching AI response log linkage (fail-open):',
				error,
			)
		})

		if (sentSomething) {
			try {
				await ChatbotFollowupService.scheduleFromAiReply({
					conversationId: context.conversationId,
					appId: context.appId,
					chatbotId,
				})
			} catch (followupScheduleError) {
				console.error(
					'[FlowRuntimeService] Failed scheduling chatbot follow-up (fail-open):',
					followupScheduleError,
				)
			}
		}

		return response
	}

	private static async executeWithPreferredChatbot<T>(
		context: RuntimeContext,
		nodeData: Record<string, unknown>,
		handler: (chatbotId: string) => Promise<T>,
	): Promise<T> {
		const candidates = resolvePreferredChatbotCandidates(context, nodeData)
		if (candidates.length === 0) {
			throw new Error('AI node cannot run: chatbot not configured')
		}

		let lastError: unknown = null
		for (const chatbotId of candidates) {
			try {
				return await handler(chatbotId)
			} catch (error) {
				lastError = error
			}
		}

		if (lastError instanceof Error) {
			throw lastError
		}
		throw new Error('AI node cannot run: chatbot not available')
	}

	private static async pickAssigneeByDistribution(params: {
		appId: string
		candidateAgentIds: string[]
		distributionMethod: DistributionMethod
	}): Promise<string | null> {
		const uniqueCandidateAgentIds = Array.from(
			new Set(params.candidateAgentIds.filter((agentId) => isUuid(agentId))),
		)
		if (uniqueCandidateAgentIds.length === 0) return null
		if (uniqueCandidateAgentIds.length === 1) return uniqueCandidateAgentIds[0]

		const originalPosition = new Map<string, number>()
		for (let index = 0; index < uniqueCandidateAgentIds.length; index += 1) {
			const agentId = uniqueCandidateAgentIds[index]
			originalPosition.set(agentId, index)
		}

		if (params.distributionMethod === 'least_assigned') {
			const workloads = await prisma.conversations.groupBy({
				by: ['assignee_id'],
				where: {
					app_id: params.appId,
					deleted_at: null,
					status: { not: 'resolved' },
					assignee_id: { in: uniqueCandidateAgentIds },
				},
				_count: { _all: true },
			})

			const workloadByAgentId = new Map<string, number>()
			for (const row of workloads) {
				if (row.assignee_id) {
					workloadByAgentId.set(row.assignee_id, row._count._all)
				}
			}

			const sortedCandidates = [...uniqueCandidateAgentIds].sort((left, right) => {
				const leftLoad = workloadByAgentId.get(left) || 0
				const rightLoad = workloadByAgentId.get(right) || 0
				if (leftLoad !== rightLoad) return leftLoad - rightLoad
				return (originalPosition.get(left) || 0) - (originalPosition.get(right) || 0)
			})
			return sortedCandidates[0] || null
		}

		const availabilities = await prisma.agent_availability.findMany({
			where: {
				app_id: params.appId,
				user_id: { in: uniqueCandidateAgentIds },
			},
			select: {
				user_id: true,
				last_assigned_at: true,
			},
		})

		const lastAssignedByAgentId = new Map<string, Date | null>()
		for (const row of availabilities) {
			lastAssignedByAgentId.set(row.user_id, row.last_assigned_at || null)
		}

		const sortedCandidates = [...uniqueCandidateAgentIds].sort((left, right) => {
			const leftLastAssignedAt = lastAssignedByAgentId.get(left) || null
			const rightLastAssignedAt = lastAssignedByAgentId.get(right) || null

			if (!leftLastAssignedAt && !rightLastAssignedAt) {
				return (originalPosition.get(left) || 0) - (originalPosition.get(right) || 0)
			}
			if (!leftLastAssignedAt) return -1
			if (!rightLastAssignedAt) return 1
			if (leftLastAssignedAt.getTime() !== rightLastAssignedAt.getTime()) {
				return leftLastAssignedAt.getTime() - rightLastAssignedAt.getTime()
			}
			return (originalPosition.get(left) || 0) - (originalPosition.get(right) || 0)
		})

		return sortedCandidates[0] || null
	}

	private static async routeToHumanAgent(
		context: RuntimeContext,
		nodeData: Record<string, unknown>,
	): Promise<void> {
		const nodeAgentIds = extractAgentIdsFromNodeData(nodeData)
		const nodeTeamIds = extractTeamIdsFromNodeData(nodeData)

		const configuredAgentIds =
			nodeAgentIds.length > 0 ? nodeAgentIds : context.defaultAgentIds
		const configuredTeamIds = nodeTeamIds.length > 0 ? nodeTeamIds : context.defaultTeamIds

		const uniqueConfiguredTeamIds = Array.from(
			new Set(configuredTeamIds.filter((teamId) => isUuid(teamId))),
		)
		const uniqueConfiguredAgentIds = Array.from(
			new Set(configuredAgentIds.filter((agentId) => isUuid(agentId))),
		)

		const validTeamRows =
			uniqueConfiguredTeamIds.length > 0
				? await prisma.teams.findMany({
						where: {
							id: { in: uniqueConfiguredTeamIds },
							app_id: context.appId,
						},
						select: { id: true },
					})
				: []
		const validTeamIdSet = new Set(validTeamRows.map((team) => team.id))
		const validTeamIds = uniqueConfiguredTeamIds.filter((teamId) =>
			validTeamIdSet.has(teamId),
		)

		const teamMembers =
			validTeamIds.length > 0
				? await prisma.team_members.findMany({
						where: {
							team_id: { in: validTeamIds },
						},
						select: {
							team_id: true,
							user_id: true,
						},
					})
				: []

		const teamMemberIds = new Set<string>()
		const teamIdsByUserId = new Map<string, string[]>()
		for (const member of teamMembers) {
			teamMemberIds.add(member.user_id)
			const currentTeams = teamIdsByUserId.get(member.user_id) || []
			if (!currentTeams.includes(member.team_id)) {
				currentTeams.push(member.team_id)
				teamIdsByUserId.set(member.user_id, currentTeams)
			}
		}

		let candidateAgentIds = [...uniqueConfiguredAgentIds]
		if (candidateAgentIds.length > 0 && validTeamIds.length > 0) {
			candidateAgentIds = candidateAgentIds.filter((agentId) =>
				teamMemberIds.has(agentId),
			)
		}
		if (candidateAgentIds.length === 0 && validTeamIds.length > 0) {
			candidateAgentIds = Array.from(teamMemberIds)
		}

		if (candidateAgentIds.length > 0) {
			const validAgents = await prisma.users.findMany({
				where: {
					id: { in: candidateAgentIds },
					app_id: context.appId,
					active: true,
					deleted_at: null,
					role: { in: ['agent', 'supervisor'] },
				},
				select: { id: true },
			})
			const validAgentIdSet = new Set(validAgents.map((agent) => agent.id))
			candidateAgentIds = candidateAgentIds.filter((agentId) =>
				validAgentIdSet.has(agentId),
			)
		}

		const selectedAgentId = await this.pickAssigneeByDistribution({
			appId: context.appId,
			candidateAgentIds,
			distributionMethod: context.distributionMethod,
		})

		let selectedTeamId: string | null = null
		if (validTeamIds.length > 0) {
			if (selectedAgentId) {
				const memberTeamIds = teamIdsByUserId.get(selectedAgentId) || []
				selectedTeamId =
					validTeamIds.find((teamId) => memberTeamIds.includes(teamId)) ||
					validTeamIds[0] ||
					null
			} else {
				selectedTeamId = validTeamIds[0] || null
			}
		}

		if (selectedTeamId) {
			await prisma.conversations.update({
				where: { id: context.conversationId },
				data: {
					team_id: selectedTeamId,
					updated_at: new Date(),
				},
			})
		}

		if (!selectedAgentId) return

		await ConversationService.assignAgent(context.conversationId, selectedAgentId)

		if (context.distributionMethod === 'round_robin') {
			await prisma.agent_availability.upsert({
				where: {
					user_id_app_id: {
						user_id: selectedAgentId,
						app_id: context.appId,
					},
				},
				create: {
					user_id: selectedAgentId,
					app_id: context.appId,
					is_available: true,
					last_assigned_at: new Date(),
				},
				update: {
					last_assigned_at: new Date(),
					updated_at: new Date(),
				},
			})
		}
	}

	private static async executeActionNode(
		node: RuntimeFlowNode,
		graph: RuntimeFlowGraph,
		context: RuntimeContext,
	): Promise<ActionExecutionResult> {
		const nodeData = node.data
		const actionType = normalizeRuntimeActionType(
			asString(nodeData.actionType) || asString(nodeData.type) || 'send_message',
		)

		if (actionType === 'label') {
			const labels = toStringArray(nodeData.labels).filter((labelId) => isUuid(labelId))
			if (labels.length === 0) {
				return { paused: false, jumpToNodeId: null }
			}

			const activeLabels = await prisma.labels.findMany({
				where: {
					app_id: context.appId,
					is_visible: true,
					id: { in: labels },
				},
				select: { id: true },
			})
			const activeLabelIds = new Set(activeLabels.map((item) => item.id))

			for (const labelId of labels) {
				if (!activeLabelIds.has(labelId)) {
					console.warn(
						`[FlowRuntimeService] Skipping missing/inactive label assignment. conversation=${context.conversationId} flow=${context.flowId} label=${labelId}`,
					)
					continue
				}
				try {
					await LabelService.addLabelToConversation(context.conversationId, labelId)
				} catch (error) {
					if (isRecoverableLabelAssignmentError(error)) {
						console.warn(
							`[FlowRuntimeService] Recoverable label assignment error skipped. conversation=${context.conversationId} flow=${context.flowId} label=${labelId}`,
							error,
						)
						continue
					}
					throw error
				}
			}
			return { paused: false, jumpToNodeId: null }
		}

		if (actionType === 'collaborator') {
			const collaboratorId =
				asString(nodeData.collaboratorId) || asString(nodeData.collaborator_id)
			if (collaboratorId && isUuid(collaboratorId)) {
				await ConversationService.assignAgent(context.conversationId, collaboratorId)
			}
			return { paused: false, jumpToNodeId: null }
		}

		if (actionType === 'send_message') {
			const description =
				asString(nodeData.description) ||
				asString(nodeData.messageText) ||
				asString(nodeData.text) ||
				''
			const resolvedText = interpolateTemplate(description, context)
			if (resolvedText.trim()) {
				await this.sendBotText(context, resolvedText)
			}

			const images = normalizeImageList(nodeData.images)
			const mediaRecord = asRecord(nodeData.media)
			const mediaUrl = asString(mediaRecord.mediaUrl || mediaRecord.url)
			if (mediaUrl) {
				images.push({
					url: mediaUrl,
					fileName: asString(mediaRecord.mediaCaption || mediaRecord.fileName),
				})
			}

			for (const image of images) {
				await this.sendBotImage(context, image.url, image.fileName)
			}

			return { paused: false, jumpToNodeId: null }
		}

		if (actionType === 'buttons') {
			const messageText = interpolateTemplate(
				asString(nodeData.messageText) || asString(nodeData.text) || 'Please choose one option:',
				context,
			)
			const options = toStringArray(nodeData.buttons).slice(0, 10)
			const isWhatsappInteractive = context.channelType === 'whatsapp' && options.length > 0 && options.length <= 3

			if (isWhatsappInteractive) {
				const media = asRecord(nodeData.media)
				const mediaUrl = asString(media.mediaUrl || media.url)
				const interactivePayload: Record<string, unknown> = {
					type: 'button',
					body: {
						text: messageText || 'Please choose one option:',
					},
					action: {
						buttons: options.slice(0, 3).map((label, index) => ({
							type: 'reply',
							reply: {
								id: `flow_btn_${index + 1}`,
								title: label.slice(0, 20),
							},
						})),
					},
				}
				if (mediaUrl) {
					interactivePayload.header = {
						type: 'image',
						image: { link: mediaUrl },
					}
				}

				await MessageService.sendMessage({
					conversationId: context.conversationId,
					senderType: 'bot',
					content: messageText || 'Please choose one option:',
					contentType: 'interactive',
					contentAttributes: {
						type: 'interactive',
						source: 'flow_runtime',
						flow_id: context.flowId,
						flow_buttons: options,
						interactive: interactivePayload,
					},
				})
			} else {
				const fallbackBody = [
					messageText || 'Please choose one option:',
					'',
					...options.map((option, index) => `${index + 1}. ${option}`),
				]
					.filter((line) => line.trim().length > 0)
					.join('\n')

				await this.sendBotText(context, fallbackBody, {
					flow_buttons: options,
					flow_buttons_mode: 'fallback_text',
				})
			}

			context.state.waiting_button = {
				node_id: node.id,
				options,
			}
			context.state.cursor_node_id = node.id
			context.state.status = 'waiting_button'
			return { paused: true, jumpToNodeId: null }
		}

		if (actionType === 'webhook') {
			const webhookUrl =
				asString(nodeData.description) ||
				asString(nodeData.webhookUrl) ||
				asString(nodeData.url)
			if (webhookUrl) {
				let parsed: URL | null = null
				try {
					parsed = new URL(webhookUrl)
				} catch {
					parsed = null
				}
				if (parsed && (parsed.protocol === 'https:' || parsed.protocol === 'http:')) {
					void dispatchActionWebhook(webhookUrl, {
						source: 'flow_runtime',
						event: 'flow.action.webhook',
						app_id: context.appId,
						inbox_id: context.inboxId,
						conversation_id: context.conversationId,
						flow_id: context.flowId,
						node_id: node.id,
						channel_type: context.channelType,
						contact: context.contact,
						message: {
							id: context.incomingMessage.id || null,
							content: context.incomingText,
							content_type: context.incomingMessage.content_type || 'text',
						},
						variables: context.state.variables,
						timestamp: new Date().toISOString(),
					})
				}
			}
			return { paused: false, jumpToNodeId: null }
		}

		if (actionType === 'jump_to_action') {
			const targetNodeId =
				asString(nodeData.description) ||
				asString(nodeData.targetNodeId) ||
				asString(nodeData.target)
			if (targetNodeId && graph.nodeById.has(targetNodeId)) {
				return { paused: false, jumpToNodeId: targetNodeId }
			}
			return { paused: false, jumpToNodeId: null }
		}

		return { paused: false, jumpToNodeId: null }
	}

	private static async executeAINode(
		node: RuntimeFlowNode,
		context: RuntimeContext,
	): Promise<void> {
		const nodeData = node.data
		const fallbackBehavior = asString(nodeData.fallbackBehavior) || 'block'
		const fallbackMessage = asString(nodeData.fallbackMessage)

		const handleNodeFailure = async (errorMessage: string) => {
			if (fallbackBehavior === 'skip') return
			if (fallbackBehavior === 'fallback_message' && fallbackMessage) {
				await this.sendBotText(context, fallbackMessage)
				return
			}
			throw new Error(errorMessage)
		}

		try {
			if (node.type === 'ai_generate') {
				const responsePrompt = asString(nodeData.responsePrompt) || ''
				const composedMessage = responsePrompt
					? `${responsePrompt}\n\nCustomer message:\n${context.incomingText}`
					: context.incomingText
				const response = await this.executeWithPreferredChatbot(
					context,
					nodeData,
					(chatbotId) =>
						this.generateReplyWithChatbot(
							context,
							chatbotId,
							composedMessage,
							true,
						),
				)
				const outputVariable = asString(nodeData.outputVariable)
				if (outputVariable) {
					context.state.variables[outputVariable] = response.content
				}
				context.state.variables.last_ai_confidence = 0.8
				return
			}

			if (node.type === 'ai_classify') {
				const classificationType =
					asString(nodeData.classificationType) || 'intent'
				const options =
					classificationType === 'category'
						? toStringArray(nodeData.categories)
						: classificationType === 'sentiment'
							? ['positive', 'neutral', 'negative']
							: classificationType === 'priority'
								? ['low', 'medium', 'high']
								: ['general']

				const instruction = [
					`Classify the customer message as ${classificationType}.`,
					`Choose exactly one label from: ${options.join(', ')}.`,
					'Respond with only the label text.',
					'Do not add explanation.',
					`Message: ${context.incomingText}`,
				].join('\n')

				const aiResponse = await this.executeWithPreferredChatbot(
					context,
					nodeData,
					(chatbotId) =>
						ChatbotService.generateAgentReply(chatbotId, context.appId, {
							message: instruction,
							history: [],
							runTools: false,
							mode: 'simulate',
							entrypoint: 'flow_runtime',
							conversationId: context.conversationId,
							sourceMessageIds: context.incomingMessage.id
								? [String(context.incomingMessage.id)]
								: [],
						}),
				)
				const raw = normalizeText(asString(aiResponse.content) || '')
				let selected = options.find((option) =>
					raw.includes(normalizeText(option)),
				)
				if (!selected) {
					selected = options
						.map((option) => ({
							option,
							score: scoreTextOverlap(context.incomingText, option),
						}))
						.sort((left, right) => right.score - left.score)[0]?.option
				}
				if (!selected) selected = options[0] || 'general'

				const outputVariable =
					asString(nodeData.outputVariable) || 'classification_result'
				context.state.variables[outputVariable] = selected
				context.state.variables[`${outputVariable}_raw`] = aiResponse.content
				context.state.variables.last_ai_confidence = 0.7
				return
			}

			if (node.type === 'ai_handoff') {
				const triggerConfig = asRecord(nodeData.handoffTriggers)
				const keywords = toStringArray(nodeData.keywords)
				const messageLower = normalizeText(context.incomingText)
				const lastConfidence =
					typeof context.state.variables.last_ai_confidence === 'number'
						? Number(context.state.variables.last_ai_confidence)
						: 1
				const threshold =
					typeof nodeData.confidenceThreshold === 'number'
						? Number(nodeData.confidenceThreshold)
						: 0.7

				const lowConfidenceTriggered =
					triggerConfig.lowConfidence === true && lastConfidence < threshold
				const keywordTriggered =
					triggerConfig.keywordMatch === true &&
					keywords.some((keyword) => messageLower.includes(normalizeText(keyword)))
				const sentimentTriggered =
					triggerConfig.sentimentNegative === true &&
					NEGATIVE_SENTIMENT_KEYWORDS.some((keyword) => messageLower.includes(keyword))
				const escalationTriggered =
					triggerConfig.escalationRequest === true &&
					ESCALATION_KEYWORDS.some((keyword) => messageLower.includes(keyword))

				const handoffTriggered =
					lowConfidenceTriggered ||
					keywordTriggered ||
					sentimentTriggered ||
					escalationTriggered

				context.state.variables.ai_handoff_triggered = handoffTriggered

				if (handoffTriggered) {
					const handoffMessage = asString(nodeData.handoffMessage)
					if (handoffMessage) {
						await this.sendBotText(context, handoffMessage)
					}
					if (nodeData.assignToSupervisor === true) {
						const supervisor = await prisma.users.findFirst({
							where: {
								app_id: context.appId,
								role: 'supervisor',
								active: true,
								deleted_at: null,
							},
							select: { id: true },
							orderBy: { updated_at: 'desc' },
						})
						if (supervisor?.id && isUuid(supervisor.id)) {
							await ConversationService.assignAgent(
								context.conversationId,
								supervisor.id,
							)
						}
					}
				}
				return
			}
		} catch (error: any) {
			await handleNodeFailure(error?.message || 'Failed to execute AI node')
		}
	}

	private static async executeEndNode(node: RuntimeFlowNode, context: RuntimeContext): Promise<void> {
		const nodeData = node.data
		const endType = normalizeEndType(nodeData)

		if (endType === 'human_agent') {
			await this.routeToHumanAgent(context, nodeData)
			return
		}

		try {
			await this.executeWithPreferredChatbot(context, nodeData, (chatbotId) =>
				this.generateReplyWithChatbot(context, chatbotId, context.incomingText, true),
			)
		} catch {
			// Fail-open: if AI agent cannot be resolved, inbound pipeline stays healthy.
		}
	}

	private static async runFlow(
		graph: RuntimeFlowGraph,
		context: RuntimeContext,
	): Promise<{
		matched: boolean
		skipChatbot: boolean
		reason: FlowRuntimeExecuteInboundResult['reason']
	}> {
		let currentNodeId =
			context.state.waiting_button?.node_id || context.state.cursor_node_id || graph.startNodeId
		let step = 0
		let matched = Boolean(context.state.waiting_button)
		let reason: FlowRuntimeExecuteInboundResult['reason'] = 'executed'
		let resumeFromWaitingButton = Boolean(context.state.waiting_button)

		while (currentNodeId && step < FLOW_MAX_STEPS) {
			step += 1
			const node = graph.nodeById.get(currentNodeId)
			if (!node) break

			context.state.cursor_node_id = node.id
			context.state.status = 'running'
			context.state.last_executed_at = new Date().toISOString()

			if (node.type === 'start') {
				const branch = resolveNextBranch(graph, node.id, context)
				if (!branch.nextNodeId) {
					if (branch.hasConditionChildren && !branch.matchedCondition) {
						reason = 'no_condition_match'
						context.state.status = 'idle'
						return { matched: false, skipChatbot: false, reason }
					}
					context.state.status = 'idle'
					reason = 'completed'
					return { matched, skipChatbot: matched, reason }
				}
				if (branch.hasConditionChildren) matched = branch.matchedCondition
				currentNodeId = branch.nextNodeId
				continue
			}

			if (node.type === 'condition') {
				matched = true
				const branch = resolveNextBranch(graph, node.id, context)
				if (!branch.nextNodeId) {
					context.state.status = 'completed'
					context.state.waiting_button = null
					context.state.cursor_node_id = null
					reason = 'completed'
					return { matched: true, skipChatbot: true, reason }
				}
				currentNodeId = branch.nextNodeId
				continue
			}

			if (node.type === 'action') {
				matched = true

				// Resuming a button wait should continue into child conditions
				// without re-sending the same buttons payload.
				const actionType = normalizeRuntimeActionType(
					asString(node.data.actionType) || asString(node.data.type),
				)
				if (!(resumeFromWaitingButton && actionType === 'buttons')) {
					const actionResult = await this.executeActionNode(node, graph, context)
					if (actionResult.paused) {
						reason = 'waiting_for_button'
						return { matched: true, skipChatbot: true, reason }
					}
					if (actionResult.jumpToNodeId) {
						currentNodeId = actionResult.jumpToNodeId
						resumeFromWaitingButton = false
						continue
					}
				}

				resumeFromWaitingButton = false
				context.state.waiting_button = null
				const branch = resolveNextBranch(graph, node.id, context)
				if (!branch.nextNodeId) {
					if (branch.hasConditionChildren && !branch.matchedCondition) {
						// If this is a resumed buttons step and no condition matched, keep waiting.
						if (actionType === 'buttons') {
							context.state.waiting_button = {
								node_id: node.id,
								options: toStringArray(node.data.buttons).slice(0, 10),
							}
							context.state.status = 'waiting_button'
							reason = 'waiting_for_button'
							return { matched: true, skipChatbot: true, reason }
						}
						context.state.status = 'idle'
						reason = 'no_condition_match'
						return { matched: false, skipChatbot: false, reason }
					}
					context.state.status = 'completed'
					context.state.cursor_node_id = null
					reason = 'completed'
					return { matched: true, skipChatbot: true, reason }
				}
				currentNodeId = branch.nextNodeId
				continue
			}

			if (node.type === 'ai_generate' || node.type === 'ai_classify' || node.type === 'ai_handoff') {
				matched = true
				await this.executeAINode(node, context)
				const branch = resolveNextBranch(graph, node.id, context)
				if (!branch.nextNodeId) {
					context.state.status = 'completed'
					context.state.cursor_node_id = null
					reason = 'completed'
					return { matched: true, skipChatbot: true, reason }
				}
				currentNodeId = branch.nextNodeId
				continue
			}

			if (node.type === 'end') {
				matched = true
				await this.executeEndNode(node, context)
				context.state.status = 'completed'
				context.state.waiting_button = null
				context.state.cursor_node_id = null
				reason = 'completed'
				return { matched: true, skipChatbot: true, reason }
			}

			break
		}

		context.state.status = matched ? 'completed' : 'idle'
		context.state.waiting_button = null
		context.state.cursor_node_id = null
		return {
			matched,
			skipChatbot: matched,
			reason: matched ? 'completed' : 'no_condition_match',
		}
	}

	static async executeInbound(
		params: FlowRuntimeExecuteInboundParams,
	): Promise<FlowRuntimeExecuteInboundResult> {
		try {
				const [inbox, whatsappChannel] = await Promise.all([
				prisma.inboxes.findFirst({
					where: {
						id: params.inboxId,
						app_id: params.appId,
						deleted_at: null,
					},
					select: {
						chatbot_id: true,
						channel_config: true,
					},
				}),
				params.channelType === 'whatsapp'
					? prisma.whatsapp_channels.findFirst({
							where: {
								inbox_id: params.inboxId,
								app_id: params.appId,
								deleted_at: null,
							},
							select: {
								extended_metadata: true,
							},
						})
						: Promise.resolve(null),
				])
				const inboxChannelConfig = asRecord(inbox?.channel_config)
				const whatsappChannelMetadata = asRecord(whatsappChannel?.extended_metadata)
				const inboxHasTeamConfig =
					Object.prototype.hasOwnProperty.call(
						inboxChannelConfig,
						'default_team_ids',
					) ||
					Object.prototype.hasOwnProperty.call(inboxChannelConfig, 'defaultTeamIds')
				const inboxHasAgentConfig =
					Object.prototype.hasOwnProperty.call(
						inboxChannelConfig,
						'default_agent_ids',
					) ||
					Object.prototype.hasOwnProperty.call(inboxChannelConfig, 'defaultAgentIds')
				const inboxHasDistributionConfig =
					Object.prototype.hasOwnProperty.call(
						inboxChannelConfig,
						'distribution_method',
					) ||
					Object.prototype.hasOwnProperty.call(
						inboxChannelConfig,
						'distributionMethod',
					)

				const configuredFlowId =
					extractConfiguredFlowId(inboxChannelConfig) ||
					extractConfiguredFlowId(whatsappChannelMetadata)
				const configuredChatbotId =
					asUuidOrNull(inbox?.chatbot_id) ||
					extractConfiguredChatbotId(inboxChannelConfig) ||
					extractConfiguredChatbotId(whatsappChannelMetadata)
				const configuredTeamIds = inboxHasTeamConfig
					? extractConfiguredTeamIds(inboxChannelConfig)
					: extractConfiguredTeamIds(whatsappChannelMetadata)
				const configuredAgentIds = inboxHasAgentConfig
					? extractConfiguredAgentIds(inboxChannelConfig)
					: extractConfiguredAgentIds(whatsappChannelMetadata)
				const configuredDistributionMethod = inboxHasDistributionConfig
					? extractConfiguredDistributionMethod(inboxChannelConfig) || 'round_robin'
					: extractConfiguredDistributionMethod(whatsappChannelMetadata) ||
						'round_robin'
				const resolvedInboxChatbotId = configuredChatbotId || null

			const inboxConfiguredFlow = configuredFlowId
				? await prisma.automation_flows.findFirst({
						where: {
							id: configuredFlowId,
							app_id: params.appId,
							active: true,
						},
						select: {
							id: true,
							nodes: true,
							edges: true,
						},
					})
				: null

			const activeFlow = inboxConfiguredFlow

			if (!activeFlow) {
				return {
					matched: false,
					skipChatbot: false,
					flowId: null,
					reason: 'no_active_flow',
				}
			}

			const graph = normalizeFlowGraph(activeFlow.nodes, activeFlow.edges)
			if (!graph.startNodeId) {
				return {
					matched: false,
					skipChatbot: false,
					flowId: activeFlow.id,
					reason: 'no_start_node',
				}
			}

			const conversation = await prisma.conversations.findUnique({
				where: { id: params.conversationId },
				select: {
					id: true,
					additional_attributes: true,
				},
			})
			if (!conversation?.id) {
				return {
					matched: false,
					skipChatbot: false,
					flowId: activeFlow.id,
					reason: 'error',
				}
			}

			const additionalAttributes = asRecord(conversation.additional_attributes)
			const persistedRuntimeState = asRecord(additionalAttributes[FLOW_RUNTIME_STATE_KEY])
			const persistedFlowId = asString(persistedRuntimeState.flow_id)
			const runtimeState: FlowRuntimeState =
				persistedFlowId && persistedFlowId === activeFlow.id
					? {
							flow_id: activeFlow.id,
							cursor_node_id: asString(persistedRuntimeState.cursor_node_id),
							waiting_button:
								asRecord(persistedRuntimeState.waiting_button).node_id &&
								Array.isArray(asRecord(persistedRuntimeState.waiting_button).options)
									? {
											node_id:
												asString(asRecord(persistedRuntimeState.waiting_button).node_id) || '',
											options: toStringArray(
												asRecord(persistedRuntimeState.waiting_button).options,
											),
										}
									: null,
							variables: asRecord(persistedRuntimeState.variables),
							last_error: asString(persistedRuntimeState.last_error),
							last_executed_at:
								asString(persistedRuntimeState.last_executed_at) ||
								new Date().toISOString(),
							status:
								(asString(persistedRuntimeState.status) as FlowRuntimeState['status']) ||
								'idle',
						}
					: {
							flow_id: activeFlow.id,
							cursor_node_id: graph.startNodeId,
							waiting_button: null,
							variables: {},
							last_error: null,
							last_executed_at: new Date().toISOString(),
							status: 'idle',
						}

			const incomingText = String(params.incomingMessage.content || '').trim()
			const incomingAt =
				params.incomingMessage.created_at instanceof Date
					? params.incomingMessage.created_at
					: params.incomingMessage.created_at
						? new Date(params.incomingMessage.created_at)
						: new Date()
			const isFirstContactMessage =
				(await prisma.messages.count({
					where: {
						conversation_id: params.conversationId,
						sender_type: 'contact',
						deleted_at: null,
						OR: [{ is_deleted: false }, { is_deleted: null }],
					},
				})) === 1

			const historyRows = await prisma.messages.findMany({
				where: {
					conversation_id: params.conversationId,
					deleted_at: null,
					OR: [{ is_deleted: false }, { is_deleted: null }],
					sender_type: { in: ['contact', 'bot'] },
				},
				orderBy: { created_at: 'desc' },
				take: 20,
				select: {
					sender_type: true,
					content: true,
				},
			})

			const history: RuntimeHistoryItem[] = historyRows
				.reverse()
				.map((row) => {
					const role = toHistoryMessageRole(row.sender_type || null)
					const content = asString(row.content)
					if (!role || !content) return null
					return {
						role,
						content,
					}
				})
				.filter((item): item is RuntimeHistoryItem => Boolean(item))

			const context: RuntimeContext = {
				appId: params.appId,
				inboxId: params.inboxId,
				conversationId: params.conversationId,
				flowId: activeFlow.id,
				channelType: params.channelType,
				channelName: params.channelName,
				channelBadgeUrl: params.channelBadgeUrl,
				contact: params.contact,
				incomingMessage: params.incomingMessage,
				incomingText,
				incomingAt,
				isFirstContactMessage,
				defaultChatbotId: resolvedInboxChatbotId,
				defaultTeamIds: configuredTeamIds,
				defaultAgentIds: configuredAgentIds,
				distributionMethod: configuredDistributionMethod,
				history,
				state: runtimeState,
			}

			const outcome = await this.runFlow(graph, context)

			// Reload latest additional_attributes so concurrent writers
			// (for example chatbot follow-up scheduler) are preserved.
			const latestConversationAttributes = await prisma.conversations.findUnique({
				where: { id: params.conversationId },
				select: { additional_attributes: true },
			})
			const nextAdditionalAttributes = buildFlowRuntimeAdditionalAttributes({
				baseAttributes: asRecord(latestConversationAttributes?.additional_attributes),
				state: context.state,
			})
			await prisma.conversations.update({
				where: { id: params.conversationId },
				data: {
					additional_attributes: nextAdditionalAttributes as any,
					updated_at: new Date(),
				},
			})

			return {
				matched: outcome.matched,
				skipChatbot: outcome.skipChatbot,
				flowId: activeFlow.id,
				reason: outcome.reason,
			}
		} catch (error: any) {
			const reason = error?.message || 'Flow runtime execution failed'
			try {
				const conversation = await prisma.conversations.findUnique({
					where: { id: params.conversationId },
					select: { additional_attributes: true },
				})
				if (conversation) {
					const additionalAttributes = asRecord(conversation.additional_attributes)
					const runtimeState = asRecord(additionalAttributes[FLOW_RUNTIME_STATE_KEY])
					const nextAdditionalAttributes = {
						...additionalAttributes,
						[FLOW_RUNTIME_STATE_KEY]: {
							...runtimeState,
							last_error: String(reason).slice(0, 500),
							last_executed_at: new Date().toISOString(),
							status: 'error',
						},
					}
					await prisma.conversations.update({
						where: { id: params.conversationId },
						data: {
							additional_attributes: nextAdditionalAttributes as any,
							updated_at: new Date(),
						},
					})
				}
			} catch {
				// fail-open
			}

			return {
				matched: false,
				skipChatbot: false,
				flowId: null,
				reason: 'error',
			}
		}
	}
}

export const __test__ = {
	normalizeFlowGraph,
	evaluateConditionNode,
	parseTimeRangeMinutes,
	resolveNextBranch,
	interpolateTemplate,
	extractConfiguredChatbotId,
	extractConfiguredFlowId,
	resolvePreferredChatbotCandidates,
	buildFlowRuntimeAdditionalAttributes,
	isRecoverableLabelAssignmentError,
}
