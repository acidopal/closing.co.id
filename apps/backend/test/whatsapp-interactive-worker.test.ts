import { describe, expect, it } from 'bun:test'
import { resolveWhatsAppInteractiveMessage } from '../src/workers/whatsapp-interactive'

describe('resolveWhatsAppInteractiveMessage', () => {
	it('passes through flow interactive payload', () => {
		const resolved = resolveWhatsAppInteractiveMessage({
			messageContent: 'Isi form booking',
			contentAttributes: {
				interactive: {
					type: 'flow',
					body: { text: 'Isi form booking' },
					action: {
						name: 'flow',
						parameters: {
							flow_message_version: '3',
							flow_id: '12345',
							flow_cta: 'Isi Form',
						},
					},
				},
			},
		})

		expect(resolved.type).toBe('interactive')
		expect(resolved.content).toBe('Isi form booking')
		expect(resolved.interactivePayload).toEqual({
			type: 'flow',
			body: { text: 'Isi form booking' },
			action: {
				name: 'flow',
				parameters: {
					flow_message_version: '3',
					flow_id: '12345',
					flow_cta: 'Isi Form',
				},
			},
		})
	})

	it('builds button interactive payload when options <= 3', () => {
		const resolved = resolveWhatsAppInteractiveMessage({
			messageContent: 'Pilih hewan qurban',
			contentAttributes: {
				flow_buttons: ['Sapi', 'Kambing', 'Domba'],
			},
		})

		expect(resolved.type).toBe('interactive')
		expect(resolved.interactivePayload).toMatchObject({
			type: 'button',
			action: {
				buttons: [
					{ reply: { title: 'Sapi' } },
					{ reply: { title: 'Kambing' } },
					{ reply: { title: 'Domba' } },
				],
			},
		})
	})

	it('falls back to text list when options > 3', () => {
		const resolved = resolveWhatsAppInteractiveMessage({
			messageContent: 'Pilih toko',
			contentAttributes: {
				flow_buttons: ['A', 'B', 'C', 'D'],
			},
		})

		expect(resolved.type).toBe('text')
		expect(resolved.content).toContain('1. A')
		expect(resolved.content).toContain('4. D')
	})
})

