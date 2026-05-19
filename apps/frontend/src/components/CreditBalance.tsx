import { AlertTriangle, CheckCircle, X, Zap } from 'lucide-react'
import React from 'react'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

interface CreditBalanceProps {
	balance: number
	warningThreshold?: number
	onTopUp?: () => void
}

export function CreditBalance({
	balance,
	warningThreshold = 5,
	onTopUp,
}: CreditBalanceProps) {
	const isLowBalance = balance < warningThreshold
	const isNegative = balance < 0

	return (
		<Card
			className={`${isNegative ? 'border-red-200' : isLowBalance ? 'border-amber-200' : 'border-emerald-100'}`}
		>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Zap className="w-5 h-5 text-emerald-600" />
						<CardTitle className="text-lg">AI Credit Balance</CardTitle>
					</div>
					{isLowBalance && !isNegative && (
						<div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
							<AlertTriangle className="w-4 h-4" />
							<span className="text-xs font-semibold">Low Balance</span>
						</div>
					)}
					{isNegative && (
						<div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
							<X className="w-4 h-4" />
							<span className="text-xs font-semibold">Negative Balance</span>
						</div>
					)}
				</div>
				{isLowBalance && !isNegative && (
					<CardDescription className="text-amber-700">
						Your credits are running low. Top up soon to avoid service
						interruption.
					</CardDescription>
				)}
				{isNegative && (
					<CardDescription className="text-red-700">
						Your balance is negative. Please top up to continue using AI
						features.
					</CardDescription>
				)}
				{!isLowBalance && (
					<CardDescription className="text-gray-500">
						Each AI response consumes credits based on the model used.
					</CardDescription>
				)}
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
				<div className="text-center">
					<div className="flex items-baseline justify-center gap-1 mb-2">
						<span
							className={`text-5xl font-black ${isNegative ? 'text-red-600' : isLowBalance ? 'text-amber-600' : 'text-emerald-600'}`}
						>
							{balance.toFixed(2)}
						</span>
						<span
							className={`text-sm font-semibold ${isNegative ? 'text-red-700' : isLowBalance ? 'text-amber-700' : 'text-emerald-700'}`}
						>
							credits
						</span>
					</div>
					{isNegative && (
						<p className="text-sm text-red-600 font-medium">
							Grace period: You have {balance + 100} credits remaining before
							service stops.
						</p>
					)}
				</div>

				<div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
					<CheckCircle className="w-4 h-4 text-emerald-600" />
					<span>Never expires</span>
				</div>
			</CardContent>
		</Card>
	)
}
