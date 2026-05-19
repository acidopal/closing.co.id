import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	AlertCircle,
	Check,
	CheckCircle2,
	ChevronDown,
	CircleDot,
	Clock3,
	Download,
	Eye,
	FileText,
	History,
	Keyboard,
	Loader2,
	RadioTower,
	Send,
	Upload,
	Users,
	Variable,
	X,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import {
	broadcasts as broadcastsApi,
	customers as customersApi,
	whatsappTemplates,
} from '@/lib/api'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/broadcast')({
	component: BroadcastPage,
})

type BroadcastStatus =
	| 'draft'
	| 'scheduled'
	| 'sending'
	| 'completed'
	| 'failed'
	| 'cancelled'

type RecipientMode = 'customers' | 'csv' | 'manual'

interface BroadcastItem {
	id: string
	title: string
	message_type?: 'text' | 'template'
	message_content?: string
	templateName?: string
	template_params?: Record<string, any>
	status?: string
	scheduled_at?: string | null
	total_recipients?: number
	totalRecipients?: number
	success_count?: number
	successCount?: number
	failed_count?: number
	failedCount?: number
	delivered_count?: number
	deliveredCount?: number
	read_count?: number
	readCount?: number
	created_at?: string | null
	createdAt?: string | null
	updated_at?: string | null
	updatedAt?: string | null
	completedAt?: string | null
}

interface WhatsAppTemplate {
	id: string
	name: string
	status: string
	category: string
	language: string
	components: Array<Record<string, any>>
}

interface CustomerOption {
	id: string
	name: string
	phone_number?: string | null
}

interface RecipientRow {
	phoneNumber: string
	variables: Record<string, string>
}

interface TemplateVariableField {
	key: string
	componentType: string
}

interface ParseCsvResult {
	headers: string[]
	rows: Array<Record<string, string>>
}

interface ParseCsvRecipientsResult {
	recipients: RecipientRow[]
	invalidPhoneRows: number
}

interface CsvValidationRow {
	recipient: RecipientRow
	missingKeys: string[]
	isValid: boolean
	preview: string
}

interface BroadcastResultRow {
	phoneNumber?: string
	success?: boolean
	status?: string
	messageId?: string
	error?: string
}

interface BroadcastJobDetail {
	id: string
	title?: string
	templateName?: string
	status?: string
	totalRecipients?: number
	successCount?: number
	failedCount?: number
	deliveredCount?: number
	readCount?: number
	createdAt?: string | null
	updatedAt?: string | null
	completedAt?: string | null
	results?: BroadcastResultRow[]
	csvData?: Array<Record<string, string>>
}

interface HistoryDetailRecipientRow {
	phoneNumber: string
	status: string
	success: boolean
	messageId: string
	error: string
}

interface FetchBroadcastOptions {
	statuses?: string[]
	showLoading?: boolean
	silent?: boolean
}

const PHONE_HEADER_ALIASES = new Set([
	'phonenumber',
	'phone_number',
	'phone',
	'number',
	'to',
	'whatsapp',
	'whatsappnumber',
])

const DELAY_OPTIONS = [
	{ value: 0, label: 'No delay (Highest Risk)' },
	{ value: 5, label: '5 seconds (Medium Risk)' },
	{ value: 15, label: '15 seconds (Safer)' },
	{ value: 30, label: '30 seconds (Recommended)' },
	{ value: 60, label: '60 seconds (Safest)' },
]
const CUSTOMERS_PER_PAGE = 5
const HISTORY_DETAIL_PAGE_SIZE = 20

const ACTIVE_JOB_STATUSES = ['DRAFT', 'SCHEDULED', 'PENDING', 'PROCESSING']
const HISTORY_JOB_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED']
const ONGOING_JOB_STATUSES = new Set(['PENDING', 'PROCESSING', 'SENDING'])
const ACTIVE_POLL_INTERVAL_MS = 4000

// Base estimate for Indonesia conversations. Update this map if pricing changes.
const WHATSAPP_CATEGORY_RATE_IDR: Record<string, number> = {
	MARKETING: 586.33,
	UTILITY: 586.33,
	AUTHENTICATION: 586.33,
}

function formatIdrAmount(value: number): string {
	return `IDR ${value.toLocaleString('id-ID', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`
}

function generateBroadcastTitle(templateName: string): string {
	const safeName = String(templateName || 'template').trim() || 'template'
	const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ')
	return `Broadcast ${safeName} ${timestamp}`
}

function formatBroadcastDate(value?: string | null): string {
	if (!value) return '-'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return '-'
	return date.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	})
}

function normalizeHistoryDetailResultStatus(row: BroadcastResultRow): string {
	const rawStatus = String(row.status || '')
		.trim()
		.toUpperCase()
	if (row.success === false) return 'FAILED'
	if (row.success === true) {
		if (rawStatus === 'FAILED') return 'FAILED'
		return 'SENT'
	}
	if (!rawStatus) return 'PENDING'
	if (rawStatus === 'SUCCESS') return 'SENT'
	if (rawStatus === 'DELIVERED') return 'DELIVERED'
	if (rawStatus === 'READ') return 'READ'
	return rawStatus
}

function getHistoryDetailStatusVisual(status: string): {
	label: string
	className: string
} {
	const normalized = String(status || 'PENDING').trim().toUpperCase()
	if (normalized === 'FAILED') {
		return {
			label: 'Failed',
			className: 'bg-red-100 text-red-700',
		}
	}
	if (normalized === 'DELIVERED') {
		return {
			label: 'Delivered',
			className: 'bg-blue-100 text-blue-700',
		}
	}
	if (normalized === 'READ') {
		return {
			label: 'Read',
			className: 'bg-violet-100 text-violet-700',
		}
	}
	if (normalized === 'SENT') {
		return {
			label: 'Sent',
			className: 'bg-emerald-100 text-emerald-700',
		}
	}
	if (normalized === 'CANCELLED') {
		return {
			label: 'Cancelled',
			className: 'bg-gray-100 text-gray-700',
		}
	}
	return {
		label: 'Pending',
		className: 'bg-amber-100 text-amber-700',
	}
}

function getStatusValue(rawStatus?: string): BroadcastStatus {
	const normalized = String(rawStatus || 'draft').toLowerCase()
	if (normalized === 'pending') return 'sending'
	if (normalized === 'processing') return 'sending'
	if (normalized === 'scheduled') return 'scheduled'
	if (normalized === 'sending') return 'sending'
	if (normalized === 'completed') return 'completed'
	if (normalized === 'failed') return 'failed'
	if (normalized === 'cancelled') return 'cancelled'
	return 'draft'
}

function findComponent(
	components: Array<Record<string, any>>,
	type: string,
): Record<string, any> | null {
	return components.find((item) => item?.type === type) || null
}

function getTemplateBodyPreview(template: WhatsAppTemplate): string {
	const bodyComponent = findComponent(template.components || [], 'BODY')
	const rawText = String(bodyComponent?.text || '')
		.replace(/\s+/g, ' ')
		.trim()
	if (!rawText) return ''
	const limit = 130
	if (rawText.length <= limit) return rawText
	return `${rawText.slice(0, limit).trim()}...`
}

function normalizeHeaderKey(value: string): string {
	return value.replace(/^\uFEFF/, '').toLowerCase().replace(/[\s_-]/g, '')
}

function normalizePhoneNumberInput(value: string): string {
	return value.replace(/[^\d+]/g, '').trim()
}

function escapeCsvCell(value: string): string {
	if (/[",\n]/.test(value)) {
		return `"${value.replace(/"/g, '""')}"`
	}
	return value
}

function normalizeVariableKey(value: string): string {
	const trimmed = value.trim()
	const match = trimmed.match(/^\{\{\s*(\d+)\s*\}\}$/)
	return match ? match[1] : trimmed
}

function sanitizeTemplateDefaults(
	defaultVariables: Record<string, string>,
): Record<string, string> {
	const result: Record<string, string> = {}
	for (const [key, value] of Object.entries(defaultVariables)) {
		const trimmedKey = String(key).trim()
		const trimmedValue = String(value || '').trim()
		if (!trimmedKey || !trimmedValue) continue
		result[trimmedKey] = trimmedValue
	}
	return result
}

function getSortedVariableEntries(
	variables: Record<string, string>,
): Array<[string, string]> {
	return Object.entries(variables).sort(([a], [b]) => {
		const isANumeric = /^\d+$/.test(a)
		const isBNumeric = /^\d+$/.test(b)
		if (isANumeric && isBNumeric) {
			return Number(a) - Number(b)
		}
		if (isANumeric) return -1
		if (isBNumeric) return 1
		return a.localeCompare(b)
	})
}

function getRecipientVariablePreview(variables: Record<string, string>): string {
	const values = getSortedVariableEntries(variables)
		.map(([, value]) => value.trim())
		.filter((value) => value.length > 0)
	if (values.length === 0) return ''
	return values.join(', ')
}

function parseCsvLine(line: string): string[] {
	const values: string[] = []
	let current = ''
	let inQuotes = false

	for (let index = 0; index < line.length; index += 1) {
		const char = line[index]
		if (char === '"') {
			if (inQuotes && line[index + 1] === '"') {
				current += '"'
				index += 1
			} else {
				inQuotes = !inQuotes
			}
			continue
		}

		if (char === ',' && !inQuotes) {
			values.push(current.trim())
			current = ''
			continue
		}

		current += char
	}

	values.push(current.trim())
	return values
}

function parseCsvText(input: string): ParseCsvResult {
	const lines = input
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)

	if (lines.length === 0) {
		throw new Error('CSV file is empty')
	}

	const headers = parseCsvLine(lines[0]).map((header) => header.trim())
	if (headers.length === 0) {
		throw new Error('CSV header is required')
	}

	const rows: Array<Record<string, string>> = []
	for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
		const cells = parseCsvLine(lines[lineIndex])
		const row: Record<string, string> = {}
		for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
			const key = headers[columnIndex]
			row[key] = cells[columnIndex]?.trim() || ''
		}
		rows.push(row)
	}

	return { headers, rows }
}

function findPhoneHeader(headers: string[]): string | null {
	return (
		headers.find((header) => PHONE_HEADER_ALIASES.has(normalizeHeaderKey(header))) ||
		null
	)
}

function dedupeRecipients(rows: RecipientRow[]): RecipientRow[] {
	const map = new Map<string, RecipientRow>()
	for (const row of rows) {
		const normalizedPhone = normalizePhoneNumberInput(row.phoneNumber)
		if (!normalizedPhone) continue
		if (!map.has(normalizedPhone)) {
			map.set(normalizedPhone, {
				phoneNumber: normalizedPhone,
				variables: row.variables,
			})
		}
	}
	return Array.from(map.values())
}

function extractTemplateVariables(
	template?: WhatsAppTemplate,
): TemplateVariableField[] {
	if (!template || !Array.isArray(template.components)) return []

	const variableMap = new Map<string, TemplateVariableField>()
	for (const component of template.components) {
		if (!component || typeof component !== 'object') continue
		if (typeof component.text !== 'string') continue
		const componentType = String(component.type || 'body').toLowerCase()
		const matches = component.text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)
		for (const match of matches) {
			const numeric = Number(match[1])
			if (Number.isFinite(numeric) && numeric > 0) {
				const key = String(numeric)
				if (!variableMap.has(key)) {
					variableMap.set(key, {
						key,
						componentType,
					})
				}
			}
		}
	}

	return Array.from(variableMap.values()).sort(
		(a, b) => Number(a.key) - Number(b.key),
	)
}

function toVariableComponentLabel(componentType: string): string {
	const normalized = componentType.trim().toLowerCase()
	if (!normalized) return 'body'
	if (normalized === 'buttons') return 'button'
	return normalized
}

function parseManualRecipients(
	input: string,
	templateVariableKeys: string[],
): { recipients: RecipientRow[]; rowErrors: string[] } {
	const lines = input
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)

	if (lines.length === 0) {
		return { recipients: [], rowErrors: [] }
	}

	const rowErrors: string[] = []
	const rows: RecipientRow[] = []

	lines.forEach((line, index) => {
		const columns = parseCsvLine(line)
		const phoneNumber = normalizePhoneNumberInput(columns[0] || '')
		if (!phoneNumber) {
			rowErrors.push(`Line ${index + 1} has no valid phone number`)
			return
		}

		const variables: Record<string, string> = {}
		for (let columnIndex = 1; columnIndex < columns.length; columnIndex += 1) {
			const value = columns[columnIndex]?.trim() || ''
			if (!value) continue
			const key = templateVariableKeys[columnIndex - 1] || String(columnIndex)
			variables[key] = value
		}

		rows.push({ phoneNumber, variables })
	})

	return { recipients: dedupeRecipients(rows), rowErrors }
}

function missingVariableKeys(
	recipientVariables: Record<string, string>,
	requiredKeys: string[],
	defaultVariables: Record<string, string>,
): string[] {
	return requiredKeys.filter((key) => {
		const value = (recipientVariables[key] || defaultVariables[key] || '').trim()
		return value.length === 0
	})
}

function BroadcastPage() {
	const [activeTab, setActiveTab] = useState<'create' | 'active' | 'history'>(
		'create',
	)
	const [loading, setLoading] = useState(true)
	const [templatesLoading, setTemplatesLoading] = useState(true)
	const [customersLoading, setCustomersLoading] = useState(true)
	const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([])
	const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
	const [customers, setCustomers] = useState<CustomerOption[]>([])

	const [selectedTemplateName, setSelectedTemplateName] = useState('')
	const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false)
	const [creating, setCreating] = useState(false)
	const [sendingId, setSendingId] = useState<string | null>(null)
	const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null)
	const [historyDetail, setHistoryDetail] = useState<BroadcastJobDetail | null>(
		null,
	)
	const [isHistoryDetailOpen, setIsHistoryDetailOpen] = useState(false)
	const [historyDetailStatusFilter, setHistoryDetailStatusFilter] =
		useState('ALL')
	const [historyDetailPage, setHistoryDetailPage] = useState(1)

	const [recipientMode, setRecipientMode] = useState<RecipientMode>('customers')
	const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
	const [customerSearch, setCustomerSearch] = useState('')
	const [customerPage, setCustomerPage] = useState(1)
	const [csvFileName, setCsvFileName] = useState('')
	const [csvRecipients, setCsvRecipients] = useState<RecipientRow[]>([])
	const [csvColumns, setCsvColumns] = useState<string[]>([])
	const [selectedCsvPhoneNumbers, setSelectedCsvPhoneNumbers] = useState<string[]>(
		[],
	)
	const [csvInvalidPhoneRows, setCsvInvalidPhoneRows] = useState(0)
	const [csvError, setCsvError] = useState<string | null>(null)
	const [manualInput, setManualInput] = useState('')
	const [delaySeconds, setDelaySeconds] = useState(5)
	const [defaultTemplateVariables, setDefaultTemplateVariables] = useState<
		Record<string, string>
	>({})

	const csvInputRef = useRef<HTMLInputElement | null>(null)
	const templateDropdownRef = useRef<HTMLDivElement | null>(null)
	const hadOngoingActiveJobRef = useRef(false)

	const selectedTemplate = useMemo(
		() => templates.find((template) => template.name === selectedTemplateName),
		[templates, selectedTemplateName],
	)

	const templateVariableFields = useMemo(
		() => extractTemplateVariables(selectedTemplate),
		[selectedTemplate],
	)
	const templateVariableKeys = useMemo(
		() => templateVariableFields.map((field) => field.key),
		[templateVariableFields],
	)
	const missingDefaultKeys = useMemo(
		() =>
			templateVariableKeys.filter(
				(key) => String(defaultTemplateVariables[key] || '').trim().length === 0,
			),
		[templateVariableKeys, defaultTemplateVariables],
	)

	const bodyComponent = useMemo(
		() =>
			selectedTemplate ? findComponent(selectedTemplate.components, 'BODY') : null,
		[selectedTemplate],
	)
	const headerComponent = useMemo(
		() =>
			selectedTemplate
				? findComponent(selectedTemplate.components, 'HEADER')
				: null,
		[selectedTemplate],
	)
	const footerComponent = useMemo(
		() =>
			selectedTemplate
				? findComponent(selectedTemplate.components, 'FOOTER')
				: null,
		[selectedTemplate],
	)
	const buttonComponent = useMemo(
		() =>
			selectedTemplate
				? findComponent(selectedTemplate.components, 'BUTTONS')
				: null,
		[selectedTemplate],
	)

	const manualParsed = useMemo(
		() => parseManualRecipients(manualInput, templateVariableKeys),
		[manualInput, templateVariableKeys],
	)

	const filteredCustomers = useMemo(() => {
		const query = customerSearch.trim().toLowerCase()
		return customers
			.filter((customer) => (customer.phone_number || '').trim().length > 0)
			.filter((customer) => {
				if (!query) return true
				const candidate = `${customer.name || ''} ${customer.phone_number || ''}`.toLowerCase()
				return candidate.includes(query)
			})
	}, [customers, customerSearch])
	const customerTotalPages = useMemo(
		() => Math.max(1, Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE)),
		[filteredCustomers],
	)
	const paginatedCustomers = useMemo(() => {
		const page = Math.min(customerPage, customerTotalPages)
		const startIndex = (page - 1) * CUSTOMERS_PER_PAGE
		return filteredCustomers.slice(startIndex, startIndex + CUSTOMERS_PER_PAGE)
	}, [filteredCustomers, customerPage, customerTotalPages])
	const customerPageStart = useMemo(() => {
		if (filteredCustomers.length === 0) return 0
		return (Math.min(customerPage, customerTotalPages) - 1) * CUSTOMERS_PER_PAGE + 1
	}, [filteredCustomers.length, customerPage, customerTotalPages])
	const customerPageEnd = useMemo(() => {
		if (filteredCustomers.length === 0) return 0
		return Math.min(
			Math.min(customerPage, customerTotalPages) * CUSTOMERS_PER_PAGE,
			filteredCustomers.length,
		)
	}, [filteredCustomers.length, customerPage, customerTotalPages])
	const visibleCustomerIds = useMemo(
		() => filteredCustomers.map((customer) => customer.id),
		[filteredCustomers],
	)
	const selectedVisibleCustomerCount = useMemo(() => {
		const visibleSet = new Set(visibleCustomerIds)
		return selectedCustomerIds.filter((id) => visibleSet.has(id)).length
	}, [visibleCustomerIds, selectedCustomerIds])
	const allVisibleCustomersSelected = useMemo(
		() =>
			visibleCustomerIds.length > 0 &&
			selectedVisibleCustomerCount === visibleCustomerIds.length,
		[visibleCustomerIds, selectedVisibleCustomerCount],
	)

	const sanitizedDefaultVariables = useMemo(
		() => sanitizeTemplateDefaults(defaultTemplateVariables),
		[defaultTemplateVariables],
	)

	const csvVariableColumns = useMemo(() => {
		const phoneHeader = findPhoneHeader(csvColumns)
		const columns = csvColumns
			.filter((header) => header !== phoneHeader)
			.map((header) => normalizeVariableKey(header))
			.filter((header) => header.length > 0)
		return Array.from(new Set(columns))
	}, [csvColumns])

	const csvValidationRows = useMemo<CsvValidationRow[]>(() => {
		return csvRecipients.map((recipient) => {
			const missingKeys = missingVariableKeys(
				recipient.variables,
				templateVariableKeys,
				sanitizedDefaultVariables,
			)
			return {
				recipient,
				missingKeys,
				isValid: missingKeys.length === 0,
				preview: getRecipientVariablePreview(recipient.variables),
			}
		})
	}, [csvRecipients, templateVariableKeys, sanitizedDefaultVariables])

	const validCsvRows = useMemo(
		() => csvValidationRows.filter((row) => row.isValid),
		[csvValidationRows],
	)
	const invalidCsvRows = useMemo(
		() => csvValidationRows.filter((row) => !row.isValid),
		[csvValidationRows],
	)
	const invalidCsvMissingKeys = useMemo(() => {
		const keys = new Set<string>()
		for (const row of invalidCsvRows) {
			for (const key of row.missingKeys) {
				keys.add(key)
			}
		}
		return Array.from(keys).sort((a, b) => {
			const isANumeric = /^\d+$/.test(a)
			const isBNumeric = /^\d+$/.test(b)
			if (isANumeric && isBNumeric) return Number(a) - Number(b)
			if (isANumeric) return -1
			if (isBNumeric) return 1
			return a.localeCompare(b)
		})
	}, [invalidCsvRows])
	const validCsvPhoneNumbers = useMemo(
		() => validCsvRows.map((row) => row.recipient.phoneNumber),
		[validCsvRows],
	)

	const selectedCsvRecipients = useMemo(() => {
		const selectedSet = new Set(selectedCsvPhoneNumbers)
		return validCsvRows
			.filter((row) => selectedSet.has(row.recipient.phoneNumber))
			.map((row) => row.recipient)
	}, [validCsvRows, selectedCsvPhoneNumbers])

	const selectedRecipientCount = useMemo(() => {
		if (recipientMode === 'customers') return selectedCustomerIds.length
		if (recipientMode === 'csv') return selectedCsvRecipients.length
		return manualParsed.recipients.length
	}, [recipientMode, selectedCustomerIds, selectedCsvRecipients, manualParsed])
	const selectedTemplateCategory = useMemo(
		() => String(selectedTemplate?.category || '').toUpperCase(),
		[selectedTemplate],
	)
	const selectedTemplateCategoryLabel = useMemo(
		() => (selectedTemplateCategory ? selectedTemplateCategory : 'SELECT TEMPLATE'),
		[selectedTemplateCategory],
	)
	const estimatedRatePerRecipient = useMemo(() => {
		if (!selectedTemplateCategory) return 0
		return (
			WHATSAPP_CATEGORY_RATE_IDR[selectedTemplateCategory] ||
			WHATSAPP_CATEGORY_RATE_IDR.MARKETING
		)
	}, [selectedTemplateCategory])
	const estimatedBroadcastCost = useMemo(
		() => selectedRecipientCount * estimatedRatePerRecipient,
		[selectedRecipientCount, estimatedRatePerRecipient],
	)
	const historyDetailRows = useMemo<HistoryDetailRecipientRow[]>(() => {
		if (!historyDetail) return []

		const mappedFromResults = (Array.isArray(historyDetail.results)
			? historyDetail.results
			: []
		)
			.map((row) => {
				const phoneNumber = String(row.phoneNumber || '').trim()
				if (!phoneNumber) return null
				return {
					phoneNumber,
					status: normalizeHistoryDetailResultStatus(row),
					success: Boolean(row.success),
					messageId: String(row.messageId || '').trim(),
					error: String(row.error || '').trim(),
				}
			})
			.filter(
				(row): row is HistoryDetailRecipientRow =>
					row !== null && row.phoneNumber.length > 0,
			)

		if (mappedFromResults.length > 0) return mappedFromResults

		return (Array.isArray(historyDetail.csvData) ? historyDetail.csvData : [])
			.map((row) => {
				const phoneNumber = String(row.phoneNumber || '').trim()
				if (!phoneNumber) return null
				return {
					phoneNumber,
					status: 'PENDING',
					success: false,
					messageId: '',
					error: '',
				}
			})
			.filter(
				(row): row is HistoryDetailRecipientRow =>
					row !== null && row.phoneNumber.length > 0,
			)
	}, [historyDetail])
	const historyDetailStatusCounts = useMemo(() => {
		const counts: Record<string, number> = {}
		for (const row of historyDetailRows) {
			const status = String(row.status || 'PENDING').toUpperCase()
			counts[status] = (counts[status] || 0) + 1
		}
		return counts
	}, [historyDetailRows])
	const historyDetailFilterOptions = useMemo(() => {
		const orderedStatuses = [
			'SENT',
			'DELIVERED',
			'READ',
			'PENDING',
			'FAILED',
			'CANCELLED',
		]
		const options: Array<{ value: string; label: string }> = [
			{ value: 'ALL', label: `All (${historyDetailRows.length})` },
		]
		for (const status of orderedStatuses) {
			const count = historyDetailStatusCounts[status] || 0
			if (count <= 0) continue
			const visual = getHistoryDetailStatusVisual(status)
			options.push({
				value: status,
				label: `${visual.label} (${count})`,
			})
		}
		return options
	}, [historyDetailRows.length, historyDetailStatusCounts])
	const filteredHistoryDetailRows = useMemo(() => {
		if (historyDetailStatusFilter === 'ALL') return historyDetailRows
		return historyDetailRows.filter(
			(row) =>
				String(row.status || '').toUpperCase() === historyDetailStatusFilter,
		)
	}, [historyDetailRows, historyDetailStatusFilter])
	const historyDetailTotalPages = useMemo(
		() =>
			Math.max(
				1,
				Math.ceil(filteredHistoryDetailRows.length / HISTORY_DETAIL_PAGE_SIZE),
			),
		[filteredHistoryDetailRows.length],
	)
	const paginatedHistoryDetailRows = useMemo(() => {
		const page = Math.min(historyDetailPage, historyDetailTotalPages)
		const startIndex = (page - 1) * HISTORY_DETAIL_PAGE_SIZE
		return filteredHistoryDetailRows.slice(
			startIndex,
			startIndex + HISTORY_DETAIL_PAGE_SIZE,
		)
	}, [filteredHistoryDetailRows, historyDetailPage, historyDetailTotalPages])
	const historyDetailPageStart = useMemo(() => {
		if (filteredHistoryDetailRows.length === 0) return 0
		return (
			(Math.min(historyDetailPage, historyDetailTotalPages) - 1) *
				HISTORY_DETAIL_PAGE_SIZE +
			1
		)
	}, [filteredHistoryDetailRows.length, historyDetailPage, historyDetailTotalPages])
	const historyDetailPageEnd = useMemo(() => {
		if (filteredHistoryDetailRows.length === 0) return 0
		return Math.min(
			Math.min(historyDetailPage, historyDetailTotalPages) *
				HISTORY_DETAIL_PAGE_SIZE,
			filteredHistoryDetailRows.length,
		)
	}, [filteredHistoryDetailRows.length, historyDetailPage, historyDetailTotalPages])
	const historyDetailTotalRecipients = useMemo(() => {
		if (!historyDetail) return 0
		const fromApi = Number(historyDetail.totalRecipients ?? 0)
		if (fromApi > 0) return fromApi
		return historyDetailRows.length
	}, [historyDetail, historyDetailRows.length])
	const historyDetailSuccessCount = useMemo(() => {
		if (!historyDetail) return 0
		const fromApi = Number(historyDetail.successCount ?? 0)
		if (fromApi > 0) return fromApi
		return historyDetailRows.filter((row) => row.success).length
	}, [historyDetail, historyDetailRows])
	const historyDetailFailedCount = useMemo(() => {
		if (!historyDetail) return 0
		const fromApi = Number(historyDetail.failedCount ?? 0)
		if (fromApi > 0 || historyDetailRows.length === 0) return fromApi
		return historyDetailRows.filter(
			(row) => String(row.status).toUpperCase() === 'FAILED',
		).length
	}, [historyDetail, historyDetailRows])
	const historyDetailDeliveredCount = useMemo(() => {
		if (!historyDetail) return 0
		const fromApi = Number(historyDetail.deliveredCount ?? 0)
		if (fromApi > 0 || historyDetailRows.length === 0) return fromApi
		return historyDetailRows.filter(
			(row) => String(row.status).toUpperCase() === 'DELIVERED',
		).length
	}, [historyDetail, historyDetailRows])
	const historyDetailReadCount = useMemo(() => {
		if (!historyDetail) return 0
		const fromApi = Number(historyDetail.readCount ?? 0)
		if (fromApi > 0 || historyDetailRows.length === 0) return fromApi
		return historyDetailRows.filter(
			(row) => String(row.status).toUpperCase() === 'READ',
		).length
	}, [historyDetail, historyDetailRows])
	const historyDetailDeliveryRate = useMemo(() => {
		if (historyDetailTotalRecipients <= 0) return 0
		return Math.round(
			(Math.max(historyDetailSuccessCount, 0) / historyDetailTotalRecipients) *
				100,
		)
	}, [historyDetailSuccessCount, historyDetailTotalRecipients])

	const activeJobs = useMemo(
		() =>
			broadcasts.filter((item) => {
				const status = getStatusValue(item.status)
				return (
					status === 'draft' || status === 'scheduled' || status === 'sending'
				)
			}),
		[broadcasts],
	)

	const historyJobs = useMemo(
		() =>
			broadcasts.filter((item) => {
				const status = getStatusValue(item.status)
				return (
					status === 'completed' || status === 'failed' || status === 'cancelled'
				)
			}),
		[broadcasts],
	)

	useEffect(() => {
		setDefaultTemplateVariables((prev) => {
			const next: Record<string, string> = {}
			for (const key of templateVariableKeys) {
				next[key] = prev[key] || ''
			}
			return next
		})
	}, [templateVariableKeys])

	useEffect(() => {
		const validSet = new Set(validCsvPhoneNumbers)
		setSelectedCsvPhoneNumbers((prev) =>
			prev.filter((phoneNumber) => validSet.has(phoneNumber)),
		)
	}, [validCsvPhoneNumbers])

	useEffect(() => {
		setCustomerPage(1)
	}, [customerSearch])

	useEffect(() => {
		setCustomerPage((prev) => Math.min(prev, customerTotalPages))
	}, [customerTotalPages])

	useEffect(() => {
		setHistoryDetailPage(1)
	}, [historyDetailStatusFilter, historyDetail?.id])

	useEffect(() => {
		setHistoryDetailPage((prev) => Math.min(prev, historyDetailTotalPages))
	}, [historyDetailTotalPages])

	useEffect(() => {
		if (!isTemplateDropdownOpen) return

		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node | null
			if (!target) return
			if (templateDropdownRef.current?.contains(target)) return
			setIsTemplateDropdownOpen(false)
		}

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return
			setIsTemplateDropdownOpen(false)
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEscape)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isTemplateDropdownOpen])

	useEffect(() => {
		if (!isHistoryDetailOpen) return
		const originalOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return
			setIsHistoryDetailOpen(false)
		}

		document.addEventListener('keydown', handleEscape)
		return () => {
			document.body.style.overflow = originalOverflow
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isHistoryDetailOpen])

	const fetchBroadcasts = useCallback(
		async (
			options: FetchBroadcastOptions = {},
		): Promise<BroadcastItem[] | null> => {
			const { statuses, showLoading = true, silent = false } = options
			if (showLoading) {
				setLoading(true)
			}
			try {
				const response = await broadcastsApi.listJobs({
					page: 1,
					limit: 100,
					status: statuses,
				})
				if (response.success) {
					const items = (response.payload || []) as BroadcastItem[]
					setBroadcasts(items)
					return items
				}
				return []
			} catch (error: any) {
				if (!silent) {
					toast.error(error?.message || 'Failed to load broadcasts')
				}
				return null
			} finally {
				if (showLoading) {
					setLoading(false)
				}
			}
		},
		[],
	)

	const fetchTemplates = async () => {
		setTemplatesLoading(true)
		try {
			const response = await whatsappTemplates.list('APPROVED')
			if (response.success) {
				setTemplates((response.data || []) as WhatsAppTemplate[])
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to load templates')
		} finally {
			setTemplatesLoading(false)
		}
	}

	const fetchCustomers = async () => {
		setCustomersLoading(true)
		try {
			const response: any = await customersApi.list({ per_page: 100 })
			setCustomers((response?.payload || []) as CustomerOption[])
		} catch (error: any) {
			toast.error(error?.message || 'Failed to load customers')
		} finally {
			setCustomersLoading(false)
		}
	}

	useEffect(() => {
		fetchTemplates()
		fetchCustomers()
	}, [])

	useEffect(() => {
		if (activeTab !== 'history') return
		void fetchBroadcasts({
			statuses: HISTORY_JOB_STATUSES,
			showLoading: true,
		})
	}, [activeTab, fetchBroadcasts])

	useEffect(() => {
		if (activeTab !== 'active') return

		let cancelled = false
		let firstPoll = true

		const pollActiveJobs = async () => {
			const jobs = await fetchBroadcasts({
				statuses: ACTIVE_JOB_STATUSES,
				showLoading: firstPoll,
				silent: !firstPoll,
			})
			firstPoll = false
			if (cancelled || !jobs) return

			const hasOngoing = jobs.some((job) =>
				ONGOING_JOB_STATUSES.has(String(job.status || '').trim().toUpperCase()),
			)

			if (hasOngoing) {
				hadOngoingActiveJobRef.current = true
				return
			}

			if (!hadOngoingActiveJobRef.current) return

			hadOngoingActiveJobRef.current = false
			setActiveTab('history')
		}

		void pollActiveJobs()
		const timer = window.setInterval(() => {
			void pollActiveJobs()
		}, ACTIVE_POLL_INTERVAL_MS)

		return () => {
			cancelled = true
			window.clearInterval(timer)
		}
	}, [activeTab, fetchBroadcasts])

	const handleTemplateChange = (name: string) => {
		setSelectedTemplateName(name)
		setIsTemplateDropdownOpen(false)
		setCustomerPage(1)
	}

	const toggleCustomerSelection = (customerId: string) => {
		setSelectedCustomerIds((prev) =>
			prev.includes(customerId)
				? prev.filter((id) => id !== customerId)
				: [...prev, customerId],
		)
	}

	const handleSelectAllVisibleCustomers = () => {
		if (visibleCustomerIds.length === 0) return
		setSelectedCustomerIds((prev) =>
			Array.from(new Set([...prev, ...visibleCustomerIds])),
		)
	}

	const handleDeselectAllVisibleCustomers = () => {
		if (visibleCustomerIds.length === 0) return
		const visibleSet = new Set(visibleCustomerIds)
		setSelectedCustomerIds((prev) => prev.filter((id) => !visibleSet.has(id)))
	}

	const toggleCsvRecipientSelection = (phoneNumber: string) => {
		setSelectedCsvPhoneNumbers((prev) =>
			prev.includes(phoneNumber)
				? prev.filter((item) => item !== phoneNumber)
				: [...prev, phoneNumber],
		)
	}

	const handleSelectAllCsvRecipients = () => {
		setSelectedCsvPhoneNumbers(validCsvPhoneNumbers)
	}

	const handleDeselectAllCsvRecipients = () => {
		setSelectedCsvPhoneNumbers([])
	}

	const handleClearCsv = () => {
		if (csvInputRef.current) {
			csvInputRef.current.value = ''
		}
		setCsvFileName('')
		setCsvColumns([])
		setCsvRecipients([])
		setSelectedCsvPhoneNumbers([])
		setCsvInvalidPhoneRows(0)
		setCsvError(null)
	}

	const parseCsvRecipients = (
		csv: ParseCsvResult,
	): ParseCsvRecipientsResult => {
		const phoneHeader = findPhoneHeader(csv.headers)
		if (!phoneHeader) {
			throw new Error('CSV must include phoneNumber column')
		}

		let invalidPhoneRows = 0
		const recipients: RecipientRow[] = []

		for (const row of csv.rows) {
			const phoneNumber = normalizePhoneNumberInput(row[phoneHeader] || '')
			if (!phoneNumber) {
				invalidPhoneRows += 1
				continue
			}

			const variables: Record<string, string> = {}
			for (const header of csv.headers) {
				if (header === phoneHeader) continue
				const value = (row[header] || '').trim()
				if (!value) continue
				variables[normalizeVariableKey(header)] = value
			}

			recipients.push({
				phoneNumber,
				variables,
			})
		}

		return {
			recipients: dedupeRecipients(recipients),
			invalidPhoneRows,
		}
	}

	const handleCsvFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		try {
			const content = await file.text()
			const parsed = parseCsvText(content)
			const csvResult = parseCsvRecipients(parsed)
			const recipients = csvResult.recipients

			if (recipients.length === 0) {
				throw new Error('No valid recipients found in CSV')
			}

			setCsvFileName(file.name)
			setCsvColumns(parsed.headers)
			setCsvRecipients(recipients)
			setSelectedCsvPhoneNumbers(recipients.map((item) => item.phoneNumber))
			setCsvInvalidPhoneRows(csvResult.invalidPhoneRows)
			setCsvError(null)
			toast.success(
				`${recipients.length} recipients loaded from CSV${
					csvResult.invalidPhoneRows > 0
						? ` (${csvResult.invalidPhoneRows} rows skipped)`
						: ''
				}`,
			)
		} catch (error: any) {
			handleClearCsv()
			setCsvError(error?.message || 'Failed to parse CSV file')
			toast.error(error?.message || 'Failed to parse CSV file')
		}
	}

	const handleDownloadTemplate = () => {
		const variableHeaders =
			templateVariableKeys.length > 0 ? templateVariableKeys : ['1', '2']
		const headers = ['phoneNumber', ...variableHeaders]

		const row1Values = variableHeaders.map((key, index) => {
			if (index === 0) return 'John'
			if (index === 1) return 'PROMO123'
			return `value_${key}`
		})
		const row2Values = variableHeaders.map((key, index) => {
			if (index === 0) return 'Jane'
			if (index === 1) return 'SALE2024'
			return `value_${key}`
		})

		const rows = [
			headers,
			['+6281234567890', ...row1Values],
			['+6289876543210', ...row2Values],
		]
			.map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
			.join('\n')

		const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = 'broadcast_template.csv'
		link.click()
		URL.revokeObjectURL(url)
	}

	const handleSendNow = async (broadcastId: string) => {
		setSendingId(broadcastId)
		try {
			const response = await broadcastsApi.send(broadcastId)
			if (response.success) {
				toast.success('Broadcast queued for delivery')
				hadOngoingActiveJobRef.current = true
				setActiveTab('active')
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to send broadcast')
		} finally {
			setSendingId(null)
		}
	}

	const validateRequiredVariables = (
		recipients: RecipientRow[],
		requiredKeys: string[],
		defaults: Record<string, string>,
	): string | null => {
		if (requiredKeys.length === 0) return null

		const firstMissing = recipients.findIndex((recipient) => {
			const missing = missingVariableKeys(recipient.variables, requiredKeys, defaults)
			return missing.length > 0
		})

		if (firstMissing >= 0) {
			const missing = missingVariableKeys(
				recipients[firstMissing].variables,
				requiredKeys,
				defaults,
			)
			return `Missing variables for recipient #${firstMissing + 1}: ${missing
				.map((key) => `{{${key}}}`)
				.join(', ')}`
		}

		return null
	}

	const handleCreateBroadcast = async (sendNow: boolean) => {
		if (!selectedTemplate) {
			toast.error('Please select an approved Meta template')
			return
		}

		const defaultVariables = sanitizedDefaultVariables
		const shouldAttachBodyComponent =
			templateVariableKeys.length > 0 || Object.keys(defaultVariables).length > 0
		let targetAudience: Record<string, any> = {
			type: 'contacts',
			contactIds: [],
			delaySeconds,
		}
		let recipientsForValidation: RecipientRow[] = []

		if (recipientMode === 'customers') {
			if (selectedCustomerIds.length === 0) {
				toast.error('Select at least one customer recipient')
				return
			}
			targetAudience = {
				type: 'contacts',
				contactIds: selectedCustomerIds,
				delaySeconds,
			}
			recipientsForValidation = selectedCustomerIds.map(() => ({
				phoneNumber: '',
				variables: {},
			}))
		}

		if (recipientMode === 'csv') {
			if (csvRecipients.length === 0) {
				toast.error('Upload a CSV file with at least one recipient')
				return
			}
			if (selectedCsvRecipients.length === 0) {
				toast.error('Select at least one valid CSV recipient')
				return
			}
			targetAudience = {
				type: 'numbers',
				source: 'csv',
				recipients: selectedCsvRecipients,
				columns: csvColumns,
				delaySeconds,
			}
			recipientsForValidation = selectedCsvRecipients
		}

		if (recipientMode === 'manual') {
			if (manualParsed.rowErrors.length > 0) {
				toast.error(manualParsed.rowErrors[0])
				return
			}
			if (manualParsed.recipients.length === 0) {
				toast.error('Enter at least one valid phone number')
				return
			}
			targetAudience = {
				type: 'numbers',
				source: 'manual',
				recipients: manualParsed.recipients,
				delaySeconds,
			}
			recipientsForValidation = manualParsed.recipients
		}

		const variableError = validateRequiredVariables(
			recipientsForValidation,
			templateVariableKeys,
			defaultVariables,
		)
		if (variableError) {
			toast.error(variableError)
			return
		}

		setCreating(true)
		try {
			const payload = await broadcastsApi.create({
				title: generateBroadcastTitle(selectedTemplate.name),
				message_type: 'template',
				message_content: selectedTemplate.name,
				template_name: selectedTemplate.name,
				template_language: selectedTemplate.language || 'en_US',
				template_params: {
					template_name: selectedTemplate.name,
					language: selectedTemplate.language || 'en_US',
					components: shouldAttachBodyComponent
						? [
								{
									type: 'body',
									parameters: [],
								},
							]
						: [],
					...(Object.keys(defaultVariables).length > 0
						? { variable_defaults: defaultVariables }
						: {}),
				},
				target_audience: targetAudience,
			})

			const createdBroadcast = payload?.payload
			if (sendNow && createdBroadcast?.id) {
				await broadcastsApi.send(createdBroadcast.id)
				toast.success('Broadcast created and queued')
			} else {
				toast.success('Broadcast created')
			}

			setSelectedTemplateName('')
			setIsTemplateDropdownOpen(false)
			setRecipientMode('customers')
			setSelectedCustomerIds([])
			setCustomerSearch('')
			setCustomerPage(1)
			setCsvFileName('')
			setCsvRecipients([])
			setCsvColumns([])
			setSelectedCsvPhoneNumbers([])
			setCsvInvalidPhoneRows(0)
			setCsvError(null)
			setManualInput('')
			setDefaultTemplateVariables({})

			if (sendNow) {
				hadOngoingActiveJobRef.current = true
				setActiveTab('active')
			} else {
				setActiveTab('create')
			}
		} catch (error: any) {
			toast.error(error?.message || 'Failed to create broadcast')
		} finally {
			setCreating(false)
		}
	}

	const renderStatusBadge = (statusRaw?: string) => {
		const status = getStatusValue(statusRaw)
		const styleMap: Record<BroadcastStatus, string> = {
			draft: 'bg-slate-100 text-slate-700 border-slate-200',
			scheduled: 'bg-amber-100 text-amber-800 border-amber-200',
			sending: 'bg-blue-100 text-blue-800 border-blue-200',
			completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
			failed: 'bg-red-100 text-red-800 border-red-200',
			cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
		}

		return (
			<span
				className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${styleMap[status]}`}
			>
				{status}
			</span>
		)
	}

	const getTemplateName = (item: BroadcastItem) =>
		String(item.templateName || item.message_content || '-')
	const getTotalRecipients = (item: BroadcastItem) =>
		Number(item.totalRecipients ?? item.total_recipients ?? 0)
	const getSuccessCount = (item: BroadcastItem) =>
		Number(item.successCount ?? item.success_count ?? 0)
	const getFailedCount = (item: BroadcastItem) =>
		Number(item.failedCount ?? item.failed_count ?? 0)
	const getDeliveredCount = (item: BroadcastItem) =>
		Number(item.deliveredCount ?? item.delivered_count ?? 0)
	const getReadCount = (item: BroadcastItem) =>
		Number(item.readCount ?? item.read_count ?? 0)

	const handleViewHistoryDetails = async (broadcastId: string) => {
		setViewingHistoryId(broadcastId)
		try {
			const response = await broadcastsApi.getJob(broadcastId)
			if (!response.success || !response.payload) {
				throw new Error('Failed to load broadcast detail')
			}
			setHistoryDetail(response.payload as BroadcastJobDetail)
			setHistoryDetailStatusFilter('ALL')
			setHistoryDetailPage(1)
			setIsHistoryDetailOpen(true)
		} catch (error: any) {
			toast.error(error?.message || 'Failed to load broadcast detail')
		} finally {
			setViewingHistoryId(null)
		}
	}

	const closeHistoryDetailModal = () => {
		setIsHistoryDetailOpen(false)
	}

	const handleExportHistoryDetail = () => {
		if (!historyDetail) return
		if (filteredHistoryDetailRows.length === 0) {
			toast.error('No recipient rows to export')
			return
		}

		const headers = ['phoneNumber', 'status', 'success', 'messageId', 'error']
		const csvContent = [headers, ...filteredHistoryDetailRows.map((row) => [
			row.phoneNumber,
			row.status,
			row.success ? 'true' : 'false',
			row.messageId,
			row.error,
		])]
			.map((row) => row.map((cell) => escapeCsvCell(String(cell || ''))).join(','))
			.join('\n')

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		const rawName = String(
			historyDetail.title || historyDetail.templateName || 'broadcast',
		).trim()
		const safeName = rawName.replace(/[^a-zA-Z0-9_-]+/g, '_')
		link.download = `${safeName || 'broadcast'}_details.csv`
		link.click()
		URL.revokeObjectURL(url)
		toast.success(`Exported ${filteredHistoryDetailRows.length} recipients`)
	}

	const renderBroadcastRows = (items: BroadcastItem[], showSendNow: boolean) => {
		if (loading) {
			return (
				<div className="flex h-48 items-center justify-center text-gray-500">
					<Loader2 size={22} className="animate-spin" />
				</div>
			)
		}

		if (items.length === 0) {
			return (
				<div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-500">
					<History size={22} />
					<p className="text-sm">No broadcasts found</p>
				</div>
			)
		}

		return (
			<div className="overflow-x-auto">
				<table className="w-full min-w-[760px] text-left text-sm">
					<thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
						<tr>
							<th className="px-4 py-3">Broadcast</th>
							<th className="px-4 py-3">Template</th>
							<th className="px-4 py-3">Recipients</th>
							<th className="px-4 py-3">Result</th>
							<th className="px-4 py-3">Status</th>
							<th className="px-4 py-3 text-right">Action</th>
						</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{items.map((item) => {
								const status = getStatusValue(item.status)
								const canSend = showSendNow && status !== 'sending'
								return (
									<tr key={item.id} className="bg-white hover:bg-gray-50/70">
										<td className="px-4 py-3">
											<div className="font-semibold text-gray-900">
												{item.title || getTemplateName(item)}
											</div>
										</td>
										<td className="px-4 py-3 text-gray-600">
											{getTemplateName(item)}
										</td>
										<td className="px-4 py-3 text-gray-600">
											{getTotalRecipients(item)}
										</td>
										<td className="px-4 py-3 text-gray-600">
											<span className="text-emerald-700">
												{getSuccessCount(item)}
											</span>
											<span className="mx-1 text-gray-400">/</span>
											<span className="text-red-700">{getFailedCount(item)}</span>
										</td>
										<td className="px-4 py-3">{renderStatusBadge(item.status)}</td>
										<td className="px-4 py-3 text-right">
											{canSend ? (
												<button
													type="button"
													onClick={() => handleSendNow(item.id)}
													disabled={sendingId === item.id}
													className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
												>
													{sendingId === item.id ? (
														<Loader2 size={14} className="animate-spin" />
													) : (
														<Send size={14} />
													)}
													Send Now
												</button>
											) : (
												<span className="text-xs text-gray-400">-</span>
											)}
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
		)
	}

	const renderHistoryCards = (items: BroadcastItem[]) => {
		if (loading) {
			return (
				<div className="flex h-48 items-center justify-center text-gray-500">
					<Loader2 size={22} className="animate-spin" />
				</div>
			)
		}

		if (items.length === 0) {
			return (
				<div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-500">
					<History size={22} />
					<p className="text-sm">No broadcast history found</p>
				</div>
			)
		}

			return (
				<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
					<h3 className="text-lg font-semibold text-gray-900">Broadcast History</h3>
				<p className="mt-1 text-sm text-gray-500">
					View past broadcast jobs and their results
				</p>

				<div className="mt-4 space-y-4">
					{items.map((item) => {
						const status = getStatusValue(item.status)
						const total = getTotalRecipients(item)
						const sent = getSuccessCount(item)
						const delivered = getDeliveredCount(item)
						const read = getReadCount(item)
						const failed = getFailedCount(item)
						const successRate =
							total > 0 ? Math.round((Math.max(sent, 0) / total) * 100) : 0
						const statusClass =
							status === 'completed'
								? 'bg-emerald-500 text-white'
								: status === 'failed'
									? 'bg-red-500 text-white'
									: status === 'cancelled'
										? 'bg-gray-500 text-white'
										: 'bg-blue-500 text-white'
						const statusLabel =
							status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
						const dateValue =
							item.completedAt ||
							item.updatedAt ||
							item.createdAt ||
							item.updated_at ||
							item.created_at

						return (
							<div
								key={item.id}
								className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
							>
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<FileText size={16} className="text-gray-500" />
										<p className="truncate text-base font-semibold text-gray-900 sm:text-lg">
											{item.title || getTemplateName(item)}
										</p>
										<span
											className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
										>
											<CheckCircle2 size={14} />
											{statusLabel}
										</span>
									</div>
									<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
										<span className="text-gray-500">Recipients: {total}</span>
										<span className="text-emerald-600">Sent: {sent}</span>
										<span className="text-blue-600">Delivered: {delivered}</span>
										<span className="text-violet-600">Read: {read}</span>
										<span className="text-red-600">Failed: {failed}</span>
										<span className="text-gray-500">({successRate}% success)</span>
									</div>
									<p className="mt-2 text-xs text-gray-500 sm:text-sm">
										{formatBroadcastDate(dateValue)}
									</p>
								</div>
								<button
									type="button"
									onClick={() => handleViewHistoryDetails(item.id)}
									disabled={viewingHistoryId === item.id}
									className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
								>
									{viewingHistoryId === item.id ? (
										<Loader2 size={16} className="animate-spin" />
									) : (
										<Eye size={16} />
									)}
									View Details
								</button>
							</div>
						)
					})}
				</div>
			</div>
		)
	}

	return (
		<div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
			<PageHeader
				title="Broadcast"
				description="Send WhatsApp template messages to selected recipients with variable support"
				icon={<RadioTower size={24} />}
				className="mb-0"
				tabs={
					<div className="inline-flex w-full rounded-xl border border-gray-200 bg-white p-1 shadow-sm sm:w-auto">
						<button
							type="button"
							onClick={() => setActiveTab('create')}
							className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
								activeTab === 'create'
									? 'bg-emerald-100 text-emerald-800'
									: 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							<CircleDot size={15} />
							Create Broadcast
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('active')}
							className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
								activeTab === 'active'
									? 'bg-emerald-100 text-emerald-800'
									: 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							<Clock3 size={15} />
							Active Jobs
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('history')}
							className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
								activeTab === 'history'
									? 'bg-emerald-100 text-emerald-800'
									: 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							<History size={15} />
							History
						</button>
					</div>
				}
			/>

			<div className="flex-1 overflow-y-auto px-4 pb-8 lg:px-8">
					<div className="mt-4">
						{activeTab === 'create' && (
							<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
							<div className="space-y-4">
							<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
								<h3 className="mb-2 text-base font-semibold text-gray-900">
									Pricing Information
								</h3>
								<p className="text-sm leading-relaxed text-gray-600">
									Sending WhatsApp template messages incurs charges from Meta.
									Costs vary by category and destination country.
								</p>
								<div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
									<a
										href="https://www.whatsapp.com/business/pricing"
										target="_blank"
										rel="noreferrer"
										className="text-emerald-600 hover:text-emerald-700"
									>
										View WhatsApp Pricing
									</a>
									<a
										href="https://business.facebook.com/settings/payment-methods/"
										target="_blank"
										rel="noreferrer"
										className="text-emerald-600 hover:text-emerald-700"
									>
										Add Payment Method in Meta Business
									</a>
								</div>
							</div>

							<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
									<div className="space-y-4">
										<div>
											<label className="mb-2 block text-sm font-semibold text-gray-700">
												Select Template
											</label>
											<div ref={templateDropdownRef} className="relative">
												<button
													type="button"
													onClick={() =>
														setIsTemplateDropdownOpen((prev) => !prev)
													}
													className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-left transition hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
												>
													{selectedTemplate ? (
														<div className="flex min-w-0 items-center gap-3">
															<FileText className="h-5 w-5 shrink-0 text-gray-500" />
															<span className="truncate text-sm font-semibold text-gray-900 sm:text-base">
																{selectedTemplate.name}
															</span>
															<span className="inline-flex shrink-0 items-center rounded-2xl border border-gray-300 px-3 py-0.5 text-xs font-semibold text-gray-700 sm:text-sm">
																{selectedTemplate.language || '-'}
															</span>
														</div>
													) : (
														<div className="flex min-w-0 items-center gap-3 text-gray-500">
															<FileText className="h-5 w-5 shrink-0" />
																<span className="truncate text-sm font-medium">
																	Choose a template...
																</span>
														</div>
													)}
													<ChevronDown
														className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
															isTemplateDropdownOpen ? 'rotate-180' : ''
														}`}
													/>
												</button>

												{isTemplateDropdownOpen && (
													<div className="mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
														<div className="max-h-[360px] space-y-2 overflow-y-auto">
															{templatesLoading && (
																<div className="inline-flex items-center gap-2 px-2 py-3 text-xs text-gray-500">
																	<Loader2 size={14} className="animate-spin" />
																	Loading approved templates...
																</div>
															)}

															{!templatesLoading && templates.length === 0 && (
																<div className="px-2 py-3 text-sm text-gray-500">
																	No approved templates available
																</div>
															)}

															{!templatesLoading &&
																templates.map((template) => {
																	const templateCategory = String(
																		template.category || '',
																	).toUpperCase()
																	const isSelected =
																		template.name === selectedTemplateName
																	const previewText = getTemplateBodyPreview(template)

																	return (
																		<button
																			key={template.id}
																			type="button"
																			onClick={() =>
																				handleTemplateChange(template.name)
																			}
																			className={`w-full rounded-lg border px-4 py-3 text-left transition ${
																				isSelected
																					? 'border-lime-200 bg-lime-100/80'
																					: 'border-transparent hover:bg-gray-50'
																			}`}
																		>
																			<div className="flex items-start justify-between gap-3">
																				<div className="min-w-0">
																					<div className="flex flex-wrap items-center gap-2">
																						<FileText className="h-4 w-4 shrink-0 text-gray-500" />
																							<span className="truncate text-sm font-semibold text-gray-900 sm:text-base">
																								{template.name}
																							</span>
																							<span className="inline-flex items-center rounded-2xl border border-gray-300 px-3 py-0.5 text-xs font-semibold text-gray-700 sm:text-sm">
																								{template.language || '-'}
																							</span>
																							{templateCategory && (
																								<span className="inline-flex items-center rounded-2xl bg-lime-100 px-3 py-0.5 text-xs font-semibold text-lime-900 sm:text-sm">
																									{templateCategory}
																								</span>
																							)}
																						</div>
																						{previewText && (
																							<p className="mt-2 pl-6 text-xs leading-snug text-gray-500 sm:text-sm">
																								{previewText}
																							</p>
																						)}
																				</div>
																				{isSelected && (
																					<Check className="mt-1 h-5 w-5 shrink-0 text-gray-800" />
																				)}
																			</div>
																		</button>
																	)
																})}
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>

				{selectedTemplate ? (
					<>
						{templateVariableFields.length > 0 && (
							<div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
								<div className="space-y-1.5 p-6 pb-3">
									<div className="flex items-center gap-2">
										<Variable className="h-5 w-5" />
										<div className="text-base font-semibold tracking-tight">
											Template Variables
										</div>
									</div>
									<div className="text-sm text-gray-500">
										Fill in the variable values for your template
									</div>
								</div>
								<div className="space-y-4 p-6 pt-0">
									<div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
										<Variable className="mt-0.5 h-4 w-4 shrink-0" />
										<div>
											<p className="font-medium">
												Tip: Use customer name from database
											</p>
											<p className="mt-1 text-xs">
												Type{' '}
												<code className="rounded bg-blue-100 px-1">
													{'{{customer_name}}'}
												</code>{' '}
												in any field to auto-fill with customer's name
											</p>
										</div>
									</div>

									{templateVariableFields.map((field) => {
										const value = defaultTemplateVariables[field.key] || ''
										const isMissing = value.trim().length === 0
										return (
											<div key={field.key} className="space-y-2">
												<div className="flex items-center gap-2">
													<label
														className="text-sm font-medium"
														htmlFor={`var-${field.key}`}
													>
														{`{{${field.key}}}`}
													</label>
													<div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold text-gray-700">
														{toVariableComponentLabel(field.componentType)}
													</div>
												</div>
												<input
													id={`var-${field.key}`}
													type="text"
													value={value}
													onChange={(event) =>
														setDefaultTemplateVariables((prev) => ({
															...prev,
															[field.key]: event.target.value,
														}))
													}
													placeholder={`Value for ${toVariableComponentLabel(field.componentType)} {{${field.key}}} or {{customer_name}}`}
													className={`h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus:outline-none focus:ring-1 ${
														isMissing
															? 'border-amber-300 focus:border-amber-400 focus:ring-amber-300'
															: 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-300'
													}`}
												/>
											</div>
										)
									})}

									{missingDefaultKeys.length > 0 && (
										<div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
											<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
											<span>
												This field is required:{' '}
												{missingDefaultKeys
													.map((key) => `{{${key}}}`)
													.join(', ')}
											</span>
										</div>
									)}

									<div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
										<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
										<span>
											Defaults are used for customers/manual rows with missing values. For
											CSV, each row can override with columns like 1, 2, 3...
										</span>
									</div>
								</div>
							</div>
						)}

						<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
							<div className="mb-3">
								<h3 className="text-base font-semibold text-gray-900">
												Select Recipients
											</h3>
										</div>

										<div className="mb-4 grid grid-cols-3 rounded-lg border border-gray-200 bg-gray-50 p-1">
											<button
												type="button"
												onClick={() => setRecipientMode('customers')}
												className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
													recipientMode === 'customers'
														? 'bg-white text-gray-900 shadow-sm'
														: 'text-gray-600 hover:text-gray-900'
												}`}
											>
												<Users size={14} />
												From Customers
											</button>
											<button
												type="button"
												onClick={() => setRecipientMode('csv')}
												className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
													recipientMode === 'csv'
														? 'bg-white text-gray-900 shadow-sm'
														: 'text-gray-600 hover:text-gray-900'
												}`}
											>
												<FileText size={14} />
												Upload CSV
											</button>
											<button
												type="button"
												onClick={() => setRecipientMode('manual')}
												className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
													recipientMode === 'manual'
														? 'bg-white text-gray-900 shadow-sm'
														: 'text-gray-600 hover:text-gray-900'
												}`}
											>
												<Keyboard size={14} />
												Manual Input
											</button>
										</div>

										{recipientMode === 'customers' && (
											<div className="space-y-3">
												<div className="flex items-center gap-2">
													<input
														type="text"
														value={customerSearch}
														onChange={(event) => setCustomerSearch(event.target.value)}
														placeholder="Search customer or phone..."
														className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
													/>
												</div>

												<div className="flex flex-wrap items-center justify-between gap-2">
													<div className="flex items-center gap-2">
														<button
															type="button"
															onClick={handleSelectAllVisibleCustomers}
															disabled={
																visibleCustomerIds.length === 0 ||
																allVisibleCustomersSelected
															}
															className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
														>
															<CheckCircle2 size={14} />
															Select All
														</button>
														<button
															type="button"
															onClick={handleDeselectAllVisibleCustomers}
															disabled={selectedVisibleCustomerCount === 0}
															className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
														>
															<X size={14} />
															Deselect All
														</button>
													</div>
													<p className="text-sm text-gray-500">
														{selectedCustomerIds.length} recipients selected
													</p>
												</div>

													<div className="rounded-lg border border-gray-200">
														{customersLoading ? (
															<div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-gray-500">
																<Loader2 size={16} className="animate-spin" />
																Loading customers...
															</div>
														) : filteredCustomers.length === 0 ? (
															<div className="px-4 py-8 text-center text-sm text-gray-500">
																No customers with phone numbers found
															</div>
														) : (
															<div className="space-y-2 p-2">
																<div className="max-h-[320px] overflow-y-auto rounded-md border border-gray-100">
																	<div className="divide-y divide-gray-100">
																		{paginatedCustomers.map((customer) => (
																			<label
																				key={customer.id}
																				className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 hover:bg-gray-50"
																			>
																				<div className="flex items-center gap-2">
																					<input
																						type="checkbox"
																						checked={selectedCustomerIds.includes(customer.id)}
																						onChange={() => toggleCustomerSelection(customer.id)}
																						className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
																					/>
																					<div>
																						<p className="text-sm font-medium text-gray-900">
																							{customer.name || 'Unknown'}
																						</p>
																						<p className="text-xs text-gray-500">
																							{customer.phone_number}
																						</p>
																					</div>
																				</div>
																				{selectedCustomerIds.includes(customer.id) && (
																					<CheckCircle2
																						size={14}
																						className="text-emerald-600"
																					/>
																				)}
																			</label>
																		))}
																	</div>
																</div>

																<div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
																	<p className="text-xs text-gray-500">
																		Showing {customerPageStart}-{customerPageEnd} of{' '}
																		{filteredCustomers.length} contacts
																	</p>
																	<div className="flex items-center gap-2">
																		<button
																			type="button"
																			onClick={() =>
																				setCustomerPage((prev) =>
																					Math.max(1, prev - 1),
																				)
																			}
																			disabled={customerPage <= 1}
																			className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
																		>
																			Prev
																		</button>
																		<span className="text-xs font-semibold text-gray-600">
																			Page {Math.min(customerPage, customerTotalPages)} of{' '}
																			{customerTotalPages}
																		</span>
																		<button
																			type="button"
																			onClick={() =>
																				setCustomerPage((prev) =>
																					Math.min(customerTotalPages, prev + 1),
																				)
																			}
																			disabled={customerPage >= customerTotalPages}
																			className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
																		>
																			Next
																		</button>
																	</div>
																</div>
															</div>
														)}
													</div>
											</div>
										)}

										{recipientMode === 'csv' && (
											<div className="space-y-3">
												<input
													ref={csvInputRef}
													type="file"
													accept=".csv"
													onChange={handleCsvFileChange}
													className="hidden"
												/>
												{!csvFileName && (
													<button
														type="button"
														onClick={() => csvInputRef.current?.click()}
														className="w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50/30"
													>
														<Upload className="mx-auto mb-2 h-7 w-7 text-gray-500" />
														<p className="text-sm font-semibold text-gray-900">
															Drop CSV file here or click to upload
														</p>
														<p className="mt-1 text-xs text-gray-500">
															CSV must include a phoneNumber column
														</p>
													</button>
												)}

												{csvFileName && (
													<>
														<div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-center">
															<FileText className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
															<p className="text-sm font-semibold text-gray-900">
																{csvFileName}
															</p>
															<div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
																<span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
																	{validCsvRows.length} valid
																</span>
																{invalidCsvRows.length > 0 && (
																	<span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
																		{invalidCsvRows.length} invalid
																	</span>
																)}
																<span className="rounded-full bg-lime-100 px-2.5 py-1 text-lime-800">
																	{csvVariableColumns.length} variable columns
																</span>
																{csvInvalidPhoneRows > 0 && (
																	<span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">
																		{csvInvalidPhoneRows} invalid phone rows
																	</span>
																)}
															</div>
														</div>

														<div className="flex items-center justify-between">
															<button
																type="button"
																onClick={handleDownloadTemplate}
																className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
															>
																<Download size={14} />
																Download Template
															</button>
															<button
																type="button"
																onClick={handleClearCsv}
																className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
															>
																<X size={14} />
																Clear
															</button>
														</div>
													</>
												)}

												{csvError && (
													<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
														{csvError}
													</div>
												)}

												{csvValidationRows.length > 0 && (
													<div className="rounded-lg border border-gray-200">
														<div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
															<p className="text-sm font-semibold text-gray-800">
																{csvValidationRows.length} phone numbers found
															</p>
															<div className="flex flex-wrap items-center gap-2">
																<button
																	type="button"
																	onClick={handleSelectAllCsvRecipients}
																	disabled={validCsvRows.length === 0}
																	className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
																>
																	Select All
																</button>
																<button
																	type="button"
																	onClick={handleDeselectAllCsvRecipients}
																	disabled={selectedCsvPhoneNumbers.length === 0}
																	className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
																>
																	Deselect All
																</button>
															</div>
															<p className="text-sm text-gray-500">
																{selectedCsvRecipients.length} recipients selected
															</p>
														</div>
														<div className="max-h-56 divide-y divide-gray-100 overflow-y-auto">
															{csvValidationRows.map((row) => {
																const phoneNumber = row.recipient.phoneNumber
																const isSelected =
																	selectedCsvPhoneNumbers.includes(phoneNumber)
																return (
																	<label
																		key={phoneNumber}
																		className={`flex items-start gap-2 px-3 py-2 ${
																			row.isValid
																				? 'cursor-pointer hover:bg-gray-50'
																				: 'cursor-not-allowed bg-gray-50/70'
																		}`}
																	>
																		<input
																			type="checkbox"
																			checked={isSelected}
																			disabled={!row.isValid}
																			onChange={() =>
																				toggleCsvRecipientSelection(phoneNumber)
																			}
																			className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
																		/>
																		<div className="min-w-0 flex-1">
																			<p className="text-sm font-medium text-gray-900">
																				{phoneNumber}
																			</p>
																			{row.preview && (
																				<p className="mt-0.5 truncate text-xs text-gray-500">
																					{`(${row.preview})`}
																				</p>
																			)}
																			{!row.isValid && (
																				<p className="mt-0.5 text-xs text-amber-700">
																					Missing{' '}
																					{row.missingKeys
																						.map((key) => `{{${key}}}`)
																						.join(', ')}
																				</p>
																			)}
																		</div>
																	</label>
																)
															})}
														</div>
														<div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-600">
															{selectedCsvRecipients.length} of {validCsvRows.length} valid
															recipients selected for broadcast
														</div>
													</div>
												)}

												{csvVariableColumns.length > 0 && (
													<p className="text-xs text-gray-500">
														Variable data detected in CSV. Values will be used per-recipient.
													</p>
												)}

												{invalidCsvRows.length > 0 && (
													<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
														{invalidCsvRows.length} row(s) do not match required template
														variables
														{invalidCsvMissingKeys.length > 0 && (
															<span>
																{`: ${invalidCsvMissingKeys.map((key) => `{{${key}}}`).join(', ')}`}
															</span>
														)}
													</div>
												)}

												{csvColumns.length > 0 && (
													<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
														Columns: {csvColumns.join(', ')}
													</div>
												)}

												{csvFileName && (
													<button
														type="button"
														onClick={() => csvInputRef.current?.click()}
														className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
													>
														<Upload size={14} />
														Upload another CSV
													</button>
												)}
											</div>
										)}

										{recipientMode === 'manual' && (
											<div className="space-y-3">
												<textarea
													value={manualInput}
													onChange={(event) => setManualInput(event.target.value)}
													rows={7}
													placeholder={
														templateVariableKeys.length > 0
															? '+6281234567890,John,PROMO123\n+6289876543210,Jane,SALE2024'
															: '+6281234567890\n+6289876543210'
													}
													className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
												/>
												<p className="text-xs text-gray-500">
													One line per recipient. Format: phoneNumber,variable1,variable2
												</p>

												{manualParsed.rowErrors.length > 0 && (
													<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
														{manualParsed.rowErrors[0]}
													</div>
												)}

												<div className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">
													{manualParsed.recipients.length} valid recipients
												</div>
											</div>
										)}

										<div className="mt-4 border-t border-gray-100 pt-4">
											<div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
												<Clock3 size={14} className="text-gray-500" />
												Delay between messages
											</div>
											<select
												value={String(delaySeconds)}
												onChange={(event) => setDelaySeconds(Number(event.target.value))}
												className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
											>
												{DELAY_OPTIONS.map((option) => (
													<option key={option.value} value={option.value}>
														{option.label}
													</option>
												))}
											</select>
											<p className="mt-1 text-xs text-gray-500">
												WhatsApp recommends 30-60 seconds delay to maintain quality rating and avoid
												rate limits
											</p>
										</div>

										<div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
											<div className="flex flex-wrap items-end justify-between gap-3">
												<div>
													<p className="text-lg font-semibold text-gray-900">
														Estimated Cost
													</p>
													<p className="text-sm text-gray-600">
														{selectedRecipientCount} x{' '}
														{formatIdrAmount(estimatedRatePerRecipient)} (
														{selectedTemplateCategoryLabel})
													</p>
												</div>
												<p className="text-2xl font-bold text-gray-900">
													{formatIdrAmount(estimatedBroadcastCost)}
												</p>
											</div>
											<p className="mt-1 text-xs text-gray-500">
												Estimation only. Actual billing follows Meta WhatsApp pricing.
											</p>
										</div>
									</div>

									<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
										<p className="text-xl text-gray-600">
											{selectedRecipientCount} recipients selected
										</p>
										<div className="flex flex-wrap gap-2">
											<button
												type="button"
												onClick={() => handleCreateBroadcast(true)}
												disabled={creating}
												className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
											>
												{creating ? (
													<Loader2 size={15} className="animate-spin" />
												) : (
													<Send size={15} />
												)}
												Create & Send
											</button>
										</div>
									</div>
								</>
							) : (
								<div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center shadow-sm">
									<p className="mt-1 text-sm text-gray-500">
										Select template before choosing recipients and sending broadcast.
									</p>
								</div>
							)}
						</div>

						<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
							<div className="mb-4 inline-flex items-center gap-2 text-base font-semibold text-gray-900">
								<Eye size={18} />
								Message Preview
							</div>
							<p className="mb-4 text-sm text-gray-500">
								See how your message will look to recipients
							</p>

							<div className="rounded-2xl border border-dashed border-gray-300 bg-muted/40 p-5">
								{selectedTemplate ? (
									<div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
										<div className="mb-2 flex items-center justify-between">
											<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
												{selectedTemplate.category}
											</p>
											<p className="text-xs text-gray-500">
												{selectedTemplate.language}
											</p>
										</div>
										{headerComponent?.text && (
											<p className="mb-2 text-sm font-semibold text-gray-900">
												{String(headerComponent.text)}
											</p>
										)}
										<p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
											{String(bodyComponent?.text || '[No body text]')}
										</p>
										{footerComponent?.text && (
											<p className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
												{String(footerComponent.text)}
											</p>
										)}
										{Array.isArray(buttonComponent?.buttons) &&
											buttonComponent.buttons.length > 0 && (
												<div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
													{buttonComponent.buttons.map((button: any, index: number) => (
														<div
															key={`${button?.text || 'btn'}-${index}`}
															className="rounded-md bg-gray-50 px-3 py-2 text-center text-sm font-medium text-emerald-700"
														>
															{String(button?.text || 'Button')}
														</div>
													))}
												</div>
											)}
									</div>
								) : (
									<div className="flex min-h-[220px] flex-col items-center justify-center text-center text-gray-400">
										<Eye size={36} />
										<p className="mt-4 text-sm">Select a template to see preview</p>
									</div>
								)}
							</div>

						</div>
					</div>
				)}

						{activeTab === 'active' && (
							<div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
								{renderBroadcastRows(activeJobs, true)}
							</div>
						)}

						{activeTab === 'history' && (
							<div>{renderHistoryCards(historyJobs)}</div>
						)}
					</div>

				{isHistoryDetailOpen && historyDetail && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
						<div
							className="absolute inset-0"
							onClick={closeHistoryDetailModal}
							aria-hidden="true"
						/>
						<div className="relative z-10 w-full max-w-3xl rounded-2xl border border-emerald-300 bg-white shadow-2xl">
							<div className="max-h-[90vh] overflow-y-auto p-6">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<FileText size={18} className="shrink-0 text-gray-500" />
											<p className="truncate text-3xl font-semibold text-gray-900 sm:text-[40px]">
												{historyDetail.title || historyDetail.templateName || '-'}
											</p>
										</div>
										<p className="mt-1 text-sm text-gray-500">
											{formatBroadcastDate(
												historyDetail.completedAt ||
													historyDetail.updatedAt ||
													historyDetail.createdAt,
											)}
										</p>
									</div>
									<button
										type="button"
										onClick={closeHistoryDetailModal}
										className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
										aria-label="Close details"
									>
										<X size={18} />
									</button>
								</div>

								<div className="mt-6">
									<div className="mb-2 flex items-center justify-between text-sm">
										<span className="font-semibold text-gray-700">Delivery Rate</span>
										<span className="font-semibold text-emerald-600">
											{historyDetailDeliveryRate}%
										</span>
									</div>
									<div className="h-3 overflow-hidden rounded-full bg-gray-100">
										<div
											className="h-full rounded-full bg-emerald-500 transition-all"
											style={{
												width: `${Math.max(
													0,
													Math.min(100, historyDetailDeliveryRate),
												)}%`,
											}}
										/>
									</div>
								</div>

								<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
									<div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm">
										<p className="text-2xl font-semibold text-gray-900">
											{historyDetailTotalRecipients}
										</p>
										<p className="text-sm text-gray-500">Recipients</p>
									</div>
									<div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm">
										<p className="text-2xl font-semibold text-emerald-600">
											{historyDetailSuccessCount}
										</p>
										<p className="text-sm text-gray-500">Sent</p>
									</div>
									<div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm">
										<p className="text-2xl font-semibold text-blue-600">
											{historyDetailDeliveredCount}
										</p>
										<p className="text-sm text-gray-500">Delivered</p>
									</div>
									<div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm">
										<p className="text-2xl font-semibold text-violet-600">
											{historyDetailReadCount}
										</p>
										<p className="text-sm text-gray-500">Read</p>
									</div>
									<div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center shadow-sm">
										<p className="text-2xl font-semibold text-red-600">
											{historyDetailFailedCount}
										</p>
										<p className="text-sm text-gray-500">Failed</p>
									</div>
								</div>

								<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
									<h4 className="text-2xl font-semibold text-gray-900">
										Detailed Results
									</h4>
									<div className="flex items-center gap-2">
										<select
											value={historyDetailStatusFilter}
											onChange={(event) =>
												setHistoryDetailStatusFilter(event.target.value)
											}
											className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
										>
											{historyDetailFilterOptions.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
										<button
											type="button"
											onClick={handleExportHistoryDetail}
											className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
										>
											<Download size={15} />
											Export
										</button>
									</div>
								</div>

								<div className="mt-3 rounded-xl border border-gray-200">
									{paginatedHistoryDetailRows.length === 0 ? (
										<div className="px-4 py-10 text-center text-sm text-gray-500">
											No recipient rows for this filter
										</div>
									) : (
										<div className="max-h-[320px] divide-y divide-gray-100 overflow-y-auto">
											{paginatedHistoryDetailRows.map((row, index) => {
												const visual = getHistoryDetailStatusVisual(row.status)
												return (
													<div
														key={`${row.phoneNumber}-${index}`}
														className="flex items-center justify-between gap-3 px-4 py-3"
													>
														<div className="min-w-0">
															<p className="truncate text-xl font-medium text-gray-800">
																{row.phoneNumber}
															</p>
															{row.error && (
																<p className="mt-0.5 truncate text-xs text-red-600">
																	{row.error}
																</p>
															)}
														</div>
														<span
															className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${visual.className}`}
														>
															{visual.label === 'Sent' && <Check size={14} />}
															{visual.label}
														</span>
													</div>
												)
											})}
										</div>
									)}
								</div>

								<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
									<p className="text-sm text-gray-500">
										Showing {historyDetailPageStart}-{historyDetailPageEnd} of{' '}
										{filteredHistoryDetailRows.length}
									</p>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() =>
												setHistoryDetailPage((prev) => Math.max(1, prev - 1))
											}
											disabled={historyDetailPage <= 1}
											className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
										>
											Prev
										</button>
										<p className="text-sm font-semibold text-gray-600">
											{Math.min(historyDetailPage, historyDetailTotalPages)} /{' '}
											{historyDetailTotalPages}
										</p>
										<button
											type="button"
											onClick={() =>
												setHistoryDetailPage((prev) =>
													Math.min(historyDetailTotalPages, prev + 1),
												)
											}
											disabled={historyDetailPage >= historyDetailTotalPages}
											className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
										>
											Next
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
