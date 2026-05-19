import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
	Code,
	LayoutDashboard,
	Inbox as InboxIcon,
	LayoutTemplate,
	Users,
	Grid3x3,
	Search,
	X,
	MessageSquare,
	Bot,
	Settings,
	CreditCard,
	HelpCircle,
	FileText,
	Instagram,
	Music2,
	Webhook,
	ChevronRight,
} from 'lucide-react'
import { getAllowedPrimaryPathsForRole } from '@/lib/role-access'
import { useAppContext } from '@/routes/_app'

interface CommandPaletteProps {
	isOpen: boolean
	onClose: () => void
}

export default function CommandPalette({
	isOpen,
	onClose,
}: CommandPaletteProps) {
	const navigate = useNavigate()
	const { agent } = useAppContext()
	const allowedPrimaryPaths = getAllowedPrimaryPathsForRole(agent?.role)
	const [search, setSearch] = useState('')
	const [selectedIndex, setSelectedIndex] = useState(0)

	// Define navigation items
	const items = [
		{
			category: 'Global',
			label: 'Dashboard',
			icon: LayoutDashboard,
			path: '/dashboard',
		},
		{
			category: 'Global',
			label: 'Inbox',
			icon: InboxIcon,
			path: '/chat',
		},
		{
			category: 'Global',
			label: 'Templates',
			icon: LayoutTemplate,
			path: '/templates',
		},
		{
			category: 'CRM',
			label: 'Customers',
			icon: Users,
			path: '/customers',
		},
		{
			category: 'CRM',
			label: 'Pipeline',
			icon: Grid3x3,
			path: '/pipeline',
		},
		{
			category: 'Platforms',
			label: 'WhatsApp',
			icon: MessageSquare,
			path: '/channels/whatsapp',
		},
		{
			category: 'Platforms',
			label: 'Instagram',
			icon: Instagram,
			path: '/channels/instagram',
		},
		{
			category: 'Platforms',
			label: 'TikTok',
			icon: Music2,
			path: '/channels/tiktok',
		},
		{
			category: 'Configuration',
			label: 'Team',
			icon: Users,
			path: '/team',
		},
		{
			category: 'Configuration',
			label: 'AI Chatbot',
			icon: Bot,
			path: '/ai',
		},
		{
			category: 'Configuration',
			label: 'Settings',
			icon: Settings,
			path: '/settings',
		},
		{
			category: 'Configuration',
			label: 'Orders',
			icon: CreditCard,
			path: '/orders',
		},
		{
			category: 'Developers',
			label: 'API',
			icon: Code,
			path: '/developers',
		},
		{
			category: 'Developers',
			label: 'Integrations',
			icon: Webhook,
			path: '/integration',
		},
		{
			category: 'Support',
			label: 'Help & Support',
			icon: HelpCircle,
			path: '/help',
		},
	]

	const roleScopedItems = allowedPrimaryPaths
		? items.filter((item) => allowedPrimaryPaths.includes(item.path))
		: items

	const filteredItems = roleScopedItems.filter(
		(item) =>
			item.label.toLowerCase().includes(search.toLowerCase()) ||
			item.category.toLowerCase().includes(search.toLowerCase()),
	)

	// Reset selection when search changes
	useEffect(() => {
		setSelectedIndex(0)
	}, [search])

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowDown') {
				e.preventDefault()
				setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
			} else if (e.key === 'ArrowUp') {
				e.preventDefault()
				setSelectedIndex(
					(prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
				)
			} else if (e.key === 'Enter') {
				e.preventDefault()
				if (filteredItems[selectedIndex]) {
					handleSelect(filteredItems[selectedIndex].path)
				}
			} else if (e.key === 'Escape') {
				e.preventDefault()
				onClose()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, filteredItems, selectedIndex])

	const handleSelect = (path: string) => {
		navigate({ to: path })
		onClose()
		setSearch('')
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh]">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg transform rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/5 transition-all">
				{/* Search Input */}
				<div className="flex items-center border-b border-border px-4 py-3">
					<Search className="mr-3 h-5 w-5 text-muted-foreground" />
					<input
						type="text"
						className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
						placeholder="Type a command or search..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						autoFocus
					/>
					<button
						onClick={onClose}
						className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Results List */}
				<div className="max-h-[60vh] overflow-y-auto py-2">
					{filteredItems.length === 0 ? (
						<div className="px-4 py-8 text-center text-sm text-muted-foreground">
							No results found.
						</div>
					) : (
						<div>
							{filteredItems.map((item, index) => {
								const isSelected = index === selectedIndex

								// Group Header logic (simplified: just list items for now, ideally strictly grouped)
								// Standard Command Palette often just lists items.
								// To group visually, we can check if category changed roughly, but with search it's trickier.
								// We'll just show category name in the item.

								return (
									<button
										key={item.path}
										onClick={() => handleSelect(item.path)}
										onMouseEnter={() => setSelectedIndex(index)}
										className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
											isSelected
												? 'bg-primary/12 text-primary'
												: 'text-foreground/85 hover:bg-muted'
										}`}
									>
										<div className="flex items-center gap-3">
											<div
												className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
													isSelected
														? 'bg-background text-primary shadow-sm'
														: 'bg-muted text-muted-foreground'
												}`}
											>
												<item.icon size={18} />
											</div>
											<div>
												<div className="font-medium">{item.label}</div>
												<div
													className={`text-xs ${
														isSelected
															? 'text-primary/70'
															: 'text-muted-foreground'
													}`}
												>
													{item.category}
												</div>
											</div>
										</div>
										{isSelected && (
											<ChevronRight className="h-4 w-4 opacity-50" />
										)}
									</button>
								)
							})}
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
					<span>
						Use <kbd className="font-sans font-semibold">↑</kbd>{' '}
						<kbd className="font-sans font-semibold">↓</kbd> to navigate
					</span>
					<span>
						<kbd className="font-sans font-semibold">Enter</kbd> to select
					</span>
				</div>
			</div>
		</div>
	)
}
