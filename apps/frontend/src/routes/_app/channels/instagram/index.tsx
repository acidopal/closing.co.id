import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
	Instagram,
	Search,
	Plus,
	ChevronLeft,
	AlertTriangle,
	Trash2,
} from 'lucide-react'
import { API_BASE } from '@/lib/api'

export const Route = createFileRoute('/_app/channels/instagram/')({
	component: InstagramChannelsPage,
})

interface InstagramChannel {
	id: string
	name: string
	is_active: boolean
	channel_config: {
		username?: string
		profile_picture_url?: string
		instagram_id?: string
		fb_page_id?: string
		token_expires_at?: string
		[key: string]: any
	}
	created_at: string
}

interface ChannelStatus {
	daysUntilTokenExpiry?: number
	tokenExpiresAt?: string
	connectionStatus?: string
}

const getInstagramConnectionErrorMessage = (payload: {
	reason?: string
	message?: string
}) => {
	if (payload.message) return payload.message

	if (payload.reason === 'authorization_code_used') {
		return 'This Instagram login link was already used or expired. Please click Connect Instagram again.'
	}

	if (payload.reason === 'missing_code_or_state') {
		return 'Instagram did not return a valid authorization code. Please try again.'
	}

	if (payload.reason && /authorization code has been used/i.test(payload.reason)) {
		return 'This Instagram login link was already used or expired. Please click Connect Instagram again.'
	}

	return payload.reason || 'Unknown error'
}

function InstagramChannelsPage() {
	const routeParams = Route.useParams({ strict: false }) as {
		appId?: string
	}
	const appId =
		routeParams.appId ||
		(typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_org_slug') || ''
			: '')

	const [channels, setChannels] = useState<InstagramChannel[]>([])
	const [channelStatuses, setChannelStatuses] = useState<Record<string, ChannelStatus>>({})
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

	const loadChannels = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE}/instagram-channels`, {
				headers: getApiHeaders(),
			})
			const data = await res.json()
			const list: InstagramChannel[] = data.data || []
			setChannels(list)

			// Fetch token status for each channel
			for (const ch of list) {
				fetchChannelStatus(ch.id)
			}
		} catch (error) {
			console.error('Failed to load Instagram channels:', error)
		} finally {
			setLoading(false)
		}
	}, [getApiHeaders])

	const fetchChannelStatus = async (channelId: string) => {
		try {
			const res = await fetch(`${API_BASE}/instagram-channels/${channelId}/status`, {
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
	}

	useEffect(() => {
		void loadChannels()
	}, [loadChannels])

	// Listen for postMessage events from OAuth popup
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === 'INSTAGRAM_CONNECTED') {
				setShowConnectModal(false)
				setConnecting(false)
				popupRef.current?.close()
				void loadChannels()
			}

			if (event.data?.type === 'IG_ERROR') {
				const reason = getInstagramConnectionErrorMessage({
					reason: event.data.reason,
					message: event.data.message,
				})
				setConnecting(false)
				setShowConnectModal(false)
				popupRef.current?.close()
				alert(`Instagram connection failed: ${reason}`)
			}
		}

		window.addEventListener('message', handleMessage)
		return () => window.removeEventListener('message', handleMessage)
	}, [loadChannels])

	const handleConnect = async () => {
		setConnecting(true)
		try {
			const res = await fetch(`${API_BASE}/instagram-channels/init-login`, {
				method: 'POST',
				headers: getApiHeaders(true),
			})
			const data = await res.json()

			if (data.data?.loginUrl) {
				const width = 600
				const height = 700
				const left = window.screenX + (window.outerWidth - width) / 2
				const top = window.screenY + (window.outerHeight - height) / 2

				const popup = window.open(
					data.data.loginUrl,
					'instagram-login',
					`width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`,
				)
				popupRef.current = popup

				// Monitor popup close
				const checkClosed = setInterval(() => {
					if (popup?.closed) {
						clearInterval(checkClosed)
						setTimeout(() => {
							setConnecting(false)
						}, 500)
					}
				}, 1000)
			} else {
				alert('Failed to initiate login. Please try again.')
				setConnecting(false)
				setShowConnectModal(false)
			}
		} catch (error) {
			console.error('Failed to connect:', error)
			alert('Connection failed')
			setConnecting(false)
			setShowConnectModal(false)
		}
	}

	const handleDisconnect = async (channelId: string) => {
		if (!confirm('Are you sure you want to disconnect this Instagram account?')) return

		setDisconnecting(channelId)
		try {
			await fetch(`${API_BASE}/instagram-channels/${channelId}`, {
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
			console.error('Failed to disconnect channel:', error)
			alert('Failed to disconnect account')
		} finally {
			setDisconnecting(null)
		}
	}

	const filteredChannels = channels.filter((ch) => {
		const username = ch.channel_config?.username || ch.name || ''
		return username.toLowerCase().includes(searchQuery.toLowerCase())
	})

	return (
		<div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Header */}
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
						<div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
							<Instagram className="text-white" size={18} />
						</div>
						<h1 className="text-2xl font-bold text-gray-900">Instagram</h1>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 pt-3">
					{/* Info Banner */}
						<div className="bg-purple-50 border border-purple-200 dark:bg-purple-950/25 dark:border-purple-900/40 rounded-lg p-4 mb-6">
							<p className="text-sm text-gray-700 dark:text-purple-100/90">
								Connect your Instagram Professional account to receive and manage Direct Messages.
								You need a Business or Creator account linked to a Facebook Page.
							</p>
					</div>

					{/* Search and Add */}
					<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="relative w-full sm:max-w-sm">
							<Search
								className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								size={18}
							/>
							<input
								type='text'
								placeholder="Search by username"
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
							Connect Instagram
						</button>
					</div>

					{/* Table */}
					{loading ? (
						<div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
							Loading channels...
						</div>
					) : filteredChannels.length === 0 ? (
						<div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 transition-all duration-300 hover:border-pink-500/30">
							<div className="flex flex-col items-center justify-center text-center">
								<Instagram className="text-gray-400 mb-4 h-12 w-12" />
								<h3 className="mb-2 text-lg font-semibold text-gray-900">
									No channels found
								</h3>
								<p className="text-muted-foreground mb-6 text-center text-sm max-w-sm">
									{searchQuery
										? `We couldn't find any Instagram accounts matching "${searchQuery}"`
										: 'Connect your first Instagram Professional account to start managing DMs.'}
								</p>
								{!searchQuery && (
									<button
										onClick={() => setShowConnectModal(true)}
										className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium shadow-sm"
									>
										<Plus size={18} />
										Connect Instagram
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
											Instagram Account
										</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
											Username
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
										const tokenExpiringSoon = status?.daysUntilTokenExpiry != null && status.daysUntilTokenExpiry < 7

										return (
											<tr
												key={channel.id}
												className="border-b border-gray-100 hover:bg-gray-50 group/row"
											>
												<td className='px-6 py-4'>
													<Link
														to="/channels/instagram/$inboxId"
														params={{ inboxId: channel.id }}
														className='flex items-center gap-3 group'
													>
														<div className='shrink-0'>
															{channel.channel_config?.profile_picture_url ? (
																<img
																	src={channel.channel_config.profile_picture_url}
																	alt={channel.channel_config?.username || channel.name}
																	className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm transition-transform group-hover:scale-105"
																/>
															) : (
																<div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-100 to-pink-100 flex items-center justify-center hover:from-purple-200 hover:to-pink-200 transition-colors shadow-sm">
																	<Instagram
																		className='text-pink-600'
																		size={20}
																	/>
																</div>
															)}
														</div>
														<div className='flex flex-col'>
															<span className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
																{channel.name}
															</span>
															<span className="text-xs text-gray-400 font-mono mt-0.5">
																{channel.id.substring(0, 8)}
															</span>
														</div>
													</Link>
												</td>
												<td className='px-6 py-4'>
													<span className="text-sm text-gray-600">
														{channel.channel_config?.username
															? '@${channel.channel_config.username}'
															: 'N/A'}
													</span>
												</td>
												<td className='px-6 py-4'>
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
														{tokenExpiringSoon && (
															<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
																<AlertTriangle size={12} />
																Token expires in {status.daysUntilTokenExpiry}d
															</span>
														)}
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

				{/* Connect Modal */}
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
										<Instagram className="h-5 w-5 text-pink-600" />
										Connect Instagram
									</div>
									<div className="inline-flex items-center rounded-md border border-purple-500 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
										OAuth Flow
									</div>
								</div>

								<p className="text-sm text-gray-600">
									Connect your Instagram Professional (Business or Creator) account to manage DMs.
								</p>

								<div className="rounded-lg border border-purple-200 bg-purple-50 p-5">
									<h4 className="font-medium text-gray-900 mb-2">
										Connect with Facebook Login
									</h4>
									<p className="text-sm text-gray-700 mb-4">
										You'll be redirected to Facebook to authorize access to your Instagram Professional account.
									</p>
									<ul className="space-y-2 text-sm text-purple-800 mb-5">
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
											Receive and reply to Instagram Direct Messages
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
											Send images, videos, and audio messages
										</li>
										<li className="flex items-center gap-2">
											<span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
											View conversation history
										</li>
									</ul>
									<div className="flex justify-end gap-3">
										<button
											type='button'
											onClick={() => setShowConnectModal(false)}
											disabled={connecting}
											className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
										>
											Cancel
										</button>
										<button
											type='button'
											onClick={handleConnect}
											disabled={connecting}
											className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-white transition hover:bg-teal-700 disabled:opacity-50"
										>
											<Instagram className='h-4 w-4' />
											{connecting ? 'Connecting...' : 'Connect Instagram'}
										</button>
									</div>
								</div>

								<div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-600">
									<strong>Requirements:</strong> You need an Instagram Professional account
									(Business or Creator) linked to a Facebook Page. Personal accounts are not
									supported by Instagram's Messaging API.
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
