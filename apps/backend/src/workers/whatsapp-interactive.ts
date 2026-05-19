function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
	return value as Record<string, unknown>
}

function normalizeFlowButtonOptions(contentAttributes: Record<string, unknown>): string[] {
	const options = Array.isArray(contentAttributes.flow_buttons)
		? contentAttributes.flow_buttons
		: Array.isArray(contentAttributes.buttons)
			? contentAttributes.buttons
			: []
	return options
		.map((item) => String(item || '').trim())
		.filter((item) => item.length > 0)
		.slice(0, 10)
}

function buildButtonsFallbackText(messageText: string, options: string[]): string {
	return [
		messageText.trim() || 'Please choose one option:',
		'',
		...options.map((option, index) => `${index + 1}. ${option}`),
	]
		.filter((line) => line.trim().length > 0)
		.join('\n')
}

export function resolveWhatsAppInteractiveMessage(params: {
	messageContent: string
	contentAttributes: Record<string, unknown>
}):
	| {
			type: 'text'
			content: string
			interactivePayload?: undefined
	  }
	| {
			type: 'interactive'
			content: string
			interactivePayload: Record<string, unknown>
	  } {
	const fromAttributesInteractive = asRecord(params.contentAttributes.interactive)
	const interactiveType = String(fromAttributesInteractive.type || '')
		.trim()
		.toLowerCase()

	if (interactiveType === 'flow') {
		return {
			type: 'interactive',
			content: String(
				asRecord(fromAttributesInteractive.body).text ||
					params.messageContent ||
					'Silakan isi form berikut untuk melanjutkan.',
			).trim(),
			interactivePayload: fromAttributesInteractive,
		}
	}

	const options = normalizeFlowButtonOptions(params.contentAttributes)
	const actionRecord = asRecord(fromAttributesInteractive.action)
	const nativeButtons = Array.isArray(actionRecord.buttons)
		? actionRecord.buttons
				.map((button) => {
					const reply = asRecord(asRecord(button).reply)
					const title = String(reply.title || '').trim()
					return title.length > 0 ? title : null
				})
				.filter((value): value is string => Boolean(value))
		: []
	const resolvedButtons = nativeButtons.length > 0 ? nativeButtons : options

	if (resolvedButtons.length === 0) {
		return {
			type: 'text',
			content: params.messageContent,
		}
	}

	if (resolvedButtons.length > 3) {
		return {
			type: 'text',
			content: buildButtonsFallbackText(params.messageContent, resolvedButtons),
		}
	}

	const bodyText = String(
		asRecord(fromAttributesInteractive.body).text ||
			params.messageContent ||
			'Please choose one option:',
	).trim()
	const interactivePayload: Record<string, unknown> = {
		type: 'button',
		body: {
			text: bodyText || 'Please choose one option:',
		},
		action: {
			buttons: resolvedButtons.map((label, index) => ({
				type: 'reply',
				reply: {
					id: `flow_btn_${index + 1}`,
					title: label.slice(0, 20),
				},
			})),
		},
	}

	const mediaUrl = String(
		params.contentAttributes.media_url ||
			asRecord(params.contentAttributes.media).url ||
			asRecord(params.contentAttributes.media).mediaUrl ||
			'',
	).trim()
	if (mediaUrl) {
		interactivePayload.header = {
			type: 'image',
			image: { link: mediaUrl },
		}
	}

	return {
		type: 'interactive',
		content: params.messageContent,
		interactivePayload,
	}
}

