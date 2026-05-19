import { beforeEach, describe, expect, it, vi } from 'bun:test'

const mockMetaCapiConfigsFindUnique = vi.fn()
const mockConversationsFindUnique = vi.fn()
const mockContactsFindUnique = vi.fn()
const mockMetaCtwaAttributionsFindUnique = vi.fn()
const mockMetaCapiEventLogsCreate = vi.fn()
const mockMetaCapiEventLogsUpdate = vi.fn()

vi.mock('../src/lib/prisma', () => ({
	default: {
		meta_capi_configs: {
			findUnique: mockMetaCapiConfigsFindUnique,
		},
		conversations: {
			findUnique: mockConversationsFindUnique,
		},
		contacts: {
			findUnique: mockContactsFindUnique,
		},
		meta_ctwa_attributions: {
			findUnique: mockMetaCtwaAttributionsFindUnique,
		},
		meta_capi_event_logs: {
			create: mockMetaCapiEventLogsCreate,
			update: mockMetaCapiEventLogsUpdate,
		},
	},
}))

const { MetaAdsService } = await import('../src/modules/meta-ads/service')

describe('MetaAdsService stage and CAPI dispatch', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
		vi.resetAllMocks()
		mockMetaCapiConfigsFindUnique.mockResolvedValue({
			app_id: 'app-1',
			dataset_id: 'dataset-1',
			access_token: 'token-1',
			test_event_code: null,
			qualified_stage_ids: ['stage-qualified'],
			purchase_stage_ids: ['stage-purchase'],
			is_active: true,
		})
		mockConversationsFindUnique.mockResolvedValue({
			id: 'conv-1',
			app_id: 'app-1',
			contact_id: 'contact-1',
			inbox_id: 'inbox-1',
			stage_id: null,
			additional_attributes: {},
		})
		mockContactsFindUnique.mockResolvedValue({
			id: 'contact-1',
			name: 'Contact 1',
			phone_number: '+628123456789',
			email: 'contact@example.com',
			metadata: {},
			meta: {},
		})
		mockMetaCtwaAttributionsFindUnique.mockResolvedValue({
			id: 'attr-1',
			first_ctwa_clid: 'ctwa-first',
			last_ctwa_clid: 'ctwa-last',
			first_fb_campaign_id: 'camp-1',
			last_fb_campaign_id: 'camp-1',
			first_fb_adset_id: 'adset-1',
			last_fb_adset_id: 'adset-1',
			first_fb_ad_id: 'ad-1',
			last_fb_ad_id: 'ad-1',
		})
		mockMetaCapiEventLogsCreate.mockResolvedValue({ id: 'log-1' })
		mockMetaCapiEventLogsUpdate.mockResolvedValue({ id: 'log-1' })
	})

	it('does not dispatch when stage is not configured target', async () => {
		const dispatchSpy = vi
			.spyOn(MetaAdsService, 'dispatchCapiEvent')
			.mockResolvedValue({ status: 'skipped', reason: 'test' } as any)

		const result = await MetaAdsService.handleConversationStageTransition({
			appId: 'app-1',
			conversationId: 'conv-1',
			contactId: 'contact-1',
			fromStageId: 'stage-open',
			toStageId: 'stage-random',
			transitionId: 'transition-1',
		})

		expect(result.dispatched).toEqual([])
		expect(dispatchSpy).not.toHaveBeenCalled()
	})

	it('dispatches QualifiedLead when stage_id is configured in qualified_stage_ids', async () => {
		const dispatchSpy = vi
			.spyOn(MetaAdsService, 'dispatchCapiEvent')
			.mockResolvedValue({ status: 'delivered', httpStatus: 200 } as any)

		const result = await MetaAdsService.handleConversationStageTransition({
			appId: 'app-1',
			conversationId: 'conv-1',
			contactId: 'contact-1',
			fromStageId: 'stage-open',
			toStageId: 'stage-qualified',
			transitionId: 'transition-2',
		})

		expect(result.dispatched).toEqual(['QualifiedLead'])
		expect(dispatchSpy).toHaveBeenCalledTimes(1)
		expect(dispatchSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				appId: 'app-1',
				conversationId: 'conv-1',
				eventName: 'QualifiedLead',
				stageId: 'stage-qualified',
			}),
		)
	})

	it('dispatches Purchase when stage_id is configured in purchase_stage_ids', async () => {
		const dispatchSpy = vi
			.spyOn(MetaAdsService, 'dispatchCapiEvent')
			.mockResolvedValue({ status: 'delivered', httpStatus: 200 } as any)

		const result = await MetaAdsService.handleConversationStageTransition({
			appId: 'app-1',
			conversationId: 'conv-1',
			contactId: 'contact-1',
			fromStageId: 'stage-open',
			toStageId: 'stage-purchase',
			transitionId: 'transition-3',
		})

		expect(result.dispatched).toEqual(['Purchase'])
		expect(dispatchSpy).toHaveBeenCalledTimes(1)
		expect(dispatchSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				appId: 'app-1',
				conversationId: 'conv-1',
				eventName: 'Purchase',
				stageId: 'stage-purchase',
			}),
		)
	})

	it('logs skipped status when CAPI config is missing', async () => {
		mockMetaCapiConfigsFindUnique.mockResolvedValueOnce(null)

		const result = await MetaAdsService.dispatchCapiEvent({
			appId: 'app-1',
			conversationId: 'conv-1',
			contactId: 'contact-1',
			eventName: 'Lead',
			eventAt: new Date('2026-04-21T00:00:00.000Z'),
			idempotencyKey: 'lead:conv-1',
			stageId: null,
			transitionId: null,
		})

		expect(result).toEqual({
			status: 'skipped',
			reason: 'config_missing_or_inactive',
		})
		expect(mockMetaCapiEventLogsCreate).toHaveBeenCalledTimes(1)
		const createArg = mockMetaCapiEventLogsCreate.mock.calls[0]?.[0] || {}
		expect(createArg?.data?.status).toBe('skipped')
		expect(createArg?.data?.event_name).toBe('Lead')
	})
})
