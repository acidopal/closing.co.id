import {
	createFileRoute,
	Outlet,
	useLocation,
	useNavigate,
} from '@tanstack/react-router'
import { createContext, useContext, useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import { useTimezone } from '@/hooks/useTimezone'
import {
	extractNormalizedRole,
	getAllowedPrimaryPathsForRole,
	isPathAllowedForRole,
} from '@/lib/role-access'
import {
	rememberPostLoginRedirect,
	type Organization,
	organizationApi,
	persistOrganizationContext,
	getOrgSlugFromCookie,
} from '@/lib/organization'

// App context to share app_id and user info across all nested routes
interface Agent {
	id: string
	email: string
	name: string
	role: string
}

function parseStoredAgent(raw: string): Agent | null {
	try {
		const parsed = JSON.parse(raw) as any
		const candidate =
			parsed && typeof parsed.user === 'object' && parsed.user
				? parsed.user
				: parsed

		if (!candidate || typeof candidate !== 'object') return null

		const id = String(candidate.id || '').trim()
		const email = String(candidate.email || '').trim()
		const name =
			String(candidate.name || '').trim() ||
			(email ? email.split('@')[0] : '') ||
			'User'
		const role = extractNormalizedRole(candidate)

		if (!id && !email) return null

		return {
			id: id || email,
			email: email || '',
			name,
			role,
		}
	} catch {
		return null
	}
}

interface AppContextType {
	appId: string
	agent: Agent | null
	toggleSidebar?: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export const useAppContext = () => {
	const context = useContext(AppContext)
	if (!context) {
		return {
			appId: '',
			agent: null,
			toggleSidebar: () => {},
		}
	}
	return context
}

export const Route = createFileRoute('/_app')({
	component: AppLayout,
})

function AppLayout() {
	const location = useLocation()
	const navigate = useNavigate()
	const [agent, setAgent] = useState<Agent | null>(null)
	const [organizations, setOrganizations] = useState<Organization[]>([])
	const [loading, setLoading] = useState(true)
	const [appId, setAppId] = useState(() => {
		if (typeof localStorage !== 'undefined') {
			return localStorage.getItem('scalechat_org_slug') || ''
		}
		return ''
	})

	// Initialize timezone detection
	useTimezone()

	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
	const [isBottomNavHidden, setIsBottomNavHidden] = useState(false)
	const isDesktopSidebarCollapsed = true

	useEffect(() => {
		if (typeof window === 'undefined') return

		const handleBottomNavVisibility = (
			event: Event | CustomEvent<{ hidden?: boolean }>,
		) => {
			const customEvent = event as CustomEvent<{ hidden?: boolean }>
			setIsBottomNavHidden(Boolean(customEvent.detail?.hidden))
		}

		window.addEventListener(
			'scalechat:bottom-nav-visibility',
			handleBottomNavVisibility as EventListener,
		)

		return () => {
			window.removeEventListener(
				'scalechat:bottom-nav-visibility',
				handleBottomNavVisibility as EventListener,
			)
		}
	}, [])

	useEffect(() => {
		if (!location.pathname.includes('/chat')) {
			setIsBottomNavHidden(false)
		}
	}, [location.pathname])

	const isLoginPage = location.pathname === '/login'

	useEffect(() => {
		const checkAuth = async () => {
			if (typeof localStorage === 'undefined') {
				setLoading(false)
				return
			}

			const token = localStorage.getItem('scalechat_token')
			if (!token && !isLoginPage) {
				const currentSearch =
					typeof window !== 'undefined' ? window.location.search : ''
				const currentHash =
					typeof window !== 'undefined' ? window.location.hash : ''
				rememberPostLoginRedirect(
					`${location.pathname}${currentSearch}${currentHash}`,
				)
				navigate({ to: '/login', replace: true })
				setLoading(false)
				return
			}

			const storedAgent = localStorage.getItem('scalechat_user')
			if (storedAgent) {
				const parsedAgent = parseStoredAgent(storedAgent)
				if (parsedAgent) {
					setAgent(parsedAgent)
				}
			}

			if (token) {
				try {
					const { organizations: orgs, activeOrganizationId } =
						await organizationApi.list()
					setOrganizations(orgs)

					// Resolve org from cookie/localStorage
					const storedSlug =
						getOrgSlugFromCookie() || localStorage.getItem('scalechat_org_slug')
					const currentOrg =
						orgs.find((org) => org.slug === storedSlug) ||
						orgs.find((org) => org.id === activeOrganizationId) ||
						orgs[0]

					if (currentOrg) {
						persistOrganizationContext(currentOrg)
						setAppId(currentOrg.slug)
					}
				} catch (e) {
					setOrganizations([])
				}
			}
			setLoading(false)
		}

		checkAuth()
	}, [isLoginPage, navigate, location.pathname])

	const handleSelectOrganization = async (org: Organization) => {
		await organizationApi.setActive(org.id)
		persistOrganizationContext(org)
		setAppId(org.slug)
		setOrganizations((prev) => {
			const exists = prev.some((item) => item.id === org.id)
			if (exists) return prev
			return [...prev, org]
		})
		navigate({ to: '/dashboard' })
	}

	const handleCreateOrganization = () => {
		navigate({ to: '/create-org' })
	}

	useEffect(() => {
		if (loading || !agent) return
		const allowedPaths = getAllowedPrimaryPathsForRole(agent.role)
		if (!isPathAllowedForRole(location.pathname, agent.role)) {
			navigate({
				to: allowedPaths?.[0] || '/dashboard',
				replace: true,
			})
		}
	}, [loading, agent, location.pathname, navigate])

	if (loading) return null

	return (
		<AppContext.Provider value={{ appId, agent, toggleSidebar: () => {} }}>
			<div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
				{/* Desktop Sidebar */}
				<div className="hidden lg:flex">
					<Sidebar
						agent={agent}
						isCollapsed={isDesktopSidebarCollapsed}
						organizations={organizations}
						onSelectOrganization={handleSelectOrganization}
						onCreateOrganization={handleCreateOrganization}
					/>
				</div>

				{/* Mobile Sidebar Overlay */}
				{isMobileSidebarOpen && (
					<div className="lg:hidden fixed inset-0 z-[100] flex">
						<button
							type="button"
							aria-label="Close sidebar"
							className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
							onClick={() => setIsMobileSidebarOpen(false)}
						/>
						<div className="relative w-64 h-full animate-in slide-in-from-left duration-300 shadow-2xl">
							<Sidebar
								agent={agent}
								isCollapsed={false}
								onClose={() => setIsMobileSidebarOpen(false)}
								organizations={organizations}
								onSelectOrganization={handleSelectOrganization}
								onCreateOrganization={handleCreateOrganization}
							/>
						</div>
					</div>
				)}

				<div className="flex flex-1 flex-col h-full bg-background relative transition-colors duration-300">
					<TopBar />
					<div className="flex flex-1 overflow-hidden relative pb-16 lg:pb-0">
						<Outlet />
					</div>
					{!isBottomNavHidden && (
						<BottomNav onMenuClick={() => setIsMobileSidebarOpen(true)} />
					)}
				</div>
			</div>
		</AppContext.Provider>
	)
}

export { AppContext }
