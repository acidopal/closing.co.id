import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
	ChevronLeft,
	Instagram,
	RefreshCw,
	Trash2,
	ExternalLink,
	MessageSquare,
	Inbox,
	Info,
	ShieldCheck,
	Bot,
	GitBranch,
	Users,
	ChevronDown,
	Check,
	X,
	Search,
} from 'lucide-react'
import {
	inboxes,
	API_BASE,
	teams,
	chatbots,
	agents,
	automationFlows,
} from '@/lib/api'

export const Route = createFileRoute(
	'/_app/channels/instagram/$inboxId',
)({
	component: InstagramChannelDetailPage,
})

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

function getChannelConfig(inbox: any): Record<string, any> {
	if (
		!inbox?.channel_config ||
		typeof inbox.channel_config !== 'object' ||
		Array.isArray(inbox.channel_config)
	) {
		return {}
	}

	return inbox.channel_config
}

function getFallbackUsername(inbox: any) {
	if (typeof inbox?.name !== 'string') return null

	const match = inbox.name.match(/@([A-Za-z0-9._]+)/)
	return match?.[1] || null
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

function mergeInboxWithStatus(inbox: any, status: Record<string, any> | null) {
	if (!inbox || !status) return inbox

	return {
		...inbox,
		channel_config: {
			...getChannelConfig(inbox),
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

function getInstagramProfileDetails(inbox: any) {
	const channelConfig = getChannelConfig(inbox)
	const username = channelConfig.username || getFallbackUsername(inbox)
	const profilePictureUrl =
		channelConfig.profile_picture_url || channelConfig.profilePicUrl || null
	const instagramId = channelConfig.instagram_id || channelConfig.igId || null
	const facebookPageId =
		channelConfig.fb_page_id ||
		channelConfig.page_id ||
		channelConfig.pageId ||
		null
	const connectedAt = channelConfig.connectedAt || inbox?.created_at || null
	const tokenExpiresAt =
		channelConfig.token_expires_at || channelConfig.tokenExpiresAt || null
	const connectionStatus =
		channelConfig.connectionStatus || (inbox?.is_active ? 'connected' : 'inactive')

	return {
		username,
		handle: username ? `@${username}` : null,
		profilePictureUrl,
		instagramId,
		facebookPageId,
		connectedAt,
		tokenExpiresAt,
		connectionStatus,
		profileUrl: username ? `https://www.instagram.com/${username}/` : null,
	}
}

function InstagramChannelDetailPage() {
	const routeParams = Route.useParams({ strict: false }) as {
		inboxId: string
	}
	const { inboxId } = routeParams
	const navigate = useNavigate()
	const [inbox, setInbox] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [isDeleting, setIsDeleting] = useState(false)
	const [deleteConfirmText, setDeleteConfirmText] = useState('')
	const [confirming, setConfirming] = useState(false)
	const [refreshing, setRefreshing] = useState(false)
	const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft')
	const [error, setError] = useState<string | null>(null)

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
	const [isSaving, setIsSaving] = useState(false)
	const [agentSearchQuery, setAgentSearchQuery] = useState('')
	const agentDropdownRef = useRef<HTMLDivElement>(null)

	// Close dropdown when clicking outside
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

	useEffect(() => {
		void loadInbox()
	}, [inboxId])

	const loadStatus = async () => {
		const res = await fetch(`${API_BASE}/instagram-channels/${inboxId}/status`, {
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
				console.error('Failed to hydrate Instagram status:', statusError)
				return null
			})
			setInbox(mergeInboxWithStatus(resolvedInbox, status))
		} catch (err: any) {
			console.error('Failed to load inbox:', err)
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
				} catch (err) {
					console.error('Failed to load options', err)
			}
		}
		loadOptions()
	}, [])

	useEffect(() => {
		if (inbox && inbox.channel_config) {
			setSelectedAIAgent(inbox.channel_config.default_chatbot_id || null)
			setSelectedFlow(inbox.channel_config.default_flow_id || null)
			setSelectedTeams(inbox.channel_config.default_team_ids || [])
			setSelectedAgents(inbox.channel_config.default_agent_ids || [])
			setDistributionMethod(
				inbox.channel_config.distribution_method || 'round_robin',
			)
		}
	}, [inbox])

	const handleSaveSettings = async () => {
		setIsSaving(true)
		try {
			// We need to merge existing config with new settings
			const currentConfig = inbox.channel_config || {}
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
		} catch (err) {
			console.error('Failed to save settings:', err)
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
		} catch (error) {
			console.error('Failed to refresh status:', error)
		} finally {
			setTimeout(() => setRefreshing(false), 500) // Min delay for UI feeling
		}
	}

	// Just show modal
	const handleDisconnect = async () => {
		setIsDeleting(true)
		setDeleteConfirmText('')
		setDeleteType('soft') // Reset to default
	}

	// Actual deletion logic
	const confirmDisconnect = async () => {
		// For hard delete, require DELETE confirmation
		if (deleteType === 'hard' && deleteConfirmText !== 'DELETE') return

		setConfirming(true)
		try {
			// TODO: For soft delete, we could call a different endpoint that preserves customer data
			// For now, both options delete the inbox (soft delete backend not implemented yet)
			await inboxes.delete(inboxId)
			navigate({
				to: '/channels/instagram',
			})
		} catch (error) {
			console.error('Failed to delete inbox:', error)
			alert('Failed to disconnect account')
			setConfirming(false)
		}
	}

	// Check if disconnect button should be enabled
	const canDisconnect =
		deleteType === 'soft' ||
		(deleteType === 'hard' && deleteConfirmText === 'DELETE')

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

	const instagramProfile = getInstagramProfileDetails(inbox)
	const connectionStatusLabel =
		instagramProfile.connectionStatus === 'connected'
			? 'Connected'
			: instagramProfile.connectionStatus
				? instagramProfile.connectionStatus
						.replace(/_/g, ' ')
						.replace(/\b\w/g, (char) => char.toUpperCase())
				: 'Unknown'
	const profileFacts = [
		{
			label: 'Username',
			value: instagramProfile.handle || 'Not available',
			mono: false,
		},
		{
			label: 'Instagram User ID',
			value: instagramProfile.instagramId || 'Not available',
			mono: true,
		},
		{
			label: 'Linked Facebook Page',
			value: instagramProfile.facebookPageId || 'Not linked',
			mono: true,
		},
		{
			label: 'Inbox Label',
			value: inbox.name || 'Not available',
			mono: false,
		},
		{
			label: 'Connected Since',
			value: formatDisplayDate(instagramProfile.connectedAt, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			}),
			mono: false,
		},
		{
			label: 'Token Expires',
			value: formatDisplayDate(instagramProfile.tokenExpiresAt, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			}),
			mono: false,
		},
	]

	return (
		<div className="flex-1 flex flex-col h-full bg-gray-50/50 overflow-hidden">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 px-6 py-4">
				<div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
					<Link
						to="/channels/instagram"
						className="hover:text-gray-900 flex items-center gap-1 transition-colors"
					>
						<ChevronLeft size={16} />
						Back to Instagram
					</Link>
				</div>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
							<Instagram className="text-pink-600" size={24} />
							Instagram Direct Messages
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							Connect your Instagram Professional account to manage DMs
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handleRefresh}
							disabled={refreshing}
							className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-70"
						>
							<RefreshCw
								size={14}
								className={refreshing ? 'animate-spin' : ''}
							/>
							{refreshing ? 'Syncing...' : 'Refresh'}
						</button>
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-6 pt-3 max-w-5xl mx-auto w-full space-y-6">
				{/* Main Profile Card */}
				<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
					<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
								{instagramProfile.profilePictureUrl ? (
									<img
										src={instagramProfile.profilePictureUrl}
										alt={instagramProfile.handle || inbox.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<Instagram className="text-pink-600" size={32} />
								)}
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-xl font-bold text-gray-900">
										{instagramProfile.handle || inbox.name}
									</h2>
									<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
										<ShieldCheck size={12} />
										{connectionStatusLabel}
									</span>
								</div>
								<p className="text-gray-500 text-sm">
									Instagram Professional Account
								</p>
								{instagramProfile.username ? (
									<p className="text-xs text-gray-400 mt-1">
										Profile synced from the connected professional account
									</p>
								) : null}
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							{instagramProfile.profileUrl ? (
								<a
									href={instagramProfile.profileUrl}
									target='_blank'
									rel='noreferrer'
									className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
								>
									View Profile
									<ExternalLink size={14} />
								</a>
							) : null}
							<button
								onClick={handleDisconnect}
								disabled={isDeleting}
								className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-70"
							>
								<Trash2 size={16} />
								{isDeleting ? 'Disconnecting...' : 'Disconnect'}
							</button>
						</div>
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
				</div>

				{/* Channel Configuration */}
				<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
					<div className="p-6 border-b border-gray-200 flex justify-between items-center">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">
								Channel Configuration
							</h2>
							<p className="text-sm text-gray-500">
								Configure default agents and routing
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
						{/* AI Agent */}
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

							{/* Flow */}
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

							{/* Teams */}
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
												<Users className='w-3 h-3' />
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

						{/* Human Agents */}
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
									{/* Search Input */}
									<div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
										<div className='relative'>
											<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
											<input
												type='text'
												placeholder='Search agents...'
												value={agentSearchQuery}
												onChange={(e) => setAgentSearchQuery(e.target.value)}
												onClick={(e) => e.stopPropagation()}
												className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
												autoFocus
											/>
										</div>
									</div>
									{/* Agent List */}
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
														<div className='flex-1 min-w-0'>
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

						{/* Distribution Method */}
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
												Memberikan chat kepada agent dengan chat assigned paling
												sedikit
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
												Membagi rata chat kepada semua agent
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

				{/* Quick Actions */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div
						className="bg-white p-6 pb-0 rounded-xl border border-gray-200 hover:border-pink-200 hover:shadow-sm transition-all cursor-pointer group"
						onClick={() =>
							navigate({
								to: '/instagram/inbox',
							})
						}
					>
						<div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center mb-4 text-pink-600 group-hover:bg-pink-100 transition-colors">
							<MessageSquare size={20} />
						</div>
						<h3 className="font-semibold text-gray-900 mb-1">
							Instagram Inbox
						</h3>
						<p className="text-sm text-gray-500">
							View and reply to DMs directly
						</p>
					</div>

					<div
						className="bg-white p-6 pb-0 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group"
						onClick={() =>
							navigate({
								to: '/chat',
								search: { conversationId: undefined },
							})
						}
					>
						<div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-100 transition-colors">
							<Inbox size={20} />
						</div>
						<h3 className="font-semibold text-gray-900 mb-1">Unified Inbox</h3>
						<p className="text-sm text-gray-500">
							See all messages in one place
						</p>
					</div>
				</div>

				{/* Messaging Rules Info */}
				<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
					<div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
						<Info size={16} className="text-gray-400" />
						<h3 className="font-semibold text-gray-900 text-sm">
							Instagram Messaging Rules
						</h3>
					</div>
					<div className="p-6">
						<ul className="space-y-3 text-sm text-gray-600">
							<li className="flex items-start gap-2">
								<span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></span>
								You can only reply to messages within 24 hours of receiving them
							</li>
							<li className="flex items-start gap-2">
								<span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></span>
								Conversations must be initiated by the Instagram user, not your
								business
							</li>
							<li className="flex items-start gap-2">
								<span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></span>
								Text messages are limited to 1000 bytes (UTF-8)
							</li>
							<li className="flex items-start gap-2">
								<span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0"></span>
								Supported media: Images (8MB), Videos (25MB), Audio (25MB)
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Disconnect Modal */}
			{isDeleting && (
				<div
					role="alertdialog"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
				>
					<div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
						<div className="p-6">
							<div className="flex flex-col space-y-2 text-center sm:text-left mb-4">
								<h2 className="text-lg font-semibold text-gray-900">
									Disconnect Instagram
								</h2>
								<p className="text-sm text-gray-500">
									Choose how you want to disconnect this channel.
								</p>
							</div>

							<div className="space-y-4 py-4">
								{/* Delete Types Radio Group */}
								<div className="space-y-3">
									<div
										className={`flex items-start space-x-3 rounded-md border p-3 cursor-pointer transition-all ${deleteType === 'soft' ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500 ring-offset-2' : 'hover:bg-gray-50'}`}
										onClick={() => {
											setDeleteType('soft')
											setDeleteConfirmText('')
										}}
									>
										<input
											type='radio'
											name='deleteType'
											id='soft'
											className="mt-1 text-teal-600 focus:ring-teal-500"
											checked={deleteType === 'soft'}
											onChange={() => {
												setDeleteType('soft')
												setDeleteConfirmText('')
											}}
										/>
										<div className='space-y-1'>
											<label
												htmlFor='soft'
												className={`text-sm font-medium cursor-pointer ${deleteType === 'soft' ? 'text-teal-700' : 'text-gray-900'}`}
											>
												Keep customer data
											</label>
											<p className="text-sm text-gray-500">
												Only remove messages and credentials. Your customer data
												will be preserved.
											</p>
										</div>
									</div>

									<div
										className={`flex items-start space-x-3 rounded-md border p-3 cursor-pointer transition-all ${deleteType === 'hard' ? 'border-red-500 bg-red-50/50 ring-2 ring-red-500 ring-offset-2' : 'hover:bg-gray-50'}`}
										onClick={() => setDeleteType('hard')}
									>
										<input
											type='radio'
											name='deleteType'
											id='hard'
											className="mt-1 text-red-600 focus:ring-red-500"
											checked={deleteType === 'hard'}
											onChange={() => setDeleteType('hard')}
										/>
										<div className='space-y-1'>
											<label
												htmlFor='hard'
												className={`text-sm font-medium cursor-pointer ${deleteType === 'hard' ? 'text-red-700' : 'text-gray-900'}`}
											>
												Delete all data
											</label>
											<p className="text-sm text-gray-500">
												Permanently delete all messages, customers, and related
												data. This cannot be undone.
											</p>
										</div>
									</div>
								</div>

								{/* Warning & Input - Only show for hard delete */}
								{deleteType === 'hard' && (
									<div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-3 animate-in slide-in-from-top-2 duration-200">
										<div className="flex items-start gap-2">
											<Trash2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
											<p className="text-sm text-red-700 font-medium">
												This action will permanently delete all your customer
												data including messages, activities, and custom fields.
											</p>
										</div>
										<div className='space-y-2'>
											<label
												htmlFor='confirm-delete'
												className="block text-sm font-medium text-gray-700"
											>
												Type DELETE to confirm
											</label>
											<input
												type='text'
												id='confirm-delete'
												className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-mono uppercase"
												placeholder='DELETE'
												value={deleteConfirmText}
												onChange={(e) =>
													setDeleteConfirmText(e.target.value.toUpperCase())
												}
												autoFocus
											/>
										</div>
									</div>
								)}

								{/* Info for soft delete */}
								{deleteType === 'soft' && (
									<div className="rounded-md border border-teal-200 bg-teal-50 p-3 animate-in slide-in-from-top-2 duration-200">
										<div className="flex items-start gap-2">
											<Info className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
											<p className="text-sm text-teal-700">
												This will disconnect the Instagram account but keep your
												customer data for future use.
											</p>
										</div>
									</div>
								)}
							</div>

							<div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
								<button
									type='button'
									onClick={() => {
										setIsDeleting(false)
										setDeleteConfirmText('')
									}}
									className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
								>
									Cancel
								</button>
								<button
									onClick={confirmDisconnect}
									disabled={!canDisconnect || confirming}
									className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors ${
										deleteType === 'soft'
											? 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'
											: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
									}`}
								>
									{confirming ? 'Disconnecting...' : 'Disconnect'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
