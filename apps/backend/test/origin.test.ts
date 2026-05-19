import { afterEach, describe, expect, it } from 'bun:test'
import { buildAllowedOrigins } from '../src/lib/origin'

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
	process.env = { ...ORIGINAL_ENV }
})

describe('origin helpers', () => {
	it('allows the Volara production app by default', () => {
		process.env.NODE_ENV = 'production'
		delete process.env.FRONTEND_URL
		delete process.env.SOCKET_IO_CORS_ORIGIN

		expect(buildAllowedOrigins()).toContain('https://app.volara.chat')
	})
})
