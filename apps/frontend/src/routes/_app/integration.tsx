import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import PageHeader from '@/components/PageHeader'
import {
	Zap,
	MessageCircle,
	Instagram,
	Music2,
	Facebook,
	Send,
	Bot,
	Globe,
	MessageSquare,
	Plus,
} from 'lucide-react'

export const Route = createFileRoute('/_app/integration')({
	component: IntegrationPage,
})

const channels = [
	{
		id: 'whatsapp',
		name: 'WhatsApp',
		description:
			'Send personalized replies or broadcast messages to hundreds of customers in just a few clicks using WhatsApp.',
		icon: MessageCircle,
		color: 'bg-green-500',
		category: ['all', 'business'],
		active: true,
	},
	{
		id: 'instagram',
		name: 'Instagram',
		description:
			'Easily manage Instagram DMs and story replies from your omnichannel inbox, without opening app.',
		icon: Instagram,
		color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
		category: ['all', 'business'],
		active: true,
	},
	{
		id: 'tiktok',
		name: 'TikTok Direct Message',
		description:
			'Connect your TikTok business account to easily reply to DMs from your omnichannel inbox.',
		icon: Music2,
		color: 'bg-black',
		category: ['all', 'business'],
		active: true,
	},
	{
		id: 'facebook',
		name: 'Facebook',
		description:
			'Manage all your Facebook Page messages efficiently, right from your omnichannel inbox.',
		icon: Facebook,
		color: 'bg-blue-600',
		category: ['all', 'business'],
		active: false,
	},
	{
		id: 'line',
		name: 'LINE',
		description:
			'Connect your LINE Account to manage chats easily from your omnichannel inbox.',
		icon: MessageSquare,
		color: 'bg-green-400',
		category: ['all', 'business'],
		active: false,
	},
	{
		id: 'telegram',
		name: 'Telegram',
		description:
			'Connect your Telegram account and easily manage all conversations from your omnichannel inbox.',
		icon: Send,
		color: 'bg-sky-500',
		category: ['all', 'business'],
		active: false,
	},
	{
		id: 'livechat',
		name: 'Closing AI Live',
		description:
			'Engage customers in real time through a customizable and visually appealing Closing AI Live on your website.',
		icon: MessageCircle,
		color: 'bg-emerald-500',
		category: ['all', 'livechat'],
		active: false,
	},
	{
		id: 'custom',
		name: 'Custom Channel',
		description:
			'Build a custom channel that fits your needs—like Tokopedia, Shopee, Email, and more.',
		icon: Globe,
		color: 'bg-teal-500',
		category: ['all', 'other'],
		active: false,
	},
	{
		id: 'bot',
		name: 'Bot Integration',
		description:
			'Enable and manage bots to assist with customer inquiries across all your connected channel.',
		icon: Bot,
		color: 'bg-violet-500',
		category: ['all', 'other'],
		active: false,
	},
]

function IntegrationPage() {
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState('all')

	const filteredChannels = channels.filter((ch) =>
		ch.category.includes(activeTab),
	)

	const handleChannelClick = (channel: (typeof channels)[0]) => {
		if (!channel.active) return
		navigate({
			to: `/channels/${channel.id}`,
		} as any)
	}

	const actions = (
		<div className="flex bg-gray-100 p-1 rounded-lg">
			{[
				{ id: 'all', label: 'All Channels' },
				{ id: 'business', label: 'Business' },
				{ id: 'livechat', label: 'Live Chat' },
				{ id: 'other', label: 'Other' },
			].map((tab) => (
				<button
					key={tab.id}
					onClick={() => setActiveTab(tab.id)}
					className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
						activeTab === tab.id
							? 'bg-white text-gray-950 shadow-sm'
							: 'text-gray-500 hover:text-gray-700'
					}`}
				>
					{tab.label}
				</button>
			))}
		</div>
	)

	return (
		<div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
			<PageHeader
				title="Connect Channels"
				description="Integrate your social media and messaging accounts to manage all conversations in one place"
				icon={<Zap size={24} />}
				actions={actions}
			/>

			<div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-10">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
					{filteredChannels.map((channel) => (
						<div
							key={channel.id}
							onClick={() => handleChannelClick(channel)}
							className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col ${channel.active ? 'hover:shadow-md transition-all cursor-pointer group' : 'opacity-80 grayscale-[0.2]'}`}
						>
							<div className="flex items-center justify-between mb-6">
								<div
									className={`w-14 h-14 rounded-2xl ${channel.color} flex items-center justify-center text-white shadow-lg shadow-black/5 ${!channel.active ? 'opacity-50 grayscale' : ''}`}
								>
									<channel.icon size={28} />
								</div>
								<div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border transition-colors ${channel.active ? 'bg-gray-50 text-gray-400 border-gray-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100' : 'text-amber-500 bg-amber-50 border-amber-100'}`}>
									{channel.active ? 'Setup Required' : 'Coming Soon'}
								</div>
							</div>

							<h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
								{channel.name}
							</h3>
							<p className="text-sm text-gray-500 leading-relaxed mb-8 flex-1">
								{channel.description}
							</p>

							<div className="flex items-center justify-between pt-4 border-t border-gray-50">
								<span className={`text-xs font-bold transition-colors ${channel.active ? 'text-gray-400 group-hover:text-emerald-500' : 'text-gray-300'}`}>
									Configure Channel
								</span>
								<div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${channel.active ? 'bg-gray-50 text-gray-400 group-hover:bg-emerald-500 group-hover:text-white transform group-hover:translate-x-1' : 'bg-gray-50 text-gray-300'}`}>
									<Plus size={16} />
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
