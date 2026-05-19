import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import { metrics } from '@/lib/api'

import {
	RefreshCw,
	Download,
	Calendar,
	Info,
	MessageSquare,
	Users,
	Clock,
	CheckCircle2,
	AlertCircle,
	BarChart3,
	ShieldCheck,
	TrendingUp,
	X,
} from 'lucide-react'
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	Legend,
} from 'recharts'

export const Route = createFileRoute('/_app/dashboard')({
	component: Dashboard,
})

interface DashboardData {
	messages: {
		total: number
		today: number
		thisWeek: number
		thisMonth: number
		sent: number
		delivered: number
		read: number
		failed: number
		deliveryRate: number
		readRate: number
		byType: Record<string, number>
		byChannel: Record<string, number>
	}
	customers: {
		total: number
		newThisWeek: number
		activeWindows: number
	}
	whatsapp: {
		connected: boolean
		phoneNumber?: string
		verifiedName?: string
	}
	instagram: {
		connected: boolean
		conversations: number
		unreadCount: number
	}
	templates: {
		total: number
		approved: number
		pending: number
		rejected: number
		byCategory: {
			marketing: number
			utility: number
			authentication: number
		}
		usageThisMonth: number
	}
	quality: {
		rating: string | null
		messagingTier: string | null
		blockCount7days: number
		spamReportCount7days: number
		status: string
	}
	lastUpdated: string
}

const COLORS = ['#10b981', '#ec4899', '#f59e0b', '#3b82f6', '#8b5cf6']
type VolumeRange = '30d' | '7d' | 'today'

function Dashboard() {
	const [data, setData] = useState<DashboardData | null>(null)
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [volumeRange, setVolumeRange] = useState<VolumeRange>('30d')

	useEffect(() => {
		checkAuth()
		loadDashboardData()
	}, [])

	// Auth handled by root layout
	const checkAuth = async () => {
		// const token = localStorage.getItem('scalechat_token')
		// ...
	}

	const loadDashboardData = async () => {
		// Check if token exists before making request
		const token = localStorage.getItem('scalechat_token')
		if (!token) return

		setRefreshing(true)
		try {
			const result: any = await metrics.getDashboard()
			if (result.success) {
				setData(result.data)
			}
		} catch (error) {
			console.error('Failed to load dashboard data:', error)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	const messageVolumeData = useMemo(() => {
		const whatsappCount = data?.messages?.byChannel?.whatsapp || 0
		const instagramCount = data?.messages?.byChannel?.instagram || 0
		const formatter = new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: '2-digit',
		})
		const now = new Date()

		if (volumeRange === 'today') {
			return [
				{
					name: formatter.format(now),
					whatsapp: whatsappCount,
					instagram: instagramCount,
				},
			]
		}

		const daysInRange = volumeRange === '7d' ? 7 : 30
		const points = volumeRange === '7d' ? 7 : 9

		return Array.from({ length: points }, (_, index) => {
			const steps = Math.max(points - 1, 1)
			const dayOffset = Math.round(((steps - index) * (daysInRange - 1)) / steps)
			const pointDate = new Date(now)
			pointDate.setDate(now.getDate() - dayOffset)

			return {
				name: formatter.format(pointDate),
				whatsapp: index === points - 1 ? whatsappCount : 0,
				instagram: index === points - 1 ? instagramCount : 0,
			}
		})
	}, [data?.messages?.byChannel?.instagram, data?.messages?.byChannel?.whatsapp, volumeRange])

	const channelDistributionData = Object.entries(
		data?.messages?.byChannel || {},
	).map(([name, value]) => ({
		name: name.charAt(0).toUpperCase() + name.slice(1),
		value,
	}))

	const messageTypeData = Object.entries(data?.messages?.byType || {}).map(
		([name, value]) => ({
			name: name.charAt(0).toUpperCase() + name.slice(1),
			value,
		}),
	)

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center h-full">
				<div className="flex flex-col items-center gap-2">
					<RefreshCw className="animate-spin text-teal-600" size={32} />
					<p className="text-muted-foreground font-medium">Loading Dashboard...</p>
				</div>
			</div>
		)
	}

		return (
			<main className="flex-1 overflow-y-auto h-full bg-background">
			<DashboardHeader
				refreshing={refreshing}
				onRefresh={loadDashboardData}
			/>
			<div className="p-4 lg:p-8 pt-0 lg:pt-0">
				<div className="max-w-[1600px] mx-auto space-y-6 lg:space-y-8">
					{/* Top 4 Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{/* Messages Today */}
							<div className="bg-card p-6 rounded-xl border border-border shadow-sm relative overflow-hidden">
								<div className="flex justify-between items-start mb-4">
									<div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
										<MessageSquare size={16} className="text-blue-500" />
										Messages Today
									</div>
									<Info size={16} className="text-muted-foreground" />
								</div>
								<div className="text-3xl font-bold text-foreground mb-1">
									{data?.messages.today || 0}
								</div>
								<div className="text-xs text-muted-foreground">
									{data?.messages.deliveryRate.toFixed(1)}% delivered
								</div>
							<div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500/10">
								<div
									className="h-full bg-blue-500"
									style={{ width: `${data?.messages.deliveryRate}%` }}
								></div>
							</div>
						</div>

						{/* Total Customers */}
							<div className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<div className="flex justify-between items-start mb-4">
									<div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
										<Users size={16} className="text-emerald-500" />
										Total Customers
									</div>
									<Info size={16} className="text-muted-foreground" />
								</div>
								<div className="text-3xl font-bold text-foreground mb-1">
									{data?.customers.total || 0}
								</div>
							<div className="text-xs text-emerald-600 dark:text-emerald-400">
								+{data?.customers.newThisWeek || 0} new this week
							</div>
						</div>

						{/* Active Windows */}
							<div className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<div className="flex justify-between items-start mb-4">
									<div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
										<TrendingUp size={16} className="text-orange-500" />
										Active Windows
									</div>
									<Info size={16} className="text-muted-foreground" />
								</div>
								<div className="text-3xl font-bold text-foreground mb-1">
									{data?.customers.activeWindows || 0}
								</div>
								<div className="text-xs text-muted-foreground">Since last week</div>
							</div>

						{/* Quality Rating */}
							<div className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<div className="flex justify-between items-start mb-4">
									<div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
										<ShieldCheck size={16} className="text-purple-500" />
										Quality Rating
									</div>
									<Info size={16} className="text-muted-foreground" />
								</div>
							<div className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-200 rounded text-xs font-bold mb-1">
								{data?.quality.rating || 'N/A'}
							</div>
								<div className="text-xs text-muted-foreground">
									Tier: {data?.quality.messagingTier || 'N/A'}
								</div>
							</div>
					</div>

					{/* Message Volume Chart */}
						<div className="bg-card p-6 rounded-xl border border-border shadow-sm">
							<div className="flex items-center justify-between mb-8">
								<div>
									<h3 className="text-sm font-semibold text-foreground">
										Message Volume
									</h3>
									<p className="text-xs text-muted-foreground">
										{data?.messages.total || 0} total messages • WA:{' '}
										{data?.messages.byChannel.whatsapp || 0} • IG:{' '}
										{data?.messages.byChannel.instagram || 0}
									</p>
								</div>
								<select
									value={volumeRange}
									onChange={(event) =>
										setVolumeRange(event.target.value as VolumeRange)
									}
									className="bg-muted/60 border border-input text-foreground text-xs rounded-lg p-1.5"
								>
									<option value='30d'>Last 30 days</option>
									<option value='7d'>Last 7 days</option>
									<option value='today'>Today</option>
								</select>
							</div>
						<div className="h-64 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={messageVolumeData}>
									<CartesianGrid
										strokeDasharray='3 3'
										vertical={false}
									stroke='var(--color-border)'
									/>
									<XAxis
										dataKey='name'
										axisLine={false}
										tickLine={false}
									tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
										dy={10}
									/>
									<YAxis
										axisLine={false}
										tickLine={false}
									tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
									/>
									<Tooltip
									contentStyle={{
										borderRadius: '8px',
										border: '1px solid var(--color-border)',
										backgroundColor: 'var(--color-background)',
										color: 'var(--color-foreground)',
									}}
									itemStyle={{
										padding: '0 4px',
										color: 'var(--color-foreground)',
									}}
									/>
									<Legend iconType="circle" />
									<Line
										type='monotone'
										dataKey='whatsapp'
										stroke='#10b981'
										strokeWidth={3}
										dot={false}
										activeDot={{ r: 6 }}
									/>
									<Line
										type='monotone'
										dataKey='instagram'
										stroke='#ec4899'
										strokeWidth={3}
										dot={false}
										activeDot={{ r: 6 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>

					{/* Grid 3 Columns */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Channel Distribution */}
							<div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col">
								<h3 className="text-sm font-semibold text-foreground mb-1">
									Channel Distribution
								</h3>
								<p className="text-xs text-muted-foreground mb-6">
									WhatsApp vs Instagram • {data?.messages.total || 0} total
									messages
								</p>

							<div className="flex-1 flex items-center justify-center min-h-[250px]">
								{channelDistributionData.length > 0 ? (
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={channelDistributionData}
												cx='50%'
												cy='50%'
												innerRadius={60}
												outerRadius={80}
												paddingAngle={5}
												dataKey='value'
											>
												{channelDistributionData.map((entry, index) => (
													<Cell
														key={'cell-${index}'}
														fill={COLORS[index % COLORS.length]}
													/>
												))}
											</Pie>
											<Tooltip />
											<Legend verticalAlign="bottom" height={36} />
										</PieChart>
									</ResponsiveContainer>
								) : (
										<div className="text-center text-muted-foreground italic text-sm">
											No message data available
										</div>
								)}
							</div>
						</div>

						{/* Message Types */}
							<div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col">
								<h3 className="text-sm font-semibold text-foreground mb-1">
									Message Types
								</h3>
								<p className="text-xs text-muted-foreground mb-6">
									Breakdown by message type • {data?.messages.total || 0} total
								</p>

							<div className="flex-1 flex items-center justify-center min-h-[250px]">
								{messageTypeData.length > 0 ? (
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={messageTypeData} layout="vertical">
											<XAxis type='number' hide />
											<YAxis
												dataKey='name'
												type='category'
												axisLine={false}
												tickLine={false}
												tick={{ fontSize: 11 }}
											/>
											<Tooltip />
											<Bar
												dataKey='value'
												fill='#3b82f6'
												radius={[0, 4, 4, 0]}
												barSize={20}
											/>
										</BarChart>
									</ResponsiveContainer>
								) : (
										<div className="text-center text-muted-foreground italic text-sm">
											No message data available
										</div>
								)}
							</div>
						</div>

						{/* Template Stats */}
							<div className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<h3 className="text-sm font-semibold text-foreground mb-1">
									Template Stats
								</h3>
								<p className="text-xs text-muted-foreground mb-6">
									{data?.templates.total || 0} templates •{' '}
									{data?.templates.usageThisMonth || 0} used this month
								</p>

							<div className="space-y-6">
								<div className="grid grid-cols-3 gap-3">
										<div className="text-center p-3 rounded-lg border border-border bg-muted/30">
										<CheckCircle2
											size={16}
											className="mx-auto text-emerald-500 mb-1"
										/>
										<div className="text-xl font-bold">
											{data?.templates.approved || 0}
										</div>
											<div className="text-[10px] text-muted-foreground uppercase">
												Approved
											</div>
										</div>
										<div className="text-center p-3 rounded-lg border border-border bg-muted/30">
										<Clock size={16} className="mx-auto text-orange-500 mb-1" />
										<div className="text-xl font-bold">
											{data?.templates.pending || 0}
										</div>
											<div className="text-[10px] text-muted-foreground uppercase">
												Pending
											</div>
										</div>
										<div className="text-center p-3 rounded-lg border border-border bg-muted/30">
										<AlertCircle
											size={16}
											className="mx-auto text-red-500 mb-1"
										/>
										<div className="text-xl font-bold">
											{data?.templates.rejected || 0}
										</div>
											<div className="text-[10px] text-muted-foreground uppercase">
												Rejected
											</div>
									</div>
								</div>

								<div className="space-y-3">
										<h4 className="text-xs font-semibold text-muted-foreground uppercase">
											By Category
										</h4>
									<div className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 rounded-full bg-blue-500"></div>
											Marketing
										</div>
										<span className="font-semibold">
											{data?.templates.byCategory.marketing || 0}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-2">
											<div className="w-2 h-2 rounded-full bg-emerald-500"></div>
											Utility
										</div>
										<span className="font-semibold">
											{data?.templates.byCategory.utility || 0}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-2">
												<div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
											Authentication
										</div>
										<span className="font-semibold">
											{data?.templates.byCategory.authentication || 0}
										</span>
									</div>
								</div>

									<div className="mt-6 -mx-6 -mb-6 flex items-center justify-between border-t border-border px-4 py-4 bg-sky-50/70 dark:bg-sky-950/35">
										<div className="flex items-center gap-2 text-sm text-foreground/90">
											<BarChart3 size={16} className="text-sky-600 dark:text-sky-300" />
											Monthly Usage
										</div>
										<span className="text-xl font-bold text-foreground">
											{data?.templates.usageThisMonth || 0}
										</span>
									</div>
							</div>
						</div>
					</div>

					{/* Bottom Row */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Pipeline Funnel */}
							<div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col">
								<h3 className="text-sm font-semibold text-foreground mb-1">
									Pipeline Funnel
								</h3>
								<p className="text-xs text-muted-foreground mb-12">
									Customer distribution by stage • 0 total
								</p>
								<div className="flex-1 flex flex-col items-center justify-center text-center py-10">
									<Users size={48} className="text-muted-foreground mb-4" />
									<div className="text-muted-foreground text-sm italic">
										No pipeline stages configured
									</div>
								</div>
							</div>

							{/* Top Leads */}
							<div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col">
								<h3 className="text-sm font-semibold text-foreground mb-1">
									Top Leads
								</h3>
								<p className="text-xs text-muted-foreground mb-12">
									Top 5 customers by lead score
								</p>
								<div className="flex-1 flex flex-col items-center justify-center text-center py-10">
									<TrendingUp size={48} className="text-muted-foreground mb-4" />
									<div className="text-muted-foreground text-sm italic">
										No leads data available
									</div>
								</div>
							</div>

							{/* Quality Metrics */}
							<div className="bg-card p-6 rounded-xl border border-border shadow-sm">
								<h3 className="text-sm font-semibold text-foreground mb-1">
									Quality Metrics
								</h3>
								<p className="text-xs text-muted-foreground mb-6">
									WhatsApp Business API quality status
								</p>

								<div className="space-y-4">
									<div className="bg-sky-50/75 dark:bg-sky-950/35 rounded-xl p-4 border border-sky-100 dark:border-sky-800/45 flex items-center gap-4">
										<div className="w-12 h-12 rounded-full bg-white/90 dark:bg-zinc-900/85 flex items-center justify-center border border-sky-200/70 dark:border-sky-700/40 text-sky-600 dark:text-sky-300">
												<ShieldCheck size={24} />
											</div>
											<div>
												<div className="text-xs text-muted-foreground">Quality Rating</div>
											<div className="text-lg font-bold text-foreground">
												{data?.quality.rating || 'N/A'}
											</div>
										</div>
									</div>

									<div className="flex items-center justify-between p-4 border border-border/70 rounded-xl bg-muted/70 dark:bg-zinc-900/75">
										<div className="flex items-center gap-2 text-sm text-foreground/90">
											<Clock size={16} />
											Messaging Tier
										</div>
										<span className="text-sm font-bold text-foreground">
											{data?.quality.messagingTier || 'N/A'}
										</span>
									</div>

									<div className='pt-2'>
										<h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">
											Last 7 Days
										</h4>
										<div className="grid grid-cols-2 gap-3">
											<div className="bg-rose-50/65 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-800/45 p-4 rounded-xl text-center">
												<X className="mx-auto text-rose-500 dark:text-rose-300 mb-1" size={16} />
												<div className="text-xl font-bold text-foreground">
													{data?.quality.blockCount7days || 0}
												</div>
												<div className="text-[10px] text-muted-foreground uppercase">
													Blocks
												</div>
											</div>
											<div className="bg-rose-50/65 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-800/45 p-4 rounded-xl text-center">
												<TrendingUp
													className="mx-auto text-rose-500 dark:text-rose-300 mb-1"
													size={16}
												/>
												<div className="text-xl font-bold text-foreground">
													{data?.quality.spamReportCount7days || 0}
												</div>
												<div className="text-[10px] text-muted-foreground uppercase">
													Spam Reports
												</div>
											</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}

// Extracted Header Component for cleaner code
function DashboardHeader({
	refreshing,
	onRefresh,
}: {
	refreshing: boolean
	onRefresh: () => void
}) {
	const actions = (
		<div className="flex flex-wrap lg:flex-nowrap items-center gap-2 lg:gap-3 w-full lg:w-auto">
			<button
				onClick={onRefresh}
				disabled={refreshing}
				className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors shadow-sm"
			>
				<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
				Refresh
			</button>
			<button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">
				<Download size={16} />
				Export
			</button>
			<button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors shadow-sm">
				<Calendar size={16} />
				Date Range
			</button>
		</div>
	)

	return (
		<PageHeader
			title="Dashboard"
			description="WhatsApp Business Overview and Analytics"
			icon={<BarChart3 size={24} />}
			actions={actions}
		/>
	)
}
