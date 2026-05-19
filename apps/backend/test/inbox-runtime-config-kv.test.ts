import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
	type InboxRuntimeConfigSnapshot,
	loadInboxRuntimeConfigWithKvCache,
} from '../src/lib/inbox-runtime-config-kv'

type MockKvNamespace = {
	get: (key: string) => Promise<unknown>
	put: (
		key: string,
		value: string,
		options?: { expirationTtl?: number },
	) => Promise<void>
	delete: (key: string) => Promise<void>
	putCalls: Array<{
		key: string
		value: string
		options?: { expirationTtl?: number }
	}>
}

const APP_ID = 'app-test'
const INBOX_ID = 'inbox-test'
const KV_KEY = `scalebiz:inbox-runtime-config:v1:${APP_ID}:${INBOX_ID}`

function createMockKv(initial: Record<string, string> = {}): MockKvNamespace {
	const store = new Map<string, string>(Object.entries(initial))
	const putCalls: MockKvNamespace['putCalls'] = []

	return {
		putCalls,
		async get(key) {
			return store.get(key) ?? null
		},
		async put(key, value, options) {
			putCalls.push({ key, value, options })
			store.set(key, value)
		},
		async delete(key) {
			store.delete(key)
		},
	}
}

function buildSnapshot(
	overrides: Partial<InboxRuntimeConfigSnapshot> = {},
): InboxRuntimeConfigSnapshot {
	return {
		appId: APP_ID,
		inboxId: INBOX_ID,
		channelType: 'whatsapp',
		chatbotId: '3f4c8f20-1c62-4a8b-89f4-277f965d4dbe',
		channelConfig: {
			default_chatbot_id: '3f4c8f20-1c62-4a8b-89f4-277f965d4dbe',
			default_agent_ids: ['d05bd2d2-641a-4234-9dae-68e6af2db3d5'],
			distribution_method: 'round_robin',
		},
		whatsappMetadata: {},
		updatedAt: '2026-04-20T10:00:00.000Z',
		...overrides,
	}
}

beforeEach(() => {
	delete (globalThis as Record<string, unknown>).CHANNEL_SETTINGS_KV
})

afterEach(() => {
	delete (globalThis as Record<string, unknown>).CHANNEL_SETTINGS_KV
})

describe('loadInboxRuntimeConfigWithKvCache', () => {
	it('loads from DB and writes to KV when cache is empty', async () => {
		const kv = createMockKv()
		;(globalThis as Record<string, unknown>).CHANNEL_SETTINGS_KV = kv

		const fresh = buildSnapshot()
		const result = await loadInboxRuntimeConfigWithKvCache({
			appId: APP_ID,
			inboxId: INBOX_ID,
			loadFresh: async () => fresh,
		})

		expect(result).toEqual(fresh)
		expect(kv.putCalls.length).toBe(1)
		expect(kv.putCalls[0]?.key).toBe(KV_KEY)
	})

	it('refreshes stale KV snapshot when fresh config changed', async () => {
		const stale = buildSnapshot({
			channelConfig: {
				default_chatbot_id: '3f4c8f20-1c62-4a8b-89f4-277f965d4dbe',
				default_agent_ids: ['old-agent-id'],
				distribution_method: 'round_robin',
			},
			updatedAt: '2026-04-20T09:00:00.000Z',
		})
		const kv = createMockKv({
			[KV_KEY]: JSON.stringify(stale),
		})
		;(globalThis as Record<string, unknown>).CHANNEL_SETTINGS_KV = kv

		const fresh = buildSnapshot({
			channelConfig: {
				default_chatbot_id: '3f4c8f20-1c62-4a8b-89f4-277f965d4dbe',
				default_agent_ids: ['new-agent-id'],
				distribution_method: 'least_assigned',
			},
			updatedAt: '2026-04-20T11:00:00.000Z',
		})

		const result = await loadInboxRuntimeConfigWithKvCache({
			appId: APP_ID,
			inboxId: INBOX_ID,
			loadFresh: async () => fresh,
		})

		expect(result).toEqual(fresh)
		expect(kv.putCalls.length).toBe(1)
		const written = JSON.parse(kv.putCalls[0]?.value || '{}')
		expect(written.channelConfig.default_agent_ids).toEqual(['new-agent-id'])
		expect(written.channelConfig.distribution_method).toBe('least_assigned')
	})

	it('keeps cached value when fresh source is unavailable', async () => {
		const cached = buildSnapshot({
			updatedAt: '2026-04-20T10:00:00.000Z',
		})
		const kv = createMockKv({
			[KV_KEY]: JSON.stringify(cached),
		})
		;(globalThis as Record<string, unknown>).CHANNEL_SETTINGS_KV = kv

		const result = await loadInboxRuntimeConfigWithKvCache({
			appId: APP_ID,
			inboxId: INBOX_ID,
			loadFresh: async () => null,
		})

		expect(result).toEqual(cached)
		expect(kv.putCalls.length).toBe(0)
	})
})
