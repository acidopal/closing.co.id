import type {
	CreateInvoiceRequest,
	Invoice,
	InvoiceStatus,
} from 'xendit-node/invoice/models'

export type XenditInvoiceCreatePayload = CreateInvoiceRequest
export type XenditInvoiceDetails = Invoice
export type XenditInvoiceStatus = InvoiceStatus
