import prisma from '../../lib/prisma'
import { resolveAppId, resolveOrganizationId } from '../../lib/utils'

const GRACE_PERIOD_FLOOR = -100
const DEFAULT_WARNING_THRESHOLD = 5

type TransactionType = 'top_up' | 'usage' | 'adjustment'

export type OrgBalance = {
	ai_credits: number
	warning_threshold: number
	low_credit_alert_sent: boolean
}

type CreditMetadata = unknown

export abstract class BillingService {
	private static toNumber(value?: unknown) {
		if (value === null || value === undefined) return 0
		const parsed = Number(value)
		return Number.isFinite(parsed) ? parsed : 0
	}

	private static getWarningThreshold(value?: unknown) {
		const parsed = Number(value ?? DEFAULT_WARNING_THRESHOLD)
		return Number.isFinite(parsed) ? parsed : DEFAULT_WARNING_THRESHOLD
	}

	private static mapToOrgBalance(record: {
		aiCredits: unknown
		aiCreditWarningThreshold: unknown
		aiLowCreditAlertSent: boolean | null
	}): OrgBalance {
		return {
			ai_credits: BillingService.toNumber(record.aiCredits),
			warning_threshold: BillingService.getWarningThreshold(
				record.aiCreditWarningThreshold,
			),
			low_credit_alert_sent: Boolean(record.aiLowCreditAlertSent),
		}
	}
	static async getBalance(appId: string) {
		const targetAppId = await resolveAppId(appId)
		if (!targetAppId) throw new Error('Invalid App ID')

		const organization = await prisma.organization.findUnique({
			where: { appId: targetAppId },
			select: { aiCredits: true, aiCreditWarningThreshold: true },
		})

		if (!organization) throw new Error('Organization not found')

		return {
			ai_credits: Number(organization?.aiCredits || 0),
			warning_threshold: Number(organization?.aiCreditWarningThreshold || 5),
		}
	}

	static async getOrganizationBalance(organizationId: string) {
		const balance = await BillingService.getOrgBalance(organizationId)
		return {
			ai_credits: balance.ai_credits,
			warning_threshold: balance.warning_threshold,
		}
	}

	static async getOrgBalance(organizationId: string) {
		const targetOrgId = await resolveOrganizationId(organizationId)
		if (!targetOrgId) throw new Error('Invalid Organization ID')

		const organization = await prisma.organization.findUnique({
			where: { id: targetOrgId },
			select: {
				aiCredits: true,
				aiCreditWarningThreshold: true,
				aiLowCreditAlertSent: true,
			},
		})

		if (!organization) throw new Error('Organization not found')

		return BillingService.mapToOrgBalance(organization)
	}

	static async topUpOrgCredits(
		organizationId: string,
		amount: number,
		description = 'Top up credits',
		paymentId?: string,
		metadata?: CreditMetadata,
		transactionType: TransactionType = 'top_up',
	) {
		const targetOrgId = await resolveOrganizationId(organizationId)
		if (!targetOrgId) throw new Error('Invalid Organization ID')

		return prisma.$transaction(async (tx) => {
			const organization = await tx.organization.findUnique({
				where: { id: targetOrgId },
				select: {
					aiCredits: true,
					aiCreditWarningThreshold: true,
					aiLowCreditAlertSent: true,
				},
			})

			if (!organization) throw new Error('Organization not found')

			const currentBalance = BillingService.toNumber(organization.aiCredits)
			const threshold = BillingService.getWarningThreshold(
				organization.aiCreditWarningThreshold,
			)

			const updatedBalance = currentBalance + amount
			const shouldResetAlert =
				Boolean(organization.aiLowCreditAlertSent) &&
				updatedBalance >= threshold

			await tx.organization.update({
				where: { id: targetOrgId },
				data: {
					aiCredits: { increment: amount },
					...(shouldResetAlert ? { aiLowCreditAlertSent: false } : {}),
				},
			})

			return tx.credit_transactions.create({
				data: {
					organization_id: targetOrgId,
					amount,
					type: transactionType,
					description,
					external_id: paymentId ?? null,
					metadata: metadata ?? undefined,
					payment_status: 'completed',
				},
			})
		})
	}

	static async checkLowBalance(organizationId: string) {
		const balance = await BillingService.getOrgBalance(organizationId)
		return balance.ai_credits <= balance.warning_threshold
	}

	static async sendLowBalanceAlert(organizationId: string) {
		const targetOrgId = await resolveOrganizationId(organizationId)
		if (!targetOrgId) throw new Error('Invalid Organization ID')

		const organization = await prisma.organization.findUnique({
			where: { id: targetOrgId },
			select: { aiLowCreditAlertSent: true },
		})

		if (!organization) throw new Error('Organization not found')
		if (organization.aiLowCreditAlertSent) return

		await prisma.organization.update({
			where: { id: targetOrgId },
			data: { aiLowCreditAlertSent: true },
		})

		console.warn(
			'[BillingService] Low credit alert triggered for organization',
			targetOrgId,
		)
	}

	static async isInGracePeriod(organizationId: string) {
		const { ai_credits } = await BillingService.getOrgBalance(organizationId)
		return ai_credits >= GRACE_PERIOD_FLOOR
	}

	static async deductOrgCredits(
		organizationId: string,
		amount: number,
		description: string,
		metadata?: CreditMetadata,
		transactionType: TransactionType = 'usage',
	) {
		const targetOrgId = await resolveOrganizationId(organizationId)
		if (!targetOrgId) throw new Error('Invalid Organization ID')

		const { transaction, shouldTriggerAlert } = await prisma.$transaction(
			async (tx) => {
				const organization = await tx.organization.findUnique({
					where: { id: targetOrgId },
					select: {
						aiCredits: true,
						aiCreditWarningThreshold: true,
						aiLowCreditAlertSent: true,
					},
				})

				if (!organization) throw new Error('Organization not found')

				const currentBalance = BillingService.toNumber(organization.aiCredits)
				const updatedBalance = currentBalance - amount

				if (updatedBalance < GRACE_PERIOD_FLOOR) {
					throw new Error('Insufficient AI credits (grace period: -100)')
				}

				const threshold = BillingService.getWarningThreshold(
					organization.aiCreditWarningThreshold,
				)
				const alertAlreadySent = Boolean(organization.aiLowCreditAlertSent)
				const shouldTriggerAlert =
					!alertAlreadySent && updatedBalance <= threshold

				await tx.organization.update({
					where: { id: targetOrgId },
					data: {
						aiCredits: { decrement: amount },
					},
				})

				const transaction = await tx.credit_transactions.create({
					data: {
						organization_id: targetOrgId,
						amount: -amount,
						type: transactionType,
						description,
						payment_status: 'completed',
						metadata: metadata ?? undefined,
					},
				})

				return { transaction, shouldTriggerAlert }
			},
		)

		if (shouldTriggerAlert) {
			await BillingService.sendLowBalanceAlert(targetOrgId)
		}

		return transaction
	}

	static async getTransactions(appId: string) {
		const targetAppId = await resolveAppId(appId)
		if (!targetAppId) throw new Error('Invalid App ID')

		const organization = await prisma.organization.findUnique({
			where: { appId: targetAppId },
			select: { id: true },
		})

		if (!organization) throw new Error('Organization not found')

		const transactions = await prisma.credit_transactions.findMany({
			where: { organization_id: organization.id },
			orderBy: { created_at: 'desc' },
			take: 50,
		})

		return transactions.map((t) => ({
			...t,
			amount: Number(t.amount),
		}))
	}

	static async getOrganizationTransactions(organizationId: string) {
		const targetOrgId = await resolveOrganizationId(organizationId)
		if (!targetOrgId) throw new Error('Invalid Organization ID')

		const transactions = await prisma.credit_transactions.findMany({
			where: { organization_id: targetOrgId },
			orderBy: { created_at: 'desc' },
			take: 50,
		})

		return transactions.map((t) => ({
			...t,
			amount: Number(t.amount),
		}))
	}

	static async topUp(
		appId: string,
		amount: number,
		description = 'Top up credits',
		externalId?: string,
	) {
		const targetAppId = await resolveAppId(appId)
		if (!targetAppId) throw new Error('Invalid App ID')

		const organization = await prisma.organization.findUnique({
			where: { appId: targetAppId },
			select: { id: true },
		})

		if (!organization) throw new Error('Organization not found')

		return BillingService.topUpOrgCredits(
			organization.id,
			amount,
			description,
			externalId,
		)
	}

	static async organizationTopUp(
		organizationId: string,
		amount: number,
		description = 'Top up credits',
		externalId?: string,
	) {
		return BillingService.topUpOrgCredits(
			organizationId,
			amount,
			description,
			externalId,
		)
	}

	static async deductCredits(
		appId: string,
		amount: number,
		description: string,
	) {
		const targetAppId = await resolveAppId(appId)
		if (!targetAppId) throw new Error('Invalid App ID')

		const organization = await prisma.organization.findUnique({
			where: { appId: targetAppId },
			select: { id: true },
		})

		if (!organization) throw new Error('Organization not found')

		return BillingService.deductOrgCredits(organization.id, amount, description)
	}

	static async deductCreditsByModel(
		appId: string,
		modelName: string,
		description: string,
	) {
		const targetAppId = await resolveAppId(appId)
		if (!targetAppId) throw new Error('Invalid App ID')

		const pricing = await prisma.ai_model_pricing.findUnique({
			where: { model_name: modelName, is_active: true },
		})

		if (!pricing) {
			throw new Error(`No pricing found for model: ${modelName}`)
		}

		const cost = Number(pricing.cost_per_request)

		return BillingService.deductCredits(
			appId,
			cost,
			`${description} (${modelName})`,
		)
	}
}
