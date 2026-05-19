import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { n8nEmbed } from '@/lib/api'
import { getOrgSlugFromCookie } from '@/lib/organization'

const N8N_BASE_URL =
	import.meta.env.VITE_N8N_URL || 'https://local-n8n.scalebiz.chat'
const N8N_DEFAULT_PATH = import.meta.env.VITE_N8N_EMBED_PATH || '/home/credentials'
const N8N_EMBED_QUERY = {
	sbEmbed: '1',
	sbEmbedUi: 'clean',
	hideSidebar: '1',
}
const EMBED_BOOTSTRAP_CACHE_KEY_PREFIX = 'scalebiz:n8n:embed-bootstrap-at'
const EMBED_BOOTSTRAP_CACHE_LEGACY_KEY = 'scalebiz:n8n:embed-bootstrap-at'

function getBootstrapCacheKey(): string {
	const slug = getOrgSlugFromCookie() || 'default'
	return `${EMBED_BOOTSTRAP_CACHE_KEY_PREFIX}:${slug}`
}

function getBootstrapTimestamp(): number {
	if (typeof window === 'undefined') return 0
	try {
		const raw =
			window.localStorage.getItem(getBootstrapCacheKey()) ||
			window.localStorage.getItem(EMBED_BOOTSTRAP_CACHE_LEGACY_KEY)
		const parsed = Number(raw)
		return Number.isFinite(parsed) ? parsed : 0
	} catch {
		return 0
	}
}

function hasBootstrapCache(): boolean {
	return getBootstrapTimestamp() > 0
}

function markBootstrapSuccess(): void {
	if (typeof window === 'undefined') return
	try {
		const value = String(Date.now())
		window.localStorage.setItem(getBootstrapCacheKey(), value)
		window.localStorage.setItem(EMBED_BOOTSTRAP_CACHE_LEGACY_KEY, value)
	} catch {
		// Ignore storage restrictions.
	}
}

function clearBootstrapCache(): void {
	if (typeof window === 'undefined') return
	try {
		window.localStorage.removeItem(getBootstrapCacheKey())
		window.localStorage.removeItem(EMBED_BOOTSTRAP_CACHE_LEGACY_KEY)
	} catch {
		// Ignore storage restrictions.
	}
}

function normalizePath(pathname: string): string {
	if (!pathname) return '/home/credentials'
	return pathname.startsWith('/') ? pathname : `/${pathname}`
}

function buildCleanEmbedUrl(rawUrl: string): string {
	try {
		const baseUrl = new URL(N8N_BASE_URL)
		const url = new URL(rawUrl, baseUrl)

		if (!url.pathname || url.pathname === '/') {
			url.pathname = normalizePath(N8N_DEFAULT_PATH)
		}

		Object.entries(N8N_EMBED_QUERY).forEach(([key, value]) => {
			url.searchParams.set(key, value)
		})

		return url.toString()
	} catch {
		const params = new URLSearchParams(N8N_EMBED_QUERY)
		const normalizedBase = N8N_BASE_URL.replace(/\/+$/, '')
		return `${normalizedBase}${normalizePath(N8N_DEFAULT_PATH)}?${params.toString()}`
	}
}

export const Route = createFileRoute('/_app/automation')({
	component: AutomationPage,
})

function AutomationPage() {
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [isBootstrapping, setIsBootstrapping] = useState(() => !hasBootstrapCache())
	const [error, setError] = useState<string | null>(null)
	const [embedUrl, setEmbedUrl] = useState(() => buildCleanEmbedUrl(N8N_BASE_URL))

	const bootstrapEmbed = useCallback(
		async (options?: { force?: boolean; silent?: boolean }) => {
			const force = options?.force === true
			const silent = options?.silent === true
			if (!silent) {
				setIsBootstrapping(true)
				setError(null)
			}

			try {
				const result = await n8nEmbed.login(force)
				if (!result.success) {
					throw new Error(result.error || 'Failed to initialize automation workspace')
				}

				const nextEmbedUrl = buildCleanEmbedUrl(result.embedUrl || N8N_BASE_URL)
				setEmbedUrl(nextEmbedUrl)
				if (iframeRef.current && iframeRef.current.src !== nextEmbedUrl) {
					iframeRef.current.src = nextEmbedUrl
				}

				markBootstrapSuccess()
			} catch (err) {
				clearBootstrapCache()
				if (!silent) {
					const message =
						err instanceof Error
							? err.message
							: 'Failed to initialize automation workspace'
					setError(message)
				}
			} finally {
				if (!silent) setIsBootstrapping(false)
			}
		},
		[],
	)

	useEffect(() => {
		// Keep the iframe fast by skipping the blocking overlay if we already bootstrapped once.
		// Still run a silent handshake to renew cookies and org mapping when needed.
		if (hasBootstrapCache()) {
			setIsBootstrapping(false)
			void bootstrapEmbed({ silent: true })
			return
		}

		void bootstrapEmbed()
	}, [bootstrapEmbed])

	return (
		<div className="relative flex h-full w-full overflow-hidden bg-background">
			{error ? (
				<div className="flex flex-1 items-center justify-center p-6">
					<div className="max-w-lg rounded-lg border border-destructive/35 bg-card p-4 text-destructive shadow-sm">
						<div className="flex items-start gap-2">
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
							<div className="space-y-3">
								<p className="text-sm font-medium">Failed to load n8n</p>
								<p className="text-sm">{error}</p>
								<Button
									onClick={() => void bootstrapEmbed({ force: true })}
									size="sm"
									variant="outline"
								>
									Try again
								</Button>
							</div>
						</div>
					</div>
				</div>
			) : (
				<iframe
					ref={iframeRef}
					src={embedUrl}
					title="Automation Workspace"
					className="flex-1 w-full border-0"
					allow="clipboard-read; clipboard-write"
				/>
			)}
				{isBootstrapping && !error ? (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 text-sm text-muted-foreground backdrop-blur-[1px]">
						Initializing automation workspace...
					</div>
				) : null}
		</div>
	)
}
