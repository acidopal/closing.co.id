import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
	ArrowUpDown,
	CheckSquare,
	ChevronLeft,
	ChevronRight,
	LayoutGrid,
	List,
	Loader2,
	Search,
	Ticket,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
	type TicketKanbanColumn,
	type TicketListItem,
	type TicketsBoardResponse,
	type TicketsSettingsResponse,
	tickets as ticketsApi,
} from '@/lib/api'

type TicketsView = 'kanban' | 'list'
type TicketSortField = 'updated_at' | 'created_at' | 'deal_value' | 'contact_name'
type TicketSortDirection = 'asc' | 'desc'

interface TicketsSearch {
	board_id?: string
	conversation_id?: string
	view?: string
	q?: string
	sort_field?: string
	sort_direction?: string
	page?: string
}

const DEFAULT_LIMIT = 20

function formatCurrency(value: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0,
	}).format(Number.isFinite(value) ? value : 0)
}

function formatRelative(value: string | null): string {
	if (!value) return '-'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return '-'
	return date.toLocaleString('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

export const Route = createFileRoute('/_app/tickets')({
	validateSearch: (search: TicketsSearch) => ({
		board_id: typeof search.board_id === 'string' ? search.board_id : undefined,
		conversation_id:
			typeof search.conversation_id === 'string'
				? search.conversation_id
				: undefined,
		view: search.view === 'list' ? 'list' : 'kanban',
		q: typeof search.q === 'string' ? search.q : '',
		sort_field:
			search.sort_field === 'created_at' ||
			search.sort_field === 'deal_value' ||
			search.sort_field === 'contact_name'
				? search.sort_field
				: 'updated_at',
		sort_direction: search.sort_direction === 'asc' ? 'asc' : 'desc',
		page:
			typeof search.page === 'string' && Number(search.page) > 0
				? search.page
				: '1',
	}),
	component: TicketsPage,
})

function TicketsPage() {
	const navigate = useNavigate()
	const search = Route.useSearch()
	const [settings, setSettings] = useState<TicketsSettingsResponse | null>(null)
	const [boardData, setBoardData] = useState<TicketsBoardResponse | null>(null)
	const [isLoadingSettings, setIsLoadingSettings] = useState(false)
	const [isLoadingBoard, setIsLoadingBoard] = useState(false)
	const [searchInput, setSearchInput] = useState(search.q || '')
	const selectedConversationId = search.conversation_id || null
	const selectedBoardId = search.board_id || null
	const view = (search.view || 'kanban') as TicketsView
	const sortField = (search.sort_field || 'updated_at') as TicketSortField
	const sortDirection = (search.sort_direction || 'desc') as TicketSortDirection
	const page = Math.max(1, Number(search.page || '1') || 1)

	const debouncedSearch = useMemo(() => searchInput.trim(), [searchInput])
	const boards = settings?.boards || []

	const syncSearch = useCallback(
		(next: Partial<TicketsSearch>, replace = true) => {
			void navigate({
				to: '/tickets',
				search: (prev) => ({
					...prev,
					...next,
				}),
				replace,
			})
		},
		[navigate],
	)

	const loadSettings = useCallback(async () => {
		setIsLoadingSettings(true)
		try {
			const data = await ticketsApi.getSettings()
			setSettings(data)

			const availableIds = new Set(data.boards.map((board) => board.id))
			const initialBoardId =
				(selectedBoardId && availableIds.has(selectedBoardId)
					? selectedBoardId
					: data.default_board_id && availableIds.has(data.default_board_id)
						? data.default_board_id
						: data.boards[0]?.id) || undefined

			if (initialBoardId !== selectedBoardId) {
				syncSearch({ board_id: initialBoardId, page: '1' }, true)
			}
		} catch (error) {
			console.error('Failed to load ticket settings', error)
			toast.error('Failed to load ticket settings')
		} finally {
			setIsLoadingSettings(false)
		}
	}, [selectedBoardId, syncSearch])

	const loadBoard = useCallback(async () => {
		if (!selectedBoardId) {
			setBoardData({
				view,
				board: null,
				pagination: { page, limit: DEFAULT_LIMIT, total: 0 },
				columns: [],
				items: [],
			})
			return
		}

		setIsLoadingBoard(true)
		try {
			const data = await ticketsApi.getBoard({
				board_id: selectedBoardId,
				view,
				page,
				limit: DEFAULT_LIMIT,
				search: debouncedSearch || undefined,
				sort: {
					field: sortField,
					direction: sortDirection,
				},
			})
			setBoardData(data)
		} catch (error) {
			console.error('Failed to load ticket board', error)
			toast.error('Failed to load ticket board')
		} finally {
			setIsLoadingBoard(false)
		}
	}, [selectedBoardId, view, page, debouncedSearch, sortField, sortDirection])

	useEffect(() => {
		void loadSettings()
	}, [loadSettings])

	useEffect(() => {
		void loadBoard()
	}, [loadBoard])

	useEffect(() => {
		setSearchInput(search.q || '')
	}, [search.q])

	const columns = boardData?.columns || []
	const items = boardData?.items || []
	const total = boardData?.pagination.total || 0
	const totalPages = Math.max(1, Math.ceil(total / DEFAULT_LIMIT))
	const hasNoBoards = Boolean(settings && settings.boards.length === 0)
	const activeBoard = boards.find((board) => board.id === selectedBoardId) || null

	return (
		<div className="h-full bg-gray-50 px-4 py-5 md:px-6 lg:px-8">
			<div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
							<Ticket className="h-5 w-5 text-blue-600" />
							Tickets Board
						</h1>
						<p className="mt-1 text-sm text-gray-500">
							Read-only ticket monitoring with kanban and list view.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => syncSearch({ view: 'kanban', page: '1' })}
							className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
								view === 'kanban'
									? 'border-blue-500 bg-blue-50 text-blue-700'
									: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
							}`}
						>
							<LayoutGrid className="h-4 w-4" />
							Kanban View
						</button>
						<button
							type="button"
							onClick={() => syncSearch({ view: 'list', page: '1' })}
							className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
								view === 'list'
									? 'border-blue-500 bg-blue-50 text-blue-700'
									: 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
							}`}
						>
							<List className="h-4 w-4" />
							List View
						</button>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
					<label className="space-y-1">
						<span className="text-xs font-medium text-gray-500">Board</span>
						<select
							value={selectedBoardId || ''}
							onChange={(event) =>
								syncSearch({ board_id: event.target.value || undefined, page: '1' })
							}
							className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
							disabled={isLoadingSettings || hasNoBoards}
						>
							{hasNoBoards ? (
								<option value="">No ticket boards available</option>
							) : (
								boards.map((board) => (
									<option key={board.id} value={board.id}>
										{board.board_name}
									</option>
								))
							)}
						</select>
					</label>

					<label className="space-y-1">
						<span className="text-xs font-medium text-gray-500">Search</span>
						<div className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
							<input
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								onBlur={() => syncSearch({ q: searchInput, page: '1' })}
								placeholder="Search contact, phone, message"
								className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900"
							/>
						</div>
					</label>

					<label className="space-y-1">
						<span className="text-xs font-medium text-gray-500">Sort Field</span>
						<select
							value={sortField}
							onChange={(event) =>
								syncSearch({
									sort_field: event.target.value,
									page: '1',
								})
							}
							className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
						>
							<option value="updated_at">Updated At</option>
							<option value="created_at">Created At</option>
							<option value="deal_value">Deal Value</option>
							<option value="contact_name">Contact Name</option>
						</select>
					</label>

					<label className="space-y-1">
						<span className="text-xs font-medium text-gray-500">Sort Direction</span>
						<select
							value={sortDirection}
							onChange={(event) =>
								syncSearch({
									sort_direction: event.target.value,
									page: '1',
								})
							}
							className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900"
						>
							<option value="desc">Descending</option>
							<option value="asc">Ascending</option>
						</select>
					</label>
				</div>

				{selectedConversationId ? (
					<div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
						Context conversation: <span className="font-mono">{selectedConversationId}</span>
					</div>
				) : null}
			</div>

			{isLoadingSettings || (isLoadingBoard && !boardData) ? (
				<div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
					<Loader2 className="h-5 w-5 animate-spin text-gray-500" />
				</div>
			) : hasNoBoards ? (
				<div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
					<CheckSquare className="mx-auto h-8 w-8 text-gray-400" />
					<h2 className="mt-3 text-lg font-semibold text-gray-900">
						No Ticket Board Configured
					</h2>
					<p className="mt-1 text-sm text-gray-500">
						Setup a ticket pipeline and statuses first. This page will render data
						once boards exist.
					</p>
				</div>
			) : view === 'kanban' ? (
				<KanbanView columns={columns} highlightConversationId={selectedConversationId} />
			) : (
				<ListView
					items={items}
					highlightConversationId={selectedConversationId}
					activeBoardName={activeBoard?.board_name || '-'}
				/>
			)}

			{!hasNoBoards && (
				<div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
					<div className="text-gray-500">
						Showing page <span className="font-semibold text-gray-800">{page}</span> of{' '}
						<span className="font-semibold text-gray-800">{totalPages}</span> ({total}{' '}
						items)
					</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-gray-700 disabled:opacity-50"
							onClick={() => syncSearch({ page: String(Math.max(1, page - 1)) })}
							disabled={page <= 1}
						>
							<ChevronLeft className="h-4 w-4" />
							Prev
						</button>
						<button
							type="button"
							className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-gray-700 disabled:opacity-50"
							onClick={() =>
								syncSearch({ page: String(Math.min(totalPages, page + 1)) })
							}
							disabled={page >= totalPages}
						>
							Next
							<ChevronRight className="h-4 w-4" />
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

function KanbanView({
	columns,
	highlightConversationId,
}: {
	columns: TicketKanbanColumn[]
	highlightConversationId: string | null
}) {
	if (columns.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
				No ticket status columns found for this board.
			</div>
		)
	}

	return (
		<div className="flex gap-4 overflow-x-auto pb-1">
			{columns.map((column) => (
				<div
					key={column.id}
					className="w-[320px] shrink-0 rounded-xl border border-gray-200 bg-white"
				>
					<div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
						<div className="flex items-center gap-2">
							<span
								className="h-2.5 w-2.5 rounded-full"
								style={{ backgroundColor: column.color || '#94A3B8' }}
							/>
							<h3 className="font-semibold text-gray-900">{column.name}</h3>
						</div>
						<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
							{column.tickets.length}
						</span>
					</div>
					<div className="space-y-3 p-3">
						{column.tickets.length === 0 ? (
							<div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
								No tickets
							</div>
						) : (
							column.tickets.map((ticket) => {
								const isHighlighted =
									highlightConversationId === ticket.conversation_id
								return (
									<div
										key={ticket.conversation_id}
										className={`rounded-lg border p-3 ${
											isHighlighted
												? 'border-blue-300 bg-blue-50'
												: 'border-gray-200 bg-white'
										}`}
									>
										<div className="flex items-start justify-between gap-2">
											<p className="text-sm font-semibold text-gray-900">
												{ticket.contact_name}
											</p>
											<span className="text-xs text-gray-500">
												{formatRelative(ticket.updated_at)}
											</span>
										</div>
										<p className="mt-1 line-clamp-2 text-xs text-gray-600">
											{ticket.last_message || '-'}
										</p>
										<div className="mt-3 flex items-center justify-between">
											<span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
												{formatCurrency(ticket.deal_value)}
											</span>
											<span className="text-[11px] font-mono text-gray-400">
												{ticket.conversation_id.slice(0, 8)}
											</span>
										</div>
									</div>
								)
							})
						)}
					</div>
				</div>
			))}
		</div>
	)
}

function ListView({
	items,
	highlightConversationId,
	activeBoardName,
}: {
	items: TicketListItem[]
	highlightConversationId: string | null
	activeBoardName: string
}) {
	return (
		<div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
			<div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm">
				<div className="font-medium text-gray-900">Board: {activeBoardName}</div>
				<div className="inline-flex items-center gap-1 text-gray-500">
					<ArrowUpDown className="h-4 w-4" />
					Sorted list
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="min-w-full text-sm">
					<thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
						<tr>
							<th className="px-4 py-3 font-medium">Contact</th>
							<th className="px-4 py-3 font-medium">Stage</th>
							<th className="px-4 py-3 font-medium">Status</th>
							<th className="px-4 py-3 font-medium">Deal Value</th>
							<th className="px-4 py-3 font-medium">Updated</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{items.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="px-4 py-10 text-center text-sm text-gray-500"
								>
									No ticket rows found for this query.
								</td>
							</tr>
						) : (
							items.map((item) => {
								const isHighlighted =
									highlightConversationId === item.conversation_id
								return (
									<tr
										key={item.conversation_id}
										className={isHighlighted ? 'bg-blue-50' : 'bg-white'}
									>
										<td className="px-4 py-3">
											<div className="font-medium text-gray-900">
												{item.contact_name}
											</div>
											<div className="text-xs text-gray-500">
												{item.contact_phone || '-'}
											</div>
										</td>
										<td className="px-4 py-3 text-gray-700">
											{item.stage_name || 'Unassigned'}
										</td>
										<td className="px-4 py-3 text-gray-700">
											{item.conversation_status || '-'}
										</td>
										<td className="px-4 py-3 font-medium text-gray-900">
											{formatCurrency(item.deal_value)}
										</td>
										<td className="px-4 py-3 text-gray-500">
											{formatRelative(item.updated_at)}
										</td>
									</tr>
								)
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}
