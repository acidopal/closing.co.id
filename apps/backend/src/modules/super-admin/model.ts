import { Elysia, t } from 'elysia'

export const superAdminModel = new Elysia().model({
	getUsersQuery: t.Object({
		page: t.Optional(t.Numeric()),
		limit: t.Optional(t.Numeric()),
		search: t.Optional(t.String()),
	}),
	updateUserRoleBody: t.Object({
		role: t.String(),
	}),
	suspendUserParams: t.Object({
		userId: t.String(),
	}),
	getCompaniesQuery: t.Object({
		page: t.Optional(t.Numeric()),
		limit: t.Optional(t.Numeric()),
		search: t.Optional(t.String()),
	}),
	updateCompanyStatusBody: t.Object({
		isActive: t.Boolean(),
	}),
	manualCreditTopUpBody: t.Object({
		amount: t.Number(),
		reason: t.Optional(t.String()),
	}),
	getWebhookLogsQuery: t.Object({
		page: t.Optional(t.Numeric()),
		limit: t.Optional(t.Numeric()),
		appId: t.Optional(t.String()),
		status: t.Optional(t.String()),
	}),
	creditsAdjustBody: t.Object({
		organizationId: t.String(),
		amount: t.Number(),
		reason: t.String(),
	}),
	creditsBalanceParams: t.Object({
		orgId: t.String(),
	}),
	creditsModelPricingBody: t.Object({
		modelName: t.String(),
		costPerRequest: t.Number(),
		description: t.Optional(t.String()),
		isActive: t.Optional(t.Boolean()),
	}),
	usageReportQuery: t.Object({
		startDate: t.Optional(t.String()),
		endDate: t.Optional(t.String()),
		organizationId: t.Optional(t.String()),
		page: t.Optional(t.Numeric()),
		limit: t.Optional(t.Numeric()),
	}),
})
