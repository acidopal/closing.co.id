import {
	AlertCircle,
	History,
	Loader2,
	ReceiptText,
	RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Transaction {
	id: string
	amount: number
	type: 'top_up' | 'usage' | 'adjustment' | 'refund' | string
	description?: string | null
	created_at: Date | string | null
}

export interface TransactionHistoryProps {
	transactions: Transaction[]
	loading?: boolean
	error?: string | null
	onRetry?: () => void
	className?: string
}

const IDR_FORMATTER = new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	maximumFractionDigits: 0,
})

const TRANSACTION_TYPE_STYLES: Record<
	string,
	{ label: string; className: string }
> = {
	top_up: {
		label: 'Top up',
		className:
			'border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200',
	},
	usage: {
		label: 'Usage',
		className:
			'border-slate-300 bg-slate-500/10 text-slate-700 dark:border-slate-500/40 dark:bg-slate-500/20 dark:text-slate-200',
	},
	adjustment: {
		label: 'Adjustment',
		className:
			'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-200',
	},
	refund: {
		label: 'Refund',
		className:
			'border-sky-200 bg-sky-500/10 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/20 dark:text-sky-200',
	},
}

function formatDate(value: Date | string | null): string {
	if (!value) return '-'

	const date = value instanceof Date ? value : new Date(value)
	if (Number.isNaN(date.getTime())) return '-'

	return date.toLocaleString('id-ID', {
		year: 'numeric',
		month: 'short',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
}

function formatAmount(amount: number): string {
	const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
	return `${sign}${IDR_FORMATTER.format(Math.abs(amount))}`
}

function getTransactionTypeStyle(type: string) {
	const normalized = type.toLowerCase()
	const fallbackLabel = normalized
		.split('_')
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(' ')

	return (
		TRANSACTION_TYPE_STYLES[normalized] || {
			label: fallbackLabel,
			className: 'border-border bg-muted text-muted-foreground',
		}
	)
}

export function TransactionHistory({
	transactions,
	loading = false,
	error,
	onRetry,
	className,
}: TransactionHistoryProps) {
	const isLoading = loading && transactions.length === 0
	const hasError = Boolean(error) && transactions.length === 0
	const isEmpty = !isLoading && !hasError && transactions.length === 0

	return (
		<Card className={cn('py-0 shadow-sm', className)}>
			<CardHeader className="p-6">
				<CardTitle className="flex items-center gap-2">
					<History className="h-5 w-5 text-primary" />
					Transaction History
				</CardTitle>
				<CardDescription>
					Recent top-ups, usage, and credit adjustments.
				</CardDescription>
			</CardHeader>

			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/40 hover:bg-muted/40">
							<TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
								Date
							</TableHead>
							<TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
								Type
							</TableHead>
							<TableHead className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
								Amount
							</TableHead>
							<TableHead className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
								Description
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={4} className="px-4 py-12">
									<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin" />
										Loading transaction history...
									</div>
								</TableCell>
							</TableRow>
						) : hasError ? (
							<TableRow>
								<TableCell colSpan={4} className="px-4 py-12">
									<div className="flex flex-col items-center gap-3 text-center">
										<div className="flex items-center justify-center rounded-lg bg-destructive/10 p-2 text-destructive">
											<AlertCircle className="h-4 w-4" />
										</div>
										<p className="text-sm font-medium">
											Failed to load transactions
										</p>
										<p className="max-w-md text-sm text-muted-foreground">
											{error}
										</p>
										{onRetry && (
											<Button variant="outline" size="sm" onClick={onRetry}>
												<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
												Retry
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						) : isEmpty ? (
							<TableRow>
								<TableCell colSpan={4} className="px-4 py-12">
									<div className="flex flex-col items-center gap-3 text-center">
										<div className="flex items-center justify-center rounded-lg bg-muted p-2 text-muted-foreground">
											<ReceiptText className="h-4 w-4" />
										</div>
										<p className="text-sm font-medium">No transactions yet</p>
										<p className="max-w-md text-sm text-muted-foreground">
											Your transaction history will appear after top-ups, usage,
											or manual adjustments.
										</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							transactions.map((transaction) => (
								<TableRow key={transaction.id} className="hover:bg-muted/30">
									<TableCell className="px-4 py-3 font-medium">
										{formatDate(transaction.created_at)}
									</TableCell>
									<TableCell className="px-4 py-3">
										<Badge
											variant="outline"
											className={cn(
												'capitalize',
												getTransactionTypeStyle(transaction.type).className,
											)}
										>
											{getTransactionTypeStyle(transaction.type).label}
										</Badge>
									</TableCell>
									<TableCell
										className={cn(
											'px-4 py-3 text-right font-medium tabular-nums',
											transaction.amount >= 0
												? 'text-emerald-600'
												: 'text-foreground',
										)}
									>
										{formatAmount(transaction.amount)}
									</TableCell>
									<TableCell className="px-4 py-3 text-muted-foreground whitespace-normal">
										<span className="text-sm">
											{transaction.description || '-'}
										</span>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}

export default TransactionHistory
