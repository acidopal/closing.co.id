import prisma from '../../lib/prisma'

export abstract class MetaAdsService {
	static async getAccounts(appId: string) {
		return prisma.meta_ads_accounts.findMany({
			where: { app_id_org: appId },
			orderBy: { created_at: 'desc' },
		})
	}

	static async getCampaigns(appId: string, filter: any = {}) {
		return prisma.meta_ads_campaigns.findMany({
			where: {
				meta_ads_accounts: { app_id_org: appId },
				...(filter.status ? { status: filter.status } : {}),
				...(filter.search
					? { name: { contains: filter.search, mode: 'insensitive' } }
					: {}),
			},
			include: {
				meta_ads_accounts: true,
			},
		})
	}

	static async getInsightsSummary(appId: string) {
		// This is complex in SQL, Prisma raw might be needed or multiple queries
		// Mock summary for now
		return {
			total_impressions: 125000,
			total_reach: 85000,
			total_clicks: 3200,
			total_spend: 1500.5,
			total_leads: 450,
		}
	}
}
