import { Elysia, t } from 'elysia'
import { auth } from '../auth'
import { ensureBetterAuthOrganizationMembership } from '../lib/organization-membership'
import { ensureOrganizationAppLink } from '../lib/organization-app'
import prisma from '../lib/prisma'

type AnyObj = Record<string, any>

function normalizeOrganization(org: AnyObj) {
	return {
		id: org.id,
		name: org.name,
		slug: org.slug,
		appId: org.appId ?? org.app?.id ?? null,
		logo: org.logo ?? null,
		description: org.description ?? null,
		createdBy: org.createdBy ?? null,
		metadata: org.metadata ?? null,
		createdAt: new Date(org.createdAt ?? Date.now()).toISOString(),
		updatedAt: new Date(org.updatedAt ?? Date.now()).toISOString(),
	}
}

function normalizeMember(member: AnyObj) {
	return {
		id: member.id,
		organizationId: member.organizationId,
		userId: member.userId,
		role: member.role,
		createdAt: new Date(member.createdAt ?? Date.now()).toISOString(),
		updatedAt: new Date(member.updatedAt ?? Date.now()).toISOString(),
		user: member.user
			? {
					id: member.user.id,
					name: member.user.name,
					email: member.user.email,
					avatar_url: member.user.image ?? member.user.avatar_url,
				}
			: undefined,
	}
}

function getErrorMessage(error: unknown, fallback: string) {
	if (error && typeof error === 'object' && 'message' in error) {
		const message = (error as AnyObj).message
		if (typeof message === 'string' && message.length > 0) return message
	}
	return fallback
}

export const organizationModule = new Elysia({
	prefix: '/organization',
	tags: ['Organization'],
})
	.get('/list', async ({ headers }) => {
		try {
			const session = await auth.api.getSession({ headers })
			if (!session?.user) {
				return { organizations: [], activeOrganizationId: undefined }
			}

			let organizations = await auth.api.listOrganizations({ headers })
			let orgList = (organizations || []) as AnyObj[]

			// Legacy self-heal:
			// Some agents were created directly in users table without Better Auth membership.
			// Backfill member row from app_id so org selection works after login.
			if (orgList.length === 0) {
				const sessionUserId = (session.user as AnyObj)?.id as string | undefined
				if (sessionUserId) {
					const dbUser = await prisma.users.findUnique({
						where: { id: sessionUserId },
						select: { app_id: true, role: true },
					})

					if (dbUser?.app_id) {
						await prisma.$transaction(async (tx) => {
							await ensureBetterAuthOrganizationMembership(tx, {
								userId: sessionUserId,
								appId: dbUser.app_id as string,
								role: dbUser.role,
							})
						})

						organizations = await auth.api.listOrganizations({ headers })
						orgList = (organizations || []) as AnyObj[]
					}
				}
			}

			const normalizedOrganizations = await Promise.all(
				orgList.map(async (org: AnyObj) => {
					try {
						const appId = await ensureOrganizationAppLink({
							id: org.id,
							name: org.name,
							slug: org.slug || org.id || 'workspace',
							appId: org.appId ?? null,
							app: org.app ? { id: org.app.id } : null,
						})
						return normalizeOrganization({ ...org, appId })
					} catch {
						return normalizeOrganization(org)
					}
				}),
			)

			return {
				organizations: normalizedOrganizations,
				activeOrganizationId: (session.user as AnyObj).activeOrganizationId,
			}
		} catch (error) {
			return { organizations: [], activeOrganizationId: undefined }
		}
	})
	.get('/get-active', async ({ headers }) => {
		try {
			const session = await auth.api.getSession({ headers })
			if (!session?.user) {
				return { organization: null, member: null }
			}

			const activeOrganization = await auth.api.getFullOrganization({ headers })
			if (!activeOrganization) {
				return { organization: null, member: null }
			}
			const activeOrgWithApp = (() => {
				try {
					return ensureOrganizationAppLink({
						id: (activeOrganization as AnyObj).id,
						name: (activeOrganization as AnyObj).name,
						slug:
							(activeOrganization as AnyObj).slug ||
							(activeOrganization as AnyObj).id ||
							'workspace',
						appId: ((activeOrganization as AnyObj).appId as string | null) ?? null,
						app: (activeOrganization as AnyObj).app
							? { id: (activeOrganization as AnyObj).app.id }
							: null,
					})
				} catch {
					return Promise.resolve(null)
				}
			})()
			const resolvedAppId = await activeOrgWithApp

			const selfMember = (activeOrganization.members || []).find(
				(member: AnyObj) => member.userId === session.user.id,
			)

			return {
				organization: normalizeOrganization({
					...activeOrganization,
					appId: resolvedAppId || (activeOrganization as AnyObj).appId || null,
				}),
				member: selfMember ? normalizeMember(selfMember) : null,
			}
		} catch (error) {
			return { organization: null, member: null }
		}
	})
	.post(
		'/set-active',
		async ({ body, headers, set }) => {
			try {
				await auth.api.setActiveOrganization({
					headers,
					body: { organizationId: body.organizationId },
				})

				return { success: true, organizationId: body.organizationId }
			} catch (error) {
				set.status = 400
				return {
					error: getErrorMessage(error, 'Failed to set active organization'),
				}
			}
		},
		{
			body: t.Object({
				organizationId: t.String({ minLength: 1 }),
			}),
		},
	)
	.post(
		'/create',
		async ({ body, headers, set }) => {
			try {
				const session = await auth.api.getSession({ headers })
				if (!session?.user) {
					set.status = 401
					return { error: 'Unauthorized' }
				}

				const organization = await auth.api.createOrganization({
					headers,
					body: {
						name: body.name,
						slug: body.slug,
						logo: body.logo,
					},
				})

					await prisma.organization.update({
						where: { id: (organization as AnyObj).id },
						data: {
							description: body.description ?? null,
						createdBy: session.user.id,
					},
				})

				await ensureOrganizationAppLink({
					id: (organization as AnyObj).id,
					name: (organization as AnyObj).name,
					slug: (organization as AnyObj).slug,
					appId: ((organization as AnyObj).appId as string | null) ?? null,
					app: null,
				})

				await auth.api.setActiveOrganization({
					headers,
					body: { organizationId: (organization as AnyObj).id },
				})

				// Provision n8n account for the org creator (fire-and-forget)
				try {
					const { N8nService } = await import('../n8n/service')
					N8nService.ensureN8nAccount({
						id: session.user.id,
						email: session.user.email,
						name: session.user.name || session.user.email,
					}).catch((err: unknown) => console.error('[n8n] auto-provision on org create failed:', err))
				} catch {}

				const updatedOrg = await prisma.organization.findUnique({
					where: { id: (organization as AnyObj).id },
				})

				return normalizeOrganization(updatedOrg as AnyObj)
			} catch (error) {
				set.status = 400
				return { error: getErrorMessage(error, 'Organization creation failed') }
			}
		},
		{
			body: t.Object({
				name: t.String({ minLength: 1 }),
				slug: t.String({ minLength: 1 }),
				logo: t.Optional(t.String()),
				description: t.Optional(t.String()),
			}),
		},
	)
	.post(
		'/update',
		async ({ body, headers }) => {
			try {
				const organization = await auth.api.updateOrganization({
					headers,
					body: {
						organizationId: body.organizationId,
						data: {
							...(body.data.name && { name: body.data.name }),
							...(body.data.slug && { slug: body.data.slug }),
							...(body.data.logo !== undefined && { logo: body.data.logo }),
						},
					},
				})

				return normalizeOrganization(organization as AnyObj)
			} catch (error) {
				return {
					error: getErrorMessage(error, 'Failed to update organization'),
				}
			}
		},
		{
			body: t.Object({
				organizationId: t.String(),
				data: t.Object({
					name: t.Optional(t.String()),
					slug: t.Optional(t.String()),
					logo: t.Optional(t.String()),
				}),
			}),
		},
	)
	.post(
		'/delete',
		async ({ body, headers }) => {
			try {
				await auth.api.deleteOrganization({
					headers,
					body: { organizationId: body.organizationId },
				})
				return { success: true }
			} catch (error) {
				return {
					error: getErrorMessage(error, 'Failed to delete organization'),
				}
			}
		},
		{
			body: t.Object({
				organizationId: t.String(),
			}),
		},
	)
	.get('/get-members', async ({ query, headers }) => {
		try {
			const organizationId = (query as AnyObj).organizationId as string
			const data = await auth.api.listMembers({
				headers,
				query: organizationId ? { organizationId } : {},
			})

			return ((data as AnyObj)?.members || data || []).map((member: AnyObj) =>
				normalizeMember(member),
			)
		} catch (error) {
			return { error: getErrorMessage(error, 'Failed to fetch members') }
		}
	})
	.post(
		'/invite-member',
		async ({ body, headers }) => {
			try {
				const invitation = await auth.api.createInvitation({
					headers,
					body: {
						organizationId: body.organizationId,
						email: body.email,
						role: body.role || 'member',
					},
				})

				return {
					id: (invitation as AnyObj).id,
					organizationId: (invitation as AnyObj).organizationId,
					email: (invitation as AnyObj).email,
					role: (invitation as AnyObj).role,
					status: (invitation as AnyObj).status,
					expiresAt: new Date(
						(invitation as AnyObj).expiresAt ?? Date.now(),
					).toISOString(),
					createdAt: new Date(
						(invitation as AnyObj).createdAt ?? Date.now(),
					).toISOString(),
				}
			} catch (error) {
				return { error: getErrorMessage(error, 'Failed to invite member') }
			}
		},
		{
			body: t.Object({
				organizationId: t.String(),
				email: t.String(),
				role: t.Optional(t.Union([t.Literal('admin'), t.Literal('member')])),
			}),
		},
	)
	.post(
		'/remove-member',
		async ({ body, headers }) => {
			try {
				await auth.api.removeMember({
					headers,
					body: {
						organizationId: body.organizationId,
						memberIdOrEmail: body.memberId,
					},
				})
				return { success: true }
			} catch (error) {
				return { error: getErrorMessage(error, 'Failed to remove member') }
			}
		},
		{
			body: t.Object({
				organizationId: t.String(),
				memberId: t.String(),
			}),
		},
	)
	.post(
		'/update-member-role',
		async ({ body, headers }) => {
			try {
				await auth.api.updateMemberRole({
					headers,
					body: {
						organizationId: body.organizationId,
						memberId: body.memberId,
						role: body.role,
					},
				})
				return { success: true }
			} catch (error) {
				return { error: getErrorMessage(error, 'Failed to update member role') }
			}
		},
		{
			body: t.Object({
				organizationId: t.String(),
				memberId: t.String(),
				role: t.Union([t.Literal('admin'), t.Literal('member')]),
			}),
		},
	)
