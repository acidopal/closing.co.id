import { createFileRoute } from '@tanstack/react-router'
import {
	BarChart3,
	Bot,
	Building2,
	Coins,
	Loader2,
	RefreshCw,
	Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import api from '@/lib/server'

export const Route = createFileRoute('/admin/')({
	component: AdminDashboardPage,
})

interface AdminStats {
	totalUsers: number
	totalCompanies: number
	activeAIModels: number
	totalCreditUsage: number
}

function formatNumber(value: number) {
	return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function AdminDashboardPage() {
	const [stats, setStats] = useState<AdminStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [lastUpdated, setLastUpdated] = useState<string | null>(null)

	const fetchStats = useCallback(async () => {
		try {
			setError(null)
			setRefreshing(true)

			const { data, error: apiError } =
				await api.api.v1['super-admin'].stats.get()

			if (apiError) {
				const message =
					typeof apiError === 'object' &&
					apiError !== null &&
					'value' in apiError &&
					typeof apiError.value === 'object' &&
					apiError.value !== null &&
					'message' in apiError.value
						? String(
								(apiError.value as { message?: string }).message ||
									'Failed to fetch dashboard stats',
							)
						: 'Failed to fetch dashboard stats'

				throw new Error(message)
			}

			if (data?.data) {
				setStats(data.data as AdminStats)
				setLastUpdated(new Date().toISOString())
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'Unable to load super-admin dashboard data',
			)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}, [])

	useEffect(() => {
		fetchStats()
	}, [fetchStats])

	const overviewData = useMemo(
		() => [
			{ name: 'Users', value: stats?.totalUsers ?? 0 },
			{ name: 'Companies', value: stats?.totalCompanies ?? 0 },
			{ name: 'Active AI Models', value: stats?.activeAIModels ?? 0 },
		],
		[stats],
	)

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="flex flex-col items-center gap-3">
					<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
					<p className="text-sm text-gray-500">Loading platform overview...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
				<h2 className="text-lg font-bold mb-2">Error loading dashboard</h2>
				<p>{error}</p>
				<Button
					type="button"
					onClick={fetchStats}
					className="mt-4 bg-red-600 hover:bg-red-700 text-white"
				>
					Try Again
				</Button>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
						Platform Dashboard
					</h1>
					<p className="text-gray-500 mt-1">
						Super-admin overview of users, companies, and AI credit activity.
					</p>
				</div>
				<Button
					type="button"
					onClick={fetchStats}
					disabled={refreshing}
					variant="outline"
					className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
				>
					<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
					Refresh
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
				<Card className="border-indigo-100">
					<CardHeader className="pb-2">
						<CardDescription className="flex items-center gap-2 text-gray-600">
							<Users className="h-4 w-4 text-indigo-600" />
							Total Users
						</CardDescription>
						<CardTitle className="text-3xl text-gray-900">
							{formatNumber(stats?.totalUsers ?? 0)}
						</CardTitle>
					</CardHeader>
				</Card>

				<Card className="border-indigo-100">
					<CardHeader className="pb-2">
						<CardDescription className="flex items-center gap-2 text-gray-600">
							<Building2 className="h-4 w-4 text-indigo-600" />
							Total Companies
						</CardDescription>
						<CardTitle className="text-3xl text-gray-900">
							{formatNumber(stats?.totalCompanies ?? 0)}
						</CardTitle>
					</CardHeader>
				</Card>

				<Card className="border-indigo-100">
					<CardHeader className="pb-2">
						<CardDescription className="flex items-center gap-2 text-gray-600">
							<Bot className="h-4 w-4 text-indigo-600" />
							Active AI Models
						</CardDescription>
						<CardTitle className="text-3xl text-gray-900">
							{formatNumber(stats?.activeAIModels ?? 0)}
						</CardTitle>
					</CardHeader>
				</Card>

				<Card className="border-indigo-100">
					<CardHeader className="pb-2">
						<CardDescription className="flex items-center gap-2 text-gray-600">
							<Coins className="h-4 w-4 text-indigo-600" />
							Total Credits Used
						</CardDescription>
						<CardTitle className="text-3xl text-gray-900">
							{formatNumber(stats?.totalCreditUsage ?? 0)}
						</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
				<Card className="border-indigo-100">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-gray-900">
							<BarChart3 className="h-5 w-5 text-indigo-600" />
							Platform Totals
						</CardTitle>
						<CardDescription>
							Users, companies, and active AI models from current stats.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-[280px]">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={overviewData}>
									<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
									<XAxis dataKey="name" tick={{ fontSize: 12 }} />
									<YAxis allowDecimals={false} />
									<Tooltip formatter={(value) => formatNumber(Number(value))} />
									<Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<Card className="border-indigo-100">
					<CardHeader>
						<CardTitle className="text-gray-900">
							Credits Bought vs Used
						</CardTitle>
						<CardDescription>
							Used credits are available in `/super-admin/stats`; bought credits
							are not currently returned by this endpoint.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-indigo-700">
								Bought Credits
							</p>
							<p className="mt-2 text-2xl font-bold text-gray-900">
								Not available
							</p>
							<p className="text-xs text-gray-500 mt-1">
								No aggregate bought/top-up field in current stats payload.
							</p>
						</div>
						<div className="rounded-lg border border-indigo-100 bg-white p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-indigo-700">
								Used Credits
							</p>
							<p className="mt-2 text-2xl font-bold text-gray-900">
								{formatNumber(stats?.totalCreditUsage ?? 0)}
							</p>
							<p className="text-xs text-gray-500 mt-1">
								Aggregated from usage transactions in backend stats service.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<p className="text-xs text-gray-500">
				Last updated:{' '}
				{lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not available'}
			</p>
		</div>
	)
}
