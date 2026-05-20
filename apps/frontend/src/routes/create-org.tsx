import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Building2 } from 'lucide-react'
import { useState } from 'react'
import {
	consumePostLoginRedirect,
	organizationApi,
	persistOrganizationContext,
} from '@/lib/organization'

export const Route = createFileRoute('/create-org')({
	component: CreateOrgPage,
})

function CreateOrgPage() {
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [slug, setSlug] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const generateSlug = (text: string): string => {
		return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 64)
	}

	const handleNameChange = (value: string) => {
		setName(value)
		if (!slug || slug === generateSlug(name)) {
			setSlug(generateSlug(value))
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!name.trim() || !slug.trim()) {
			setError('Organization name and slug are required')
			return
		}

		setLoading(true)
		setError('')

		try {
			const org = await organizationApi.create({ name: name.trim(), slug: slug.trim() })
			persistOrganizationContext(org)
			const redirectPath = consumePostLoginRedirect()
			navigate({ to: redirectPath, replace: true })
		} catch (err: any) {
			setError(err.message || 'Failed to create organization')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4">
			<div className="w-full max-w-md space-y-6">
				<div className="text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-blue text-white shadow-md mx-auto">
						<Building2 className="h-8 w-8" />
					</div>
					<h1 className="mt-4 text-2xl font-bold text-gray-900">Create Organization</h1>
					<p className="mt-2 text-sm text-gray-500">Set up your workspace to get started</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
						<div className="space-y-2">
							<label htmlFor="org-name" className="text-sm font-medium text-gray-900">Organization Name</label>
							<input id="org-name" type="text" placeholder="Acme Inc." value={name} onChange={(e) => handleNameChange(e.target.value)} className="w-full h-11 px-3 rounded-md border border-gray-200 bg-transparent text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2" required />
						</div>
						<div className="space-y-2">
							<label htmlFor="org-slug" className="text-sm font-medium text-gray-900">URL Slug</label>
							<div className="flex items-center">
								<span className="text-gray-500 text-sm mr-2">/</span>
								<input id="org-slug" type="text" placeholder="acme-inc" value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))} className="flex-1 h-11 px-3 rounded-md border border-gray-200 bg-transparent text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2" required />
							</div>
						</div>
						{error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 border border-red-200">{error}</div>}
					</div>

					<button type="submit" disabled={loading || !name.trim() || !slug.trim()} className="w-full flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
						{loading ? <>Creating...⏳</> : <>Create Organization<ArrowRight className="h-4 w-4" /></>}
					</button>
				</form>

				<p className="text-center text-sm text-gray-500">
					Already have an organization?{' '}
					<button type="button" onClick={() => navigate({ to: '/select-org' })} className="text-gray-900 hover:underline font-medium">Select one</button>
				</p>
			</div>
		</div>
	)
}
