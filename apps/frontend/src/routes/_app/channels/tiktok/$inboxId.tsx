import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
	ChevronLeft,
	Music2,
	RefreshCw,
	Trash2,
	ShieldCheck,
	AlertTriangle,
	Bot,
	GitBranch,
	Users,
	ChevronDown,
	Check,
	X,
	Search,
} from 'lucide-react'
import {
	API_BASE,
	inboxes,
	chatbots,
	automationFlows,
	teams,
	agents,
} from '@/lib/api'

export const Route = createFileRoute('/_app/channels/tiktok/$inboxId')({
	component: TikTokChannelDetailPage,
})

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

function getStatusRequestHeaders(): HeadersInit {
	const token =
		typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_token')
			: null
	const orgSlug =
		typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_org_slug')
			: null
	const appId =
		typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_app_id')
			: null
	const appSecret =
		typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_app_secret') || 'scalesecret'
			: 'scalesecret'

	return {
		...(token && { Authorization: `Bearer ${token}` }),
		...(orgSlug && { 'X-Org-Slug': orgSlug }),
		...(appId && { 'X-App-Id': appId }),
		...(appSecret && { 'X-App-Secret': appSecret }),
	}
}

function asRecord(value: unknown): Record<string, any> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
	return value as Record<string, any>
}

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return []
	return Array.from(
		new Set(
			value
				.map((item) => (typeof item === 'string' ? item.trim() : ''))
				.filter((item) => item.length > 0),
		),
	)
}

function resolveScopeArray(primary: unknown, fallback: unknown): string[] {
	const first = asStringArray(primary)
	if (first.length > 0) return first
	return asStringArray(fallback)
}

function hasLikelyMessagingScope(scopes: string[]) {
	return scopes.some((scope) => {
		const normalized = scope.toLowerCase()
		if (/(message|messages|messaging|chat|dm)/i.test(normalized)) return true
		return /(^|[._:-])im([._:-]|$)/i.test(normalized)
	})
}

function formatDisplayDate(
	value: string | null | undefined,
	options?: Intl.DateTimeFormatOptions,
) {
	if (!value) return 'Not available'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return 'Not available'
	return date.toLocaleDateString(undefined, options)
}

function formatStatusLabel(status: string | null | undefined) {
	if (!status) return 'Unknown'
	if (status === 'connected') return 'Connected'
	return status
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase())
}

function getTokenRemainingLabel(value: string | null | undefined) {
	if (!value) return 'Not available'
	const expiresAt = new Date(value)
	if (Number.isNaN(expiresAt.getTime())) return 'Not available'

	const remainingMs = expiresAt.getTime() - Date.now()
	if (remainingMs <= 0) return 'Expired'

	const remainingDays = Math.floor(remainingMs / DAY_MS)
	if (remainingDays >= 1) return `${remainingDays} day(s)`

	const remainingHours = Math.max(1, Math.ceil(remainingMs / HOUR_MS))
	return `${remainingHours} hour(s)`
}

function mergeInboxWithStatus(inbox: any, status: Record<string, any> | null) {
	if (!inbox || !status) return inbox
	return {
		...inbox,
		channel_config: {
			...asRecord(inbox.channel_config),
			...status,
		},
	}
}

function unwrapInboxResponse(response: any) {
	if (
		response &&
		typeof response === 'object' &&
		'data' in response &&
		response.data &&
		typeof response.data === 'object'
	) {
		return response.data
	}
	return response
}

function getFallbackDisplayName(inbox: any) {
	if (typeof inbox?.name !== 'string') return null
	const prefix = 'TikTok:'
	return inbox.name.startsWith(prefix) ? inbox.name.slice(prefix.length).trim() : null
}

function getTikTokProfileDetails(inbox: any) {
	const channelConfig = asRecord(inbox?.channel_config)
	const displayName =
		channelConfig.display_name ||
		channelConfig.displayName ||
		getFallbackDisplayName(inbox) ||
		inbox?.name ||
		'TikTok Account'
	const openId = channelConfig.open_id || channelConfig.openId || null
	const unionId = channelConfig.union_id || channelConfig.unionId || null
	const tiktokId =
		channelConfig.tiktok_id ||
		channelConfig.tiktokId ||
		openId ||
		unionId ||
		null
	const avatarUrl = channelConfig.avatar_url || channelConfig.avatarUrl || null
	const connectedAt = channelConfig.connectedAt || inbox?.created_at || null
	const tokenExpiresAt =
		channelConfig.token_expires_at || channelConfig.tokenExpiresAt || null
	const connectionStatus =
		channelConfig.connectionStatus || (inbox?.is_active ? 'connected' : 'inactive')
	const daysUntilTokenExpiry =
		typeof channelConfig.daysUntilTokenExpiry === 'number'
			? channelConfig.daysUntilTokenExpiry
			: null
	const grantedScopes = resolveScopeArray(
		channelConfig.grantedScopes,
		channelConfig.granted_scopes,
	)
	const requestedScopes = resolveScopeArray(
		channelConfig.requestedScopes,
		channelConfig.requested_scopes,
	)
	const hasMessagingScope =
		typeof channelConfig.hasMessagingScope === 'boolean'
			? channelConfig.hasMessagingScope
			: typeof channelConfig.has_messaging_scope === 'boolean'
				? channelConfig.has_messaging_scope
				: hasLikelyMessagingScope(
						grantedScopes.length > 0 ? grantedScopes : requestedScopes,
					)
	const isMessagingReady =
		typeof channelConfig.isMessagingReady === 'boolean'
			? channelConfig.isMessagingReady
			: null
	const messagingReadiness =
		typeof channelConfig.messagingReadiness === 'string'
			? channelConfig.messagingReadiness
			: typeof channelConfig.messaging_readiness === 'string'
				? channelConfig.messaging_readiness
				: null
	const messagingReadinessMessage =
		typeof channelConfig.messagingReadinessMessage === 'string'
			? channelConfig.messagingReadinessMessage
			: typeof channelConfig.messaging_readiness_message === 'string'
				? channelConfig.messaging_readiness_message
				: null

	return {
		displayName,
		openId,
		unionId,
		tiktokId,
		avatarUrl,
		connectedAt,
		tokenExpiresAt,
		connectionStatus,
		daysUntilTokenExpiry,
		grantedScopes,
		requestedScopes,
		hasMessagingScope,
		isMessagingReady,
		messagingReadiness,
		messagingReadinessMessage,
		handle:
			typeof displayName === 'string' && displayName.trim().length > 0
				? `@${displayName}`
				: null,
	}
}

function TikTokChannelDetailPage() {
	const routeParams = Route.useParams({ strict: false }) as {
		inboxId: string
	}
	const { inboxId } = routeParams
	const navigate = useNavigate()
	const [inbox, setInbox] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	// Configuration State
	const [availableAIAgents, setAvailableAIAgents] = useState<any[]>([])
	const [availableFlows, setAvailableFlows] = useState<any[]>([])
	const [availableTeams, setAvailableTeams] = useState<any[]>([])
	const [availableAgents, setAvailableAgents] = useState<any[]>([])
	const [selectedAIAgent, setSelectedAIAgent] = useState<string | null>(null)
	const [selectedFlow, setSelectedFlow] = useState<string | null>(null)
	const [selectedTeams, setSelectedTeams] = useState<string[]>([])
	const [selectedAgents, setSelectedAgents] = useState<string[]>([])
	const [distributionMethod, setDistributionMethod] = useState<
		'round_robin' | 'least_assigned'
	>('round_robin')

	// UI State for dropdowns
	const [showAIAgentDropdown, setShowAIAgentDropdown] = useState(false)
	const [showFlowDropdown, setShowFlowDropdown] = useState(false)
	const [showTeamsDropdown, setShowTeamsDropdown] = useState(false)
	const [showAgentsDropdown, setShowAgentsDropdown] = useState(false)
	const [showDistributionDropdown, setShowDistributionDropdown] =
		useState(false)
	const [agentSearchQuery, setAgentSearchQuery] = useState('')
	const agentDropdownRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		void loadInbox()
	}, [inboxId])

	// Close agent dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				agentDropdownRef.current &&
				!agentDropdownRef.current.contains(event.target as Node)
			) {
				setShowAgentsDropdown(false)
				setAgentSearchQuery('')
			}
		}
		if (showAgentsDropdown) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [showAgentsDropdown])

	const loadStatus = async () => {
		const res = await fetch(`${API_BASE}/tiktok-channels/${inboxId}/status`, {
			headers: getStatusRequestHeaders(),
		})

		if (!res.ok) {
			throw new Error(`Failed to fetch status (${res.status})`)
		}

		const data = await res.json()
		return data?.data || null
	}

	const loadInbox = async () => {
		try {
			setError(null)
			const response: any = await inboxes.get(inboxId)
			const resolvedInbox = unwrapInboxResponse(response)
			const status = await loadStatus().catch((statusError) => {
				console.error('Failed to hydrate TikTok status:', statusError)
				return null
			})
			setInbox(mergeInboxWithStatus(resolvedInbox, status))
		} catch (err: any) {
			console.error('Failed to load TikTok inbox:', err)
			setError(err.message || 'Failed to load inbox')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const loadOptions = async () => {
			try {
				const [botsRes, flowsRes, teamsRes, agentsRes] = await Promise.all([
					chatbots.list().catch(() => ({ data: [] })),
					automationFlows.list().catch(() => ({ payload: [] })),
					teams.list().catch(() => ({ payload: [] })),
					agents.list().catch(() => ({ data: [] })),
				])
				setAvailableAIAgents(botsRes.data || [])
				setAvailableFlows(flowsRes.payload || [])
				setAvailableTeams(teamsRes.payload || [])
				setAvailableAgents(agentsRes.data || [])
			} catch (loadOptionsError) {
				console.error('Failed to load TikTok channel options:', loadOptionsError)
			}
		}
		void loadOptions()
	}, [])

	useEffect(() => {
		const channelConfig = asRecord(inbox?.channel_config)
		setSelectedAIAgent(channelConfig.default_chatbot_id || null)
		setSelectedFlow(channelConfig.default_flow_id || null)
		setSelectedTeams(
			Array.isArray(channelConfig.default_team_ids)
				? channelConfig.default_team_ids
				: [],
		)
		setSelectedAgents(
			Array.isArray(channelConfig.default_agent_ids)
				? channelConfig.default_agent_ids
				: [],
		)
		setDistributionMethod(
			channelConfig.distribution_method === 'least_assigned'
				? 'least_assigned'
				: 'round_robin',
		)
	}, [inbox])

	const handleSaveSettings = async () => {
		setIsSaving(true)
		try {
			const currentConfig = asRecord(inbox?.channel_config)
			const newConfig = {
				...currentConfig,
				default_chatbot_id: selectedAIAgent,
				default_flow_id: selectedFlow,
				default_team_ids: selectedTeams,
				default_agent_ids: selectedAgents,
				distribution_method: distributionMethod,
			}

			await inboxes.update(inboxId, {
				channel_config: newConfig,
			})

			setInbox((prev: any) => ({
				...prev,
				channel_config: newConfig,
			}))
			alert('Settings saved successfully')
		} catch (saveError) {
			console.error('Failed to save TikTok channel settings:', saveError)
			alert('Failed to save settings')
		} finally {
			setIsSaving(false)
		}
	}

	const handleRefresh = async () => {
		setRefreshing(true)
		try {
			const status = await loadStatus()
			if (status) {
				setInbox((prev: any) => mergeInboxWithStatus(prev, status))
			}
		} catch (refreshError) {
			console.error('Failed to refresh TikTok status:', refreshError)
		} finally {
			setTimeout(() => setRefreshing(false), 500)
		}
	}

	const handleDisconnect = async () => {
		if (!confirm('Are you sure you want to disconnect this TikTok account?')) return
		setIsDeleting(true)
		try {
			await inboxes.delete(inboxId)
			navigate({ to: '/channels/tiktok' })
		} catch (disconnectError) {
			console.error('Failed to disconnect TikTok inbox:', disconnectError)
			alert('Failed to disconnect account')
			setIsDeleting(false)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-center p-8">
				<div className="bg-red-50 text-red-600 p-3 rounded-full mb-4">
					<ShieldCheck size={24} />
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					Failed to load inbox
				</h3>
				<p className="text-gray-500 max-w-sm mb-6">{error}</p>
				<button
					onClick={() => window.location.reload()}
					className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
				>
					Retry
				</button>
			</div>
		)
	}

	if (!inbox) {
		return <div className="p-8 text-center text-gray-500">Inbox not found</div>
	}

	const profile = getTikTokProfileDetails(inbox)
	const profileFacts = [
		{
			label: 'Display Name',
			value: profile.handle || 'Not available',
			mono: false,
		},
		{
			label: 'TikTok ID',
			value: profile.tiktokId || 'Not available',
			mono: true,
		},
		{
			label: 'Open ID',
			value: profile.openId || 'Not available',
			mono: true,
		},
		{
			label: 'Union ID',
			value: profile.unionId || 'Not available',
			mono: true,
		},
		{
			label: 'Inbox Label',
			value: inbox.name || 'Not available',
			mono: false,
		},
		{
			label: 'Connected Since',
			value: formatDisplayDate(profile.connectedAt, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			}),
			mono: false,
		},
		{
			label: 'Token Expires',
			value: formatDisplayDate(profile.tokenExpiresAt, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			}),
			mono: false,
		},
		{
			label: 'Token Remaining',
			value: getTokenRemainingLabel(profile.tokenExpiresAt),
			mono: false,
		},
		{
			label: 'Granted Scopes',
			value:
				profile.grantedScopes.length > 0
					? profile.grantedScopes.join(', ')
					: 'Not available',
			mono: false,
		},
		{
			label: 'Requested Scopes',
			value:
				profile.requestedScopes.length > 0
					? profile.requestedScopes.join(', ')
					: 'Not available',
			mono: false,
		},
	]

	return (
		<div className="flex-1 flex flex-col h-full bg-gray-50/50 overflow-hidden">
			<div className="bg-white border-b border-gray-200 px-6 py-4">
				<div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
					<Link
						to="/channels/tiktok"
						className="hover:text-gray-900 flex items-center gap-1 transition-colors"
					>
						<ChevronLeft size={16} />
						Back to TikTok
					</Link>
				</div>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
							<Music2 className="text-black" size={24} />
							TikTok Direct Messages
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							Detail akun TikTok yang terhubung ke inbox
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handleRefresh}
							disabled={refreshing}
							className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70"
						>
							<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
							{refreshing ? 'Syncing...' : 'Refresh'}
						</button>
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-6 pt-3 max-w-5xl mx-auto w-full space-y-6">
					<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
					<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
								{profile.avatarUrl ? (
									<img
										src={profile.avatarUrl}
										alt={profile.handle || inbox.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<Music2 className="text-black" size={32} />
								)}
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-xl font-bold text-gray-900">
										{profile.handle || inbox.name}
									</h2>
									<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
										<ShieldCheck size={12} />
										{formatStatusLabel(profile.connectionStatus)}
									</span>
									{profile.daysUntilTokenExpiry != null &&
									profile.daysUntilTokenExpiry < 7 ? (
										<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
											<AlertTriangle size={12} />
											Token expiring soon
										</span>
									) : null}
									{profile.isMessagingReady === false ? (
										<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
											<AlertTriangle size={12} />
											Messaging not ready
										</span>
									) : null}
								</div>
								<p className="text-gray-500 text-sm">TikTok Business Account</p>
							</div>
						</div>

						<button
							onClick={handleDisconnect}
							disabled={isDeleting}
							className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-70"
						>
							<Trash2 size={16} />
							{isDeleting ? 'Disconnecting...' : 'Disconnect'}
						</button>
					</div>

						<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
							{profileFacts.map((fact) => (
							<div
								key={fact.label}
								className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3"
							>
								<div className="text-xs font-medium uppercase tracking-wide text-gray-500">
									{fact.label}
								</div>
								<div
									className={`mt-1 text-sm text-gray-900 break-all ${
										fact.mono ? 'font-mono' : 'font-medium'
									}`}
								>
									{fact.value}
								</div>
							</div>
							))}
						</div>

						{profile.isMessagingReady === false ? (
							<div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
								<div className="font-medium">
									TikTok messaging belum siap untuk inbox DM.
								</div>
								<div className="mt-1">
									{profile.messagingReadinessMessage ||
										'Scope messaging belum terdeteksi. Pastikan produk TikTok Messaging sudah approved dan reconnect channel.'}
								</div>
								{profile.hasMessagingScope === false ? (
									<div className="mt-1">
										Token saat ini belum menunjukkan scope messaging.
									</div>
								) : null}
								{profile.messagingReadiness ? (
									<div className="mt-1 text-xs uppercase tracking-wide text-amber-700/80">
										Code: {profile.messagingReadiness}
									</div>
								) : null}
							</div>
						) : null}
					</div>

					<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
						<div className="p-6 border-b border-gray-200 flex justify-between items-center">
							<div>
								<h2 className="text-lg font-semibold text-gray-900">
									Channel Configuration
								</h2>
								<p className="text-sm text-gray-500">
									Configure AI agent, flow, and routing defaults
								</p>
							</div>
							<button
								onClick={handleSaveSettings}
								disabled={isSaving}
								className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium"
							>
								{isSaving ? 'Saving...' : 'Save Settings'}
							</button>
						</div>

						<div className="p-6 space-y-6">
							<div className="relative">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									AI Agent
								</label>
								<div
									className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer bg-white"
									onClick={() => setShowAIAgentDropdown(!showAIAgentDropdown)}
								>
									<div className="flex items-center gap-2">
										<Bot className="w-4 h-4 text-blue-500" />
										<span
											className={
												selectedAIAgent ? 'text-gray-900' : 'text-gray-400'
											}
										>
											{selectedAIAgent
												? availableAIAgents.find((b) => b.id === selectedAIAgent)
														?.name || 'Unknown Bot'
												: 'Select AI Agent'}
										</span>
									</div>
									<ChevronDown className="w-4 h-4 text-gray-500" />
								</div>
								{showAIAgentDropdown && (
									<div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
										<div
											className="p-2 hover:bg-gray-50 cursor-pointer text-gray-500 italic text-sm"
											onClick={() => {
												setSelectedAIAgent(null)
												setShowAIAgentDropdown(false)
											}}
										>
											None
										</div>
										{availableAIAgents.map((bot) => (
											<div
												key={bot.id}
												className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
												onClick={() => {
													setSelectedAIAgent(bot.id)
													setShowAIAgentDropdown(false)
												}}
											>
												<span className="text-sm">{bot.name}</span>
												{selectedAIAgent === bot.id && (
													<Check className="w-4 h-4 text-emerald-500 ml-auto" />
												)}
											</div>
										))}
									</div>
								)}
							</div>

							<div className="relative">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Flow
								</label>
								<div
									className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer bg-white"
									onClick={() => setShowFlowDropdown(!showFlowDropdown)}
								>
									<div className="flex items-center gap-2">
										<GitBranch className="w-4 h-4 text-indigo-500" />
										<span
											className={
												selectedFlow ? 'text-gray-900' : 'text-gray-400'
											}
										>
											{selectedFlow
												? availableFlows.find((f) => f.id === selectedFlow)
														?.name || 'Unknown Flow'
												: 'Select Flow'}
										</span>
									</div>
									<ChevronDown className="w-4 h-4 text-gray-500" />
								</div>
								{showFlowDropdown && (
									<div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
										<div
											className="p-2 hover:bg-gray-50 cursor-pointer text-gray-500 italic text-sm"
											onClick={() => {
												setSelectedFlow(null)
												setShowFlowDropdown(false)
											}}
										>
											None
										</div>
										{availableFlows.map((flow) => (
											<div
												key={flow.id}
												className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
												onClick={() => {
													setSelectedFlow(flow.id)
													setShowFlowDropdown(false)
												}}
											>
												<span className="text-sm">{flow.name}</span>
												{flow.active === true && (
													<span className="ml-1 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
														Active
													</span>
												)}
												{selectedFlow === flow.id && (
													<Check className="w-4 h-4 text-emerald-500 ml-auto" />
												)}
											</div>
										))}
										{availableFlows.length === 0 && (
											<div className="p-2 text-gray-400 text-sm italic">
												No flows available
											</div>
										)}
									</div>
								)}
							</div>

							<div className="relative">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Teams
								</label>
								<div
									className="w-full px-3 py-2 border border-gray-300 rounded-lg flex flex-wrap items-center gap-2 cursor-pointer bg-white min-h-[42px]"
									onClick={() => setShowTeamsDropdown(!showTeamsDropdown)}
								>
									{selectedTeams.length > 0 ? (
										selectedTeams.map((teamId) => {
											const team = availableTeams.find((t) => t.id === teamId)
											return (
												<span
													key={teamId}
													className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
												>
													<Users className="w-3 h-3" />
													{team?.name || 'Unknown'}
													<X
														className="w-3 h-3 hover:text-red-500 cursor-pointer"
														onClick={(e) => {
															e.stopPropagation()
															setSelectedTeams((prev) =>
																prev.filter((id) => id !== teamId),
															)
														}}
													/>
												</span>
											)
										})
									) : (
										<span className="text-gray-400 text-sm">Select Teams</span>
									)}
									<ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
								</div>
								{showTeamsDropdown && (
									<div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
										{availableTeams.map((team) => {
											const isSelected = selectedTeams.includes(team.id)
											return (
												<div
													key={team.id}
													className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
													onClick={() => {
														if (isSelected) {
															setSelectedTeams((prev) =>
																prev.filter((id) => id !== team.id),
															)
														} else {
															setSelectedTeams((prev) => [...prev, team.id])
														}
													}}
												>
													<Users className="w-4 h-4 text-blue-500" />
													<span className="text-sm">{team.name}</span>
													{isSelected && (
														<Check className="w-4 h-4 text-emerald-500 ml-auto" />
													)}
												</div>
											)
										})}
										{availableTeams.length === 0 && (
											<div className="p-2 text-gray-400 text-sm italic">
												No teams available
											</div>
										)}
									</div>
								)}
							</div>

							<div className="relative" ref={agentDropdownRef}>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Human Agent
								</label>
								<div
									className="w-full px-3 py-2 border border-gray-300 rounded-lg flex flex-wrap items-center gap-2 cursor-pointer bg-white min-h-[42px]"
									onClick={() => {
										setShowAgentsDropdown(!showAgentsDropdown)
										setAgentSearchQuery('')
									}}
								>
									{selectedAgents.length > 0 ? (
										selectedAgents.map((agentId) => {
											const agent = availableAgents.find((a) => a.id === agentId)
											return (
												<span
													key={agentId}
													className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
												>
													<div className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center text-[9px] font-bold">
														{(agent?.name || 'A')[0]}
													</div>
													{agent?.name || 'Unknown'}
													<X
														className="w-3 h-3 hover:text-red-500 cursor-pointer"
														onClick={(e) => {
															e.stopPropagation()
															setSelectedAgents((prev) =>
																prev.filter((id) => id !== agentId),
															)
														}}
													/>
												</span>
											)
										})
									) : (
										<span className="text-gray-400 text-sm">Select Agents</span>
									)}
									<ChevronDown
										className={`w-4 h-4 text-gray-500 ml-auto transition-transform ${showAgentsDropdown ? 'rotate-180' : ''}`}
									/>
								</div>
								{showAgentsDropdown && (
									<div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
										<div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
											<div className="relative">
												<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
												<input
													type="text"
													placeholder="Search agents..."
													value={agentSearchQuery}
													onChange={(e) => setAgentSearchQuery(e.target.value)}
													onClick={(e) => e.stopPropagation()}
													className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
													autoFocus
												/>
											</div>
										</div>

										<div className="max-h-48 overflow-y-auto">
											{availableAgents
												.filter(
													(agent) =>
														agent.name
															?.toLowerCase()
															.includes(agentSearchQuery.toLowerCase()) ||
														agent.email
															?.toLowerCase()
															.includes(agentSearchQuery.toLowerCase()),
												)
												.map((agent) => {
													const isSelected = selectedAgents.includes(agent.id)
													return (
														<div
															key={agent.id}
															className={`flex items-center gap-2 p-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-pink-50' : ''}`}
															onClick={(e) => {
																e.stopPropagation()
																if (isSelected) {
																	setSelectedAgents((prev) =>
																		prev.filter((id) => id !== agent.id),
																	)
																} else {
																	setSelectedAgents((prev) => [...prev, agent.id])
																}
															}}
														>
															<div
																className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${isSelected ? 'bg-pink-200 text-pink-700' : 'bg-gray-100 text-gray-600'}`}
															>
																{(agent.name || 'A')[0]}
															</div>
															<div className="flex-1 min-w-0">
																<span className="text-sm font-medium block truncate">
																	{agent.name}
																</span>
																<span className="text-xs text-gray-400 block truncate">
																	{agent.email}
																</span>
															</div>
															{isSelected && (
																<Check className="w-4 h-4 text-pink-500 flex-shrink-0" />
															)}
														</div>
													)
												})}
											{availableAgents.filter(
												(agent) =>
													agent.name
														?.toLowerCase()
														.includes(agentSearchQuery.toLowerCase()) ||
													agent.email
														?.toLowerCase()
														.includes(agentSearchQuery.toLowerCase()),
											).length === 0 && (
												<div className="p-3 text-center text-gray-400 text-sm">
													{agentSearchQuery
														? 'No agents found'
														: 'No agents available'}
												</div>
											)}
										</div>
									</div>
								)}
							</div>

							<div className="relative">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Chat Distribution Method
								</label>
								<div
									className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer bg-white"
									onClick={() =>
										setShowDistributionDropdown(!showDistributionDropdown)
									}
								>
									<span className="text-gray-900 font-medium">
										{distributionMethod === 'least_assigned'
											? 'Least Assigned First'
											: 'Round Robin'}
									</span>
									<ChevronDown className="w-4 h-4 text-gray-500" />
								</div>
								{showDistributionDropdown && (
									<div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
										<div
											className="flex justify-between items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
											onClick={() => {
												setDistributionMethod('least_assigned')
												setShowDistributionDropdown(false)
											}}
										>
											<div>
												<p className="text-sm font-bold mb-0">
													Least Assigned First
												</p>
												<p className="text-xs text-gray-500">
													Route to the agent with the fewest assigned chats
												</p>
											</div>
											{distributionMethod === 'least_assigned' && (
												<Check className="w-4 h-4 text-blue-500 mr-2" />
											)}
										</div>
										<div
											className="flex justify-between items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer border-t border-gray-100"
											onClick={() => {
												setDistributionMethod('round_robin')
												setShowDistributionDropdown(false)
											}}
										>
											<div>
												<p className="text-sm font-bold mb-0">Round Robin</p>
												<p className="text-xs text-gray-500">
													Distribute chats evenly to all assigned agents
												</p>
											</div>
											{distributionMethod === 'round_robin' && (
												<Check className="w-4 h-4 text-blue-500 mr-2" />
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
