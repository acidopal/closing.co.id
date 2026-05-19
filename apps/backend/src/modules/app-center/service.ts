import prisma from '../../lib/prisma'

const isUuid = (str: string) =>
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

async function resolveAppId(appId: string): Promise<string | null> {
	if (!appId || appId === 'default') return null
	if (isUuid(appId)) return appId

	const app = await prisma.apps.findFirst({
		where: { app_id: appId },
		select: { id: true },
	})

	return app?.id || null
}

export abstract class AppCenterService {
	static async getCategories() {
		return prisma.app_categories.findMany({
			orderBy: { sort_order: 'asc' },
		})
	}

	static async getApps(filter: any = {}) {
		return prisma.app_center.findMany({
			where: {
				is_active: true,
				...(filter.category
					? { app_categories: { slug: filter.category } }
					: {}),
				...(filter.search
					? {
							OR: [
								{ name: { contains: filter.search, mode: 'insensitive' } },
								{
									description: { contains: filter.search, mode: 'insensitive' },
								},
							],
						}
					: {}),
			},
			include: {
				app_categories: true,
			},
		})
	}

	static async getAppById(idOrSlug: string) {
		return prisma.app_center.findFirst({
			where: {
				OR: [{ id: idOrSlug }, { slug: idOrSlug }],
			},
			include: {
				app_categories: true,
			},
		})
	}

	static async getInstalledApps(appIdOrg: string) {
		const targetAppId = await resolveAppId(appIdOrg)

		return prisma.app_installations.findMany({
			where: { app_id_org: targetAppId || undefined },
			include: {
				app_center: true,
			},
		})
	}

	static async installApp(data: any) {
		const targetAppId = await resolveAppId(data.app_id_org)

		return prisma.app_installations.create({
			data: {
				app_id: data.app_id,
				app_id_org: targetAppId || data.app_id_org,
				status: 'approved',
				is_enabled: true,
			},
		})
	}
}
