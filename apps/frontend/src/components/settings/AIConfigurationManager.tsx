import { useState, useEffect } from 'react'
import {
	Sparkles,
	Save,
	Bot,
	Brain,
	Terminal,
	MessageSquare,
	Languages,
	Zap,
	ShieldAlert,
	Key,
	Globe,
	Layout,
	ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

interface AISettings {
	app_id: string
	ai_mode: 'assist' | 'hybrid' | 'auto' | 'off'
	model_provider: 'openai' | 'azure' | 'sumopod' | 'local'
	model_name: string
	temperature: number
	max_tokens: number
	auto_reply_confidence: number
	handoff_keywords: string[]
	response_tone: string
	supported_languages: string[]
	auto_detect_language: boolean
	use_platform_credentials: boolean
	api_key?: string
	api_endpoint?: string
	api_version?: string
	deployment_name?: string
}

export default function AIConfigurationManager() {
	const [settings, setSettings] = useState<AISettings | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [showKey, setShowKey] = useState(false)

	const token = localStorage.getItem('scalechat_token')

	const normalizeStringArray = (value: unknown): string[] => {
		if (!Array.isArray(value)) return []
		return value
			.map((item) => String(item || '').trim())
			.filter((item) => item.length > 0)
	}

	const fetchSettings = async () => {
		try {
			const res = await fetch('/api/ai-settings', {
				headers: { Authorization: `Bearer ${token}` },
			})
			const data = await res.json()
			if (data.success) {
				const payload = (data.payload || {}) as Partial<AISettings>
				setSettings({
					...(payload as AISettings),
					handoff_keywords: normalizeStringArray(payload.handoff_keywords),
					supported_languages: normalizeStringArray(payload.supported_languages),
				})
			}
		} catch (error) {
			console.error('Failed to fetch AI settings:', error)
			toast.error('Failed to load settings')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchSettings()
	}, [])

	const handleSave = async () => {
		if (!settings) return
		setSaving(true)
		try {
			const res = await fetch('/api/ai-settings', {
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(settings),
			})
			if (res.ok) {
				toast.success('AI Configuration saved')
			} else {
				toast.error('Failed to save settings')
			}
		} catch (error) {
			toast.error('Failed to save settings')
		} finally {
			setSaving(false)
		}
	}

	if (loading)
		return (
			<div className="p-12 text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
				<p className="text-gray-400 font-medium">
					Loading AI Engine configuration...
				</p>
			</div>
		)

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Core Engine Settings */}
				<Card className="border-gray-100 shadow-sm overflow-hidden flex flex-col">
					<CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
						<div className="flex items-center gap-2">
							<Zap size={20} className="text-emerald-600" />
							<CardTitle className="text-lg font-bold">AI Engine</CardTitle>
						</div>
						<CardDescription>
							Configure the underlying AI model and behavior
						</CardDescription>
					</CardHeader>
					<CardContent className="p-6 space-y-4 flex-1">
						<div className="grid gap-2">
							<label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
								Response Mode
							</label>
							<select
								value={settings?.ai_mode}
								onChange={(e) =>
									setSettings((prev) =>
										prev ? { ...prev, ai_mode: e.target.value as any } : null,
									)
								}
								className="h-11 px-3 rounded-xl border border-gray-200 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
							>
								<option value="off">Disabled</option>
								<option value="assist">Assist Agent (Suggestions Only)</option>
								<option value="hybrid">
									Hybrid (AI Draft → Agent Approve)
								</option>
								<option value="auto">Full Auto-Reply (Hands-off)</option>
							</select>
						</div>

						<div className="grid gap-2 text-gray-400">
							<label className="text-[10px] font-black uppercase tracking-widest">
								Model
							</label>
							<Input
								value={settings?.model_name || 'gpt-4o'}
								onChange={(e) =>
									setSettings((prev) =>
										prev ? { ...prev, model_name: e.target.value } : null,
									)
								}
								className="h-11 rounded-xl border-gray-200 font-bold"
							/>
						</div>

						<div className="grid gap-2">
							<label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
								AI Personality / Tone
							</label>
							<Input
								value={settings?.response_tone}
								onChange={(e) =>
									setSettings((prev) =>
										prev ? { ...prev, response_tone: e.target.value } : null,
									)
								}
								placeholder="e.g. Professional, friendly, and concise."
								className="h-11 rounded-xl border-gray-200"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Automation & Safety */}
				<Card className="border-gray-100 shadow-sm overflow-hidden flex flex-col">
					<CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
						<div className="flex items-center gap-2">
							<ShieldAlert size={20} className="text-emerald-600" />
							<CardTitle className="text-lg font-bold">
								Automation & Safety
							</CardTitle>
						</div>
						<CardDescription>
							Rules for auto-reply and agent handoff
						</CardDescription>
					</CardHeader>
					<CardContent className="p-6 space-y-6 flex-1">
						<div className="grid gap-3">
							<div className="flex justify-between items-center">
								<label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
									Confidence Threshold
								</label>
								<span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
									{Math.round((settings?.auto_reply_confidence || 0.8) * 100)}%
								</span>
							</div>
							<input
								type="range"
								min="0.5"
								max="1.0"
								step="0.05"
								value={settings?.auto_reply_confidence || 0.8}
								onChange={(e) =>
									setSettings((prev) =>
										prev
											? {
													...prev,
													auto_reply_confidence: parseFloat(e.target.value),
												}
											: null,
									)
								}
								className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
							/>
							<p className="text-[10px] text-gray-400 font-medium leading-relaxed">
								Minimum AI confidence required to send auto-replies. Higher
								values ensure more accurate but fewer responses.
							</p>
						</div>

						<div className="grid gap-2">
							<label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
								Handoff Keywords
							</label>
							<Input
								value={settings?.handoff_keywords?.join(', ') || ''}
								onChange={(e) =>
									setSettings((prev) =>
										prev
											? {
													...prev,
													handoff_keywords: e.target.value
														.split(',')
														.map((s) => s.trim())
														.filter((s) => s),
												}
											: null,
									)
								}
								placeholder="talk to human, agent, representative"
								className="h-11 rounded-xl border-gray-200"
							/>
							<p className="text-[10px] text-gray-400 font-medium">
								Common phrases that should immediately signal a human agent.
							</p>
						</div>

						<div className="flex items-center justify-between pt-2 border-t border-gray-50">
							<div className="space-y-0.5">
								<label className="text-sm font-bold text-gray-900">
									Auto-Detect Language
								</label>
								<p className="text-[10px] text-gray-500 font-medium italic">
									Powered by Neural Detect™
								</p>
							</div>
							<button
								onClick={() =>
									setSettings((prev) =>
										prev
											? {
													...prev,
													auto_detect_language: !prev.auto_detect_language,
												}
											: null,
									)
								}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 shadow-inner ${settings?.auto_detect_language ? 'bg-emerald-500' : 'bg-gray-200'}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${settings?.auto_detect_language ? 'translate-x-6' : 'translate-x-1'}`}
								/>
							</button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* NEW: Credentials & BYOK Settings */}
			<Card className="border-gray-100 shadow-sm overflow-hidden">
				<CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
					<div className="flex items-center gap-2">
						<Key size={20} className="text-emerald-600" />
						<CardTitle className="text-lg font-bold">
							Credentials & Provider
						</CardTitle>
					</div>
					<CardDescription>
						Use your own API keys or our managed platform infrastructure
					</CardDescription>
				</CardHeader>
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-8">
						<div className="w-full md:w-1/3 space-y-4">
							<div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-black text-emerald-800 uppercase tracking-tighter">
										Closing AI Platform
									</h4>
									<ShieldCheck size={18} className="text-emerald-500" />
								</div>
								<p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
									Use our pre-configured, high-performance engines. Easiest
									setup with enterprise scaling.
								</p>
								<Button
									variant={
										settings?.use_platform_credentials ? 'default' : 'outline'
									}
									className={`w-full h-9 text-xs font-bold rounded-lg ${settings?.use_platform_credentials ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-200 text-emerald-700'}`}
									onClick={() =>
										setSettings((prev) =>
											prev ? { ...prev, use_platform_credentials: true } : null,
										)
									}
								>
									{settings?.use_platform_credentials
										? 'Currently Active'
										: 'Switch to Platform'}
								</Button>
							</div>

							<div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-black text-gray-800 uppercase tracking-tighter">
										Bring Your Own Key (BYOK)
									</h4>
									<Globe size={18} className="text-gray-400" />
								</div>
								<p className="text-[11px] text-gray-500 leading-relaxed font-medium">
									Direct integration with your Azure OpenAI, Sumopod, or custom
									providers for full control over data & costs.
								</p>
								<Button
									variant={
										!settings?.use_platform_credentials ? 'default' : 'outline'
									}
									className={`w-full h-9 text-xs font-bold rounded-lg ${!settings?.use_platform_credentials ? 'bg-gray-900 hover:bg-gray-800' : 'border-gray-200'}`}
									onClick={() =>
										setSettings((prev) =>
											prev
												? { ...prev, use_platform_credentials: false }
												: null,
										)
									}
								>
									{!settings?.use_platform_credentials
										? 'Currently Active'
										: 'Configure Custom Key'}
								</Button>
							</div>
						</div>

						<div className="flex-1 space-y-4">
							{!settings?.use_platform_credentials && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
									<div className="grid gap-2">
										<label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
											Provider
										</label>
										<select
											value={settings?.model_provider}
											onChange={(e) =>
												setSettings((prev) =>
													prev
														? { ...prev, model_provider: e.target.value as any }
														: null,
												)
											}
											className="h-10 px-3 rounded-xl border border-gray-200 text-sm font-bold bg-white"
										>
											<option value="openai">OpenAI (Direct)</option>
											<option value="azure">Azure OpenAI</option>
											<option value="sumopod">Sumopod</option>
											<option value="local">Custom / Local LLM</option>
										</select>
									</div>
									<div className="grid gap-2">
										<label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
											API Key
										</label>
										<div className="relative">
											<Input
												type={showKey ? 'text' : 'password'}
												value={settings?.api_key || ''}
												onChange={(e) =>
													setSettings((prev) =>
														prev ? { ...prev, api_key: e.target.value } : null,
													)
												}
												placeholder="sk-..."
												className="h-10 rounded-xl border-gray-200 pr-10 font-mono text-xs"
											/>
											<button
												onClick={() => setShowKey(!showKey)}
												className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
											>
												<Zap size={16} />
											</button>
										</div>
									</div>
									<div className="grid gap-2">
										<label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
											Endpoint URL
										</label>
										<Input
											value={settings?.api_endpoint || ''}
											onChange={(e) =>
												setSettings((prev) =>
													prev
														? { ...prev, api_endpoint: e.target.value }
														: null,
												)
											}
											placeholder="https://..."
											className="h-10 rounded-xl border-gray-200 text-xs"
										/>
									</div>
									<div className="grid gap-2">
										<label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
											Deployment / Model ID
										</label>
										<Input
											value={settings?.deployment_name || ''}
											onChange={(e) =>
												setSettings((prev) =>
													prev
														? { ...prev, deployment_name: e.target.value }
														: null,
												)
											}
											placeholder="e.g. gpt-4o-deployment"
											className="h-10 rounded-xl border-gray-200 text-xs font-bold"
										/>
									</div>
								</div>
							)}

							{settings?.use_platform_credentials && (
								<div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50/50 border border-dashed border-gray-100 rounded-2xl text-center">
									<Sparkles
										size={32}
										className="text-emerald-400 mb-4 animate-pulse"
									/>
									<h4 className="font-black text-gray-900 text-sm">
										Optimal Performance Mode
									</h4>
									<p className="text-xs text-gray-500 max-w-sm mt-2">
										Closing AI manages all API traffic, fine-tuning, and rate
										limits for you. No technical setup required.
									</p>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Advanced System Instructions */}
			<Card className="border-gray-100 shadow-sm overflow-hidden">
				<CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
					<div className="flex items-center gap-2">
						<Terminal size={20} className="text-emerald-600" />
						<CardTitle className="text-lg font-bold">
							Global System Context
						</CardTitle>
					</div>
					<CardDescription>
						Overarching instructions for all AI agents in this application
					</CardDescription>
				</CardHeader>
				<CardContent className="p-6">
					<textarea
						className="w-full min-h-[120px] p-4 rounded-xl border border-gray-200 bg-gray-50 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4 transition-all"
						placeholder="e.g. You are the official assistant for Closing AI. Always maintain a professional yet approachable tone. Refer to customers by their first name if available."
					/>
					<div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 gap-4">
						<div className="flex gap-3 items-center">
							<div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-emerald-100">
								<Brain size={22} className="text-emerald-600" />
							</div>
							<p className="text-[11px] text-gray-600 font-medium leading-relaxed">
								Tip: Use{' '}
								<code className="bg-emerald-100/50 px-1 rounded text-emerald-800 font-bold">
									{'{app_name}'}
								</code>{' '}
								to dynamically reference your app name in prompts.
							</p>
						</div>
						<Button
							onClick={handleSave}
							disabled={saving}
							className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white font-black h-11 px-10 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
						>
							{saving ? (
								'Saving System State...'
							) : (
								<>
									<Save size={18} className="mr-2" />
									Save Configuration
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Model Info */}
			<div className="flex items-center gap-2 text-gray-300 justify-center pb-8 pt-4">
				<Sparkles size={14} className="animate-spin-slow" />
				<p className="text-[10px] font-black uppercase tracking-[0.2em]">
					Closing AI Engine Core v2.4 • Active Model:{' '}
					{settings?.model_name || 'GPT-4o'}
				</p>
			</div>
		</div>
	)
}
