import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const root = process.cwd()
const baseUrl = 'https://api.volara.chat'
const generatedAt = new Date().toISOString()

const methodNames = ['get', 'post', 'put', 'patch', 'delete', 'options']
const methodRe = /\.(get|post|put|patch|delete|options)\s*\(/g

const mounts = [
	{ file: 'apps/backend/src/modules/auth/index.ts', bases: ['/api'] },
	{ file: 'apps/backend/src/modules/organization.ts', bases: ['/api'] },
	{
		file: 'apps/backend/src/modules/user/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/conversation/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/message/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/contact/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/customer/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/whatsapp/index.ts',
		bases: [
			'/api/whatsapp-channels',
			'/api/v1/whatsapp-channels',
			'/api/whatsapp',
		],
	},
	{
		file: 'apps/backend/src/modules/waba/index.ts',
		bases: ['/api/waba', '/api/v1/waba'],
	},
	{
		file: 'apps/backend/src/modules/instagram/index.ts',
		bases: ['/api/instagram-channels', '/api/v1/instagram-channels'],
	},
	{
		file: 'apps/backend/src/modules/tiktok/index.ts',
		bases: ['/api/tiktok-channels', '/api/v1/tiktok-channels'],
	},
	{
		file: 'apps/backend/src/modules/webhook/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/business-webhooks/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/webhooks/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/media/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{ file: 'apps/backend/src/modules/ai/index.ts', bases: ['/api', '/api/v1'] },
	{
		file: 'apps/backend/src/modules/api-tools/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/chatbot/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/knowledge/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/flow/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/orchestration/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{ file: 'apps/backend/src/modules/crm/index.ts', bases: ['/api', '/api/v1'] },
	{
		file: 'apps/backend/src/modules/team/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/inbox/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/agent/index.ts',
		bases: [
			'/api/agents-management',
			'/api/agents',
			'/api/v1/agents-management',
			'/api/v1/agents',
		],
	},
	{
		file: 'apps/backend/src/modules/label/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/broadcast/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/auto-assign/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/form/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/metrics/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/orders/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/tickets/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/super-admin/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/admin/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/app-center/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/meta-ads/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/canned-response/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/agent-settings/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/whatsapp-templates/index.ts',
		bases: ['/api', '/api/v1', '/api/whatsapp'],
	},
	{
		file: 'apps/backend/src/modules/template-variables/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{
		file: 'apps/backend/src/modules/billing/index.ts',
		bases: ['/api', '/api/v1'],
	},
	{ file: 'apps/backend/src/modules/developer-keys/index.ts', bases: ['/api'] },
	{
		file: 'apps/backend/src/modules/scalebiz-compat/index.ts',
		bases: ['/api'],
	},
	{ file: 'apps/backend/src/modules/n8n/index.ts', bases: ['/api', '/api/v1'] },
]

const manualRoutes = [
	{
		method: 'GET',
		path: '/',
		summary: 'Service metadata',
		tag: 'System',
		headers: 'None',
	},
	{
		method: 'GET',
		path: '/health',
		summary: 'Worker health check',
		tag: 'System',
		headers: 'None',
	},
	{
		method: 'GET',
		path: '/api/health',
		summary: 'API health check',
		tag: 'System',
		headers: 'None',
	},
	{
		method: 'POST',
		path: '/auth/sign-in/email',
		summary: 'Better Auth email/password sign in',
		tag: 'Better Auth',
		headers: 'Content-Type: application/json',
		bodyExample: { email: 'user@example.com', password: 'password' },
		bodyFields: [
			{
				name: 'email',
				type: 'string',
				required: true,
				example: 'user@example.com',
			},
			{ name: 'password', type: 'string', required: true, example: 'password' },
		],
	},
	{
		method: 'POST',
		path: '/auth/sign-up/email',
		summary: 'Better Auth email/password registration',
		tag: 'Better Auth',
		headers: 'Content-Type: application/json',
		bodyExample: {
			email: 'user@example.com',
			password: 'password',
			name: 'User Name',
		},
		bodyFields: [
			{
				name: 'email',
				type: 'string',
				required: true,
				example: 'user@example.com',
			},
			{ name: 'password', type: 'string', required: true, example: 'password' },
			{ name: 'name', type: 'string', required: false, example: 'User Name' },
		],
	},
	{
		method: 'GET',
		path: '/auth/session',
		summary: 'Read active Better Auth session',
		tag: 'Better Auth',
		headers: 'Cookie session or Authorization: Bearer <token>',
	},
	{
		method: 'POST',
		path: '/auth/sign-out',
		summary: 'Sign out active Better Auth session',
		tag: 'Better Auth',
		headers: 'Cookie session or Authorization: Bearer <token>',
	},
	{
		method: 'GET',
		path: '/api/ai-settings',
		summary: 'Compatibility endpoint for AI settings',
		tag: 'Compatibility',
		headers: 'Authorization: Bearer <token>; x-org-slug or x-app-id',
		queryFields: [
			{
				name: 'appId',
				type: 'string',
				required: false,
				example: 'org-slug-or-app-id',
			},
		],
	},
	{
		method: 'PUT',
		path: '/api/ai-settings',
		summary: 'Update AI settings compatibility endpoint',
		tag: 'Compatibility',
		headers:
			'Content-Type: application/json; Authorization: Bearer <token>; x-org-slug or x-app-id',
		bodyExample: {
			model_provider: 'openai',
			model_name: 'gpt-4o-mini',
			temperature: 0.7,
			max_tokens: 500,
		},
		bodyFields: [
			{
				name: 'model_provider',
				type: 'string',
				required: false,
				example: 'openai',
			},
			{
				name: 'model_name',
				type: 'string',
				required: false,
				example: 'gpt-4o-mini',
			},
			{ name: 'temperature', type: 'number', required: false, example: 0.7 },
			{ name: 'max_tokens', type: 'number', required: false, example: 500 },
		],
	},
	{
		method: 'GET',
		path: '/api/ai-providers',
		summary: 'List configured AI providers',
		tag: 'Compatibility',
		headers: 'Authorization: Bearer <token>; x-org-slug or x-app-id',
	},
	{
		method: 'PUT',
		path: '/api/ai-providers/{provider}',
		summary: 'Upsert provider configuration',
		tag: 'Compatibility',
		headers:
			'Content-Type: application/json; Authorization: Bearer <token>; x-org-slug or x-app-id',
		paramsFields: [
			{ name: 'provider', type: 'string', required: true, example: 'openai' },
		],
		bodyExample: {
			api_key: 'sk-...',
			base_url: 'https://api.openai.com/v1',
			model_name: 'gpt-4o-mini',
		},
		bodyFields: [
			{ name: 'api_key', type: 'string', required: false, example: 'sk-...' },
			{
				name: 'base_url',
				type: 'string',
				required: false,
				example: 'https://api.openai.com/v1',
			},
			{
				name: 'model_name',
				type: 'string',
				required: false,
				example: 'gpt-4o-mini',
			},
		],
	},
	{
		method: 'PATCH',
		path: '/api/ai-providers/active',
		summary: 'Set active AI provider',
		tag: 'Compatibility',
		headers:
			'Content-Type: application/json; Authorization: Bearer <token>; x-org-slug or x-app-id',
		bodyExample: { provider: 'openai' },
		bodyFields: [
			{ name: 'provider', type: 'string', required: true, example: 'openai' },
		],
	},
]

function lineNumber(text, index) {
	return text.slice(0, index).split('\n').length
}

function stripComments(input) {
	return input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1')
}

function extractBalanced(text, openIndex, open = '(', close = ')') {
	let depth = 0
	let quote = null
	let escaped = false
	for (let i = openIndex; i < text.length; i += 1) {
		const char = text[i]
		if (quote) {
			if (escaped) {
				escaped = false
			} else if (char === '\\') {
				escaped = true
			} else if (char === quote) {
				quote = null
			}
			continue
		}
		if (char === '"' || char === "'" || char === '`') {
			quote = char
			continue
		}
		if (char === open) depth += 1
		if (char === close) depth -= 1
		if (depth === 0) return text.slice(openIndex + 1, i)
	}
	return ''
}

function splitTopLevel(input) {
	const parts = []
	let start = 0
	let paren = 0
	let brace = 0
	let bracket = 0
	let quote = null
	let escaped = false
	for (let i = 0; i < input.length; i += 1) {
		const char = input[i]
		if (quote) {
			if (escaped) escaped = false
			else if (char === '\\') escaped = true
			else if (char === quote) quote = null
			continue
		}
		if (char === '"' || char === "'" || char === '`') {
			quote = char
			continue
		}
		if (char === '(') paren += 1
		else if (char === ')') paren -= 1
		else if (char === '{') brace += 1
		else if (char === '}') brace -= 1
		else if (char === '[') bracket += 1
		else if (char === ']') bracket -= 1
		else if (char === ',' && paren === 0 && brace === 0 && bracket === 0) {
			parts.push(input.slice(start, i).trim())
			start = i + 1
		}
	}
	const tail = input.slice(start).trim()
	if (tail) parts.push(tail)
	return parts
}

function parseStringLiteral(value) {
	const trimmed = value.trim()
	const quote = trimmed[0]
	if (!['"', "'", '`'].includes(quote)) return null
	const end = trimmed.lastIndexOf(quote)
	if (end <= 0) return null
	return trimmed.slice(1, end)
}

function getPrefix(text) {
	const match = text.match(
		/new\s+Elysia\s*\(\s*\{[\s\S]*?prefix\s*:\s*(['"`])([^'"`]+)\1/,
	)
	return match?.[2] || ''
}

function getTags(text) {
	const match = text.match(/tags\s*:\s*\[([^\]]+)/)
	if (!match) return []
	return [...match[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map((item) => item[1])
}

function getSummary(text, index) {
	const before = text.slice(0, index).split('\n')
	for (let i = before.length - 1; i >= Math.max(0, before.length - 5); i -= 1) {
		const line = before[i].trim()
		if (!line) continue
		const comment = line.match(/^\/\/\s*(.+)$/)
		if (comment) return comment[1].trim()
		if (line.endsWith('*/')) continue
		break
	}
	return ''
}

function findPropertyExpression(config, key) {
	const clean = stripComments(config)
	const index = clean.search(new RegExp(`\\b${key}\\s*:`))
	if (index === -1) return ''
	let pos = clean.indexOf(':', index) + 1
	while (/\s/.test(clean[pos])) pos += 1
	const start = pos
	let paren = 0
	let brace = 0
	let bracket = 0
	let quote = null
	let escaped = false
	for (let i = pos; i < clean.length; i += 1) {
		const char = clean[i]
		if (quote) {
			if (escaped) escaped = false
			else if (char === '\\') escaped = true
			else if (char === quote) quote = null
			continue
		}
		if (char === '"' || char === "'" || char === '`') {
			quote = char
			continue
		}
		if (char === '(') paren += 1
		else if (char === ')') paren -= 1
		else if (char === '{') brace += 1
		else if (char === '}') {
			if (paren === 0 && bracket === 0 && brace === 0)
				return clean.slice(start, i).trim()
			brace -= 1
		} else if (char === '[') bracket += 1
		else if (char === ']') bracket -= 1
		else if (char === ',' && paren === 0 && brace === 0 && bracket === 0) {
			return clean.slice(start, i).trim()
		}
	}
	return clean.slice(start).replace(/}\s*$/, '').trim()
}

function unwrapCall(expr, callName) {
	const idx = expr.indexOf(`${callName}(`)
	if (idx === -1) return expr
	const open = expr.indexOf('(', idx)
	return extractBalanced(expr, open)
}

function unwrapOptional(expr) {
	let value = expr.trim()
	for (const name of ['t.Optional', 't.Nullable']) {
		if (value.startsWith(`${name}(`))
			value = extractBalanced(value, value.indexOf('(')).trim()
	}
	return value
}

function objectBody(expr) {
	const clean = expr.trim()
	const idx = clean.indexOf('t.Object(')
	if (idx === -1) return ''
	const call = unwrapCall(clean.slice(idx), 't.Object')
	const open = call.indexOf('{')
	if (open === -1) return ''
	return extractBalanced(call, open, '{', '}')
}

function arrayInner(expr) {
	const idx = expr.indexOf('t.Array(')
	if (idx === -1) return ''
	return unwrapCall(expr.slice(idx), 't.Array')
}

function inferType(expr) {
	const clean = unwrapOptional(expr)
	if (/t\.String\s*\(/.test(clean)) return 'string'
	if (/t\.(Number|Numeric|Integer)\s*\(/.test(clean)) return 'number'
	if (/t\.Boolean\s*\(/.test(clean)) return 'boolean'
	if (/t\.File\s*\(/.test(clean)) return 'file'
	if (/t\.Array\s*\(/.test(clean)) return `${inferType(arrayInner(clean))}[]`
	if (/t\.Object\s*\(/.test(clean)) return 'object'
	if (/t\.Union\s*\(/.test(clean)) return 'union'
	if (/t\.Literal\s*\(/.test(clean)) return 'literal'
	if (/t\.Any\s*\(/.test(clean)) return 'any'
	return 'unknown'
}

function inferExample(expr) {
	const clean = unwrapOptional(expr)
	const literal = clean.match(/t\.Literal\s*\(\s*(['"`])([^'"`]+)\1/)
	if (literal) return literal[2]
	if (/t\.String\s*\(/.test(clean)) return 'string'
	if (/t\.(Number|Numeric|Integer)\s*\(/.test(clean)) return 0
	if (/t\.Boolean\s*\(/.test(clean)) return true
	if (/t\.File\s*\(/.test(clean)) return '<binary file>'
	if (/t\.Array\s*\(/.test(clean)) return [inferExample(arrayInner(clean))]
	if (/t\.Object\s*\(/.test(clean))
		return fieldsToExample(parseObjectFields(clean))
	if (/t\.Union\s*\(/.test(clean)) {
		const inner = unwrapCall(clean, 't.Union')
		const literalChoice = inner.match(/t\.Literal\s*\(\s*(['"`])([^'"`]+)\1/)
		return literalChoice?.[2] || '<union value>'
	}
	if (/t\.Any\s*\(/.test(clean)) return { key: 'value' }
	return '<value>'
}

function parseObjectFields(expr) {
	const body = objectBody(expr)
	if (!body) return []
	return splitTopLevel(stripComments(body))
		.map((part) => {
			const separator = part.indexOf(':')
			if (separator === -1) return null
			const rawName = part.slice(0, separator).trim()
			const name = rawName.replace(/^['"`]|['"`]$/g, '')
			const schema = part.slice(separator + 1).trim()
			return {
				name,
				type: inferType(schema),
				required: !/t\.Optional\s*\(/.test(schema),
				example: inferExample(schema),
			}
		})
		.filter(Boolean)
}

function fieldsToExample(fields) {
	const example = {}
	for (const field of fields) example[field.name] = field.example
	return example
}

function schemaFromConfig(config, key) {
	const expr = findPropertyExpression(config, key)
	if (!expr) return { raw: '', fields: [], example: undefined }
	if (/t\.Any\s*\(/.test(expr)) {
		return {
			raw: expr,
			fields: [
				{ name: '*', type: 'any', required: false, example: { key: 'value' } },
			],
			example: { key: 'value' },
		}
	}
	const fields = parseObjectFields(expr)
	return {
		raw: expr,
		fields,
		example: fields.length > 0 ? fieldsToExample(fields) : undefined,
	}
}

function normalizePath(path) {
	const replaced = path.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
	if (replaced === '/') return '/'
	return replaced.replace(/\/+/g, '/').replace(/\/$/, '')
}

function joinPaths(...parts) {
	const joined = parts
		.filter((item) => item !== undefined && item !== null && item !== '')
		.join('/')
		.replace(/\/+/g, '/')
	return normalizePath(joined.startsWith('/') ? joined : `/${joined}`)
}

function routeHeaders(route) {
	if (route.headers) return route.headers
	const headers = []
	if (route.bodyFields?.length || route.method !== 'GET')
		headers.push('Content-Type: application/json')
	if (
		route.path.startsWith('/api/business_webhooks') ||
		route.path.startsWith('/api/developer_keys')
	) {
		headers.push('x-business-id: <business-id>')
	}
	if (
		!route.path.startsWith('/health') &&
		!route.path.startsWith('/auth/sign-in') &&
		!route.path.startsWith('/auth/sign-up') &&
		route.path !== '/'
	) {
		headers.push(
			'Authorization: Bearer <token> or x-api-key: <developer-api-key>',
		)
		headers.push('x-org-slug: <organization-slug> or x-app-id: <app-id>')
	}
	return headers.length > 0 ? headers.join('; ') : 'None'
}

function extractRoutesFromFile(file) {
	const text = readFileSync(join(root, file), 'utf8')
	const prefix = getPrefix(text)
	const tags = getTags(text)
	const tag =
		tags[0] || relative(root, file).split('/').slice(-2, -1)[0] || 'API'
	const routes = []
	methodRe.lastIndex = 0
	for (const match of text.matchAll(methodRe)) {
		const method = match[1].toUpperCase()
		if (!methodNames.includes(match[1])) continue
		const openIndex = match.index + match[0].lastIndexOf('(')
		const call = extractBalanced(text, openIndex)
		if (!call) continue
		const args = splitTopLevel(call)
		const routePath = parseStringLiteral(args[0] || '')
		if (!routePath) continue
		const config =
			args.find((arg, index) => index >= 2 && arg.trim().startsWith('{')) || ''
		const params = schemaFromConfig(config, 'params')
		const query = schemaFromConfig(config, 'query')
		const body = schemaFromConfig(config, 'body')
		routes.push({
			method,
			routePath,
			prefix,
			tag,
			summary: getSummary(text, match.index),
			source: `${file}:${lineNumber(text, match.index)}`,
			paramsFields: params.fields,
			queryFields: query.fields,
			bodyFields: body.fields,
			bodyExample: body.example,
			rawSchemas: {
				params: params.raw,
				query: query.raw,
				body: body.raw,
			},
		})
	}
	return routes
}

function loadMountedRoutes() {
	const all = [...manualRoutes]
	for (const mount of mounts) {
		const sourceRoutes = extractRoutesFromFile(mount.file)
		for (const sourceRoute of sourceRoutes) {
			for (const base of mount.bases) {
				all.push({
					...sourceRoute,
					path: joinPaths(base, sourceRoute.prefix, sourceRoute.routePath),
				})
			}
		}
	}
	return all
		.map((route) => ({
			...route,
			path: normalizePath(route.path || route.routePath),
			headers: routeHeaders(route),
		}))
		.filter((route, index, routes) => {
			const key = `${route.method} ${route.path}`
			return (
				routes.findIndex(
					(candidate) => `${candidate.method} ${candidate.path}` === key,
				) === index
			)
		})
		.sort((a, b) => {
			if (a.path === b.path) return a.method.localeCompare(b.method)
			return a.path.localeCompare(b.path)
		})
}

function markdownTable(fields) {
	if (!fields?.length) return '_None._'
	const rows = ['| Field | Type | Required | Example |', '|---|---:|:---:|---|']
	for (const field of fields) {
		rows.push(
			`| \`${field.name}\` | \`${field.type}\` | ${field.required ? 'Yes' : 'No'} | \`${JSON.stringify(field.example)}\` |`,
		)
	}
	return rows.join('\n')
}

function curlExample(route) {
	const url = `${baseUrl}${route.path}`
	const lines = [`curl -X ${route.method} '${url}'`]
	if (route.headers !== 'None') {
		if (/Content-Type/.test(route.headers))
			lines.push(`  -H 'Content-Type: application/json'`)
		if (/Authorization/.test(route.headers))
			lines.push(`  -H 'Authorization: Bearer <token>'`)
		if (/x-api-key/.test(route.headers))
			lines.push(`  -H 'x-api-key: <developer-api-key>'`)
		if (/x-org-slug/.test(route.headers))
			lines.push(`  -H 'x-org-slug: <organization-slug>'`)
		if (/x-business-id/.test(route.headers))
			lines.push(`  -H 'x-business-id: <business-id>'`)
	}
	if (route.bodyExample !== undefined) {
		lines.push(`  --data '${JSON.stringify(route.bodyExample)}'`)
	}
	return `${lines.join(' \\\n')}`
}

function renderMarkdown(routes) {
	const byTag = new Map()
	for (const route of routes) {
		const tag = route.tag || 'API'
		if (!byTag.has(tag)) byTag.set(tag, [])
		byTag.get(tag).push(route)
	}
	const lines = [
		'# Volara API Reference',
		'',
		`Base URL: \`${baseUrl}\``,
		`Generated from backend routes at \`${generatedAt}\`.`,
		'',
		'## Common Headers',
		'',
		'| Header | Required | Used for |',
		'|---|:---:|---|',
		'| `Content-Type: application/json` | For JSON bodies | Request payloads |',
		'| `Authorization: Bearer <token>` | Usually | User/session APIs |',
		'| `x-api-key: <developer-api-key>` | Alternative | Developer/server-to-server APIs |',
		'| `x-org-slug: <organization-slug>` | Recommended | Organization routing |',
		'| `x-business-id: <business-id>` | Some developer endpoints | Business webhook/API key routing |',
		'| `x-app-id: <app-id>` | Legacy fallback | App routing |',
		'| `x-app-secret: <app-secret>` | Legacy fallback | App routing |',
		'| `DNT: 1` | Optional | Browser privacy signal, allowed by CORS |',
		'',
		'## Authentication Quick Start',
		'',
		'```bash',
		`curl '${baseUrl}/auth/sign-in/email' \\`,
		"  -H 'Content-Type: application/json' \\",
		'  --data \'{"email":"user@example.com","password":"password"}\'',
		'```',
		'',
		'Use the returned token as `Authorization: Bearer <token>`. Browser clients may also rely on Better Auth cookies with `credentials: include`.',
		'',
		'## Endpoint Summary',
		'',
		'| Method | Endpoint | Group |',
		'|---|---|---|',
	]
	for (const route of routes) {
		lines.push(
			`| \`${route.method}\` | \`${route.path}\` | ${route.tag || 'API'} |`,
		)
	}
	lines.push('')
	for (const [tag, groupRoutes] of byTag) {
		lines.push(`## ${tag}`, '')
		for (const route of groupRoutes) {
			lines.push(`### ${route.method} ${route.path}`, '')
			if (route.summary) lines.push(`${route.summary}.`, '')
			lines.push(`Full URL: \`${baseUrl}${route.path}\``)
			lines.push(`Headers: \`${route.headers}\``)
			lines.push('')
			if (route.paramsFields?.length) {
				lines.push('Path params:', '', markdownTable(route.paramsFields), '')
			}
			if (route.queryFields?.length) {
				lines.push('Query params:', '', markdownTable(route.queryFields), '')
			}
			if (route.bodyFields?.length) {
				lines.push('Payload:', '', markdownTable(route.bodyFields), '')
			} else {
				lines.push('Payload: _None._', '')
			}
			lines.push('Example:', '', '```bash', curlExample(route), '```', '')
		}
	}
	return `${lines.join('\n')}\n`
}

const routes = loadMountedRoutes()
const markdown = renderMarkdown(routes)
const publicRoutes = routes.map(({ rawSchemas, source, ...route }) => route)

for (const output of [
	'docs/volara-api-reference.md',
	'apps/frontend/public/volara-api-reference.md',
]) {
	const destination = join(root, output)
	mkdirSync(dirname(destination), { recursive: true })
	writeFileSync(destination, markdown, 'utf8')
}

writeFileSync(
	join(root, 'apps/frontend/public/volara-api-reference.json'),
	JSON.stringify(
		{
			baseUrl,
			generatedAt,
			count: routes.length,
			routes: publicRoutes,
		},
		null,
		2,
	),
	'utf8',
)

console.log(`Generated ${routes.length} documented endpoints.`)
