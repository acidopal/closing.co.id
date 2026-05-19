import prisma from '../../lib/prisma'
import redis from '../../lib/redis'
import { isUuid, resolveAppId } from '../../lib/utils'
import { BillingService } from '../billing/service'
import { BusinessWebhookDispatchService } from '../business-webhooks/dispatch-service'

type ReservationResult = {
	reservationId: string
	organizationId: string
	cost: number
	modelName: string
}

type TransactionMetadata = Record<string, unknown>
export type AIProvider = 'azure' | 'sumopod'

type ProviderConfigInput = {
	base_url: string
	api_key?: string
	model_name?: string
	api_version?: string
	deployment_name?: string
	temperature?: number
	max_tokens?: number
}

type ProviderConfigRecord = ProviderConfigInput & {
	provider: AIProvider
}

type ProviderConfigurationsPayload = {
	active_provider: AIProvider | null
	providers: Record<AIProvider, ProviderConfigRecord | null>
}

type SummaryRuntimeConfig = {
	provider: AIProvider | null
	baseUrl: string | null
	apiKey: string | null
	modelName: string
	apiVersion: string
	deploymentName: string | null
	temperature: number
	maxTokens: number
	embeddingModel: string
}

type ConversationMessageForSummary = {
	id: string
	createdAt: Date
	role: 'customer' | 'agent'
	text: string
}

type SummaryGenerationResult = {
	suggestion: string
	confidence: number
	retrieval: {
		totalMessages: number
		indexedMessages: number
		selectedMessages: number
		semanticMatches: number
	}
}

const SUPPORTED_AI_PROVIDERS: AIProvider[] = ['azure', 'sumopod']
const ACTIVE_PROVIDER_KEY = 'ai.provider.active'
const PROVIDER_CONFIG_CACHE_KEY = 'ai:provider-configurations:v1'
const DEFAULT_CHAT_MODEL = 'gpt-4o-mini'
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small'
const SUMMARY_MAX_MESSAGES = 160
const SUMMARY_MAX_EMBED_MESSAGES = 80
const SUMMARY_RECENT_WINDOW = 12
const SUMMARY_SEMANTIC_TOP_K = 24
const SUMMARY_MAX_MESSAGE_TEXT_LENGTH = 700
const AI_REQUEST_TIMEOUT_MS = Math.max(
	4_000,
	Number(process.env.AI_REQUEST_TIMEOUT_MS || 25_000),
)
const parsedProviderCacheTtlSeconds = Number.parseInt(
	process.env.AI_PROVIDER_CACHE_TTL_SECONDS || '60',
	10,
)
const PROVIDER_CONFIG_CACHE_TTL_SECONDS = Number.isFinite(
	parsedProviderCacheTtlSeconds,
)
	? Math.max(10, parsedProviderCacheTtlSeconds)
	: 60
const providerConfigKey = (provider: AIProvider) =>
	`ai.provider.config.${provider}`

function joinUrl(baseUrl: string, path: string): string {
	return `${baseUrl.replace(/\/+$/g, '')}/${path.replace(/^\/+/, '')}`
}

function toRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null
	return value as Record<string, unknown>
}

function toTrimmedString(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const normalized = value.trim()
	return normalized.length > 0 ? normalized : null
}

function normalizeWhitespace(value: string): string {
	return value.replace(/\s+/g, ' ').trim()
}

function truncateText(value: string, maxLength: number): string {
	if (value.length <= maxLength) return value
	return `${value.slice(0, maxLength - 1)}…`
}

function cosineSimilarity(a: number[], b: number[]): number {
	const length = Math.min(a.length, b.length)
	if (length === 0) return 0

	let dot = 0
	let aNorm = 0
	let bNorm = 0
	for (let i = 0; i < length; i++) {
		const ai = Number(a[i] || 0)
		const bi = Number(b[i] || 0)
		dot += ai * bi
		aNorm += ai * ai
		bNorm += bi * bi
	}

	if (aNorm === 0 || bNorm === 0) return 0
	return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm))
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}

function extractEmbeddingVectors(payload: unknown): number[][] {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return []
	const data = Array.isArray((payload as Record<string, unknown>).data)
		? ((payload as Record<string, unknown>).data as unknown[])
		: []
	if (data.length === 0) return []

	const vectors: number[][] = []
	for (const row of data) {
		const record = toRecord(row)
		if (!record) continue
		const embeddingRaw = Array.isArray(record.embedding) ? record.embedding : []
		const embedding = embeddingRaw
			.map((value) => Number(value))
			.filter((value) => Number.isFinite(value))
		if (embedding.length > 0) vectors.push(embedding)
	}

	return vectors
}

function extractCompletionContent(payload: unknown): string | null {
	if (typeof payload === 'string') {
		const normalized = payload.trim()
		return normalized.length > 0 ? normalized : null
	}

	const record = toRecord(payload)
	if (!record) return null

	const choices = Array.isArray(record.choices) ? (record.choices as unknown[]) : []
	if (choices.length > 0) {
		const firstChoice = toRecord(choices[0])
		const message = toRecord(firstChoice?.message)
		const direct = toTrimmedString(message?.content)
		if (direct) return direct

		if (Array.isArray(message?.content)) {
			const chunks = (message.content as unknown[])
				.map((item) => toTrimmedString(toRecord(item)?.text) || '')
				.filter(Boolean)
			if (chunks.length > 0) {
				return normalizeWhitespace(chunks.join('\n'))
			}
		}
	}

	return toTrimmedString(record.output_text)
}

export abstract class AIService {
	private static toMetadataObject(value: unknown): TransactionMetadata {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			return {}
		}

		return value as TransactionMetadata
	}

	private static async getOrganizationIdFromApp(targetAppId: string) {
		const organization = await prisma.organization.findUnique({
			where: { appId: targetAppId },
			select: { id: true },
		})

		if (!organization?.id) {
			throw new Error('Organization not found')
		}

		return organization.id
	}

	private static toOptionalFiniteNumber(value: unknown): number | undefined {
		if (value === null || value === undefined) return undefined
		if (typeof value === 'number') {
			return Number.isFinite(value) ? value : undefined
		}
		if (typeof value === 'string') {
			const parsed = Number(value.trim())
			return Number.isFinite(parsed) ? parsed : undefined
		}
		return undefined
	}

	private static toOptionalBoolean(value: unknown): boolean | undefined {
		if (value === null || value === undefined) return undefined
		if (typeof value === 'boolean') return value
		if (typeof value === 'string') {
			const normalized = value.trim().toLowerCase()
			if (normalized === 'true' || normalized === '1') return true
			if (normalized === 'false' || normalized === '0') return false
		}
		return undefined
	}

	private static toOptionalStringArray(value: unknown): string[] | undefined {
		if (!Array.isArray(value)) return undefined
		return value
			.map((item) => String(item || '').trim())
			.filter((item) => item.length > 0)
	}

	private static toOptionalTrimmedString(value: unknown): string | undefined {
		if (typeof value !== 'string') return undefined
		const normalized = value.trim()
		return normalized.length > 0 ? normalized : undefined
	}

	private static normalizeSettingsUpdatePayload(data: Record<string, any>) {
		const nextData: Record<string, any> = {}

		const aiMode = AIService.toOptionalTrimmedString(data.ai_mode)
		if (aiMode !== undefined) nextData.ai_mode = aiMode

		const modelProvider = AIService.toOptionalTrimmedString(data.model_provider)
		if (modelProvider !== undefined) nextData.model_provider = modelProvider

		const modelName = AIService.toOptionalTrimmedString(data.model_name)
		if (modelName !== undefined) nextData.model_name = modelName

		const responseTone = AIService.toOptionalTrimmedString(data.response_tone)
		if (responseTone !== undefined) nextData.response_tone = responseTone

		const apiKey = AIService.toOptionalTrimmedString(data.api_key)
		if (apiKey !== undefined) nextData.api_key = apiKey

		const apiEndpoint = AIService.toOptionalTrimmedString(data.api_endpoint)
		if (apiEndpoint !== undefined) nextData.api_endpoint = apiEndpoint

		const apiVersion = AIService.toOptionalTrimmedString(data.api_version)
		if (apiVersion !== undefined) nextData.api_version = apiVersion

		const deploymentName = AIService.toOptionalTrimmedString(
			data.deployment_name,
		)
		if (deploymentName !== undefined) nextData.deployment_name = deploymentName

		const temperature = AIService.toOptionalFiniteNumber(data.temperature)
		if (temperature !== undefined) nextData.temperature = temperature

		const maxTokens = AIService.toOptionalFiniteNumber(data.max_tokens)
		if (maxTokens !== undefined) nextData.max_tokens = Math.trunc(maxTokens)

		const autoReplyConfidence = AIService.toOptionalFiniteNumber(
			data.auto_reply_confidence,
		)
		if (autoReplyConfidence !== undefined) {
			nextData.auto_reply_confidence = autoReplyConfidence
		}

		const maxRepliesPerConversation = AIService.toOptionalFiniteNumber(
			data.max_ai_replies_per_conversation,
		)
		if (maxRepliesPerConversation !== undefined) {
			nextData.max_ai_replies_per_conversation = Math.trunc(
				maxRepliesPerConversation,
			)
		}

		const cooldownAfterLimit = AIService.toOptionalFiniteNumber(
			data.cooldown_after_limit_minutes,
		)
		if (cooldownAfterLimit !== undefined) {
			nextData.cooldown_after_limit_minutes = Math.trunc(cooldownAfterLimit)
		}

		const autoDetectLanguage = AIService.toOptionalBoolean(
			data.auto_detect_language,
		)
		if (autoDetectLanguage !== undefined) {
			nextData.auto_detect_language = autoDetectLanguage
		}

		const usePlatformCredentials = AIService.toOptionalBoolean(
			data.use_platform_credentials,
		)
		if (usePlatformCredentials !== undefined) {
			nextData.use_platform_credentials = usePlatformCredentials
		}

		const handoffKeywords = AIService.toOptionalStringArray(data.handoff_keywords)
		if (handoffKeywords !== undefined) {
			nextData.handoff_keywords = handoffKeywords
		}

		const supportedLanguages = AIService.toOptionalStringArray(
			data.supported_languages,
		)
		if (supportedLanguages !== undefined) {
			nextData.supported_languages = supportedLanguages
		}

		return nextData
	}

	private static parseProviderConfig(
		provider: AIProvider,
		rawValue: string,
	): ProviderConfigRecord | null {
		try {
			const parsed = JSON.parse(rawValue) as Record<string, unknown>
			const baseUrl = String(parsed.base_url || '').trim()
			if (!baseUrl) return null

			const record: ProviderConfigRecord = {
				provider,
				base_url: baseUrl,
			}

			if (typeof parsed.api_key === 'string' && parsed.api_key.trim()) {
				record.api_key = parsed.api_key.trim()
			}
			if (typeof parsed.model_name === 'string' && parsed.model_name.trim()) {
				record.model_name = parsed.model_name.trim()
			}
			if (typeof parsed.api_version === 'string' && parsed.api_version.trim()) {
				record.api_version = parsed.api_version.trim()
			}
			if (
				typeof parsed.deployment_name === 'string' &&
				parsed.deployment_name.trim()
			) {
				record.deployment_name = parsed.deployment_name.trim()
			}

			const parsedTemperature = AIService.toOptionalFiniteNumber(
				parsed.temperature,
			)
			if (parsedTemperature !== undefined) record.temperature = parsedTemperature

			const parsedMaxTokens = AIService.toOptionalFiniteNumber(parsed.max_tokens)
			if (parsedMaxTokens !== undefined) {
				record.max_tokens = Math.trunc(parsedMaxTokens)
			}

			return record
		} catch {
			return null
		}
	}

	private static sanitizeProviderInput(
		provider: AIProvider,
		data: ProviderConfigInput,
	): ProviderConfigRecord {
		const baseUrl = String(data.base_url || '').trim()
		if (!baseUrl) {
			throw new Error('base_url is required')
		}

		const sanitized: ProviderConfigRecord = {
			provider,
			base_url: baseUrl,
		}

		if (typeof data.api_key === 'string' && data.api_key.trim()) {
			sanitized.api_key = data.api_key.trim()
		}
		if (typeof data.model_name === 'string' && data.model_name.trim()) {
			sanitized.model_name = data.model_name.trim()
		}
		if (typeof data.api_version === 'string' && data.api_version.trim()) {
			sanitized.api_version = data.api_version.trim()
		}
		if (
			typeof data.deployment_name === 'string' &&
			data.deployment_name.trim()
		) {
			sanitized.deployment_name = data.deployment_name.trim()
		}

		const parsedTemperature = AIService.toOptionalFiniteNumber(data.temperature)
		if (parsedTemperature !== undefined) sanitized.temperature = parsedTemperature

		const parsedMaxTokens = AIService.toOptionalFiniteNumber(data.max_tokens)
		if (parsedMaxTokens !== undefined) {
			sanitized.max_tokens = Math.trunc(parsedMaxTokens)
		}

		return sanitized
	}

	private static ensureSupportedProvider(provider: string): AIProvider {
		const normalized = provider.trim().toLowerCase() as AIProvider
		if (!SUPPORTED_AI_PROVIDERS.includes(normalized)) {
			throw new Error(
				`Unsupported provider "${provider}". Supported providers: ${SUPPORTED_AI_PROVIDERS.join(', ')}`,
			)
		}
		return normalized
	}

	private static normalizeProviderConfigRecord(
		provider: AIProvider,
		rawValue: unknown,
	): ProviderConfigRecord | null {
		if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
			return null
		}

		try {
			return AIService.sanitizeProviderInput(
				provider,
				rawValue as ProviderConfigInput,
			)
		} catch {
			return null
		}
	}

	private static normalizeProviderConfigurationsPayload(
		rawValue: unknown,
	): ProviderConfigurationsPayload | null {
		if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
			return null
		}

		const parsed = rawValue as Record<string, unknown>
		const providersRaw =
			parsed.providers && typeof parsed.providers === 'object'
				? (parsed.providers as Record<string, unknown>)
				: null
		if (!providersRaw) return null

		const providers = SUPPORTED_AI_PROVIDERS.reduce(
			(acc, provider) => {
				acc[provider] = AIService.normalizeProviderConfigRecord(
					provider,
					providersRaw[provider],
				)
				return acc
			},
			{} as Record<AIProvider, ProviderConfigRecord | null>,
		)

		const activeCandidate =
			typeof parsed.active_provider === 'string'
				? parsed.active_provider.toLowerCase()
				: ''
		const active_provider =
			SUPPORTED_AI_PROVIDERS.includes(activeCandidate as AIProvider) &&
			providers[activeCandidate as AIProvider]
				? (activeCandidate as AIProvider)
				: null

		return { active_provider, providers }
	}

	private static async readProviderConfigurationsCache() {
		try {
			const raw = await redis.get(PROVIDER_CONFIG_CACHE_KEY)
			if (!raw) return null
			return AIService.normalizeProviderConfigurationsPayload(JSON.parse(raw))
		} catch (error) {
			console.warn(
				'[AIService] Failed to read provider configurations from Redis cache',
				error,
			)
			return null
		}
	}

	private static async writeProviderConfigurationsCache(
		payload: ProviderConfigurationsPayload,
	) {
		try {
			await redis.set(
				PROVIDER_CONFIG_CACHE_KEY,
				JSON.stringify(payload),
				'EX',
				PROVIDER_CONFIG_CACHE_TTL_SECONDS,
			)
		} catch (error) {
			console.warn(
				'[AIService] Failed to write provider configurations to Redis cache',
				error,
			)
		}
	}

	private static async invalidateProviderConfigurationsCache() {
		try {
			await redis.del(PROVIDER_CONFIG_CACHE_KEY)
		} catch (error) {
			console.warn(
				'[AIService] Failed to invalidate provider configurations cache',
				error,
			)
		}
	}

	private static async getProviderConfigurationsFromDb(): Promise<ProviderConfigurationsPayload> {
		const providerKeys = SUPPORTED_AI_PROVIDERS.map((provider) =>
			providerConfigKey(provider),
		)

		const rows = await prisma.platform_settings.findMany({
			where: {
				key: {
					in: [ACTIVE_PROVIDER_KEY, ...providerKeys],
				},
			},
			select: { key: true, value: true },
		})

		const rowMap = new Map(rows.map((row) => [row.key, row.value]))
		const activeRaw = rowMap.get(ACTIVE_PROVIDER_KEY)
		const active_provider =
			activeRaw && SUPPORTED_AI_PROVIDERS.includes(activeRaw as AIProvider)
				? (activeRaw as AIProvider)
				: null

		const providers = SUPPORTED_AI_PROVIDERS.reduce(
			(acc, provider) => {
				const raw = rowMap.get(providerConfigKey(provider))
				acc[provider] =
					typeof raw === 'string'
						? AIService.parseProviderConfig(provider, raw)
						: null
				return acc
			},
			{} as Record<AIProvider, ProviderConfigRecord | null>,
		)

		return { active_provider, providers }
	}

	static async getProviderConfigurations() {
		const cached = await AIService.readProviderConfigurationsCache()
		if (cached) return cached

		const fromDb = await AIService.getProviderConfigurationsFromDb()
		await AIService.writeProviderConfigurationsCache(fromDb)
		return fromDb
	}

	static async upsertProviderConfiguration(providerInput: string, data: any) {
		const provider = AIService.ensureSupportedProvider(providerInput)
		const sanitized = AIService.sanitizeProviderInput(provider, data)

		await prisma.platform_settings.upsert({
			where: { key: providerConfigKey(provider) },
			update: {
				value: JSON.stringify(sanitized),
				updated_at: new Date(),
			},
			create: {
				key: providerConfigKey(provider),
				value: JSON.stringify(sanitized),
			},
		})

		await AIService.invalidateProviderConfigurationsCache()

		return sanitized
	}

	static async setActiveProvider(providerInput: string) {
		const provider = AIService.ensureSupportedProvider(providerInput)

		await prisma.platform_settings.upsert({
			where: { key: ACTIVE_PROVIDER_KEY },
			update: {
				value: provider,
				updated_at: new Date(),
			},
			create: {
				key: ACTIVE_PROVIDER_KEY,
				value: provider,
			},
		})

		await AIService.invalidateProviderConfigurationsCache()

		return provider
	}

	static async getRuntimeProviderConfig() {
		const config = await AIService.getProviderConfigurations()
		const activeProvider = config.active_provider
		if (!activeProvider) return null
		return config.providers[activeProvider]
	}

	private static toSummaryRuntimeConfig(args: {
		settings: any
		runtimeProvider: ProviderConfigRecord | null
	}): SummaryRuntimeConfig {
		const settingsProvider = AIService.toOptionalTrimmedString(
			args.settings?.model_provider,
		)
		const provider =
			(args.runtimeProvider?.provider as AIProvider | undefined) ||
			(settingsProvider &&
			SUPPORTED_AI_PROVIDERS.includes(settingsProvider as AIProvider)
				? (settingsProvider as AIProvider)
				: null)

		const baseUrl =
			AIService.toOptionalTrimmedString(args.runtimeProvider?.base_url) ||
			AIService.toOptionalTrimmedString(args.settings?.api_endpoint) ||
			null
		const apiKey =
			AIService.toOptionalTrimmedString(args.runtimeProvider?.api_key) ||
			AIService.toOptionalTrimmedString(args.settings?.api_key) ||
			null
		const modelName =
			AIService.toOptionalTrimmedString(args.runtimeProvider?.model_name) ||
			AIService.toOptionalTrimmedString(args.settings?.model_name) ||
			DEFAULT_CHAT_MODEL
		const apiVersion =
			AIService.toOptionalTrimmedString(args.runtimeProvider?.api_version) ||
			AIService.toOptionalTrimmedString(args.settings?.api_version) ||
			'2024-02-15-preview'
		const deploymentName =
			AIService.toOptionalTrimmedString(args.runtimeProvider?.deployment_name) ||
			AIService.toOptionalTrimmedString(args.settings?.deployment_name) ||
			modelName

		const temperature = clamp(
			AIService.toOptionalFiniteNumber(args.runtimeProvider?.temperature) ??
				AIService.toOptionalFiniteNumber(args.settings?.temperature) ??
				0.2,
			0,
			1,
		)
		const maxTokens = Math.max(
			120,
			Math.min(
				700,
				Math.trunc(
					AIService.toOptionalFiniteNumber(args.runtimeProvider?.max_tokens) ??
						AIService.toOptionalFiniteNumber(args.settings?.max_tokens) ??
						280,
				),
			),
		)

		return {
			provider,
			baseUrl,
			apiKey,
			modelName,
			apiVersion,
			deploymentName,
			temperature,
			maxTokens,
			embeddingModel:
				AIService.toOptionalTrimmedString(process.env.AI_EMBEDDING_MODEL) ||
				DEFAULT_EMBEDDING_MODEL,
		}
	}

	private static isAzureRuntime(runtime: SummaryRuntimeConfig): boolean {
		return (
			(runtime.provider || '').toLowerCase() === 'azure' ||
			Boolean(runtime.baseUrl?.includes('.openai.azure.com'))
		)
	}

	private static normalizeConversationMessageForSummary(row: {
		id: string
		message_type: string
		content: string | null
		content_type: string | null
		content_attributes: unknown
		sender_type: string | null
		private: boolean | null
		created_at: Date | null
	}): ConversationMessageForSummary | null {
		if (row.private === true) return null

		const messageType = String(row.message_type || '').toLowerCase()
		const senderType = String(row.sender_type || '').toLowerCase()
		const contentType = String(row.content_type || 'text').toLowerCase()
		if (senderType === 'system' || messageType === 'system') return null

		const role: ConversationMessageForSummary['role'] =
			senderType === 'contact' || messageType === 'incoming'
				? 'customer'
				: 'agent'

		const attributes = toRecord(row.content_attributes)
		const textCandidates = [
			toTrimmedString(row.content),
			toTrimmedString(attributes?.text),
			toTrimmedString(attributes?.body),
			toTrimmedString(attributes?.caption),
			toTrimmedString(attributes?.description),
			toTrimmedString(attributes?.preview),
			toTrimmedString(attributes?.title),
		].filter(Boolean) as string[]

		let normalizedText = textCandidates[0] || ''
		if (!normalizedText) {
			if (contentType === 'image') normalizedText = '[Image]'
			else if (contentType === 'video') normalizedText = '[Video]'
			else if (contentType === 'audio') normalizedText = '[Audio]'
			else if (contentType === 'document') normalizedText = '[Document]'
			else if (contentType === 'template') normalizedText = '[Template message]'
			else normalizedText = '[Message]'
		}

		normalizedText = truncateText(
			normalizeWhitespace(normalizedText),
			SUMMARY_MAX_MESSAGE_TEXT_LENGTH,
		)
		if (!normalizedText) return null

		return {
			id: row.id,
			createdAt: row.created_at || new Date(),
			role,
			text: normalizedText,
		}
	}

	private static async loadConversationMessagesForSummary(args: {
		appId: string
		conversationId: string
	}) {
		const conversation = await prisma.conversations.findFirst({
			where: {
				id: args.conversationId,
				app_id: args.appId,
			},
			select: {
				id: true,
				inbox_id: true,
			},
		})

		if (!conversation) {
			throw new Error('Conversation not found')
		}

		const rows = await prisma.messages.findMany({
			where: {
				conversation_id: args.conversationId,
				deleted_at: null,
				OR: [{ is_deleted: false }, { is_deleted: null }],
			},
			select: {
				id: true,
				message_type: true,
				content: true,
				content_type: true,
				content_attributes: true,
				sender_type: true,
				private: true,
				created_at: true,
			},
			orderBy: { created_at: 'desc' },
			take: SUMMARY_MAX_MESSAGES,
		})

		const normalized = rows
			.reverse()
			.map((row) => AIService.normalizeConversationMessageForSummary(row))
			.filter(Boolean) as ConversationMessageForSummary[]

		return {
			conversation,
			messages: normalized,
		}
	}

	private static async requestEmbeddingBatch(args: {
		runtime: SummaryRuntimeConfig
		inputs: string[]
	}): Promise<number[][]> {
		if (
			!args.runtime.baseUrl ||
			!args.runtime.apiKey ||
			args.inputs.length === 0
		) {
			return []
		}

		const controller = new AbortController()
		const timer = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS)

		try {
			if (AIService.isAzureRuntime(args.runtime)) {
				const deployment =
					args.runtime.deploymentName || args.runtime.embeddingModel
				const endpoint = joinUrl(
					args.runtime.baseUrl,
					`openai/deployments/${encodeURIComponent(deployment)}/embeddings?api-version=${encodeURIComponent(args.runtime.apiVersion)}`,
				)

				const response = await fetch(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'api-key': args.runtime.apiKey,
					},
					body: JSON.stringify({ input: args.inputs }),
					signal: controller.signal,
				})
				if (!response.ok) return []
				const payload = (await response.json().catch(() => null)) as unknown
				return extractEmbeddingVectors(payload)
			}

			const endpoint = joinUrl(args.runtime.baseUrl, '/v1/embeddings')
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${args.runtime.apiKey}`,
				},
				body: JSON.stringify({
					model: args.runtime.embeddingModel,
					input: args.inputs,
				}),
				signal: controller.signal,
			})
			if (!response.ok) return []
			const payload = (await response.json().catch(() => null)) as unknown
			return extractEmbeddingVectors(payload)
		} catch (error) {
			console.warn('[AIService] Failed to generate embedding batch', error)
			return []
		} finally {
			clearTimeout(timer)
		}
	}

	private static async requestSummaryCompletion(args: {
		runtime: SummaryRuntimeConfig
		systemPrompt: string
		userPrompt: string
	}): Promise<string | null> {
		if (!args.runtime.baseUrl || !args.runtime.apiKey) return null

		const controller = new AbortController()
		const timer = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS)

		try {
			const messages = [
				{ role: 'system', content: args.systemPrompt },
				{ role: 'user', content: args.userPrompt },
			]

			if (AIService.isAzureRuntime(args.runtime)) {
				const deployment = args.runtime.deploymentName || args.runtime.modelName
				const endpoint = joinUrl(
					args.runtime.baseUrl,
					`openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(args.runtime.apiVersion)}`,
				)
				const response = await fetch(endpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'api-key': args.runtime.apiKey,
					},
					body: JSON.stringify({
						messages,
						temperature: args.runtime.temperature,
						max_tokens: args.runtime.maxTokens,
					}),
					signal: controller.signal,
				})
				if (!response.ok) return null
				const payload = (await response.json().catch(() => null)) as unknown
				return extractCompletionContent(payload)
			}

			const endpoint = joinUrl(args.runtime.baseUrl, '/v1/chat/completions')
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${args.runtime.apiKey}`,
				},
				body: JSON.stringify({
					model: args.runtime.modelName,
					messages,
					temperature: args.runtime.temperature,
					max_tokens: args.runtime.maxTokens,
				}),
				signal: controller.signal,
			})
			if (!response.ok) return null
			const payload = (await response.json().catch(() => null)) as unknown
			return extractCompletionContent(payload)
		} catch (error) {
			console.warn('[AIService] Failed to generate AI summary completion', error)
			return null
		} finally {
			clearTimeout(timer)
		}
	}

	private static buildFallbackSummary(messages: ConversationMessageForSummary[]): string {
		const lastCustomer = [...messages]
			.reverse()
			.find((message) => message.role === 'customer')
		const lastAgent = [...messages]
			.reverse()
			.find((message) => message.role === 'agent')
		const latestMessage = messages[messages.length - 1]
		const recentTranscript = messages
			.slice(-3)
			.map((item) => `${item.role === 'customer' ? 'Customer' : 'Agent'}: ${item.text}`)
			.join(' | ')

		const points = [
			lastCustomer?.text
				? `Konsumen menyampaikan kebutuhan utama: ${lastCustomer.text}`
				: 'Kebutuhan utama konsumen belum terlihat jelas.',
			recentTranscript
				? `Detail percakapan terbaru: ${recentTranscript}`
				: 'Percakapan masih sangat singkat.',
			latestMessage
				? `Pesan terakhir dikirim oleh ${latestMessage.role === 'customer' ? 'konsumen' : 'agent'}.`
				: 'Belum ada aktivitas percakapan.',
			lastAgent
				? 'Lanjutkan follow-up sesuai kebutuhan terakhir konsumen.'
				: 'Agent perlu melakukan respons awal ke konsumen.',
		]
		return AIService.toSummaryBulletList(points.join('\n'))
	}

	private static toSummaryBulletList(raw: string): string {
		const normalizedLines = raw
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean)
			.filter((line) => !/^ai\s+summary[:\s-]*/i.test(line))
			.map((line) => line.replace(/^[-*•]\s+/, '').trim())
			.map((line) => {
				const matchedLabel = line.match(
					/^(Intent|Detail Penting|Status|Next Action)\s*:\s*(.+)$/i,
				)
				if (matchedLabel && matchedLabel[2]) {
					return matchedLabel[2].trim()
				}
				return line
			})
			.filter(Boolean)

		if (normalizedLines.length === 0) {
			return '- Percakapan belum memiliki konteks yang cukup untuk diringkas.'
		}

		return normalizedLines.slice(0, 5).map((line) => `- ${line}`).join('\n')
	}

	private static async generateConversationSummary(args: {
		appId: string
		conversationId: string
		settings: any
		runtimeProvider: ProviderConfigRecord | null
	}): Promise<SummaryGenerationResult> {
		const runtime = AIService.toSummaryRuntimeConfig({
			settings: args.settings,
			runtimeProvider: args.runtimeProvider,
		})
		const loaded = await AIService.loadConversationMessagesForSummary({
			appId: args.appId,
			conversationId: args.conversationId,
		})
		const sourceMessages = loaded.messages

		if (sourceMessages.length === 0) {
			return {
				suggestion: '- Belum ada percakapan yang bisa diringkas.\n- Menunggu pesan konsumen berikutnya.',
				confidence: 0.5,
				retrieval: {
					totalMessages: 0,
					indexedMessages: 0,
					selectedMessages: 0,
					semanticMatches: 0,
				},
			}
		}

		const embeddingCandidates = sourceMessages.slice(-SUMMARY_MAX_EMBED_MESSAGES)
		const latestCustomer = [...embeddingCandidates]
			.reverse()
			.find((item) => item.role === 'customer')
		const latestMessage = embeddingCandidates[embeddingCandidates.length - 1]
		const queryText =
			latestCustomer?.text || latestMessage?.text || 'Ringkasan percakapan customer'

		const embeddingInputs = [
			queryText,
			...embeddingCandidates.map((item) => item.text),
		]
		const vectors = await AIService.requestEmbeddingBatch({
			runtime,
			inputs: embeddingInputs,
		})

		let semanticMatches = 0
		const selectedIndices = new Set<number>()
		const recentStart = Math.max(
			0,
			embeddingCandidates.length - SUMMARY_RECENT_WINDOW,
		)
		for (let i = recentStart; i < embeddingCandidates.length; i++) {
			selectedIndices.add(i)
		}

		if (vectors.length === embeddingInputs.length) {
			const queryVector = vectors[0]
			const scored = vectors
				.slice(1)
				.map((vector, index) => ({
					index,
					score: cosineSimilarity(queryVector, vector),
				}))
				.filter((item) => Number.isFinite(item.score))
				.sort((a, b) => b.score - a.score)
				.slice(0, SUMMARY_SEMANTIC_TOP_K)

			for (const item of scored) {
				selectedIndices.add(item.index)
			}
			semanticMatches = scored.length
		}

		const selectedMessages = Array.from(selectedIndices)
			.sort((a, b) => a - b)
			.map((index) => embeddingCandidates[index])

		const transcript = selectedMessages
			.map((message) => {
				const ts = message.createdAt.toISOString()
				const role = message.role === 'customer' ? 'Customer' : 'Agent'
				return `- [${ts}] ${role}: ${message.text}`
			})
			.join('\n')

		const systemPrompt = [
			'You are a senior customer support analyst.',
			'Write concise and accurate summary from provided transcript only.',
			'Use Indonesian language.',
			'Do not invent facts.',
			'Output exactly 3-5 bullet points.',
			'Each line must start with "- " and contain one concrete point.',
			'Do not add heading, numbering, markdown bold, or extra explanation.',
		].join(' ')

		const userPrompt = [
			`Conversation ID: ${args.conversationId}`,
			`Total message considered: ${selectedMessages.length} / ${sourceMessages.length}`,
			'Transcript:',
			transcript,
		].join('\n\n')

		const completion = await AIService.requestSummaryCompletion({
			runtime,
			systemPrompt,
			userPrompt,
		})
		const suggestion = AIService.toSummaryBulletList(
			toTrimmedString(completion) ||
				AIService.buildFallbackSummary(selectedMessages),
		)

		const confidence = clamp(
			0.58 +
				(completion ? 0.2 : 0.05) +
				Math.min(0.15, semanticMatches * 0.01) +
				Math.min(0.1, selectedMessages.length * 0.005),
			0.45,
			0.95,
		)

		void prisma.ai_conversation_contexts
			.upsert({
				where: { conversation_id: args.conversationId },
				update: {
					context_summary: suggestion,
					last_ai_action: 'summary_generated',
					last_ai_action_at: new Date(),
					updated_at: new Date(),
				},
				create: {
					conversation_id: args.conversationId,
					context_summary: suggestion,
					last_ai_action: 'summary_generated',
					last_ai_action_at: new Date(),
					updated_at: new Date(),
				},
			})
			.catch((error) => {
				console.warn('[AIService] Failed to persist ai_conversation_contexts', {
					conversationId: args.conversationId,
					error,
				})
			})

		return {
			suggestion,
			confidence: Number(confidence.toFixed(2)),
			retrieval: {
				totalMessages: sourceMessages.length,
				indexedMessages: embeddingCandidates.length,
				selectedMessages: selectedMessages.length,
				semanticMatches,
			},
		}
	}

	static async calculateCreditCost(modelName: string): Promise<number> {
		const pricing = await prisma.ai_model_pricing.findFirst({
			where: {
				model_name: modelName,
				is_active: true,
			},
			select: { cost_per_request: true },
		})

		if (!pricing) {
			return 1.0
		}

		const parsedCost = Number(pricing.cost_per_request)
		return Number.isFinite(parsedCost) && parsedCost > 0 ? parsedCost : 1.0
	}

	static async reserveCredits(
		appId: string,
		modelName: string,
		description: string,
		metadata: TransactionMetadata = {},
	): Promise<ReservationResult> {
		const targetAppId = await resolveAppId(appId)
		if (!targetAppId) throw new Error('Invalid App ID')

		const organizationId = await AIService.getOrganizationIdFromApp(targetAppId)
		const cost = await AIService.calculateCreditCost(modelName)

		let reservationTransaction: { id: string; metadata: unknown } | null = null

		try {
			reservationTransaction = await BillingService.deductOrgCredits(
				organizationId,
				cost,
				`${description} (${modelName})`,
				{
					...metadata,
					app_id: targetAppId,
					model_name: modelName,
					reservation_stage: 'reserved',
				},
			)
		} catch (error) {
			console.error('[AIService] Failed to reserve credits', {
				appId: targetAppId,
				organizationId,
				modelName,
				cost,
				error,
			})
			throw error
		}

		const reservationId = reservationTransaction.id

		try {
			const baseMetadata = AIService.toMetadataObject(
				reservationTransaction.metadata,
			)

			await prisma.credit_transactions.update({
				where: { id: reservationId },
				data: {
					payment_status: 'reserved',
					reservation_id: reservationId,
					metadata: {
						...baseMetadata,
						reservation_id: reservationId,
						reservation_stage: 'reserved',
						reserved_at: new Date().toISOString(),
					},
				},
			})
		} catch (error) {
			console.error('[AIService] Failed to persist reservation state', {
				reservationId,
				organizationId,
				modelName,
				error,
			})

			try {
				await BillingService.topUpOrgCredits(
					organizationId,
					cost,
					`Rollback AI reservation ${reservationId}`,
					reservationId,
				)
			} catch (rollbackError) {
				console.error('[AIService] Failed to rollback reservation deduction', {
					reservationId,
					organizationId,
					cost,
					error: rollbackError,
				})
			}

			throw error
		}

		return {
			reservationId,
			organizationId,
			cost,
			modelName,
		}
	}

	static async finalizeReservation(reservationId: string) {
		const reservation = await prisma.credit_transactions.findUnique({
			where: { id: reservationId },
			select: {
				id: true,
				payment_status: true,
				metadata: true,
			},
		})

		if (!reservation) {
			throw new Error(`Reservation not found: ${reservationId}`)
		}

		if (reservation.payment_status === 'completed') {
			return
		}

		if (reservation.payment_status !== 'reserved') {
			throw new Error(
				`Cannot finalize reservation ${reservationId} with status ${reservation.payment_status}`,
			)
		}

		try {
			const baseMetadata = AIService.toMetadataObject(reservation.metadata)

			await prisma.credit_transactions.update({
				where: { id: reservationId },
				data: {
					payment_status: 'completed',
					metadata: {
						...baseMetadata,
						reservation_stage: 'completed',
						finalized_at: new Date().toISOString(),
					},
				},
			})
		} catch (error) {
			console.error('[AIService] Failed to finalize reservation', {
				reservationId,
				error,
			})
			throw error
		}
	}

	static async refundReservation(
		reservationId: string,
		reason = 'AI generation failed',
	) {
		const reservation = await prisma.credit_transactions.findUnique({
			where: { id: reservationId },
			select: {
				id: true,
				organization_id: true,
				amount: true,
				payment_status: true,
				metadata: true,
			},
		})

		if (!reservation) {
			throw new Error(`Reservation not found: ${reservationId}`)
		}

		if (reservation.payment_status === 'refunded') {
			return
		}

		if (reservation.payment_status === 'completed') {
			console.warn(
				`[AIService] Reservation ${reservationId} already finalized; skip refund`,
			)
			return
		}

		if (reservation.payment_status !== 'reserved') {
			throw new Error(
				`Cannot refund reservation ${reservationId} with status ${reservation.payment_status}`,
			)
		}

		if (!reservation.organization_id) {
			throw new Error(`Reservation ${reservationId} has no organization_id`)
		}

		const reservedAmount = Math.abs(Number(reservation.amount))

		if (!Number.isFinite(reservedAmount) || reservedAmount <= 0) {
			throw new Error(
				`Invalid reserved amount for reservation ${reservationId}: ${reservation.amount}`,
			)
		}

		try {
			await BillingService.topUpOrgCredits(
				reservation.organization_id,
				reservedAmount,
				`Refund AI reservation ${reservationId}: ${reason}`,
				reservationId,
			)

			const baseMetadata = AIService.toMetadataObject(reservation.metadata)

			await prisma.credit_transactions.update({
				where: { id: reservationId },
				data: {
					payment_status: 'refunded',
					metadata: {
						...baseMetadata,
						reservation_stage: 'refunded',
						refunded_at: new Date().toISOString(),
						refund_reason: reason,
					},
				},
			})
		} catch (error) {
			console.error('[AIService] Failed to refund reservation', {
				reservationId,
				error,
			})
			throw error
		}
	}

	static async getSettings(appId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.ai_settings.findUnique({
			where: { app_id: targetAppId || undefined },
		})
	}

	static async updateSettings(appId: string, data: any) {
		const targetAppId = await resolveAppId(appId)
		if (!targetAppId) throw new Error('Invalid App ID')
		const normalizedData = AIService.normalizeSettingsUpdatePayload(
			(data || {}) as Record<string, any>,
		)

		return prisma.ai_settings.upsert({
			where: { app_id: targetAppId },
			update: { ...normalizedData, updated_at: new Date() },
			create: { ...normalizedData, app_id: targetAppId },
		})
	}

	static async getSuggestions(conversationId: string, appId: string) {
		const targetAppId = await resolveAppId(appId)
		if (!targetAppId) throw new Error('Invalid App ID')
		if (!isUuid(conversationId)) throw new Error('Invalid conversation ID')

		const settings = await AIService.getSettings(targetAppId)
		const runtimeProvider = await AIService.getRuntimeProviderConfig()
		const modelName =
			settings?.model_name || runtimeProvider?.model_name || DEFAULT_CHAT_MODEL
		const reservation = await AIService.reserveCredits(
			targetAppId,
			modelName,
			`AI Suggestion for conversation ${conversationId}`,
			{ conversation_id: conversationId },
		)

		try {
			const summaryResult = await AIService.generateConversationSummary({
				appId: targetAppId,
				conversationId,
				settings,
				runtimeProvider,
			})

			const result = {
				suggestion: summaryResult.suggestion,
				confidence: summaryResult.confidence,
				provider: runtimeProvider?.provider || settings?.model_provider || null,
				base_url: runtimeProvider?.base_url || settings?.api_endpoint || null,
				retrieval: summaryResult.retrieval,
			}

			await AIService.finalizeReservation(reservation.reservationId)
			const conversationContext = await prisma.conversations.findUnique({
				where: { id: conversationId },
				select: { id: true, inbox_id: true },
			})
				void BusinessWebhookDispatchService.dispatch({
					event: 'ai_summary.generated',
					appId: targetAppId,
					inboxId: conversationContext?.inbox_id || null,
					payload: {
						conversation_id: conversationId,
						summary: result.suggestion,
						confidence: result.confidence,
						provider: result.provider,
						base_url: result.base_url,
						retrieval: result.retrieval,
					},
				})

			return result
		} catch (error) {
			console.error('[AIService] Suggestion flow failed after reservation', {
				conversationId,
				appId: targetAppId,
				reservationId: reservation.reservationId,
				error,
			})

			try {
				await AIService.refundReservation(
					reservation.reservationId,
					'Suggestion generation failure',
				)
			} catch (refundError) {
				console.error('[AIService] Suggestion refund failed', {
					conversationId,
					appId: targetAppId,
					reservationId: reservation.reservationId,
					error: refundError,
				})
			}

			throw error
		}
	}

	static async generateResponse(appId: string, payload: any) {
		const targetAppId = await resolveAppId(appId)
		if (!targetAppId) throw new Error('Invalid App ID')

		const settings = await AIService.getSettings(targetAppId)
		const runtimeProvider = await AIService.getRuntimeProviderConfig()
		const modelName =
			settings?.model_name || runtimeProvider?.model_name || 'gpt-4o-mini'
		const reservation = await AIService.reserveCredits(
			targetAppId,
			modelName,
			'AI Response generation',
			{ conversation_id: payload?.conversationId },
		)

		try {
			const result = {
				content: 'Automated AI response based on your query.',
				model: modelName,
				provider: runtimeProvider?.provider || settings?.model_provider || null,
				base_url: runtimeProvider?.base_url || settings?.api_endpoint || null,
			}

			await AIService.finalizeReservation(reservation.reservationId)

			return result
		} catch (error) {
			console.error(
				'[AIService] Response generation failed after reservation',
				{
					appId: targetAppId,
					reservationId: reservation.reservationId,
					error,
				},
			)

			try {
				await AIService.refundReservation(
					reservation.reservationId,
					'Response generation failure',
				)
			} catch (refundError) {
				console.error('[AIService] Response refund failed', {
					appId: targetAppId,
					reservationId: reservation.reservationId,
					error: refundError,
				})
			}

			throw error
		}
	}

	static async recordEvaluation(data: any) {
		const targetAppId = await resolveAppId(data.appId)
		return prisma.ai_evaluations.create({
			data: {
				app_id: targetAppId || data.appId,
				chatbot_id: data.chatbotId,
				content: data.content,
				type: data.type || 'evaluation',
				metadata: {
					score: data.score,
					feedback: data.feedback,
					conversation_id: data.conversationId,
				},
			},
		})
	}
}
