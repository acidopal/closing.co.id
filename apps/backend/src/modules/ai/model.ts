import { t } from 'elysia'

const ProviderUnion = t.Union([t.Literal('azure'), t.Literal('sumopod')])

export const AIModel = {
	settings: t.Object({
		id: t.String(),
		app_id: t.String(),
		model_name: t.String(),
		temperature: t.Number(),
		max_tokens: t.Number(),
		system_prompt: t.Nullable(t.String()),
		is_active: t.Boolean(),
	}),

	suggestResponse: t.Object({
		suggestion: t.String(),
		confidence: t.Number(),
	}),
} as const

export const AIRequestModel = {
	updateSettings: t.Object({
		ai_mode: t.Optional(
			t.Union([
				t.Literal('assist'),
				t.Literal('hybrid'),
				t.Literal('auto'),
				t.Literal('off'),
			]),
		),
		model_provider: t.Optional(
			t.Union([
				t.Literal('openai'),
				t.Literal('azure'),
				t.Literal('sumopod'),
				t.Literal('local'),
			]),
		),
		model_name: t.Optional(t.String()),
		temperature: t.Optional(t.Number()),
		max_tokens: t.Optional(t.Number()),
		auto_reply_confidence: t.Optional(t.Number()),
		handoff_keywords: t.Optional(t.Array(t.String())),
		response_tone: t.Optional(t.String()),
		supported_languages: t.Optional(t.Array(t.String())),
		auto_detect_language: t.Optional(t.Boolean()),
		use_platform_credentials: t.Optional(t.Boolean()),
		api_key: t.Optional(t.String()),
		api_endpoint: t.Optional(t.String()),
		api_version: t.Optional(t.String()),
		deployment_name: t.Optional(t.String()),
		system_prompt: t.Optional(t.String()),
		is_active: t.Optional(t.Boolean()),
	}),

	ask: t.Object({
		message: t.String(),
		context: t.Optional(t.Array(t.String())),
	}),

	upsertProviderConfig: t.Object({
		base_url: t.String(),
		api_key: t.Optional(t.String()),
		model_name: t.Optional(t.String()),
		api_version: t.Optional(t.String()),
		deployment_name: t.Optional(t.String()),
		temperature: t.Optional(t.Number()),
		max_tokens: t.Optional(t.Number()),
	}),

	setActiveProvider: t.Object({
		provider: ProviderUnion,
	}),
} as const
