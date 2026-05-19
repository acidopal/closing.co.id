import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Building2, ChevronRight, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
	consumePostLoginRedirect,
	type Organization,
	organizationApi,
	persistOrganizationContext,
} from '@/lib/organization'

export const Route = createFileRoute('/select-org')({
	component: SelectOrgPage,
})

function SelectOrgPage() {
	const navigate = useNavigate()
	const [organizations, setOrganizations] = useState<Organization[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	const handleSelectOrg = useCallback(
		async (org: Organization) => {
			try {
				setLoading(true)
				await organizationApi.setActive(org.id)
				persistOrganizationContext(org)
				const redirectPath = consumePostLoginRedirect()
				navigate({ to: redirectPath, replace: true })
			} catch (err: any) {
				setError(err.message || 'Failed to select organization')
				setLoading(false)
			}
		},
		[navigate],
	)

	const loadOrganizations = useCallback(async () => {
		try {
			setLoading(true)
			const { organizations: orgs } = await organizationApi.list()
			setOrganizations(orgs)
			if (orgs.length === 1) {
				await handleSelectOrg(orgs[0])
			}
		} catch (err: any) {
			setError(err.message || 'Failed to load organizations')
		} finally {
			setLoading(false)
		}
	}, [handleSelectOrg])

	useEffect(() => {
		loadOrganizations()
	}, [loadOrganizations])

	if (loading) {
		return (
			<div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading organizations...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4">
			<div className="w-full max-w-md space-y-6">
				<div className="text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-900 text-white shadow-md mx-auto">
						<Building2 className="h-8 w-8" />
					</div>
					<h1 className="mt-4 text-2xl font-bold text-gray-900">Select Organization</h1>
					<p className="mt-2 text-sm text-gray-500">Choose which workspace to access</p>
				</div>

				{error && (
					<div className="rounded-md bg-red-50 p-3 text-sm text-red-500 border border-red-200">{error}</div>
				)}

				<div className="space-y-3">
					{organizations.map((org) => (
						<button type="button" key={org.id} onClick={() => handleSelectOrg(org)} className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all text-left group">
							<div className="flex-shrink-0">
								{org.logo ? (
									<img src={org.logo} alt={org.name} className="h-12 w-12 rounded-lg object-cover" />
								) : (
									<div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">{org.name.charAt(0).toUpperCase()}</div>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
								<p className="text-sm text-gray-500 truncate">/{org.slug}</p>
							</div>
							<ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
						</button>
					))}
				</div>

				<div className="pt-4 border-t border-gray-200">
					<Link to="/create-org" className="w-full flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all text-gray-700">
						<Plus className="h-5 w-5" />
						<span className="font-medium">Create New Organization</span>
					</Link>
				</div>

				<p className="text-center text-sm text-gray-500">
					Want to switch accounts?{' '}
					<button type="button" onClick={() => { localStorage.clear(); navigate({ to: '/login' }) }} className="text-gray-900 hover:underline font-medium">Log out</button>
				</p>
			</div>
		</div>
	)
}
