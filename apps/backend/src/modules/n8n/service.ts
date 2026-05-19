/**
 * n8n Integration Service
 *
 * Handles headless n8n account provisioning and authentication.
 * All users are created with a default password and auto-activated.
 */

import { DeveloperKeysService } from '../developer-keys/service'

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:3309'
const N8N_API_KEY = process.env.N8N_API_KEY || ''
const N8N_DEFAULT_PASSWORD = '8-U|0kZ98tw6'
const N8N_EMBED_AUTH_ENABLED = process.env.N8N_EMBED_AUTH_ENABLED === 'true'
const N8N_EMBED_AUTH_SECRET = process.env.N8N_EMBED_AUTH_SECRET || ''
const N8N_EMBED_AUTH_PATH =
	process.env.N8N_EMBED_AUTH_PATH || '/rest/embedded-auth/scalebiz/login'
const N8N_EMBED_COOKIE_DOMAIN = process.env.N8N_EMBED_COOKIE_DOMAIN || ''
const N8N_EMBED_DEFAULT_PATH =
	process.env.N8N_EMBED_DEFAULT_PATH || '/home/credentials'
const N8N_EMBED_DEFAULT_QUERY =
	process.env.N8N_EMBED_DEFAULT_QUERY || 'sbEmbed=1&sbEmbedUi=clean&hideSidebar=1'
const N8N_EMBED_AUTO_CREDENTIALS_ENABLED =
	(process.env.N8N_EMBED_AUTO_CREDENTIALS_ENABLED || 'true').toLowerCase() !==
	'false'
const N8N_EMBED_DEFAULT_APP_SECRET = 'scalesecret'
const N8N_EMBED_APP_SECRET =
	process.env.N8N_EMBED_APP_SECRET || process.env.APP_SECRET || N8N_EMBED_DEFAULT_APP_SECRET
const N8N_EMBED_SCALEBIZ_API_KEY = process.env.N8N_EMBED_SCALEBIZ_API_KEY || ''
const N8N_EMBED_API_BASE_URL = process.env.N8N_EMBED_API_BASE_URL || ''

// Log configuration on startup (without exposing secrets)
console.log('[n8n] Configuration:', {
	baseUrl: N8N_BASE_URL,
	embedAuthEnabled: N8N_EMBED_AUTH_ENABLED,
	embedAuthSecretConfigured: !!N8N_EMBED_AUTH_SECRET,
	embedAuthPath: N8N_EMBED_AUTH_PATH,
	embedCookieDomain: N8N_EMBED_COOKIE_DOMAIN || '(not set)',
	embedScaleBizApiKeyConfigured: !!N8N_EMBED_SCALEBIZ_API_KEY,
})

interface N8nUser {
	id: string
	email: string
	firstName: string
	lastName: string
	role: string
	isPending?: boolean
}

interface N8nCredentialTypeProperty {
	name: string
	type?: string
	default?: unknown
	required?: boolean
}

interface N8nCredentialTypeDefinition {
	name: string
	displayName?: string
	properties?: N8nCredentialTypeProperty[]
	supportedNodes?: string[]
}

interface N8nCredentialSummary {
	id: string
	name: string
	type: string
}

interface EmbeddedCredentialContext {
	organizationId: string
	organizationName: string
	organizationSlug?: string
	organizationAppId?: string
	scalebizApiBaseUrl: string
	appSecret: string
	developerApiKey?: string
	scaleBizApiKey?: string
}

function buildEmbedAuthUrl(): string {
	if (/^https?:\/\//i.test(N8N_EMBED_AUTH_PATH)) return N8N_EMBED_AUTH_PATH
	const normalizedPath = N8N_EMBED_AUTH_PATH.startsWith('/')
		? N8N_EMBED_AUTH_PATH
		: `/${N8N_EMBED_AUTH_PATH}`
	return `${N8N_BASE_URL}${normalizedPath}`
}

function normalizePath(pathname: string): string {
	if (!pathname) return '/home/credentials'
	return pathname.startsWith('/') ? pathname : `/${pathname}`
}

function buildEmbedWorkspaceUrl(): string {
	try {
		const url = new URL(N8N_BASE_URL)

		if (!url.pathname || url.pathname === '/') {
			url.pathname = normalizePath(N8N_EMBED_DEFAULT_PATH)
		}

		const queryParams = new URLSearchParams(N8N_EMBED_DEFAULT_QUERY)
		queryParams.forEach((value, key) => {
			url.searchParams.set(key, value)
		})

		return url.toString()
	} catch {
		return N8N_BASE_URL
	}
}

function normalizeHost(input?: string): string {
	if (!input) return ''
	return input
		.split(',')[0]
		.trim()
		.toLowerCase()
		.replace(/:\d+$/, '')
}

function isIpv4Address(hostname: string): boolean {
	return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
}

function isLocalOnlyHostname(hostname: string): boolean {
	return (
		!hostname ||
		hostname === 'localhost' ||
		hostname.endsWith('.localhost') ||
		isIpv4Address(hostname)
	)
}

function deriveSharedCookieDomain(apiHost: string, n8nHost: string): string {
	if (!apiHost || !n8nHost) return ''
	if (isLocalOnlyHostname(apiHost) || isLocalOnlyHostname(n8nHost)) return ''

	const apiParts = apiHost.split('.').filter(Boolean)
	const n8nParts = n8nHost.split('.').filter(Boolean)
	const total = Math.min(apiParts.length, n8nParts.length)
	const shared: string[] = []

	for (let i = 1; i <= total; i += 1) {
		const apiPart = apiParts[apiParts.length - i]
		const n8nPart = n8nParts[n8nParts.length - i]
		if (apiPart !== n8nPart) break
		shared.unshift(apiPart)
	}

	// Require at least registrable domain-like suffix (eg: scalebiz.chat).
	if (shared.length < 2) return ''
	return shared.join('.')
}

function resolveEmbedCookieDomain(requestHost?: string): string {
	const explicitDomain = N8N_EMBED_COOKIE_DOMAIN.trim().replace(/^\./, '')
	if (explicitDomain) return explicitDomain

	const apiHost = normalizeHost(requestHost)
	const n8nHost = normalizeHost(
		(() => {
			try {
				return new URL(N8N_BASE_URL).hostname
			} catch {
				return ''
			}
		})(),
	)

	return deriveSharedCookieDomain(apiHost, n8nHost)
}

function splitSetCookieHeader(headerValue: string): string[] {
	return headerValue
		.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g)
		.map((cookie) => cookie.trim())
		.filter(Boolean)
}

function getSetCookies(response: Response): string[] {
	const headersWithSetCookie = response.headers as Headers & {
		getSetCookie?: () => string[]
	}

	if (typeof headersWithSetCookie.getSetCookie === 'function') {
		const setCookies = headersWithSetCookie.getSetCookie()
		if (Array.isArray(setCookies) && setCookies.length > 0) {
			return setCookies
		}
	}

	const rawSetCookie = response.headers.get('set-cookie')
	if (!rawSetCookie) return []
	return splitSetCookieHeader(rawSetCookie)
}

function applyCookieDomain(cookie: string, domain: string): string {
	if (!domain) return cookie
	const normalizedDomain = domain.startsWith('.') ? domain : `.${domain}`

	if (/;\s*Domain=/i.test(cookie)) {
		return cookie.replace(/;\s*Domain=[^;]*/i, `; Domain=${normalizedDomain}`)
	}

	return `${cookie}; Domain=${normalizedDomain}`
}

function extractCookieHeader(setCookies: string[]): string {
	return setCookies
		.map((cookie) => cookie.split(';')[0]?.trim())
		.filter(Boolean)
		.join('; ')
}

function unwrapCollection<T>(payload: unknown): T[] {
	if (Array.isArray(payload)) return payload as T[]
	if (payload && typeof payload === 'object') {
		const maybeData = (payload as { data?: unknown }).data
		if (Array.isArray(maybeData)) return maybeData as T[]
	}
	return []
}

function normalizeCredentialKey(name: string): string {
	return name.replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function resolveScalebizApiBaseUrl(requestHost?: string): string {
	const explicit = N8N_EMBED_API_BASE_URL.trim()
	if (explicit) return explicit.replace(/\/+$/, '')

	const host = normalizeHost(requestHost)
	if (host) {
		const protocol = isLocalOnlyHostname(host) ? 'http' : 'https'
		return `${protocol}://${host}/api`
	}

	return 'https://local-api.scalebiz.chat/api'
}

function resolveEmbeddedScaleBizApiKey(): string {
	const explicit = N8N_EMBED_SCALEBIZ_API_KEY.trim()
	if (explicit) return explicit

	// Preserve backwards compatibility only if APP secret is explicitly configured
	// and not the local fallback placeholder.
	if (
		N8N_EMBED_APP_SECRET &&
		N8N_EMBED_APP_SECRET.trim() &&
		N8N_EMBED_APP_SECRET !== N8N_EMBED_DEFAULT_APP_SECRET
	) {
		return N8N_EMBED_APP_SECRET.trim()
	}

	return ''
}

function shouldProvisionEmbeddedCredentialType(type: N8nCredentialTypeDefinition): boolean {
	const fingerprint = [
		type.name,
		type.displayName || '',
		...(type.supportedNodes || []),
	]
		.join(' ')
		.toLowerCase()

	return ['scalebiz', 'scalebiz', 'scalechat'].some((needle) =>
		fingerprint.includes(needle),
	)
}

function resolveMappedCredentialValue(
	normalizedKey: string,
	context: EmbeddedCredentialContext,
): string | undefined {
	if (
		['apikey', 'xapikey', 'apiaccesskey', 'appkey'].includes(normalizedKey)
	) {
		return context.developerApiKey || context.appSecret
	}

	if (
		[
			'appid',
			'xappid',
			'applicationid',
			'appuuid',
			'apppublicid',
			'accountid',
		].includes(normalizedKey)
	) {
		return context.organizationAppId
	}

	if (
		[
			'appsecret',
			'xappsecret',
			'applicationsecret',
		].includes(normalizedKey)
	) {
		return context.appSecret
	}

	if (['orgslug', 'organizationslug', 'tenantslug'].includes(normalizedKey)) {
		return context.organizationSlug
	}

	if (['orgid', 'organizationid', 'tenantid'].includes(normalizedKey)) {
		return context.organizationId
	}

	if (['orgname', 'organizationname', 'tenantname'].includes(normalizedKey)) {
		return context.organizationName
	}

	if (['baseurl', 'apiurl', 'baseapiurl', 'apiendpoint'].includes(normalizedKey)) {
		return context.scalebizApiBaseUrl
	}

	return undefined
}

function buildCredentialData(
	type: N8nCredentialTypeDefinition,
	context: EmbeddedCredentialContext,
): Record<string, unknown> | null {
	const properties = Array.isArray(type.properties) ? type.properties : []
	if (properties.length === 0) return null
	const isScaleBizCredential = type.name.toLowerCase() === 'scalebizapi'

	// Do not auto-provision ScaleBiz with placeholder credentials.
	if (isScaleBizCredential && !context.scaleBizApiKey) return null

	const data: Record<string, unknown> = {}

	for (const property of properties) {
		const propertyName = String(property.name || '').trim()
		if (!propertyName) continue

		const normalizedKey = normalizeCredentialKey(propertyName)

		if (isScaleBizCredential && normalizedKey === 'apikey' && context.scaleBizApiKey) {
			data[propertyName] = context.scaleBizApiKey
			continue
		}

		const mappedValue = resolveMappedCredentialValue(normalizedKey, context)

		if (mappedValue !== undefined && mappedValue !== '') {
			data[propertyName] = mappedValue
			continue
		}

		const defaultValue = property.default
		if (
			typeof defaultValue === 'string' ||
			typeof defaultValue === 'number' ||
			typeof defaultValue === 'boolean'
		) {
			data[propertyName] = defaultValue
			continue
		}

		if (property.required) {
			return null
		}
	}

	return data
}

async function resolveOrganizationDeveloperApiKey(
	organizationId: string,
): Promise<string> {
	const normalizedOrgId = String(organizationId || '').trim()
	if (!normalizedOrgId) return ''

	try {
		const keyRecord =
			await DeveloperKeysService.getOrCreateByBusinessId(normalizedOrgId)
		return String(keyRecord.api_key || '').trim()
	} catch (error) {
		console.warn('[n8n] Failed to resolve org developer API key', {
			organizationId: normalizedOrgId,
			error:
				error instanceof Error ? error.message : 'Unknown key resolution error',
		})
		return ''
	}
}

function buildEmbeddedCredentialName(
	type: N8nCredentialTypeDefinition,
	context: EmbeddedCredentialContext,
): string {
	if (type.name.toLowerCase() === 'scalebizapi') {
		return 'ScaleBiz Account'
	}

	const suffix =
		context.organizationSlug || context.organizationName || context.organizationId
	const typeLabel = (type.displayName || type.name || 'Credential').trim()
	return `ScaleBiz Embedded ${typeLabel} (${suffix})`
}

abstract class N8nService {
	static async loginOrganizationForEmbed(input: {
		organizationId: string
		organizationName: string
		organizationSlug?: string
		organizationAppId?: string
		requestHost?: string
	}): Promise<{ success: boolean; cookies?: string[]; error?: string }> {
		try {
			if (!N8N_EMBED_AUTH_ENABLED) {
				console.warn('[n8n] Embed auth is disabled. Set N8N_EMBED_AUTH_ENABLED=true')
				return { success: false, error: 'N8N embed auth is disabled' }
			}
			if (!N8N_EMBED_AUTH_SECRET) {
				console.error('[n8n] N8N_EMBED_AUTH_SECRET not configured')
				return { success: false, error: 'N8N_EMBED_AUTH_SECRET not configured' }
			}
			if (!input.organizationId) {
				return { success: false, error: 'organizationId is required' }
			}

			const embedUrl = buildEmbedAuthUrl()
			console.log('[n8n] Attempting embedded login:', {
				url: embedUrl,
				organizationId: input.organizationId,
				organizationName: input.organizationName,
			})

			const requestBody = {
				organizationId: input.organizationId,
				organizationName: input.organizationName,
			}
			const requestBodyString = JSON.stringify(requestBody)
			const cookieDomain = resolveEmbedCookieDomain(input.requestHost)
			
			console.log('[n8n] Request details:', {
				bodyLength: requestBodyString.length,
				body: requestBodyString,
				requestHost: input.requestHost || '(not provided)',
				cookieDomain: cookieDomain || '(not rewritten)',
			})

			const response = await fetch(embedUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-embed-auth-secret': N8N_EMBED_AUTH_SECRET,
				},
				body: requestBodyString,
			})

			if (!response.ok) {
				const errorBody = await response.text()
				console.error(
					'[n8n] embedded login failed:',
					response.status,
					response.statusText,
					errorBody,
				)
				return {
					success: false,
					error: `Embedded login failed (${response.status}): ${response.statusText}`,
				}
			}

			const cookies = getSetCookies(response).map((cookie) =>
				applyCookieDomain(cookie, cookieDomain),
			)
			if (cookies.length === 0) {
				console.warn('[n8n] No cookies returned from embedded auth')
				return {
					success: false,
					error: 'Embedded login succeeded without auth cookie',
				}
			}

			console.log('[n8n] Embedded login successful, cookies:', cookies.length)

			if (N8N_EMBED_AUTO_CREDENTIALS_ENABLED) {
				try {
					await N8nService.ensureEmbeddedCredentials({
						cookies,
						organizationId: input.organizationId,
						organizationName: input.organizationName,
						organizationSlug: input.organizationSlug,
						organizationAppId: input.organizationAppId,
						requestHost: input.requestHost,
					})
				} catch (credentialError) {
					console.warn('[n8n] Embedded credential bootstrap warning:', credentialError)
				}
			}

			return { success: true, cookies }
		} catch (err) {
			console.error('[n8n] loginOrganizationForEmbed error:', err)
			const errorMessage = err instanceof Error ? err.message : 'Unknown error'
			return { 
				success: false, 
				error: `Failed to connect to n8n embed auth: ${errorMessage}` 
			}
		}
	}

	private static async ensureEmbeddedCredentials(input: {
		cookies: string[]
		organizationId: string
		organizationName: string
		organizationSlug?: string
		organizationAppId?: string
		requestHost?: string
	}): Promise<void> {
		const sessionCookies = extractCookieHeader(input.cookies)
		if (!sessionCookies) return

		const authHeaders = {
			Accept: 'application/json',
			Cookie: sessionCookies,
			'Content-Type': 'application/json',
			'browser-id': `scalebiz-${input.organizationId.slice(0, 16)}`,
		}

		const [typesResponse, credentialsResponse] = await Promise.all([
			fetch(`${N8N_BASE_URL}/types/credentials.json`, {
				headers: authHeaders,
			}),
			fetch(`${N8N_BASE_URL}/rest/credentials`, {
				headers: authHeaders,
			}),
		])

		if (!typesResponse.ok || !credentialsResponse.ok) {
			console.warn('[n8n] Skip embedded credential bootstrap due to fetch failure', {
				typesStatus: typesResponse.status,
				credentialsStatus: credentialsResponse.status,
			})
			return
		}

		const typesPayload = (await typesResponse.json()) as unknown
		const credentialsPayload = (await credentialsResponse.json()) as unknown

		const credentialTypes = unwrapCollection<N8nCredentialTypeDefinition>(typesPayload).filter(
			(type) => shouldProvisionEmbeddedCredentialType(type),
		)
		if (credentialTypes.length === 0) return

		const existingCredentials = unwrapCollection<N8nCredentialSummary>(credentialsPayload)
		const organizationDeveloperApiKey = await resolveOrganizationDeveloperApiKey(
			input.organizationId,
		)
		const configuredScaleBizApiKey = resolveEmbeddedScaleBizApiKey()
		const resolvedScaleBizApiKey =
			configuredScaleBizApiKey || organizationDeveloperApiKey
		const context: EmbeddedCredentialContext = {
			organizationId: input.organizationId,
			organizationName: input.organizationName,
			organizationSlug: input.organizationSlug,
			organizationAppId: input.organizationAppId,
			scalebizApiBaseUrl: resolveScalebizApiBaseUrl(input.requestHost),
			appSecret: N8N_EMBED_APP_SECRET,
			developerApiKey: organizationDeveloperApiKey || undefined,
			scaleBizApiKey: resolvedScaleBizApiKey || undefined,
		}

		for (const credentialType of credentialTypes) {
			const data = buildCredentialData(credentialType, context)
			if (!data) continue

			const typeName = credentialType.name
			const credentialName = buildEmbeddedCredentialName(credentialType, context)
			const sameTypeCredentials = existingCredentials.filter(
				(credential) => credential.type === typeName,
			)
			const updatableCredential =
				sameTypeCredentials.find((credential) => {
					const normalizedName = credential.name.toLowerCase()
					return (
						normalizedName.startsWith('scalebiz embedded ') ||
						normalizedName.includes('scalebiz')
					)
				}) || (sameTypeCredentials.length === 1 ? sameTypeCredentials[0] : null)

			if (updatableCredential) {
				await fetch(`${N8N_BASE_URL}/rest/credentials/${updatableCredential.id}`, {
					method: 'PATCH',
					headers: authHeaders,
					body: JSON.stringify({
						name: credentialName,
						type: typeName,
						data,
						isPartialData: false,
					}),
				})
				continue
			}

			await fetch(`${N8N_BASE_URL}/rest/credentials`, {
				method: 'POST',
				headers: authHeaders,
				body: JSON.stringify({
					name: credentialName,
					type: typeName,
					data,
				}),
			})
		}
	}

	/**
	 * Create a user in n8n and immediately accept the invitation
	 * so the user is active and can auto-login.
	 */
	static async provisionUser(input: {
		email: string
		name: string
	}): Promise<{ success: boolean; error?: string }> {
		try {
			const [firstName, ...rest] = input.name.split(' ')
			const lastName = rest.join(' ') || firstName

			const res = await fetch(`${N8N_BASE_URL}/api/v1/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-N8N-API-KEY': N8N_API_KEY,
				},
				body: JSON.stringify([
					{ email: input.email, role: 'global:member' },
				]),
			})

			if (!res.ok) {
				const body = await res.text()
				if (res.status === 409 || body.includes('already exists')) {
					// Already exists — activate if still pending
					await N8nService.activatePendingUser(input.email, firstName, lastName)
					return { success: true }
				}
				console.error('[n8n] Failed to provision user:', res.status, body)
				return { success: false, error: `n8n API error: ${res.status}` }
			}

			const created = (await res.json()) as Array<{ id: string; inviteAcceptUrl?: string }> | { data: Array<{ id: string; inviteAcceptUrl?: string }> }
			const users = Array.isArray(created) ? created : (created.data || [])
			const invitedUser = users[0]

			if (invitedUser) {
				await N8nService.acceptInvitation(invitedUser, firstName, lastName)
			}

			return { success: true }
		} catch (err) {
			console.error('[n8n] provisionUser error:', err)
			return { success: false, error: 'Failed to connect to n8n' }
		}
	}

	/**
	 * Accept invitation to activate user immediately.
	 */
	private static async acceptInvitation(
		invitedUser: { id: string; inviteAcceptUrl?: string },
		firstName: string,
		lastName: string,
	): Promise<void> {
		try {
			let inviterId = ''
			let inviteeId = invitedUser.id

			if (invitedUser.inviteAcceptUrl) {
				const url = new URL(invitedUser.inviteAcceptUrl)
				inviterId = url.searchParams.get('inviterId') || ''
				inviteeId = url.searchParams.get('inviteeId') || invitedUser.id
			}

			await fetch(`${N8N_BASE_URL}/rest/invitations/${inviteeId}/accept`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					inviterId,
					firstName,
					lastName,
					password: N8N_DEFAULT_PASSWORD,
				}),
			})
		} catch (err) {
			console.error('[n8n] acceptInvitation error:', err)
		}
	}

	/**
	 * Find a pending n8n user by email and accept their invitation.
	 */
	private static async activatePendingUser(
		email: string,
		firstName: string,
		lastName: string,
	): Promise<void> {
		try {
			const res = await fetch(`${N8N_BASE_URL}/api/v1/users`, {
				headers: { 'X-N8N-API-KEY': N8N_API_KEY },
			})
			if (!res.ok) return

			const users = (await res.json()) as { data: N8nUser[] }
			const user = users.data?.find(
				(u) => u.email.toLowerCase() === email.toLowerCase(),
			)

			if (!user || !user.isPending) return

			await N8nService.acceptInvitation({ id: user.id }, firstName, lastName)
		} catch (err) {
			console.error('[n8n] activatePendingUser error:', err)
		}
	}

	/**
	 * Ensure a Scalebiz user has a corresponding n8n account.
	 * Called during login and org creation.
	 */
	static async ensureN8nAccount(user: {
		id: string
		email: string
		name: string
	}): Promise<{ success: boolean; error?: string }> {
		if (!N8N_API_KEY) {
			return { success: false, error: 'N8N_API_KEY not configured' }
		}
		return N8nService.provisionUser({ email: user.email, name: user.name })
	}

	/**
	 * Sign in to n8n and return session cookie for iframe embedding.
	 */
	static async signIn(_userId: string, email: string): Promise<{
		success: boolean
		cookie?: string
		error?: string
	}> {
		try {
			const res = await fetch(`${N8N_BASE_URL}/api/v1/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password: N8N_DEFAULT_PASSWORD }),
				redirect: 'manual',
			})

			const setCookie = res.headers.get('set-cookie')
			if (setCookie) {
				return { success: true, cookie: setCookie }
			}

			if (res.ok) {
				const body = (await res.json()) as { cookie?: string }
				if (body.cookie) {
					return { success: true, cookie: body.cookie }
				}
			}

			return { success: false, error: 'n8n sign-in failed' }
		} catch (err) {
			console.error('[n8n] signIn error:', err)
			return { success: false, error: 'Failed to connect to n8n' }
		}
	}

	/**
	 * Get n8n embed URL for iframe.
	 */
	static getEmbedUrl(): string {
		return buildEmbedWorkspaceUrl()
	}
}

export { N8nService }
