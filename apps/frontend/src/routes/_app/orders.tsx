import { createFileRoute } from '@tanstack/react-router'
import {
	ArrowDownUp,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	CircleDollarSign,
	Download,
	Loader2,
	MoreVertical,
	Search,
	ShoppingCart,
	SquareKanban,
	TrendingUp,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
	type OrderReportParams,
	orders as ordersApi,
	type OrdersListParams,
	type SubscriptionsListParams,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

type TabKey = 'orders' | 'subscriptions'
type SortDirection = 'asc' | 'desc'

interface OrdersSearch {
	activeTab?: string
}

interface ContactSummary {
	display_name?: string | null
	email?: string | null
	phone_number?: string | null
}

interface OrderProduct {
	id: string
	product_name?: string | null
	quantity?: number | null
}

interface OrderInvoice {
	id: string
	status?: string | null
}

interface OrderRow {
	id: string
	order_number?: number | null
	created_at?: string | null
	order_status?: string | null
	grand_total?: number | null
	contact?: ContactSummary | null
	conversation?: {
		inbox?: {
			name?: string | null
		} | null
	} | null
	invoices?: OrderInvoice[] | null
	scalebiz_orders_products?: OrderProduct[] | null
}

interface SubscriptionRow {
	id: string
	number?: string | null
	subscription_number?: number | null
	status?: string | null
	type?: string | null
	item?: string | null
	start_date?: string | null
	next_billing?: string | null
	end_date?: string | null
	cycles?: number | null
	billing_amount?: number | null
	contact?: ContactSummary | null
}

interface PaginationData {
	page: number
	limit: number
	total_items: number
	total_pages: number
}

interface ReportMetric {
	current: number
	previous: number
	growth: number
}

interface OrderReportData {
	total_sales: ReportMetric
	total_orders: ReportMetric
	total_completed_orders: ReportMetric
}

interface OrdersQueryState {
	page: number
	limit: number
	search: string
	sortField: string
	sortDirection: SortDirection
	orderStatus: string
}

interface SubscriptionsQueryState {
	page: number
	limit: number
	search: string
	sortField: string
	sortDirection: SortDirection
}

const PAGE_SIZE_OPTIONS = ['25', '50', '100']

const ORDER_SORT_OPTIONS = [
	{ value: 'created_at:desc', label: 'Sort by Newest Date' },
	{ value: 'created_at:asc', label: 'Sort by Oldest Date' },
	{ value: 'order_number:desc', label: 'Sort by Highest Number' },
	{ value: 'order_number:asc', label: 'Sort by Lowest Number' },
]

const SUBSCRIPTION_SORT_OPTIONS = [
	{ value: 'subscription_number:desc', label: 'Sort by Highest Number' },
	{ value: 'subscription_number:asc', label: 'Sort by Lowest Number' },
	{ value: 'created_at:desc', label: 'Sort by Newest Date' },
	{ value: 'created_at:asc', label: 'Sort by Oldest Date' },
]

const ORDER_STATUS_OPTIONS = [
	{ value: 'all', label: 'All Status' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'cancelled', label: 'Cancelled' },
]

const REPORT_RANGE_OPTIONS = [
	{ value: 'month', label: 'Month' },
	{ value: '7d', label: 'Last 7 Days' },
	{ value: '30d', label: 'Last 30 Days' },
]

const currencyFormatter = new Intl.NumberFormat('id-ID', {
	maximumFractionDigits: 0,
})

const compactNumberFormatter = new Intl.NumberFormat('id-ID', {
	maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
})

const monthDateFormatter = new Intl.DateTimeFormat('id-ID', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
})

export const Route = createFileRoute('/_app/orders')({
	validateSearch: (search: OrdersSearch) => ({
		activeTab:
			search.activeTab === 'subscriptions' ? 'subscriptions' : 'orders',
	}),
	component: OrdersPage,
})

function formatCurrency(value: number): string {
	return `Rp${currencyFormatter.format(Math.max(0, Math.round(value)))}`
}

function formatCompactNumber(value: number): string {
	return compactNumberFormatter.format(Math.max(0, Math.round(value)))
}

function formatDateTime(value?: string | null): string {
	if (!value) return '-'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return '-'
	return dateFormatter.format(date)
}

function formatDate(value?: string | null): string {
	if (!value) return '-'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return '-'
	return monthDateFormatter.format(date)
}

function formatGrowth(value: number): string {
	const sign = value >= 0 ? '+' : '-'
	return `${sign}${compactNumberFormatter.format(Math.abs(Math.round(value)))}`
}

function formatGrowthValue(value: number, asCurrency = false): string {
	const sign = value >= 0 ? '+' : '-'
	const absolute = Math.abs(Math.round(value))
	if (asCurrency) {
		return `${sign}${formatCurrency(absolute)}`
	}
	return `${sign}${formatCompactNumber(absolute)}`
}

function toTitleCaseStatus(value?: string | null): string {
	const normalized = String(value || '')
		.trim()
		.toLowerCase()
	if (!normalized) return '-'
	return normalized.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function getStatusBadgeClass(value?: string | null): string {
	const normalized = String(value || '')
		.trim()
		.toLowerCase()

	if (['paid', 'completed', 'active'].includes(normalized)) {
		return 'bg-emerald-100 text-emerald-700'
	}

	if (['pending', 'waiting'].includes(normalized)) {
		return 'bg-amber-100 text-amber-700'
	}

	if (['cancelled', 'failed', 'expired'].includes(normalized)) {
		return 'bg-rose-100 text-rose-700'
	}

	return 'bg-slate-100 text-slate-700'
}

function useDebouncedValue(value: string, delay = 350): string {
	const [debounced, setDebounced] = useState(value)

	useEffect(() => {
		const handle = window.setTimeout(() => setDebounced(value), delay)
		return () => window.clearTimeout(handle)
	}, [value, delay])

	return debounced
}

function splitSortValue(value: string): { sortField: string; sortDirection: SortDirection } {
	const [field, direction] = value.split(':')
	return {
		sortField: field || 'created_at',
		sortDirection: direction === 'asc' ? 'asc' : 'desc',
	}
}

function buildReportParams(period: string): OrderReportParams {
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

	if (period === '7d') {
		const start = new Date(today)
		start.setDate(start.getDate() - 6)
		return {
			startDate: start.toISOString().slice(0, 10),
			endDate: now.toISOString().slice(0, 10),
		}
	}

	if (period === '30d') {
		const start = new Date(today)
		start.setDate(start.getDate() - 29)
		return {
			startDate: start.toISOString().slice(0, 10),
			endDate: now.toISOString().slice(0, 10),
		}
	}

	return {
		startDate: '',
		endDate: '',
	}
}

function createCsvValue(value: unknown): string {
	const raw = String(value ?? '')
	const escaped = raw.replace(/"/g, '""')
	return `"${escaped}"`
}

function buildOrdersCsv(rows: OrderRow[]): string {
	const header = [
		'Number',
		'Customer',
		'Created Date',
		'Platform',
		'Payment Status',
		'Item Count',
		'Amount',
		'Order Status',
	]

	const body = rows.map((row) => {
		const firstInvoice = row.invoices?.[0]
		const customerName =
			row.contact?.display_name || row.contact?.email || row.contact?.phone_number || '-'
		const platformName = row.conversation?.inbox?.name || '-'
		const itemCount = row.scalebiz_orders_products?.length || 0
		return [
			row.order_number ? `#${row.order_number}` : '-',
			customerName,
			formatDateTime(row.created_at),
			platformName,
			firstInvoice?.status || 'PENDING',
			itemCount,
			formatCurrency(Number(row.grand_total || 0)),
			row.order_status || 'pending',
		]
	})

	return [header, ...body]
		.map((line) => line.map((item) => createCsvValue(item)).join(','))
		.join('\n')
}

function buildSubscriptionsCsv(rows: SubscriptionRow[]): string {
	const header = [
		'Number',
		'Customer',
		'Type',
		'Item',
		'Status',
		'Start Date',
		'Next Billing',
		'End Date',
		'Cycles',
		'Billing Amount',
	]

	const body = rows.map((row) => {
		const customerName =
			row.contact?.display_name || row.contact?.email || row.contact?.phone_number || '-'
		return [
			row.number || '-',
			customerName,
			row.type || '-',
			row.item || '-',
			row.status || '-',
			formatDate(row.start_date),
			formatDate(row.next_billing),
			formatDate(row.end_date),
			row.cycles || 0,
			formatCurrency(Number(row.billing_amount || 0)),
		]
	})

	return [header, ...body]
		.map((line) => line.map((item) => createCsvValue(item)).join(','))
		.join('\n')
}

function triggerCsvDownload(content: string, filename: string): void {
	const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	link.click()
	URL.revokeObjectURL(url)
}

function StatCard({
	title,
	value,
	growth,
	icon,
}: {
	title: string
	value: string
	growth?: string
	icon: React.ComponentType<{ className?: string }>
}) {
	const Icon = icon
	const isNegativeGrowth = (growth || '').startsWith('-')

	return (
		<Card className="py-0">
			<CardContent className="p-4 sm:p-5">
				<div className="flex items-center justify-between gap-3">
					<div className="space-y-1">
						<p className="text-muted-foreground text-sm">{title}</p>
						<p className="text-2xl font-semibold leading-tight">{value}</p>
					</div>
					<div className="flex flex-col items-end gap-2">
						<div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
							<Icon className="h-4 w-4" />
						</div>
						{growth && (
							<p
								className={`text-xs font-medium ${
									isNegativeGrowth ? 'text-rose-600' : 'text-emerald-600'
								}`}
							>
								{isNegativeGrowth ? '▼' : '▲'} {growth}
							</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

function OrdersPage() {
	const search = Route.useSearch()
	const navigate = Route.useNavigate()

	const activeTab = (search.activeTab || 'orders') as TabKey

	const [ordersData, setOrdersData] = useState<OrderRow[]>([])
	const [ordersPagination, setOrdersPagination] = useState<PaginationData>({
		page: 1,
		limit: 50,
		total_items: 0,
		total_pages: 1,
	})
	const [ordersLoading, setOrdersLoading] = useState(false)

	const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionRow[]>([])
	const [subscriptionsPagination, setSubscriptionsPagination] =
		useState<PaginationData>({
			page: 1,
			limit: 50,
			total_items: 0,
			total_pages: 1,
		})
	const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)

	const [reportData, setReportData] = useState<OrderReportData>({
		total_sales: { current: 0, previous: 0, growth: 0 },
		total_orders: { current: 0, previous: 0, growth: 0 },
		total_completed_orders: { current: 0, previous: 0, growth: 0 },
	})
	const [reportLoading, setReportLoading] = useState(false)
	const [reportPeriod, setReportPeriod] = useState('month')

	const [ordersQuery, setOrdersQuery] = useState<OrdersQueryState>({
		page: 1,
		limit: 50,
		search: '',
		sortField: 'created_at',
		sortDirection: 'desc',
		orderStatus: 'all',
	})
	const [subscriptionsQuery, setSubscriptionsQuery] =
		useState<SubscriptionsQueryState>({
			page: 1,
			limit: 50,
			search: '',
			sortField: 'subscription_number',
			sortDirection: 'desc',
		})

	const debouncedOrdersSearch = useDebouncedValue(ordersQuery.search)
	const debouncedSubscriptionsSearch = useDebouncedValue(subscriptionsQuery.search)

	const orderSortValue = `${ordersQuery.sortField}:${ordersQuery.sortDirection}`
	const subscriptionSortValue = `${subscriptionsQuery.sortField}:${subscriptionsQuery.sortDirection}`

	const onTabChange = (value: string) => {
		const nextTab: TabKey = value === 'subscriptions' ? 'subscriptions' : 'orders'
		navigate({
			search: (prev) => ({
				...prev,
				activeTab: nextTab,
			}),
			replace: true,
		})
	}

	const loadReport = useCallback(async () => {
		setReportLoading(true)
		try {
			const params = buildReportParams(reportPeriod)
			const response = (await ordersApi.report(params)) as {
				data?: Partial<OrderReportData>
			}
			if (response?.data) {
				setReportData({
					total_sales: {
						current: Number(response.data.total_sales?.current || 0),
						previous: Number(response.data.total_sales?.previous || 0),
						growth: Number(response.data.total_sales?.growth || 0),
					},
					total_orders: {
						current: Number(response.data.total_orders?.current || 0),
						previous: Number(response.data.total_orders?.previous || 0),
						growth: Number(response.data.total_orders?.growth || 0),
					},
					total_completed_orders: {
						current: Number(response.data.total_completed_orders?.current || 0),
						previous: Number(response.data.total_completed_orders?.previous || 0),
						growth: Number(response.data.total_completed_orders?.growth || 0),
					},
				})
			}
		} catch (error) {
			console.error('Failed to fetch order report', error)
			toast.error('Failed to fetch order summary')
		} finally {
			setReportLoading(false)
		}
	}, [reportPeriod])

	const loadOrders = useCallback(async () => {
		setOrdersLoading(true)
		try {
			const params: OrdersListParams = {
				page: ordersQuery.page,
				limit: ordersQuery.limit,
				search: debouncedOrdersSearch.trim() || undefined,
				sortField: ordersQuery.sortField,
				sortDirection: ordersQuery.sortDirection,
				orderStatus:
					ordersQuery.orderStatus !== 'all'
						? ordersQuery.orderStatus
						: undefined,
				paymentType: 'one_time_payment',
				includeConversation: true,
			}

			const response = (await ordersApi.list(params)) as {
				data?: {
					orders?: OrderRow[]
					pagination?: PaginationData
				}
			}

			setOrdersData(response?.data?.orders || [])
			setOrdersPagination(
				response?.data?.pagination || {
					page: 1,
					limit: ordersQuery.limit,
					total_items: 0,
					total_pages: 1,
				},
			)
		} catch (error) {
			console.error('Failed to fetch orders', error)
			toast.error('Failed to fetch orders')
		} finally {
			setOrdersLoading(false)
		}
	}, [
		ordersQuery.page,
		ordersQuery.limit,
		ordersQuery.sortField,
		ordersQuery.sortDirection,
		ordersQuery.orderStatus,
		debouncedOrdersSearch,
	])

	const loadSubscriptions = useCallback(async () => {
		setSubscriptionsLoading(true)
		try {
			const params: SubscriptionsListParams = {
				page: subscriptionsQuery.page,
				limit: subscriptionsQuery.limit,
				search: debouncedSubscriptionsSearch.trim() || undefined,
				sortField: subscriptionsQuery.sortField,
				sortDirection: subscriptionsQuery.sortDirection,
			}

			const response = (await ordersApi.listSubscriptions(params)) as {
				data?: {
					subscriptions?: SubscriptionRow[]
					pagination?: PaginationData
				}
			}

			setSubscriptionsData(response?.data?.subscriptions || [])
			setSubscriptionsPagination(
				response?.data?.pagination || {
					page: 1,
					limit: subscriptionsQuery.limit,
					total_items: 0,
					total_pages: 1,
				},
			)
		} catch (error) {
			console.error('Failed to fetch subscriptions', error)
			toast.error('Failed to fetch subscriptions')
		} finally {
			setSubscriptionsLoading(false)
		}
	}, [
		subscriptionsQuery.page,
		subscriptionsQuery.limit,
		subscriptionsQuery.sortField,
		subscriptionsQuery.sortDirection,
		debouncedSubscriptionsSearch,
	])

	useEffect(() => {
		loadReport()
	}, [loadReport])

	useEffect(() => {
		if (activeTab === 'orders') {
			loadOrders()
		}
	}, [activeTab, loadOrders])

	useEffect(() => {
		if (activeTab === 'subscriptions') {
			loadSubscriptions()
		}
	}, [activeTab, loadSubscriptions])

	const handleOrdersExport = () => {
		if (ordersData.length === 0) {
			toast.info('No order data to export')
			return
		}
		triggerCsvDownload(
			buildOrdersCsv(ordersData),
			`orders-${new Date().toISOString().slice(0, 10)}.csv`,
		)
	}

	const handleSubscriptionsExport = () => {
		if (subscriptionsData.length === 0) {
			toast.info('No subscription data to export')
			return
		}
		triggerCsvDownload(
			buildSubscriptionsCsv(subscriptionsData),
			`subscriptions-${new Date().toISOString().slice(0, 10)}.csv`,
		)
	}

	const isOrdersTab = activeTab === 'orders'
	const isLoading = isOrdersTab ? ordersLoading : subscriptionsLoading
	const totalData = isOrdersTab
		? ordersPagination.total_items
		: subscriptionsPagination.total_items
	const currentPage = isOrdersTab ? ordersPagination.page : subscriptionsPagination.page
	const totalPages = isOrdersTab
		? ordersPagination.total_pages
		: subscriptionsPagination.total_pages
	const currentLimit = isOrdersTab ? ordersQuery.limit : subscriptionsQuery.limit

	const updatePage = (nextPage: number) => {
		if (isOrdersTab) {
			setOrdersQuery((prev) => ({ ...prev, page: nextPage }))
			return
		}
		setSubscriptionsQuery((prev) => ({ ...prev, page: nextPage }))
	}

	const updatePageSize = (value: string) => {
		const parsed = Number(value)
		if (!Number.isFinite(parsed) || parsed <= 0) return

		if (isOrdersTab) {
			setOrdersQuery((prev) => ({ ...prev, page: 1, limit: parsed }))
			return
		}
		setSubscriptionsQuery((prev) => ({ ...prev, page: 1, limit: parsed }))
	}

	const topCards = useMemo(
		() => [
			{
				title: 'Balance',
				value: formatCurrency(0),
				growth: undefined as string | undefined,
				icon: CircleDollarSign,
			},
			{
				title: 'Total Sales',
				value: formatCurrency(reportData.total_sales.current),
				growth: formatGrowthValue(reportData.total_sales.growth, true),
				icon: TrendingUp,
			},
			{
				title: 'Total Orders',
				value: formatCompactNumber(reportData.total_orders.current),
				growth: formatGrowthValue(reportData.total_orders.growth),
				icon: ShoppingCart,
			},
			{
				title: 'Completed Orders',
				value: formatCompactNumber(reportData.total_completed_orders.current),
				growth: formatGrowthValue(reportData.total_completed_orders.growth),
				icon: SquareKanban,
			},
		],
		[reportData],
	)

	return (
		<div className="h-full w-full overflow-y-auto bg-muted/20">
			<div className="space-y-4 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
				<Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<TabsList>
							<TabsTrigger value="orders">Orders</TabsTrigger>
							<TabsTrigger value="subscriptions">Subscription</TabsTrigger>
						</TabsList>

						<div className="flex flex-wrap items-center justify-end gap-2">
							{isOrdersTab && (
								<Select value={reportPeriod} onValueChange={setReportPeriod}>
									<SelectTrigger className="h-9 min-w-[140px]">
										<SelectValue placeholder="Date range" />
									</SelectTrigger>
									<SelectContent>
										{REPORT_RANGE_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
							<Button
								onClick={() =>
									toast.info(
										isOrdersTab
											? 'Create Order flow is coming soon.'
											: 'Create Subscription flow is coming soon.',
									)
								}
							>
								{isOrdersTab ? 'Create Order' : 'Create Subscription'}
							</Button>
						</div>
					</div>

					{isOrdersTab && (
						<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
							{topCards.map((card) => (
								<StatCard
									key={card.title}
									title={card.title}
									value={reportLoading ? 'Loading...' : card.value}
									growth={card.growth}
									icon={card.icon}
								/>
							))}
						</div>
					)}

					<Card className="py-0">
						<CardHeader className="p-4 sm:p-6">
							<CardTitle className="text-xl">
								{isOrdersTab ? 'Order History' : 'Subscription History'}
							</CardTitle>
						</CardHeader>

						<CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
							<div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
								<div className="flex flex-wrap items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={isOrdersTab ? handleOrdersExport : handleSubscriptionsExport}
									>
										<Download className="mr-2 h-4 w-4" />
										Export
									</Button>
								</div>

								<div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
									<div className="relative sm:min-w-[280px]">
										<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
										<Input
											value={isOrdersTab ? ordersQuery.search : subscriptionsQuery.search}
											onChange={(event) => {
												const value = event.target.value
												if (isOrdersTab) {
													setOrdersQuery((prev) => ({ ...prev, page: 1, search: value }))
													return
												}
												setSubscriptionsQuery((prev) => ({ ...prev, page: 1, search: value }))
											}}
											placeholder="Search customer name, email, phone, address..."
											className="h-9 pl-9"
										/>
									</div>

									{isOrdersTab && (
										<Select
											value={ordersQuery.orderStatus}
											onValueChange={(value) =>
												setOrdersQuery((prev) => ({ ...prev, page: 1, orderStatus: value }))
											}
										>
											<SelectTrigger className="h-9 min-w-[150px]">
												<SelectValue placeholder="Filter By" />
											</SelectTrigger>
											<SelectContent>
												{ORDER_STATUS_OPTIONS.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									)}

									<Select
										value={isOrdersTab ? orderSortValue : subscriptionSortValue}
										onValueChange={(value) => {
											const { sortField, sortDirection } = splitSortValue(value)
											if (isOrdersTab) {
												setOrdersQuery((prev) => ({
													...prev,
													page: 1,
													sortField,
													sortDirection,
												}))
												return
											}
											setSubscriptionsQuery((prev) => ({
												...prev,
												page: 1,
												sortField,
												sortDirection,
											}))
										}}
									>
										<SelectTrigger className="h-9 min-w-[190px]">
											<ArrowDownUp className="mr-2 h-4 w-4" />
											<SelectValue placeholder="Sort" />
										</SelectTrigger>
										<SelectContent>
											{(isOrdersTab ? ORDER_SORT_OPTIONS : SUBSCRIPTION_SORT_OPTIONS).map(
												(option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								</div>
							</div>

							<Table>
								<TableHeader>
									<TableRow>
										{isOrdersTab ? (
											<>
												<TableHead>Number</TableHead>
												<TableHead>Customer</TableHead>
												<TableHead>Created Date</TableHead>
												<TableHead>Platform</TableHead>
												<TableHead>Payment Status</TableHead>
												<TableHead>Item</TableHead>
												<TableHead>Amount</TableHead>
												<TableHead>Order Status</TableHead>
												<TableHead className="text-right">Action</TableHead>
											</>
										) : (
											<>
												<TableHead>Number</TableHead>
												<TableHead>Customer</TableHead>
												<TableHead>Type</TableHead>
												<TableHead>Item</TableHead>
												<TableHead>Status</TableHead>
												<TableHead>Start Date</TableHead>
												<TableHead>Next Billing</TableHead>
												<TableHead>End Date</TableHead>
												<TableHead>Cycles</TableHead>
												<TableHead>Billing Amount</TableHead>
												<TableHead className="text-right">Action</TableHead>
											</>
										)}
									</TableRow>
								</TableHeader>

								<TableBody>
									{isLoading && (
										<TableRow>
											<TableCell colSpan={isOrdersTab ? 9 : 11} className="py-10 text-center">
												<div className="text-muted-foreground inline-flex items-center gap-2">
													<Loader2 className="h-4 w-4 animate-spin" />
													Loading data...
												</div>
											</TableCell>
										</TableRow>
									)}

									{!isLoading && isOrdersTab && ordersData.length === 0 && (
										<TableRow>
											<TableCell colSpan={9} className="py-16 text-center">
												<p className="text-base font-medium">No orders found</p>
												<p className="text-muted-foreground mt-1 text-sm">
													No orders match your current search or filters.
												</p>
											</TableCell>
										</TableRow>
									)}

									{!isLoading && !isOrdersTab && subscriptionsData.length === 0 && (
										<TableRow>
											<TableCell colSpan={11} className="py-16 text-center">
												<p className="text-base font-medium">No subscriptions found</p>
												<p className="text-muted-foreground mt-1 text-sm">
													We couldn't find any subscriptions matching your current search or filters.
												</p>
											</TableCell>
										</TableRow>
									)}

									{!isLoading &&
										isOrdersTab &&
										ordersData.map((row) => {
											const customerName =
												row.contact?.display_name ||
												row.contact?.email ||
												row.contact?.phone_number ||
												'-'
											const platformName = row.conversation?.inbox?.name || '-'
											const firstInvoice = row.invoices?.[0]
											const itemCount = row.scalebiz_orders_products?.length || 0
											return (
												<TableRow key={row.id}>
													<TableCell className="font-medium">
														{row.order_number ? `#${row.order_number}` : '-'}
													</TableCell>
													<TableCell>{customerName}</TableCell>
													<TableCell>{formatDateTime(row.created_at)}</TableCell>
													<TableCell>{platformName}</TableCell>
													<TableCell>
														<Badge
															variant="secondary"
															className={getStatusBadgeClass(firstInvoice?.status)}
														>
															{toTitleCaseStatus(firstInvoice?.status || 'PENDING')}
														</Badge>
													</TableCell>
													<TableCell>{itemCount} item</TableCell>
													<TableCell>{formatCurrency(Number(row.grand_total || 0))}</TableCell>
													<TableCell>
														<Badge
															variant="secondary"
															className={getStatusBadgeClass(row.order_status)}
														>
															{toTitleCaseStatus(row.order_status || 'pending')}
														</Badge>
													</TableCell>
													<TableCell className="text-right">
														<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
															<MoreVertical className="h-4 w-4" />
														</Button>
													</TableCell>
												</TableRow>
											)
										})}

									{!isLoading &&
										!isOrdersTab &&
										subscriptionsData.map((row) => {
											const customerName =
												row.contact?.display_name ||
												row.contact?.email ||
												row.contact?.phone_number ||
												'-'
											return (
												<TableRow key={row.id}>
													<TableCell className="font-medium">{row.number || '-'}</TableCell>
													<TableCell>{customerName}</TableCell>
													<TableCell>{row.type || '-'}</TableCell>
													<TableCell>{row.item || '-'}</TableCell>
													<TableCell>
														<Badge
															variant="secondary"
															className={getStatusBadgeClass(row.status)}
														>
															{toTitleCaseStatus(row.status || 'active')}
														</Badge>
													</TableCell>
													<TableCell>{formatDate(row.start_date)}</TableCell>
													<TableCell>{formatDate(row.next_billing)}</TableCell>
													<TableCell>{formatDate(row.end_date)}</TableCell>
													<TableCell>{row.cycles || 0}</TableCell>
													<TableCell>{formatCurrency(Number(row.billing_amount || 0))}</TableCell>
													<TableCell className="text-right">
														<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
															<MoreVertical className="h-4 w-4" />
														</Button>
													</TableCell>
												</TableRow>
											)
										})}
								</TableBody>
							</Table>

							<div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-muted-foreground text-sm">Total Data: {totalData}</p>

								<div className="flex flex-wrap items-center gap-3">
									<div className="flex items-center gap-1">
										<Button
											variant="outline"
											size="sm"
											onClick={() => updatePage(1)}
											disabled={currentPage <= 1}
										>
											<ChevronsLeft className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => updatePage(Math.max(1, currentPage - 1))}
											disabled={currentPage <= 1}
										>
											<ChevronLeft className="h-4 w-4" />
										</Button>
										<div className="min-w-[72px] text-center text-sm font-medium">
											{currentPage} / {Math.max(1, totalPages)}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => updatePage(Math.min(totalPages, currentPage + 1))}
											disabled={currentPage >= totalPages}
										>
											<ChevronRight className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => updatePage(totalPages)}
											disabled={currentPage >= totalPages}
										>
											<ChevronsRight className="h-4 w-4" />
										</Button>
									</div>

									<div className="flex items-center gap-2">
										<span className="text-muted-foreground text-sm">Show per Page:</span>
										<Select value={String(currentLimit)} onValueChange={updatePageSize}>
											<SelectTrigger className="h-9 min-w-[90px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{PAGE_SIZE_OPTIONS.map((size) => (
													<SelectItem key={size} value={size}>
														{size}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</Tabs>
			</div>
		</div>
	)
}
