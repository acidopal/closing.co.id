import { Link, useLocation } from '@tanstack/react-router'
import {
	Building2,
	CreditCard,
	LayoutDashboard,
	LogOut,
	Users,
	Wallet,
	Webhook,
	X,
} from 'lucide-react'

interface MenuItemProps {
	icon: any
	label: string
	path: string
	currentPath: string
}

function MenuItem({ icon: Icon, label, path, currentPath }: MenuItemProps) {
	const isActive = currentPath === path
	return (
		<Link
			to={path}
			className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-all ${
				isActive
					? 'border-l-4 border-indigo-600 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground'
			}`}
		>
			<Icon size={18} strokeWidth={1.5} />
			<span className="text-sm font-medium">{label}</span>
		</Link>
	)
}

interface AdminSidebarProps {
	onClose?: () => void
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
	const location = useLocation()

	const menuItems = [
		{ icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
		{ icon: Users, label: 'Users', path: '/admin/users' },
		{ icon: Building2, label: 'Companies', path: '/admin/companies' },
		{ icon: Wallet, label: 'Org Balances', path: '/admin/org-balance' },
		{ icon: Webhook, label: 'Webhooks', path: '/admin/webhooks' },
		{ icon: CreditCard, label: 'AI Pricing', path: '/admin/ai-pricing' },
	]

	const handleLogout = () => {
		localStorage.clear()
		window.location.href = '/login'
	}

	return (
		<aside className="flex h-full w-64 flex-col rounded-r-2xl border-r border-border bg-card text-card-foreground transition-[background-color,border-color,color] duration-300 lg:rounded-none">
			<div className="flex items-center justify-between border-b border-border p-4">
				<div className="flex items-center gap-2 px-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm">
						A
					</div>
					<span className="font-bold text-foreground">Admin Console</span>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
				>
					<X size={20} />
				</button>
			</div>

			<nav className="flex-1 overflow-y-auto py-4">
				<div className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Management
				</div>
				{menuItems.map((item) => (
					<MenuItem
						key={item.path}
						icon={item.icon}
						label={item.label}
						path={item.path}
						currentPath={location.pathname}
					/>
				))}
			</nav>

			<div className="border-t border-border p-4">
				<button
					type="button"
					onClick={handleLogout}
					className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-red-600 transition-colors hover:bg-red-500/10"
				>
					<LogOut size={18} strokeWidth={1.5} />
					<span className="text-sm font-medium">Logout</span>
				</button>
				<div className="mt-3 text-center text-xs text-muted-foreground">
					Super Admin Mode
				</div>
			</div>
		</aside>
	)
}
