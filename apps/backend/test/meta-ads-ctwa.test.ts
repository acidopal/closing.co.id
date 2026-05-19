import { describe, expect, it, vi } from 'bun:test'

vi.mock('../src/lib/prisma', () => ({
	default: {},
}))

const { __test__ } = await import('../src/modules/meta-ads/service')

describe('MetaAdsService CTWA helpers', () => {
	it('parses full WhatsApp referral payload', () => {
		const referral = __test__.normalizeWhatsAppReferral({
			id: 'wamid.abc',
			referral: {
				source_id: '1234567890',
				source_type: 'ad',
				source_url: 'https://facebook.com',
				headline: 'Promo',
				body: 'Diskon',
				media_type: 'image',
				image_url: 'https://cdn.example.com/a.jpg',
				thumbnail_url: 'https://cdn.example.com/t.jpg',
				ctwa_clid: 'ctwa_123',
			},
		})

		expect(referral).toEqual({
			raw: {
				source_id: '1234567890',
				source_type: 'ad',
				source_url: 'https://facebook.com',
				headline: 'Promo',
				body: 'Diskon',
				media_type: 'image',
				image_url: 'https://cdn.example.com/a.jpg',
				thumbnail_url: 'https://cdn.example.com/t.jpg',
				ctwa_clid: 'ctwa_123',
			},
			source_id: '1234567890',
			source_type: 'ad',
			source_url: 'https://facebook.com',
			headline: 'Promo',
			body: 'Diskon',
			media_type: 'image',
			image_url: 'https://cdn.example.com/a.jpg',
			video_url: null,
			thumbnail_url: 'https://cdn.example.com/t.jpg',
			ctwa_clid: 'ctwa_123',
		})
	})

	it('parses partial referral payload from message context', () => {
		const referral = __test__.normalizeWhatsAppReferral({
			id: 'wamid.partial',
			context: {
				referral: {
					source_id: '888888',
					source_type: 'post',
				},
			},
		})

		expect(referral).toEqual({
			raw: {
				source_id: '888888',
				source_type: 'post',
			},
			source_id: '888888',
			source_type: 'post',
			source_url: null,
			headline: null,
			body: null,
			media_type: null,
			image_url: null,
			video_url: null,
			thumbnail_url: null,
			ctwa_clid: null,
		})
	})

	it('keeps referral even when ctwa_clid is missing', () => {
		const referral = __test__.normalizeWhatsAppReferral({
			referral: {
				source_id: '999999',
				source_type: 'ad',
			},
		})
		expect(referral?.source_id).toBe('999999')
		expect(referral?.ctwa_clid).toBeNull()
	})

	it('builds CAPI user_data with ctwa_clid and hashed phone/email', () => {
		const userData = __test__.buildCapiUserData({
			ctwaClid: 'ctwa_1',
			phone: '+62 812-0000-1234',
			email: 'User@Example.COM',
		})

		expect(userData.ctwa_clid).toBe('ctwa_1')
		expect(Array.isArray(userData.ph)).toBe(true)
		expect(Array.isArray(userData.em)).toBe(true)
		expect(__test__.hasMinimumCapiUserData(userData)).toBe(true)
	})

	it('rejects empty CAPI user_data as minimum requirement', () => {
		const userData = __test__.buildCapiUserData({
			ctwaClid: null,
			phone: null,
			email: null,
		})

		expect(userData).toEqual({})
		expect(__test__.hasMinimumCapiUserData(userData)).toBe(false)
	})
})
