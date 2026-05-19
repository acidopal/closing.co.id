import {
	createFileRoute,
	Link,
	Outlet,
	useMatches,
	useNavigate,
} from '@tanstack/react-router'
import {
	Check,
	ChevronLeft,
	Copy,
	Eye,
	EyeOff,
	ExternalLink,
	Key,
	MessageCircle,
	Plus,
	Search,
	ShieldCheck,
	Webhook,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { API_BASE } from '@/lib/api'

export const Route = createFileRoute('/_app/channels/whatsapp')({
	component: WhatsAppChannelsLayout,
})

interface Inbox {
	id: string
	name: string
	phone_number: string
	channel_tag: string
	is_active: boolean
	business_name: string
	badge_url?: string
	extended_metadata?: {
		tags?: string[]
		profile_picture_url?: string
		[key: string]: any
	}
}

function WhatsAppChannelsLayout() {
	const routeParams = Route.useParams({ strict: false }) as {
		appId?: string
		lang?: string
	}
	const appId =
		routeParams.appId ||
		(typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_org_slug') || ''
			: '')
	const lang = routeParams.lang || 'en'
	const navigate = useNavigate()
	const matches = useMatches()

	// Check if we are rendering a child route (detail or success)
	const isDetailMode = matches.some(
		(m) => m.routeId.endsWith('$channelId') || m.routeId.endsWith('success'),
	)

	const [channels, setChannels] = useState<Inbox[]>([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [showConnectModal, setShowConnectModal] = useState(false)
	const [connecting, setConnecting] = useState(false)
	const [connectTab, setConnectTab] = useState<'embedded' | 'manual'>(
		'embedded',
	)
	const [manualAccessToken, setManualAccessToken] = useState('')
	const [manualWabaId, setManualWabaId] = useState('')
	const [showAccessToken, setShowAccessToken] = useState(false)
	const [manualConnected, setManualConnected] = useState(false)
	const [connectedChannelId, setConnectedChannelId] = useState<string | null>(
		null,
	)
	const [webhookConfig, setWebhookConfig] = useState<{
		callbackUrl: string
		verifyToken: string
	} | null>(null)
	const [copiedField, setCopiedField] = useState<'callback' | 'token' | null>(
		null,
	)

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
			const res = await fetch(`${API_BASE}/whatsapp-channels`, {
				headers: getApiHeaders(),
			})
			const data = await res.json()
			setChannels(data.data || [])
		} catch (error) {
			console.error('Failed to load channels:', error)
		} finally {
			setLoading(false)
		}
	}, [getApiHeaders])

	useEffect(() => {
		if (!isDetailMode) {
			void loadChannels()
		}
	}, [isDetailMode, loadChannels])

	const toggleChannel = async (id: string) => {
		try {
			await fetch(`${API_BASE}/whatsapp-channels/${id}/toggle`, {
				method: 'POST',
				headers: getApiHeaders(),
			})
			loadChannels()
		} catch (error) {
			console.error('Failed to toggle channel:', error)
		}
	}

	const navigateToChannel = useCallback(
		(channelId: string) => {
			navigate({
				to: '/channels/whatsapp/$channelId',
				params: { channelId },
			})
		},
		[navigate],
	)

	const handleConnect = async () => {
		setConnecting(true)
		try {
			const res = await fetch(`${API_BASE}/whatsapp-channels/init-signup`, {
				method: 'POST',
				headers: getApiHeaders(true),
				body: JSON.stringify({ lang }),
			})
			const data = await res.json()

			if (data.data && data.data.signupUrl) {
				const width = 600
				const height = 700
				const left = window.screenX + (window.outerWidth - width) / 2
				const top = window.screenY + (window.outerHeight - height) / 2

				const popup = window.open(
					data.data.signupUrl,
					'MetaWhatsAppSignup',
					`width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`,
				)

				const handleMessage = (event: MessageEvent) => {
					if (
						event.data?.type === 'WA_CONNECTED' ||
						event.data?.type === 'WA_SUCCESS'
					) {
						const channelId = event.data.channelId
						window.removeEventListener('message', handleMessage)
						setConnecting(false)
						setShowConnectModal(false)
						navigateToChannel(channelId)
					}

					if (event.data?.type === 'WA_ERROR') {
						const reason = event.data.reason
						window.removeEventListener('message', handleMessage)
						setConnecting(false)
						alert(`Connection failed: ${reason}`)
					}
				}

				window.addEventListener('message', handleMessage)

				const checkClosed = setInterval(() => {
					if (popup?.closed) {
						clearInterval(checkClosed)
						setTimeout(() => {
							window.removeEventListener('message', handleMessage)
							setConnecting(false)
						}, 500)
					}
				}, 1000)
			} else {
				alert('Failed to initiate signup. Please try again.')
				setConnecting(false)
			}
		} catch (error) {
			console.error('Failed to connect:', error)
			alert('Connection failed')
			setConnecting(false)
		} finally {
			setShowConnectModal(false)
		}
	}

	const handleManualConnect = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		const accessToken = manualAccessToken.trim()
		const wabaId = manualWabaId.trim()

		if (!accessToken || !wabaId) {
			alert('Access Token and WABA ID are required.')
			return
		}

		setConnecting(true)
		try {
			const res = await fetch(`${API_BASE}/waba/connect/manual`, {
				method: 'POST',
				headers: getApiHeaders(true),
				body: JSON.stringify({ accessToken, wabaId }),
			})
			const data = await res.json()

			if (!res.ok || !data?.success) {
				throw new Error(data?.error || 'Failed to connect WhatsApp manually')
			}

			const channelId =
				data?.data?.primaryChannelId || data?.data?.channels?.[0]?.id
			if (!channelId) {
				throw new Error('No WhatsApp channel was created from this WABA')
			}

			setManualConnected(true)
			setConnectedChannelId(channelId)
			setWebhookConfig(
				data?.data?.webhook
					? {
							callbackUrl: data.data.webhook.callbackUrl,
							verifyToken: data.data.webhook.verifyToken,
						}
					: null,
			)
			setManualAccessToken('')
			setManualWabaId('')
			setShowAccessToken(false)
			setCopiedField(null)
		} catch (error: any) {
			console.error('Failed to connect manually:', error)
			alert(error?.message || 'Manual connection failed')
		} finally {
			setConnecting(false)
		}
	}

	const copyValue = async (
		value: string,
		field: 'callback' | 'token',
	) => {
		try {
			await navigator.clipboard.writeText(value)
			setCopiedField(field)
			setTimeout(() => {
				setCopiedField((current) => (current === field ? null : current))
			}, 2000)
		} catch (error) {
			console.error('Failed to copy value:', error)
			alert('Failed to copy. Please copy manually.')
		}
	}

	const continueAfterWebhookSetup = () => {
		setShowConnectModal(false)
		void loadChannels()
		if (connectedChannelId) {
			navigateToChannel(connectedChannelId)
		}
	}

	const openConnectModal = () => {
		setConnectTab('embedded')
		setManualAccessToken('')
		setManualWabaId('')
		setShowAccessToken(false)
		setManualConnected(false)
		setConnectedChannelId(null)
		setWebhookConfig(null)
		setCopiedField(null)
		setShowConnectModal(true)
	}

	const closeConnectModal = () => {
		if (connecting) return
		setShowConnectModal(false)
		setConnectTab('embedded')
		setShowAccessToken(false)
		setManualAccessToken('')
		setManualWabaId('')
		setManualConnected(false)
		setConnectedChannelId(null)
		setWebhookConfig(null)
		setCopiedField(null)
	}

	// If we are in detail mode, just render the child route
	if (isDetailMode) {
		return <Outlet />
	}

	const filteredChannels = channels.filter(
		(ch) =>
			(ch.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
			ch.phone_number?.includes(searchQuery),
	)

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
						<div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
							<MessageCircle className="text-white" size={18} />
						</div>
						<h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 pt-3">
					{/* Info Banner */}
						<div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40 rounded-lg p-4 mb-6">
							<p className="text-sm text-gray-700 dark:text-emerald-100/90">
								To learn more about WhatsApp Integration, you can refer to this{' '}
								<a
									href="https://docs.kirim.chat/connect-whatsapp"
									target='_blank'
									rel="noopener noreferrer"
									className="text-teal-600 dark:text-teal-300 hover:underline"
								>
									Documentation
								</a>
							.
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
								placeholder="Search channel name"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
							/>
						</div>
						<button
							onClick={openConnectModal}
							className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-teal-600 px-4 py-2 text-white transition hover:bg-teal-700 sm:w-auto"
						>
							<Plus size={18} />
							New Integration
						</button>
					</div>

					{/* Table */}
					{loading ? (
						<div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
							Loading channels...
						</div>
					) : filteredChannels.length === 0 ? (
						<div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 transition-all duration-300 hover:border-emerald-500/30">
							<div className="flex flex-col items-center justify-center text-center">
								<MessageCircle className="text-gray-400 mb-4 h-12 w-12" />
								<h3 className="mb-2 text-lg font-semibold text-gray-900">
									No channels found
								</h3>
								<p className="text-muted-foreground mb-6 text-center text-sm max-w-sm">
									{searchQuery
										? `We couldn't find any WhatsApp accounts matching "${searchQuery}"`
										: 'Connect your first WhatsApp Business account to start messaging.'}
								</p>
								{!searchQuery && (
									<button
										onClick={openConnectModal}
										className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium shadow-sm"
									>
										<Plus size={18} />
										New Integration
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
											WhatsApp Account
										</th>
										<th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
											Phone Number
										</th>
										<th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
											Action
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredChannels.map((channel) => (
										<tr
											key={channel.id}
											className="border-b border-gray-100 hover:bg-gray-50 group/row"
										>
											<td className='px-6 py-4'>
												<Link
													to="/channels/whatsapp/$channelId"
													params={{ channelId: channel.id }}
													className="flex items-start gap-3 group"
												>
													<div className='shrink-0 mt-0.5'>
														{channel.badge_url ||
														channel.extended_metadata?.profile_picture_url ? (
															<img
																src={
																	channel.badge_url ||
																	channel.extended_metadata?.profile_picture_url
																}
																alt={channel.name}
																className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm transition-transform group-hover:scale-105"
															/>
														) : (
															<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-600 transition-colors shadow-sm">
																<MessageCircle
																	className="text-green-600 group-hover:text-white transition-colors"
																	size={20}
																/>
															</div>
														)}
													</div>
													<div className='flex flex-col'>
														<span className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors flex items-center gap-1.5">
															{channel.name}
															<ExternalLink
																size={12}
																className="opacity-0 group-hover:opacity-100 transition-opacity"
															/>
														</span>

														{/* Tags Display */}
														{channel.extended_metadata?.tags &&
														channel.extended_metadata.tags.length > 0 ? (
															<div className='flex flex-wrap gap-1 mt-1'>
																{channel.extended_metadata.tags
																	.slice(0, 3)
																	.map((tag: string, i: number) => (
																		<span
																			key={i}
																			className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200"
																		>
																			{tag}
																		</span>
																	))}
																{channel.extended_metadata.tags.length > 3 && (
																	<span className="text-[10px] text-gray-400 self-center">
																		+{channel.extended_metadata.tags.length - 3}
																	</span>
																)}
															</div>
														) : (
															<span className="text-xs text-gray-400 font-mono mt-0.5">
																{channel.id.substring(0, 8)}
															</span>
														)}
													</div>
												</Link>
											</td>
											<td className='px-6 py-4'>
												<span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 font-medium">
													{channel.phone_number || 'No Number'}
												</span>
											</td>
											<td className="px-6 py-4 text-right">
												<button
													onClick={() => toggleChannel(channel.id)}
													className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
														channel.is_active ? 'bg-teal-500' : 'bg-gray-300'
													}`}
												>
													<span
														className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
															channel.is_active
																? 'translate-x-6'
																: 'translate-x-1'
														}`}
													/>
												</button>
											</td>
										</tr>
									))}
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
						onClick={closeConnectModal}
					>
						<div
							className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto cursor-default"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="p-8 space-y-5">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="leading-none font-semibold tracking-tight flex items-center gap-2 text-gray-900 text-lg">
										<MessageCircle className="h-5 w-5 text-emerald-600" />
										Connect WhatsApp Business
									</div>
									<div className="inline-flex items-center rounded-md border border-emerald-500 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
										<ShieldCheck className="mr-1 h-3 w-3" />
										Official Meta API
									</div>
								</div>

								<p className="text-sm text-gray-600">
									Set up your WhatsApp Business Account to start messaging.
								</p>

								<div className="grid w-full grid-cols-2 rounded-lg bg-gray-100 p-1">
									<button
										type='button'
										onClick={() => setConnectTab('embedded')}
										disabled={connecting}
										className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
											connectTab === 'embedded'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-500 hover:text-gray-700'
										}`}
									>
										<MessageCircle className="h-4 w-4" />
										Embedded Signup
									</button>
									<button
										type='button'
										onClick={() => setConnectTab('manual')}
										disabled={connecting}
										className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
											connectTab === 'manual'
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-500 hover:text-gray-700'
										}`}
									>
										<Key className='h-4 w-4' />
										Manual Token
									</button>
								</div>

								{connectTab === 'embedded' ? (
									<div className="rounded-lg border border-green-200 bg-green-50 p-5">
										<h4 className="font-medium text-gray-900 mb-2">
											Connect with Meta Embedded Signup
										</h4>
										<p className="text-sm text-gray-700 mb-4">
											Recommended for most users. You can connect an existing
											WhatsApp Business number or create a new one with
											Coexistence support.
										</p>
										<ul className="space-y-2 text-sm text-green-800 mb-5">
											<li className="flex items-center gap-2">
												<span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
												Official and secure Meta OAuth flow
											</li>
											<li className="flex items-center gap-2">
												<span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
												Auto-discovery of WABA and phone numbers
											</li>
										</ul>
										<div className="flex justify-end gap-3">
											<button
												type='button'
												onClick={closeConnectModal}
												className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
											>
												Cancel
											</button>
											<button
												type='button'
												onClick={handleConnect}
												disabled={connecting}
												className="flex items-center gap-2 rounded-lg bg-green-500 px-5 py-2 text-white transition hover:bg-green-600 disabled:opacity-50"
											>
												<MessageCircle className="h-4 w-4" />
												{connecting ? 'Connecting...' : 'Connect WhatsApp'}
											</button>
										</div>
									</div>
								) : (
									<div className='space-y-4'>
										<div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4">
											<div className="flex items-start gap-3">
												<div className="rounded-full bg-blue-100 p-2">
													<Key className="h-5 w-5 text-blue-600" />
												</div>
												<div className='flex-1'>
													<h4 className="text-sm font-medium text-blue-900">
														Manual Token Connection
													</h4>
													<p className="mt-1 text-xs text-blue-800/90">
														Connect using your own Access Token and WABA ID.
														Ideal for developer setup or migration from another
														platform.
													</p>
													<a
														href="https://docs.kirim.chat/connect-whatsapp#koneksi-manual-dengan-access-token"
														target='_blank'
														rel='noopener noreferrer'
														className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
													>
														Learn how to get Access Token and WABA ID
														<ExternalLink className='h-3 w-3' />
													</a>
												</div>
											</div>
										</div>

										{manualConnected ? (
											<div className='space-y-4'>
												<div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
													<div className="flex items-center gap-2">
														<Check className="h-4 w-4 text-emerald-600" />
														WhatsApp Business Account connected successfully!
													</div>
												</div>

												<div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4">
													<div className="flex items-start gap-3">
														<div className="rounded-full bg-blue-100 p-2">
															<Webhook className='h-5 w-5 text-blue-600' />
														</div>
														<div className='flex-1 space-y-3'>
															<div>
																<h4 className="text-sm font-medium text-blue-900">
																	Configure Webhook in Meta Developer Console
																</h4>
																<p className='mt-1 text-xs text-blue-700'>
																	Copy these values and paste them in your Meta
																	App's WhatsApp webhook configuration.
																</p>
															</div>

															<div className='space-y-3'>
																<div>
																	<label className="text-xs font-medium text-blue-800">
																		Callback URL
																	</label>
																	<div className='mt-1 flex items-center gap-2'>
																		<input
																			readOnly
																			value={webhookConfig?.callbackUrl || '-'}
																			className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-xs font-mono text-gray-700"
																		/>
																		<button
																			type='button'
																			onClick={() =>
																				webhookConfig?.callbackUrl &&
																				copyValue(
																					webhookConfig.callbackUrl,
																					'callback',
																				)
																			}
																			disabled={!webhookConfig?.callbackUrl}
																			className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
																		>
																			{copiedField === 'callback' ? (
																				<Check className='h-4 w-4 text-emerald-600' />
																			) : (
																				<Copy className='h-4 w-4' />
																			)}
																		</button>
																	</div>
																</div>

																<div>
																	<label className="text-xs font-medium text-blue-800">
																		Verify Token
																	</label>
																	<div className='mt-1 flex items-center gap-2'>
																		<input
																			readOnly
																			value={webhookConfig?.verifyToken || '-'}
																			className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-xs font-mono text-gray-700"
																		/>
																		<button
																			type='button'
																			onClick={() =>
																				webhookConfig?.verifyToken &&
																				copyValue(webhookConfig.verifyToken, 'token')
																			}
																			disabled={!webhookConfig?.verifyToken}
																			className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
																		>
																			{copiedField === 'token' ? (
																				<Check className='h-4 w-4 text-emerald-600' />
																			) : (
																				<Copy className='h-4 w-4' />
																			)}
																		</button>
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>

												<div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
													<p className='text-xs text-gray-600'>
														<strong>Note:</strong> Go to Meta Developer Console &gt;
														Your App &gt; WhatsApp &gt; Configuration &gt; Webhook.
														Paste the Callback URL and Verify Token, then subscribe
														to messages.
													</p>
												</div>

												<button
													type='button'
													onClick={continueAfterWebhookSetup}
													className="inline-flex h-10 w-full items-center justify-center rounded-md bg-green-500 px-4 text-sm font-medium text-white transition hover:bg-green-600"
												>
													Continue to Dashboard
												</button>
											</div>
										) : (
											<form onSubmit={handleManualConnect} className="space-y-4">
												<div className='space-y-2'>
													<label
														htmlFor='accessToken'
														className="text-sm font-medium text-gray-900"
													>
														Access Token *
													</label>
													<div className='relative'>
														<input
															id='accessToken'
															type={showAccessToken ? 'text' : 'password'}
															value={manualAccessToken}
															onChange={(event) =>
																setManualAccessToken(event.target.value)
															}
															placeholder="Enter your WhatsApp Business API access token"
															autoComplete='off'
															className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 pr-10 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
														/>
														<button
															type='button'
															onClick={() => setShowAccessToken((value) => !value)}
															className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
														>
															{showAccessToken ? (
																<EyeOff className='h-4 w-4' />
															) : (
																<Eye className='h-4 w-4' />
															)}
														</button>
													</div>
													<p className='text-xs text-gray-500'>
														System User token from Meta Business Suite or Developer
														Console.
													</p>
												</div>

												<div className='space-y-2'>
													<label
														htmlFor='wabaId'
														className="text-sm font-medium text-gray-900"
													>
														WABA ID *
													</label>
													<input
														id='wabaId'
														type='text'
														value={manualWabaId}
														onChange={(event) =>
															setManualWabaId(event.target.value)
														}
														placeholder='e.g. 123456789012345'
														autoComplete='off'
														className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
													/>
													<p className='text-xs text-gray-500'>
														WhatsApp Business Account ID from Meta Developer Console.
													</p>
												</div>

												<div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
													<p className='text-xs text-gray-600'>
														<strong>Note:</strong> Token harus punya permission{' '}
														<code>whatsapp_business_management</code> dan{' '}
														<code>whatsapp_business_messaging</code>.
													</p>
												</div>

												<div className="flex justify-end gap-3">
													<button
														type='button'
														onClick={closeConnectModal}
														className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
													>
														Cancel
													</button>
													<button
														type='submit'
														disabled={
															connecting ||
															!manualAccessToken.trim() ||
															!manualWabaId.trim()
														}
														className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-white transition hover:bg-teal-700 disabled:opacity-50"
													>
														<MessageCircle className='h-4 w-4' />
														{connecting ? 'Connecting...' : 'Connect WhatsApp'}
													</button>
												</div>
											</form>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
