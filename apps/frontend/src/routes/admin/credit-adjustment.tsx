import { createFileRoute } from '@tanstack/react-router'
import {
	AlertCircle,
	Building2,
	CheckCircle2,
	CreditCard,
	History,
	Loader2,
	Minus,
	Plus,
	Search,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/server'

export const Route = createFileRoute('/admin/credit-adjustment')({
	component: CreditAdjustmentPage,
})

interface Organization {
	id: string
	name: string
	slug: string | null
	ai_credits: number
	warning_threshold: number
	transaction_count: number
	created_at: string | Date
}

interface CreditTransaction {
	id: string
	organization_id: string
	amount: number
	type: string
	description: string | null
	metadata: Record<string, unknown> | null
	created_at: string
}

interface FormData {
	amount: string
	reason: string
}

function CreditAdjustmentPage() {
	const [organizations, setOrganizations] = useState<Organization[]>([])
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
	const [transactions, setTransactions] = useState<CreditTransaction[]>([])
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<Organization[]>([])
	const [showDropdown, setShowDropdown] = useState(false)
	const [formData, setFormData] = useState<FormData>({
		amount: '',
		reason: '',
	})
	const [formErrors, setFormErrors] = useState<Record<string, string>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoadingOrgs, setIsLoadingOrgs] = useState(true)
	const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
	const [dateFilter, setDateFilter] = useState({
		startDate: '',
		endDate: '',
	})

	const fetchOrganizations = useCallback(async () => {
		try {
			setIsLoadingOrgs(true)
			const { data, error } = await api.api.admin.billing.organizations.get()

			if (error) {
				throw new Error(
					typeof error === 'object' && error !== null && 'value' in error
						? String((error as { value?: { message?: string } }).value?.message)
						: 'Failed to fetch organizations',
				)
			}

			if (data) {
				setOrganizations((data.data || []) as Organization[])
			}
		} catch (err) {
			toast.error('Failed to load organizations', {
				description: err instanceof Error ? err.message : 'An error occurred',
			})
		} finally {
			setIsLoadingOrgs(false)
		}
	}, [])

	useEffect(() => {
		fetchOrganizations()
	}, [fetchOrganizations])

	const fetchTransactions = useCallback(
		async (orgId?: string) => {
			try {
				setIsLoadingTransactions(true)
				const endpoint = orgId
					? api.api.admin.billing.organizations({ id: orgId }).transactions
					: api.api.admin.billing.transactions

				const queryParams: Record<string, string> = {}
				if (dateFilter.startDate) queryParams.start_date = dateFilter.startDate
				if (dateFilter.endDate) queryParams.end_date = dateFilter.endDate

				const { data, error } = await endpoint.get({ query: queryParams })

				if (error) {
					throw new Error(
						typeof error === 'object' && error !== null && 'value' in error
							? String(
									(error as { value?: { message?: string } }).value?.message,
								)
							: 'Failed to fetch transactions',
					)
				}

				if (data) {
					setTransactions((data.data || []) as CreditTransaction[])
				}
			} catch (err) {
				toast.error('Failed to load transactions', {
					description: err instanceof Error ? err.message : 'An error occurred',
				})
			} finally {
				setIsLoadingTransactions(false)
			}
		},
		[dateFilter.startDate, dateFilter.endDate],
	)

	const handleSearch = useCallback(
		(query: string) => {
			if (query.length < 2) {
				setSearchResults([])
				setShowDropdown(false)
				return
			}

			const results = organizations.filter(
				(org) =>
					org.name.toLowerCase().includes(query.toLowerCase()) ||
					org.id.toLowerCase().includes(query.toLowerCase()) ||
					(org.slug?.toLowerCase().includes(query.toLowerCase()) ?? false),
			)

			setSearchResults(results)
			setShowDropdown(results.length > 0)
		},
		[organizations],
	)

	const selectOrganization = useCallback(
		(org: Organization) => {
			setSelectedOrg(org)
			setSearchQuery('')
			setSearchResults([])
			setShowDropdown(false)
			setFormData({ amount: '', reason: '' })
			setFormErrors({})
			fetchTransactions(org.id)
		},
		[fetchTransactions],
	)

	const validateForm = (): boolean => {
		const errors: Record<string, string> = {}
		const amount = parseFloat(formData.amount)

		if (!formData.amount || isNaN(amount) || amount === 0) {
			errors.amount = 'Amount must be a non-zero number'
		}

		if (!formData.reason.trim()) {
			errors.reason = 'Reason is required'
		}

		setFormErrors(errors)
		return Object.keys(errors).length === 0
	}

	const handleSubmit = useCallback(async () => {
		if (!validateForm() || !selectedOrg) return

		try {
			setIsSubmitting(true)
			const amount = parseFloat(formData.amount)

			const { data, error } = await api.api.admin.billing
				.organizations({ id: selectedOrg.id })
				.credits.post({
					amount,
					reason: formData.reason,
				})

			if (error) {
				throw new Error(
					typeof error === 'object' && error !== null && 'value' in error
						? String((error as { value?: { message?: string } }).value?.message)
						: 'Failed to adjust credits',
				)
			}

			if (data) {
				toast.success('Credits adjusted successfully', {
					description: `${amount > 0 ? '+' : ''}${amount} credits ${amount > 0 ? 'added to' : 'deducted from'} ${selectedOrg.name}`,
				})

				await fetchOrganizations()
				const updatedOrg = organizations.find((o) => o.id === selectedOrg.id)
				if (updatedOrg) {
					setSelectedOrg({
						...updatedOrg,
						ai_credits: updatedOrg.ai_credits + amount,
					})
				}
				await fetchTransactions(selectedOrg.id)
				setFormData({ amount: '', reason: '' })
			}
		} catch (err) {
			toast.error('Failed to adjust credits', {
				description: err instanceof Error ? err.message : 'An error occurred',
			})
		} finally {
			setIsSubmitting(false)
		}
	}, [
		formData.amount,
		formData.reason,
		selectedOrg,
		organizations,
		fetchOrganizations,
		fetchTransactions,
	])

	const formatDate = (date: string | Date) => {
		const d = typeof date === 'string' ? new Date(date) : date
		return d.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	const getAmountDisplay = (amount: number) => {
		const isPositive = amount > 0
		return (
			<span
				className={`font-mono font-medium ${
					isPositive ? 'text-emerald-600' : 'text-red-600'
				}`}
			>
				{isPositive ? '+' : ''}
				{amount.toLocaleString()}
			</span>
		)
	}

	const previewBalance = selectedOrg
		? selectedOrg.ai_credits + (parseFloat(formData.amount) || 0)
		: 0

	if (isLoadingOrgs) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						Credit Adjustment
					</h1>
					<p className="text-gray-500 mt-1">
						Manually adjust AI credits for organizations
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card size="sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Building2 size={18} />
							Select Organization
						</CardTitle>
						<CardDescription>Search by name, ID, or slug</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="relative">
							<div className="relative">
								<Search
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
									size={18}
								/>
								<Input
									placeholder="Search organizations..."
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value)
										handleSearch(e.target.value)
									}}
									className="pl-10"
								/>
							</div>

							{showDropdown && (
								<div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
									{searchResults.map((org) => (
										<button
											key={org.id}
											type="button"
											className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
											onClick={() => selectOrganization(org)}
										>
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium text-gray-900">
														{org.name}
													</p>
													<p className="text-xs text-gray-500">
														{org.slug || 'No slug'} •{' '}
														{org.ai_credits.toLocaleString()} credits
													</p>
												</div>
												<Badge variant="secondary">
													{org.transaction_count} txns
												</Badge>
											</div>
										</button>
									))}
								</div>
							)}
						</div>

						{selectedOrg && (
							<div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-semibold text-indigo-900">
											{selectedOrg.name}
										</p>
										<p className="text-sm text-indigo-600">
											{selectedOrg.slug || 'No slug'}
										</p>
									</div>
									<div className="text-right">
										<p className="text-sm text-indigo-600">Current Balance</p>
										<p className="text-2xl font-bold text-indigo-900">
											{selectedOrg.ai_credits.toLocaleString()}
										</p>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card size="sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CreditCard size={18} />
							Adjust Credits
						</CardTitle>
						<CardDescription>
							Enter amount and reason for adjustment
						</CardDescription>
					</CardHeader>
					<CardContent>
						{!selectedOrg ? (
							<div className="flex items-center justify-center h-32 text-gray-400">
								<p>Select an organization first</p>
							</div>
						) : (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="amount">Amount</Label>
									<div className="relative">
										<Input
											id="amount"
											type="number"
											placeholder="Enter amount (e.g., 100 or -50)"
											value={formData.amount}
											onChange={(e) =>
												setFormData({ ...formData, amount: e.target.value })
											}
											className={`pr-10 ${
												formErrors.amount
													? 'border-red-500 focus-visible:ring-red-500'
													: ''
											}`}
											disabled={isSubmitting}
										/>
										<span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
											credits
										</span>
									</div>
									{formErrors.amount && (
										<p className="text-sm text-red-600 flex items-center gap-1">
											<AlertCircle size={14} />
											{formErrors.amount}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="reason">Reason</Label>
									<Textarea
										id="reason"
										placeholder="Enter reason for this adjustment..."
										value={formData.reason}
										onChange={(e) =>
											setFormData({ ...formData, reason: e.target.value })
										}
										rows={3}
										className={
											formErrors.reason
												? 'border-red-500 focus-visible:ring-red-500'
												: ''
										}
										disabled={isSubmitting}
									/>
									{formErrors.reason && (
										<p className="text-sm text-red-600 flex items-center gap-1">
											<AlertCircle size={14} />
											{formErrors.reason}
										</p>
									)}
								</div>

								{formData.amount && !isNaN(parseFloat(formData.amount)) && (
									<div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-600">
												New Balance Preview
											</span>
											<span
												className={`text-lg font-bold ${
													previewBalance >= 0 ? 'text-gray-900' : 'text-red-600'
												}`}
											>
												{previewBalance.toLocaleString()} credits
											</span>
										</div>
										{previewBalance < 0 && (
											<p className="text-xs text-red-600 mt-2 flex items-center gap-1">
												<AlertCircle size={12} />
												Warning: Balance will be negative
											</p>
										)}
									</div>
								)}

								<Button
									className="w-full mt-2"
									disabled={isSubmitting || !selectedOrg}
									onClick={handleSubmit}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Processing...
										</>
									) : (
										<>
											<CheckCircle2 className="h-4 w-4" />
											Confirm Adjustment
										</>
									)}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				<Card size="sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<History size={18} />
							Quick Actions
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								className="flex items-center justify-center gap-2"
								onClick={() => {
									if (selectedOrg) {
										setFormData({ ...formData, amount: '100' })
									}
								}}
								disabled={!selectedOrg}
							>
								<Plus size={14} className="text-emerald-600" />
								Add 100
							</Button>
							<Button
								variant="outline"
								className="flex items-center justify-center gap-2"
								onClick={() => {
									if (selectedOrg) {
										setFormData({ ...formData, amount: '500' })
									}
								}}
								disabled={!selectedOrg}
							>
								<Plus size={14} className="text-emerald-600" />
								Add 500
							</Button>
							<Button
								variant="outline"
								className="flex items-center justify-center gap-2"
								onClick={() => {
									if (selectedOrg) {
										setFormData({ ...formData, amount: '-50' })
									}
								}}
								disabled={!selectedOrg}
							>
								<Minus size={14} className="text-red-600" />
								Deduct 50
							</Button>
							<Button
								variant="outline"
								className="flex items-center justify-center gap-2"
								onClick={() => {
									if (selectedOrg) {
										setFormData({ ...formData, amount: '-100' })
									}
								}}
								disabled={!selectedOrg}
							>
								<Minus size={14} className="text-red-600" />
								Deduct 100
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="mt-6">
				<CardHeader>
					<div className="flex items-center justify-between w-full">
						<div>
							<CardTitle className="flex items-center gap-2">
								<History size={18} />
								Adjustment History
							</CardTitle>
							<CardDescription>
								{selectedOrg
									? `Showing transactions for ${selectedOrg.name}`
									: 'Select an organization to view their transactions'}
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Input
								type="date"
								placeholder="Start date"
								value={dateFilter.startDate}
								onChange={(e) =>
									setDateFilter({ ...dateFilter, startDate: e.target.value })
								}
								className="w-36"
							/>
							<span className="text-gray-400">to</span>
							<Input
								type="date"
								placeholder="End date"
								value={dateFilter.endDate}
								onChange={(e) => {
									setDateFilter({ ...dateFilter, endDate: e.target.value })
									if (selectedOrg) {
										fetchTransactions(selectedOrg.id)
									}
								}}
								className="w-36"
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoadingTransactions ? (
						<div className="flex items-center justify-center h-40">
							<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
						</div>
					) : !selectedOrg ? (
						<div className="flex flex-col items-center justify-center h-40 text-gray-400">
							<History size={24} className="mb-2 opacity-50" />
							<p>Select an organization to view adjustment history</p>
						</div>
					) : transactions.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-40 text-gray-400">
							<AlertCircle size={24} className="mb-2 opacity-50" />
							<p>No transactions found</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Timestamp</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Reason</TableHead>
									<TableHead>Admin</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{transactions.map((txn) => (
									<TableRow key={txn.id}>
										<TableCell className="text-gray-600">
											{formatDate(txn.created_at)}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													txn.type === 'adjustment' ? 'default' : 'secondary'
												}
											>
												{txn.type}
											</Badge>
										</TableCell>
										<TableCell>{getAmountDisplay(txn.amount)}</TableCell>
										<TableCell className="max-w-xs truncate text-gray-600">
											{txn.description || '-'}
										</TableCell>
										<TableCell className="text-gray-500">
											{(txn.metadata?.admin_id as string) || 'System'}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
