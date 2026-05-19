import { createFileRoute } from '@tanstack/react-router'
import {
	CheckCircle,
	CreditCard,
	ExternalLink,
	Loader2,
	Zap,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import api from '@/lib/server'

export const Route = createFileRoute('/_app/top-up/')({
	component: TopUpPage,
})

function TopUpPage() {
	const routeParams = Route.useParams({ strict: false }) as { appId?: string }
	const appId =
		routeParams.appId ||
		(typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_org_slug') ||
				localStorage.getItem('scalechat_app_id') ||
				''
			: '')
	const [packages, setPackages] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedPackage, setSelectedPackage] = useState<any>(null)
	const [processing, setProcessing] = useState<string | null>(null)

	useEffect(() => {
		fetchPackages()
	}, [])

	const fetchPackages = async () => {
		try {
			const res = await api.api.billing.packages.get()
			if (res.data && 'data' in res.data) {
				setPackages(res.data.data as any[])
			}
		} catch (error) {
			console.error('Failed to fetch packages', error)
		} finally {
			setLoading(false)
		}
	}

	const handlePurchase = async (pkg: any) => {
		if (!appId) return

		setProcessing(pkg.name)
		try {
			const invoiceRes = await api.api.billing['top-up']['create-invoice'].post(
				{ packageName: pkg.name, email: '' },
				{ query: { appId } },
			)

			if (invoiceRes.data && 'invoice' in invoiceRes.data) {
				const { invoiceUrl, amount, credits, expiresAt } =
					invoiceRes.data.invoice
				window.open(invoiceUrl, '_blank')
				setSelectedPackage({ ...pkg, invoiceUrl, amount, credits, expiresAt })
			}
		} catch (error) {
			console.error('Purchase failed', error)
			alert('Failed to create invoice. Please try again.')
		} finally {
			setProcessing(null)
		}
	}

	if (loading) return <div className="p-8">Loading...</div>

	return (
		<div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
			<div className="max-w-4xl mx-auto py-12 px-4">
				{!selectedPackage ? (
					<>
						<div className="text-center mb-10">
							<h1 className="text-4xl font-bold text-gray-900 mb-3">
								Top Up AI Credits
							</h1>
							<p className="text-lg text-gray-600 mb-6">
								Choose a package to add credits instantly. Secure payment via
								Xendit.
							</p>
							<div className="flex items-center justify-center gap-2 text-sm text-gray-500">
								<CheckCircle className="w-5 h-5 text-emerald-600" />
								<span>Instant delivery • Secure payment • No expiration</span>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{packages.map((pkg) => (
								<Card
									key={pkg.name}
									className={`border-2 hover:border-primary hover:shadow-xl transition-all cursor-pointer ${
										selectedPackage?.name === pkg.name
											? 'border-primary ring-4 ring-primary/20'
											: ''
									}`}
									onClick={() => handlePurchase(pkg)}
								>
									<CardHeader>
										<CardTitle className="text-xl">{pkg.name}</CardTitle>
										<CardDescription className="text-base">
											{pkg.description}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="text-center py-4">
											<div className="flex items-baseline justify-center gap-1 mb-2">
												<span className="text-5xl font-bold text-emerald-600">
													{pkg.credits}
												</span>
												<span className="text-lg text-gray-500">credits</span>
											</div>
											<div className="flex items-center justify-center gap-1">
												<span className="text-2xl font-bold text-gray-900">
													${pkg.price_usd.toFixed(2)}
												</span>
												<span className="text-gray-500">USD</span>
											</div>
										</div>

										<Button
											className='w-full'
											size='lg'
											disabled={processing === pkg.name}
										>
											{processing === pkg.name ? (
												<>
													<Loader2 className="w-4 h-4 mr-2 animate-spin" />
													Processing...
												</>
											) : (
												<>
													Purchase Now
													<Zap className='w-4 h-4 ml-2' />
												</>
											)}
										</Button>

										{pkg.name === 'Starter' && (
											<div className="text-center text-sm text-gray-500 mt-2">
												Perfect for getting started
											</div>
										)}
										{pkg.name === 'Pro' && (
											<div className="text-center text-sm text-emerald-600 font-medium mt-2">
												Best Value
											</div>
										)}
										{pkg.name === 'Enterprise' && (
											<div className="text-center text-sm text-primary font-medium mt-2">
												For large-scale usage
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					</>
				) : (
					<div className="text-center py-12">
						<div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-auto">
							<div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
								<CheckCircle className="w-10 h-10 text-emerald-600" />
							</div>

							<h2 className="text-2xl font-bold text-gray-900 mb-3">
								Invoice Created!
							</h2>

							<div className="text-left space-y-3 mb-6 bg-gray-50 p-4 rounded-lg">
								<div className="flex justify-between">
									<span className="text-gray-500">Package:</span>
									<span className="font-bold">{selectedPackage.name}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Credits:</span>
									<span className="font-bold text-emerald-600">
										{selectedPackage.credits} credits
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Amount:</span>
									<span className="font-bold">
										${selectedPackage.amount.toFixed(2)} USD
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-500">Expires:</span>
									<span className="font-bold">
										{new Date(selectedPackage.expiresAt).toLocaleDateString()}
									</span>
								</div>
							</div>

							<p className="text-sm text-gray-600 mb-6">
								Your invoice has been created. You will be redirected to the
								Xendit payment page to complete your purchase.
							</p>

							<div className="flex flex-col gap-3">
								<a
									href={selectedPackage.invoiceUrl}
									target='_blank'
									rel='noopener noreferrer'
									className='w-full'
								>
									<Button className="w-full" size="lg">
										<span className="flex items-center justify-center gap-2">
											Proceed to Payment
											<ExternalLink className="w-5 h-5" />
										</span>
									</Button>
								</a>

								<Button
									variant='outline'
									onClick={() => setSelectedPackage(null)}
									className='w-full'
								>
									Choose Different Package
								</Button>
							</div>
						</div>
					</div>
				)}

				<div className="mt-12 text-center text-sm text-gray-500">
					<div className="flex items-center justify-center gap-2 mb-2">
						<CreditCard className="w-4 h-4" />
						<span>Secure payments powered by Xendit</span>
					</div>
					<p>Need help? Contact our support team</p>
				</div>
			</div>
		</div>
	)
}
