import fs from 'fs'
import path from 'path'
import { chromium, devices } from 'playwright'

const BASE_URL = 'http://localhost:3005'
const EVIDENCE_DIR = path.join('.sisyphus', 'evidence')
const STORAGE_SEED = {
	scalechat_token: 'qa-token',
	scalechat_refresh_token: 'qa-refresh-token',
	scalechat_user: JSON.stringify({
		user: {
			id: 'qa-user',
			email: 'qa-admin@scalechat.local',
			role: 'owner',
			name: 'QA Admin',
		},
	}),
	scalechat_org_id: 'org-qa',
	scalechat_org_slug: 'org-qa',
	scalechat_org_name: 'QA Organization',
	scalechat_app_id: 'app-qa',
	scalechat_app_secret: 'secret-qa',
	scalechat_app_slug: 'org-qa',
}

const ROUTES = [
	{
		name: 'developers-overview',
		path: '/developers',
		verify: async (page) => {
			await page.waitForSelector('[data-testid="api-keys-accordion"]', {
				timeout: 10000,
			})
			await page.waitForSelector('[data-testid="developers-subnav-api-tools"]')
			await page.waitForSelector(
				'[data-testid="developers-subnav-messages-sent-by-api"]',
			)
			await page.click('[data-testid="api-keys-accordion"]')
			await page.waitForSelector('text=Copy key', { timeout: 5000 })
		},
	},
	{
		name: 'api-tools',
		path: '/developers/api-tools',
		verify: async (page) => {
			await page.waitForSelector('[data-testid="api-tools-page-title"]')
			await page.waitForSelector('[data-testid="api-tools-cards-grid"]')
			await page.click('[data-testid="api-tools-back-button"]')
			await page.waitForURL('**/developers')
			await page.goto(`${BASE_URL}/developers/api-tools`, {
				waitUntil: 'domcontentloaded',
			})
			await page.waitForSelector('[data-testid="api-tools-page-title"]')
		},
	},
	{
		name: 'api-tools-new',
		path: '/developers/api-tools/new',
		verify: async (page) => {
			await page.waitForSelector('[data-testid="api-tools-new-shell"]')
			await page.waitForSelector('[data-testid="api-tools-new-form-panel"]')
			await page.click('[data-testid="api-tools-new-back-button"]')
			await page.waitForURL('**/developers/api-tools')
		},
	},
	{
		name: 'messages-api',
		path: '/developers/messages-sent-by-api',
		verify: async (page) => {
			await page.waitForSelector('[data-testid="messages-api-table-shell"]')
			await page.waitForSelector('[data-testid="messages-api-table"] tr')
			await page.waitForSelector('[data-testid="messages-api-export-action"]')
			await page.click('[data-testid="messages-api-back-button"]')
			await page.waitForURL('**/developers')
			await page.goto(`${BASE_URL}/developers/messages-sent-by-api`, {
				waitUntil: 'domcontentloaded',
			})
			await page.waitForSelector('[data-testid="messages-api-table"]')
		},
	},
]

const CONTEXTS = [
	{
		label: 'desktop',
		options: {
			viewport: { width: 1280, height: 820 },
			deviceScaleFactor: 1,
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
		},
	},
	{
		label: 'mobile',
		options: {
			...devices['iPhone 13'],
			viewport: devices['iPhone 13'].viewport,
			isMobile: true,
			hasTouch: true,
		},
	},
]

async function ensureEvidenceDirectory() {
	if (!fs.existsSync(EVIDENCE_DIR)) {
		await fs.promises.mkdir(EVIDENCE_DIR, { recursive: true })
	}
}

async function seedStorage(context) {
	await context.addInitScript((entries) => {
		for (const [key, value] of Object.entries(entries)) {
			window.localStorage.setItem(key, value)
		}
	}, STORAGE_SEED)
}

async function runVerification() {
	await ensureEvidenceDirectory()
	const browser = await chromium.launch()

	for (const contextConfig of CONTEXTS) {
		const context = await browser.newContext(contextConfig.options)
		await seedStorage(context)
		const page = await context.newPage()

		for (const route of ROUTES) {
			console.log(
				`Visiting \`${route.path}\` on ${contextConfig.label} viewport and checking selectors...`,
			)
			await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' })
			await route.verify(page)
			const screenshotPath = path.join(
				EVIDENCE_DIR,
				`${route.name}-${contextConfig.label}.png`,
			)
			await page.screenshot({ path: screenshotPath, fullPage: true })
			if (route.name === 'messages-api' && contextConfig.label === 'mobile') {
				const table = page.locator('[data-testid="messages-api-table"]')
				const metrics = await table.evaluate((el) => ({
					scrollWidth: el.scrollWidth,
					clientWidth: el.clientWidth,
				}))
				if (metrics.scrollWidth > metrics.clientWidth) {
					console.log(
						'Table remains scrollable on mobile (scrollWidth > clientWidth).',
					)
				}
			}
		}

		await context.close()
	}

	await browser.close()
}

runVerification()
	.then(() => {
		console.log('Playwright QA completed successfully.')
		process.exit(0)
	})
	.catch((error) => {
		console.error('Playwright QA failed:', error)
		process.exit(1)
	})
