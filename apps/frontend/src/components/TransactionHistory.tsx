import { ArrowDown, ArrowUp, CreditCard, ExternalLink } from 'lucide-react'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

interface Transaction {
	id: string
	created_at: string
	description: string
	type: 'top_up' | 'usage' | 'refund' | 'adjustment'
	amount: number
	payment_status?: string
	external_id?: string
}

interface TransactionHistoryProps {
	transactions: Transaction[]
	onLoadMore?: () => void
	hasMore?: boolean
}

export function TransactionHistory({
	transactions,
	onLoadMore,
	hasMore = false,
}: TransactionHistoryProps) {
	if (transactions.length === 0) {
		return (
			<Card>
				<CardContent className="py-12 text-center">
					<CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
					<p className="text-gray-500">No transactions found</p>
					<p className="text-sm text-gray-400 mt-1">
						Transactions will appear here after you top up or use AI features.
					</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ArrowDown className="w-5 h-5" />
					Transaction History
				</CardTitle>
				<CardDescription>
					Your recent top-ups, usage, and credit adjustments.
				</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead className="bg-gray-50 border-b">
							<tr>
								<th className="px-4 py-3 text-xs uppercase font-semibold text-gray-500">
									Date
								</th>
								<th className="px-4 py-3 text-xs uppercase font-semibold text-gray-500">
									Description
								</th>
								<th className="px-4 py-3 text-xs uppercase font-semibold text-gray-500">
									Type
								</th>
								<th className="px-4 py-3 text-xs uppercase font-semibold text-gray-500">
									Status
								</th>
								<th className="px-4 py-3 text-xs uppercase font-semibold text-gray-500 text-right">
									Amount
								</th>
							</tr>
						</thead>
						<tbody className="divide-y text-sm">
							{transactions.map((t) => (
								<tr key={t.id} className="hover:bg-gray-50 transition-colors">
									<td className="px-4 py-3 text-gray-500 whitespace-nowrap">
										{new Date(t.created_at).toLocaleDateString()}
									</td>
									<td className="px-4 py-3 font-medium max-w-xs truncate">
										{t.description}
									</td>
									<td className="px-4 py-3">
										<span
											className={`px-2 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 ${
												t.type === 'top_up'
													? 'bg-green-100 text-green-800'
													: t.type === 'usage'
														? 'bg-red-100 text-red-800'
														: t.type === 'refund'
															? 'bg-blue-100 text-blue-800'
															: 'bg-purple-100 text-purple-800'
											}`}
										>
											{t.type === 'top_up'
												? 'Top-up'
												: t.type === 'usage'
													? 'Usage'
													: t.type === 'refund'
														? 'Refund'
														: 'Adjustment'}
										</span>
									</td>
									<td className="px-4 py-3">
										<span
											className={`px-2 py-1 rounded text-xs font-semibold ${
												t.payment_status === 'completed'
													? 'bg-emerald-100 text-emerald-800'
													: t.payment_status === 'pending'
														? 'bg-amber-100 text-amber-800'
														: t.payment_status === 'failed'
															? 'bg-red-100 text-red-800'
															: 'bg-gray-100 text-gray-800'
											}`}
										>
											{t.payment_status === 'completed'
												? 'Completed'
												: t.payment_status === 'pending'
													? 'Pending'
													: t.payment_status === 'failed'
														? 'Failed'
														: 'Unknown'}
										</span>
									</td>
									<td
										className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
											t.amount > 0 ? 'text-green-600' : 'text-red-600'
										}`}
									>
										{t.amount > 0 ? `+${t.amount}` : t.amount}
									</td>
									{t.external_id && (
										<td className="px-4 py-3">
											<a
												href={`https://dashboard.xendit.co/invoices/${t.external_id}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-primary hover:text-primary/70 flex items-center gap-1 text-xs"
											>
												View Invoice
												<ExternalLink className="w-3 h-3" />
											</a>
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{hasMore && onLoadMore && (
					<div className="p-4 text-center border-t">
						<Button variant="outline" onClick={onLoadMore} className="w-full">
							Load More Transactions
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
