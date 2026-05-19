import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopBar from '@/components/admin/AdminTopBar'

export const Route = createFileRoute('/admin')({
	beforeLoad: () => {
		if (typeof localStorage === 'undefined') return

		const storedUser = localStorage.getItem('scalechat_user')
		const token = localStorage.getItem('scalechat_token')

		if (!token || !storedUser) {
			throw redirect({
				to: '/login',
				replace: true,
			})
		}

		try {
			const user = JSON.parse(storedUser)
			if (user.role !== 'super_admin') {
				throw redirect({
					to: '/',
					replace: true,
				})
			}
		} catch (e) {
			throw redirect({
				to: '/login',
				replace: true,
			})
		}
	},
	component: AdminLayout,
})

function AdminLayout() {
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

	return (
		<div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
			{/* Desktop Sidebar */}
			<div className="hidden lg:flex">
				<AdminSidebar />
			</div>

			{/* Mobile Sidebar Overlay */}
			{isMobileSidebarOpen && (
				<div className="lg:hidden fixed inset-0 z-[100] flex">
					<div
						className="fixed inset-0 bg-black/60 backdrop-blur-sm"
						onClick={() => setIsMobileSidebarOpen(false)}
					/>
					<div className="relative w-64 h-full shadow-2xl">
						<AdminSidebar onClose={() => setIsMobileSidebarOpen(false)} />
					</div>
				</div>
			)}

			<div className="flex flex-1 flex-col h-full overflow-hidden relative">
				<AdminTopBar onToggleSidebar={() => setIsMobileSidebarOpen(true)} />
				<main className="flex-1 overflow-y-auto p-4 lg:p-8">
					<div className="max-w-7xl mx-auto">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	)
}
