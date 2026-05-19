import { describe, expect, it } from 'bun:test'

import { analyzeTreatmentCatalogSource } from '../src/modules/knowledge/treatment-catalog-audit'

describe('Treatment catalog audit', () => {
	it('returns null when content is not treatment price catalog', () => {
		const audit = analyzeTreatmentCatalogSource({
			title: 'General info',
			content: 'Ini adalah informasi jam operasional cabang.',
		})

		expect(audit).toBeNull()
	})

	it('returns ok status for valid treatment catalog block', () => {
		const audit = analyzeTreatmentCatalogSource({
			title: 'HARGA TREATMENT',
			content: [
				'## IPL Acne https://files.cekat.ai/IPL_Acne_-_Flash_sale_DQXFEQ.png',
				'Harga Normal: 399rb',
				'Harga Normal Member: 359rb',
				'Harga Promo Flash Sale New Customer April (Khusus Customer Baru): 199rb',
			].join('\n'),
		})

		expect(audit).not.toBeNull()
		expect(audit?.status).toBe('ok')
		expect(audit?.treatment_count).toBe(1)
		expect(audit?.anomaly_count).toBe(0)
	})

	it('flags promo higher than normal as anomaly', () => {
		const audit = analyzeTreatmentCatalogSource({
			title: 'HARGA TREATMENT',
			content: [
				'## PRP Face https://files.cekat.ai/PRP_Face_-_flash_sale_X33agE.png',
				'Harga Normal (Non Member): 1.499rb',
				'Harga Normal Member: 1.399rb',
				'Harga Promo Flash Sale New Customer April (Khusus Customer Baru): 7999rb',
			].join('\n'),
		})

		expect(audit).not.toBeNull()
		expect(audit?.status).toBe('error')
		expect(audit?.anomaly_count).toBeGreaterThan(0)
		expect(audit?.summary.promo_higher_than_normal).toBe(1)
		expect(
			audit?.anomalies.some((item) => item.code === 'PROMO_HIGHER_THAN_NORMAL'),
		).toBe(true)
	})

	it('flags missing promo and missing image anomalies', () => {
		const audit = analyzeTreatmentCatalogSource({
			title: 'HARGA TREATMENT',
			content: [
				'## Pink Lips Laser',
				'Harga Normal: 499rb',
				'Harga Normal Member: 469rb',
			].join('\n'),
		})

		expect(audit).not.toBeNull()
		expect(audit?.status).toBe('warning')
		expect(audit?.summary.missing_promo).toBe(1)
		expect(audit?.summary.missing_image).toBe(1)
	})
})

