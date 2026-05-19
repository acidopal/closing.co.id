import { useState, useEffect } from 'react'
import { FileText, Search, X } from 'lucide-react'
import { whatsappTemplates } from '@/lib/api'

interface TemplateSelectorProps {
	onAssign: (template: any) => void
	onClose: () => void
}

export function TemplateSelector({ onAssign, onClose }: TemplateSelectorProps) {
	const [templates, setTemplates] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)

	useEffect(() => {
		loadTemplates()
	}, [])

	const loadTemplates = async () => {
		try {
			setLoading(true)
			const res: any = await whatsappTemplates.list('APPROVED') // Only show approved templates
			if (res.success) {
				setTemplates(res.data)
			}
		} catch (error) {
			console.error('Failed to load templates:', error)
		} finally {
			setLoading(false)
		}
	}

	const filteredTemplates = templates.filter(
		(t) =>
			t.name.toLowerCase().includes(search.toLowerCase()) ||
			JSON.stringify(t.components).toLowerCase().includes(search.toLowerCase()),
	)

	const handleSelect = (template: any) => {
		setSelectedTemplate(template)
	}

	const handleConfirm = () => {
		if (selectedTemplate) {
			onAssign(selectedTemplate)
			onClose()
		}
	}

	// Helper to extract body text
	const getBodyText = (components: any[]) => {
		const body = components.find((c: any) => c.type === 'BODY')
		return body ? body.text : '[No Body]'
	}

	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
				{/* Header */}
				<div className="p-4 border-b border-gray-200 flex items-center justify-between">
					<h2 className="text-lg font-semibold text-gray-900">
						Select Template
					</h2>
					<button
						onClick={onClose}
						className="p-1 hover:bg-gray-100 rounded-lg"
					>
						<X size={20} className="text-gray-500" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-hidden flex">
					{/* List */}
					<div className="w-1/2 border-r border-gray-200 flex flex-col">
						<div className="p-3 border-b border-gray-200">
							<div className="relative">
								<Search
									size={16}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								/>
								<input
									type="text"
									placeholder="Search templates..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
								/>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto p-2">
							{loading ? (
								<div className="flex justify-center p-4">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
								</div>
							) : filteredTemplates.length === 0 ? (
								<div className="text-center p-4 text-gray-500 text-sm">
									No templates found
								</div>
							) : (
								<div className="space-y-1">
									{filteredTemplates.map((t) => (
										<button
											key={t.id}
											onClick={() => handleSelect(t)}
											className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
												selectedTemplate?.id === t.id
													? 'bg-emerald-50 border border-emerald-200'
													: 'hover:bg-gray-50 border border-transparent'
											}`}
										>
											<div className="font-medium text-gray-900">{t.name}</div>
											<div className="text-xs text-gray-500 mt-1 capitalize">
												{t.category.toLowerCase()}
											</div>
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Preview */}
					<div className="w-1/2 bg-gray-50 p-4 flex flex-col">
						<div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
							Preview
						</div>

						{selectedTemplate ? (
							<div className="flex-1">
								<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-sm mx-auto">
									{/* Header */}
									{selectedTemplate.components.find(
										(c: any) => c.type === 'HEADER',
									) && (
										<div className="font-bold text-gray-900 mb-2">
											{selectedTemplate.components.find(
												(c: any) => c.type === 'HEADER',
											).text || '[Media Header]'}
										</div>
									)}

									{/* Body */}
									<p className="text-sm text-gray-800 whitespace-pre-wrap">
										{getBodyText(selectedTemplate.components)}
									</p>

									{/* Footer */}
									{selectedTemplate.components.find(
										(c: any) => c.type === 'FOOTER',
									) && (
										<div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
											{
												selectedTemplate.components.find(
													(c: any) => c.type === 'FOOTER',
												).text
											}
										</div>
									)}

									{/* Buttons */}
									{selectedTemplate.components.find(
										(c: any) => c.type === 'BUTTONS',
									) && (
										<div className="mt-2 space-y-1">
											{selectedTemplate.components
												.find((c: any) => c.type === 'BUTTONS')
												.buttons.map((b: any, i: number) => (
													<div
														key={i}
														className="w-full text-center py-2 bg-gray-50 text-emerald-600 text-sm font-medium rounded border border-gray-100"
													>
														{b.text}
													</div>
												))}
										</div>
									)}
								</div>
							</div>
						) : (
							<div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
								Select a template to preview
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="p-4 border-t border-gray-200 flex justify-end gap-2">
					<button
						onClick={onClose}
						className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
					>
						Cancel
					</button>
					<button
						onClick={handleConfirm}
						disabled={!selectedTemplate}
						className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Send Template
					</button>
				</div>
			</div>
		</div>
	)
}
