import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
	ReactFlow,
	Controls,
	Background,
	applyNodeChanges,
	applyEdgeChanges,
	addEdge,
	type Connection,
	type Edge,
	type Node,
	type NodeChange,
	type EdgeChange,
	Handle,
	Position,
	Panel,
	BackgroundVariant,
	PanOnScrollMode,
	useReactFlow,
	ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import {
	Play,
	Plus,
	Tag,
	UserPlus,
	Send,
	Webhook,
	ArrowRight,
	Bot,
	User,
	MoreHorizontal,
	ChevronRight,
	Zap,
	MessageSquare,
	Activity,
	Copy,
	Trash2,
	Settings,
	Wand2,
	X,
	Save,
	Upload,
	ChevronDown,
	Flag,
	Sparkles,
	Brain,
	ShieldAlert,
	Image,
	Loader2,
	Search,
	Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
	automationFlows,
	labels as labelsApi,
	agents as agentsApi,
	teams as teamsApi,
	chatbots as chatbotsApi,
	media,
} from '@/lib/api'
import { AI_NODE_COMPONENTS } from '@/components/flows/AINodes'
import { AIConfigForm } from '@/components/flows/AIConfigForm'
import {
	type AINodeData,
	getAINodeDefaultData,
} from '@/components/flows/AINodeTypes'

export const Route = createFileRoute('/_app/flows')({
	component: () => (
		<ReactFlowProvider>
			<FlowsPage />
		</ReactFlowProvider>
	),
})

// Custom Node: Start Point (Blue)
const StartPointNode = ({ data, selected }: any) => {
	return (
		<div
			className={`group flex flex-col items-center relative transition-all duration-300 ${selected ? 'scale-105 z-50' : ''}`}
		>
			{selected && (
				<div className="absolute -top-8 right-0 inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-white text-blue-700 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-bottom-2 z-50">
					Selected
				</div>
			)}

				<div
					className={`bg-white rounded-2xl border-2 border-blue-500 overflow-hidden min-w-[260px] relative z-10 transition-all duration-300 ${selected ? 'outline outline-4 outline-blue-600 shadow-2xl shadow-blue-500/20' : 'shadow-xl'}`}
				>
				<div className="bg-blue-600 px-4 py-3 flex items-center gap-2 text-white">
					<Play size={18} fill="currentColor" />
					<span className="font-bold text-sm uppercase tracking-wider">
						Start point
					</span>
				</div>
				<div className="p-4 bg-white text-center">
					<p className="text-sm font-bold text-gray-400">Select Condition</p>
				</div>
			</div>

			{selected ? (
				<>
					<div className="w-0.5 h-8 bg-gray-200" />

					<div className="relative z-20" data-prevent-node-settings="true">
						<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										data-prevent-node-settings="true"
										onPointerDown={(event) => event.stopPropagation()}
										onClick={(event) => event.stopPropagation()}
										onMouseDown={(event) => event.stopPropagation()}
										className="nodrag nopan w-9 h-9 rounded-xl bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
									>
										<Plus size={18} strokeWidth={3} />
									</button>
								</DropdownMenuTrigger>
							<DropdownMenuContent
								align="center"
								className="w-56 rounded-xl shadow-2xl border-gray-100 p-1"
							>
								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="rounded-lg py-2.5 font-bold text-gray-700">
										<Activity size={16} className="mr-2 text-blue-500" />
										Add Condition
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent className="rounded-xl shadow-2xl border-gray-100 p-1">
										<DropdownMenuItem
											onClick={() => data.onAddCondition('text')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											First Message Text
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => data.onAddCondition('time')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											First Message Time
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => data.onAddCondition('button')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											Button Answer
										</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuSub>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="w-0.5 h-4 bg-gray-200" />
				</>
			) : (
				<div className="w-0.5 h-12 bg-gray-200" />
			)}

			<Handle
				type="source"
				position={Position.Bottom}
				className="!opacity-0 !bottom-0"
			/>
		</div>
	)
}

// Custom Node: Condition (Yellow)
const ConditionNode = ({ id, data, selected }: any) => {
	return (
		<div
			className={`group flex flex-col items-center relative transition-all duration-300 ${selected ? 'scale-105 z-50' : ''}`}
		>
				{selected && (
					<div className="absolute -top-8 right-0 inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50 rounded-lg animate-in fade-in slide-in-from-bottom-2 z-50">
						Selected
					</div>
				)}

				<div
					className={`bg-white dark:bg-zinc-900 rounded-2xl border-2 border-amber-500 overflow-hidden min-w-[300px] animate-in slide-in-from-top-4 duration-300 relative z-10 transition-all ${selected ? 'ring-4 ring-amber-500/25 shadow-2xl shadow-amber-500/20' : 'shadow-xl'}`}
				>
				<Handle
					type="target"
					position={Position.Top}
					className="!bg-amber-500 !w-3 !h-3 !border-2 !border-white shadow-sm"
				/>
				<div className="bg-amber-500 px-4 py-3 flex items-center gap-2 text-white">
					<Zap size={18} className="rotate-12" />
					<span className="font-bold text-sm uppercase tracking-wider">
						Condition
					</span>
				</div>
					<div className="p-5 bg-white dark:bg-zinc-900 space-y-3">
						<p className="text-sm font-black text-gray-900 dark:text-zinc-100 leading-tight">
							{data.label}
						</p>

						{data.type === 'button' ? (
							<div className="space-y-2">
								<label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
									Button Text to Match
								</label>
								<div className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2">
									<p className="text-[12px] text-gray-400 dark:text-zinc-400 italic">
										{data.text || 'Enter exact button text'}
									</p>
								</div>
							</div>
						) : (
							<div className="bg-blue-50/50 dark:bg-blue-950/35 border border-blue-100 dark:border-blue-800/40 rounded-xl p-3">
								<p className="text-[12px] text-blue-600 dark:text-blue-300 font-medium italic">
									{data.text ||
										(data.isElse
											? 'This path will be taken if other conditions are not met.'
										: 'Your trigger message will appear here')}
							</p>
						</div>
					)}
				</div>
			</div>

				<div className="w-0.5 h-8 bg-gray-200 dark:bg-zinc-700" />

			<div className="relative z-20" data-prevent-node-settings="true">
				<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								data-prevent-node-settings="true"
								onPointerDown={(event) => event.stopPropagation()}
								onClick={(event) => event.stopPropagation()}
								onMouseDown={(event) => event.stopPropagation()}
									className="nodrag nopan w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/45 border-4 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
							>
								<Plus size={18} strokeWidth={3} />
							</button>
						</DropdownMenuTrigger>
					<DropdownMenuContent
						align="center"
						className="w-56 rounded-xl shadow-2xl border-gray-100 p-1"
					>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="rounded-lg py-2.5 font-bold text-gray-700">
								<Zap size={16} className="mr-2 text-blue-500" />
								Add Action
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent className="rounded-xl shadow-2xl border-gray-100 p-1">
								<DropdownMenuItem
									onClick={() => data.onAddAction('label')}
									className="rounded-lg py-2.5 font-bold text-gray-700"
								>
									Add Label
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => data.onAddAction('collaborator')}
									className="rounded-lg py-2.5 font-bold text-gray-700"
								>
									Add Collaborator
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => data.onAddAction('message')}
									className="rounded-lg py-2.5 font-bold text-gray-700"
								>
									Send Message
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => data.onAddAction('webhook')}
									className="rounded-lg py-2.5 font-bold text-gray-700"
								>
									Webhook
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="rounded-lg py-2.5 font-bold text-gray-700">
								<Wand2 size={16} className="mr-2 text-violet-500" />
								AI Actions
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent className="rounded-xl shadow-2xl border-gray-100 p-1">
								<DropdownMenuItem
									onClick={() => data.onAddAction('ai_generate')}
									className="rounded-lg py-2.5 font-bold text-gray-700"
								>
									<Sparkles size={16} className="mr-2 text-violet-500" /> AI
									Generate
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => data.onAddAction('ai_classify')}
									className="rounded-lg py-2.5 font-bold text-gray-700"
								>
									<Brain size={16} className="mr-2 text-cyan-500" /> AI Classify
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => data.onAddAction('ai_handoff')}
									className="rounded-lg py-2.5 font-bold text-gray-700"
								>
									<ShieldAlert size={16} className="mr-2 text-rose-500" /> AI
									Handoff
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>

						<DropdownMenuItem
							onClick={() => data.onAddAction('buttons')}
							className="rounded-lg py-2.5 font-bold text-gray-700"
						>
							<MessageSquare size={16} className="mr-2 text-blue-500" />
							Add Message with Buttons
						</DropdownMenuItem>

						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="rounded-lg py-2.5 font-bold text-gray-700">
								<ArrowRight size={16} className="mr-2 text-orange-500" />
								Add End Flow
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent className="rounded-xl shadow-2xl border-gray-100 p-1">
								<DropdownMenuItem
									onClick={() => data.onAddEnd('ai')}
									className="rounded-lg py-2.5 font-bold text-gray-700"
								>
									<Bot size={16} className="mr-2 text-purple-500" /> AI Agent
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => data.onAddEnd('human')}
									className="rounded-lg py-2.5 font-bold text-gray-700"
								>
									<User size={16} className="mr-2 text-indigo-500" /> Human
									Agent
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

				<div className="w-0.5 h-4 bg-gray-200 dark:bg-zinc-700" />
			<Handle
				type="source"
				position={Position.Bottom}
				className="!opacity-0 !bottom-0"
			/>

			{/* Delete Button */}
			<button
				onClick={(e) => {
					e.stopPropagation()
					if (data.onDelete) data.onDelete(id)
				}}
					className="absolute -right-3 top-1/4 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg border border-white dark:border-zinc-700 z-30"
				>
				<Trash2 size={16} />
			</button>
		</div>
	)
}

// Custom Node: Action (Blue Header with Zap)
const ActionNode = ({ id, data, selected }: any) => {
	const actionType = data.actionType || data.type
	const isButtons = actionType === 'buttons'

	const { Icon, colorClass, borderColor, ringColor } = useMemo(() => {
		switch (actionType) {
			case 'label':
				return {
					Icon: Tag,
					colorClass: 'bg-emerald-600',
					borderColor: 'border-emerald-500',
					ringColor: 'ring-emerald-500/20',
				}
			case 'collaborator':
				return {
					Icon: UserPlus,
					colorClass: 'bg-teal-600',
					borderColor: 'border-teal-500',
					ringColor: 'ring-teal-500/20',
				}
			case 'message':
			case 'send_message':
				return {
					Icon: Send,
					colorClass: 'bg-blue-600',
					borderColor: 'border-blue-500',
					ringColor: 'ring-blue-500/20',
				}
			case 'buttons':
				return {
					Icon: MessageSquare,
					colorClass: 'bg-blue-600',
					borderColor: 'border-blue-500',
					ringColor: 'ring-blue-500/20',
				}
			case 'webhook':
				return {
					Icon: Webhook,
					colorClass: 'bg-purple-600',
					borderColor: 'border-purple-500',
					ringColor: 'ring-purple-500/20',
				}
			case 'jump':
			case 'jump_to_action':
				return {
					Icon: ArrowRight,
					colorClass: 'bg-orange-600',
					borderColor: 'border-orange-500',
					ringColor: 'ring-orange-500/20',
				}
			default:
				return {
					Icon: Zap,
					colorClass: 'bg-slate-600',
					borderColor: 'border-slate-500',
					ringColor: 'ring-slate-500/20',
				}
		}
	}, [actionType])

	return (
		<div
			className={`group flex flex-col items-center relative transition-all duration-300 ${selected ? 'scale-105 z-50' : ''}`}
		>
			{selected && (
					<div
						className={`absolute -top-8 right-0 inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-zinc-900 border rounded-lg animate-in fade-in slide-in-from-bottom-2 z-50 ${colorClass.replace('bg-', 'text-').replace('-600', '-700')} ${colorClass.replace('bg-', 'border-').replace('-600', '-200')}`}
					>
						Selected
					</div>
				)}

				<div
					className={`
	                bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden min-w-[280px] max-w-[320px] transition-all duration-300 relative z-10 border-2
	                ${borderColor}
	                ${selected ? `ring-4 ${ringColor}` : 'shadow-xl'}
	            `}
			>
				<Handle
					type="target"
					position={Position.Top}
					className={`!w-3 !h-3 !border-2 !border-white shadow-sm ${colorClass}`}
				/>

				{/* Header */}
				<div
					className={`${colorClass} px-4 py-3 flex items-center gap-2 text-white`}
				>
					<Icon size={18} />
					<span className="font-bold text-sm uppercase tracking-wider">
						{isButtons ? 'Message' : data.label || actionType.replace('_', ' ')}
					</span>
				</div>

					<div className="p-4 bg-white dark:bg-zinc-900 space-y-3">
						{actionType === 'buttons' && (
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<div className="text-sm font-black text-gray-900 dark:text-zinc-100 leading-tight flex items-center gap-2">
										<MessageSquare size={14} className="text-blue-500" />
										Message with buttons
									</div>
								</div>
								<div className="bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl p-3 space-y-2">
									<div>
										<p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1">
											Message Text
										</p>
										<div className="bg-blue-50/50 dark:bg-blue-950/35 border border-blue-100 dark:border-blue-800/40 rounded-lg p-2.5 text-[12px] text-blue-600 dark:text-blue-300 font-medium italic min-h-[40px] break-words">
											{data.messageText || 'Your Message will be displayed here'}
										</div>
									</div>
									{data.buttons && data.buttons.length > 0 && (
										<div>
											<p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1">
												Buttons
											</p>
											<div className="flex flex-col gap-1.5">
												{data.buttons.map((btn: string, i: number) => (
													<div
														key={i}
														className="flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 border border-blue-100 dark:border-blue-800/40 text-blue-600 dark:text-blue-300 text-[11px] font-bold py-1.5 rounded-lg shadow-sm"
													>
														<Send size={10} className="rotate-45" />
														{btn || `Button ${i + 1}`}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

						{actionType === 'label' && (
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<div className="text-sm font-black text-gray-900 dark:text-zinc-100 leading-tight flex items-center gap-2">
										<Tag size={14} className="text-emerald-500" />
										Labels assigned
									</div>
								</div>
								<div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl">
									{data.labels && data.labels.length > 0 ? (
										data.labels.map((id: string, index: number) => (
											<div
												key={id}
												className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/35 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-100 dark:border-emerald-800/40 italic"
											>
												{data.labelDisplayNames?.[index] || id}
											</div>
										))
									) : (
										<p className="text-xs text-gray-400 dark:text-zinc-500 italic">
											No labels selected
										</p>
									)}
							</div>
						</div>
					)}

						{actionType === 'collaborator' && (
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<div className="text-sm font-black text-gray-900 dark:text-zinc-100 leading-tight flex items-center gap-2">
										<UserPlus size={14} className="text-teal-500" />
										Collaborator
									</div>
								</div>
								<div className="p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-xl">
									{data.collaboratorId ? (
										<div className="flex items-center gap-2">
											<div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-300 text-[10px] font-bold uppercase">
												{data.collaboratorName
													? data.collaboratorName.charAt(0)
													: '?'}
											</div>
											<p className="text-xs font-bold text-gray-700 dark:text-zinc-200">
												{data.collaboratorName || 'Selected Agent'}
											</p>
										</div>
									) : (
										<p className="text-xs text-gray-400 dark:text-zinc-500 italic">
											No collaborator assigned
										</p>
									)}
							</div>
						</div>
					)}

					{(actionType === 'send_message' || actionType === 'message') && (
						<div className="flex flex-col gap-2">
								<div className="flex px-2 items-center justify-between rounded-xl">
									<p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
										Send Message
									</p>
								</div>
								{/* Message Text Preview */}
								<div>
									<textarea
										disabled
											className="w-full p-3 rounded-xl overflow-auto whitespace-pre-wrap text-[13px] bg-[#F1F4FF] dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 disabled:text-gray-500 dark:disabled:text-zinc-400 focus:outline-none resize-none break-words"
										style={{
										height:
											data.description && data.description.length > 50
												? '80px'
												: '42px',
									}}
									value={
										data.description || 'Your Message will be displayed here'
									}
								/>
							</div>
								{/* Images Preview */}
								{data.images && data.images.length > 0 && (
									<div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/50 dark:bg-blue-950/35 rounded-xl border border-blue-100 dark:border-blue-800/40">
										{data.images
										.slice(0, 4)
										.map(
											(
												img: { url: string; fileName?: string },
												idx: number,
											) => (
												<img
													key={idx}
													src={img.url}
													alt={img.fileName || `Image ${idx + 1}`}
														className="w-12 h-12 rounded-lg object-cover border border-white dark:border-zinc-700 shadow-sm"
												/>
											),
										)}
									{data.images.length > 4 && (
											<div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/45 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center">
												<span className="text-[10px] font-bold text-blue-600 dark:text-blue-300">
													+{data.images.length - 4}
												</span>
											</div>
									)}
								</div>
							)}
						</div>
					)}

						{(actionType === 'webhook' || actionType === 'jump_to_action') && (
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<div className="text-sm font-black text-gray-900 dark:text-zinc-100 leading-tight flex items-center gap-2">
										<Icon size={14} className="text-blue-500" />
										{actionType.replace('_', ' ')}
									</div>
								</div>
								<p className="text-xs text-gray-600 dark:text-zinc-300 line-clamp-3 bg-slate-50 dark:bg-zinc-800 p-2 rounded-lg border border-slate-100 dark:border-zinc-700 italic">
									{data.description || 'Not configured'}
								</p>
							</div>
						)}
					</div>
				</div>

				<div className="w-0.5 h-8 bg-gray-200 dark:bg-zinc-700" />

			<div className="relative z-20" data-prevent-node-settings="true">
				<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								data-prevent-node-settings="true"
								onPointerDown={(event) => event.stopPropagation()}
								onClick={(event) => event.stopPropagation()}
								onMouseDown={(event) => event.stopPropagation()}
									className="nodrag nopan w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/45 border-4 border-white dark:border-zinc-900 shadow-lg flex items-center justify-center text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
							>
								<Plus size={18} strokeWidth={3} />
							</button>
						</DropdownMenuTrigger>
					<DropdownMenuContent
						align="center"
						className="w-[280px] rounded-xl shadow-2xl border-gray-100 p-2"
					>
						{isButtons ? (
							<div className="flex flex-col gap-1">
								<DropdownMenuItem
									onClick={() => data.onAddCondition('button')}
									className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer"
								>
									<div className="w-9 h-9 shrink-0 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
										<MessageSquare size={20} />
									</div>
									<div className="flex flex-col gap-0.5">
										<span className="font-bold text-gray-900 group-hover:text-blue-600">
											Button Response
										</span>
										<p className="text-[11px] text-gray-500 font-medium leading-tight">
											Add a path for when a specific button is clicked
										</p>
									</div>
								</DropdownMenuItem>

								<DropdownMenuItem
									onClick={() => data.onAddCondition('else')}
									className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer"
								>
									<div className="w-9 h-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
										<Activity size={20} />
									</div>
									<div className="flex flex-col gap-0.5">
										<span className="font-bold text-gray-900 group-hover:text-blue-600">
											Else Path
										</span>
										<p className="text-[11px] text-gray-500 font-medium leading-tight">
											Add a default path for when no button is clicked
										</p>
									</div>
								</DropdownMenuItem>
							</div>
						) : (
							<>
								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="rounded-lg py-2.5 font-bold text-gray-700">
										<Zap size={16} className="mr-2 text-blue-500" />
										Add Action
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent className="rounded-xl shadow-2xl border-gray-100 p-1">
										<DropdownMenuItem
											onClick={() => data.onAddAction('label')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											Add Label
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => data.onAddAction('collaborator')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											Add Collaborator
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => data.onAddAction('message')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											Send Message
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => data.onAddAction('webhook')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											Webhook
										</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuSub>

								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="rounded-lg py-2.5 font-bold text-gray-700">
										<Wand2 size={16} className="mr-2 text-violet-500" />
										AI Actions
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent className="rounded-xl shadow-2xl border-gray-100 p-1">
										<DropdownMenuItem
											onClick={() => data.onAddAction('ai_generate')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											<Sparkles size={16} className="mr-2 text-violet-500" /> AI
											Generate
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => data.onAddAction('ai_classify')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											<Brain size={16} className="mr-2 text-cyan-500" /> AI
											Classify
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => data.onAddAction('ai_handoff')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											<ShieldAlert size={16} className="mr-2 text-rose-500" />{' '}
											AI Handoff
										</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuSub>

								<DropdownMenuItem
									onClick={() => data.onAddAction('buttons')}
									className="rounded-lg py-2.5 font-bold text-gray-700"
								>
									<MessageSquare size={16} className="mr-2 text-blue-500" />
									Add Message with Buttons
								</DropdownMenuItem>

								<DropdownMenuSub>
									<DropdownMenuSubTrigger className="rounded-lg py-2.5 font-bold text-gray-700">
										<ArrowRight size={16} className="mr-2 text-orange-500" />
										Add End Flow
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent className="rounded-xl shadow-2xl border-gray-100 p-1">
										<DropdownMenuItem
											onClick={() => data.onAddEnd('ai_agent')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											<Bot size={16} className="mr-2 text-purple-500" /> AI
											Agent
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => data.onAddEnd('human_agent')}
											className="rounded-lg py-2.5 font-bold text-gray-700"
										>
											<User size={16} className="mr-2 text-indigo-500" /> Human
											Agent
										</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuSub>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

				<div className="w-0.5 h-4 bg-gray-200 dark:bg-zinc-700" />

			<Handle
				type="source"
				position={Position.Bottom}
				className="!opacity-0 !bottom-0"
			/>

			{/* Delete Button */}
			<button
				onClick={(e) => {
					e.stopPropagation()
					if (data.onDelete) data.onDelete(id)
				}}
					className="absolute -right-3 top-1/4 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg border border-white dark:border-zinc-700 z-30"
				>
				<Trash2 size={16} />
			</button>
		</div>
	)
}

// Custom Node: End Flow
const EndNode = ({ id, data, selected }: any) => {
	const isAI = data.type === 'ai' || data.type === 'ai_agent'

	return (
		<div
			className={`
	            min-w-[280px] max-w-[320px] rounded-2xl bg-white dark:bg-zinc-900 p-4 transition-all duration-300 relative
	            ${selected ? 'scale-105 z-50 ring-4 ring-offset-2 ring-offset-rose-100 dark:ring-offset-zinc-950 ring-rose-500/60 shadow-2xl shadow-rose-500/25' : 'shadow-xl border border-gray-100 dark:border-zinc-700'}
	        `}
			>
			{selected && (
				<div className="absolute -top-6 right-0 inline-block px-2 py-0.5 text-xs font-bold text-rose-500 z-10 animate-in fade-in slide-in-from-bottom-2">
					Selected
				</div>
			)}

			<Handle
				type="target"
				position={Position.Top}
				className="!w-3 !h-3 !border-2 !border-white shadow-sm !bg-rose-400"
			/>

			{/* Header */}
			<div className="relative -mx-4 -mt-4 mb-3 flex items-center rounded-t-2xl px-4 py-3 text-lg font-bold text-white bg-[#FBA2A2]">
				<Flag size={18} fill="currentColor" />
				<span className="ml-3 text-sm uppercase tracking-wider">End Flow</span>
			</div>

			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between">
						<div className="text-sm font-black text-gray-900 dark:text-zinc-100">
							{isAI ? 'AI Agent' : 'Human Agent'}
						</div>
				</div>

				{isAI && (
					<div className="flex flex-col gap-1.5">
							<div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
								Selected AI Agent
							</div>
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-1.5 rounded-full border border-rose-100 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-900/35 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-300 font-bold">
									<div className="h-4 w-4 rounded-full bg-rose-200 dark:bg-rose-800/40 flex items-center justify-center">
										<Bot size={10} className="text-rose-600 dark:text-rose-300" />
									</div>
									{data.chatbotName || 'Sophia (AI SOZO)'}
								</div>
						</div>
					</div>
				)}

				{data.agentNames && data.agentNames.length > 0 && (
					<div className="flex flex-col gap-1.5">
							<div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
								Human Agents
							</div>
							<div className="flex flex-wrap gap-1.5">
								{data.agentNames.map((name: string, i: number) => (
									<span
										key={i}
										className="flex items-center gap-1.5 rounded-full border border-blue-100 dark:border-blue-800/40 px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-900/35 text-blue-600 dark:text-blue-300 font-bold shadow-sm"
									>
										<div className="h-4 w-4 rounded-full bg-blue-200 dark:bg-blue-800/40 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-black uppercase">
											{name.charAt(0)}
										</div>
										{name}
								</span>
							))}
						</div>
					</div>
				)}

				{data.teamNames && data.teamNames.length > 0 && (
					<div className="flex flex-col gap-1.5">
							<div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
								Teams
							</div>
							<div className="flex flex-wrap gap-1.5">
								{data.teamNames.map((name: string, i: number) => (
									<span
										key={i}
										className="flex items-center gap-1.5 rounded-full border border-emerald-100 dark:border-emerald-800/40 px-2.5 py-1 text-xs bg-emerald-50 dark:bg-emerald-900/35 text-emerald-600 dark:text-emerald-300 font-bold shadow-sm"
									>
										<div className="h-4 w-4 rounded-full bg-emerald-200 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-[10px] font-black uppercase">
											{name.charAt(0)}
										</div>
										{name}
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Delete Button */}
			<button
				onClick={(e) => {
					e.stopPropagation()
					if (data.onDelete) data.onDelete(id)
				}}
					className="absolute -right-10 top-2 flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-rose-500 hover:text-white transition-all shadow-md group-hover:opacity-100 opacity-0"
					title="Delete node"
				>
				<Trash2 size={14} />
			</button>
		</div>
	)
}

const nodeTypes = {
	start: StartPointNode,
	condition: ConditionNode,
	action: ActionNode,
	end: EndNode,
	ai_generate: AI_NODE_COMPONENTS.ai_generate,
	ai_classify: AI_NODE_COMPONENTS.ai_classify,
	ai_handoff: AI_NODE_COMPONENTS.ai_handoff,
}

interface Flow {
	id: string
	name: string
	description?: string | null
	nodes: Node[]
	edges: Edge[]
	active?: boolean | null
}

interface FlowLabelOption {
	id: string
	name: string
	color: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

const asString = (value: unknown): string | null =>
	typeof value === 'string' && value.trim().length > 0 ? value : null

const toStringArray = (value: unknown): string[] => {
	if (!Array.isArray(value)) return []
	return value
		.map((item) => (typeof item === 'string' ? item.trim() : ''))
		.filter((item) => item.length > 0)
}

const normalizeLabelOption = (value: unknown): FlowLabelOption | null => {
	if (!isRecord(value)) return null

	const id = asString(value.id) || asString(value.label_id)
	if (!id) return null

	return {
		id,
		name:
			asString(value.name) ||
			asString(value.title) ||
			asString(value.label_name) ||
			id,
		color: asString(value.color),
	}
}

const normalizeAvailableLabels = (value: unknown): FlowLabelOption[] => {
	const candidates: unknown[] = []

	const pushCandidate = (candidate: unknown) => {
		if (Array.isArray(candidate)) {
			candidates.push(...candidate)
			return
		}

		if (!isRecord(candidate)) return

		const maybeLabel = normalizeLabelOption(candidate)
		if (maybeLabel) {
			candidates.push(candidate)
			return
		}

		if (Array.isArray(candidate.labels)) {
			candidates.push(...candidate.labels)
		}
	}

	pushCandidate(value)
	if (isRecord(value)) {
		pushCandidate(value.data)
		pushCandidate(value.payload)
	}

	const deduped = new Map<string, FlowLabelOption>()
	for (const candidate of candidates) {
		const normalized = normalizeLabelOption(candidate)
		if (!normalized) continue
		deduped.set(normalized.id, normalized)
	}

	return Array.from(deduped.values())
}

const normalizeImageList = (
	value: unknown,
): Array<{ url: string; fileName?: string }> => {
	if (!Array.isArray(value)) return []
	if (value.length === 0) return []

	const first = value[0]
	if (typeof first === 'string') {
		return value
			.map((item) => (typeof item === 'string' ? item.trim() : ''))
			.filter((url) => url.length > 0)
			.map((url) => ({ url }))
	}

	return value
		.filter(
			(item): item is { url: string; fileName?: string } =>
				isRecord(item) && typeof item.url === 'string' && item.url.trim().length > 0,
		)
		.map((item) => ({
			url: item.url,
			...(item.fileName ? { fileName: item.fileName } : {}),
		}))
}

const LEGACY_CONDITION_TYPE_MAP: Record<string, string> = {
	first_message_text: 'text',
	first_message_time: 'time',
	button_answer: 'button',
	else: 'else',
}

const CONDITION_LABEL_MAP: Record<string, string> = {
	text: 'First Message Text',
	time: 'First Message Time',
	button: 'Button Response',
	else: 'Else',
}

const normalizeLegacyNode = (node: Node): Node => {
	if (!isRecord(node)) return node

	const normalizedNode = { ...node }
	const rawData = isRecord(normalizedNode.data)
		? ({ ...normalizedNode.data } as Record<string, unknown>)
		: ({} as Record<string, unknown>)

	if (normalizedNode.type === 'send_message_buttons') {
		const firstImage =
			asString(rawData.imageUrl) ||
			(Array.isArray(rawData.images) && typeof rawData.images[0] === 'string'
				? rawData.images[0]
				: null)

		normalizedNode.type = 'action'
		normalizedNode.data = {
			...rawData,
			type: 'buttons',
			actionType: 'buttons',
			label: asString(rawData.label) || 'Message with Buttons',
			messageText: asString(rawData.messageText) || asString(rawData.text) || '',
			buttons: toStringArray(rawData.buttons),
			...(firstImage ? { media: { mediaUrl: firstImage } } : {}),
		}
		return normalizedNode
	}

	if (normalizedNode.type === 'condition') {
		const legacyConditionType = asString(rawData.conditionType)
		const conditionType =
			asString(rawData.type) ||
			(legacyConditionType ? LEGACY_CONDITION_TYPE_MAP[legacyConditionType] : null) ||
			'text'
		const isElse = conditionType === 'else'

		normalizedNode.data = {
			...rawData,
			type: conditionType,
			isElse: isElse || Boolean(rawData.isElse),
			label: asString(rawData.label) || CONDITION_LABEL_MAP[conditionType] || 'Condition',
		}
		return normalizedNode
	}

	if (normalizedNode.type === 'action') {
		const actionType =
			asString(rawData.actionType) || asString(rawData.type) || 'send_message'
		const normalizedActionType = actionType === 'message' ? 'send_message' : actionType

		if (normalizedActionType === 'buttons') {
			const firstImage =
				asString(rawData.imageUrl) ||
				(Array.isArray(rawData.images) && typeof rawData.images[0] === 'string'
					? rawData.images[0]
					: null)

			normalizedNode.data = {
				...rawData,
				type: 'buttons',
				actionType: 'buttons',
				label: asString(rawData.label) || 'Message with Buttons',
				messageText: asString(rawData.messageText) || asString(rawData.text) || '',
				buttons: toStringArray(rawData.buttons),
				...(firstImage ? { media: { mediaUrl: firstImage } } : {}),
			}
			return normalizedNode
		}

		if (normalizedActionType === 'send_message') {
			normalizedNode.data = {
				...rawData,
				type: 'send_message',
				actionType: 'send_message',
				label: asString(rawData.label) || 'Send Message',
				description: asString(rawData.description) || asString(rawData.text) || '',
				images: normalizeImageList(rawData.images),
			}
			return normalizedNode
		}

		normalizedNode.data = {
			...rawData,
			actionType: normalizedActionType,
		}
		return normalizedNode
	}

	if (normalizedNode.type === 'end') {
		const chatbotName =
			asString(rawData.chatbotName) ||
			(isRecord(rawData.chatbot) ? asString(rawData.chatbot.name) : null)

		const agentNames =
			Array.isArray(rawData.agentNames) && rawData.agentNames.length > 0
				? toStringArray(rawData.agentNames)
				: Array.isArray(rawData.agents)
					? rawData.agents
							.map((agent) =>
								isRecord(agent) && typeof agent.name === 'string'
									? agent.name.trim()
									: '',
							)
							.filter((name) => name.length > 0)
					: []

		const teamNames =
			Array.isArray(rawData.teamNames) && rawData.teamNames.length > 0
				? toStringArray(rawData.teamNames)
				: Array.isArray(rawData.teams)
					? rawData.teams
							.map((team) =>
								isRecord(team) && typeof team.name === 'string'
									? team.name.trim()
									: '',
							)
							.filter((name) => name.length > 0)
					: []

		normalizedNode.data = {
			...rawData,
			type:
				asString(rawData.type) || asString(rawData.endType) || asString(rawData.end_type),
			...(chatbotName ? { chatbotName } : {}),
			...(agentNames.length > 0 ? { agentNames } : {}),
			...(teamNames.length > 0 ? { teamNames } : {}),
		}
		return normalizedNode
	}

	return normalizedNode
}

const normalizeFlow = (value: unknown): Flow | null => {
	if (!isRecord(value)) return null

	const id = typeof value.id === 'string' ? value.id : ''
	if (!id) return null

	const normalizedNodes = Array.isArray(value.nodes)
		? (value.nodes as Node[]).map((node) => normalizeLegacyNode(node))
		: []

	return {
		id,
		name: typeof value.name === 'string' ? value.name : 'Untitled Flow',
		description:
			typeof value.description === 'string' ? value.description : null,
		nodes: normalizedNodes,
		edges: Array.isArray(value.edges) ? (value.edges as Edge[]) : [],
		active: typeof value.active === 'boolean' ? value.active : null,
	}
}

const normalizeFlows = (value: unknown): Flow[] => {
	if (!Array.isArray(value)) return []
	return value.filter(Boolean).reduce<Flow[]>((acc, item) => {
		const normalized = normalizeFlow(item)
		if (normalized) acc.push(normalized)
		return acc
	}, [])
}

const DRAFT_FLOW_ID_PREFIX = 'draft-'
const FLOW_AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000
const FLOW_SNAP_GRID: [number, number] = [20, 20]
const FLOW_DEFAULT_EDGE_OPTIONS = {
	type: 'smoothstep',
	style: { strokeWidth: 3 },
}

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 320
const nodeHeight = 280

const getLayoutedElements = (
	nodes: Node[],
	edges: Edge[],
	direction = 'TB',
) => {
	const isHorizontal = direction === 'LR'
	dagreGraph.setGraph({
		rankdir: direction,
		nodesep: 80, // horizontal spacing between nodes
		ranksep: 120, // vertical spacing between ranks/levels
		marginx: 40,
		marginy: 40,
	})

	nodes.forEach((node) => {
		// Dynamic height based on node type
		let height = nodeHeight
		const nodeData = node.data as any
		if (node.type === 'action' && nodeData?.buttons?.length > 0) {
			height = nodeHeight + nodeData.buttons.length * 30 // Extra height for buttons
		}
		if (node.type === 'action' && nodeData?.images?.length > 0) {
			height = height + 60 // Extra height for images
		}
		dagreGraph.setNode(node.id, { width: nodeWidth, height })
	})

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target)
	})

	dagre.layout(dagreGraph)

	const newNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id)
		return {
			...node,
			targetPosition: isHorizontal ? Position.Left : Position.Top,
			sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
			position: {
				x: nodeWithPosition.x - nodeWidth / 2,
				y: nodeWithPosition.y - nodeHeight / 2,
			},
		}
	})

	return { nodes: newNodes, edges }
}

function FlowsPage() {
	const [pageMode, setPageMode] = useState<'list' | 'editor'>('list')
	const [flows, setFlows] = useState<Flow[]>([])
	const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)
	const [isDraftFlow, setIsDraftFlow] = useState(false)
	const [isSavingFlow, setIsSavingFlow] = useState(false)
	const [nodes, setNodes] = useState<Node[]>([])
	const [edges, setEdges] = useState<Edge[]>([])
	const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
	const [editingNode, setEditingNode] = useState<Node | null>(null)
	const [aiConfigNode, setAiConfigNode] = useState<AINodeData | null>(null)
	const [availableLabels, setAvailableLabels] = useState<FlowLabelOption[]>([])
	const [availableAgents, setAvailableAgents] = useState<any[]>([])
	const [availableTeams, setAvailableTeams] = useState<any[]>([])
	const [availableChatbots, setAvailableChatbots] = useState<any[]>([])
	const [uploadingImages, setUploadingImages] = useState(false)

	// Search states for node settings dropdowns
	const [showAIAgentDropdown, setShowAIAgentDropdown] = useState(false)
	const [showAgentDropdown, setShowAgentDropdown] = useState(false)
	const [showTeamDropdown, setShowTeamDropdown] = useState(false)
	const [aiAgentSearch, setAIAgentSearch] = useState('')
	const [agentSearch, setAgentSearch] = useState('')
	const [teamSearch, setTeamSearch] = useState('')
	const aiAgentDropdownRef = useRef<HTMLDivElement>(null)
	const agentDropdownRef = useRef<HTMLDivElement>(null)
	const teamDropdownRef = useRef<HTMLDivElement>(null)
	const lastSavedSnapshotRef = useRef<string | null>(null)
	const selectedFlowRef = useRef<Flow | null>(null)
	const nodesRef = useRef<Node[]>([])
	const edgesRef = useRef<Edge[]>([])
	const pageModeRef = useRef<'list' | 'editor'>('list')
	const isDraftFlowRef = useRef(false)
	const isSavingFlowRef = useRef(false)

	const { fitView } = useReactFlow()
	const defaultEdgeOptions = useMemo(() => FLOW_DEFAULT_EDGE_OPTIONS, [])
	const labelsById = useMemo(
		() => new Map(availableLabels.map((label) => [label.id, label])),
		[availableLabels],
	)

	const buildFlowSnapshot = useCallback(
		(
			flow: Pick<Flow, 'name' | 'description' | 'active'> | null,
			flowNodes: Node[],
			flowEdges: Edge[],
		) => {
			if (!flow) return null

			return JSON.stringify({
				name: flow.name || '',
				description: flow.description || '',
				active: flow.active === false ? false : true,
				nodes: flowNodes,
				edges: flowEdges,
			})
		},
		[],
	)

	const syncSavedSnapshot = useCallback(
		(
			flow: Pick<Flow, 'name' | 'description' | 'active'> | null,
			flowNodes: Node[],
			flowEdges: Edge[],
		) => {
			lastSavedSnapshotRef.current = buildFlowSnapshot(
				flow,
				flowNodes,
				flowEdges,
			)
		},
		[buildFlowSnapshot],
	)

	useEffect(() => {
		selectedFlowRef.current = selectedFlow
	}, [selectedFlow])

	useEffect(() => {
		nodesRef.current = nodes
	}, [nodes])

	useEffect(() => {
		edgesRef.current = edges
	}, [edges])

	useEffect(() => {
		if (!selectedEdgeId) return
		if (edges.some((edge) => edge.id === selectedEdgeId)) return
		setSelectedEdgeId(null)
	}, [edges, selectedEdgeId])

	useEffect(() => {
		pageModeRef.current = pageMode
	}, [pageMode])

	useEffect(() => {
		isDraftFlowRef.current = isDraftFlow
	}, [isDraftFlow])

	useEffect(() => {
		isSavingFlowRef.current = isSavingFlow
	}, [isSavingFlow])

	// Fetch flows
	useEffect(() => {
		const fetchInitialData = async () => {
			try {
				// Fetch flows
				const res = await (automationFlows.list() as Promise<any>)
				if (res.success) {
					setFlows(normalizeFlows(res.payload || res.data || []))
				}

				// Fetch labels
				const lRes = await (labelsApi.list() as Promise<any>)
				setAvailableLabels(normalizeAvailableLabels(lRes))

				// Fetch agents
				const aRes = await (agentsApi.list() as Promise<any>)
				if (aRes.success || Array.isArray(aRes) || aRes.data) {
					const data = aRes.payload || aRes.data || aRes
					setAvailableAgents(Array.isArray(data) ? data : [])
				}

				// Fetch teams
				const tRes = await (teamsApi.list() as Promise<any>)
				if (tRes.success || Array.isArray(tRes) || tRes.data) {
					const data = tRes.payload || tRes.data || tRes
					setAvailableTeams(Array.isArray(data) ? data : [])
				}

				// Fetch chatbots
				const cRes = await (chatbotsApi.list() as Promise<any>)
				if (cRes.success || Array.isArray(cRes) || cRes.data) {
					const data = cRes.payload || cRes.data || cRes
					setAvailableChatbots(Array.isArray(data) ? data : [])
				}
			} catch (err) {
				console.error('Failed to fetch initial data:', err)
				toast.error('Failed to load initial data')
			}
		}
		fetchInitialData()
	}, [])

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				aiAgentDropdownRef.current &&
				!aiAgentDropdownRef.current.contains(event.target as globalThis.Node)
			) {
				setShowAIAgentDropdown(false)
				setAIAgentSearch('')
			}
			if (
				agentDropdownRef.current &&
				!agentDropdownRef.current.contains(event.target as globalThis.Node)
			) {
				setShowAgentDropdown(false)
				setAgentSearch('')
			}
			if (
				teamDropdownRef.current &&
				!teamDropdownRef.current.contains(event.target as globalThis.Node)
			) {
				setShowTeamDropdown(false)
				setTeamSearch('')
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const selectFlowNode = useCallback((nodeId: string) => {
		setSelectedEdgeId(null)
		setNodes((nds) =>
			nds.map((node) => ({
				...node,
				selected: node.id === nodeId,
			})),
		)
	}, [])

		const onNodeClick = useCallback(
			(event: React.MouseEvent, node: Node) => {
				const target = event.target as HTMLElement | null
				if (target?.closest('[data-prevent-node-settings="true"]')) {
					return
				}

				setSelectedEdgeId(null)

				// Start nodes have no side-panel settings; avoid extra state churn
				// so in-node action controls remain responsive.
				if (node.type === 'start') {
					return
				}

				// Check if this is an AI node
				if (
					node.type === 'ai_generate' ||
				node.type === 'ai_classify' ||
				node.type === 'ai_handoff'
			) {
				setAiConfigNode(node.data as unknown as AINodeData)
			} else {
				setEditingNode(node)
			}
		},
		[setSelectedEdgeId],
	)

	const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
		event.preventDefault()
		event.stopPropagation()
		setSelectedEdgeId(edge.id)
		setEditingNode(null)
		setAiConfigNode(null)
	}, [])

	const onPaneClick = useCallback(() => {
		setSelectedEdgeId(null)
	}, [])

	const renderedEdges = useMemo(() => {
		return edges.map((edge) => {
			const baseStrokeWidth =
				typeof edge.style?.strokeWidth === 'number' ? edge.style.strokeWidth : 3
			const isSelected = edge.id === selectedEdgeId

			return {
				...edge,
				selected: isSelected,
				animated: isSelected ? true : edge.animated,
				style: {
					...edge.style,
					strokeWidth: isSelected ? baseStrokeWidth + 2 : baseStrokeWidth,
					filter: isSelected
						? 'drop-shadow(0 0 6px rgba(37, 99, 235, 0.5))'
						: 'none',
					cursor: 'pointer',
				},
			}
		})
	}, [edges, selectedEdgeId])

	const renderedNodes = useMemo(() => {
		if (availableLabels.length === 0) return nodes

		return nodes.map((node) => {
			if (node.type !== 'action') return node

			const nodeData = node.data as any
			const actionType = nodeData.actionType || nodeData.type
			if (actionType !== 'label') return node

			const labelIds = toStringArray(nodeData.labels)
			if (labelIds.length === 0) return node

			return {
				...node,
				data: {
					...nodeData,
					labelDisplayNames: labelIds.map(
						(labelId) => labelsById.get(labelId)?.name || labelId,
					),
				},
			}
		})
	}, [availableLabels.length, labelsById, nodes])

	const updateNodeData = useCallback((id: string, newData: any) => {
		setNodes((nds) =>
			nds.map((node) => {
				if (node.id === id) {
					const updatedData = { ...node.data, ...newData }

					// Handle condition type change
					if (newData.type && node.type === 'condition') {
						const conditionLabels: Record<string, string> = {
							text: 'First Message Text',
							time: 'First Message Time',
							button: 'Button Response',
							else: 'Else',
						}
						updatedData.label =
							conditionLabels[newData.type] || updatedData.label
						updatedData.isElse = newData.type === 'else'

						// Clear text if switching to else
						if (newData.type === 'else') {
							updatedData.text = ''
						}
					}

					return { ...node, data: updatedData }
				}
				return node
			}),
		)
		// Also update the editingNode reference so the UI reflects changes
		setEditingNode((prev) => {
			if (prev?.id === id) {
				const updatedData = { ...prev.data, ...newData }
				if (newData.type && prev.type === 'condition') {
					const conditionLabels: Record<string, string> = {
						text: 'First Message Text',
						time: 'First Message Time',
						button: 'Button Response',
						else: 'Else',
					}
					updatedData.label = conditionLabels[newData.type] || updatedData.label
					updatedData.isElse = newData.type === 'else'
					if (newData.type === 'else') updatedData.text = ''
				}
				return { ...prev, data: updatedData }
			}
			return prev
		})
	}, [])

	const handleSaveAIConfig = useCallback(
		(data: AINodeData) => {
			// Update the node with new AI config data
			updateNodeData(data.id || '', data)
			setAiConfigNode(null)
		},
		[updateNodeData],
	)

	const handleCancelAIConfig = useCallback(() => {
		setAiConfigNode(null)
	}, [])

	const onLayout = useCallback(
		(direction: string) => {
			const { nodes: layoutedNodes, edges: layoutedEdges } =
				getLayoutedElements(nodes, edges, direction)

			setNodes([...layoutedNodes])
			setEdges([...layoutedEdges])

			window.requestAnimationFrame(() => {
				fitView()
			})
		},
		[nodes, edges, fitView],
	)

	const onNodesChange = useCallback(
		(changes: NodeChange[]) =>
			setNodes((nds) => applyNodeChanges(changes, nds)),
		[],
	)
	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) =>
			setEdges((eds) => applyEdgeChanges(changes, eds)),
		[],
	)
	const onConnect = useCallback(
		(params: Connection) => setEdges((eds) => addEdge(params, eds)),
		[],
	)

	const addEndAfter = useCallback(
		(parentId: string, type: string) => {
			const newNodeId = `end-${Date.now()}`

			setNodes((nds) => {
				const parent = nds.find((n) => n.id === parentId)
				if (!parent) return nds

				const newNode: Node = {
					id: newNodeId,
					type: 'end',
					position: { x: parent.position.x, y: parent.position.y + 160 },
					data: {
						type,
						onSelect: () => selectFlowNode(newNodeId),
						onDelete: (id: string) =>
							setNodes((curr) => curr.filter((n) => n.id !== id)),
					},
				}
				return [...nds, newNode]
			})

			setEdges((eds) => [
				...eds,
				{
					id: `e-${parentId}-${newNodeId}`,
					source: parentId,
					target: newNodeId,
					animated: true,
					style: {
						stroke: type === 'ai_agent' ? '#a855f7' : '#6366f1',
						strokeWidth: 3,
					},
				},
			])
		},
		[selectFlowNode],
	)

	const addConditionAfter = useCallback(
		(parentId: string, type: string) => {
			const conditionLabels: Record<string, string> = {
				text: 'First Message Text',
				time: 'First Message Time',
				button: 'Button Response',
				else: 'Else',
			}

			const now = Date.now()
			const condId = type === 'text' ? `cond-text-${now}` : `cond-${now}`
			const elseId = `cond-else-${now}`

			const createNode = (
				id: string,
				nodeType: string,
				label: string,
				parentPos: { x: number; y: number },
				offset: { x: number; y: number },
				isElse = false,
			) => ({
				id,
				type: 'condition',
				position: { x: parentPos.x + offset.x, y: parentPos.y + offset.y },
				data: {
					label,
					type: nodeType,
					isElse,
					onSelect: () => selectFlowNode(id),
					onAddAction: (t: string) => addActionAfter(id, t),
					onAddEnd: (t: string) => addEndAfter(id, t),
					onDelete: (nid: string) =>
						setNodes((nds) => nds.filter((n) => n.id !== nid)),
				},
			})

			const createEdge = (source: string, target: string) => ({
				id: `e-${source}-${target}`,
				source,
				target,
				animated: true,
				style: { stroke: '#f59e0b', strokeWidth: 3 },
			})

			setNodes((nds) => {
				const parent = nds.find((n) => n.id === parentId)
				if (!parent) return nds

				let newNodes = []
				if (type === 'text') {
					newNodes = [
						createNode(condId, 'text', 'First Message Text', parent.position, {
							x: -180,
							y: 220,
						}),
						createNode(
							elseId,
							'else',
							'Else',
							parent.position,
							{ x: 180, y: 220 },
							true,
						),
					]
				} else if (type === 'button') {
					newNodes = [
						createNode(condId, 'button', 'Button Response', parent.position, {
							x: -180,
							y: 220,
						}),
						createNode(
							elseId,
							'else',
							'Else',
							parent.position,
							{ x: 180, y: 220 },
							true,
						),
					]
				} else {
					newNodes = [
						createNode(
							condId,
							type,
							conditionLabels[type] || 'Condition',
							parent.position,
							{ x: 0, y: 220 },
						),
					]
				}

				// Automatically select the first new node
				if (newNodes.length > 0) {
					setEditingNode(newNodes[0])
				}

				return [...nds, ...newNodes]
			})

			setEdges((eds) => {
				if (type === 'text' || type === 'button') {
					return [
						...eds,
						createEdge(parentId, condId),
						createEdge(parentId, elseId),
					]
				} else {
					return [...eds, createEdge(parentId, condId)]
				}
			})
		},
		[addEndAfter, selectFlowNode],
	)

	const addActionAfter = useCallback(
		(parentId: string, type: string) => {
			const newNodeId = `act-${Date.now()}`
			const isAINode = type.startsWith('ai_')

			setNodes((nds) => {
				const parent = nds.find((n) => n.id === parentId)
				if (!parent) return nds

				// For AI nodes, get default data from AINodeTypes
				const aiDefaultData = isAINode ? getAINodeDefaultData(type) : {}

				const newNode: Node = {
					id: newNodeId,
					type: isAINode ? type : 'action',
					position: { x: parent.position.x, y: parent.position.y + 180 },
					data: {
						...aiDefaultData,
						id: newNodeId,
						type,
						label: isAINode
							? aiDefaultData?.label ||
								type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
							: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
						onSelect: () => selectFlowNode(newNodeId),
						onAddAction: (t: string) => addActionAfter(newNodeId, t),
						onAddEnd: (t: string) => addEndAfter(newNodeId, t),
						onAddCondition: (t: string) => addConditionAfter(newNodeId, t),
						onDelete: (id: string) =>
							setNodes((curr) => curr.filter((n) => n.id !== id)),
						...(type === 'buttons' ? { buttons: [''], messageText: '' } : {}),
					},
				}

				setEditingNode(newNode)
				return [...nds, newNode]
			})

			setEdges((eds) => [
				...eds,
				{
					id: `e-${parentId}-${newNodeId}`,
					source: parentId,
					target: newNodeId,
					animated: true,
					style: { stroke: isAINode ? '#8b5cf6' : '#10b981', strokeWidth: 3 },
				},
			])

			// AUTO-ADD ELSE PATH FOR BUTTONS
			if (type === 'buttons') {
				setTimeout(() => {
					addConditionAfter(newNodeId, 'else')
				}, 50)
			}
		},
		[addEndAfter, addConditionAfter, selectFlowNode],
	)

	// Inject handlers to nodes (used when loading a flow or switching)
	const injectHandlers = useCallback(
		(nds: Node[]) => {
			return nds.map((node) => {
				const handlers: any = {
					onSelect: () => selectFlowNode(node.id),
					onDelete: (nid: string) =>
						setNodes((curr) => curr.filter((n) => n.id !== nid)),
				}

				if (node.type === 'start') {
					handlers.onAddCondition = (t: string) => addConditionAfter(node.id, t)
				}
				if (node.type === 'condition') {
					handlers.onAddAction = (t: string) => addActionAfter(node.id, t)
					handlers.onAddEnd = (t: string) => addEndAfter(node.id, t)
				}
				if (node.type === 'action') {
					handlers.onAddAction = (t: string) => addActionAfter(node.id, t)
					handlers.onAddEnd = (t: string) => addEndAfter(node.id, t)
					if (node.data.type === 'buttons') {
						handlers.onAddCondition = (t: string) =>
							addConditionAfter(node.id, t)
					}
				}
				// AI nodes
				if (node.type === 'ai_generate' || node.type === 'ai_classify') {
					handlers.onAddAction = (t: string) => addActionAfter(node.id, t)
					handlers.onAddEnd = (t: string) => addEndAfter(node.id, t)
				}
				if (node.type === 'ai_handoff') {
					handlers.onAddEnd = (t: string) => addEndAfter(node.id, t)
				}

				return {
					...node,
					data: {
						...node.data,
						...handlers,
					},
				}
			})
		},
		[addConditionAfter, addActionAfter, addEndAfter, selectFlowNode],
	)

	const handleDeleteFlow = async (id: string) => {
		try {
			const res = await automationFlows.delete(id)
			if (res.success) {
				setFlows((prev) => prev.filter((f) => f.id !== id))
				toast.success('Flow deleted successfully')
			}
		} catch (err) {
			toast.error('Failed to delete flow')
		}
	}

	const handleSelectFlow = (flow: Flow) => {
		setSelectedFlow(flow)
		setIsDraftFlow(false)
		setSelectedEdgeId(null)

		// Apply auto layout when opening a flow
		const injectedNodes = injectHandlers(flow.nodes)
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			injectedNodes,
			flow.edges,
			'TB',
		)

		setNodes(layoutedNodes)
		setEdges(layoutedEdges)
		syncSavedSnapshot(flow, layoutedNodes, layoutedEdges)
		setPageMode('editor')

		// Fit view after layout is applied
		setTimeout(() => {
			fitView({ padding: 0.2 })
		}, 100)
	}

	const handleCloneFlow = async (flow: Flow) => {
		try {
			const clonedData: any = {
				...JSON.parse(JSON.stringify(flow)),
				id: undefined,
				name: `${flow.name} (Copy)`,
			}
			const res = await automationFlows.create(clonedData)
			if (res.success) {
				const clonedFlow = normalizeFlow(res.payload)
				if (!clonedFlow) {
					toast.error('Failed to clone flow')
					return
				}

				setFlows((prev) => [clonedFlow, ...prev])
				toast.success('Flow cloned successfully')
			}
		} catch (err) {
			toast.error('Failed to clone flow')
		}
	}

	const handleToggleFlowActive = async (flow: Flow) => {
		try {
			const res = await automationFlows.update(flow.id, {
				active: !flow.active,
			})
			if (res.success) {
				const updatedFlow = normalizeFlow(res.payload)
				if (!updatedFlow) {
					toast.error('Failed to update flow status')
					return
				}

				const listRes = await automationFlows.list()
				if (listRes.success) {
					const normalizedList = (listRes.payload || [])
						.map((item) => normalizeFlow(item))
						.filter((item): item is Flow => Boolean(item))
					setFlows(normalizedList)
				} else {
					setFlows((prev) =>
						prev.map((f) => (f.id === updatedFlow.id ? updatedFlow : f)),
					)
				}
				toast.success(
					updatedFlow.active === true ? 'Flow activated' : 'Flow deactivated',
				)
			}
		} catch (err) {
			toast.error('Failed to update flow status')
		}
	}

	const handlePublish = async () => {
		if (!selectedFlow) return
		try {
			if (isSavingFlowRef.current) return

			isSavingFlowRef.current = true
			setIsSavingFlow(true)

			if (isDraftFlow) {
				const res = await automationFlows.create({
					name: selectedFlow.name || 'Untitled Flow',
					description: selectedFlow.description,
					trigger_type: 'manual',
					nodes,
					edges,
					active: false,
				})

				if (res.success) {
					const savedFlow = normalizeFlow(res.payload)
					if (!savedFlow) {
						toast.error('Failed to save flow')
						return
					}

					setFlows((prev) => [savedFlow, ...prev])
					setSelectedFlow(savedFlow)
					setIsDraftFlow(false)
					syncSavedSnapshot(savedFlow, nodes, edges)
					toast.success('Flow saved!', {
						description:
							'Draft created and synced to the database as inactive.',
					})
				} else {
					toast.error('Failed to save flow')
				}
				return
			}

			const currentSnapshot = buildFlowSnapshot(selectedFlow, nodes, edges)
			if (currentSnapshot && lastSavedSnapshotRef.current === currentSnapshot) {
				toast.info('No changes to save')
				return
			}

			const res = await automationFlows.update(selectedFlow.id, {
				name: selectedFlow.name,
				description: selectedFlow.description,
				nodes,
				edges,
				active: selectedFlow.active === false ? false : true,
			})
			if (res.success) {
				const updatedFlow = normalizeFlow(res.payload)
				if (!updatedFlow) {
					toast.error('Failed to save flow')
					return
				}

				setSelectedFlow(updatedFlow)
				setFlows((prev) =>
					prev.map((f) => (f.id === updatedFlow.id ? updatedFlow : f)),
				)
				syncSavedSnapshot(updatedFlow, nodes, edges)
				toast.success('Flow saved!', {
					description: 'Your changes have been synced to the database.',
				})
			} else {
				toast.error('Failed to save flow')
			}
		} catch (err) {
			toast.error('Failed to save flow')
		} finally {
			isSavingFlowRef.current = false
			setIsSavingFlow(false)
		}
	}

	useEffect(() => {
		const intervalId = window.setInterval(async () => {
			const currentFlow = selectedFlowRef.current
			const currentNodes = nodesRef.current
			const currentEdges = edgesRef.current

			if (
				!currentFlow ||
				isDraftFlowRef.current ||
				isSavingFlowRef.current ||
				pageModeRef.current !== 'editor'
			)
				return

			const currentSnapshot = buildFlowSnapshot(
				currentFlow,
				currentNodes,
				currentEdges,
			)
			if (!currentSnapshot || currentSnapshot === lastSavedSnapshotRef.current)
				return

			try {
				isSavingFlowRef.current = true
				setIsSavingFlow(true)
				const res = await automationFlows.update(currentFlow.id, {
					name: currentFlow.name,
					description: currentFlow.description,
					nodes: currentNodes,
					edges: currentEdges,
					active: currentFlow.active === false ? false : true,
				})

				if (res.success) {
					const updatedFlow = normalizeFlow(res.payload)
					if (!updatedFlow) return

					setSelectedFlow(updatedFlow)
					setFlows((prev) =>
						prev.map((f) => (f.id === updatedFlow.id ? updatedFlow : f)),
					)
					syncSavedSnapshot(updatedFlow, currentNodes, currentEdges)
				}
			} catch (err) {
				console.error('Flow autosave failed:', err)
			} finally {
				isSavingFlowRef.current = false
				setIsSavingFlow(false)
			}
		}, FLOW_AUTOSAVE_INTERVAL_MS)

		return () => {
			window.clearInterval(intervalId)
		}
	}, [buildFlowSnapshot, syncSavedSnapshot])

	if (pageMode === 'list') {
		return (
			<div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
				<div className="bg-white border-b border-gray-200 px-8 py-8">
					<div className="flex items-center justify-between max-w-7xl mx-auto w-full">
						<div>
							<h1 className="text-3xl font-black text-gray-900">
								Automation Flows
							</h1>
							<p className="text-gray-500 mt-2 font-medium">
								Design and manage your customer interaction workflows
							</p>
						</div>
						<Button
							className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-2xl shadow-xl shadow-blue-100 transition-all hover:scale-105"
							onClick={async () => {
								try {
									const draftId = `${DRAFT_FLOW_ID_PREFIX}${Date.now()}`
									const draftFlow: Flow = {
										id: draftId,
										name: 'Untitled Flow',
										description: '',
										nodes: [
											{
												id: 'start-1',
												type: 'start',
												position: { x: 500, y: 100 },
												data: { label: 'Start' },
											},
										],
										edges: [],
										active: false,
									}

									const injectedNodes = injectHandlers(draftFlow.nodes)
									const { nodes: layoutedNodes, edges: layoutedEdges } =
										getLayoutedElements(injectedNodes, draftFlow.edges, 'TB')

									setNodes(layoutedNodes)
									setEdges(layoutedEdges)
									setSelectedEdgeId(null)
									setSelectedFlow(draftFlow)
									setIsDraftFlow(true)
									syncSavedSnapshot(null, layoutedNodes, layoutedEdges)
									setPageMode('editor')
									toast.success(
										'New draft flow ready. Click Save to create it.',
									)

									setTimeout(() => {
										fitView({ padding: 0.2 })
									}, 100)
								} catch (err) {
									toast.error('Failed to create flow')
								}
							}}
						>
							<Plus size={20} className="mr-2" strokeWidth={3} />
							Create New Flow
						</Button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-8">
					<div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{flows.map((flow) => (
							<Card
								key={flow.id}
								className="group p-6 rounded-3xl border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white relative"
								onClick={() => handleSelectFlow(flow)}
							>
								<div className="absolute top-6 right-6">
									<DropdownMenu>
										<DropdownMenuTrigger
											asChild
											onClick={(e) => e.stopPropagation()}
										>
											<Button
												variant="ghost"
												size="icon"
												className="rounded-xl hover:bg-gray-100 text-gray-400"
											>
												<MoreHorizontal size={20} />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="w-48 rounded-xl shadow-2xl border-gray-100 p-1"
										>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation()
													handleToggleFlowActive(flow)
												}}
												className="rounded-lg py-2.5 font-bold text-gray-700"
											>
												{flow.active !== false ? (
													<>
														<div className="w-4 h-4 rounded-full bg-gray-300 mr-2" />
														Deactivate
													</>
												) : (
													<>
														<div className="w-4 h-4 rounded-full bg-emerald-500 mr-2" />
														Activate
													</>
												)}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation()
													handleCloneFlow(flow)
												}}
												className="rounded-lg py-2.5 font-bold text-gray-700"
											>
												<Copy size={16} className="mr-2 text-blue-500" />
												Clone Flow
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={(e) => e.stopPropagation()}
												className="rounded-lg py-2.5 font-bold text-gray-700"
											>
												<Settings size={16} className="mr-2 text-gray-400" />
												Settings
											</DropdownMenuItem>
											<div className="h-px bg-gray-100 my-1" />
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation()
													handleDeleteFlow(flow.id)
												}}
												className="rounded-lg py-2.5 font-bold text-red-600 hover:text-red-700 hover:bg-red-50"
											>
												<Trash2 size={16} className="mr-2" />
												Delete Flow
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								<div className="flex items-start justify-between mb-6">
									<div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
										<Zap size={24} fill="currentColor" />
									</div>
								</div>
								<h3 className="text-xl font-black text-gray-900 mb-1">
									{flow.name}
								</h3>
								<p className="text-sm text-gray-500 font-medium leading-relaxed">
									Active on WhatsApp Channel • {flow.nodes.length} logic steps
								</p>
								<div className="mt-6 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div
											className={`w-2 h-2 rounded-full ${flow.active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}
										/>
										<span
											className={`text-[10px] font-black uppercase tracking-widest ${flow.active !== false ? 'text-emerald-600' : 'text-gray-400'}`}
										>
											{flow.active !== false ? 'Active' : 'Inactive'}
										</span>
									</div>
									<ChevronRight
										size={20}
										className="text-gray-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all"
									/>
								</div>
							</Card>
						))}

						{/* Empty States / Skeleton */}
						<div className="border-2 border-dashed border-gray-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center opacity-50">
							<div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
								<Activity size={24} />
							</div>
							<p className="text-sm font-bold text-gray-400">
								Add more integrations
								<br />
								to see flows here
							</p>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<>
			<div className="h-screen w-full bg-background flex flex-col">
				<div className="bg-white border-b border-gray-200 h-20 px-6 flex items-center justify-between shrink-0 z-50">
					<div className="flex items-center gap-6 flex-1">
						<button
							onClick={() => setPageMode('list')}
							className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-all border border-gray-100 shadow-sm"
						>
							<ChevronRight size={24} className="rotate-180" />
						</button>

						<div className="w-px h-8 bg-gray-100" />

						<div className="flex flex-col gap-0.5 flex-1 max-w-2xl">
							<input
								type="text"
								value={selectedFlow?.name || ''}
								onChange={(e) =>
									setSelectedFlow((prev) =>
										prev ? { ...prev, name: e.target.value } : null,
									)
								}
								placeholder="Enter flow name"
								className="text-xl font-black text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-300 w-full p-0 h-7"
							/>
							<input
								type="text"
								value={selectedFlow?.description || ''}
								onChange={(e) =>
									setSelectedFlow((prev) =>
										prev ? { ...prev, description: e.target.value } : null,
									)
								}
								placeholder="Enter flow description"
								className="text-sm font-medium text-gray-400 bg-transparent border-none outline-none placeholder:text-gray-300 w-full p-0 h-5"
							/>
						</div>
					</div>

					<div className="flex items-center gap-4">
						{/* Active/Inactive Toggle */}
						<div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
							<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
								{selectedFlow?.active !== false ? 'Active' : 'Inactive'}
							</span>
							<button
								onClick={async () => {
									if (!selectedFlow) return
									if (isDraftFlow) {
										setSelectedFlow((prev) =>
											prev
												? {
														...prev,
														active: prev.active === false ? true : false,
													}
												: null,
										)
										return
									}
									try {
										const res = await automationFlows.update(selectedFlow.id, {
											active: selectedFlow.active === false ? true : false,
										})
										if (res.success) {
											const updatedFlow = normalizeFlow(res.payload)
											if (!updatedFlow) {
												toast.error('Failed to update flow status')
												return
											}

											setSelectedFlow((prev) =>
												prev
													? {
															...prev,
															active: updatedFlow.active === true,
														}
													: null,
											)
											const listRes = await automationFlows.list()
											if (listRes.success) {
												const normalizedList = (listRes.payload || [])
													.map((item) => normalizeFlow(item))
													.filter((item): item is Flow => Boolean(item))
												setFlows(normalizedList)

												const latestSelected = normalizedList.find(
													(item) => item.id === updatedFlow.id,
												)
												if (latestSelected) {
													setSelectedFlow((prev) =>
														prev
															? {
																	...prev,
																	active: latestSelected.active,
																}
															: null,
													)
												}
											} else {
												setFlows((prev) =>
													prev.map((f) =>
														f.id === updatedFlow.id ? updatedFlow : f,
													),
												)
											}
											toast.success(
												updatedFlow.active === true
													? 'Flow activated'
													: 'Flow deactivated',
											)
										}
									} catch (err) {
										toast.error('Failed to update flow status')
									}
								}}
								className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${selectedFlow?.active !== false ? 'bg-emerald-500' : 'bg-gray-300'}`}
								role="switch"
								aria-checked={selectedFlow?.active !== false}
							>
								<span
									className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${selectedFlow?.active !== false ? 'translate-x-5' : 'translate-x-0'}`}
								/>
							</button>
						</div>

						<Button
							className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 px-8 shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
							onClick={handlePublish}
							disabled={isSavingFlow}
						>
							<Save size={18} />
							{isSavingFlow ? 'Saving...' : 'Save'}
						</Button>
					</div>
				</div>

				<div className="flex-1 relative overflow-hidden">
					<ReactFlow
						nodes={renderedNodes}
						edges={renderedEdges}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						onConnect={onConnect}
						onNodeClick={onNodeClick}
						onEdgeClick={onEdgeClick}
						onPaneClick={onPaneClick}
						nodeTypes={nodeTypes}
						fitView
						onlyRenderVisibleElements
						snapToGrid
						snapGrid={FLOW_SNAP_GRID}
						panOnScroll
						panOnScrollMode={PanOnScrollMode.Free}
						panOnScrollSpeed={0.75}
						zoomOnPinch
						proOptions={{ hideAttribution: true }}
						defaultEdgeOptions={defaultEdgeOptions}
					>
						<Background
							color="#cbd5e1"
							variant={BackgroundVariant.Dots}
							gap={20}
							size={1}
						/>
						<Controls className="!bg-white !border-gray-100 !shadow-xl rounded-xl overflow-hidden" />
						<Panel
							position="top-right"
							className="bg-white/80 backdrop-blur-md px-2 py-1 rounded-xl border border-white/50 shadow-lg m-2 flex items-center gap-2"
						>
							<div className="flex items-center gap-1.5 pr-2 border-r border-gray-200">
								<div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
								<span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
									Live
								</span>
							</div>
							<button
								className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
								onClick={() => onLayout('TB')}
							>
								<Wand2 size={12} />
								Auto Layout
							</button>
						</Panel>
						<Panel
							position="bottom-left"
							className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50 shadow-sm m-4"
						>
							<p className="text-[10px] font-bold text-gray-400">
								Scroll to pan • Pinch to zoom • Click + to add logic
							</p>
						</Panel>
					</ReactFlow>

					{/* Right Sidebar for Editing */}
					{editingNode && (
						<div className="absolute top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-[100] border-l border-gray-100 animate-in slide-in-from-right duration-300 flex flex-col">
							<div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
								<h2 className="font-black text-gray-900 flex items-center gap-2">
									<Settings size={18} className="text-blue-600" />
									{editingNode.type === 'condition'
										? 'Configure Condition'
										: 'Node Settings'}
								</h2>
								<button
									onClick={() => setEditingNode(null)}
									className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
								>
									<X size={20} />
								</button>
							</div>

							<div
								className="flex-1 overflow-y-auto scrollbar-hide"
								style={{ scrollbarWidth: 'none' }}
							>
								<div className="flex flex-col gap-4">
									{editingNode.type === 'condition' && (
										<>
											<div className="flex flex-col gap-1 border-b border-gray-200 px-4 py-6">
												<p className="text-sm font-bold text-gray-700">
													Condition
												</p>
												<select
													className="w-full rounded-md border border-gray-300 p-1.5 text-gray-500"
													value={
														(editingNode.data.type as string) ||
														(editingNode.data.isElse ? 'else' : 'text')
													}
													onChange={(e) =>
														updateNodeData(editingNode.id, {
															type: e.target.value,
														})
													}
												>
													<option value="text">First Message Text</option>
													<option value="button">Button Response</option>
													<option value="time">First Message Time</option>
													<option value="else">Else</option>
												</select>
											</div>

											{!editingNode.data.isElse && (
												<div className="mx-4 rounded-md border border-gray-200 p-3">
													<label className="mb-4 block text-sm font-bold text-gray-700">
														{editingNode.data.type === 'button'
															? 'Button Text to Match'
															: 'First Message Text'}
													</label>
													<textarea
														placeholder={
															editingNode.data.type === 'button'
																? 'Enter exact button text'
																: 'Input one or more trigger keywords'
														}
														className="w-full rounded-lg border border-gray-200 p-2 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
														style={{ height: '135.6px' }}
														value={(editingNode.data.text as string) || ''}
														onChange={(e) =>
															updateNodeData(editingNode.id, {
																text: e.target.value,
															})
														}
													></textarea>
													{editingNode.data.type !== 'button' && (
														<p className="text-xs text-gray-500 mt-2">
															Use commas to separate words.
														</p>
													)}
												</div>
											)}

											{editingNode.data.isElse && (
												<div className="mx-4 space-y-3">
													<p className="text-sm font-black text-gray-900 leading-tight">
														Else
													</p>
													<div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
														<p className="text-[12px] text-gray-500 font-medium italic">
															This path will be taken if other conditions are
															not met.
														</p>
													</div>
												</div>
											)}
										</>
									)}

									{editingNode.type === 'action' && (
										<>
											{(() => {
												const nodeData = editingNode.data as any
												const actionType =
													nodeData.actionType ||
													(nodeData.type === 'buttons'
														? 'buttons'
														: 'send_message')

												return (
													<div className="flex flex-col gap-4">
														<div className="flex flex-col gap-1 border-b border-gray-200 px-4 py-6">
															<p className="text-sm font-bold text-gray-700">
																Action
															</p>
															<select
																className="w-full rounded-md border border-gray-300 p-1.5 text-gray-500"
																value={actionType}
																onChange={(e) =>
																	updateNodeData(editingNode.id, {
																		actionType: e.target.value,
																		type: e.target.value,
																		label: e.target.value
																			.split('_')
																			.map(
																				(w: string) =>
																					w.charAt(0).toUpperCase() +
																					w.slice(1),
																			)
																			.join(' '),
																	})
																}
															>
																<option value="label">Label</option>
																<option value="collaborator">
																	Collaborator
																</option>
																<option value="send_message">
																	Send Message
																</option>
																<option value="webhook">Webhook</option>
																<option value="jump_to_action">
																	Jump to Action
																</option>
																<option value="buttons">
																	Message with Buttons
																</option>
															</select>
														</div>

														<div className="mx-4">
															{actionType === 'label' && (
																<div className="space-y-4">
																	<label className="block text-sm font-bold text-gray-700">
																		Label
																	</label>
																	<div className="relative">
																		<DropdownMenu>
																			<DropdownMenuTrigger asChild>
																				<div className="flex w-full items-center justify-between rounded-lg border border-gray-300 p-2 text-left hover:bg-gray-50 gap-2">
																					<div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
																						{(nodeData.labels || []).length >
																						0 ? (
																							(nodeData.labels || []).map(
																								(labelId: string) => {
																									const labelObj =
																										labelsById.get(labelId)
																									return (
																										<span
																											key={labelId}
																											className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs whitespace-nowrap flex-shrink-0"
																											style={{
																												backgroundColor:
																													labelObj?.color ||
																													'#0017fe',
																												color: 'white',
																											}}
																										>
																											<span className="truncate max-w-[120px]">
																												{labelObj?.name ||
																													labelId}
																											</span>
																											<button
																												type="button"
																												onClick={(e) => {
																													e.stopPropagation()
																													const next = (
																														nodeData.labels ||
																														[]
																													).filter(
																														(id: string) =>
																															id !== labelId,
																													)
																													updateNodeData(
																														editingNode.id,
																														{ labels: next },
																													)
																												}}
																												className="ml-1 flex-shrink-0 cursor-pointer text-white/80 hover:text-white"
																											>
																												<X size={14} />
																											</button>
																										</span>
																									)
																								},
																							)
																						) : (
																							<span className="text-sm text-gray-400">
																								Select labels...
																							</span>
																						)}
																					</div>
																					<ChevronDown
																						size={20}
																						className="text-gray-400"
																					/>
																				</div>
																				</DropdownMenuTrigger>
																				<DropdownMenuContent className="w-[300px] max-h-[300px] overflow-y-auto">
																					{availableLabels.map((l) => (
																						<DropdownMenuItem
																							key={l.id}
																							onClick={() => {
																							const current =
																								nodeData.labels || []
																							if (!current.includes(l.id)) {
																								updateNodeData(editingNode.id, {
																									labels: [...current, l.id],
																								})
																							}
																						}}
																						className="flex items-center justify-between"
																					>
																						<span>{l.name}</span>
																						<div
																							className="w-3 h-3 rounded-full"
																							style={{
																								backgroundColor: l.color || '#9ca3af',
																							}}
																						/>
																					</DropdownMenuItem>
																				))}
																			</DropdownMenuContent>
																		</DropdownMenu>
																	</div>
																</div>
															)}

															{actionType === 'buttons' && (
																<div className="flex flex-col gap-4">
																	<div className="mx-4 mt-4 flex flex-col gap-4">
																		<div className="flex flex-col gap-2">
																			<label className="text-sm font-medium text-gray-700">
																				Message Text (max 1000 characters)
																			</label>
																			<textarea
																				placeholder="Enter your message..."
																				maxLength={1000}
																				className="w-full resize-none rounded-xl border border-gray-200 p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100 h-32"
																				value={nodeData.messageText || ''}
																				onChange={(e) =>
																					updateNodeData(editingNode.id, {
																						messageText: e.target.value,
																					})
																				}
																			/>
																		</div>

																		<div className="flex flex-col gap-2 rounded-xl border border-gray-200 border-dashed py-2 mb-2">
																			<p className="px-4 text-sm font-bold text-gray-700">
																				Image (optional)
																			</p>

																			{/* Display selected media if exists */}
																			{nodeData.media?.mediaUrl && (
																				<div className="px-4 pb-2">
																					<div className="relative inline-block">
																						<img
																							src={nodeData.media.mediaUrl}
																							alt="Selected"
																							className="h-20 w-20 object-cover rounded-lg border"
																						/>
																						<button
																							onClick={() =>
																								updateNodeData(editingNode.id, {
																									media: null,
																								})
																							}
																							className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
																							title="Remove image"
																						>
																							<X size={12} />
																						</button>
																					</div>
																				</div>
																			)}

																			<div
																				onClick={() =>
																					document
																						.getElementById(
																							`buttons-image-upload-${editingNode.id}`,
																						)
																						?.click()
																				}
																				className="flex px-4 h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 hover:bg-gray-50 mb-2"
																			>
																				<div className="flex flex-col items-center justify-center pt-2 pb-3">
																					<Upload
																						size={16}
																						className="mb-1 h-3 w-3 text-gray-500"
																					/>
																					<p className="text-xs text-gray-400">
																						Upload Image
																					</p>
																					<p className="text-[10px] text-gray-300">
																						For WhatsApp interactive message
																					</p>
																				</div>
																			</div>
																			<input
																				id={`buttons-image-upload-${editingNode.id}`}
																				type="file"
																				accept="image/*"
																				className="hidden"
																				onChange={async (e) => {
																					const file = e.target.files?.[0]
																					if (!file) return

																					try {
																						const result = await media.upload(
																							file,
																							'whatsapp',
																						)
																						if (
																							result.success &&
																							result.payload
																						) {
																							updateNodeData(editingNode.id, {
																								media: {
																									mediaUrl: result.payload.url,
																									mediaType: 'image',
																									mediaCaption:
																										result.payload.fileName ||
																										file.name,
																								},
																							})
																							toast.success(
																								'Image uploaded successfully',
																							)
																						} else {
																							toast.error(
																								'Failed to upload image',
																							)
																						}
																					} catch (err) {
																						console.error(
																							'Image upload error:',
																							err,
																						)
																						toast.error(
																							'Failed to upload image',
																						)
																					}
																					// Reset file input
																					e.target.value = ''
																				}}
																			/>
																		</div>

																		<div className="flex flex-col gap-2">
																			<label className="flex items-center justify-between text-sm font-medium text-gray-700">
																				<span>
																					Buttons (max 20 characters each)
																				</span>
																				<span className="text-xs text-gray-500">
																					{(nodeData.buttons || []).length}/10
																				</span>
																			</label>
																			<div className="flex flex-col gap-2">
																				{(nodeData.buttons || []).map(
																					(btn: string, idx: number) => (
																						<div
																							key={idx}
																							className="flex items-center gap-2"
																						>
																							<input
																								type="text"
																								placeholder={`Button ${idx + 1} text`}
																								maxLength={20}
																								className="flex-1 rounded-lg border border-gray-200 p-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100"
																								value={btn}
																								onChange={(e) => {
																									const next = [
																										...(nodeData.buttons || []),
																									]
																									next[idx] = e.target.value
																									updateNodeData(
																										editingNode.id,
																										{ buttons: next },
																									)
																								}}
																							/>
																							<button
																								onClick={() => {
																									const next = (
																										nodeData.buttons || []
																									).filter(
																										(_: any, i: number) =>
																											i !== idx,
																									)
																									updateNodeData(
																										editingNode.id,
																										{ buttons: next },
																									)
																								}}
																								className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200"
																							>
																								<X
																									size={16}
																									strokeWidth={1.5}
																								/>
																							</button>
																						</div>
																					),
																				)}
																			</div>
																			<button
																				onClick={() => {
																					if (
																						(nodeData.buttons || []).length < 10
																					) {
																						updateNodeData(editingNode.id, {
																							buttons: [
																								...(nodeData.buttons || []),
																								'',
																							],
																						})
																					}
																				}}
																				disabled={
																					(nodeData.buttons || []).length >= 10
																				}
																				className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
																			>
																				Add Button
																			</button>
																		</div>
																	</div>
																</div>
															)}

															{actionType === 'collaborator' && (
																<div className="space-y-4">
																	<label className="block text-sm font-bold text-gray-700">
																		Select Collaborator
																	</label>
																	<div className="relative">
																		<DropdownMenu>
																			<DropdownMenuTrigger asChild>
																				<button className="flex w-full items-center justify-between rounded-lg border border-gray-300 p-2 text-left hover:bg-gray-50">
																					<div className="flex items-center gap-2">
																						{nodeData.collaboratorId ? (
																							<>
																								<div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-[10px] font-bold uppercase">
																									{nodeData.collaboratorName?.charAt(
																										0,
																									) || '?'}
																								</div>
																								<span className="text-sm font-bold text-gray-700">
																									{nodeData.collaboratorName}
																								</span>
																							</>
																						) : (
																							<span className="text-sm text-gray-400">
																								Select agent...
																							</span>
																						)}
																					</div>
																					<ChevronDown
																						size={20}
																						className="text-gray-400"
																					/>
																				</button>
																			</DropdownMenuTrigger>
																			<DropdownMenuContent className="w-[300px] max-h-[300px] overflow-y-auto">
																				{availableAgents.map((agent: any) => (
																					<DropdownMenuItem
																						key={agent.id}
																						onClick={() =>
																							updateNodeData(editingNode.id, {
																								collaboratorId: agent.id,
																								collaboratorName: agent.name,
																							})
																						}
																						className="flex items-center gap-3 p-2"
																					>
																						<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[11px] font-bold uppercase">
																							{agent.name.charAt(0)}
																						</div>
																						<div className="flex flex-col">
																							<span className="font-bold text-sm text-gray-900">
																								{agent.name}
																							</span>
																							<span className="text-[10px] text-gray-500">
																								{agent.role || 'Agent'}
																							</span>
																						</div>
																					</DropdownMenuItem>
																				))}
																			</DropdownMenuContent>
																		</DropdownMenu>
																	</div>
																</div>
															)}

															{actionType === 'send_message' && (
																<div className="space-y-4">
																	<div>
																		<label className="block text-sm font-bold text-gray-700 mb-2">
																			Message Content
																		</label>
																		<textarea
																			placeholder="Write your message..."
																			className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 h-32 resize-none"
																			value={nodeData.description || ''}
																			onChange={(e) =>
																				updateNodeData(editingNode.id, {
																					description: e.target.value,
																				})
																			}
																		/>
																	</div>

																	{/* Images Section */}
																	<div className="flex flex-col gap-2 rounded-xl border border-gray-200 border-dashed p-4">
																		<div className="flex items-center justify-between">
																			<p className="text-sm font-bold text-gray-700">
																				Images
																			</p>
																			{(nodeData.images || []).length > 0 && (
																				<span className="text-xs text-gray-400">
																					{(nodeData.images || []).length}{' '}
																					image(s)
																				</span>
																			)}
																		</div>

																		{/* Image Preview Grid */}
																		{(nodeData.images || []).length > 0 && (
																			<div className="grid grid-cols-2 gap-2 mb-2">
																				{(nodeData.images || []).map(
																					(
																						img: {
																							url: string
																							fileName?: string
																						},
																						idx: number,
																					) => (
																						<div
																							key={idx}
																							className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
																						>
																							<img
																								src={img.url}
																								alt={
																									img.fileName ||
																									`Image ${idx + 1}`
																								}
																								className="w-full h-24 object-cover"
																							/>
																							<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
																								<button
																									onClick={() => {
																										const next = (
																											nodeData.images || []
																										).filter(
																											(_: any, i: number) =>
																												i !== idx,
																										)
																										updateNodeData(
																											editingNode.id,
																											{ images: next },
																										)
																									}}
																									className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
																									title="Remove image"
																								>
																									<Trash2 size={16} />
																								</button>
																							</div>
																							<p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">
																								{img.fileName ||
																									`Image ${idx + 1}`}
																							</p>
																						</div>
																					),
																				)}
																			</div>
																		)}

																		{/* Upload Area */}
																		<div
																			onClick={() =>
																				!uploadingImages &&
																				document
																					.getElementById(
																						`send-message-image-upload-${editingNode.id}`,
																					)
																					?.click()
																			}
																			className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
																				uploadingImages
																					? 'border-blue-300 bg-blue-50 cursor-wait'
																					: 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
																			}`}
																		>
																			{uploadingImages ? (
																				<div className="flex flex-col items-center justify-center">
																					<Loader2
																						size={24}
																						className="mb-2 text-blue-500 animate-spin"
																					/>
																					<p className="text-xs text-blue-500 font-medium">
																						Uploading...
																					</p>
																				</div>
																			) : (
																				<div className="flex flex-col items-center justify-center">
																					<Image
																						size={24}
																						className="mb-2 text-gray-400"
																					/>
																					<p className="text-xs text-gray-500 font-medium">
																						Click to upload images
																					</p>
																					<p className="text-[10px] text-gray-400 mt-1">
																						JPG, PNG, GIF up to 5MB
																					</p>
																				</div>
																			)}
																		</div>
																		<input
																			id={`send-message-image-upload-${editingNode.id}`}
																			type="file"
																			multiple
																			accept="image/*"
																			className="hidden"
																			disabled={uploadingImages}
																			onChange={async (e) => {
																				const files = e.target.files
																				if (!files || files.length === 0) return

																				setUploadingImages(true)
																				const uploadedImages: {
																					url: string
																					fileName: string
																					key: string
																				}[] = []

																				try {
																					for (const file of Array.from(
																						files,
																					)) {
																						const result = await media.upload(
																							file,
																							'whatsapp',
																						)
																						if (
																							result.success &&
																							result.payload
																						) {
																							uploadedImages.push({
																								url: result.payload.url,
																								fileName:
																									result.payload.fileName,
																								key: result.payload.key,
																							})
																						} else {
																							toast.error(
																								`Failed to upload ${file.name}`,
																							)
																						}
																					}

																					if (uploadedImages.length > 0) {
																						const currentImages =
																							nodeData.images || []
																						updateNodeData(editingNode.id, {
																							images: [
																								...currentImages,
																								...uploadedImages,
																							],
																						})
																						toast.success(
																							`${uploadedImages.length} image(s) uploaded successfully`,
																						)
																					}
																				} catch (err) {
																					console.error(
																						'Image upload error:',
																						err,
																					)
																					toast.error('Failed to upload images')
																				} finally {
																					setUploadingImages(false)
																					// Reset file input
																					e.target.value = ''
																				}
																			}}
																		/>
																	</div>
																</div>
															)}

															{(actionType === 'webhook' ||
																actionType === 'jump_to_action') && (
																<div className="space-y-4">
																	<label className="block text-sm font-bold text-gray-700">
																		{actionType === 'webhook'
																			? 'Webhook URL'
																			: 'Target Node ID'}
																	</label>
																	<textarea
																		placeholder={
																			actionType === 'webhook'
																				? 'https://api.example.com/webhook'
																				: 'Enter target node ID...'
																		}
																		className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 h-40"
																		value={nodeData.description || ''}
																		onChange={(e) =>
																			updateNodeData(editingNode.id, {
																				description: e.target.value,
																			})
																		}
																	/>
																</div>
															)}
														</div>
													</div>
												)
											})()}
										</>
									)}

									{editingNode.type === 'end' && (
										<>
											<div className="flex flex-col gap-1 border-b border-gray-200 px-4 py-6">
												<p className="text-sm font-bold text-gray-700">
													End Flow
												</p>
												<select
													className="w-full rounded-md border border-gray-300 p-1.5 text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
													value={
														(editingNode.data as any).type || 'human_agent'
													}
													onChange={(e) =>
														updateNodeData(editingNode.id, {
															type: e.target.value,
														})
													}
												>
													<option value="human_agent">Human Agent</option>
													<option value="ai_agent">AI Agent</option>
												</select>
											</div>

											<div className="mx-4 mt-6">
												<h3 className="mb-4 text-sm font-black text-gray-900 flex items-center gap-2">
													{(editingNode.data as any).type === 'ai_agent' ? (
														<Bot size={18} className="text-rose-500" />
													) : (
														<User size={18} className="text-rose-500" />
													)}
													{(editingNode.data as any).type === 'ai_agent'
														? 'AI Agent'
														: 'Human Agent'}
												</h3>

												<div className="space-y-6">
													{(editingNode.data as any).type === 'ai_agent' && (
														<div className="relative" ref={aiAgentDropdownRef}>
															<label className="mb-1 block text-xs font-black uppercase tracking-widest text-gray-400">
																Select AI Agent
															</label>
															<button
																className="flex w-full items-center justify-between rounded-lg border border-gray-300 p-2 text-left hover:bg-gray-50 transition-colors"
																onClick={() => {
																	setShowAIAgentDropdown(!showAIAgentDropdown)
																	setAIAgentSearch('')
																}}
															>
																<div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-2 py-1 bg-white">
																	<div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-500">
																		<Bot size={12} />
																	</div>
																	<span className="text-xs font-bold text-gray-700">
																		{(editingNode.data as any).chatbotName ||
																			'Select AI Agent...'}
																	</span>
																</div>
																<ChevronDown
																	size={18}
																	className={`text-gray-400 transition-transform ${showAIAgentDropdown ? 'rotate-180' : ''}`}
																/>
															</button>
															{showAIAgentDropdown && (
																<div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
																	{/* Search Input */}
																	<div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
																		<div className="relative">
																			<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
																			<input
																				type="text"
																				placeholder="Search AI agents..."
																				value={aiAgentSearch}
																				onChange={(e) =>
																					setAIAgentSearch(e.target.value)
																				}
																				onClick={(e) => e.stopPropagation()}
																				className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
																				autoFocus
																			/>
																		</div>
																	</div>
																	{/* Bot List */}
																	<div className="max-h-48 overflow-y-auto">
																		{availableChatbots
																			.filter((bot: any) =>
																				bot.name
																					?.toLowerCase()
																					.includes(
																						aiAgentSearch.toLowerCase(),
																					),
																			)
																			.map((bot: any) => {
																				const isSelected =
																					(editingNode.data as any)
																						.chatbotId === bot.id
																				return (
																					<div
																						key={bot.id}
																						className={`flex items-center gap-2 p-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
																						onClick={() => {
																							updateNodeData(editingNode.id, {
																								chatbotId: bot.id,
																								chatbotName: bot.name,
																							})
																							setShowAIAgentDropdown(false)
																							setAIAgentSearch('')
																						}}
																					>
																						<div
																							className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
																						>
																							<Bot size={12} />
																						</div>
																						<span className="text-sm font-bold text-gray-700 flex-1 truncate">
																							{bot.name}
																						</span>
																						{isSelected && (
																							<Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
																						)}
																					</div>
																				)
																			})}
																		{availableChatbots.filter((bot: any) =>
																			bot.name
																				?.toLowerCase()
																				.includes(aiAgentSearch.toLowerCase()),
																		).length === 0 && (
																			<div className="p-3 text-center text-gray-400 text-sm">
																				{aiAgentSearch
																					? 'No AI agents found'
																					: 'No AI agents available'}
																			</div>
																		)}
																	</div>
																</div>
															)}
														</div>
													)}

													<div className="relative" ref={agentDropdownRef}>
														<label className="mb-1 block text-xs font-black uppercase tracking-widest text-gray-400">
															Select Human Agents
														</label>
														<button
															className="flex w-full items-center justify-between rounded-lg border border-gray-300 p-2 text-left hover:bg-gray-50 transition-colors min-h-[42px]"
															onClick={() => {
																setShowAgentDropdown(!showAgentDropdown)
																setAgentSearch('')
															}}
														>
															<div className="flex flex-wrap gap-1">
																{((editingNode.data as any).agentNames || [])
																	.length > 0 ? (
																	(
																		(editingNode.data as any).agentNames || []
																	).map((name: string, i: number) => (
																		<span
																			key={i}
																			className="flex items-center gap-1 rounded-full border border-blue-100 px-2 py-0.5 text-[10px] bg-blue-50 text-blue-600 font-bold uppercase truncate max-w-[80px]"
																		>
																			{name}
																			<X
																				size={10}
																				className="ml-1 cursor-pointer hover:text-blue-800"
																				onClick={(e) => {
																					e.stopPropagation()
																					const nextNames = (
																						editingNode.data as any
																					).agentNames.filter(
																						(_n: any, idx: number) => idx !== i,
																					)
																					const nextIds = (
																						editingNode.data as any
																					).agentIds.filter(
																						(_id: any, idx: number) =>
																							idx !== i,
																					)
																					updateNodeData(editingNode.id, {
																						agentNames: nextNames,
																						agentIds: nextIds,
																					})
																				}}
																			/>
																		</span>
																	))
																) : (
																	<span className="text-xs text-gray-400 italic">
																		Select agents...
																	</span>
																)}
															</div>
															<ChevronDown
																size={18}
																className={`text-gray-400 shrink-0 transition-transform ${showAgentDropdown ? 'rotate-180' : ''}`}
															/>
														</button>
														{showAgentDropdown && (
															<div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
																{/* Search Input */}
																<div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
																	<div className="relative">
																		<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
																		<input
																			type="text"
																			placeholder="Search agents..."
																			value={agentSearch}
																			onChange={(e) =>
																				setAgentSearch(e.target.value)
																			}
																			onClick={(e) => e.stopPropagation()}
																			className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
																			autoFocus
																		/>
																	</div>
																</div>
																{/* Agent List */}
																<div className="max-h-48 overflow-y-auto">
																	{availableAgents
																		.filter(
																			(agent: any) =>
																				agent.name
																					?.toLowerCase()
																					.includes(
																						agentSearch.toLowerCase(),
																					) ||
																				agent.email
																					?.toLowerCase()
																					.includes(agentSearch.toLowerCase()),
																		)
																		.map((agent: any) => {
																			const currentIds =
																				(editingNode.data as any).agentIds || []
																			const isSelected = currentIds.includes(
																				agent.id,
																			)
																			return (
																				<div
																					key={agent.id}
																					className={`flex items-center gap-2 p-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
																					onClick={(e) => {
																						e.stopPropagation()
																						const currentNames =
																							(editingNode.data as any)
																								.agentNames || []
																						if (
																							!currentIds.includes(agent.id)
																						) {
																							updateNodeData(editingNode.id, {
																								agentIds: [
																									...currentIds,
																									agent.id,
																								],
																								agentNames: [
																									...currentNames,
																									agent.name,
																								],
																							})
																						} else {
																							const idx = currentIds.indexOf(
																								agent.id,
																							)
																							updateNodeData(editingNode.id, {
																								agentIds: currentIds.filter(
																									(_: any, i: number) =>
																										i !== idx,
																								),
																								agentNames: currentNames.filter(
																									(_: any, i: number) =>
																										i !== idx,
																								),
																							})
																						}
																					}}
																				>
																					<div
																						className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
																					>
																						{(agent.name ||
																							'A')[0].toUpperCase()}
																					</div>
																					<div className="flex-1 min-w-0">
																						<span className="text-sm font-bold block truncate text-gray-700">
																							{agent.name}
																						</span>
																						{agent.email && (
																							<span className="text-xs text-gray-400 block truncate">
																								{agent.email}
																							</span>
																						)}
																					</div>
																					{isSelected && (
																						<Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
																					)}
																				</div>
																			)
																		})}
																	{availableAgents.filter(
																		(agent: any) =>
																			agent.name
																				?.toLowerCase()
																				.includes(agentSearch.toLowerCase()) ||
																			agent.email
																				?.toLowerCase()
																				.includes(agentSearch.toLowerCase()),
																	).length === 0 && (
																		<div className="p-3 text-center text-gray-400 text-sm">
																			{agentSearch
																				? 'No agents found'
																				: 'No agents available'}
																		</div>
																	)}
																</div>
															</div>
														)}
													</div>

													<div className="relative" ref={teamDropdownRef}>
														<label className="mb-1 block text-xs font-black uppercase tracking-widest text-gray-400">
															Select Teams
														</label>
														<button
															className="flex w-full items-center justify-between rounded-lg border border-gray-300 p-2 text-left hover:bg-gray-50 transition-colors min-h-[42px]"
															onClick={() => {
																setShowTeamDropdown(!showTeamDropdown)
																setTeamSearch('')
															}}
														>
															<div className="flex flex-wrap gap-1">
																{((editingNode.data as any).teamNames || [])
																	.length > 0 ? (
																	(
																		(editingNode.data as any).teamNames || []
																	).map((name: string, i: number) => (
																		<span
																			key={i}
																			className="flex items-center gap-1 rounded-full border border-emerald-100 px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-600 font-bold uppercase truncate max-w-[100px]"
																		>
																			{name}
																			<X
																				size={10}
																				className="ml-1 cursor-pointer hover:text-emerald-800"
																				onClick={(e) => {
																					e.stopPropagation()
																					const nextNames = (
																						editingNode.data as any
																					).teamNames.filter(
																						(_n: any, idx: number) => idx !== i,
																					)
																					const nextIds = (
																						editingNode.data as any
																					).teamIds.filter(
																						(_id: any, idx: number) =>
																							idx !== i,
																					)
																					updateNodeData(editingNode.id, {
																						teamNames: nextNames,
																						teamIds: nextIds,
																					})
																				}}
																			/>
																		</span>
																	))
																) : (
																	<span className="text-xs text-gray-400 italic">
																		Select teams...
																	</span>
																)}
															</div>
															<ChevronDown
																size={18}
																className={`text-gray-400 shrink-0 transition-transform ${showTeamDropdown ? 'rotate-180' : ''}`}
															/>
														</button>
														{showTeamDropdown && (
															<div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
																{/* Search Input */}
																<div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
																	<div className="relative">
																		<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
																		<input
																			type="text"
																			placeholder="Search teams..."
																			value={teamSearch}
																			onChange={(e) =>
																				setTeamSearch(e.target.value)
																			}
																			onClick={(e) => e.stopPropagation()}
																			className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
																			autoFocus
																		/>
																	</div>
																</div>
																{/* Team List */}
																<div className="max-h-48 overflow-y-auto">
																	{availableTeams
																		.filter((team: any) =>
																			team.name
																				?.toLowerCase()
																				.includes(teamSearch.toLowerCase()),
																		)
																		.map((team: any) => {
																			const currentIds =
																				(editingNode.data as any).teamIds || []
																			const isSelected = currentIds.includes(
																				team.id,
																			)
																			return (
																				<div
																					key={team.id}
																					className={`flex items-center gap-2 p-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50' : ''}`}
																					onClick={(e) => {
																						e.stopPropagation()
																						const currentNames =
																							(editingNode.data as any)
																								.teamNames || []
																						if (!currentIds.includes(team.id)) {
																							updateNodeData(editingNode.id, {
																								teamIds: [
																									...currentIds,
																									team.id,
																								],
																								teamNames: [
																									...currentNames,
																									team.name,
																								],
																							})
																						} else {
																							const idx = currentIds.indexOf(
																								team.id,
																							)
																							updateNodeData(editingNode.id, {
																								teamIds: currentIds.filter(
																									(_: any, i: number) =>
																										i !== idx,
																								),
																								teamNames: currentNames.filter(
																									(_: any, i: number) =>
																										i !== idx,
																								),
																							})
																						}
																					}}
																				>
																					<div
																						className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
																					>
																						{(team.name ||
																							'T')[0].toUpperCase()}
																					</div>
																					<span className="text-sm font-bold text-gray-700 flex-1 truncate">
																						{team.name}
																					</span>
																					{isSelected && (
																						<Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
																					)}
																				</div>
																			)
																		})}
																	{availableTeams.filter((team: any) =>
																		team.name
																			?.toLowerCase()
																			.includes(teamSearch.toLowerCase()),
																	).length === 0 && (
																		<div className="p-3 text-center text-gray-400 text-sm">
																			{teamSearch
																				? 'No teams found'
																				: 'No teams available'}
																		</div>
																	)}
																</div>
															</div>
														)}
													</div>

													<div className="relative pt-4 border-t border-gray-100">
														<label className="mb-1 block text-xs font-black uppercase tracking-widest text-gray-400">
															Skip Last AI Agent Response
														</label>
														<p className="text-[10px] text-gray-500 font-medium leading-tight mb-3">
															When Enabled, the AI Agent will not respond to the
															user's last message before the flow ends.
														</p>
														<div className="flex items-center gap-3">
															<button
																onClick={() =>
																	updateNodeData(editingNode.id, {
																		skipLastAI: !(editingNode.data as any)
																			.skipLastAI,
																	})
																}
																className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${(editingNode.data as any).skipLastAI ? 'bg-rose-500' : 'bg-gray-200'}`}
																role="switch"
															>
																<span
																	className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${(editingNode.data as any).skipLastAI ? 'translate-x-5' : 'translate-x-0'}`}
																></span>
															</button>
															<span
																className={`text-xs font-black uppercase ${(editingNode.data as any).skipLastAI ? 'text-rose-500' : 'text-gray-400'}`}
															>
																{(editingNode.data as any).skipLastAI
																	? 'Enabled'
																	: 'Disabled'}
															</span>
														</div>
													</div>
												</div>
											</div>
										</>
									)}
								</div>
							</div>

							<div className="p-4 border-t border-gray-100 bg-gray-50/50">
								<Button
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11"
									onClick={() => {
										setEditingNode(null)
										toast.info('Changes applied locally', {
											description:
												'Click the Save button in the header to sync with server.',
										})
									}}
								>
									Save Changes
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* AI Config Modal */}
			{aiConfigNode && (
				<AIConfigForm
					node={aiConfigNode}
					onSave={handleSaveAIConfig}
					onCancel={handleCancelAIConfig}
					globalAISettings={{
						model: 'gpt-4o',
						temperature: 0.7,
						maxTokens: 800,
						responseTone: 'Professional and helpful',
					}}
				/>
			)}
		</>
	)
}
