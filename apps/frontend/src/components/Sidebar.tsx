import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
	Bot,
	Code,
	CreditCard,
	FileText,
	HelpCircle,
	InboxIcon,
	Instagram,
	LayoutDashboard,
	LayoutTemplate,
	LogOut,
	MessageSquare,
	Send,
	Settings,
	Users,
	Webhook,
	X,
	Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Organization } from '@/lib/organization'
import {
	extractNormalizedRole,
	getAllowedPrimaryPathsForRole,
} from '@/lib/role-access'
import { useAppContext } from '@/routes/_app'
import { agentsManagement } from '../lib/agents-api'
import { API_BASE } from '../lib/api'
import OrganizationSwitcher from './OrganizationSwitcher'

interface Agent {
	id: string
	email: string
	name: string
	role: string
}

interface Props {
	agent?: Agent | null
	onLogout?: () => Promise<void>
	isCollapsed?: boolean
	onClose?: () => void
	organizations?: Organization[]
	onSelectOrganization?: (org: Organization) => Promise<void> | void
	onCreateOrganization?: () => void
}

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<title>TikTok</title>
		<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
	</svg>
)

// MenuItem component with tooltip
interface MenuItemProps {
	item: {
		icon: any
		label: string
		path: string
	}
	isCollapsed: boolean
	currentPath: string
}

function MenuItem({ item, isCollapsed, currentPath }: MenuItemProps) {
	const [showTooltip, setShowTooltip] = useState(false)
	const linkRef = useRef<HTMLAnchorElement>(null)
	const Icon = item.icon
	const isExternal = /^https?:\/\//.test(item.path)
	const isActive = !isExternal && currentPath === item.path
	const itemClassName = `flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-all ${
		isActive
			? 'border-l-4 border-primary bg-primary/12 text-primary'
			: 'text-muted-foreground hover:bg-muted hover:text-foreground'
	} ${isCollapsed ? 'justify-center px-2' : ''}`

	return (
		<div className="relative">
			{isExternal ? (
				<a
					ref={linkRef}
					href={item.path}
					target="_blank"
					rel="noopener noreferrer"
					onMouseEnter={() => isCollapsed && setShowTooltip(true)}
					onMouseLeave={() => setShowTooltip(false)}
					className={itemClassName}
				>
					<Icon
						size={isCollapsed ? 16 : 18}
						strokeWidth={isCollapsed ? 2 : 1.5}
					/>
					{!isCollapsed && (
						<span className="text-sm font-medium">{item.label}</span>
					)}
				</a>
			) : (
				<Link
					ref={linkRef}
					to={item.path}
					onMouseEnter={() => isCollapsed && setShowTooltip(true)}
					onMouseLeave={() => setShowTooltip(false)}
					className={itemClassName}
				>
					<Icon
						size={isCollapsed ? 16 : 18}
						strokeWidth={isCollapsed ? 2 : 1.5}
					/>
					{!isCollapsed && (
						<span className="text-sm font-medium">{item.label}</span>
					)}
				</Link>
			)}

			{/* Tooltip with Portal - Fixed positioning */}
				{isCollapsed &&
					showTooltip &&
					linkRef.current &&
					createPortal(
						<div
						className="fixed px-3 py-2 bg-popover text-popover-foreground text-sm font-medium rounded-lg shadow-2xl border border-border whitespace-nowrap pointer-events-none animate-in fade-in duration-150"
						style={{
							left: `${linkRef.current.getBoundingClientRect().right + 12}px`,
							top: `${linkRef.current.getBoundingClientRect().top + linkRef.current.getBoundingClientRect().height / 2}px`,
							transform: 'translateY(-50%)',
							zIndex: 999999,
						}}
					>
						{item.label}
						<div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-popover rotate-45"></div>
					</div>,
					document.body,
				)}
		</div>
	)
}

export default function Sidebar({
	agent: agentProp,
	onLogout,
	isCollapsed = false,
	onClose,
	organizations = [],
	onSelectOrganization,
	onCreateOrganization,
}: Props = {}) {
	const navigate = useNavigate()
	const { appId } = useAppContext()
	const [currentAgent, setCurrentAgent] = useState<Agent | null>(
		agentProp || null,
	)
	const [agentSettings, setAgentSettings] = useState<any>(null) // Store agent settings
	const [isHoverExpanded, setIsHoverExpanded] = useState(false)

	// Fetch agent settings on mount
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const res: any = await agentsManagement.settings.get()
				if (res.success) {
					setAgentSettings(res.settings)
				}
			} catch (e) {
				console.error('Failed to load agent settings for sidebar:', e)
			}
		}
		loadSettings()
	}, [])

	useEffect(() => {
		if (!agentProp) {
			const stored = localStorage.getItem('scalechat_user')
			if (stored) {
				try {
					const parsed = JSON.parse(stored) as any
					const candidate =
						parsed && typeof parsed.user === 'object' && parsed.user
							? parsed.user
							: parsed

					if (candidate && typeof candidate === 'object') {
						setCurrentAgent({
							id: String(candidate.id || ''),
							email: String(candidate.email || ''),
							name: String(candidate.name || candidate.email || 'User'),
							role: extractNormalizedRole(candidate),
						})
					}
				} catch {}
			}
		} else {
			setCurrentAgent({
				...agentProp,
				role: extractNormalizedRole(agentProp),
			})
		}
	}, [agentProp])

	const handleLogout = async () => {
		if (onLogout) {
			await onLogout()
			return
		}

		const token = localStorage.getItem('scalechat_token')

		if (token) {
			try {
				await fetch(`${API_BASE}/auth/logout`, {
					method: 'POST',
					headers: { Authorization: `Bearer ${token}` },
				})
			} catch {}
		}

		// Clear ALL localStorage items
		localStorage.clear()

		// Clear ALL cookies
		document.cookie.split(';').forEach((c) => {
			document.cookie = c
				.replace(/^ +/, '')
				.replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
		})

		navigate({ to: '/login' })
	}
	const location = useLocation()
	const allowedPrimaryPaths = getAllowedPrimaryPathsForRole(currentAgent?.role)
	const hasTopBar = true
	const shouldUseIconOnlyBrand = hasTopBar
	const isCompact = isCollapsed && !isHoverExpanded
	const railWidthClass = isCollapsed ? 'w-18' : 'w-64'
	const panelWidthClass = isCompact ? 'w-18' : 'w-64'
	// const [isCollapsed, setIsCollapsed] = useState(true) // Controlled by parent now
	// Grouped Menu Items
	const menuGroups = [
		{
			title: 'Global',
			items: [
				{
					icon: LayoutDashboard,
					label: 'Dashboard',
					path: '/dashboard',
				},
				{
					icon: InboxIcon,
					label: 'Inbox',
					path: '/chat',
				},
				{
					icon: LayoutTemplate,
					label: 'Templates',
					path: '/templates',
				},
				{
					icon: Send,
					label: 'Broadcast',
					path: '/broadcast',
				},
			],
		},
		{
			title: 'CRM',
				items: [
					{
						icon: Users,
						label: 'Customers',
						path: '/customers',
					},
				],
			},
		{
			title: 'Platforms',
			items: [
				{
					icon: MessageSquare,
					label: 'WhatsApp',
					path: '/channels/whatsapp',
				},
				{
					icon: Instagram,
					label: 'Instagram',
					path: '/channels/instagram',
				},
				{
					icon: TikTokIcon,
					label: 'TikTok',
					path: '/channels/tiktok',
				},
			],
		},
		{
			title: 'Configuration',
			items: [
				{ icon: Users, label: 'Team', path: '/team' },
				{
					icon: Zap,
					label: 'Automation',
					path: '/automation',
				},
				{ icon: Bot, label: 'AI Chatbot', path: '/ai' },
				{ icon: Zap, label: 'Flows', path: '/flows' },
				{
					icon: Settings,
					label: 'Settings',
					path: '/settings',
				},
			],
		},
		{
			title: 'Developers',
			items: [
				{
					icon: Code,
					label: 'API',
					path: '/developers',
				},
			],
		},
		{
			title: 'Support',
			items: [
				{
					icon: FileText,
					label: 'Documentation',
					path: 'https://docs.kirim.chat',
				},
				{
					icon: HelpCircle,
					label: 'Help & Support',
					path: '/help',
				},
			],
		},
	]

	return (
		<div
			className={`${railWidthClass} h-full shrink-0 relative`}
			style={{ overflow: 'visible' }}
		>
			<aside
				className={`absolute inset-y-0 left-0 flex h-full ${panelWidthClass} flex-col rounded-r-2xl border-r border-border bg-card text-card-foreground transition-[width,box-shadow,background-color,border-color,color] duration-300 lg:rounded-none ${isCollapsed && isHoverExpanded ? 'z-30 shadow-xl shadow-black/15 dark:shadow-black/40' : ''}`}
				style={{ overflow: 'visible' }}
				onMouseEnter={() => {
					if (isCollapsed) setIsHoverExpanded(true)
				}}
				onMouseLeave={() => setIsHoverExpanded(false)}
				onFocusCapture={() => {
					if (isCollapsed) setIsHoverExpanded(true)
				}}
				onBlurCapture={(event) => {
					if (
						!event.currentTarget.contains(event.relatedTarget as Node | null)
					) {
						setIsHoverExpanded(false)
					}
				}}
			>
				{/* Logo */}
				<div className="flex items-center justify-between border-b border-border p-4">
					{!isCompact && !shouldUseIconOnlyBrand ? (
						<>
							<div className="flex-1 min-w-0 px-2 lg:px-4">
								<span className="text-xl font-bold tracking-tight text-foreground">
									Scalebiz
								</span>
							</div>
							{/* Mobile Close Button */}
							<button
								type="button"
								onClick={onClose}
								className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
							>
								<X size={20} />
							</button>
						</>
					) : (
						<div
							className={`relative flex w-full items-center ${isCompact ? 'justify-center' : 'justify-start pl-2'}`}
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-orange-400 text-lg font-bold text-primary-foreground shadow-sm">
								S
							</div>
							<button
								type="button"
								onClick={onClose}
								className="absolute right-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
							>
								<X size={20} />
							</button>
						</div>
					)}
				</div>

				{/* Menu Items */}
				<nav
					className="flex-1 overflow-y-auto overflow-x-visible py-4"
					style={{ overflowX: 'visible' }}
				>
					{menuGroups.map((group) => {
						// Filter items based on agent settings
						const filteredItems = group.items.filter((item) => {
							if (
								allowedPrimaryPaths &&
								!allowedPrimaryPaths.includes(item.path)
							) {
								return false
							}
							if (item.label === 'Customers') {
								return agentSettings?.agent_can_access_customers ?? true
							}
							if (item.label === 'Broadcast') {
								return agentSettings?.agent_can_send_broadcast ?? true
							}
							return true
						})

						if (filteredItems.length === 0) return null

						return (
							<div
								key={group.title}
								className={`mb-2 ${isCompact ? 'mb-6' : ''}`}
							>
								{!isCompact && (
									<div className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										{group.title}
									</div>
								)}
								{filteredItems.map((item) => (
									<MenuItem
										key={item.path}
										item={item}
										isCollapsed={isCompact}
										currentPath={location.pathname}
									/>
								))}
							</div>
						)
					})}
				</nav>

				{/* Footer with Logout */}
				<div
					className={`border-t border-border ${isCompact ? 'flex flex-col gap-2 p-2' : 'space-y-3 p-4'}`}
				>
					<OrganizationSwitcher
						organizations={organizations}
						currentOrgSlug={appId}
						isCollapsed={isCompact}
						dropdownDirection={isCompact ? 'down' : 'up'}
						onSelectOrganization={
							onSelectOrganization || (() => Promise.resolve())
						}
						onCreateOrganization={onCreateOrganization || (() => {})}
					/>
					<button
						type="button"
						onClick={handleLogout}
						className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-red-600 transition-colors hover:bg-red-500/10 ${isCompact ? 'justify-center px-2' : ''}`}
						title="Logout"
					>
						<LogOut size={isCompact ? 16 : 18} strokeWidth={1.5} />
						{!isCompact && <span className="text-sm font-medium">Logout</span>}
					</button>
					{!isCompact && (
						<div className="mt-3 text-center text-xs text-muted-foreground">
							Powered by ScaleChat
						</div>
					)}
				</div>
			</aside>
		</div>
	)
}
