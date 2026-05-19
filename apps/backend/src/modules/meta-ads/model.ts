import { t } from 'elysia'

export const MetaAdsModel = {
	account: t.Object({
		id: t.String(),
		app_id_org: t.String(),
		fb_account_id: t.String(),
		fb_account_name: t.String(),
		currency: t.String(),
		is_active: t.Boolean(),
	}),

	campaign: t.Object({
		id: t.String(),
		ads_account_id: t.String(),
		fb_campaign_id: t.String(),
		name: t.String(),
		status: t.String(),
	}),
} as const

export const MetaAdsRequestModel = {
	connect: t.Object({
		access_token: t.String(),
	}),
} as const
