const BUSINESS_KEY_PREFIX = 'dev_api_key:';
const LOOKUP_KEY_PREFIX = 'dev_api_lookup:';
const N8N_COMPAT_PREFIX = '/api/n8n-compat';

const corsHeaders = {
	'access-control-allow-origin': '*',
	'access-control-allow-headers':
		'content-type,authorization,x-business-id,x-app-id,x-app-secret,x-org-slug,x-api-key',
	'access-control-allow-methods': 'GET,OPTIONS',
};

function jsonResponse(payload, status = 200) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			'content-type': 'application/json',
			...corsHeaders,
		},
	});
}

function toNullableString(value) {
	const normalized = String(value || '').trim();
	return normalized || null;
}

function extractApiKey(request) {
	const authHeader = request.headers.get('authorization') || '';
	const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
	const candidate =
		request.headers.get('x-api-key') ||
		request.headers.get('x-app-secret') ||
		(bearerMatch ? bearerMatch[1] : '');
	const apiKey = toNullableString(candidate);
	if (!apiKey || apiKey.length < 16) return null;
	return apiKey;
}

async function sha256Hex(input) {
	const bytes = new TextEncoder().encode(input);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

function parseJsonObject(rawValue) {
	try {
		const parsed = JSON.parse(String(rawValue || ''));
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function decodeBase64UrlJson(value) {
	try {
		const padded = `${value}${'='.repeat((4 - (value.length % 4)) % 4)}`;
		const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
		return parseJsonObject(decoded);
	} catch {
		return null;
	}
}

function getJwtBusinessId(apiKey) {
	const parts = apiKey.split('.');
	if (parts.length !== 3) return null;
	const payload = decodeBase64UrlJson(parts[1] || '');
	return toNullableString(payload?.business_id);
}

function getD1Bindings(env) {
	return ['DB', 'DB_S1', 'DB_S2', 'DB_S3']
		.map((name) => ({ name, db: env?.[name] }))
		.filter((item) => item.db && typeof item.db.prepare === 'function');
}

async function dbFirst(db, query, ...params) {
	return db.prepare(query).bind(...params).first();
}

async function resolveBusinessIdByApiKey(env, apiKey) {
	const apiKeyHash = await sha256Hex(apiKey);
	const lookupKey = `${LOOKUP_KEY_PREFIX}${apiKeyHash}`;
	const businessIdFromJwt = getJwtBusinessId(apiKey);

	for (const { db } of getD1Bindings(env)) {
		const lookup = await dbFirst(
			db,
			`SELECT value FROM platform_settings WHERE key = ? LIMIT 1`,
			lookupKey,
		).catch(() => null);
		const lookupRecord = parseJsonObject(lookup?.value);
		const businessId = toNullableString(lookupRecord?.business_id);
		if (businessId) return { businessId, db };
	}

	if (!businessIdFromJwt) return null;

	const businessKey = `${BUSINESS_KEY_PREFIX}${businessIdFromJwt}`;
	for (const { db } of getD1Bindings(env)) {
		const row = await dbFirst(
			db,
			`SELECT value FROM platform_settings WHERE key = ? LIMIT 1`,
			businessKey,
		).catch(() => null);
		const keyRecord = parseJsonObject(row?.value);
		const storedKey = toNullableString(keyRecord?.api_key);
		if (storedKey && (await sha256Hex(storedKey)) === apiKeyHash) {
			return { businessId: businessIdFromJwt, db };
		}
	}

	return null;
}

async function getWorkspaceProfile(db, businessId) {
	const org = await dbFirst(
		db,
		`SELECT
			o.id,
			o.name,
			o.slug,
			o."appId" AS app_uuid,
			a.app_id,
			u.email
		 FROM organization o
		 LEFT JOIN apps a ON a.id = o."appId"
		 LEFT JOIN member m ON m."organizationId" = o.id
		 LEFT JOIN users u ON u.id = m."userId"
		 WHERE o.id = ? OR lower(COALESCE(o.slug, '')) = lower(?)
		 ORDER BY datetime(COALESCE(m."createdAt", '1970-01-01')) ASC
		 LIMIT 1`,
		businessId,
		businessId,
	).catch(() => null);

	if (org) {
		return {
			id: org.id,
			business_id: org.id,
			business_name: org.name || 'Volara Workspace',
			email: org.email || null,
			slug: org.slug || null,
			app_id: org.app_id || null,
			app_uuid: org.app_uuid || null,
		};
	}

	const app = await dbFirst(
		db,
		`SELECT
			a.id,
			a.app_id,
			a.app_name,
			a.business_name,
			o.id AS organization_id,
			o.name AS organization_name,
			o.slug AS organization_slug,
			u.email
		 FROM apps a
		 LEFT JOIN organization o ON o."appId" = a.id
		 LEFT JOIN member m ON m."organizationId" = o.id
		 LEFT JOIN users u ON u.id = m."userId"
		 WHERE a.id = ? OR lower(COALESCE(a.app_id, '')) = lower(?)
		 ORDER BY datetime(COALESCE(m."createdAt", '1970-01-01')) ASC
		 LIMIT 1`,
		businessId,
		businessId,
	).catch(() => null);

	if (!app) return null;

		return {
		id: app.organization_id || app.id,
		business_id: app.organization_id || app.id,
		business_name:
			app.organization_name || app.business_name || app.app_name || 'Volara Workspace',
		email: app.email || null,
		slug: app.organization_slug || app.app_id || null,
		app_id: app.app_id || null,
		app_uuid: app.id || null,
	};
}

function isTruthy(value) {
	const normalized = String(value ?? '').trim().toLowerCase();
	return normalized === 'true' || normalized === 't' || normalized === '1' || normalized === 'yes';
}

function normalizeChatbotRow(row) {
	return {
		...row,
		is_deleted: isTruthy(row?.is_deleted),
		is_hidden: isTruthy(row?.is_hidden),
		watcher_enabled: isTruthy(row?.watcher_enabled),
	};
}

function latestUserMessageFromBody(body) {
	const directMessage = toNullableString(body?.message);
	if (directMessage) return directMessage;

	const messages = Array.isArray(body?.messages) ? body.messages : [];
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const item = messages[index];
		if (!item || typeof item !== 'object') continue;
		const role = String(item.sent_by_type || item.role || '').trim().toLowerCase();
		if (role && role !== 'user' && role !== 'contact') continue;
		const content = toNullableString(item.message) || toNullableString(item.content);
		if (content) return content;
	}

	return null;
}

function unauthorized() {
	return jsonResponse(
		{
			message: 'Invalid API Key',
			error: 'Unauthorized',
			statusCode: 401,
		},
		401,
	);
}

async function handleUsers(request, env) {
	const apiKey = extractApiKey(request);
	if (!apiKey) return unauthorized();

	const resolved = await resolveBusinessIdByApiKey(env, apiKey);
	if (!resolved) return unauthorized();

	const profile = await getWorkspaceProfile(resolved.db, resolved.businessId);
	if (!profile) return unauthorized();

	return jsonResponse(profile);
}

async function requireApiKeyContext(request, env) {
	const apiKey = extractApiKey(request);
	if (!apiKey) return null;

	const resolved = await resolveBusinessIdByApiKey(env, apiKey);
	if (!resolved) return null;

	const profile = await getWorkspaceProfile(resolved.db, resolved.businessId);
	if (!profile?.app_uuid) return null;

	return {
		db: resolved.db,
		businessId: resolved.businessId,
		profile,
		appUuid: profile.app_uuid,
	};
}

async function handleChatbotsList(request, env) {
	const context = await requireApiKeyContext(request, env);
	if (!context) return unauthorized();

	const rows = await context.db
		.prepare(
			`SELECT *
			 FROM chatbots
			 WHERE app_id = ?
				AND COALESCE(is_deleted, 'f') != 't'
			 ORDER BY datetime(COALESCE(created_at, '1970-01-01')) DESC`,
		)
		.bind(context.appUuid)
		.all()
		.then((result) => result?.results || [])
		.catch(() => []);

	return jsonResponse({
		data: rows.map((row) => normalizeChatbotRow(row)).filter((row) => !row.is_deleted),
	});
}

async function handleChatbotSimulate(request, env, chatbotId) {
	const context = await requireApiKeyContext(request, env);
	if (!context) return unauthorized();

	const chatbot = await dbFirst(
		context.db,
		`SELECT *
		 FROM chatbots
		 WHERE id = ?
			AND app_id = ?
		 LIMIT 1`,
		chatbotId,
		context.appUuid,
	).catch(() => null);
	if (!chatbot || isTruthy(chatbot.is_deleted)) {
		return jsonResponse({ error: 'Chatbot not found' }, 404);
	}

	const body = await request.json().catch(() => ({}));
	const message = latestUserMessageFromBody(body);
	if (!message) return jsonResponse({ error: 'Message is required' }, 400);

	const assistantReply = `Simulation (${toNullableString(chatbot.name) || 'AI Agent'}): ${message}`;
	return jsonResponse({
		messages: [
			{
				role: 'system',
				content: 'Simulation mode active',
			},
			{
				role: 'assistant',
				content: assistantReply,
				credits_used: 0,
			},
		],
		data: assistantReply,
		meta: {
			tools_called: 0,
			credits_used: 0,
		},
		preview: {
			timeline: [
				{
					type: 'status',
					text: 'Simulation mode active',
				},
				{
					type: 'text',
					content: assistantReply,
				},
			],
			credits_used: 0,
		},
	});
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname.replace(/\/+$/, '') || '/';
		const method = request.method.toUpperCase();

		if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

		if (method === 'GET' && path === '/api/scalebiz/users') {
			return handleUsers(request, env);
		}

		if (method === 'GET' && path === `${N8N_COMPAT_PREFIX}/chatbots`) {
			return handleChatbotsList(request, env);
		}

		const chatbotSimulateMatch = path.match(
			new RegExp(`^${N8N_COMPAT_PREFIX}/chatbots/([^/]+)/simulate$`),
		);
		if (method === 'POST' && chatbotSimulateMatch) {
			return handleChatbotSimulate(request, env, decodeURIComponent(chatbotSimulateMatch[1]));
		}

		return jsonResponse({ error: 'not-found', path }, 404);
	},
};
