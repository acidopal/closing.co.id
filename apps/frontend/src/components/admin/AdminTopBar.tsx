import { Menu, User, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

interface AdminTopBarProps {
	onToggleSidebar: () => void
}

export default function AdminTopBar({ onToggleSidebar }: AdminTopBarProps) {
	const [userName, setUserName] = useState('Admin')

	useEffect(() => {
		const stored = localStorage.getItem('scalechat_user')
		if (stored) {
			try {
				const user = JSON.parse(stored)
				setUserName(user.name || 'Admin')
			} catch (e) {
				console.error('Failed to parse user for AdminTopBar', e)
			}
		}
	}, [])

	return (
		<header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-md transition-colors duration-300">
			<div className="flex items-center gap-4">
				<button
					onClick={onToggleSidebar}
					className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
				>
					<Menu size={20} />
				</button>
				<h1 className="hidden text-lg font-semibold text-foreground sm:block">
					Platform Overview
				</h1>
			</div>

			<div className="flex items-center gap-3">
				<ThemeToggle />

				<button className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
					<Bell size={20} />
					<span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-background bg-indigo-600"></span>
				</button>

				<div className="mx-1 h-6 w-px bg-border" />

				<div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-2 py-1.5">
					<div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
						<User size={16} />
					</div>
					<div className="pr-1 text-sm font-medium text-foreground">
						{userName}
					</div>
				</div>
			</div>
		</header>
	)
}
