import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
	ChevronLeft,
	RefreshCw,
	Unlink,
	Phone,
	AlertTriangle,
	TrendingUp,
	Settings,
	ShieldCheck,
	GitBranch,
	Upload,
	X,
	FileText,
	Bot,
	Users,
	Shuffle,
	ChevronDown,
	Check,
	Search,
} from 'lucide-react'
import {
	whatsappChannels,
	whatsappTemplates,
	teams,
	chatbots,
	agents,
	automationFlows,
} from '@/lib/api'

export const Route = createFileRoute(
	'/_app/channels/whatsapp/$channelId',
)({
	component: WhatsAppChannelDetailPage,
})

function WhatsAppChannelDetailPage() {
	const routeParams = Route.useParams({ strict: false }) as {
		channelId: string
	}
	const { channelId } = routeParams
	const navigate = useNavigate()
	const [channel, setChannel] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [syncing, setSyncing] = useState(false)
	const [activeTab, setActiveTab] = useState<
		'overview' | 'quality' | 'templates'
	>('overview')

	useEffect(() => {
		loadChannelDetails()
	}, [channelId])

	const loadChannelDetails = async () => {
		try {
			setLoading(true)
			const res = await whatsappChannels.getDetails(channelId)
			setChannel(res.data)
		} catch (error) {
			console.error('Failed to load channel:', error)
		} finally {
			setLoading(false)
		}
	}

	const [isEditing, setIsEditing] = useState(false)
	const [editName, setEditName] = useState('')
	const [editTags, setEditTags] = useState('')
	const [saving, setSaving] = useState(false)

	// Configuration state
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

	const [showAIAgentDropdown, setShowAIAgentDropdown] = useState(false)
	const [showFlowDropdown, setShowFlowDropdown] = useState(false)
	const [showTeamsDropdown, setShowTeamsDropdown] = useState(false)
	const [showAgentsDropdown, setShowAgentsDropdown] = useState(false)
	const [showDistributionDropdown, setShowDistributionDropdown] =
		useState(false)
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

	// Fetch available options
	useEffect(() => {
		const fetchOptions = async () => {
			try {
				const [chatbotsRes, flowsRes, teamsRes, agentsRes] = (await Promise.all([
					chatbots.list(),
					automationFlows.list(),
					teams.list(),
					agents.list(),
				])) as any[]

				setAvailableAIAgents(
					(chatbotsRes as any)?.payload || (chatbotsRes as any)?.data || [],
				)
				setAvailableFlows(
					(flowsRes as any)?.payload || (flowsRes as any)?.data || [],
				)
				setAvailableTeams(
					(teamsRes as any)?.payload || (teamsRes as any)?.data || [],
				)
				setAvailableAgents(
					(agentsRes as any)?.payload || (agentsRes as any)?.data || [],
				)
			} catch (error) {
				console.error('Failed to fetch options:', error)
			}
		}
		fetchOptions()
	}, [])

	// Initialize state when channel loads
	useEffect(() => {
		if (channel) {
			setEditName(channel.name)
			setEditTags(channel.metadata?.tags?.join(', ') || '')
			// Load channel config
			setSelectedAIAgent(channel.metadata?.default_chatbot_id || null)
			setSelectedFlow(channel.metadata?.default_flow_id || null)
			setSelectedTeams(channel.metadata?.default_team_ids || [])
			setSelectedAgents(channel.metadata?.default_agent_ids || [])
			setDistributionMethod(
				channel.metadata?.distribution_method || 'round_robin',
			)
		}
	}, [channel])

	const handleSaveSettings = async () => {
		try {
			setSaving(true)
			await whatsappChannels.update(channelId, {
				name: editName,
				tags: editTags
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean),
				default_chatbot_id: selectedAIAgent,
				default_flow_id: selectedFlow,
				default_team_ids: selectedTeams,
				default_agent_ids: selectedAgents,
				distribution_method: distributionMethod,
			})
			setChannel((prev: any) => ({
				...prev,
				name: editName,
				metadata: {
					...prev.metadata,
					tags: editTags
						.split(',')
						.map((t: string) => t.trim())
						.filter(Boolean),
					default_chatbot_id: selectedAIAgent,
					default_flow_id: selectedFlow,
					default_team_ids: selectedTeams,
					default_agent_ids: selectedAgents,
					distribution_method: distributionMethod,
				},
			}))
			setIsEditing(false)
			alert('Settings saved successfully')
		} catch (error) {
			console.error('Failed to save settings:', error)
			alert('Failed to save settings')
		} finally {
			setSaving(false)
		}
	}

	const handleSync = async () => {
		try {
			setSyncing(true)
			await whatsappChannels.sync(channelId)
			await loadChannelDetails()
		} catch (error) {
			console.error('Sync failed:', error)
			alert('Failed to sync. Please try again.')
		} finally {
			setSyncing(false)
		}
	}

	const handleDisconnect = async () => {
		if (
			confirm(
				'Are you sure you want to disconnect this WhatsApp Business Account? This will stop all messaging and remove the connection.',
			)
		) {
			try {
				await whatsappChannels.delete(channelId)
				navigate({
					to: '/channels/whatsapp',
				})
			} catch (error) {
				console.error('Failed to disconnect:', error)
				alert('Failed to disconnect. Please try again.')
			}
		}
	}

	const handleBadgeUpdated = (newBadgeUrl: string | null) => {
		setChannel((prev: any) => ({ ...prev, badge_url: newBadgeUrl }))
	}

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading channel details...</p>
				</div>
			</div>
		)
	}

	if (!channel) {
		return (
			<div className="flex-1 flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<p className="text-gray-600 mb-4">Channel not found</p>
					<Link
						to="/channels/whatsapp"
						className="text-emerald-600 hover:underline"
					>
						Back to WhatsApp Channels
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 p-4 sm:p-6">
				<div className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
					<Link
						to="/channels/whatsapp"
						className="hover:underline flex items-center gap-1"
					>
						<ChevronLeft size={16} />
						WhatsApp Channels
					</Link>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-xl sm:text-2xl font-bold text-gray-900">
							{channel.verified_name || channel.business_name}
						</h1>
						<p className="text-gray-600 mt-1">{channel.phone_number}</p>
					</div>
					<div className="flex gap-2 w-full sm:w-auto">
						<button
							onClick={handleSync}
							disabled={syncing}
							className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm"
						>
							<RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
							{syncing ? 'Syncing...' : 'Refresh'}
						</button>
						<button
							onClick={handleDisconnect}
							className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
						>
							<Unlink size={16} />
							Disconnect
						</button>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="bg-white border-b border-gray-200 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
				<div className="flex gap-2 sm:gap-4 min-w-max">
					<button
						onClick={() => setActiveTab('overview')}
						className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
							activeTab === 'overview'
								? 'border-emerald-600 text-emerald-600'
								: 'border-transparent text-gray-600 hover:text-gray-900'
						}`}
					>
						<Settings size={16} />
						Overview
					</button>
					<button
						onClick={() => setActiveTab('quality')}
						className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
							activeTab === 'quality'
								? 'border-emerald-600 text-emerald-600'
								: 'border-transparent text-gray-600 hover:text-gray-900'
						}`}
					>
						<ShieldCheck size={16} />
						Quality
					</button>
					<button
						onClick={() => setActiveTab('templates')}
						className={`py-3 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
							activeTab === 'templates'
								? 'border-emerald-600 text-emerald-600'
								: 'border-transparent text-gray-600 hover:text-gray-900'
						}`}
					>
						<FileText size={16} />
						Templates
					</button>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-3 space-y-6">
				{activeTab === 'overview' && (
					<div className="space-y-6">
						{/* Channel Profile Settings */}
						<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
							<div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
								<div>
									<h2 className="text-lg font-semibold">Channel Profile</h2>
									<p className="text-sm text-gray-600">
										Customize how this channel appears in Closing AI
									</p>
								</div>
								{!isEditing ? (
									<button
										onClick={() => setIsEditing(true)}
										className="text-sm font-medium text-emerald-600 hover:text-emerald-700 w-full sm:w-auto text-left sm:text-right"
									>
										Edit Profile
									</button>
								) : (
									<div className="flex gap-2 w-full sm:w-auto">
										<button
											onClick={() => setIsEditing(false)}
											className="flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
										>
											Cancel
										</button>
										<button
											onClick={handleSaveSettings}
											disabled={saving}
											className="flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
										>
											{saving ? 'Saving...' : 'Save'}
										</button>
									</div>
								)}
							</div>
							<div className="p-4 sm:p-6 space-y-6">
								{/* Badge & Name */}
								<div className="flex flex-col sm:flex-row gap-6 items-start">
									<div className="w-full sm:w-auto shrink-0">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Channel Icon
										</label>
										<ChannelBadgeUpload
											channel={channel}
											onBadgeUpdated={handleBadgeUpdated}
										/>
									</div>
									<div className="flex-1 w-full space-y-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Channel Name
											</label>
											{isEditing ? (
												<input
													type='text'
													value={editName}
													onChange={(e) => setEditName(e.target.value)}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
												/>
											) : (
												<p className="py-2 text-gray-900 font-medium">
													{channel.name}
												</p>
											)}
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Tags
											</label>
											{isEditing ? (
												<input
													type='text'
													value={editTags}
													onChange={(e) => setEditTags(e.target.value)}
													placeholder="Separate tags with commas (e.g. Sales, Support)"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
												/>
											) : (
												<div className="flex flex-wrap gap-2 py-2">
													{channel.metadata?.tags?.length > 0 ? (
														channel.metadata.tags.map(
															(tag: string, i: number) => (
																<span
																	key={i}
																	className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
																>
																	{tag}
																</span>
															),
														)
													) : (
														<span className='text-gray-400 italic'>
															No tags set
														</span>
													)}
												</div>
											)}
										</div>

										{/* Configuration Section */}
										<div className="pt-4 border-t border-gray-100 space-y-4">
											{/* AI Agent */}
											<div className='relative'>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													AI Agent
												</label>
												{isEditing ? (
													<>
														<div
															className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer bg-white"
															onClick={() =>
																setShowAIAgentDropdown(!showAIAgentDropdown)
															}
														>
															<div className='flex items-center gap-2'>
																<Bot className='w-4 h-4 text-blue-500' />
																<span
																	className={
																		selectedAIAgent
																			? 'text-gray-900'
																			: 'text-gray-400'
																	}
																>
																	{selectedAIAgent
																		? availableAIAgents.find(
																				(b) => b.id === selectedAIAgent,
																			)?.name || 'Unknown Bot'
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
																		{/* <Bot className='w-4 h-4 text-blue-500' /> */}
																		<span className='text-sm'>{bot.name}</span>
																		{selectedAIAgent === bot.id && (
																			<Check className='w-4 h-4 text-emerald-500 ml-auto' />
																		)}
																	</div>
																))}
															</div>
														)}
													</>
												) : (
													<div className="flex items-center gap-2 py-2">
														{selectedAIAgent ? (
															<div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100/50">
																<Bot className='w-4 h-4 text-blue-500' />
																<span className="text-sm font-medium text-blue-700">
																	{availableAIAgents.find(
																		(b) => b.id === selectedAIAgent,
																	)?.name || 'Unknown Bot'}
																</span>
															</div>
														) : (
															<span className="text-gray-400 italic text-sm">
																No AI Agent assigned
															</span>
														)}
													</div>
												)}
											</div>

											{/* Flow */}
											<div className='relative'>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Flow
												</label>
												{isEditing ? (
													<>
														<div
															className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer bg-white"
															onClick={() =>
																setShowFlowDropdown(!showFlowDropdown)
															}
														>
															<div className='flex items-center gap-2'>
																<GitBranch className='w-4 h-4 text-indigo-500' />
																<span
																	className={
																		selectedFlow
																			? 'text-gray-900'
																			: 'text-gray-400'
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
																		<span className='text-sm'>{flow.name}</span>
																		{flow.active === true && (
																			<span className="ml-1 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
																				Active
																			</span>
																		)}
																		{selectedFlow === flow.id && (
																			<Check className='w-4 h-4 text-emerald-500 ml-auto' />
																		)}
																	</div>
																))}
																{availableFlows.length === 0 && (
																	<div className='p-2 text-gray-400 text-sm italic'>
																		No flows available
																	</div>
																)}
															</div>
														)}
													</>
												) : (
													<div className="flex items-center gap-2 py-2">
														{selectedFlow ? (
															<div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/50">
																<GitBranch className='w-4 h-4 text-indigo-500' />
																<span className="text-sm font-medium text-indigo-700">
																	{availableFlows.find((f) => f.id === selectedFlow)
																		?.name || 'Unknown Flow'}
																</span>
															</div>
														) : (
															<span className="text-gray-400 italic text-sm">
																No flow selected
															</span>
														)}
													</div>
												)}
											</div>

											{/* Teams */}
											<div className='relative'>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Teams
												</label>
												{isEditing ? (
													<>
														<div
															className="w-full px-3 py-2 border border-gray-300 rounded-lg flex flex-wrap items-center gap-2 cursor-pointer bg-white min-h-[42px]"
															onClick={() =>
																setShowTeamsDropdown(!showTeamsDropdown)
															}
														>
															{selectedTeams.length > 0 ? (
																selectedTeams.map((teamId) => {
																	const team = availableTeams.find(
																		(t) => t.id === teamId,
																	)
																	return (
																		<span
																			key={teamId}
																			className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
																		>
																			<Users className='w-3 h-3' />
																			{team?.name || 'Unknown'}
																			<X
																				className='w-3 h-3 hover:text-red-500 cursor-pointer'
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
																<span className='text-gray-400 text-sm'>
																	Select Teams
																</span>
															)}
															<ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
														</div>
														{showTeamsDropdown && (
															<div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
																{availableTeams.map((team) => {
																	const isSelected = selectedTeams.includes(
																		team.id,
																	)
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
																					setSelectedTeams((prev) => [
																						...prev,
																						team.id,
																					])
																				}
																			}}
																		>
																			<Users className='w-4 h-4 text-blue-500' />
																			<span className='text-sm'>
																				{team.name}
																			</span>
																			{isSelected && (
																				<Check className='w-4 h-4 text-emerald-500 ml-auto' />
																			)}
																		</div>
																	)
																})}
																{availableTeams.length === 0 && (
																	<div className='p-2 text-gray-400 text-sm italic'>
																		No teams available
																	</div>
																)}
															</div>
														)}
													</>
												) : (
													<div className="flex flex-wrap gap-2 py-2">
														{selectedTeams.length > 0 ? (
															selectedTeams.map((teamId) => {
																const team = availableTeams.find(
																	(t) => t.id === teamId,
																)
																return (
																	<span
																		key={teamId}
																		className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium"
																	>
																		<Users className='w-3.5 h-3.5' />
																		{team?.name || 'Unknown'}
																	</span>
																)
															})
														) : (
															<span className="text-gray-400 italic text-sm">
																No teams assigned
															</span>
														)}
													</div>
												)}
											</div>

											{/* Human Agents */}
											<div className="relative" ref={agentDropdownRef}>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Human Agent
												</label>
												{isEditing ? (
													<>
														<div
															className="w-full px-3 py-2 border border-gray-300 rounded-lg flex flex-wrap items-center gap-2 cursor-pointer bg-white min-h-[42px]"
															onClick={() => {
																setShowAgentsDropdown(!showAgentsDropdown)
																setAgentSearchQuery('')
															}}
														>
															{selectedAgents.length > 0 ? (
																selectedAgents.map((agentId) => {
																	const agent = availableAgents.find(
																		(a) => a.id === agentId,
																	)
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
																				className='w-3 h-3 hover:text-red-500 cursor-pointer'
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
																<span className='text-gray-400 text-sm'>
																	Select Agents
																</span>
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
																			onChange={(e) =>
																				setAgentSearchQuery(e.target.value)
																			}
																			onClick={(e) => e.stopPropagation()}
																			className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
																			autoFocus
																		/>
																	</div>
																</div>
																{/* Agent List */}
																<div className='max-h-48 overflow-y-auto'>
																	{availableAgents
																		.filter(
																			(agent) =>
																				agent.name
																					?.toLowerCase()
																					.includes(
																						agentSearchQuery.toLowerCase(),
																					) ||
																				agent.email
																					?.toLowerCase()
																					.includes(
																						agentSearchQuery.toLowerCase(),
																					),
																		)
																		.map((agent) => {
																			const isSelected =
																				selectedAgents.includes(agent.id)
																			return (
																				<div
																					key={agent.id}
																					className={`flex items-center gap-2 p-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50' : ''}`}
																					onClick={(e) => {
																						e.stopPropagation()
																						if (isSelected) {
																							setSelectedAgents((prev) =>
																								prev.filter(
																									(id) => id !== agent.id,
																								),
																							)
																						} else {
																							setSelectedAgents((prev) => [
																								...prev,
																								agent.id,
																							])
																						}
																					}}
																				>
																					<div
																						className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${isSelected ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
																					>
																						{(agent.name || 'A')[0]}
																					</div>
																					<div className='flex-1 min-w-0'>
																						<span className='text-sm font-medium block truncate'>
																							{agent.name}
																						</span>
																						<span className='text-xs text-gray-400 block truncate'>
																							{agent.email}
																						</span>
																					</div>
																					{isSelected && (
																						<Check className='w-4 h-4 text-emerald-500 flex-shrink-0' />
																					)}
																				</div>
																			)
																		})}
																	{availableAgents.filter(
																		(agent) =>
																			agent.name
																				?.toLowerCase()
																				.includes(
																					agentSearchQuery.toLowerCase(),
																				) ||
																			agent.email
																				?.toLowerCase()
																				.includes(
																					agentSearchQuery.toLowerCase(),
																				),
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
													</>
												) : (
													<div className="flex flex-wrap gap-2 py-2">
														{selectedAgents.length > 0 ? (
															selectedAgents.map((agentId) => {
																const agent = availableAgents.find(
																	(a) => a.id === agentId,
																)
																return (
																	<span
																		key={agentId}
																		className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium"
																	>
																		<div className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center text-[9px] font-bold">
																			{(agent?.name || 'A')[0]}
																		</div>
																		{agent?.name || 'Unknown'}
																	</span>
																)
															})
														) : (
															<span className="text-gray-400 italic text-sm">
																No agents assigned
															</span>
														)}
													</div>
												)}
											</div>

											{/* Distribution Method */}
											<div className='relative'>
												<label className="block text-sm font-medium text-gray-700 mb-1">
													Chat Distribution Method
												</label>
												{isEditing ? (
													<>
														<div
															className="w-full px-3 py-2 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer bg-white"
															onClick={() =>
																setShowDistributionDropdown(
																	!showDistributionDropdown,
																)
															}
														>
															<span className='text-gray-900 font-medium'>
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
																		<p className='text-sm font-bold mb-0'>
																			Least Assigned First
																		</p>
																		<p className='text-xs text-gray-500'>
																			Memberikan chat kepada agent dengan chat
																			assigned paling sedikit
																		</p>
																	</div>
																	{distributionMethod === 'least_assigned' && (
																		<Check className='w-4 h-4 text-blue-500 mr-2' />
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
																		<p className='text-sm font-bold mb-0'>
																			Round Robin
																		</p>
																		<p className='text-xs text-gray-500'>
																			Membagi rata chat kepada semua agent
																		</p>
																	</div>
																	{distributionMethod === 'round_robin' && (
																		<Check className='w-4 h-4 text-blue-500 mr-2' />
																	)}
																</div>
															</div>
														)}
													</>
												) : (
													<div className="flex items-center gap-2 py-2">
														<Shuffle className="w-4 h-4 text-gray-500" />
														<span className='font-medium'>
															{distributionMethod === 'least_assigned'
																? 'Least Assigned First'
																: 'Round Robin'}
														</span>
														<span className="text-xs text-gray-500 ml-2">
															{distributionMethod === 'least_assigned'
																? '(Memberikan chat kepada agent dengan chat assigned paling sedikit)'
																: '(Membagi rata chat kepada semua agent)'}
														</span>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* WABA Info Card */}
						<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
							<div className="p-4 sm:p-6 border-b border-gray-200">
								<div className="flex items-start justify-between">
									<div>
										<div className="flex items-center gap-2 mb-2">
											<h2 className="text-lg font-semibold">
												WhatsApp Business Account
											</h2>
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
												Connected
											</span>
										</div>
										<p className="text-sm text-gray-600">
											Manage your WABA connection and settings
										</p>
									</div>
								</div>
							</div>
							<div className="p-4 sm:p-6">
								<div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
									<div>
										<p className="text-sm text-gray-600">WABA ID</p>
										<p className="font-mono text-sm font-medium mt-1">
											{channel.business_id}
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-600">Business Name</p>
										<p className="font-medium mt-1">{channel.business_name}</p>
									</div>
									<div>
										<p className="text-sm text-gray-600">Timezone</p>
										<p className="font-medium mt-1">{channel.timezone}</p>
									</div>
									<div>
										<p className="text-sm text-gray-600">Currency</p>
										<p className="font-medium mt-1">{channel.currency}</p>
									</div>
									<div className="md:col-span-2">
										<p className="text-sm text-gray-600">Last Synced</p>
										<p className='text-sm mt-1'>
											{channel.last_synced_at
												? new Date(channel.last_synced_at).toLocaleString()
												: 'Never synced'}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Phone Number Card */}
						<div className="bg-white rounded-xl border border-gray-200 shadow-sm">
							<div className="p-6 border-b border-gray-200">
								<div className="flex items-center gap-2 mb-2">
									<Phone size={20} />
									<h2 className="text-lg font-semibold">Phone Number</h2>
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
										Primary
									</span>
								</div>
								<p className="text-sm text-gray-600">
									Your WhatsApp Business phone number details
								</p>
							</div>
							<div className='p-6'>
								<div className="space-y-6">
									{/* Phone Display */}
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
											<Phone className="text-emerald-600" size={24} />
										</div>
										<div className='flex-1'>
											<p className="font-mono text-lg font-bold">
												{channel.phone_number}
											</p>
											<p className="text-sm text-gray-600">
												{channel.verified_name || channel.business_name}
											</p>
										</div>
									</div>

									{/* Quality Rating */}
									<QualityRatingCard
										rating={channel.quality_rating}
										score={channel.quality_score}
									/>

									{/* Messaging Limit */}
									<MessagingLimitCard
										tier={channel.messaging_limit}
										limitInfo={channel.limit_info}
									/>

									{/* Phone Number ID */}
									<div className="border-t pt-4">
										<p className="text-xs text-gray-600">Phone Number ID</p>
										<p className="font-mono text-sm mt-1">
											{channel.phone_number_id}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'quality' && (
					<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
						{/* Quality Metrics Card */}
						<div className="bg-white rounded-xl border border-gray-200 shadow-sm">
							<div className="p-6 border-b border-gray-200">
								<div className="flex items-start justify-between">
									<div>
										<div className="flex items-center gap-2 mb-2">
											<ShieldCheck className="h-5 w-5" />
											<h2 className="text-lg font-semibold">Quality Metrics</h2>
										</div>
										<p className="text-sm text-gray-600">
											Monitor your messaging quality rating
										</p>
									</div>
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
											channel.quality_rating === 'GREEN'
												? 'bg-emerald-600 text-white'
												: channel.quality_rating === 'YELLOW'
													? 'bg-yellow-500 text-white'
													: channel.quality_rating === 'RED'
														? 'bg-red-600 text-white'
														: 'bg-gray-400 text-white'
										}`}
									>
										{channel.quality_score.label} Quality
									</span>
								</div>
							</div>
							<div className='p-6'>
								<div className="space-y-6">
									{/* Overall Score */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2">
												<p className="text-sm font-medium">Overall Score</p>
												{channel.quality_rating === 'GREEN' && (
													<TrendingUp className="h-4 w-4 text-emerald-600" />
												)}
												{channel.quality_rating === 'RED' && (
													<AlertTriangle className="h-4 w-4 text-red-600" />
												)}
											</div>
											<p
												className={`text-2xl font-bold ${
													channel.quality_rating === 'GREEN'
														? 'text-emerald-600'
														: channel.quality_rating === 'YELLOW'
															? 'text-yellow-600'
															: channel.quality_rating === 'RED'
																? 'text-red-600'
																: 'text-gray-600'
												}`}
											>
												{channel.quality_score.percentage}%
											</p>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-2">
											<div
												className={`h-2 rounded-full transition-all ${
													channel.quality_rating === 'GREEN'
														? 'bg-emerald-600'
														: channel.quality_rating === 'YELLOW'
															? 'bg-yellow-500'
															: channel.quality_rating === 'RED'
																? 'bg-red-600'
																: 'bg-gray-400'
												}`}
												style={{
													width: `${channel.quality_score.percentage}%`,
												}}
											></div>
										</div>
										<p className="text-xs text-gray-600 mt-1">
											Based on customer feedback and engagement
										</p>
									</div>

									{/* Quality Indicators */}
									<div className='space-y-3'>
										<div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
											<div>
												<p className="text-sm font-medium">Template Quality</p>
												<p className="text-xs text-gray-600">
													Message template performance
												</p>
											</div>
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
													channel.quality_rating === 'GREEN'
														? 'bg-emerald-600 text-white'
														: channel.quality_rating === 'YELLOW'
															? 'bg-yellow-500 text-white'
															: channel.quality_rating === 'RED'
																? 'bg-red-600 text-white'
																: 'bg-gray-400 text-white'
												}`}
											>
												{channel.quality_rating === 'UNKNOWN'
													? 'N/A'
													: channel.quality_rating}
											</span>
										</div>

										<div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
											<div>
												<p className='text-sm font-medium'>
													Phone Number Quality
												</p>
												<p className="text-xs text-gray-600">
													Account health status
												</p>
											</div>
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
													channel.quality_rating === 'GREEN'
														? 'bg-emerald-600 text-white'
														: channel.quality_rating === 'YELLOW'
															? 'bg-yellow-500 text-white'
															: channel.quality_rating === 'RED'
																? 'bg-red-600 text-white'
																: 'bg-gray-400 text-white'
												}`}
											>
												{channel.quality_rating}
											</span>
										</div>
									</div>

									<div className="border-t pt-3">
										<p className="text-xs text-gray-600">
											Last updated:{' '}
											{channel.last_synced_at
												? new Date(channel.last_synced_at).toLocaleString()
												: 'Never'}
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Phone Number Card (in Quality Tab) */}
						<div className="bg-white rounded-xl border border-gray-200 shadow-sm">
							<div className="p-6 border-b border-gray-200">
								<div className="flex items-center gap-2 mb-2">
									<Phone className="h-5 w-5" />
									<h2 className="text-lg font-semibold">Phone Number</h2>
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-600 text-white">
										Primary
									</span>
								</div>
								<p className="text-sm text-gray-600">
									Your WhatsApp Business phone number details
								</p>
							</div>
							<div className='p-6'>
								<div className="space-y-6">
									{/* Phone Display */}
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
											<Phone className="text-emerald-600" size={24} />
										</div>
										<div className='flex-1'>
											<p className="font-mono text-lg font-bold">
												{channel.phone_number}
											</p>
											<p className="text-sm text-gray-600">
												{channel.verified_name || channel.business_name}
											</p>
										</div>
									</div>

									{/* Quality Rating */}
									<QualityRatingCard
										rating={channel.quality_rating}
										score={channel.quality_score}
									/>

									{/* Messaging Limit */}
									<MessagingLimitCard
										tier={channel.messaging_limit}
										limitInfo={channel.limit_info}
									/>

									{/* Phone Number ID */}
									<div className="border-t pt-4">
										<p className="text-xs text-gray-600">Phone Number ID</p>
										<p className="font-mono text-sm mt-1">
											{channel.phone_number_id}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{activeTab === 'templates' && <TemplatesList channelId={channelId} />}
			</div>
		</div>
	)
}

// Quality Rating Component
function QualityRatingCard({ rating, score }: { rating: string; score: any }) {
	const getColor = () => {
		switch (score.color) {
			case 'emerald':
				return 'bg-emerald-600'
			case 'yellow':
				return 'bg-yellow-500'
			case 'red':
				return 'bg-red-600'
			default:
				return 'bg-gray-400'
		}
	}

	const getBadgeColor = () => {
		switch (score.color) {
			case 'emerald':
				return 'bg-emerald-100 text-emerald-800'
			case 'yellow':
				return 'bg-yellow-100 text-yellow-800'
			case 'red':
				return 'bg-red-100 text-red-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	return (
		<div className="rounded-lg border border-gray-200 p-4">
			<div className="flex items-center justify-between mb-3">
				<p className="text-sm font-medium">Quality Rating</p>
				<span
					className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getBadgeColor()}`}
				>
					{rating === 'UNKNOWN' && <AlertTriangle size={12} className="mr-1" />}
					{score.label}
				</span>
			</div>
			<p className="text-sm text-gray-600 mb-3">
				{rating === 'UNKNOWN'
					? 'Quality not rated yet'
					: `Your account quality is ${score.label.toLowerCase()}`}
			</p>
			<div className="w-full bg-gray-200 rounded-full h-2">
				<div
					className={`h-2 rounded-full transition-all ${getColor()}`}
					style={{ width: `${score.percentage}%` }}
				></div>
			</div>
		</div>
	)
}

// Messaging Limit Component
function MessagingLimitCard({
	tier,
	limitInfo,
}: {
	tier: string
	limitInfo: any
}) {
	const tierLevel = limitInfo.tier_level

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<TrendingUp size={16} className="text-gray-400" />
					<span className="text-sm font-medium">Messaging Limit</span>
				</div>
				<span className="text-lg font-bold text-gray-900">
					{limitInfo.daily_limit}
					{tier !== 'TIER_UNLIMITED' && '/day'}
				</span>
			</div>

			{/* Tier Progress */}
			<div className="flex gap-1">
				<div
					className={`flex-1 h-1.5 rounded-full ${tierLevel >= 0 ? 'bg-emerald-600' : 'bg-gray-200'}`}
				></div>
				<div
					className={`flex-1 h-1.5 rounded-full ${tierLevel >= 1 ? 'bg-emerald-600' : 'bg-gray-200'}`}
				></div>
				<div
					className={`flex-1 h-1.5 rounded-full ${tierLevel >= 2 ? 'bg-emerald-600' : 'bg-gray-200'}`}
				></div>
				<div
					className={`flex-1 h-1.5 rounded-full ${tierLevel >= 3 ? 'bg-emerald-600' : 'bg-gray-200'}`}
				></div>
				<div
					className={`flex-1 h-1.5 rounded-full ${tierLevel >= 4 ? 'bg-emerald-600' : 'bg-gray-200'}`}
				></div>
			</div>

			<div className="flex justify-between text-xs text-gray-500">
				<span>50</span>
				<span>1K</span>
				<span>10K</span>
				<span>100K</span>
				<span>∞</span>
			</div>
		</div>
	)
}

// Channel Badge Upload Component
function ChannelBadgeUpload({
	channel,
	onBadgeUpdated,
}: {
	channel: any
	onBadgeUpdated: (url: string | null) => void
}) {
	const [uploading, setUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		// Validate file type
		if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
			alert('Only JPG, JPEG, and PNG files are allowed')
			return
		}

		// Validate file size (2MB)
		if (file.size > 2 * 1024 * 1024) {
			alert('File size must be less than 2MB')
			return
		}

		try {
			setUploading(true)
			const result: any = await whatsappChannels.uploadBadge(channel.id, file)
			onBadgeUpdated(result.badge_url)
		} catch (error) {
			console.error('Upload failed:', error)
			alert(error instanceof Error ? error.message : 'Failed to upload badge')
		} finally {
			setUploading(false)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
	}

	const handleRemove = async () => {
		if (!confirm('Reset badge to default profile picture?')) return

		try {
			const result: any = await whatsappChannels.removeBadge(channel.id)
			onBadgeUpdated(result.badge_url)
		} catch (error) {
			console.error('Remove failed:', error)
			alert('Failed to remove badge')
		}
	}

	const badgeUrl = channel.badge_url || channel.metadata?.profile_picture_url

	return (
		<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
			<div className="space-y-3 w-full sm:w-auto">
				<div className="mt-2 flex items-start gap-4">
					<div
						className="flex w-fit cursor-pointer items-center rounded-lg border border-dashed transition-colors border-green-500 hover:border-green-600 hover:bg-green-50"
						onClick={() => !uploading && fileInputRef.current?.click()}
					>
						<div className="group relative p-1.5">
							{badgeUrl ? (
								<>
									<img
										src={badgeUrl}
										alt='Channel badge'
										className="max-h-[60px] min-h-[60px] max-w-[60px] min-w-[60px] sm:max-h-[68px] sm:min-h-[68px] sm:max-w-[68px] sm:min-w-[68px] rounded-lg object-cover"
									/>
									<button
										className="absolute inset-0 flex items-center justify-center rounded-lg bg-white opacity-0 shadow-lg transition-all duration-200 group-hover:cursor-pointer group-hover:opacity-60"
										type='button'
										title='Replace image'
										onClick={(e) => {
											e.stopPropagation()
											if (!uploading) fileInputRef.current?.click()
										}}
									>
										<Upload className="h-6 w-6 text-gray-700" />
									</button>
								</>
							) : (
								<div className="flex h-[60px] w-[60px] sm:h-[68px] sm:w-[68px] items-center justify-center rounded-lg bg-gray-100">
									<Upload className="h-6 w-6 text-gray-400" />
								</div>
							)}
						</div>
					</div>

					{channel.badge_url && (
						<button
							onClick={handleRemove}
							className="mt-4 sm:mt-5 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
							title='Remove badge'
						>
							<X className="h-5 w-5" />
						</button>
					)}
				</div>
				<input
					ref={fileInputRef}
					type='file'
					id="channel-badge-whatsapp"
					accept="image/jpeg,image/jpg,image/png"
					className="hidden"
					onChange={handleFileChange}
					disabled={uploading}
				/>
			</div>
			<div className="flex flex-1 flex-col items-start gap-1 w-full">
				<h4 className="text-sm font-semibold text-gray-700">
					Channel Badge Icon
				</h4>
				<p className="text-xs font-normal text-gray-500 max-w-sm">
					We recommend an image of at least 360x360 pixels. JPG, JPEG, or PNG
					format with a maximum size of 2MB.
				</p>
				{uploading && (
					<p className="text-xs text-blue-600 mt-1 animate-pulse">
						Uploading...
					</p>
				)}
			</div>
		</div>
	)
}

function TemplatesList({ channelId }: { channelId: string }) {
	const [templates, setTemplates] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [syncing, setSyncing] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		loadTemplates()
	}, [])

	const loadTemplates = async () => {
		try {
			setLoading(true)
			// Assuming the list API filters by app_id internally,
			// but effectively we might want to filter by this channel specifically if the backend supported it.
			// Currently backend listWhatsAppTemplates lists ALL for the APP.
			// But we are in a channel context.
			// Ideally backend receives channelId query param.
			// For now, let's just list all and maybe filter client side if needed,
			// OR ignore filtering since an App usually has one WABA.
			const res: any = await whatsappTemplates.list()
			if (res.success) {
				// Filter by waba_id if possible, but we don't have waba_id easily here without channel prop.
				// Let's just show all for now.
				setTemplates(res.data)
			}
		} catch (e: any) {
			setError('Failed to load templates')
		} finally {
			setLoading(false)
		}
	}

	const handleSync = async () => {
		try {
			setSyncing(true)
			await whatsappTemplates.sync(channelId)
			await loadTemplates()
		} catch (e: any) {
			alert('Sync failed: ' + e.message)
		} finally {
			setSyncing(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h3 className="text-lg font-medium text-gray-900">
					WhatsApp Templates
				</h3>
				<button
					onClick={handleSync}
					disabled={syncing}
					className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition disabled:opacity-50"
				>
					<RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
					{syncing ? 'Syncing...' : 'Sync from Meta'}
				</button>
			</div>

			{loading ? (
				<div className="flex justify-center p-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
				</div>
			) : error ? (
				<div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
					{error}
				</div>
			) : templates.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
					<FileText className="mx-auto h-12 w-12 text-gray-400" />
					<h3 className="mt-2 text-sm font-medium text-gray-900">
						No templates found
					</h3>
					<p className="mt-1 text-sm text-gray-500">
						Sync with Meta to see your templates.
					</p>
				</div>
			) : (
				<div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm scrollbar-hide">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Name
								</th>
								<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Language
								</th>
								<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-center sm:text-left">
									Category
								</th>
								<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
									Status
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{templates.map((t) => (
								<tr key={t.id} className="hover:bg-gray-50">
									<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{t.name}
									</td>
									<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{t.language}
									</td>
									<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center sm:text-left">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
											{t.category}
										</span>
									</td>
									<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right">
										<span
											className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												t.status === 'APPROVED'
													? 'bg-green-100 text-green-800'
													: t.status === 'REJECTED'
														? 'bg-red-100 text-red-800'
														: 'bg-yellow-100 text-yellow-800'
											}`}
										>
											{t.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
