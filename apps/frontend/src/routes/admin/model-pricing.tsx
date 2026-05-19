import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle, Pencil, RefreshCw, Save, X, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import api from '@/lib/server'

export const Route = createFileRoute('/admin/model-pricing')({
	component: ModelPricingPage,
})

interface ModelPricing {
	id: string
	model_name: string
	cost_per_request: number
	description?: string
	is_active: boolean
	created_at: string
	updated_at: string
}

const getErrorMessage = (error: unknown, fallback: string) => {
	if (typeof error === 'object' && error !== null && 'value' in error) {
		const value = (error as { value?: { message?: string } }).value
		if (value?.message) {
			return String(value.message)
		}
	}

	if (error instanceof Error && error.message) {
		return error.message
	}

	return fallback
}

function ModelPricingPage() {
	const [pricing, setPricing] = useState<ModelPricing[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editingCost, setEditingCost] = useState('')
	const [savingId, setSavingId] = useState<string | null>(null)

	const fetchData = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const { data, error: fetchError } =
				await api.api.admin.billing.pricing.get()

			if (fetchError) {
				throw new Error(
					getErrorMessage(fetchError, 'Failed to fetch model pricing'),
				)
			}

			if (data && 'data' in data) {
				setPricing(data.data as ModelPricing[])
			}
		} catch (err) {
			const message = getErrorMessage(
				err,
				'Failed to load model pricing. Please try again.',
			)
			setError(message)
			toast.error('Failed to load model pricing', {
				description: message,
			})
		} finally {
			setLoading(false)
		}
	}, [])

	const startEditing = useCallback((row: ModelPricing) => {
		setEditingId(row.id)
		setEditingCost(row.cost_per_request.toString())
	}, [])

	const cancelEditing = useCallback(() => {
		setEditingId(null)
		setEditingCost('')
	}, [])

	const saveRow = useCallback(
		async (row: ModelPricing) => {
			if (savingId) {
				return
			}

			const parsedCost = Number(editingCost)
			if (!Number.isFinite(parsedCost) || parsedCost <= 0) {
				toast.error('Invalid cost per request', {
					description: 'Cost per request must be a positive number.',
				})
				return
			}

			try {
				setSavingId(row.id)

				const { error: saveError } = await api.api.admin.billing
					.pricing({ id: row.id })
					.put({
						costPerRequest: parsedCost,
						description: row.description,
						isActive: row.is_active,
					})

				if (saveError) {
					throw new Error(
						getErrorMessage(saveError, 'Failed to update model pricing'),
					)
				}

				setPricing((currentRows) =>
					currentRows.map((currentRow) =>
						currentRow.id === row.id
							? { ...currentRow, cost_per_request: parsedCost }
							: currentRow,
					),
				)
				setEditingId(null)
				setEditingCost('')

				toast.success('Model pricing updated', {
					description: `${row.model_name} cost updated successfully.`,
				})
			} catch (err) {
				toast.error('Failed to update model pricing', {
					description: getErrorMessage(err, 'Please try again.'),
				})
			} finally {
				setSavingId(null)
			}
		},
		[editingCost, savingId],
	)

	useEffect(() => {
		fetchData()
	}, [fetchData])

	return (
		<div className="p-8 max-w-7xl mx-auto space-y-6">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Model Pricing</h1>
					<p className="text-gray-500 mt-1">
						Manage AI model pricing and costs
					</p>
				</div>
				<Button
					onClick={fetchData}
					disabled={loading}
					variant="outline"
					className="gap-2"
				>
					<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
					Refresh
				</Button>
			</header>

			{error && (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="p-4">
						<p className="text-red-700">{error}</p>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Pricing Table</CardTitle>
					<CardDescription>
						View and update cost per request for each model
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<RefreshCw className="animate-spin text-emerald-600" size={32} />
						</div>
					) : pricing.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<p className="text-gray-500">No model pricing found</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left">
								<thead className="bg-gray-50 border-b text-xs uppercase text-gray-500 font-semibold">
									<tr>
										<th className="px-4 py-3">Model Name</th>
										<th className="px-4 py-3 text-right">Cost</th>
										<th className="px-4 py-3 text-center">Status</th>
										<th className="px-4 py-3 text-right">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y text-sm">
									{pricing.map((p) => (
										<tr key={p.id} className="hover:bg-gray-50">
											<td className="px-4 py-3 font-mono text-sm">
												{p.model_name}
											</td>
											<td className="px-4 py-3">
												{editingId === p.id ? (
													<div className="flex items-center justify-end gap-2">
														<Input
															type="number"
															min="0.0001"
															step="0.0001"
															value={editingCost}
															onChange={(event) =>
																setEditingCost(event.target.value)
															}
															className="w-36 text-right font-mono"
															disabled={savingId === p.id}
														/>
													</div>
												) : (
													<div className="text-right font-mono">
														${p.cost_per_request.toFixed(4)}
													</div>
												)}
											</td>
											<td className="px-4 py-3 text-center">
												{p.is_active ? (
													<span className="flex items-center justify-center gap-1 text-emerald-600">
														<CheckCircle size={16} />
														Active
													</span>
												) : (
													<span className="flex items-center justify-center gap-1 text-gray-500">
														<XCircle size={16} />
														Inactive
													</span>
												)}
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center justify-end gap-2">
													{editingId === p.id ? (
														<>
															<Button
																size="sm"
																onClick={() => saveRow(p)}
																disabled={savingId === p.id}
																className="gap-1"
															>
																{savingId === p.id ? (
																	<RefreshCw
																		size={14}
																		className="animate-spin"
																	/>
																) : (
																	<Save size={14} />
																)}
																Save
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={cancelEditing}
																disabled={savingId === p.id}
																className="gap-1"
															>
																<X size={14} />
																Cancel
															</Button>
														</>
													) : (
														<Button
															size="sm"
															variant="outline"
															onClick={() => startEditing(p)}
															className="gap-1"
														>
															<Pencil size={14} />
															Edit
														</Button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
