type CatalogSeverity = 'warning' | 'error'

export type TreatmentCatalogAuditIssue = {
	code:
		| 'MISSING_IMAGE_URL'
		| 'MISSING_PROMO_PRICE'
		| 'PROMO_HIGHER_THAN_NORMAL'
		| 'PROMO_VALUE_OUTLIER'
		| 'DUPLICATE_TREATMENT'
	severity: CatalogSeverity
	treatment: string
	message: string
}

export type TreatmentCatalogAuditResult = {
	schema: 'treatment_catalog_audit.v1'
	generated_at: string
	treatment_count: number
	anomaly_count: number
	status: 'ok' | 'warning' | 'error'
	summary: {
		missing_image: number
		missing_promo: number
		promo_higher_than_normal: number
		promo_value_outlier: number
		duplicate_treatment: number
	}
	anomalies: TreatmentCatalogAuditIssue[]
	samples: Array<{
		name: string
		image_url: string | null
		promo: string | null
		normal_member: string | null
		normal: string | null
	}>
}

type ParsedCatalogEntry = {
	name: string
	normalizedName: string
	imageUrl: string | null
	promoAmount: number | null
	promoDisplay: string | null
	normalMemberAmount: number | null
	normalMemberDisplay: string | null
	normalAmount: number | null
	normalDisplay: string | null
}

function normalizeHtmlToPlainText(value: string): string {
	return String(value || '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/\r\n/g, '\n')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim()
}

function normalizeHttpUrl(value: string): string | null {
	const trimmed = String(value || '').trim()
	if (!trimmed) return null
	try {
		const parsed = new URL(trimmed)
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
		return parsed.toString()
	} catch {
		return null
	}
}

function isLikelyImageUrl(value: string): boolean {
	const normalized = String(value || '').toLowerCase()
	if (!normalized) return false
	if (!/^https?:\/\//.test(normalized)) return false
	if (/\.((png|jpe?g|gif|webp|svg|bmp|heic|avif))(?:$|[?#])/i.test(normalized)) {
		return true
	}
	return normalized.includes('files.cekat.ai')
}

function normalizeName(value: string): string {
	return String(value || '')
		.replace(/\u00a0/g, ' ')
		.toLowerCase()
		.replace(/[^a-z0-9\s/+&-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function cleanHeadingName(value: string): string {
	return String(value || '')
		.replace(/\u00a0/g, ' ')
		.replace(/^#{1,6}\s*/, '')
		.replace(/\s*[:|-]\s*$/, '')
		.replace(/\s+/g, ' ')
		.trim()
}

function parseHeadingLine(value: string): { name: string; imageUrl: string | null } | null {
	const raw = String(value || '').trim()
	if (!raw) return null
	if (/^harga\b/i.test(raw)) return null

	const noHash = raw.replace(/^#{1,6}\s*/, '').trim()
	if (!noHash) return null

	const withUrl = noHash.match(/^(.{2,180}?)(?:\s*:\s*|\s+)(https?:\/\/[^\s)]+)\s*$/i)
	if (withUrl?.[1]) {
		const name = cleanHeadingName(withUrl[1])
		const imageUrl = normalizeHttpUrl(withUrl[2] || '')
		return {
			name,
			imageUrl: imageUrl && isLikelyImageUrl(imageUrl) ? imageUrl : null,
		}
	}

	if (/^#{1,6}\s*/.test(raw)) {
		const name = cleanHeadingName(noHash)
		if (!name || name.length < 2) return null
		return {
			name,
			imageUrl: null,
		}
	}

	return null
}

function parsePriceAmount(value: string): { amount: number; display: string } | null {
	const line = String(value || '').trim()
	if (!line) return null

	const match =
		line.match(/(rp\.?\s*[0-9][0-9.,]*)/i) ||
		line.match(/([0-9][0-9.,]*\s*(?:rb|ribu|k))/i) ||
		line.match(/([0-9][0-9.,]{2,})/)
	if (!match?.[1]) return null

	const raw = String(match[1] || '').trim()
	const compact = raw.toLowerCase().replace(/\s+/g, '')
	const isThousandNotation = /(rb|ribu|k)$/.test(compact)
	const digits = compact.replace(/[^\d]/g, '')
	if (!digits) return null

	let amount = Number(digits)
	if (!Number.isFinite(amount) || amount <= 0) return null
	if (isThousandNotation) amount *= 1_000

	return {
		amount,
		display: `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`,
	}
}

function parseCatalogEntries(content: string): ParsedCatalogEntry[] {
	const lines = normalizeHtmlToPlainText(content)
		.split(/\n+/)
		.map((line) => line.trim())
		.filter(Boolean)
	if (lines.length === 0) return []

	const entries: ParsedCatalogEntry[] = []
	let current:
		| {
				name: string
				imageUrl: string | null
				promoAmount: number | null
				promoDisplay: string | null
				normalMemberAmount: number | null
				normalMemberDisplay: string | null
				normalAmount: number | null
				normalDisplay: string | null
		  }
		| null = null

	const flushCurrent = () => {
		if (!current) return
		const normalizedName = normalizeName(current.name)
		if (!normalizedName) {
			current = null
			return
		}
		const hasAnyPrice =
			current.promoAmount !== null ||
			current.normalMemberAmount !== null ||
			current.normalAmount !== null
		if (!hasAnyPrice) {
			current = null
			return
		}
		entries.push({
			name: current.name,
			normalizedName,
			imageUrl: current.imageUrl,
			promoAmount: current.promoAmount,
			promoDisplay: current.promoDisplay,
			normalMemberAmount: current.normalMemberAmount,
			normalMemberDisplay: current.normalMemberDisplay,
			normalAmount: current.normalAmount,
			normalDisplay: current.normalDisplay,
		})
		current = null
	}

	for (const line of lines) {
		const heading = parseHeadingLine(line)
		if (heading) {
			flushCurrent()
			current = {
				name: heading.name,
				imageUrl: heading.imageUrl,
				promoAmount: null,
				promoDisplay: null,
				normalMemberAmount: null,
				normalMemberDisplay: null,
				normalAmount: null,
				normalDisplay: null,
			}
			continue
		}

		if (!current) continue
		if (!current.imageUrl) {
			const urlMatch = line.match(/https?:\/\/[^\s)]+/i)
			const candidateUrl = normalizeHttpUrl(urlMatch?.[0] || '')
			if (candidateUrl && isLikelyImageUrl(candidateUrl)) {
				current.imageUrl = candidateUrl
			}
		}

		if (!/harga/i.test(line)) continue
		const parsed = parsePriceAmount(line)
		if (!parsed) continue

		const lower = line.toLowerCase()
		if (/harga\s+promo/.test(lower)) {
			if (current.promoAmount === null) {
				current.promoAmount = parsed.amount
				current.promoDisplay = parsed.display
			}
			continue
		}
		if (/harga\s+normal\s+member/.test(lower)) {
			if (current.normalMemberAmount === null) {
				current.normalMemberAmount = parsed.amount
				current.normalMemberDisplay = parsed.display
			}
			continue
		}
		if (/harga\s+normal/.test(lower)) {
			if (current.normalAmount === null) {
				current.normalAmount = parsed.amount
				current.normalDisplay = parsed.display
			}
		}
	}

	flushCurrent()
	return entries
}

export function analyzeTreatmentCatalogSource(args: {
	title?: string | null
	content?: string | null
}): TreatmentCatalogAuditResult | null {
	const sourceText = [args.title || '', args.content || ''].filter(Boolean).join('\n')
	const entries = parseCatalogEntries(sourceText)
	if (entries.length === 0) return null

	const duplicateCountByName = new Map<string, number>()
	for (const entry of entries) {
		duplicateCountByName.set(
			entry.normalizedName,
			(duplicateCountByName.get(entry.normalizedName) || 0) + 1,
		)
	}

	const anomalies: TreatmentCatalogAuditIssue[] = []
	const summary = {
		missing_image: 0,
		missing_promo: 0,
		promo_higher_than_normal: 0,
		promo_value_outlier: 0,
		duplicate_treatment: 0,
	}
	const duplicatedNames = new Set<string>()

	for (const entry of entries) {
		if (!entry.imageUrl) {
			summary.missing_image += 1
			anomalies.push({
				code: 'MISSING_IMAGE_URL',
				severity: 'warning',
				treatment: entry.name,
				message: `Treatment "${entry.name}" tidak memiliki URL gambar valid.`,
			})
		}

		if (entry.promoAmount === null) {
			summary.missing_promo += 1
			anomalies.push({
				code: 'MISSING_PROMO_PRICE',
				severity: 'warning',
				treatment: entry.name,
				message: `Treatment "${entry.name}" tidak memiliki Harga Promo.`,
			})
		}

		if (
			entry.promoAmount !== null &&
			entry.normalAmount !== null &&
			entry.promoAmount > entry.normalAmount
		) {
			summary.promo_higher_than_normal += 1
			anomalies.push({
				code: 'PROMO_HIGHER_THAN_NORMAL',
				severity: 'error',
				treatment: entry.name,
				message: `Harga promo (${entry.promoDisplay}) lebih tinggi dari harga normal (${entry.normalDisplay}).`,
			})
		}

		if (entry.promoAmount !== null && entry.promoAmount > 5_000_000) {
			summary.promo_value_outlier += 1
			anomalies.push({
				code: 'PROMO_VALUE_OUTLIER',
				severity: 'warning',
				treatment: entry.name,
				message: `Harga promo (${entry.promoDisplay}) terdeteksi outlier (di atas Rp 5.000.000).`,
			})
		}

		const duplicateCount = duplicateCountByName.get(entry.normalizedName) || 0
		if (duplicateCount > 1 && !duplicatedNames.has(entry.normalizedName)) {
			duplicatedNames.add(entry.normalizedName)
			summary.duplicate_treatment += 1
			anomalies.push({
				code: 'DUPLICATE_TREATMENT',
				severity: 'warning',
				treatment: entry.name,
				message: `Treatment "${entry.name}" duplikat (${duplicateCount} kali).`,
			})
		}
	}

	const hasError = anomalies.some((item) => item.severity === 'error')
	return {
		schema: 'treatment_catalog_audit.v1',
		generated_at: new Date().toISOString(),
		treatment_count: entries.length,
		anomaly_count: anomalies.length,
		status: hasError ? 'error' : anomalies.length > 0 ? 'warning' : 'ok',
		summary,
		anomalies: anomalies.slice(0, 100),
		samples: entries.slice(0, 30).map((entry) => ({
			name: entry.name,
			image_url: entry.imageUrl,
			promo: entry.promoDisplay,
			normal_member: entry.normalMemberDisplay,
			normal: entry.normalDisplay,
		})),
	}
}

