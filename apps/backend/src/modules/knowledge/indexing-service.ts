import prisma from '../../lib/prisma'
import redis from '../../lib/redis'
import { maintenanceQueue } from '../../lib/queue'
import { AIService } from '../ai/service'
import { analyzeTreatmentCatalogSource } from './treatment-catalog-audit'

export type KnowledgeChangeAction = 'create' | 'update' | 'delete'
export type KnowledgeChangeEntity = 'source' | 'faq'

export type KnowledgeChangeEventPayload = {
	action: KnowledgeChangeAction
	entity: KnowledgeChangeEntity
	app_id: string
	chatbot_id: string
	knowledge_id: string
	timestamp?: string
}

type KnowledgeSyncRuntime = {
	provider: string | null
	baseUrl: string | null
	apiKey: string | null
	apiVersion: string
	deploymentName: string | null
	embeddingModelName: string
}

type EmbeddingChunk = {
	index: number
	content: string
	embedding: number[]
}

const KNOWLEDGE_CHANGE_EVENT_JOB = 'knowledge-change-event'
const KNOWLEDGE_SYNC_JOB = 'sync-knowledge-index'
const KNOWLEDGE_PURGE_JOB = 'purge-knowledge-index'

const RETRIEVAL_CACHE_PREFIX = 'rag:knowledge:'

const MAX_EMBEDDING_CHUNKS = Math.max(
	1,
	Math.min(1_000, Number(process.env.KNOWLEDGE_MAX_EMBEDDING_CHUNKS || 200)),
)
const EMBEDDING_CHUNK_SIZE = Math.max(
	300,
	Math.min(4_000, Number(process.env.KNOWLEDGE_EMBEDDING_CHUNK_SIZE || 1_000)),
)
const EMBEDDING_CHUNK_OVERLAP = Math.max(
	0,
	Math.min(
		Math.floor(EMBEDDING_CHUNK_SIZE / 2),
		Number(process.env.KNOWLEDGE_EMBEDDING_CHUNK_OVERLAP || 120),
	),
)

function normalizeString(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const normalized = value.trim()
	return normalized.length > 0 ? normalized : null
}

function toRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
	return { ...(value as Record<string, unknown>) }
}

function mergeSourceMetadataWithCatalogAudit(
	existingMetadata: unknown,
	audit:
		| ReturnType<typeof analyzeTreatmentCatalogSource>
		| null,
): Record<string, unknown> {
	const nextMetadata = toRecord(existingMetadata)
	if (audit) {
		nextMetadata.treatment_catalog_audit = audit
		nextMetadata.treatment_catalog_audit_updated_at = audit.generated_at
		return nextMetadata
	}

	delete nextMetadata.treatment_catalog_audit
	delete nextMetadata.treatment_catalog_audit_updated_at
	return nextMetadata
}

function normalizeAction(value: unknown): KnowledgeChangeAction {
	const normalized = normalizeString(value)
	if (normalized === 'create' || normalized === 'update' || normalized === 'delete') {
		return normalized
	}
	return 'update'
}

function normalizeEntity(value: unknown): KnowledgeChangeEntity {
	const normalized = normalizeString(value)
	if (normalized === 'faq') return 'faq'
	return 'source'
}

function normalizePayload(value: unknown): KnowledgeChangeEventPayload {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Invalid knowledge lifecycle payload')
	}
	const record = value as Record<string, unknown>
	const appId = normalizeString(record.app_id)
	const chatbotId = normalizeString(record.chatbot_id)
	const knowledgeId = normalizeString(record.knowledge_id)
	if (!appId || !chatbotId || !knowledgeId) {
		throw new Error('knowledge lifecycle payload is missing required fields')
	}
	return {
		action: normalizeAction(record.action),
		entity: normalizeEntity(record.entity),
		app_id: appId,
		chatbot_id: chatbotId,
		knowledge_id: knowledgeId,
		timestamp: normalizeString(record.timestamp) || new Date().toISOString(),
	}
}

function joinUrl(baseUrl: string, path: string): string {
	const base = baseUrl.replace(/\/+$/, '')
	const suffix = path.replace(/^\/+/, '')
	return `${base}/${suffix}`
}

function stripHtml(value: string): string {
	return value
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function splitIntoChunks(text: string): string[] {
	const normalized = stripHtml(String(text || ''))
	if (!normalized) return []
	if (normalized.length <= EMBEDDING_CHUNK_SIZE) return [normalized]

	const chunks: string[] = []
	let cursor = 0
	while (cursor < normalized.length && chunks.length < MAX_EMBEDDING_CHUNKS) {
		const end = Math.min(normalized.length, cursor + EMBEDDING_CHUNK_SIZE)
		const window = normalized.slice(cursor, end).trim()
		if (window) chunks.push(window)
		if (end >= normalized.length) break
		cursor = Math.max(end - EMBEDDING_CHUNK_OVERLAP, cursor + 1)
	}

	return chunks
}

function vectorLiteral(vector: number[]): string {
	const values = vector.map((value) => {
		const numeric = Number(value)
		if (!Number.isFinite(numeric)) return '0'
		return Number(numeric.toFixed(8)).toString()
	})
	return `[${values.join(',')}]`
}

async function resolveEmbeddingRuntime(appId: string): Promise<KnowledgeSyncRuntime> {
	const [settings, providerConfigurations] = await Promise.all([
		AIService.getSettings(appId).catch(() => null),
		AIService.getProviderConfigurations().catch(() => null),
	])

	const activeProvider = providerConfigurations?.active_provider || null
	const runtimeProvider = activeProvider
		? providerConfigurations?.providers?.[activeProvider]
		: null

	const provider =
		normalizeString(runtimeProvider?.provider) ||
		normalizeString(settings?.model_provider) ||
		normalizeString(process.env.AI_PROVIDER)

	const baseUrl =
		normalizeString(runtimeProvider?.base_url) ||
		normalizeString(settings?.api_endpoint) ||
		normalizeString(process.env.AZURE_OPENAI_ENDPOINT)

	const apiKey =
		normalizeString(runtimeProvider?.api_key) ||
		normalizeString(settings?.api_key) ||
		normalizeString(process.env.AZURE_OPENAI_API_KEY) ||
		normalizeString(process.env.OPENAI_API_KEY)

	const apiVersion =
		normalizeString(runtimeProvider?.api_version) ||
		normalizeString(settings?.api_version) ||
		'2024-02-15-preview'

	const deploymentName =
		normalizeString(runtimeProvider?.deployment_name) ||
		normalizeString(settings?.deployment_name) ||
		normalizeString(process.env.AZURE_OPENAI_DEPLOYMENT)

	const embeddingModelName =
		normalizeString(process.env.AI_EMBEDDING_MODEL) || 'text-embedding-3-small'

	return {
		provider,
		baseUrl,
		apiKey,
		apiVersion,
		deploymentName,
		embeddingModelName,
	}
}

function extractEmbedding(payload: unknown): number[] | null {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
	const record = payload as Record<string, unknown>
	const data = Array.isArray(record.data) ? record.data : []
	if (data.length === 0) return null
	const first = data[0]
	if (!first || typeof first !== 'object' || Array.isArray(first)) return null
	const embeddingRaw = (first as Record<string, unknown>).embedding
	if (!Array.isArray(embeddingRaw)) return null
	const embedding = embeddingRaw
		.map((value) => Number(value))
		.filter((value) => Number.isFinite(value))
	if (embedding.length === 0) return null
	return embedding
}

async function generateEmbedding(runtime: KnowledgeSyncRuntime, text: string): Promise<number[] | null> {
	if (!runtime.baseUrl || !runtime.apiKey) return null

	const isAzure =
		(runtime.provider || '').toLowerCase() === 'azure' ||
		runtime.baseUrl.includes('.openai.azure.com')

	if (isAzure) {
		const deployment = runtime.deploymentName || runtime.embeddingModelName
		const endpoint = joinUrl(
			runtime.baseUrl,
			`openai/deployments/${encodeURIComponent(deployment)}/embeddings?api-version=${encodeURIComponent(runtime.apiVersion)}`,
		)
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'api-key': runtime.apiKey,
			},
			body: JSON.stringify({
				input: text,
			}),
		})
		if (!response.ok) return null
		const payload = await response.json().catch(() => null)
		return extractEmbedding(payload)
	}

	const endpoint = joinUrl(runtime.baseUrl, '/v1/embeddings')
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${runtime.apiKey}`,
		},
		body: JSON.stringify({
			model: runtime.embeddingModelName,
			input: text,
		}),
	})
	if (!response.ok) return null
	const payload = await response.json().catch(() => null)
	return extractEmbedding(payload)
}

async function buildEmbeddingChunks(appId: string, text: string): Promise<EmbeddingChunk[]> {
	const runtime = await resolveEmbeddingRuntime(appId)
	if (!runtime.baseUrl || !runtime.apiKey) {
		throw new Error('Embedding runtime is not configured')
	}

	const chunks = splitIntoChunks(text)
	if (chunks.length === 0) return []

	const result: EmbeddingChunk[] = []
	for (let index = 0; index < chunks.length; index += 1) {
		const chunk = chunks[index]
		const embedding = await generateEmbedding(runtime, chunk)
		if (!embedding) continue
		result.push({
			index,
			content: chunk,
			embedding,
		})
	}
	return result
}

async function replaceSourceEmbeddings(params: {
	sourceId: string
	chunks: EmbeddingChunk[]
}): Promise<void> {
	await prisma.$transaction(async (tx) => {
		await tx.embeddings.deleteMany({ where: { source_id: params.sourceId } })

		for (const chunk of params.chunks) {
			await tx.$executeRaw`
				INSERT INTO "embeddings" ("id", "source_id", "faq_id", "content_chunk", "chunk_index", "embedding", "created_at")
				VALUES (gen_random_uuid(), ${params.sourceId}::uuid, NULL, ${chunk.content}, ${chunk.index}, ${vectorLiteral(chunk.embedding)}::vector, NOW())
			`
		}
	})
}

async function replaceFaqEmbeddings(params: {
	faqId: string
	chunks: EmbeddingChunk[]
}): Promise<void> {
	await prisma.$transaction(async (tx) => {
		await tx.embeddings.deleteMany({ where: { faq_id: params.faqId } })

		for (const chunk of params.chunks) {
			await tx.$executeRaw`
				INSERT INTO "embeddings" ("id", "source_id", "faq_id", "content_chunk", "chunk_index", "embedding", "created_at")
				VALUES (gen_random_uuid(), NULL, ${params.faqId}::uuid, ${chunk.content}, ${chunk.index}, ${vectorLiteral(chunk.embedding)}::vector, NOW())
			`
		}
	})
}

async function deleteSourceEmbeddings(sourceId: string): Promise<void> {
	await prisma.embeddings.deleteMany({ where: { source_id: sourceId } })
}

async function deleteFaqEmbeddings(faqId: string): Promise<void> {
	await prisma.embeddings.deleteMany({ where: { faq_id: faqId } })
}

async function invalidateRetrievalCache(appId: string, chatbotId: string): Promise<void> {
	const pattern = `${RETRIEVAL_CACHE_PREFIX}${appId}:${chatbotId}*`
	let cursor = '0'
	try {
		do {
			const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
			cursor = nextCursor
			if (keys.length > 0) {
				await redis.del(...keys)
			}
		} while (cursor !== '0')
	} catch (error) {
		console.warn('[KnowledgeIndexService] Retrieval cache invalidation skipped', {
			appId,
			chatbotId,
			error,
		})
	}
}

async function syncSource(payload: KnowledgeChangeEventPayload): Promise<void> {
	const source = await prisma.knowledge_sources.findFirst({
		where: {
			id: payload.knowledge_id,
			app_id: payload.app_id,
			chatbot_id: payload.chatbot_id,
		},
		select: {
			id: true,
			title: true,
			content: true,
			metadata: true,
			is_active: true,
		},
	})
	if (!source || source.is_active === false) {
		await deleteSourceEmbeddings(payload.knowledge_id)
		await invalidateRetrievalCache(payload.app_id, payload.chatbot_id)
		return
	}

	await prisma.knowledge_sources.update({
		where: { id: source.id },
		data: {
			status: 'processing',
			error_message: null,
			updated_at: new Date(),
		},
	})
	const treatmentCatalogAudit = analyzeTreatmentCatalogSource({
		title: source.title,
		content: source.content,
	})
	if (treatmentCatalogAudit && treatmentCatalogAudit.status !== 'ok') {
		console.warn('[KnowledgeIndexService] treatment catalog audit anomalies detected', {
			sourceId: source.id,
			chatbotId: payload.chatbot_id,
			status: treatmentCatalogAudit.status,
			anomalyCount: treatmentCatalogAudit.anomaly_count,
		})
	}
	const mergedMetadata = mergeSourceMetadataWithCatalogAudit(
		source.metadata,
		treatmentCatalogAudit,
	)

	try {
		const sourceText = [source.title || '', source.content || '']
			.join('\n')
			.trim()
		const chunks = await buildEmbeddingChunks(payload.app_id, sourceText)

		await replaceSourceEmbeddings({
			sourceId: source.id,
			chunks,
		})

		await prisma.knowledge_sources.update({
			where: { id: source.id },
			data: {
				chunk_count: chunks.length,
				status: 'ready',
				error_message: null,
				last_synced_at: new Date(),
				metadata: mergedMetadata as any,
				updated_at: new Date(),
			},
		})
		await invalidateRetrievalCache(payload.app_id, payload.chatbot_id)
	} catch (error) {
			await prisma.knowledge_sources.update({
				where: { id: source.id },
				data: {
					status: 'error',
					error_message:
						error instanceof Error ? error.message : 'Failed to sync knowledge index',
					metadata: mergedMetadata as any,
					updated_at: new Date(),
				},
			})
		throw error
	}
}

async function syncFaq(payload: KnowledgeChangeEventPayload): Promise<void> {
	const faq = await prisma.knowledge_faqs.findFirst({
		where: {
			id: payload.knowledge_id,
			app_id: payload.app_id,
			chatbot_id: payload.chatbot_id,
		},
		select: {
			id: true,
			question: true,
			answer: true,
			is_active: true,
		},
	})

	if (!faq || faq.is_active === false) {
		await deleteFaqEmbeddings(payload.knowledge_id)
		await invalidateRetrievalCache(payload.app_id, payload.chatbot_id)
		return
	}

	const faqText = `${faq.question || ''}\n${faq.answer || ''}`.trim()
	const chunks = await buildEmbeddingChunks(payload.app_id, faqText)

	await replaceFaqEmbeddings({
		faqId: faq.id,
		chunks,
	})
	await invalidateRetrievalCache(payload.app_id, payload.chatbot_id)
}

async function purgeSource(payload: KnowledgeChangeEventPayload): Promise<void> {
	await deleteSourceEmbeddings(payload.knowledge_id)
	await prisma.knowledge_sources.updateMany({
		where: {
			id: payload.knowledge_id,
			app_id: payload.app_id,
			chatbot_id: payload.chatbot_id,
		},
		data: {
			chunk_count: 0,
			status: 'ready',
			error_message: null,
			last_synced_at: new Date(),
			updated_at: new Date(),
		},
	})
	await invalidateRetrievalCache(payload.app_id, payload.chatbot_id)
}

async function purgeFaq(payload: KnowledgeChangeEventPayload): Promise<void> {
	await deleteFaqEmbeddings(payload.knowledge_id)
	await invalidateRetrievalCache(payload.app_id, payload.chatbot_id)
}

export abstract class KnowledgeIndexService {
	static async enqueueKnowledgeChangeEvent(payload: KnowledgeChangeEventPayload): Promise<void> {
		await maintenanceQueue.add(KNOWLEDGE_CHANGE_EVENT_JOB, payload, {
			attempts: 5,
			backoff: {
				type: 'exponential',
				delay: 2_000,
			},
			removeOnComplete: 1_000,
			removeOnFail: 2_000,
		})
	}

	static async handleKnowledgeChangeEventJob(rawPayload: unknown): Promise<void> {
		const payload = normalizePayload(rawPayload)
		if (payload.action === 'delete') {
			await maintenanceQueue.add(KNOWLEDGE_PURGE_JOB, payload, {
				attempts: 5,
				backoff: { type: 'exponential', delay: 2_000 },
				removeOnComplete: 1_000,
				removeOnFail: 2_000,
			})
			return
		}

		await maintenanceQueue.add(KNOWLEDGE_SYNC_JOB, payload, {
			attempts: 5,
			backoff: { type: 'exponential', delay: 2_000 },
			removeOnComplete: 1_000,
			removeOnFail: 2_000,
		})
	}

	static async syncKnowledgeIndexJob(rawPayload: unknown): Promise<void> {
		const payload = normalizePayload(rawPayload)
		if (payload.entity === 'faq') {
			await syncFaq(payload)
			return
		}
		await syncSource(payload)
	}

	static async purgeKnowledgeIndexJob(rawPayload: unknown): Promise<void> {
		const payload = normalizePayload(rawPayload)
		if (payload.entity === 'faq') {
			await purgeFaq(payload)
			return
		}
		await purgeSource(payload)
	}
}
