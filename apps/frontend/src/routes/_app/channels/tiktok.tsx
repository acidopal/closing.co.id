import { createFileRoute, Link, Outlet, useMatches } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
	Music2,
	Search,
	Plus,
	ChevronLeft,
	AlertTriangle,
	Trash2,
} from 'lucide-react'
import { API_BASE } from '@/lib/api'

export const Route = createFileRoute('/_app/channels/tiktok')({
	component: TikTokChannelsPage,
})

interface TikTokChannel {
	id: string
	name: string
	is_active: boolean
	tiktok_id?: string | null
	open_id?: string | null
	union_id?: string | null
	display_name?: string | null
	avatar_url?: string | null
	token_expires_at?: string | null
	created_at: string
}

interface ChannelStatus {
	daysUntilTokenExpiry?: number
	tokenExpiresAt?: string
	connectionStatus?: string
	isMessagingReady?: boolean
	messagingReadiness?: string
	messagingReadinessMessage?: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

function getTokenExpiryMeta(channel: TikTokChannel, status?: ChannelStatus) {
	const expiresAtRaw = status?.tokenExpiresAt || channel.token_expires_at || null
	if (!expiresAtRaw) return null

	const expiresAt = new Date(expiresAtRaw)
	if (Number.isNaN(expiresAt.getTime())) return null

	const remainingMs = expiresAt.getTime() - Date.now()
	if (remainingMs <= 0) {
		return {
			expiresSoon: true,
			label: 'Token expired',
		}
	}

	const remainingDays = Math.floor(remainingMs / DAY_MS)
	if (remainingDays >= 1) {
		return {
			expiresSoon: remainingDays < 7,
			label: `Token expires in ${remainingDays}d`,
		}
	}

	const remainingHours = Math.max(1, Math.ceil(remainingMs / HOUR_MS))
	return {
		expiresSoon: true,
		label: `Token expires in ${remainingHours}h`,
	}
}

const getTikTokConnectionErrorMessage = (payload: {
	reason?: string
	message?: string
}) => {
	if (payload.message) return payload.message

	if (payload.reason === 'missing_code_or_state') {
		return 'TikTok did not return a valid authorization code. Please try again.'
	}

	if (payload.reason === 'tiktok_oauth_error') {
		return 'TikTok OAuth failed. Please reconnect and try again.'
	}

	return payload.reason || 'Unknown error'
}

function TikTokChannelsPage() {
	const routeParams = Route.useParams({ strict: false }) as {
		appId?: string
	}
	const appId =
		routeParams.appId ||
		(typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_org_slug') || ''
			: '')
	const matches = useMatches()
	const isDetailMode = matches.some((m) => m.routeId.endsWith('$inboxId'))

	const [channels, setChannels] = useState<TikTokChannel[]>([])
	const [channelStatuses, setChannelStatuses] = useState<Record<string, ChannelStatus>>(
		{},
	)
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [showConnectModal, setShowConnectModal] = useState(false)
	const [connecting, setConnecting] = useState(false)
	const [disconnecting, setDisconnecting] = useState<string | null>(null)
	const popupRef = useRef<Window | null>(null)

	const getApiHeaders = useCallback(
		(json = false): HeadersInit => {
			const token = localStorage.getItem('scalechat_token')
			const savedAppId = localStorage.getItem('scalechat_app_id')
			const orgSlugFromUrl = appId || null
			return {
				...(token && { Authorization: `Bearer ${token}` }),
				...(orgSlugFromUrl && { 'X-Org-Slug': orgSlugFromUrl }),
				...(savedAppId && { 'X-App-Id': savedAppId }),
				...(json && { 'Content-Type': 'application/json' }),
			}
		},
		[appId],
	)

	const fetchChannelStatus = useCallback(
		async (channelId: string) => {
			try {
				const res = await fetch(`${API_BASE}/tiktok-channels/${channelId}/status`, {
					headers: getApiHeaders(),
				})
				const data = await res.json()
				if (data.data) {
					setChannelStatuses((prev) => ({
						...prev,
						[channelId]: data.data,
					}))
				}
			} catch (error) {
				console.error(`Failed to fetch status for channel ${channelId}:`, error)
			}
		},
		[getApiHeaders],
	)

	const loadChannels = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE}/tiktok-channels`, {
				headers: getApiHeaders(),
			})
			const data = await res.json()
			const list: TikTokChannel[] = data.data || []
			setChannels(list)

			for (const ch of list) {
				void fetchChannelStatus(ch.id)
			}
		} catch (error) {
			console.error('Failed to load TikTok channels:', error)
		} finally {
			setLoading(false)
		}
	}, [fetchChannelStatus, getApiHeaders])

	useEffect(() => {
		if (!isDetailMode) {
			void loadChannels()
		}
	}, [isDetailMode, loadChannels])

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === 'TIKTOK_CONNECTED') {
				setShowConnectModal(false)
				setConnecting(false)
				popupRef.current?.close()
				void loadChannels()
			}

			if (event.data?.type === 'TT_ERROR') {
				const reason = getTikTokConnectionErrorMessage({
					reason: event.data.reason,
					message: event.data.message,
				})
				setConnecting(false)
				setShowConnectModal(false)
				popupRef.current?.close()
				alert(`TikTok connection failed: ${reason}`)
			}
		}

		window.addEventListener('message', handleMessage)
		return () => window.removeEventListener('message', handleMessage)
	}, [loadChannels])

	if (isDetailMode) {
		return <Outlet />
	}

	const handleConnect = async () => {
		setConnecting(true)
		try {
			const res = await fetch(`${API_BASE}/tiktok-channels/init-login`, {
				method: 'POST',
				headers: getApiHeaders(true),
			})
			const data = await res.json()

			if (data.data?.loginUrl) {
				const width = 600
				const height = 760
				const left = window.screenX + (window.outerWidth - width) / 2
				const top = window.screenY + (window.outerHeight - height) / 2

				const popup = window.open(
					data.data.loginUrl,
					'tiktok-login',
					`width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`,
				)
				popupRef.current = popup

				const checkClosed = setInterval(() => {
					if (popup?.closed) {
						clearInterval(checkClosed)
						setTimeout(() => {
							setConnecting(false)
						}, 500)
					}
				}, 1000)
			} else {
				alert('Failed to initiate TikTok login. Please try again.')
				setConnecting(false)
				setShowConnectModal(false)
			}
		} catch (error) {
			console.error('Failed to connect TikTok:', error)
			alert('TikTok connection failed')
			setConnecting(false)
			setShowConnectModal(false)
		}
	}

	const handleDisconnect = async (channelId: string) => {
		if (!confirm('Are you sure you want to disconnect this TikTok account?')) return

		setDisconnecting(channelId)
		try {
			await fetch(`${API_BASE}/tiktok-channels/${channelId}`, {
				method: 'DELETE',
				headers: getApiHeaders(),
			})
			setChannels((prev) => prev.filter((ch) => ch.id !== channelId))
			setChannelStatuses((prev) => {
				const next = { ...prev }
				delete next[channelId]
				return next
			})
		} catch (error) {
			console.error('Failed to disconnect TikTok channel:', error)
			alert('Failed to disconnect TikTok account')
		} finally {
			setDisconnecting(null)
		}
	}

	const filteredChannels = channels.filter((ch) => {
		const haystack = `${ch.display_name || ''} ${ch.name || ''}`.toLowerCase()
		return haystack.includes(searchQuery.toLowerCase())
	})

	return (
		<div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
			<div className="flex-1 flex flex-col overflow-hidden">
				<div className="bg-card p-6 pb-0">
					<div className="flex items-center gap-2 text-sm text-teal-600 mb-4">
						<Link
							to="/integration"
							className="hover:underline flex items-center gap-1"
						>
							<ChevronLeft size={16} />
							Integration
						</Link>
					</div>
					<div className="flex items-center gap-3 mb-4">
						<div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
							<Music2 className="text-white" size={18} />
						</div>
						<h1 className="text-2xl font-bold text-gray-900">TikTok</h1>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-6 pt-3">
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
						<p className="text-sm text-gray-700">
							Connect your TikTok business account to receive and manage direct messages from your omnichannel inbox.
						</p>
					</div>

					<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative w-full sm:max-w-sm">
							<Search
								className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								size={18}
							/>
							<input
								type="text"
								placeholder="Search TikTok account"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
							/>
						</div>
						<button
							onClick={() => setShowConnectModal(true)}
							className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 text-white transition hover:bg-teal-700 sm:w-auto"
						>
							<Plus size={18} />
							Connect TikTok
						</button>
					</div>

					{loading ? (
						<div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
							Loading channels...
						</div>
					) : filteredChannels.length === 0 ? (
						<div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 transition-all duration-300 hover:border-black/30">
							<div className="flex flex-col items-center justify-center text-center">
								<Music2 className="text-gray-400 mb-4 h-12 w-12" />
								<h3 className="mb-2 text-lg font-semibold text-gray-900">
									No channels found
								</h3>
								<p className="text-muted-foreground mb-6 text-center text-sm max-w-sm">
									{searchQuery
										? `We couldn't find any TikTok accounts matching "${searchQuery}"`
										: 'Connect your first TikTok account to start managing DMs.'}
								</p>
								{!searchQuery && (
									<button
										onClick={() => setShowConnectModal(true)}
										className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium shadow-sm"
									>
										<Plus size={18} />
										Connect TikTok
									</button>
								)}
							</div>
						</div>
					) : (
						<div className="bg-white rounded-lg border border-gray-200">
							<div className="overflow-x-auto">
								<table className="w-full min-w-[760px]">
								<thead>
									<tr className="border-b border-gray-200">
										<th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
											TikTok Account
										</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
											TikTok ID
										</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
											Status
										</th>
										<th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
											Action
										</th>
									</tr>
								</thead>
								<tbody>
										{filteredChannels.map((channel) => {
											const status = channelStatuses[channel.id]
											const tokenExpiryMeta = getTokenExpiryMeta(channel, status)
											const tokenExpiringSoon = Boolean(tokenExpiryMeta?.expiresSoon)
											const messagingNotReady = status?.isMessagingReady === false
											const tiktokAccountId =
												channel.tiktok_id || channel.open_id || channel.union_id || null

											return (
												<tr
													key={channel.id}
													className="border-b border-gray-100 hover:bg-gray-50 group/row"
												>
													<td className="px-6 py-4">
														<Link
															to="/channels/tiktok/$inboxId"
															params={{ inboxId: channel.id }}
															className="flex items-center gap-3 group"
														>
															{channel.avatar_url ? (
																<img
																	src={channel.avatar_url}
																	alt={channel.display_name || channel.name}
																	className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm transition-transform group-hover:scale-105"
																/>
															) : (
																<div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shadow-sm">
																	<Music2 className="text-white" size={16} />
																</div>
															)}
															<div className="flex flex-col">
																<span className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
																	{channel.display_name || channel.name}
																</span>
																<span className="text-xs text-gray-400 mt-0.5">
																	{channel.display_name ? `@${channel.display_name}` : 'TikTok account'}
																</span>
															</div>
														</Link>
													</td>
													<td className="px-6 py-4 text-sm">
														<div className="space-y-1">
															<div className="text-gray-700 font-mono break-all">
																{tiktokAccountId || 'N/A'}
															</div>
															{channel.union_id ? (
																<div className="text-xs text-gray-400 font-mono break-all">
																	union: {channel.union_id}
																</div>
															) : null}
														</div>
													</td>
													<td className="px-6 py-4">
														<div className="flex items-center gap-2">
														{channel.is_active ? (
															<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
																<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
																Active
															</span>
														) : (
															<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
																<span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
																Inactive
															</span>
														)}
															{tokenExpiringSoon && tokenExpiryMeta && (
																<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
																	<AlertTriangle size={12} />
																	{tokenExpiryMeta.label}
																</span>
															)}
															{messagingNotReady ? (
																<span
																	className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
																	title={
																		status?.messagingReadinessMessage ||
																		'TikTok messaging scope not detected'
																	}
																>
																	<AlertTriangle size={12} />
																	Messaging not ready
																</span>
															) : null}
														</div>
													</td>
												<td className="px-6 py-4 text-right">
													<button
														onClick={() => handleDisconnect(channel.id)}
														disabled={disconnecting === channel.id}
														className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
													>
														<Trash2 size={14} />
														{disconnecting === channel.id ? 'Removing...' : 'Disconnect'}
													</button>
												</td>
											</tr>
										)
									})}
								</tbody>
								</table>
							</div>
						</div>
					)}
				</div>

				{showConnectModal && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 cursor-pointer"
						onClick={() => {
							if (!connecting) setShowConnectModal(false)
						}}
					>
						<div
							className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto cursor-default"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="p-8 space-y-5">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="leading-none font-semibold tracking-tight flex items-center gap-2 text-gray-900 text-lg">
										<Music2 className="h-5 w-5" />
										Connect TikTok
									</div>
									<div className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
										OAuth Flow
									</div>
								</div>

								<p className="text-sm text-gray-600">
									Connect your TikTok account to send and receive direct messages from Closing AI inbox.
								</p>

								<div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
									<div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
										<h4 className="font-semibold text-amber-900 mb-1">
											TikTok Business Account Required
										</h4>
										<p className="text-amber-800">
											TikTok Business Messaging API only works with TikTok Business Accounts. A regular personal account cannot receive or send messages through this integration.
										</p>
										<p className="mt-3 font-medium text-amber-900">
											How to switch to a Business Account
										</p>
										<ol className="mt-1 space-y-1 list-decimal pl-5 text-amber-800">
											<li>Open the TikTok app and go to your Profile.</li>
											<li>Tap the menu, then open Settings and privacy.</li>
											<li>Go to Account, then choose Switch to Business Account.</li>
											<li>Choose a category and tap Next.</li>
											<li>Come back here and click Continue.</li>
										</ol>
										<p className="mt-2 text-amber-800">
											Switching is free and reversible.
										</p>
									</div>

									<h4 className="font-medium text-gray-900 mb-2">
										Connect with TikTok Login
									</h4>
									<p className="text-sm text-gray-700 mb-4">
										You'll be redirected to TikTok to authorize this workspace.
									</p>
									<ul className="space-y-2 text-sm text-gray-700 mb-5">
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 rounded-full bg-gray-900" />
											Receive and reply to TikTok direct messages
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 rounded-full bg-gray-900" />
											Manage conversations from one inbox
										</li>
									</ul>
									<p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-5">
										Note: TikTok DM inbox requires messaging product/webhook approval from TikTok, not just OAuth login scope.
									</p>
									<div className="flex justify-end gap-3">
										<button
											type="button"
											onClick={() => setShowConnectModal(false)}
											disabled={connecting}
											className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
										>
											Cancel
										</button>
										<button
											type="button"
											onClick={handleConnect}
											disabled={connecting}
											className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-white transition hover:bg-teal-700 disabled:opacity-50"
										>
											<Music2 className="h-4 w-4" />
											{connecting ? 'Continuing...' : 'Continue'}
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
