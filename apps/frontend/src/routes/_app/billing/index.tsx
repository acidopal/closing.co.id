import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	TransactionHistory,
	type Transaction,
} from '@/components/billing/TransactionHistory'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import api from '@/lib/server'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app/billing/')({
	component: BillingTopUpPage,
})

type PackageTier = 'starter' | 'pro' | 'enterprise'

type TopUpPackage = {
	id: string
	name: string
	price_usd: number
	credits: number
	description: string | null
}

const PACKAGE_ORDER: Array<{ tier: PackageTier; label: string; note: string }> =
	[
		{
			tier: 'starter',
			label: 'Starter',
			note: 'Great for low-volume usage',
		},
		{
			tier: 'pro',
			label: 'Pro',
			note: 'Balanced for active teams',
		},
		{
			tier: 'enterprise',
			label: 'Enterprise',
			note: 'For heavy production workloads',
		},
	]

function normalizeApiErrorMessage(error: unknown, fallback: string): string {
	if (!error) {
		return fallback
	}

	if (typeof error === 'string') {
		return error
	}

	if (error instanceof Error) {
		return error.message || fallback
	}

	if (typeof error === 'object') {
		const candidate = error as {
			value?: unknown
			message?: string
			error?: string
		}

		if (typeof candidate.error === 'string' && candidate.error.trim()) {
			return candidate.error
		}

		if (typeof candidate.message === 'string' && candidate.message.trim()) {
			return candidate.message
		}

		if (typeof candidate.value === 'string' && candidate.value.trim()) {
			return candidate.value
		}

		if (candidate.value && typeof candidate.value === 'object') {
			const nested = candidate.value as { error?: string; message?: string }
			if (typeof nested.error === 'string' && nested.error.trim()) {
				return nested.error
			}
			if (typeof nested.message === 'string' && nested.message.trim()) {
				return nested.message
			}
		}
	}

	return fallback
}

function BillingTopUpPage() {
	const appId =
		typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_org_slug') ||
				localStorage.getItem('scalechat_app_id') ||
				''
			: ''
	const [packages, setPackages] = useState<TopUpPackage[]>([])
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [isLoadingPackages, setIsLoadingPackages] = useState(true)
	const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
	const [isSubmittingPackageId, setIsSubmittingPackageId] = useState<
		string | null
	>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [transactionError, setTransactionError] = useState<string | null>(null)

	useEffect(() => {
		const fetchPackages = async () => {
			try {
				setIsLoadingPackages(true)
				setErrorMessage(null)

				const response = await api.api.billing.packages.get()

				if (response.error) {
					throw new Error(
						normalizeApiErrorMessage(
							response.error,
							'Failed to load top-up packages',
						),
					)
				}

				if (response.data && 'error' in response.data && response.data.error) {
					throw new Error(String(response.data.error))
				}

				if (!response.data || !('payload' in response.data)) {
					throw new Error('Top-up packages are not available right now')
				}

				setPackages((response.data.payload as TopUpPackage[]) || [])
			} catch (error) {
				setErrorMessage(
					normalizeApiErrorMessage(error, 'Failed to load top-up packages'),
				)
			} finally {
				setIsLoadingPackages(false)
			}
		}

		void fetchPackages()
	}, [])

	const fetchTransactions = useCallback(async () => {
		try {
			setIsLoadingTransactions(true)
			setTransactionError(null)

			const response = appId
				? await api.api.billing.transactions.get({ query: { appId } })
				: await api.api.billing.transactions.get()

			if (response.error) {
				throw new Error(
					normalizeApiErrorMessage(
						response.error,
						'Failed to load transaction history',
					),
				)
			}

			if (response.data && 'error' in response.data && response.data.error) {
				throw new Error(String(response.data.error))
			}

			if (!response.data || !('payload' in response.data)) {
				throw new Error('Transaction history is not available right now')
			}

			setTransactions((response.data.payload as Transaction[]) || [])
		} catch (error) {
			setTransactionError(
				normalizeApiErrorMessage(error, 'Failed to load transaction history'),
			)
		} finally {
			setIsLoadingTransactions(false)
		}
	}, [appId])

	useEffect(() => {
		void fetchTransactions()
	}, [fetchTransactions])

	const packagesByTier = useMemo(() => {
		const byName = new Map(
			packages.map((pkg) => [pkg.name.trim().toLowerCase(), pkg]),
		)

		return PACKAGE_ORDER.map((tierItem) => ({
			...tierItem,
			pkg: byName.get(tierItem.tier) ?? null,
		}))
	}, [packages])

	const handleTopUp = async (pkg: TopUpPackage | null) => {
		if (!pkg || isSubmittingPackageId) {
			return
		}

		try {
			setErrorMessage(null)
			setIsSubmittingPackageId(pkg.id)

			const response = await api.api.billing['top-up'].post({
				packageId: pkg.id,
			})

			if (response.error) {
				throw new Error(
					normalizeApiErrorMessage(response.error, 'Failed to create invoice'),
				)
			}

			if (response.data && 'error' in response.data && response.data.error) {
				throw new Error(String(response.data.error))
			}

			if (
				!response.data ||
				!('invoice' in response.data) ||
				!response.data.invoice
			) {
				throw new Error('Invoice was not returned by the billing service')
			}

			const invoice = response.data.invoice as { url?: string | null }
			if (!invoice.url) {
				throw new Error('Invoice URL is missing from billing response')
			}

			window.location.assign(invoice.url)
		} catch (error) {
			setErrorMessage(
				normalizeApiErrorMessage(error, 'Failed to create invoice'),
			)
		} finally {
			setIsSubmittingPackageId(null)
		}
	}

	return (
		<div className="h-full w-full overflow-y-auto">
			<div className="space-y-6 p-4 pb-20 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
				<Card className="py-0 shadow-sm">
					<CardHeader className="p-6">
						<div className="flex items-center justify-between gap-3">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Sparkles className="h-5 w-5 text-primary" />
									Top Up AI Credits
								</CardTitle>
								<CardDescription className="mt-1">
									Choose a package, generate invoice, then continue payment in
									Xendit.
								</CardDescription>
							</div>
							<Badge variant="outline">Secure checkout</Badge>
						</div>
					</CardHeader>
				</Card>

				{errorMessage && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Top-up failed</AlertTitle>
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				)}

				<div className="grid gap-6 lg:grid-cols-3">
					{packagesByTier.map((item) => {
						const isSubmitting = isSubmittingPackageId === item.pkg?.id
						const isDisabled =
							isLoadingPackages || isSubmittingPackageId !== null || !item.pkg

						return (
							<Card
								key={item.tier}
								className={cn(
									'relative py-0 flex flex-col border shadow-sm',
									item.tier === 'pro' &&
										'border-primary ring-1 ring-primary/40',
									!item.pkg && 'opacity-70',
								)}
							>
								{item.tier === 'pro' && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2">
										<Badge>Recommended</Badge>
									</div>
								)}

								<CardHeader className="p-6">
									<CardTitle className="text-xl font-semibold tracking-tight">
										{item.label}
									</CardTitle>
									<CardDescription className="min-h-[40px] text-sm">
										{item.pkg?.description || item.note}
									</CardDescription>
								</CardHeader>

								<CardContent className="flex flex-1 flex-col p-6 pt-0">
									<div className="space-y-2 pb-6">
										<p className="text-3xl font-bold">
											{item.pkg
												? `${item.pkg.credits.toLocaleString()} credits`
												: 'Package unavailable'}
										</p>
										<p className="text-muted-foreground text-sm">
											{item.pkg
												? `$${Number(item.pkg.price_usd).toFixed(2)} USD`
												: 'Try again later or contact support'}
										</p>
									</div>

									<Button
										type="button"
										onClick={() => void handleTopUp(item.pkg)}
										disabled={isDisabled}
										className="h-9 w-full rounded-lg"
									>
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Creating invoice...
											</>
										) : (
											'Top up now'
										)}
									</Button>
								</CardContent>
							</Card>
						)
					})}
				</div>

				<TransactionHistory
					transactions={transactions}
					loading={isLoadingTransactions}
					error={transactionError}
					onRetry={() => void fetchTransactions()}
				/>
			</div>
		</div>
	)
}
