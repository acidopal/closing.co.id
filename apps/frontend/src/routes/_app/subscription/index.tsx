import { createFileRoute } from '@tanstack/react-router'
import { Calendar, Check, CreditCard, Wallet } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/server'
import { cn } from '@/lib/utils'

interface TopUpPackage {
	id: string
	name: string
	price_usd: number
	credits: number
	description: string | null
}

type PlanId = 'basic' | 'lite' | 'pro'

const BILLING_DURATIONS = [
	{ value: '1', months: 1, label: '1 Bulan', discount: 0 },
	{ value: '3', months: 3, label: '3 Bulan', discount: 0.1 },
	{ value: '6', months: 6, label: '6 Bulan', discount: 0.15 },
	{ value: '12', months: 12, label: '1 Tahun', discount: 0.2 },
] as const

const PLAN_CONFIG = [
	{
		id: 'basic' as const,
		name: 'BASIC',
		description: 'For developer integration',
		monthlyPrice: 25000,
		features: [
			'Semua fitur FREE',
			'n8n Integration',
			'API Access',
			'30-day message history',
			'1 WhatsApp Number',
		],
	},
	{
		id: 'lite' as const,
		name: 'LITE',
		description: 'For growing businesses',
		monthlyPrice: 49000,
		features: [
			'Semua fitur FREE',
			'1 AI Agent',
			'5 Knowledge Documents',
			'n8n Integration',
			'5 Team Members',
			'90-day message history',
			'Media Library',
			'1 WhatsApp Number',
		],
	},
	{
		id: 'pro' as const,
		name: 'PRO',
		description: 'For enterprise businesses',
		monthlyPrice: 299000,
		recommended: true,
		features: [
			'Semua fitur LITE',
			'10 AI Agents',
			'50 Knowledge Documents',
			'10 Team Members',
			'Unlimited message history',
			'1 WhatsApp Number',
		],
	},
]

const PLAN_PACKAGE_NAME_PRIORITY: Record<PlanId, string[]> = {
	basic: ['basic', 'starter'],
	lite: ['lite', 'pro'],
	pro: ['premium', 'enterprise'],
}

const PLAN_PACKAGE_INDEX_FALLBACK: Record<PlanId, number> = {
	basic: 0,
	lite: 1,
	pro: 2,
}

const idrFormatter = new Intl.NumberFormat('id-ID', {
	maximumFractionDigits: 0,
})

export const Route = createFileRoute('/_app/subscription/')({
	component: BillingPage,
})

function BillingPage() {
	const routeParams = Route.useParams({ strict: false }) as { appId?: string }
	const appId =
		routeParams.appId ||
		(typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_org_slug') || ''
			: '')
	const [balance, setBalance] = useState<number>(0)
	const [packages, setPackages] = useState<TopUpPackage[]>([])
	const [packagesLoading, setPackagesLoading] = useState(true)
	const [processingAction, setProcessingAction] = useState<string | null>(null)
	const [selectedDuration, setSelectedDuration] = useState<string>('1')

	const fetchData = useCallback(async () => {
		if (!appId) {
			return
		}

		try {
			const balanceRes = await api.api.billing.balance.get({
				query: { appId },
			})
			if (balanceRes.data && 'ai_credits' in balanceRes.data) {
				setBalance(balanceRes.data.ai_credits as number)
			}
		} catch (error) {
			console.error('Failed to fetch billing data', error)
		}
	}, [appId])

	const fetchPackages = useCallback(async () => {
		try {
			const res = await api.api.billing.packages.get()
			if (res.data && 'payload' in res.data) {
				setPackages(res.data.payload as TopUpPackage[])
			}
		} catch (error) {
			console.error('Failed to fetch packages', error)
			toast.error('Failed to load packages')
		} finally {
			setPackagesLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchData()
		fetchPackages()
	}, [fetchData, fetchPackages])

	const formatIDR = (amount: number) =>
		`Rp ${idrFormatter.format(Math.max(0, Math.round(amount)))}`

	const selectedDurationInfo = useMemo(
		() =>
			BILLING_DURATIONS.find((item) => item.value === selectedDuration) ||
			BILLING_DURATIONS[0],
		[selectedDuration],
	)

	const getPackageByPlan = useCallback(
		(planId: PlanId): TopUpPackage | null => {
			const priorities = PLAN_PACKAGE_NAME_PRIORITY[planId]
			const byName = packages.find((item) =>
				priorities.includes(item.name.toLowerCase()),
			)

			if (byName) {
				return byName
			}

			return packages[PLAN_PACKAGE_INDEX_FALLBACK[planId]] || null
		},
		[packages],
	)

	const createInvoice = async (
		planPackage: TopUpPackage | null,
		actionKey: string,
	) => {
		if (!appId) {
			toast.error('Organization not found. Please refresh and try again.')
			return
		}

		if (!planPackage) {
			toast.error('Plan package is not available yet.')
			return
		}

		setProcessingAction(actionKey)
		try {
			const res = await api.api.billing['top-up']['create-invoice'].post(
				{ packageName: planPackage.name },
				{ query: { appId } },
			)

			if (res.data && 'invoice' in res.data && res.data.invoice) {
				const invoice = res.data.invoice as { url: string }
				window.open(invoice.url, '_blank')
				toast.success('Redirecting to payment page...')
			} else if (res.data && 'error' in res.data) {
				toast.error(res.data.error as string)
			}
		} catch (error) {
			console.error('Failed to create invoice', error)
			toast.error('Failed to create invoice. Please try again.')
		} finally {
			setProcessingAction(null)
		}
	}

	const handleTopUpBalance = async () => {
		await createInvoice(getPackageByPlan('basic'), 'wallet-topup')
	}

	const handleUpgradePlan = async (planId: PlanId) => {
		await createInvoice(getPackageByPlan(planId), `plan-${planId}`)
	}

	return (
		<div className="h-full w-full overflow-y-auto">
			<div className="space-y-8 p-4 pb-20 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8">
				<Card className="py-0 shadow-sm">
					<CardHeader className="p-6">
						<CardTitle className="flex items-center gap-2">
							<CreditCard className="h-5 w-5" />
							Subscription Status
						</CardTitle>
						<CardDescription>
							Your current subscription plan information
						</CardDescription>
					</CardHeader>
					<CardContent className="p-6 pt-0">
						<div className="grid gap-6 md:grid-cols-3">
							<div>
								<p className="text-muted-foreground text-sm">Plan</p>
								<p className="text-lg font-semibold">FREE</p>
							</div>
							<div>
								<p className="text-muted-foreground text-sm">Status</p>
								<Badge className="mt-1 bg-emerald-500 text-white hover:bg-emerald-500">
									Active
								</Badge>
							</div>
							<div>
								<p className="text-muted-foreground flex items-center gap-1 text-sm">
									<Calendar className="h-3 w-3" />
									Valid Until
								</p>
								<p className="text-lg font-semibold">Forever</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="py-0 shadow-sm">
					<CardHeader className="p-6">
						<CardTitle className="flex items-center gap-2">
							<CreditCard className="h-5 w-5" />
							Credit Balance
						</CardTitle>
						<CardDescription>
							Your available credit balance for payments
						</CardDescription>
					</CardHeader>
					<CardContent className="p-6 pt-0">
						<div className="space-y-5">
							<p className="text-2xl font-bold text-emerald-500">
								{formatIDR(balance)}
							</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleTopUpBalance}
								disabled={processingAction !== null || packagesLoading}
								className="h-9 rounded-lg px-4 text-sm"
							>
								{processingAction === 'wallet-topup' ? (
									<>Processing...</>
								) : (
									<>
										<Wallet className="mr-2 h-4 w-4" />
										Top Up
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>

				<section className="space-y-5">
					<h2 className="text-xl font-semibold tracking-tight">Choose Plan</h2>
					<div className="flex justify-center">
						<Tabs
							value={selectedDuration}
							onValueChange={setSelectedDuration}
							className="w-full max-w-lg"
						>
							<TabsList className="grid w-full grid-cols-4 h-9 rounded-lg p-1">
								{BILLING_DURATIONS.map((duration) => (
									<TabsTrigger
										key={duration.value}
										value={duration.value}
										className="relative"
									>
										<span className="flex items-center gap-1">
											{duration.label}
										</span>
										{duration.discount > 0 && (
											<span className="ml-1 inline-flex h-4 items-center rounded-md bg-red-500 px-1 py-0 text-[10px] font-semibold text-white">
												-{Math.round(duration.discount * 100)}%
											</span>
										)}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>
					</div>

					<div className="grid gap-6 lg:grid-cols-3">
						{PLAN_CONFIG.map((plan) => {
							const actionKey = `plan-${plan.id}`
							const isProcessing = processingAction === actionKey
							const hasMatchingPackage = !!getPackageByPlan(plan.id)
							const effectiveMonthlyPrice = Math.round(
								plan.monthlyPrice * (1 - selectedDurationInfo.discount),
							)

							return (
								<Card
									key={plan.id}
									className={cn(
										'relative py-0 flex flex-col border shadow-sm',
										plan.recommended && 'border-primary ring-1 ring-primary/40',
									)}
								>
									{plan.recommended && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2">
											<Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
												Recommended
											</Badge>
										</div>
									)}
									<CardHeader className="p-6">
										<CardTitle className="text-xl font-semibold tracking-tight">
											{plan.name}
										</CardTitle>
										<CardDescription className="min-h-[40px] text-sm">
											{plan.description}
										</CardDescription>
									</CardHeader>
									<CardContent className="p-6 pt-0 flex-1 space-y-5">
										<div className="flex items-baseline gap-2">
											<span className="text-3xl font-bold">
												{formatIDR(effectiveMonthlyPrice)}
											</span>
											<span className="text-muted-foreground text-sm">
												/ month
											</span>
										</div>
										<div className="space-y-2">
											{plan.features.map((feature) => (
												<div
													key={`${plan.id}-${feature}`}
													className="flex items-start gap-2"
												>
													<Check className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
													<span className="text-sm">{feature}</span>
												</div>
											))}
										</div>
									</CardContent>
									<div className="p-6 pt-0">
										<Button
											type="button"
											onClick={() => handleUpgradePlan(plan.id)}
											disabled={
												isProcessing ||
												processingAction !== null ||
												packagesLoading ||
												!hasMatchingPackage
											}
											className="w-full h-9 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
										>
											{isProcessing ? <>Processing...</> : 'Upgrade'}
										</Button>
									</div>
								</Card>
							)
						})}
					</div>
				</section>
			</div>
		</div>
	)
}
