import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { customers as customersApi, API_BASE } from '@/lib/api'
import {
	ArrowDown,
	ArrowUp,
	Clock3,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ChevronsUpDown,
	Download,
	EyeOff,
	Filter,
	Search,
	Settings2,
	UserCheck,
	UserX,
	Users,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { toast } from 'sonner'

export const Route = createFileRoute('/_app/customers/')({
	component: Customers,
})

interface Customer {
	id: string
	name: string
	email?: string
	phone_number?: string
	avatar_url?: string
	source?: string
	created_at?: string
	last_contact_at?: string | null
	pipeline_stage_name?: string
	pipeline_stage_color?: string
	is_window_active?: boolean
	message_count?: number
	custom_attributes?: Record<string, unknown>
	tags?: Array<{ id: string; name: string; color: string }>
}

interface Agent {
	id: string
	email: string
	name: string
	role: string
}

type CustomerSortField =
	| 'name'
	| 'contact'
	| 'stage'
	| 'tags'
	| 'window'
	| 'messages'
	| 'last_contact'
	| 'created_at'

type SortOrder = 'asc' | 'desc'

type TableColumnId =
	| 'customer'
	| 'contact'
	| 'additional_info'
	| 'stage'
	| 'tags'
	| 'window'
	| 'messages'
	| 'last_contact'
	| 'created_at'

type TableColumn = {
	id: TableColumnId
	label: string
	sortField?: CustomerSortField
}

type CustomersListResponse = {
	payload?: Customer[]
	meta?: {
		total?: number
	}
}

type CustomerStats = {
	total: number
	consented: number
	active_window: number
	blacklisted: number
}

type CustomerStatsResponse = {
	payload?: Partial<CustomerStats>
}

type CustomerDetailResponse = {
	payload?: Customer
}

const TABLE_COLUMNS: TableColumn[] = [
	{ id: 'customer', label: 'Customer', sortField: 'name' },
	{ id: 'contact', label: 'Contact', sortField: 'contact' },
	{ id: 'additional_info', label: 'Additional Info' },
	{ id: 'stage', label: 'Stage', sortField: 'stage' },
	{ id: 'tags', label: 'Tags', sortField: 'tags' },
	{ id: 'window', label: 'Window', sortField: 'window' },
	{ id: 'messages', label: 'Messages', sortField: 'messages' },
	{ id: 'last_contact', label: 'Last Contact', sortField: 'last_contact' },
	{ id: 'created_at', label: 'Added', sortField: 'created_at' },
]

const DEFAULT_COLUMN_VISIBILITY: Record<TableColumnId, boolean> = {
	customer: true,
	contact: true,
	additional_info: true,
	stage: true,
	tags: true,
	window: true,
	messages: true,
	last_contact: true,
	created_at: true,
}

function formatDateCell(value?: string | null, includeTime = false) {
	if (!value) return '-'
	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) return '-'

	if (includeTime) {
		return parsed.toLocaleString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	return parsed.toLocaleDateString('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})
}

function escapeCsvValue(value: unknown): string {
	const normalized =
		value === null || value === undefined
			? ''
			: String(value).replace(/\r?\n/g, ' ')
	return `"${normalized.replace(/"/g, '""')}"`
}

function getErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback
}

const RESERVED_CUSTOM_ATTRIBUTE_KEYS = new Set([
	'notes',
	'lead_score',
	'pipeline_stage_id',
	'pipeline_stage_name',
	'pipeline_stage_color',
	'consent_purpose',
	'consent_source',
])

function formatAdditionalInfoLabel(key: string) {
	return key
		.replace(/_/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatAdditionalInfoValue(value: unknown): string {
	if (typeof value === 'boolean') return value ? 'Yes' : 'No'
	if (typeof value === 'number') return String(value)
	if (typeof value === 'string') {
		const normalized = value.trim()
		if (!normalized) return ''
		if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
			const parsed = new Date(normalized)
			if (!Number.isNaN(parsed.getTime())) {
				return parsed.toLocaleDateString('id-ID', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
				})
			}
		}
		return normalized
	}
	if (value === null || value === undefined) return ''
	return String(value)
}

function getAdditionalInfoEntries(customer: Customer) {
	const attributes =
		customer.custom_attributes && typeof customer.custom_attributes === 'object'
			? customer.custom_attributes
			: {}

	return Object.entries(attributes)
		.filter(([key, rawValue]) => {
			if (RESERVED_CUSTOM_ATTRIBUTE_KEYS.has(key)) return false
			if (rawValue === null || rawValue === undefined) return false
			if (typeof rawValue === 'string' && rawValue.trim() === '') return false
			return true
		})
		.map(([key, rawValue]) => ({
			key,
			label: formatAdditionalInfoLabel(key),
			value: formatAdditionalInfoValue(rawValue),
		}))
		.filter((entry) => entry.value.length > 0)
}

function Customers() {
	const navigate = useNavigate()
	const [agent, setAgent] = useState<Agent | null>(null)
	const [loading, setLoading] = useState(true)
	const [customers, setCustomers] = useState<Customer[]>([])
	const [loadingCustomers, setLoadingCustomers] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const [activeTab, setActiveTab] = useState<'list' | 'groups'>('list')
	const [page, setPage] = useState(1)
	const [perPage, setPerPage] = useState(10)
	const [totalCustomers, setTotalCustomers] = useState(0)
	const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null)
	const [loadingCustomerStats, setLoadingCustomerStats] = useState(false)
	const [sortBy, setSortBy] = useState<CustomerSortField>('created_at')
	const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
	const [columnVisibility, setColumnVisibility] = useState<
		Record<TableColumnId, boolean>
	>(DEFAULT_COLUMN_VISIBILITY)
	const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
	const [selectedCustomersById, setSelectedCustomersById] = useState<
		Record<string, Customer>
	>({})
	const loadRequestRef = useRef(0)

	const checkAuth = useCallback(async () => {
		const token = localStorage.getItem('scalechat_token')

		if (!token) {
			navigate({ to: '/login' })
			return
		}

		try {
			const response = await fetch(`${API_BASE}/auth/me`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				throw new Error('Session expired')
			}

			const storedAgent = localStorage.getItem('scalechat_user')
			if (storedAgent) {
				setAgent(JSON.parse(storedAgent))
			}
		} catch (_error) {
			localStorage.removeItem('scalechat_token')
			localStorage.removeItem('scalechat_user')
			navigate({ to: '/login' })
		} finally {
			setLoading(false)
		}
	}, [navigate])

	const loadCustomers = useCallback(async () => {
		const requestId = ++loadRequestRef.current
		setLoadingCustomers(true)

		try {
			const result = (await customersApi.list({
				page,
				per_page: perPage,
				search: debouncedSearch || undefined,
				sort: sortBy,
				order: sortOrder,
			})) as CustomersListResponse

			if (requestId !== loadRequestRef.current) return

			const payload = Array.isArray(result.payload) ? result.payload : []
			const total = Number(result.meta?.total) || 0

			setCustomers(payload)
			setTotalCustomers(total)
		} catch (error: unknown) {
			if (requestId !== loadRequestRef.current) return
			console.error('Failed to load customers:', error)
			toast.error(getErrorMessage(error, 'Failed to load customers'))
		} finally {
			if (requestId === loadRequestRef.current) {
				setLoadingCustomers(false)
			}
		}
	}, [debouncedSearch, page, perPage, sortBy, sortOrder])

	const loadCustomerStats = useCallback(async () => {
		setLoadingCustomerStats(true)

		try {
			const result = (await customersApi.stats()) as CustomerStatsResponse
			const payload = result.payload ?? {}

			setCustomerStats({
				total: Number(payload.total) || 0,
				consented: Number(payload.consented) || 0,
				active_window: Number(payload.active_window) || 0,
				blacklisted: Number(payload.blacklisted) || 0,
			})
		} catch (error: unknown) {
			console.error('Failed to load customer stats:', error)
		} finally {
			setLoadingCustomerStats(false)
		}
	}, [])

	useEffect(() => {
		checkAuth()
	}, [checkAuth])

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			setDebouncedSearch(searchQuery.trim())
			setPage(1)
		}, 350)

		return () => window.clearTimeout(timeout)
	}, [searchQuery])

	useEffect(() => {
		if (!agent || activeTab !== 'list') return
		loadCustomers()
	}, [agent, activeTab, loadCustomers])

	useEffect(() => {
		if (!agent || activeTab !== 'list') return
		loadCustomerStats()
	}, [agent, activeTab, loadCustomerStats])

	useEffect(() => {
		if (customers.length === 0 || selectedCustomerIds.length === 0) return
		setSelectedCustomersById((prev) => {
			const selectedSet = new Set(selectedCustomerIds)
			let changed = false
			const next = { ...prev }

			for (const customer of customers) {
				if (!selectedSet.has(customer.id)) continue
				next[customer.id] = customer
				changed = true
			}

			return changed ? next : prev
		})
	}, [customers, selectedCustomerIds])

	const totalPages = Math.max(1, Math.ceil(totalCustomers / perPage))
	const currentPage = Math.min(page, totalPages)
	const selectedCustomerSet = useMemo(
		() => new Set(selectedCustomerIds),
		[selectedCustomerIds],
	)
	const currentPageCustomerIds = useMemo(
		() => customers.map((customer) => customer.id),
		[customers],
	)
	const selectedCountOnCurrentPage = currentPageCustomerIds.filter((id) =>
		selectedCustomerSet.has(id),
	).length
	const allCurrentPageSelected =
		customers.length > 0 && selectedCountOnCurrentPage === customers.length
	const visibleColumns = useMemo(
		() => TABLE_COLUMNS.filter((column) => columnVisibility[column.id]),
		[columnVisibility],
	)

	useEffect(() => {
		if (page <= totalPages) return
		setPage(totalPages)
	}, [page, totalPages])

	const setColumnVisible = (columnId: TableColumnId, visible: boolean) => {
		setColumnVisibility((prev) => {
			const visibleCount = Object.values(prev).filter(Boolean).length
			if (!visible && prev[columnId] && visibleCount <= 1) {
				return prev
			}
			return { ...prev, [columnId]: visible }
		})
	}

	const handleSortColumn = (column: TableColumn, order: SortOrder) => {
		if (!column.sortField) return
		setSortBy(column.sortField)
		setSortOrder(order)
		setPage(1)
	}

	const toggleCustomerSelection = (customer: Customer, checked: boolean) => {
		setSelectedCustomerIds((prev) => {
			if (checked) {
				if (prev.includes(customer.id)) return prev
				return [...prev, customer.id]
			}
			return prev.filter((id) => id !== customer.id)
		})

		setSelectedCustomersById((prev) => {
			if (checked) {
				return { ...prev, [customer.id]: customer }
			}

			if (!prev[customer.id]) return prev
			const next = { ...prev }
			delete next[customer.id]
			return next
		})
	}

	const toggleCurrentPageSelection = (checked: boolean) => {
		if (customers.length === 0) return

		if (checked) {
			setSelectedCustomerIds((prev) => {
				const next = new Set(prev)
				for (const customer of customers) {
					next.add(customer.id)
				}
				return Array.from(next)
			})
			setSelectedCustomersById((prev) => {
				const next = { ...prev }
				for (const customer of customers) {
					next[customer.id] = customer
				}
				return next
			})
			return
		}

		const currentIds = new Set(customers.map((customer) => customer.id))
		setSelectedCustomerIds((prev) => prev.filter((id) => !currentIds.has(id)))
		setSelectedCustomersById((prev) => {
			const next = { ...prev }
			for (const id of currentIds) {
				delete next[id]
			}
			return next
		})
	}

	const exportSelectedCustomers = async () => {
		if (selectedCustomerIds.length === 0) {
			toast.error('Select at least one customer first')
			return
		}

		try {
			const mergedMap: Record<string, Customer> = { ...selectedCustomersById }
			const missingIds = selectedCustomerIds.filter((id) => !mergedMap[id])

			if (missingIds.length > 0) {
				const fetched = await Promise.all(
					missingIds.map(async (id) => {
						try {
							const response = (await customersApi.get(
								id,
							)) as CustomerDetailResponse
							return response.payload
						} catch (_error) {
							return undefined
						}
					}),
				)

				for (const customer of fetched) {
					if (customer?.id) {
						mergedMap[customer.id] = customer
					}
				}
			}

			const rows = selectedCustomerIds
				.map((id) => mergedMap[id])
				.filter((customer): customer is Customer => Boolean(customer))

			if (rows.length === 0) {
				toast.error('Selected customers could not be prepared for export')
				return
			}

			const headers = [
				'Customer Name',
				'Phone Number',
				'Email',
				'Additional Info',
				'Source',
				'Stage',
				'Tags',
				'Window',
				'Messages',
				'Last Contact',
				'Added',
			]

			const csvLines = rows.map((customer) =>
				(() => {
					const additionalInfoSummary = getAdditionalInfoEntries(customer)
						.map((entry) => `${entry.label}: ${entry.value}`)
						.join(' | ')
					return [
						customer.name || '',
						customer.phone_number || '',
						customer.email || '',
						additionalInfoSummary,
						customer.source || '',
						customer.pipeline_stage_name || '',
						customer.tags?.map((tag) => tag.name).join(' | ') || '',
						customer.is_window_active ? 'ACTIVE' : 'EXPIRED',
						customer.message_count ?? 0,
						formatDateCell(customer.last_contact_at, true),
						formatDateCell(customer.created_at),
					]
				})()
					.map((value) => escapeCsvValue(value))
					.join(','),
			)

			const csv = [
				headers.map((header) => escapeCsvValue(header)).join(','),
				...csvLines,
			].join('\n')
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `customers-selected-${new Date().toISOString().slice(0, 10)}.csv`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			window.URL.revokeObjectURL(url)

			toast.success(`Exported ${rows.length} selected customer(s)`)
		} catch (error: unknown) {
			console.error('Failed to export selected customers:', error)
			toast.error(getErrorMessage(error, 'Failed to export selected customers'))
		}
	}

	const renderCustomerCell = (columnId: TableColumnId, customer: Customer) => {
		switch (columnId) {
			case 'customer':
				return (
					<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-700 dark:text-emerald-200 font-bold border-2 border-border shadow-sm shrink-0 uppercase">
							{customer.avatar_url ? (
								<img
									src={customer.avatar_url}
									alt={customer.name || 'Customer avatar'}
									className="w-full h-full rounded-full object-cover"
								/>
							) : (
								customer.name?.charAt(0) || '?'
							)}
						</div>
						<div>
								<div className="font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
									{customer.name}
								</div>
								<div className="text-[10px] text-muted-foreground capitalize">
									{customer.source || 'Direct'}
								</div>
						</div>
					</div>
				)
			case 'contact':
				return (
					<div className="font-medium text-xs">
						<div>{customer.phone_number || '-'}</div>
							<div className="text-[10px] text-muted-foreground lowercase">
								{customer.email || 'No email'}
							</div>
					</div>
				)
			case 'additional_info': {
				const entries = getAdditionalInfoEntries(customer)
				if (entries.length === 0) {
						return <span className="text-muted-foreground text-xs">-</span>
				}

				const previewEntries = entries.slice(0, 2)
				const moreCount = entries.length - previewEntries.length

				return (
					<div className="space-y-1 max-w-[250px]">
						{previewEntries.map((entry) => (
							<div
								key={entry.key}
									className="text-[11px] text-muted-foreground leading-tight break-words"
								>
									<span className="font-semibold text-muted-foreground">{entry.label}:</span>{' '}
									{entry.value}
								</div>
						))}
						{moreCount > 0 && (
								<div className="text-[10px] text-muted-foreground">+{moreCount} more</div>
						)}
					</div>
				)
			}
			case 'stage':
				return customer.pipeline_stage_name ? (
					<span
						className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
						style={{
							backgroundColor: `${customer.pipeline_stage_color}15`,
							color: customer.pipeline_stage_color,
							borderColor: `${customer.pipeline_stage_color}30`,
						}}
					>
						{customer.pipeline_stage_name}
					</span>
				) : (
						<span className="text-muted-foreground text-xs">-</span>
				)
			case 'tags':
				return (
					<div className="flex flex-wrap gap-1 max-w-[180px]">
						{customer.tags && customer.tags.length > 0 ? (
							customer.tags.map((tag) => (
									<span
										key={tag.id}
										className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border"
									>
										{tag.name}
									</span>
								))
							) : (
								<span className="text-muted-foreground text-xs">-</span>
							)}
						</div>
				)
			case 'window':
				return customer.is_window_active ? (
									<div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
						<div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
						ACTIVE
					</div>
				) : (
						<div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
							<div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
							EXPIRED
						</div>
				)
			case 'messages':
				return (
					<div className="flex flex-col">
							<span className="font-bold text-foreground">
								{customer.message_count || 0}
							</span>
							<span className="text-[9px] text-muted-foreground uppercase">
								Total Messages
							</span>
						</div>
					)
			case 'last_contact':
					return (
						<span className="text-muted-foreground text-xs whitespace-nowrap">
							{formatDateCell(customer.last_contact_at, true)}
						</span>
					)
			case 'created_at':
					return (
						<span className="text-muted-foreground text-xs whitespace-nowrap">
							{formatDateCell(customer.created_at)}
						</span>
					)
			default:
				return null
		}
	}

	if (loading) return null

	const formatCount = (value: number) => value.toLocaleString('id-ID')
	const totalCountForCard = customerStats?.total ?? totalCustomers
	const consentedCountForCard = customerStats?.consented ?? 0
	const activeWindowCountForCard = customerStats?.active_window ?? 0
	const blacklistedCountForCard = customerStats?.blacklisted ?? 0

	return (
		<main className="flex-1 min-h-0 flex flex-col bg-background overflow-hidden">
			<PageHeader
				title="Customers"
				description="View and manage your business contacts from all channels"
				icon={<Users size={24} />}
				actions={null}
			/>

			<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
				{activeTab === 'list' && (
					<div className="px-4 lg:px-8 mb-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
						<div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Users size={18} className="text-blue-500" />
									<span>Total Customers</span>
								</div>
								<div className="mt-2 text-3xl font-semibold text-foreground">
									{loadingCustomerStats && !customerStats
										? '...'
										: formatCount(totalCountForCard)}
								</div>
							</div>

							<div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<UserCheck size={18} className="text-emerald-500" />
									<span>Consented</span>
								</div>
								<div className="mt-2 text-3xl font-semibold text-foreground">
									{loadingCustomerStats && !customerStats
										? '...'
										: formatCount(consentedCountForCard)}
								</div>
							</div>

							<div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Clock3 size={18} className="text-amber-500" />
									<span>Active Window</span>
								</div>
								<div className="mt-2 text-3xl font-semibold text-foreground">
									{loadingCustomerStats && !customerStats
										? '...'
										: formatCount(activeWindowCountForCard)}
								</div>
							</div>

							<div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<UserX size={18} className="text-rose-500" />
									<span>Blacklisted</span>
								</div>
								<div className="mt-2 text-3xl font-semibold text-foreground">
									{loadingCustomerStats && !customerStats
										? '...'
										: formatCount(blacklistedCountForCard)}
								</div>
							</div>
					</div>
				)}

				<div className="px-4 lg:px-8 mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
						<div
							role="tablist"
							aria-orientation="horizontal"
							className="bg-muted/70 text-muted-foreground inline-flex h-10 items-center justify-center rounded-lg p-1 w-full lg:w-auto"
							style={{ outline: 'none' }}
						>
							<button
								type="button"
								role="tab"
								aria-selected={activeTab === 'list'}
								onClick={() => setActiveTab('list')}
								className={`flex-1 lg:flex-none ring-offset-background focus-visible:ring-foreground/80 justify-center rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex items-center gap-2 ${
									activeTab === 'list'
										? 'bg-card text-foreground shadow-sm'
										: 'hover:text-foreground'
								}`}
							>
							<Users className="h-4 w-4" />
							List
						</button>
							<button
								type="button"
								role="tab"
								aria-selected={activeTab === 'groups'}
								onClick={() => setActiveTab('groups')}
								className={`flex-1 lg:flex-none ring-offset-background focus-visible:ring-foreground/80 justify-center rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex items-center gap-2 ${
									activeTab === 'groups'
										? 'bg-card text-foreground shadow-sm'
										: 'hover:text-foreground'
								}`}
							>
							<Filter className="h-4 w-4" />
							Groups
						</button>
					</div>

					{activeTab === 'list' && (
						<div className="flex w-full flex-col lg:flex-row lg:items-center gap-3 lg:w-auto">
							<div className="relative w-full lg:w-72">
									<Search
										className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
										size={16}
									/>
								<input
									type="text"
									placeholder="Search customers..."
									value={searchQuery}
									onChange={(event) => setSearchQuery(event.target.value)}
										className="w-full pl-9 pr-4 py-2 bg-background border border-input text-foreground rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
								/>
							</div>

							<Button
								type="button"
								variant="outline"
								className="gap-2"
								disabled={selectedCustomerIds.length === 0}
								onClick={exportSelectedCustomers}
							>
								<Download size={14} />
								Export Selected
							</Button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button type="button" variant="outline" className="gap-2">
										<Settings2 size={14} />
										View
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-52">
									<DropdownMenuGroup>
										<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{TABLE_COLUMNS.map((column) => (
											<DropdownMenuCheckboxItem
												key={column.id}
												checked={columnVisibility[column.id]}
												onCheckedChange={(checked) =>
													setColumnVisible(column.id, checked === true)
												}
												disabled={
													columnVisibility[column.id] &&
													Object.values(columnVisibility).filter(Boolean)
														.length === 1
												}
											>
												{column.label}
											</DropdownMenuCheckboxItem>
										))}
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}
				</div>

				<div className="flex-1 min-h-0 overflow-y-auto p-4 pb-20 pt-0 lg:p-8 lg:pb-8 lg:pt-0">
					{activeTab === 'list' && (
						<div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
							<div className="divide-y divide-border md:hidden">
								{loadingCustomers ? (
									<div className="px-4 py-12 text-center text-muted-foreground">
										<div className="flex flex-col items-center gap-2">
											<div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
											Loading customers...
										</div>
									</div>
								) : customers.length === 0 ? (
									<div className="px-4 py-12 text-center text-muted-foreground">
										No customers found.
									</div>
								) : (
									customers.map((customer) => (
										<button
											key={customer.id}
											type="button"
											className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/50"
											onClick={() =>
												navigate({
													to: '/customers/$customerId',
													params: { customerId: customer.id },
												})
											}
										>
											<div className="flex items-start gap-3">
												<Checkbox
													checked={selectedCustomerSet.has(customer.id)}
													onClick={(event) => event.stopPropagation()}
													onCheckedChange={(checked) =>
														toggleCustomerSelection(customer, checked === true)
													}
													aria-label={`Select ${customer.name}`}
												/>
												<div className="h-10 w-10 shrink-0 rounded-full border-2 border-border bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-950/30 dark:text-emerald-200">
													{customer.avatar_url ? (
														<img
															src={customer.avatar_url}
															alt={customer.name || 'Customer avatar'}
															className="h-full w-full rounded-full object-cover"
														/>
													) : (
														<div className="flex h-full w-full items-center justify-center text-sm font-bold uppercase">
															{customer.name?.charAt(0) || '?'}
														</div>
													)}
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-start justify-between gap-2">
														<p className="truncate text-sm font-semibold text-foreground">
															{customer.name || 'Unknown customer'}
														</p>
														<span
															className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
																customer.is_window_active
																	? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/45 dark:text-emerald-200'
																	: 'bg-muted text-muted-foreground'
															}`}
														>
															{customer.is_window_active ? 'ACTIVE' : 'EXPIRED'}
														</span>
													</div>
													<p className="mt-0.5 truncate text-xs text-muted-foreground">
														{customer.phone_number || customer.email || '-'}
													</p>
													<div className="mt-2 flex flex-wrap items-center gap-1.5">
														{customer.pipeline_stage_name ? (
															<span
																className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
																style={{
																	backgroundColor: `${customer.pipeline_stage_color}15`,
																	color: customer.pipeline_stage_color,
																	borderColor: `${customer.pipeline_stage_color}30`,
																}}
															>
																{customer.pipeline_stage_name}
															</span>
														) : null}
														<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
															{customer.source || 'direct'}
														</span>
														<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
															{customer.message_count || 0} msgs
														</span>
													</div>
													<p className="mt-2 text-[11px] text-muted-foreground">
														Last contact:{' '}
														<span className="font-medium text-foreground">
															{formatDateCell(customer.last_contact_at, true)}
														</span>
													</p>
												</div>
											</div>
										</button>
									))
								)}
							</div>

							<div className="hidden overflow-x-auto md:block">
								<table className="w-full text-sm text-left min-w-[1400px]">
								<thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border font-semibold">
										<tr>
											<th className="px-4 py-4 w-12">
												<Checkbox
													checked={allCurrentPageSelected}
													onClick={(event) => event.stopPropagation()}
													onCheckedChange={(checked) =>
														toggleCurrentPageSelection(checked === true)
													}
													aria-label="Select all rows on current page"
												/>
											</th>
											{visibleColumns.map((column) => (
												<th key={column.id} className="px-6 py-4">
													<div className="flex items-center gap-2">
														<span>{column.label}</span>
																	{column.sortField && (
																		<DropdownMenu>
																			<DropdownMenuTrigger asChild>
																		<button
																				type="button"
																				className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
																				aria-label={`Sort ${column.label}`}
																		>
																		{sortBy === column.sortField ? (
																			sortOrder === 'asc' ? (
																				<ArrowUp size={13} />
																			) : (
																				<ArrowDown size={13} />
																			)
																		) : (
																			<ChevronsUpDown size={13} />
																		)}
																	</button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end" className="w-36">
																	<DropdownMenuItem
																		onClick={() =>
																			handleSortColumn(column, 'asc')
																		}
																	>
																		<ArrowUp size={14} />
																		Asc
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={() =>
																			handleSortColumn(column, 'desc')
																		}
																	>
																		<ArrowDown size={14} />
																		Desc
																	</DropdownMenuItem>
																	<DropdownMenuSeparator />
																	<DropdownMenuItem
																		disabled={visibleColumns.length <= 1}
																		onClick={() =>
																			setColumnVisible(column.id, false)
																		}
																	>
																		<EyeOff size={14} />
																		Hide
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														)}
													</div>
												</th>
											))}
										</tr>
									</thead>
								<tbody className="divide-y divide-border">
										{loadingCustomers ? (
											<tr>
													<td
														colSpan={visibleColumns.length + 1}
														className="px-6 py-12 text-center text-muted-foreground"
													>
													<div className="flex flex-col items-center gap-2">
														<div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
														Loading customers...
													</div>
												</td>
											</tr>
										) : customers.length === 0 ? (
											<tr>
												<td
													colSpan={visibleColumns.length + 1}
														className="px-6 py-12 text-center text-muted-foreground"
													>
													No customers found.
												</td>
											</tr>
										) : (
											customers.map((customer) => (
												<tr
													key={customer.id}
													className="hover:bg-muted/50 transition-colors group cursor-pointer"
													onClick={() =>
														navigate({
															to: '/customers/$customerId',
															params: { customerId: customer.id },
														})
													}
												>
													<td className="px-4 py-4">
														<Checkbox
															checked={selectedCustomerSet.has(customer.id)}
															onClick={(event) => event.stopPropagation()}
															onCheckedChange={(checked) =>
																toggleCustomerSelection(
																	customer,
																	checked === true,
																)
															}
															aria-label={`Select ${customer.name}`}
														/>
													</td>
													{visibleColumns.map((column) => (
														<td
															key={`${customer.id}-${column.id}`}
															className="px-6 py-4"
														>
															{renderCustomerCell(column.id, customer)}
														</td>
													))}
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>

								<div className="border-t border-border px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
									<p className="text-sm text-muted-foreground">
										{selectedCustomerIds.length} of {totalCustomers} row(s)
										selected.
									</p>

								<div className="flex flex-wrap items-center gap-3">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<span>Rows per page</span>
										<NativeSelect
											className="w-[86px]"
											value={String(perPage)}
											onChange={(event) => {
												setPerPage(Number(event.target.value))
												setPage(1)
											}}
										>
											<NativeSelectOption value="10">10</NativeSelectOption>
											<NativeSelectOption value="20">20</NativeSelectOption>
											<NativeSelectOption value="50">50</NativeSelectOption>
											<NativeSelectOption value="100">100</NativeSelectOption>
										</NativeSelect>
									</div>

								<p className="text-sm font-medium text-foreground">
									Page {currentPage} of {totalPages}
								</p>

									<div className="flex items-center gap-1">
										<Button
											type="button"
											variant="outline"
											size="icon-sm"
											disabled={page <= 1 || loadingCustomers}
											onClick={() => setPage(1)}
											aria-label="First page"
										>
											<ChevronsLeft size={14} />
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon-sm"
											disabled={page <= 1 || loadingCustomers}
											onClick={() => setPage((prev) => Math.max(1, prev - 1))}
											aria-label="Previous page"
										>
											<ChevronLeft size={14} />
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon-sm"
											disabled={page >= totalPages || loadingCustomers}
											onClick={() =>
												setPage((prev) => Math.min(totalPages, prev + 1))
											}
											aria-label="Next page"
										>
											<ChevronRight size={14} />
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon-sm"
											disabled={page >= totalPages || loadingCustomers}
											onClick={() => setPage(totalPages)}
											aria-label="Last page"
										>
											<ChevronsRight size={14} />
										</Button>
									</div>
								</div>
							</div>
						</div>
					)}

						{activeTab === 'groups' && (
											<div className="bg-card rounded-xl border border-dashed border-border py-16">
								<div className="flex flex-col items-center justify-center text-center">
									<Users className="text-muted-foreground mb-4 h-12 w-12" />
									<h3 className="mb-2 text-lg font-semibold text-foreground">
										No groups yet
									</h3>
									<p className="text-muted-foreground mb-6 max-w-sm">
										Create segments to organize your customers and send targeted
										campaigns.
									</p>
								<button
									type="button"
									className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium shadow-sm"
								>
									Create Group
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</main>
	)
}
