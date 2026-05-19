import { TransactionHistory } from './TransactionHistory'

const testTransactions = [
	{
		id: '1',
		type: 'top_up',
		amount: 100,
		description: 'Starter package',
		created_at: new Date(),
		payment_status: 'completed',
	},
	{
		id: '2',
		type: 'usage',
		amount: -5,
		description: 'AI response',
		created_at: new Date(),
		payment_status: 'completed',
	},
	{
		id: '3',
		type: 'refund',
		amount: 10,
		description: 'Service credit refund',
		created_at: new Date(Date.now() - 86400000), // 1 day ago
		payment_status: 'completed',
	},
]

// Test cases:
// 1. Normal render with transactions
const NormalRender = () => (
	<TransactionHistory transactions={testTransactions} />
)

// 2. Loading state
const LoadingState = () => (
	<TransactionHistory transactions={[]} loading={true} />
)

// 3. Empty state
const EmptyState = () => <TransactionHistory transactions={[]} />

// 4. Error state with retry
const ErrorState = () => (
	<TransactionHistory
		transactions={[]}
		error="Network error occurred"
		onRetry={() => console.log('Retrying...')}
	/>
)

// 5. With partial loading (shows existing transactions while loading more)
const PartialLoading = () => (
	<TransactionHistory transactions={testTransactions} loading={true} />
)

export { NormalRender, LoadingState, EmptyState, ErrorState, PartialLoading }
