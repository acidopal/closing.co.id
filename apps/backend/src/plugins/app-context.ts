// @ts-nocheck
import { randomBytes } from 'node:crypto'
import { Elysia } from 'elysia'
import { auth } from '../auth'
import prisma from '../lib/prisma'
import { DeveloperKeysService } from '../modules/developer-keys/service'
import { resolveAppId } from '../lib/utils'

function buildBaseAppSlug(orgSlug: string) {
	const normalized = orgSlug.toLowerCase().replace(/[^a-z0-9]+/g, '_')
	const compact = normalized.replace(/^_+|_+$/g, '') || 'workspace'
	return `org_${compact}`.slice(0, 64)
}

async function buildUniqueAppId(base: string) {
	let candidate = base

	for (let attempt = 0; attempt < 6; attempt++) {
		const existing = await prisma.apps.findUnique({
			where: { app_id: candidate },
			select: { id: true },
		})

		if (!existing) return candidate

		const suffix = `_${randomBytes(2).toString('hex')}`
		candidate = `${base.slice(0, Math.max(1, 64 - suffix.length))}${suffix}`
	}

	return `${base.slice(0, 55)}_${Date.now().toString(36).slice(-8)}`
}

async function ensureOrganizationAppLink(org: {
	id: string
	name: string
	slug: string
	appId: string | null
	app: { id: string } | null
}) {
	if (org.app?.id) return org.app.id

	if (org.appId) {
		const existingApp = await prisma.apps.findUnique({
			where: { id: org.appId },
			select: { id: true },
		})
		if (existingApp?.id) return existingApp.id
	}

	const appId = await buildUniqueAppId(buildBaseAppSlug(org.slug))
	const appSecret = randomBytes(24).toString('hex')

	const app = await prisma.apps
		.create({
			data: {
				app_id: appId,
				app_secret_hash: appSecret,
				app_name: org.name,
				business_name: org.name,
			},
			select: { id: true },
		})
		.catch(async () => {
			const existing = await prisma.apps.findFirst({
				where: { app_id: appId },
				select: { id: true },
			})
			if (!existing) throw new Error('Failed to create or resolve app link')
			return existing
		})

	// Link the organization to the app
	await prisma.organization.update({
		where: { id: org.id },
		data: { appId: app.id },
	})

	return app.id
}

/**
 * Resolves organization slug to app UUID
 * Uses Better Auth's organization table (not legacy apps table)
 */
async function resolveOrgSlug(orgSlug: string): Promise<{
	orgId: string | null
	appUuid: string | null
	orgSlug: string
} | null> {
	if (!orgSlug || orgSlug === 'default' || orgSlug === 'undefined') {
		return null
	}

	// Try to find organization by slug in Better Auth's organization table
	const org = await prisma.organization.findUnique({
		where: { slug: orgSlug },
		include: { app: true },
	})

	if (org) {
		const appUuid = await ensureOrganizationAppLink({
			id: org.id,
			name: org.name,
			slug: org.slug || orgSlug,
			appId: org.appId,
			app: org.app ? { id: org.app.id } : null,
		})

		return {
			orgId: org.id,
			appUuid,
			orgSlug: org.slug || orgSlug,
		}
	}

	// Fallback: treat slug as legacy app_id
	const app = await prisma.apps.findFirst({
		where: { app_id: orgSlug },
	})

	if (app) {
		return {
			orgId: app.app_id,
			appUuid: app.id,
			orgSlug: app.app_id || orgSlug,
		}
	}

	return null
}

/**
 * Gets active organization from Better Auth session
 */
async function getActiveOrgFromSession(headers: Headers): Promise<{
	orgId: string
	appUuid: string | null
	orgSlug: string
} | null> {
	try {
		const session = await auth.api.getSession({ headers })
		if (session?.session) {
			const activeOrgId = (session.session as any).activeOrganizationId
			if (activeOrgId) {
				const org = await prisma.organization.findUnique({
					where: { id: activeOrgId },
					include: { app: true },
				})
				if (org) {
					const appUuid = await ensureOrganizationAppLink({
						id: org.id,
						name: org.name,
						slug: org.slug || '',
						appId: org.appId,
						app: org.app ? { id: org.app.id } : null,
					})

					return {
						orgId: org.id,
						appUuid,
						orgSlug: org.slug || '',
					}
				}
			}
		}
	} catch (e) {
		// Better Auth failed
	}
	return null
}

function extractBearerToken(
	requestHeaders: Headers,
	headers: Record<string, unknown>,
): string | null {
	const rawAuthHeader =
		requestHeaders.get('authorization') ||
		(headers.authorization as string | undefined) ||
		(headers.Authorization as string | undefined)

	if (!rawAuthHeader || typeof rawAuthHeader !== 'string') {
		return null
	}

	if (rawAuthHeader.toLowerCase().startsWith('bearer ')) {
		const token = rawAuthHeader.slice(7).trim()
		return token || null
	}

	return rawAuthHeader.trim() || null
}

async function getSessionFromBearerToken(token: string): Promise<{
	userId: string
	activeOrganizationId: string | null
} | null> {
	if (!token) return null

	const session = await prisma.session.findUnique({
		where: { token },
		select: {
			userId: true,
			activeOrganizationId: true,
			expiresAt: true,
		},
	})

	if (!session) return null
	if (session.expiresAt && session.expiresAt < new Date()) return null

	return {
		userId: session.userId,
		activeOrganizationId: session.activeOrganizationId || null,
	}
}

async function resolveOrgById(orgId: string): Promise<{
	orgId: string
	appUuid: string | null
	orgSlug: string
} | null> {
	if (!orgId) return null

	const org = await prisma.organization.findUnique({
		where: { id: orgId },
		include: { app: true },
	})

	if (!org) return null

	const appUuid = await ensureOrganizationAppLink({
		id: org.id,
		name: org.name,
		slug: org.slug || '',
		appId: org.appId,
		app: org.app ? { id: org.app.id } : null,
	})

	return {
		orgId: org.id,
		appUuid,
		orgSlug: org.slug || '',
	}
}

async function resolveOrgByMembership(userId: string): Promise<{
	orgId: string
	appUuid: string | null
	orgSlug: string
} | null> {
	if (!userId) return null

	const membership = await prisma.member.findFirst({
		where: { userId },
		include: { organization: { include: { app: true } } },
		orderBy: { createdAt: 'asc' },
	})

	if (!membership?.organization) return null

	const appUuid = await ensureOrganizationAppLink({
		id: membership.organization.id,
		name: membership.organization.name,
		slug: membership.organization.slug || '',
		appId: membership.organization.appId,
		app: membership.organization.app ? { id: membership.organization.app.id } : null,
	})

	return {
		orgId: membership.organization.id,
		appUuid,
		orgSlug: membership.organization.slug || '',
	}
}

function extractApiKey(
	requestHeaders: Headers,
	headers: Record<string, unknown>,
	query: Record<string, unknown>,
	body: unknown,
): string | null {
	const bodyRecord =
		body && typeof body === 'object' && !Array.isArray(body)
			? (body as Record<string, unknown>)
			: null

	const candidate = [
		requestHeaders.get('x-api-key'),
		requestHeaders.get('x-app-secret'),
		(headers['x-api-key'] as string | undefined),
		(headers['X-Api-Key'] as string | undefined),
		(headers['x-app-secret'] as string | undefined),
		(headers['X-App-Secret'] as string | undefined),
		(query.api_key as string | undefined),
		(query.apiKey as string | undefined),
		(bodyRecord?.api_key as string | undefined),
		(bodyRecord?.apiKey as string | undefined),
	]
		.map((value) => String(value || '').trim())
		.find(Boolean)

	if (!candidate) return null
	const lowered = candidate.toLowerCase()
	if (lowered === 'scalesecret') return null
	if (candidate.length < 16) return null
	return candidate
}

async function resolveOrgByBusinessIdentifier(
	businessIdentifierInput: string,
): Promise<{
	orgId: string | null
	appUuid: string | null
	orgSlug: string
} | null> {
	const businessIdentifier = String(businessIdentifierInput || '').trim()
	if (!businessIdentifier) return null

	const fromOrgId = await resolveOrgById(businessIdentifier)
	if (fromOrgId) return fromOrgId

	const fromSlugOrLegacy = await resolveOrgSlug(businessIdentifier)
	if (fromSlugOrLegacy) return fromSlugOrLegacy

	const app = await prisma.apps.findUnique({
		where: { id: businessIdentifier },
		include: { organization: true },
	})
	if (!app) return null

	if (app.organization) {
		return {
			orgId: app.organization.id,
			appUuid: app.id,
			orgSlug: app.organization.slug || app.app_id || businessIdentifier,
		}
	}

	return {
		orgId: app.app_id || null,
		appUuid: app.id,
		orgSlug: app.app_id || businessIdentifier,
	}
}

export const appContext = new Elysia({ name: 'app-context' }).derive(
	{ as: 'global' },
	async ({ request, query, headers, body, params }) => {
		try {
			// Priority 1: URL params (organization-first, then legacy appId)
			let orgSlug =
				(params as any)?.orgSlug ||
				(params as any)?.organizationId ||
				(params as any)?.appId

			// Priority 2: Header or body
			if (!orgSlug) {
				orgSlug =
					headers['X-Org-Slug'] ||
					headers['x-org-slug'] ||
					headers['X-Organization-Id'] ||
					headers['x-organization-id'] ||
					(query as any)?.orgSlug ||
					(query as any)?.organizationId ||
					(body as any)?.app_id ||
					(body as any)?.orgSlug ||
					(body as any)?.organizationId
			}

			let userId: string | null = null
			let resolvedOrg: {
				orgId: string | null
				appUuid: string | null
				orgSlug: string
			} | null = null

			// Priority 3: Try to resolve from orgSlug
			if (orgSlug) {
				resolvedOrg = await resolveOrgSlug(orgSlug)
			}

			// Priority 3.5: Try API key headers (x-api-key / x-app-secret)
			if (!resolvedOrg) {
				try {
					const apiKey = extractApiKey(
						request.headers,
						headers as Record<string, unknown>,
						query as Record<string, unknown>,
						body,
					)
					if (apiKey) {
						const businessIdentifier =
							await DeveloperKeysService.resolveBusinessIdByApiKey(apiKey)
						if (businessIdentifier) {
							resolvedOrg =
								await resolveOrgByBusinessIdentifier(businessIdentifier)
						}
					}
				} catch (e) {
					// API key lookup failed
				}
			}

			// Priority 4: Try Better Auth session (for active organization)
			if (!resolvedOrg) {
				const sessionOrg = await getActiveOrgFromSession(request.headers)
				if (sessionOrg) {
					resolvedOrg = sessionOrg
					userId = (await auth.api.getSession({ headers: request.headers }))
						?.user?.id as string
				}
			}

			// Priority 4.25: Resolve Better Auth session directly from Bearer token
			if (!resolvedOrg) {
				try {
					const bearerToken = extractBearerToken(
						request.headers,
						headers as Record<string, unknown>,
					)

					if (bearerToken) {
						const tokenSession = await getSessionFromBearerToken(bearerToken)
						if (tokenSession) {
							userId = tokenSession.userId

							if (tokenSession.activeOrganizationId) {
								resolvedOrg = await resolveOrgById(
									tokenSession.activeOrganizationId,
								)
							}

							if (!resolvedOrg) {
								resolvedOrg = await resolveOrgByMembership(tokenSession.userId)
							}
						}
					}
				} catch (e) {
					// Token lookup failed
				}
			}

			// Priority 4.5: Fallback to user's first organization membership
			if (!resolvedOrg) {
				try {
					const session = await auth.api.getSession({ headers: request.headers })
					const sessionUserId = session?.user?.id
					if (sessionUserId) {
						userId = sessionUserId
						resolvedOrg = await resolveOrgByMembership(sessionUserId)
					}
				} catch (e) {
					// Session check failed
				}
			}

			// Priority 5: Legacy fallback (app_id resolution)
			if (!resolvedOrg) {
				const rawAppId =
					(query as any)?.appId ||
					(query as any)?.app_id ||
					(query as any)?.accountId ||
					headers['X-App-Id'] ||
					headers['x-app-id'] ||
					(body as any)?.app_id ||
					(body as any)?.appId

				if (rawAppId) {
					const appUuid = await resolveAppId(rawAppId as string)
					if (appUuid) {
						const app = await prisma.apps.findUnique({
							where: { id: appUuid },
						})
						resolvedOrg = {
							orgId: app?.app_id || null,
							appUuid: appUuid,
							orgSlug: app?.app_id || rawAppId,
						}
					}
				}
			}

			// Try to get userId from Better Auth session only
			if (!userId) {
				try {
					const session = await auth.api.getSession({
						headers: request.headers,
					})
					if (session?.user) {
						userId = session.user.id
					}
				} catch (e) {
					// No session found
				}
			}

			return {
				// New org-based context
				orgId: resolvedOrg?.orgId || null,
				orgSlug: resolvedOrg?.orgSlug || null,
				appUuid: resolvedOrg?.appUuid || null,
				userId,
				// Legacy compatibility
				resolvedAppId: resolvedOrg?.appUuid || null,
				rawAppId: orgSlug,
			}
		} catch (error) {
			console.error('App Context Error:', error)
			return {
				orgId: null,
				orgSlug: null,
				appUuid: null,
				userId: null,
				resolvedAppId: null,
				rawAppId: null,
			}
		}
	},
)
