import { Link, useLocation } from '@tanstack/react-router'
import {
	LayoutDashboard,
	Inbox,
	LayoutTemplate,
	Users,
	Menu,
} from 'lucide-react'
import { getAllowedPrimaryPathsForRole } from '@/lib/role-access'
import { useAppContext } from '@/routes/_app'

export default function BottomNav({
	onMenuClick,
}: {
	onMenuClick?: () => void
}) {
	const location = useLocation()
	const { agent } = useAppContext()
	const allowedPrimaryPaths = getAllowedPrimaryPathsForRole(agent?.role)

	const roleAwareItems = allowedPrimaryPaths
		? [
				{
					icon: LayoutDashboard,
					label: 'Dashboard',
					path: '/dashboard',
				},
				{ icon: Inbox, label: 'Inbox', path: '/chat' },
				...(allowedPrimaryPaths.includes('/team')
					? [{ icon: Users, label: 'Team', path: '/team' }]
					: []),
			]
		: [
				{
					icon: LayoutDashboard,
					label: 'Dashboard',
					path: '/dashboard',
				},
				{ icon: Inbox, label: 'Inbox', path: '/chat' },
				{
					icon: LayoutTemplate,
					label: 'Templates',
					path: '/templates',
				},
				{
					icon: Users,
					label: 'Customers',
					path: '/customers',
				},
			]

	const navItems = [
		...roleAwareItems,
		{
			icon: Menu,
			label: 'Menu',
			path: '#menu',
			onClick: (e: React.MouseEvent) => {
				e.preventDefault()
				onMenuClick?.()
			},
		},
	]

	return (
		<div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50">
			{navItems.map((item) => {
				const isActive = location.pathname === item.path
				const Icon = item.icon

				const content = (
					<>
						<div
							className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}
						>
							<Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
						</div>
						<span
							className={`text-[10px] font-medium transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}
						>
							{item.label}
						</span>
					</>
				)

				if ('onClick' in item) {
					return (
						<button
							key={item.label}
							onClick={item.onClick}
							className={`flex flex-col items-center justify-center gap-1 group transition-colors px-3 py-1 flex-1`}
						>
							{content}
						</button>
					)
				}

				return (
					<Link
						key={item.path}
						to={item.path}
						className={`flex flex-col items-center justify-center gap-1 group transition-colors px-3 py-1 flex-1`}
					>
						{content}
					</Link>
				)
			})}
		</div>
	)
}
