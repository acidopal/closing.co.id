import {
	Search,
	Check,
	LogOut,
	User as UserIcon,
	Palette,
	Clock,
	ChevronDown,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createPortal } from 'react-dom'
import CommandPalette from './CommandPalette'
import ThemeToggle from './ThemeToggle'
import { useAppContext } from '@/routes/_app'
import { API_BASE } from '@/lib/api'
import { agentsManagement } from '@/lib/agents-api'

type TopBarUser = {
	id?: string
	name?: string | null
	email?: string | null
	role?: string | null
	avatar_url?: string | null
	user?: TopBarUser
}

function readStoredTopBarUser(): TopBarUser | null {
	if (typeof localStorage === 'undefined') return null

	const raw = localStorage.getItem('scalechat_user')
	if (!raw) return null

	try {
		const parsed = JSON.parse(raw) as TopBarUser
		if (parsed && typeof parsed === 'object') {
			if (parsed.user && typeof parsed.user === 'object') {
				return parsed.user
			}
			return parsed
		}
	} catch (e) {
		console.error('Failed to parse scalechat_user for TopBar', e)
	}

	return null
}

export default function TopBar() {
	const [isPaletteOpen, setIsPaletteOpen] = useState(false)
	const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
	const [showUserMenu, setShowUserMenu] = useState(false)
	const [availability, setAvailability] = useState<
		'online' | 'busy' | 'offline'
	>('online')
	const [markOfflineAuto, setMarkOfflineAuto] = useState(true)
	const [agentSettings, setAgentSettings] = useState<any>(null) // Store agent settings
	const userMenuRef = useRef<HTMLDivElement>(null)
	const profileButtonRef = useRef<HTMLButtonElement>(null)

	// Fetch agent settings on mount
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const res: any = await agentsManagement.settings.get()
				if (res.success) {
					setAgentSettings(res.settings)
				}
			} catch (e) {
				console.error('Failed to load agent settings for TopBar:', e)
			}
		}
		loadSettings()
	}, [])

	const navigate = useNavigate()
	const { agent } = useAppContext()
	const [displayAgent, setDisplayAgent] = useState<TopBarUser | null>(
		agent || null,
	)
	const [currentLang, setCurrentLang] = useState<'en' | 'id'>(() => {
		if (typeof localStorage === 'undefined') return 'en'
		const stored = localStorage.getItem('scalechat_lang')
		return stored === 'id' ? 'id' : 'en'
	})

	useEffect(() => {
		if (agent) {
			setDisplayAgent(agent)
			return
		}

		const storedUser = readStoredTopBarUser()
		if (storedUser) {
			setDisplayAgent(storedUser)
		}
	}, [agent])

	const handleLanguageChange = (newLang: string) => {
		setIsLangMenuOpen(false)
		if (newLang !== 'en' && newLang !== 'id') return
		setCurrentLang(newLang)
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('scalechat_lang', newLang)
		}
	}

	// Keyboard shortcut handler
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault()
				setIsPaletteOpen((prev) => !prev)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [])

	const handleLogout = async () => {
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

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				userMenuRef.current &&
				!userMenuRef.current.contains(event.target as Node) &&
				profileButtonRef.current &&
				!profileButtonRef.current.contains(event.target as Node)
			) {
				setShowUserMenu(false)
			}
		}

		if (showUserMenu) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [showUserMenu])

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	}

	const displayName =
		String(displayAgent?.name || '').trim() ||
		String(displayAgent?.email || '')
			.split('@')[0]
			.trim() ||
		'User'

	return (
		<>
			<div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-md transition-colors duration-300">
				<div className="flex items-center gap-4 flex-1">
					{/* Search Trigger */}
					<button
						onClick={() => setIsPaletteOpen(true)}
						className="group hidden w-64 items-center gap-3 rounded-lg border border-border bg-muted/70 px-3 py-2 text-sm text-muted-foreground transition-all hover:border-border hover:bg-background sm:flex"
					>
						<Search size={16} />
						<span className="flex-1 text-left">Search...</span>
						<div className="flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-muted-foreground/80 transition-colors group-hover:bg-muted">
							<span className="text-[10px]">⌘</span>
							<span>K</span>
						</div>
					</button>

					{/* Mobile Search Trigger */}
					<button
						onClick={() => setIsPaletteOpen(true)}
						className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
					>
						<Search size={20} />
					</button>
				</div>

				{/* Right Side: Actions */}
				<div className="flex items-center gap-2">
					<ThemeToggle />

					{/* Language Placeholder */}
					{/* Language Switcher */}
					<div className="relative">
						<button
							onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
							className="flex items-center gap-1 rounded-full border border-transparent p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<img
								src={
									currentLang === 'id'
										? 'https://flagcdn.com/w40/id.png'
										: 'https://flagcdn.com/w40/us.png'
								}
								alt={currentLang}
								className="w-5 h-5 rounded-full object-cover"
							/>
						</button>

						{isLangMenuOpen && (
							<>
								<div
									className="fixed inset-0 z-10"
									onClick={() => setIsLangMenuOpen(false)}
								/>
								<div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl animate-in fade-in zoom-in-95 duration-200">
									<button
										onClick={() => handleLanguageChange('en')}
										className={`flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
											currentLang === 'en'
												? 'bg-primary/12 text-primary'
												: 'text-foreground/80 hover:bg-muted'
										}`}
									>
										<div className="flex items-center gap-3">
											<img
												src="https://flagcdn.com/w40/us.png"
												alt="English"
												className="w-5 h-5 rounded-full object-cover shadow-sm"
											/>
											<span className="font-medium">English</span>
										</div>
										{currentLang === 'en' && <Check className="w-4 h-4" />}
									</button>
									<button
										onClick={() => handleLanguageChange('id')}
										className={`flex w-full items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
											currentLang === 'id'
												? 'bg-primary/12 text-primary'
												: 'text-foreground/80 hover:bg-muted'
										}`}
									>
										<div className="flex items-center gap-3">
											<img
												src="https://flagcdn.com/w40/id.png"
												alt="Indonesia"
												className="w-5 h-5 rounded-full object-cover shadow-sm"
											/>
											<span className="font-medium">Bahasa Indonesia</span>
										</div>
										{currentLang === 'id' && <Check className="w-4 h-4" />}
									</button>
								</div>
							</>
						)}
					</div>

					<div className="mx-2 h-6 w-px bg-border" />

					{/* User Avatar */}
					<div className="relative">
						<button
							ref={profileButtonRef}
							onClick={() => setShowUserMenu(!showUserMenu)}
							className="flex items-center gap-2 rounded-full border border-transparent p-1 pr-3 transition-all hover:border-border hover:bg-muted"
						>
							<div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-medium shadow-sm">
								{getInitials(displayName)}
							</div>
							<div className="hidden text-sm font-medium text-foreground sm:block">
								{displayName}
							</div>
							<ChevronDown
								size={14}
								className="hidden text-muted-foreground sm:block"
							/>
						</button>

						{showUserMenu &&
							createPortal(
								<div
									ref={userMenuRef}
									className="fixed z-[9999] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200"
									style={{
										width: '280px',
										top: profileButtonRef.current?.getBoundingClientRect()
											.bottom
											? profileButtonRef.current.getBoundingClientRect()
													.bottom + 8
											: 64,
										right: 16,
									}}
								>
									{/* Availability Section */}
									{!agentSettings?.hide_agent_status_toggle && (
										<div className="border-b border-border bg-muted/40 p-4">
											<div className="flex items-center justify-between mb-4">
												<h3 className="text-sm font-semibold text-foreground">
													Availability
												</h3>
												<select
													value={availability}
													onChange={(e) =>
														setAvailability(e.target.value as any)
													}
													className="cursor-pointer rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/20"
												>
													<option value="online">🟢 Online</option>
													<option value="busy">🟡 Busy</option>
													<option value="offline">⚫ Offline</option>
												</select>
											</div>

											<div className="flex items-center justify-between">
												<label className="flex items-center gap-2 text-xs text-foreground/80">
													<Clock size={14} />
													Auto-offline
												</label>
													<button
														onClick={() => setMarkOfflineAuto(!markOfflineAuto)}
														className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
															markOfflineAuto
																? 'bg-primary'
																: 'bg-border'
														}`}
													>
														<span
															className={`inline-block h-3 w-3 transform rounded-full bg-background transition-transform ${
																markOfflineAuto
																	? 'translate-x-5'
																	: 'translate-x-1'
															}`}
														/>
												</button>
											</div>
										</div>
									)}

									{/* Menu Items */}
									<div className="py-1">
										<button className="w-full text-left text-sm flex items-center gap-3 px-4 py-2.5 text-foreground/80 transition-colors hover:bg-muted">
											<UserIcon size={16} />
											Profile settings
										</button>
										<button className="w-full text-left text-sm flex items-center gap-3 px-4 py-2.5 text-foreground/80 transition-colors hover:bg-muted">
											<Palette size={16} />
											Appearance
										</button>
									</div>

									{/* Logout */}
									<div className="border-t border-border p-1">
										<button
												onClick={async () => {
													setShowUserMenu(false)
													await handleLogout()
												}}
												className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium flex items-center gap-3 text-red-600 dark:text-red-400 transition-colors hover:bg-red-500/10 dark:hover:bg-red-500/15"
											>
											<LogOut size={16} />
											Log out
										</button>
									</div>
								</div>,
								document.body,
							)}
					</div>
				</div>
			</div>

			{/* Command Palette Modal */}
			<CommandPalette
				isOpen={isPaletteOpen}
				onClose={() => setIsPaletteOpen(false)}
			/>
		</>
	)
}
