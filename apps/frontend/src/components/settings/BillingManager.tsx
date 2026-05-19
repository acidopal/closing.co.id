import React, { useState, useEffect } from 'react'
import { CreditCard, History, Zap, AlertCircle, Plus } from 'lucide-react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/server'

const BillingManager = () => {
	const appId =
		typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_org_slug') ||
				localStorage.getItem('scalechat_app_id') ||
				''
			: ''
	const [balance, setBalance] = useState<number>(0)
	const [transactions, setTransactions] = useState<any[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchData()
	}, [appId])

	const fetchData = async () => {
		if (!appId) return
		try {
			const balanceRes = await api.api.billing.balance.get({
				query: { appId },
			})
			if (balanceRes.data && 'ai_credits' in balanceRes.data) {
				setBalance(balanceRes.data.ai_credits as number)
			}

			const transRes = await api.api.billing.transactions.get({
				query: { appId },
			})
			if (transRes.data && 'payload' in transRes.data) {
				setTransactions(transRes.data.payload as any[])
			}
		} catch (error) {
			console.error('Failed to fetch billing data', error)
		} finally {
			setLoading(false)
		}
	}

	const handleTopUp = async (amount: number) => {
		if (!appId) return
		try {
			await api.api.billing['top-up'].post(
				{ amount },
				{
					query: { appId },
				},
			)
			fetchData()
		} catch (error) {
			alert('Top-up failed')
		}
	}

	if (loading)
		return (
			<div className="flex items-center justify-center py-12">
				<div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
			</div>
		)

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card className="border-emerald-100 shadow-sm overflow-hidden bg-gradient-to-br from-white to-emerald-50/30">
					<CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
						<div className="flex items-center gap-2">
							<Zap size={20} className="text-emerald-600 fill-emerald-600" />
							<CardTitle className="text-lg font-bold text-gray-900">
								Credit Balance
							</CardTitle>
						</div>
						<CardDescription>Available AI response credits</CardDescription>
					</CardHeader>
					<CardContent className="p-8 flex flex-col items-center justify-center text-center">
						<div className="text-4xl font-black text-emerald-700 mb-2">
							{balance.toFixed(2)}
						</div>
						<p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">
							Credits Available
						</p>
						<p className="text-xs text-gray-400 mt-4 max-w-[200px]">
							Each AI response consumes 0.3 credits from your balance.
						</p>
					</CardContent>
				</Card>

				<Card className="border-gray-100 shadow-sm overflow-hidden">
					<CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
						<div className="flex items-center gap-2">
							<CreditCard size={20} className="text-emerald-600" />
							<CardTitle className="text-lg font-bold">Quick Top-up</CardTitle>
						</div>
						<CardDescription>Add credits to your account</CardDescription>
					</CardHeader>
					<CardContent className="p-6 space-y-3">
						{[
							{ label: 'Starter', amount: 100, price: 'Rp 50rb' },
							{ label: 'Growth', amount: 500, price: 'Rp 200rb' },
						].map((pkg) => (
							<button
								key={pkg.label}
								onClick={() => handleTopUp(pkg.amount)}
								className="w-full flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
							>
								<div className="text-left">
									<p className="font-bold text-gray-900 group-hover:text-emerald-700">
										{pkg.amount} Credits
									</p>
									<p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">
										{pkg.label} Pack
									</p>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-sm font-black text-gray-900">
										{pkg.price}
									</span>
									<Plus size={16} className="text-emerald-500" />
								</div>
							</button>
						))}
					</CardContent>
				</Card>
			</div>

			{balance < 5 && (
				<div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
					<AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
					<div>
						<p className="text-sm font-bold text-amber-900">
							Low Credit Warning
						</p>
						<p className="text-xs text-amber-700">
							Your credits are running low. AI features will stop working once
							balance reaches zero.
						</p>
					</div>
				</div>
			)}

			<Card className="border-gray-100 shadow-sm overflow-hidden">
				<CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
					<div className="flex items-center gap-2">
						<History size={20} className="text-emerald-600" />
						<CardTitle className="text-lg font-bold">
							Transaction History
						</CardTitle>
					</div>
					<CardDescription>Recent usage and top-ups</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="w-full text-left">
							<thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase font-black tracking-widest text-gray-400">
								<tr>
									<th className="px-6 py-3">Date</th>
									<th className="px-6 py-3">Description</th>
									<th className="px-6 py-3 text-right">Amount</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-50">
								{transactions.length > 0 ? (
									transactions.map((t) => (
										<tr
											key={t.id}
											className="hover:bg-gray-50/50 transition-colors"
										>
											<td className="px-6 py-4 text-xs text-gray-500 font-bold">
												{new Date(t.created_at).toLocaleDateString()}
											</td>
											<td className="px-6 py-4 text-sm font-bold text-gray-700">
												{t.description}
											</td>
											<td
												className={`px-6 py-4 text-right font-black ${t.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}
											>
												{t.amount > 0 ? `+${t.amount}` : t.amount}
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={3} className="px-6 py-12 text-center">
											<p className="text-gray-400 font-bold italic">
												No transactions found
											</p>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default BillingManager
