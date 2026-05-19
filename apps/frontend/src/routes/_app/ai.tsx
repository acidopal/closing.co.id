import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
	Bot,
	FileText,
	Settings,
	HelpCircle,
	AlertCircle,
	Save,
	Plus,
	Upload,
	User,
	Ban,
	Search,
	Clock,
	Copy,
	Trash2,
	Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/PageHeader'

export const Route = createFileRoute('/_app/ai')({
	component: AiAutoReplyPage,
})

type Tab = 'agents' | 'filters' | 'help'

interface AIAgent {
	id: string
	name: string
	description: string
	model: string
	prompt?: string
	is_hidden?: boolean
	is_deleted?: boolean
	created_at?: string
	updated_at?: string
}

function AiAutoReplyPage() {
	const routeParams = Route.useParams({ strict: false }) as { appId?: string }
	const appId =
		routeParams.appId ||
		(typeof localStorage !== 'undefined'
			? localStorage.getItem('scalechat_app_id') ||
				localStorage.getItem('scalechat_org_slug') ||
				''
			: '')
	const [activeTab, setActiveTab] = useState<Tab>('agents')

	// Data states
	const [aiAgents, setAiAgents] = useState<AIAgent[]>([])
	const [aiAgentsLoading, setAiAgentsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [newAgentData, setNewAgentData] = useState({
		name: '',
		description: '',
	})
	const [creatingAgent, setCreatingAgent] = useState(false)

	const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3010'
	const token = localStorage.getItem('scalechat_token')

	useEffect(() => {
		fetchAiAgents()
	}, [appId])

	const fetchAiAgents = async () => {
		setAiAgentsLoading(true)
		try {
			const res = await fetch(`${API_URL}/api/chatbots`, {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await res.json()
			if (data.data) {
				setAiAgents(data.data.filter((a: AIAgent) => !a.is_deleted))
			}
		} catch (error) {
			console.error('Failed to fetch AI agents:', error)
		} finally {
			setAiAgentsLoading(false)
		}
	}

	const handleCreateAgent = async () => {
		if (!newAgentData.name) {
			toast.error('Agent name is required')
			return
		}

		setCreatingAgent(true)
		try {
			const res = await fetch(`${API_URL}/api/chatbots`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					app_id: appId,
					...newAgentData,
				}),
			})

			if (res.ok) {
				toast.success('AI Agent created successfully')
				setShowCreateModal(false)
				setNewAgentData({ name: '', description: '' })
				fetchAiAgents()
			} else {
				toast.error('Failed to create agent')
			}
		} catch (error) {
			toast.error('Creation failed')
		} finally {
			setCreatingAgent(false)
		}
	}

	const handleCloneAgent = async (agent: AIAgent) => {
		try {
			const res = await fetch(`${API_URL}/api/chatbots/${agent.id}/clone`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				toast.success(`Agent "${agent.name}" cloned successfully`)
				fetchAiAgents()
			} else {
				toast.error('Failed to clone agent')
			}
		} catch (error) {
			toast.error('Clone failed')
		}
	}

	const handleDeleteAgent = async (agent: AIAgent) => {
		if (
			!confirm(
				`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`,
			)
		)
			return
		try {
			const res = await fetch(`${API_URL}/api/chatbots/${agent.id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			})
			if (res.ok) {
				toast.success(`Agent "${agent.name}" deleted`)
				setAiAgents(aiAgents.filter((a) => a.id !== agent.id))
			} else {
				toast.error('Failed to delete agent')
			}
		} catch (error) {
			toast.error('Delete failed')
		}
	}

	const filteredAiAgents = aiAgents.filter(
		(agent) =>
			agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(agent.description &&
				agent.description.toLowerCase().includes(searchQuery.toLowerCase())),
	)

	return (
		<div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
			<PageHeader
				title="AI Auto-Reply"
				description="Configure your AI assistant to handle customer inquiries automatically"
				icon={<Bot size={24} />}
				className="mb-0"
				tabs={
					<div className="inline-flex w-full rounded-xl border border-gray-200 bg-white p-1 shadow-sm sm:w-auto">
						<button
							type="button"
							onClick={() => setActiveTab('agents')}
							className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
								activeTab === 'agents'
									? 'bg-emerald-100 text-emerald-800'
									: 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							<User size={15} />
							Agents
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('filters')}
							className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
								activeTab === 'filters'
									? 'bg-emerald-100 text-emerald-800'
									: 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							<Ban size={15} />
							Filters
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('help')}
							className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
								activeTab === 'help'
									? 'bg-emerald-100 text-emerald-800'
									: 'text-gray-600 hover:bg-gray-100'
							}`}
						>
							<HelpCircle size={15} />
							Help
						</button>
					</div>
				}
			/>

			<div className="flex-1 overflow-y-auto px-4 pb-8 lg:px-8">
				<div className="mt-4">
					<div className={activeTab === 'agents' ? '' : 'max-w-4xl mx-auto'}>
						{activeTab === 'agents' && (
							<div className="space-y-8">
								{/* Header Section */}
								<div className="flex flex-col items-center justify-center gap-4 text-center px-4">
									<h2 className="text-2xl lg:text-4xl font-bold text-gray-900">
										AI Agents
									</h2>
									<p className="text-gray-600 text-sm lg:text-base">
										Ini adalah halaman di mana Anda dapat mengunjungi AI yang
										telah Anda buat sebelumnya.
										<br className="hidden lg:block" />
										Jangan ragu untuk membuat perubahan dan membuat chatbot
										sebanyak yang Anda inginkan kapan saja!
									</p>
								</div>

								{/* Search & Filter Bar */}
								<div className="flex flex-col items-center justify-center gap-4 w-full px-4 lg:px-0">
									<div className="flex items-center gap-2 lg:gap-4 w-full lg:w-auto">
										<div className="relative flex-1 lg:flex-none">
											<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
												<Search className="h-4 w-4 text-gray-400" />
											</div>
											<input
												type='text'
												placeholder='Search AI agents...'
												value={searchQuery}
												onChange={(e) => setSearchQuery(e.target.value)}
												className="w-full lg:w-96 pl-9 pr-4 py-2 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-150 shadow-sm"
											/>
										</div>
										<button className="p-2 border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-100 shrink-0">
											<Clock className='h-5 w-5' />
										</button>
									</div>
								</div>

								{/* Agent Cards Grid */}
								<div className="flex justify-center px-4 lg:px-0 w-full">
									{aiAgentsLoading ? (
										<div className="p-16 flex justify-center">
											<Bot
												className="animate-bounce text-emerald-500"
												size={40}
											/>
										</div>
									) : (
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-6xl">
											{filteredAiAgents.map((agent) => (
												<div
													key={agent.id}
													className="flex h-56 w-full flex-col justify-between rounded-3xl border border-gray-200 bg-white shadow-lg transition-all duration-100 hover:shadow-xl"
												>
													<div className="px-4 lg:px-6 py-5 lg:py-7">
														<h5 className="mb-2 truncate text-center text-lg lg:text-xl font-bold text-gray-800">
															{agent.name}
														</h5>
														<img
															className="mx-auto mb-4 lg:mb-5 flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full border bg-gray-200"
															src={`https://api.dicebear.com/9.x/initials/svg?backgroundColor=808080&seed=${encodeURIComponent(agent.name)}`}
															alt='avatar'
														/>
														<p className="truncate text-center text-sm lg:text-base text-gray-600">
															{agent.description || '-'}
														</p>
													</div>
													<div className="flex flex-row items-center justify-center gap-2 px-4 lg:px-6 pb-6 lg:pb-8">
														<a
															href={`/ai-agents/${agent.id}`}
															className="flex items-center gap-1 px-2 lg:px-3 py-1.5 text-xs lg:text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
														>
															<Settings size={14} />
															<span className="hidden sm:inline">Settings</span>
														</a>
														<button
															onClick={() => handleCloneAgent(agent)}
															className="p-1.5 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
															title='Clone'
														>
															<Copy size={16} />
														</button>
														<button
															onClick={() => handleDeleteAgent(agent)}
															className="p-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
															title='Delete'
														>
															<Trash2 size={16} />
														</button>
													</div>
												</div>
											))}

											{/* Create New Card */}
											<div
												onClick={() => setShowCreateModal(true)}
												className="flex h-56 w-full cursor-pointer flex-col items-center justify-center rounded-3xl border border-gray-200 bg-emerald-500 shadow-lg hover:bg-emerald-600 transition-all duration-100"
											>
												<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-500">
													<Plus className='h-6 w-6' />
												</div>
												<span className="text-center text-xl font-semibold text-white">
													Create New
												</span>
											</div>
										</div>
									)}
								</div>

								{/* Empty State */}
								{!aiAgentsLoading &&
									filteredAiAgents.length === 0 &&
									searchQuery && (
										<div className="flex flex-col items-center justify-center text-center py-8">
											<Sparkles className="text-gray-300 mb-4" size={48} />
											<h3 className="text-lg font-medium text-gray-600 mb-1">
												No agents found
											</h3>
											<p className="text-gray-400 text-sm">
												Try adjusting your search query
											</p>
										</div>
									)}
							</div>
						)}

						{activeTab === 'filters' && (
							<div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-8 shadow-sm mx-4 lg:mx-0">
								<h2 className="text-lg font-semibold text-gray-900 mb-2">
									Filter Words
								</h2>
								<p className="text-gray-500 mb-4 lg:mb-8 text-sm">
									Messages containing these words will be ignored by the AI.
								</p>

								<div className="flex flex-col lg:flex-row gap-3 mb-4 lg:mb-8">
									<input
										type='text'
										placeholder="Enter a word or phrase to block (e.g. 'competitor')"
										className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
									/>
									<button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition shadow-sm">
										Add Filter
									</button>
								</div>

								<div className="py-8 text-gray-500 italic">
									No filters added.
								</div>

								<div className="pt-4 lg:pt-8 border-t border-gray-100 flex justify-end">
									<button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition shadow-sm w-full lg:w-auto justify-center">
										<Save size={18} />
										Save Changes
									</button>
								</div>
							</div>
						)}

						{activeTab === 'help' && (
							<div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
								<h2 className="text-xl font-bold text-gray-900 mb-2">
									How to get the best results
								</h2>
								<p className="text-gray-500 mb-8">
									Tips for configuring your AI Assistant
								</p>

								<div className="space-y-8">
									<section>
										<h3 className="text-lg font-semibold text-gray-900 mb-3">
											1. Crafting the Perfect System Prompt
										</h3>
										<p className="text-gray-600 mb-4 text-sm leading-relaxed">
											The System Prompt defines the AI's personality and rules.
											It is the most critical setting.
										</p>
										<div className="bg-gray-50 border border-gray-200 rounded-lg p-5 font-mono text-sm text-gray-800 leading-relaxed overflow-x-auto">
											<span className="text-emerald-600 font-bold block mb-2">
												Recommended Prompt:
											</span>
											You are a helpful and polite customer support assistant
											for [Your Company Name].
											<br />
											Your task is to answer customer questions using ONLY the
											information provided in the "Relevant Context" section
											below.
											<br />
											<br />
											Rules:
											<br />
											1. Use the provided context to answer the question.
											<br />
											2. If the answer is not in the context, politely say: "I'm
											sorry, I don't have that information in my knowledge
											base."
											<br />
											3. Do NOT make up answers or use outside knowledge.
											<br />
											4. Keep answers concise and professional.
										</div>
									</section>

									<section>
										<h3 className="text-lg font-semibold text-gray-900 mb-3">
											2. Optimizing Knowledge Base Documents
										</h3>
										<ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
											<li>
												<strong className="text-gray-900">Format:</strong> Use
												clear headings and concise paragraphs in your PDFs.
											</li>
											<li>
												<strong className="text-gray-900">Q&A Style:</strong>{' '}
												Including a FAQ section in your PDF helps the AI
												understand common questions.
											</li>
											<li>
												<strong className="text-gray-900">Clarity:</strong>{' '}
												Avoid ambiguous language. The AI retrieves text based on
												similarity, so use keywords your customers use.
											</li>
										</ul>
									</section>

									<section>
										<h3 className="text-lg font-semibold text-gray-900 mb-3">
											3. Troubleshooting
										</h3>
										<ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
											<li>
												If the AI says "I don't know" too often, try adding more
												detailed information to your PDF.
											</li>
											<li>
												If the AI hallucinates (makes things up), ensure your
												System Prompt strictly forbids outside knowledge (use
												the word 'ONLY').
											</li>
											<li>
												Check the document status in the "Knowledge Base" tab to
												ensure it is 'COMPLETED'.
											</li>
										</ul>
									</section>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Create Agent Modal */}
			{showCreateModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
					<div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
						<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
							<h3 className="text-lg font-bold text-gray-900">
								Create New AI Agent
							</h3>
							<button
								onClick={() => setShowCreateModal(false)}
								className="text-gray-400 hover:text-gray-600 transition"
							>
								<Plus size={24} className="rotate-45" />
							</button>
						</div>
						<div className="p-6 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Agent Name
								</label>
								<input
									type='text'
									placeholder="e.g., Customer Support Bot"
									className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
									value={newAgentData.name}
									onChange={(e) =>
										setNewAgentData({ ...newAgentData, name: e.target.value })
									}
									autoFocus
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Description (Optional)
								</label>
								<textarea
									rows={3}
									placeholder="Briefly describe what this agent does..."
									className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
									value={newAgentData.description}
									onChange={(e) =>
										setNewAgentData({
											...newAgentData,
											description: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
							<button
								onClick={() => setShowCreateModal(false)}
								className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
							>
								Cancel
							</button>
							<button
								onClick={handleCreateAgent}
								disabled={creatingAgent || !newAgentData.name}
								className="px-6 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition shadow-sm disabled:opacity-50"
							>
								{creatingAgent ? 'Creating...' : 'Create Agent'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

function AiAutoReplyPageWrapper() {
	return <AiAutoReplyPage />
}
