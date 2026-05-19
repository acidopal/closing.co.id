import prisma from '../../lib/prisma'
import { resolveAppId } from '../../lib/utils'

export abstract class FlowService {
	static async getFlows(appId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.automation_flows.findMany({
			where: { app_id: targetAppId || undefined },
			orderBy: { created_at: 'desc' },
		})
	}

	static async getFlowById(id: string, appId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.automation_flows.findFirst({
			where: { id, app_id: targetAppId || undefined },
		})
	}

	static async createFlow(appId: string, data: any) {
		const targetAppId = await resolveAppId(appId)
		const resolvedAppId = targetAppId || appId
		const isActive =
			data.active !== undefined
				? data.active
				: data.is_active !== undefined
					? data.is_active
					: true

		if (isActive) {
			return prisma.$transaction(async (tx) => {
				await tx.automation_flows.updateMany({
					where: {
						app_id: resolvedAppId,
						active: true,
					},
					data: {
						active: false,
						updated_at: new Date(),
					},
				})

				return tx.automation_flows.create({
					data: {
						name: data.name,
						description: data.description,
						nodes: data.nodes || [],
						edges: data.edges || [],
						active: true,
						app_id: resolvedAppId,
					},
				})
			})
		}

		return prisma.automation_flows.create({
			data: {
				name: data.name,
				description: data.description,
				nodes: data.nodes || [],
				edges: data.edges || [],
				active: false,
				app_id: resolvedAppId,
			},
		})
	}

	static async updateFlow(id: string, appId: string, data: any) {
		const targetAppId = await resolveAppId(appId)
		const resolvedAppId = targetAppId || appId
		const nextActive =
			typeof data.active === 'boolean'
				? data.active
				: data.is_active !== undefined
					? Boolean(data.is_active)
					: undefined

		if (nextActive === true) {
			return prisma.$transaction(async (tx) => {
				await tx.automation_flows.updateMany({
					where: {
						app_id: resolvedAppId,
						id: { not: id },
						active: true,
					},
					data: {
						active: false,
						updated_at: new Date(),
					},
				})

				return tx.automation_flows.update({
					where: { id, app_id: resolvedAppId },
					data: {
						...(data.name !== undefined && { name: data.name }),
						...(data.description !== undefined && {
							description: data.description,
						}),
						...(data.nodes !== undefined && { nodes: data.nodes }),
						...(data.edges !== undefined && { edges: data.edges }),
						active: true,
						updated_at: new Date(),
					},
				})
			})
		}

		return prisma.automation_flows.update({
			where: { id, app_id: resolvedAppId },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.description !== undefined && {
					description: data.description,
				}),
				...(data.nodes !== undefined && { nodes: data.nodes }),
				...(data.edges !== undefined && { edges: data.edges }),
				...(nextActive !== undefined && { active: nextActive }),
				updated_at: new Date(),
			},
		})
	}

	static async deleteFlow(id: string, appId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.automation_flows.delete({
			where: { id, app_id: targetAppId || undefined },
		})
	}
}
