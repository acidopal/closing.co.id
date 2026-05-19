import prisma from '../../lib/prisma'
import { resolveAppId } from '../../lib/utils'

export abstract class AutoAssignService {
	// Rules
	static async getRules(appId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.auto_assign_rules.findMany({
			where: { app_id: targetAppId || undefined },
			orderBy: { priority: 'asc' },
		})
	}

	static async createRule(appId: string, data: any) {
		const targetAppId = await resolveAppId(appId)
		return prisma.auto_assign_rules.create({
			data: {
				...data,
				app_id: targetAppId || appId,
			},
		})
	}

	static async updateRule(id: string, appId: string, data: any) {
		const targetAppId = await resolveAppId(appId)
		return prisma.auto_assign_rules.update({
			where: { id, app_id: targetAppId || undefined },
			data: {
				...data,
				updated_at: new Date(),
			},
		})
	}

	static async deleteRule(id: string, appId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.auto_assign_rules.delete({
			where: { id, app_id: targetAppId || undefined },
		})
	}

	// SLA Policies
	static async getSLAPolicies(appId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.sla_policies.findMany({
			where: { app_id: targetAppId || undefined },
			orderBy: { is_default: 'desc' },
		})
	}

	static async createSLAPolicy(appId: string, data: any) {
		const targetAppId = await resolveAppId(appId)
		if (data.is_default) {
			await prisma.sla_policies.updateMany({
				where: { app_id: targetAppId || appId },
				data: { is_default: false },
			})
		}

		return prisma.sla_policies.create({
			data: {
				...data,
				app_id: targetAppId || appId,
			},
		})
	}

	static async updateSLAPolicy(id: string, appId: string, data: any) {
		const targetAppId = await resolveAppId(appId)
		if (data.is_default) {
			await prisma.sla_policies.updateMany({
				where: { app_id: targetAppId || appId, id: { not: id } },
				data: { is_default: false },
			})
		}

		return prisma.sla_policies.update({
			where: { id, app_id: targetAppId || undefined },
			data: {
				...data,
				updated_at: new Date(),
			},
		})
	}

	static async deleteSLAPolicy(id: string, appId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.sla_policies.delete({
			where: { id, app_id: targetAppId || undefined, is_default: false },
		})
	}

	// Stats
	static async getSLABreaches(appId: string) {
		const targetAppId = await resolveAppId(appId)
		return prisma.sla_breach_events.findMany({
			where: {
				conversation_id: targetAppId || undefined,
			},
			include: {
				sla_policies: true,
			},
			orderBy: { created_at: 'desc' },
			take: 50,
		})
	}
}
