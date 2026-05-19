import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Book, Plus, Search, FileText, Globe, X } from 'lucide-react'
import { knowledge } from '@/lib/api'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/PageHeader'

export const Route = createFileRoute('/_app/knowledge')({
	component: KnowledgeBasePage,
})

interface KnowledgeSource {
	id: string
	title: string
	content: string
	type: 'text' | 'website' | 'pdf'
	status: 'pending' | 'completed' | 'failed'
	created_at: string
}

function KnowledgeBasePage() {
	const [sources, setSources] = useState<KnowledgeSource[]>([])
	const [loading, setLoading] = useState(true)
	const [showAddModal, setShowAddModal] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')

	// New source form
	const [adding, setAdding] = useState(false)
	const [newSource, setNewSource] = useState({
		title: '',
		content: '',
		type: 'text' as const,
	})

	useEffect(() => {
		fetchSources()
	}, [])

	const fetchSources = async () => {
		try {
			const res: any = await knowledge.list()
			setSources(res.data || [])
		} catch (e) {
			console.error('Failed to fetch knowledge sources:', e)
		} finally {
			setLoading(false)
		}
	}

	const handleAddSource = async (e: React.FormEvent) => {
		e.preventDefault()
		setAdding(true)
		try {
			await knowledge.add(newSource)
			setNewSource({ title: '', content: '', type: 'text' })
			setShowAddModal(false)
			fetchSources()
		} catch (e) {
			console.error('Failed to add source:', e)
		} finally {
			setAdding(false)
		}
	}

	const actions = (
		<div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto">
			<div className="relative flex-1 lg:w-64">
				<Search
					className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
					size={18}
				/>
				<Input
					placeholder="Search sources..."
					className="pl-10 h-10 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg shadow-sm"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</div>
			<button
				onClick={() => setShowAddModal(true)}
				className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm font-bold text-sm flex items-center gap-2 whitespace-nowrap"
			>
				<Plus size={18} />
				Add Source
			</button>
		</div>
	)

	const filteredSources = sources.filter(
		(s) =>
			s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.content.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	return (
		<div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
			<PageHeader
				title="AI Knowledge Base"
				description="Feed your AI with documents, websites, and custom text to improve response accuracy"
				icon={<Book size={24} />}
				actions={actions}
			/>

			<div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8">
				{loading ? (
					<div className="flex items-center justify-center py-20">
						<div className="flex flex-col items-center gap-4">
							<Plus className="animate-spin text-emerald-500" size={32} />
							<p className="text-gray-500 font-bold">Summoning knowledge...</p>
						</div>
					</div>
				) : filteredSources.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 rounded-2xl">
						<div className="bg-gray-50 p-4 rounded-full mb-4">
							<Book size={48} className="text-gray-300" />
						</div>
						<h3 className="text-lg font-bold text-gray-900">
							No sources found
						</h3>
						<p className="text-gray-500 max-w-xs text-center mt-2">
							{searchQuery
								? `No matches for "${searchQuery}"`
								: 'Start by adding your first knowledge source to train the AI.'}
						</p>
						{!searchQuery && (
							<button
								onClick={() => setShowAddModal(true)}
								className="mt-6 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all font-bold"
							>
								Add Source
							</button>
						)}
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredSources.map((source) => (
							<div
								key={source.id}
								className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-transparent hover:border-b-emerald-500"
							>
								<div className="flex items-start justify-between mb-4">
									<div className="p-3 bg-gray-50 text-gray-600 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
										{source.type === 'website' ? (
											<Globe size={20} />
										) : (
											<FileText size={20} />
										)}
									</div>
									<span
										className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
											source.status === 'completed'
												? 'bg-emerald-50 text-emerald-600'
												: source.status === 'failed'
													? 'bg-red-50 text-red-600'
													: 'bg-amber-50 text-amber-600'
										}`}
									>
										{source.status}
									</span>
								</div>
								<h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight">
									{source.title}
								</h3>
								<p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
									{source.content}
								</p>
								<div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
									<span>
										Added {new Date(source.created_at).toLocaleDateString()}
									</span>
									<span className="group-hover:text-emerald-500 transition-colors">
										Manage Source →
									</span>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Modal */}
			{showAddModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
						<div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
							<div>
								<h2 className="text-xl font-bold text-gray-900">
									New Knowledge Source
								</h2>
								<p className="text-sm text-gray-500">
									Select how you want to train the AI
								</p>
							</div>
							<button
								onClick={() => setShowAddModal(false)}
								className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleAddSource} className="p-8 space-y-6">
							<div className="space-y-4">
								<div>
									<label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
										Source Type
									</label>
									<div className="grid grid-cols-2 gap-3">
										{[
											{ id: 'text', label: 'Plain Text', icon: FileText },
											{ id: 'website', label: 'Website URL', icon: Globe },
										].map((type) => (
											<button
												key={type.id}
												type='button'
												onClick={() =>
													setNewSource({ ...newSource, type: type.id as any })
												}
												className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all font-bold text-sm ${
													newSource.type === type.id
														? 'border-emerald-500 bg-emerald-50 text-emerald-700'
														: 'border-gray-100 hover:border-gray-200 text-gray-500'
												}`}
											>
												<type.icon size={18} />
												{type.label}
											</button>
										))}
									</div>
								</div>

								<div>
									<label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
										Title
									</label>
									<Input
										required
										placeholder="e.g., Refund Policy"
										className="h-12 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
										value={newSource.title}
										onChange={(e) =>
											setNewSource({ ...newSource, title: e.target.value })
										}
									/>
								</div>

								<div>
									<label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
										{newSource.type === 'text'
											? 'Knowledge Content'
											: 'Website URL'}
									</label>
									<textarea
										required
										rows={newSource.type === 'text' ? 5 : 2}
										placeholder={
											newSource.type === 'text'
												? 'Paste the information here...'
												: 'https://example.com/faq'
										}
										className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-emerald-500 focus:ring-0 transition-all text-sm font-medium resize-none"
										value={newSource.content}
										onChange={(e) =>
											setNewSource({ ...newSource, content: e.target.value })
										}
									/>
								</div>
							</div>

							<div className="flex items-center gap-3 pt-4">
								<button
									type='button'
									onClick={() => setShowAddModal(false)}
									className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm"
								>
									Cancel
								</button>
								<button
									type='submit'
									disabled={adding}
									className="flex-3 px-8 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-bold text-sm shadow-md shadow-emerald-200 disabled:opacity-50"
								>
									{adding ? 'Adding...' : 'Add Knowledge'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
