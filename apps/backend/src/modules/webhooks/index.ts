import { Elysia } from 'elysia'

import { xenditWebhook } from './xendit'

export const webhooks = new Elysia({ prefix: '/webhooks' }).use(xenditWebhook)
