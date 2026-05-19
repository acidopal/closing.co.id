import { Elysia } from 'elysia'
import { appContext } from '../../plugins'
import { N8nService } from './service'

const N8N_ORG_COOKIE_KEY = 'scalebiz_n8n_org'
const N8N_ORG_SLUG_COOKIE_KEY = 'scalebiz_n8n_org_slug'
const ORG_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function hasN8nSessionCookie(cookieHeader: string | null): boolean {
	if (!cookieHeader) return false
	return cookieHeader.split(';').some((part) => part.trim().startsWith('n8n-auth='))
}

function readCookie(cookieHeader: string | null, key: string): string | null {
	if (!cookieHeader) return null
	const cookies = cookieHeader.split(';')
	for (const rawCookie of cookies) {
		const [cookieKey, ...rest] = rawCookie.trim().split('=')
		if (cookieKey !== key) continue
		try {
			return decodeURIComponent(rest.join('='))
		} catch {
			return rest.join('=')
		}
	}
	return null
}

function buildOrgSessionCookies(input: {
	orgId: string
	orgSlug?: string | null
	isSecure: boolean
}): string[] {
	const secureSuffix = input.isSecure ? '; Secure' : ''
	const base = `Path=/; Max-Age=${ORG_COOKIE_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secureSuffix}`
	const cookies = [`${N8N_ORG_COOKIE_KEY}=${encodeURIComponent(input.orgId)}; ${base}`]
	if (input.orgSlug) {
		cookies.push(
			`${N8N_ORG_SLUG_COOKIE_KEY}=${encodeURIComponent(input.orgSlug)}; ${base}`,
		)
	}
	return cookies
}

export const n8n = new Elysia({ prefix: '/n8n', tags: ['n8n Automation'] })
	.use(appContext)

	/**
	 * GET /api/n8n/embed — Provision n8n account and return ready status.
	 * Frontend calls this before loading the iframe.
	 */
	.get('/embed', async ({ request, userId, set }) => {
		try {
			if (!userId) {
				// Fallback: try Better Auth session from request headers
				const { auth } = await import('../../auth')
				const session = await auth.api.getSession({ headers: request.headers })
				if (!session?.user) {
					set.status = 401
					return { success: false, error: 'Unauthorized' }
				}

				const user = session.user as { id: string; email: string; name: string }
				const result = await N8nService.ensureN8nAccount({
					id: user.id,
					email: user.email,
					name: user.name || user.email,
				})

				return result.success
					? { success: true }
					: (set.status = 502, { success: false, error: result.error || 'Failed to provision n8n account' })
			}

			// userId resolved by appContext — look up user details
			const { default: prisma } = await import('../../lib/prisma')
			const user = await prisma.users.findUnique({
				where: { id: userId },
				select: { id: true, email: true, name: true },
			})

			if (!user) {
				set.status = 401
				return { success: false, error: 'User not found' }
			}

			const result = await N8nService.ensureN8nAccount({
				id: user.id,
				email: user.email,
				name: user.name || user.email,
			})

			return result.success
				? { success: true }
				: (set.status = 502, { success: false, error: result.error || 'Failed to provision n8n account' })
		} catch (err) {
			console.error('[n8n] embed endpoint error:', err)
			set.status = 500
			return { success: false, error: 'Failed to initialize n8n session' }
		}
	})

	/**
	 * POST /api/n8n/embed-login — bootstrap n8n embedded auth for active org.
	 * Calls n8n's secret-gated bypass endpoint and forwards session cookie.
	 */
	.post('/embed-login', async ({ request, userId, orgId, set }) => {
		try {
			const { auth } = await import('../../auth')

			let authenticatedUserId = userId
			if (!authenticatedUserId) {
				const session = await auth.api.getSession({ headers: request.headers })
				if (!session?.user?.id) {
					set.status = 401
					return { success: false, error: 'Unauthorized' }
				}
				authenticatedUserId = session.user.id
			}

			const forceLogin = (() => {
				try {
					return new URL(request.url).searchParams.get('force') === '1'
				} catch {
					return false
				}
			})()
			const cookieHeader = request.headers.get('cookie')

			const { default: prisma } = await import('../../lib/prisma')

			// Prefer active org context, but always verify membership to avoid spoofing.
			let organization = null as null | {
				id: string
				name: string
				slug: string | null
				appId: string | null
				app: { app_id: string } | null
			}
			if (orgId) {
				organization = await prisma.organization.findFirst({
					where: {
						id: orgId,
						members: { some: { userId: authenticatedUserId } },
					},
					select: {
						id: true,
						name: true,
						slug: true,
						appId: true,
						app: {
							select: {
								app_id: true,
							},
						},
					},
				})
			}

			if (!organization) {
				const membership = await prisma.member.findFirst({
					where: { userId: authenticatedUserId },
					select: {
						organization: {
							select: {
								id: true,
								name: true,
								slug: true,
								appId: true,
								app: {
									select: {
										app_id: true,
									},
								},
							},
						},
					},
					orderBy: { createdAt: 'asc' },
				})

				organization = membership?.organization || null
			}

			if (!organization) {
				set.status = 403
				return { success: false, error: 'No organization membership found' }
			}

			const currentOrgCookie = readCookie(cookieHeader, N8N_ORG_COOKIE_KEY)
			const hasMatchingOrgSession =
				!forceLogin &&
				hasN8nSessionCookie(cookieHeader) &&
				currentOrgCookie === organization.id

			if (hasMatchingOrgSession) {
				return {
					success: true,
					embedUrl: N8nService.getEmbedUrl(),
					reusedSession: true,
				}
			}

			const loginResult = await N8nService.loginOrganizationForEmbed({
				organizationId: organization.id,
				organizationName: organization.name,
				organizationSlug: organization.slug || undefined,
				organizationAppId: organization.app?.app_id || undefined,
				requestHost:
					request.headers.get('x-forwarded-host') ||
					request.headers.get('host') ||
					undefined,
			})

			if (!loginResult.success) {
				set.status = 502
				return {
					success: false,
					error: loginResult.error || 'Failed to bootstrap n8n embedded auth',
				}
			}

			if (loginResult.cookies?.length) {
				const forwardedProto = request.headers.get('x-forwarded-proto')
				const isSecure = forwardedProto
					? forwardedProto.split(',')[0].trim().toLowerCase() === 'https'
					: request.url.startsWith('https://')

				set.headers['set-cookie'] = [
					...loginResult.cookies,
					...buildOrgSessionCookies({
						orgId: organization.id,
						orgSlug: organization.slug || null,
						isSecure,
					}),
				]
			}

			return {
				success: true,
				embedUrl: N8nService.getEmbedUrl(),
			}
		} catch (err) {
			console.error('[n8n] embed-login endpoint error:', err)
			set.status = 500
			return { success: false, error: 'Failed to initialize embedded login' }
		}
	})

	/**
	 * POST /api/n8n/provision — Manually provision n8n account for current user.
	 */
	.post('/provision', async ({ request, userId, set }) => {
		try {
			if (!userId) {
				const { auth } = await import('../../auth')
				const session = await auth.api.getSession({ headers: request.headers })
				if (!session?.user) {
					set.status = 401
					return { success: false, error: 'Unauthorized' }
				}

				const user = session.user as { id: string; email: string; name: string }
				return await N8nService.ensureN8nAccount({
					id: user.id,
					email: user.email,
					name: user.name || user.email,
				})
			}

			const { default: prisma } = await import('../../lib/prisma')
			const user = await prisma.users.findUnique({
				where: { id: userId },
				select: { id: true, email: true, name: true },
			})

			if (!user) {
				set.status = 401
				return { success: false, error: 'User not found' }
			}

			return await N8nService.ensureN8nAccount({
				id: user.id,
				email: user.email,
				name: user.name || user.email,
			})
		} catch (err) {
			console.error('[n8n] provision endpoint error:', err)
			set.status = 500
			return { success: false, error: 'Failed to provision n8n account' }
		}
	})
