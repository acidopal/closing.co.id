// @ts-nocheck
import bcrypt from 'bcryptjs'
import { Elysia, t } from 'elysia'
import { auth } from '../../auth'
import { syncBetterAuthCredentialAccount } from '../../lib/better-auth-credentials'
import prisma from '../../lib/prisma'
import { N8nService } from '../n8n/service'

export const authModule = new Elysia({ prefix: '/auth', tags: ['Authority'] })
	/**
	 * Login Endpoint - Uses Better Auth
	 */
	.post(
		'/login',
		async ({ body, set, request }) => {
			const { email, password } = body
			const normalizedEmail = String(email || '')
				.trim()
				.toLowerCase()

			// Find user (no 'apps' relation on users model)
			const user = await prisma.users.findUnique({
				where: { email: normalizedEmail },
				include: {
					members: {
						include: {
							organization: {
								include: { app: true },
							},
						},
						orderBy: { createdAt: 'asc' },
						take: 1,
					},
				},
			})

			if (!user || !user.active) {
				set.status = 401
				return { error: 'Invalid credentials' }
			}

			// Resolve app from organization membership
			const orgApp = user.members?.[0]?.organization?.app || null

			const signInWithBetterAuth = () =>
				fetch(
					`${process.env.BETTER_AUTH_BASE_URL || 'http://localhost:3010'}/auth/sign-in/email`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email: normalizedEmail, password }),
					},
				)

			// Use Better Auth to create session
			let loginResponse = await signInWithBetterAuth()

			if (!loginResponse.ok) {
				// Legacy user path: verify old bcrypt password then sync Better Auth credential account.
				if (!user.password) {
					set.status = 401
					return { error: 'Invalid credentials' }
				}

				const validPassword = await bcrypt.compare(password, user.password)
				if (!validPassword) {
					set.status = 401
					return { error: 'Invalid credentials' }
				}

				await prisma.$transaction(async (tx) => {
					await syncBetterAuthCredentialAccount(tx, {
						userId: user.id,
						password,
					})
				})

				// Retry sign-in after syncing Better Auth credential hash.
				loginResponse = await signInWithBetterAuth()
			}

			if (!loginResponse.ok) {
				console.log(
					'Better Auth sign-in failed after credential sync, returning legacy format',
				)

				return {
					success: true,
					token: 'legacy-token',
					refreshToken: 'legacy-token',
					user: {
						id: user.id,
						name: user.name,
						email: user.email,
						role: user.role,
						avatar_url: user.avatar_url,
						app_id: user.app_id,
					},
					app: orgApp,
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
				}
			}

			const baData = (await loginResponse.json()) as any

			// Return Better Auth session data
			// Provision n8n account in background (fire-and-forget)
			N8nService.ensureN8nAccount({
				id: user.id,
				email: user.email,
				name: user.name || user.email,
			}).catch((err) => console.error('[n8n] auto-provision on login failed:', err))

			return {
				success: true,
				token: baData.token || 'better-auth-session',
				refreshToken:
					baData.refreshToken || baData.token || 'better-auth-session',
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					avatar_url: user.avatar_url,
					app_id: user.app_id,
				},
				app: orgApp,
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			}
		},
		{
			body: t.Object({
				email: t.String(),
				password: t.String(),
				app_id: t.Optional(t.String()),
			}),
		},
	)

	.get('/me', async ({ request, headers }) => {
		// Use Better Auth only
		const session = await auth.api.getSession({ headers: request.headers })
		if (session) {
			return { data: session }
		}

		return { error: 'Unauthorized' }
	})

	.post('/logout', async ({ headers }) => {
		// Use Better Auth signOut
		await auth.api.signOut({ headers })
		return { success: true }
	})
