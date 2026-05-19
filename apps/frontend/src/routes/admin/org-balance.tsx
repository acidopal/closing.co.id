import { createFileRoute } from '@tanstack/react-router'
import { Download, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import api from '@/lib/server'

export const Route = createFileRoute('/admin/org-balance')({
	component: OrgBalancePage,
})

interface OrganizationBalance {
	id: string
	name: string
	slug?: string | null
	ai_credits: number
}

type BalanceFilter = 'all' | 'positive' | 'zero' | 'negative'
type SortDirection = 'asc' | 'desc'

function escapeCsvValue(value: unknown): string {
	const normalized =
		value === null || value === undefined
			? ''
			: String(value).replace(/\r?\n/g, ' ')
	return `"${normalized.replace(/"/g, '""')}"`
}

function formatBalance(value: number): string {
	return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (typeof error === 'object' && error !== null && 'value' in error) {
		const value = (error as { value?: { message?: string } | string }).value
		if (typeof value === 'string') {
			return value
		}
		if (value && typeof value === 'object' && 'message' in value) {
			return String(value.message || fallback)
		}
	}

	if (error instanceof Error && error.message) {
		return error.message
	}

	return fallback
}

function OrgBalancePage() {
	const [organizations, setOrganizations] = useState<OrganizationBalance[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>('all')
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

	const fetchOrganizations = useCallback(async () => {
		try {
			if (organizations.length === 0) {
				setLoading(true)
			} else {
				setRefreshing(true)
			}
			setError(null)
			const { data, error: apiError } =
				await api.api.admin.billing.organizations.get()

			if (apiError) {
				throw new Error(
					getErrorMessage(apiError, 'Failed to fetch organizations'),
				)
			}

			if (data?.success && data.data) {
				setOrganizations(data.data as OrganizationBalance[])
			} else {
				setOrganizations([])
			}
		} catch (err) {
			console.error('Error fetching organizations:', err)
			const message = getErrorMessage(err, 'An unexpected error occurred')
			setError(message)
			toast.error('Failed to load organization balances', {
				description: message,
			})
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}, [organizations.length])

	useEffect(() => {
		fetchOrganizations()
	}, [fetchOrganizations])

	const filteredSortedOrganizations = useMemo(() => {
		const query = searchQuery.trim().toLowerCase()

		const filtered = organizations.filter((organization) => {
			const matchesQuery =
				query.length === 0 ||
				organization.name.toLowerCase().includes(query) ||
				organization.id.toLowerCase().includes(query) ||
				(organization.slug?.toLowerCase().includes(query) ?? false)

			if (!matchesQuery) {
				return false
			}

			switch (balanceFilter) {
				case 'positive':
					return organization.ai_credits > 0
				case 'zero':
					return organization.ai_credits === 0
				case 'negative':
					return organization.ai_credits < 0
				case 'all':
				default:
					return true
			}
		})

		return [...filtered].sort((left, right) => {
			const balanceDelta =
				sortDirection === 'asc'
					? left.ai_credits - right.ai_credits
					: right.ai_credits - left.ai_credits

			if (balanceDelta !== 0) {
				return balanceDelta
			}

			return left.name.localeCompare(right.name)
		})
	}, [organizations, searchQuery, balanceFilter, sortDirection])

	const totalVisibleBalance = useMemo(
		() =>
			filteredSortedOrganizations.reduce(
				(total, organization) => total + organization.ai_credits,
				0,
			),
		[filteredSortedOrganizations],
	)

	const exportVisibleRows = useCallback(() => {
		if (filteredSortedOrganizations.length === 0) {
			toast.error('No rows available for export')
			return
		}

		const headers = ['Organization ID', 'Organization Name', 'Slug', 'Balance']
		const csvLines = filteredSortedOrganizations.map((organization) =>
			[
				organization.id,
				organization.name,
				organization.slug || '',
				organization.ai_credits,
			]
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
		link.download = `org-balances-${new Date().toISOString().slice(0, 10)}.csv`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)

		toast.success(`Exported ${filteredSortedOrganizations.length} row(s)`)
	}, [filteredSortedOrganizations])

	const resetFilters = useCallback(() => {
		setSearchQuery('')
		setBalanceFilter('all')
		setSortDirection('desc')
	}, [])

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="flex flex-col items-center gap-3">
					<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
					<p className="text-sm text-gray-500">
						Loading organization balances...
					</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
				<h2 className="text-lg font-bold mb-2">Error loading organizations</h2>
				<p>{error}</p>
				<Button
					type="button"
					onClick={fetchOrganizations}
					className="mt-4 bg-red-600 hover:bg-red-700 text-white"
				>
					Try Again
				</Button>
			</div>
		)
	}

	const emptyMessage =
		organizations.length === 0
			? 'No organizations found'
			: 'No organizations match the current search/filter selection'

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h2 className="text-2xl font-bold text-gray-900">
						Organization Balances
					</h2>
					<p className="text-gray-500">
						View and export organization AI credit balances.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						onClick={fetchOrganizations}
						disabled={refreshing}
						variant="outline"
						className="gap-2"
					>
						<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
						Refresh
					</Button>
					<Button
						type="button"
						onClick={exportVisibleRows}
						disabled={filteredSortedOrganizations.length === 0}
						className="gap-2"
					>
						<Download size={14} />
						Export CSV
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Balance List</CardTitle>
					<CardDescription>
						Search by organization name, ID, or slug. Filter and sort before
						exporting CSV.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
						<Input
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="Search organization name, ID, or slug"
							className="lg:col-span-2"
						/>

						<NativeSelect
							className="w-full"
							value={balanceFilter}
							onChange={(event) =>
								setBalanceFilter(event.target.value as BalanceFilter)
							}
						>
							<NativeSelectOption value="all">All balances</NativeSelectOption>
							<NativeSelectOption value="positive">
								Positive balances
							</NativeSelectOption>
							<NativeSelectOption value="zero">
								Zero balances
							</NativeSelectOption>
							<NativeSelectOption value="negative">
								Negative balances
							</NativeSelectOption>
						</NativeSelect>

						<NativeSelect
							className="w-full"
							value={sortDirection}
							onChange={(event) =>
								setSortDirection(event.target.value as SortDirection)
							}
						>
							<NativeSelectOption value="desc">
								Balance: High to Low
							</NativeSelectOption>
							<NativeSelectOption value="asc">
								Balance: Low to High
							</NativeSelectOption>
						</NativeSelect>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
						<div className="flex flex-wrap items-center gap-4">
							<span>
								Showing <strong>{filteredSortedOrganizations.length}</strong> of{' '}
								<strong>{organizations.length}</strong> organizations
							</span>
							<span>
								Visible balance total:{' '}
								<strong className="font-mono">
									{formatBalance(totalVisibleBalance)}
								</strong>
							</span>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={resetFilters}
						>
							Reset filters
						</Button>
					</div>

					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Organization</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead className="text-right">Balance</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredSortedOrganizations.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={3}
										className="text-center py-8 text-gray-500"
									>
										{emptyMessage}
									</TableCell>
								</TableRow>
							) : (
								filteredSortedOrganizations.map((organization) => (
									<TableRow key={organization.id}>
										<TableCell className="font-medium">
											<div className="flex flex-col">
												<span>{organization.name}</span>
												<span className="text-xs text-gray-500 font-mono">
													{organization.id}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-gray-600">
											{organization.slug || '-'}
										</TableCell>
										<TableCell className="text-right font-mono">
											{formatBalance(organization.ai_credits)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	)
}
