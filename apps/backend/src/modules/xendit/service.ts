import Xendit, { type XenditOpts } from 'xendit-node'
import type { InvoiceApi } from 'xendit-node/invoice/apis'
import type { XenditInvoiceCreatePayload, XenditInvoiceDetails } from './model'

const REQUIRED_SECRET_KEY = 'XENDIT_SECRET_KEY'

export abstract class XenditService {
	private static invoiceClient: InvoiceApi | null = null

	static getClient(): InvoiceApi {
		if (this.invoiceClient) return this.invoiceClient

		const rawSecret = process.env[REQUIRED_SECRET_KEY]
		if (!rawSecret || !rawSecret.trim()) {
			throw new Error(
				`Missing ${REQUIRED_SECRET_KEY} environment variable required for Xendit integration`,
			)
		}

		const xenditOptions: XenditOpts = {
			secretKey: rawSecret.trim(),
		}

		const overrideUrl = process.env.XENDIT_URL ?? process.env.XENDIT_API_URL
		if (overrideUrl && overrideUrl.trim()) {
			xenditOptions.xenditURL = overrideUrl.trim()
		}

		this.invoiceClient = new Xendit(xenditOptions).Invoice
		return this.invoiceClient
	}

	static async createInvoice(
		data: XenditInvoiceCreatePayload,
	): Promise<XenditInvoiceDetails> {
		const client = this.getClient()

		try {
			return await client.createInvoice({ data })
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: typeof error === 'string'
						? error
						: 'Unknown Xendit error'

			throw new Error(`Failed to create Xendit invoice: ${message}`)
		}
	}

	static async getInvoice(externalId: string): Promise<XenditInvoiceDetails> {
		if (!externalId || !externalId.trim()) {
			throw new Error('externalId is required to fetch Xendit invoice')
		}

		const normalizedId = externalId.trim()
		const client = this.getClient()

		try {
			const invoices = await client.getInvoices({ externalId: normalizedId })
			const matched = invoices?.[0]
			if (!matched) {
				throw new Error(`No invoice found for externalId ${normalizedId}`)
			}

			return matched
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: typeof error === 'string'
						? error
						: 'Unknown Xendit error'

			throw new Error(`Failed to fetch Xendit invoice: ${message}`)
		}
	}

	static verifyWebhookSignature(payload: string, signature: string): boolean {
		if (!signature || typeof signature !== 'string') return false
		const normalizedSignature = signature.trim()
		if (!normalizedSignature) return false

		const tokens: string[] = []
		const callbackToken = process.env.XENDIT_CALLBACK_TOKEN?.trim()
		const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN?.trim()

		if (callbackToken) tokens.push(callbackToken)
		if (webhookToken && webhookToken !== callbackToken)
			tokens.push(webhookToken)

		if (tokens.length === 0) {
			return false
		}

		return tokens.some((token) => token === normalizedSignature)
	}
}
