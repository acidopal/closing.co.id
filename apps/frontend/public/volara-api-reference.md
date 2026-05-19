# Volara API Reference

Base URL: `https://api.volara.chat`
Generated from backend routes at `2026-05-12T17:08:07.086Z`.

## Common Headers

| Header | Required | Used for |
|---|:---:|---|
| `Content-Type: application/json` | For JSON bodies | Request payloads |
| `Authorization: Bearer <token>` | Usually | User/session APIs |
| `x-api-key: <developer-api-key>` | Alternative | Developer/server-to-server APIs |
| `x-org-slug: <organization-slug>` | Recommended | Organization routing |
| `x-business-id: <business-id>` | Some developer endpoints | Business webhook/API key routing |
| `x-app-id: <app-id>` | Legacy fallback | App routing |
| `x-app-secret: <app-secret>` | Legacy fallback | App routing |
| `DNT: 1` | Optional | Browser privacy signal, allowed by CORS |

## Authentication Quick Start

```bash
curl 'https://api.volara.chat/auth/sign-in/email' \
  -H 'Content-Type: application/json' \
  --data '{"email":"user@example.com","password":"password"}'
```

Use the returned token as `Authorization: Bearer <token>`. Browser clients may also rely on Better Auth cookies with `credentials: include`.

## Endpoint Summary

| Method | Endpoint | Group |
|---|---|---|
| `GET` | `/` | System |
| `GET` | `/api/admin/billing/organizations` | Admin |
| `GET` | `/api/admin/billing/organizations/{id}/balance` | Admin |
| `POST` | `/api/admin/billing/organizations/{id}/credits` | Admin |
| `GET` | `/api/admin/billing/organizations/{id}/transactions` | Admin |
| `GET` | `/api/admin/billing/pricing` | Admin |
| `POST` | `/api/admin/billing/pricing` | Admin |
| `DELETE` | `/api/admin/billing/pricing/{id}` | Admin |
| `PUT` | `/api/admin/billing/pricing/{id}` | Admin |
| `POST` | `/api/admin/queues/{name}/retry` | Admin |
| `GET` | `/api/admin/queues/stats` | Admin |
| `GET` | `/api/agent-settings` | Admin |
| `PUT` | `/api/agent-settings` | Admin |
| `GET` | `/api/agents` | User |
| `POST` | `/api/agents` | User |
| `GET` | `/api/agents-management` | User |
| `POST` | `/api/agents-management` | User |
| `DELETE` | `/api/agents-management/{id}` | User |
| `PATCH` | `/api/agents-management/{id}` | User |
| `PUT` | `/api/agents-management/{id}` | User |
| `GET` | `/api/agents-management/divisions` | User |
| `POST` | `/api/agents-management/divisions` | User |
| `DELETE` | `/api/agents-management/divisions/{id}` | User |
| `PUT` | `/api/agents-management/divisions/{id}` | User |
| `GET` | `/api/agents-management/login-link` | User |
| `DELETE` | `/api/agents/{id}` | User |
| `PATCH` | `/api/agents/{id}` | User |
| `PUT` | `/api/agents/{id}` | User |
| `GET` | `/api/agents/divisions` | User |
| `POST` | `/api/agents/divisions` | User |
| `DELETE` | `/api/agents/divisions/{id}` | User |
| `PUT` | `/api/agents/divisions/{id}` | User |
| `GET` | `/api/agents/login-link` | User |
| `GET` | `/api/ai_tools` | API Tools |
| `POST` | `/api/ai_tools` | API Tools |
| `PUT` | `/api/ai_tools` | API Tools |
| `DELETE` | `/api/ai_tools/{id}` | API Tools |
| `PATCH` | `/api/ai_tools/{id}` | API Tools |
| `POST` | `/api/ai_tools/execute` | API Tools |
| `GET` | `/api/ai-providers` | Compatibility |
| `PUT` | `/api/ai-providers/{provider}` | Compatibility |
| `PATCH` | `/api/ai-providers/active` | Compatibility |
| `GET` | `/api/ai-settings` | Compatibility |
| `PUT` | `/api/ai-settings` | Compatibility |
| `POST` | `/api/ai/evaluate` | AI |
| `POST` | `/api/ai/generate` | AI |
| `GET` | `/api/ai/providers` | AI |
| `PUT` | `/api/ai/providers/{provider}` | AI |
| `PATCH` | `/api/ai/providers/active` | AI |
| `GET` | `/api/ai/settings` | AI |
| `PATCH` | `/api/ai/settings` | AI |
| `GET` | `/api/ai/suggest/{conversationId}` | AI |
| `GET` | `/api/app-center/apps` | Admin |
| `GET` | `/api/app-center/apps/{id}` | Admin |
| `GET` | `/api/app-center/categories` | Admin |
| `POST` | `/api/app-center/install` | Admin |
| `GET` | `/api/app-center/installed` | Admin |
| `POST` | `/api/auth/login` | Authority |
| `POST` | `/api/auth/logout` | Authority |
| `GET` | `/api/auth/me` | Authority |
| `GET` | `/api/auto-assign/rules` | Advanced |
| `POST` | `/api/auto-assign/rules` | Advanced |
| `DELETE` | `/api/auto-assign/rules/{id}` | Advanced |
| `PATCH` | `/api/auto-assign/rules/{id}` | Advanced |
| `GET` | `/api/auto-assign/sla` | Advanced |
| `POST` | `/api/auto-assign/sla` | Advanced |
| `DELETE` | `/api/auto-assign/sla/{id}` | Advanced |
| `GET` | `/api/auto-assign/sla/breaches` | Advanced |
| `GET` | `/api/billing/balance` | Billing |
| `GET` | `/api/billing/packages` | Billing |
| `POST` | `/api/billing/top-up` | Billing |
| `POST` | `/api/billing/top-up/create-invoice` | Billing |
| `GET` | `/api/billing/transactions` | Billing |
| `GET` | `/api/broadcasts` | Broadcast |
| `POST` | `/api/broadcasts` | Broadcast |
| `GET` | `/api/broadcasts/{id}` | Broadcast |
| `POST` | `/api/broadcasts/{id}/send` | Broadcast |
| `GET` | `/api/broadcasts/jobs` | Broadcast |
| `GET` | `/api/broadcasts/jobs/{id}` | Broadcast |
| `GET` | `/api/business_webhooks` | Business Webhooks |
| `POST` | `/api/business_webhooks` | Business Webhooks |
| `DELETE` | `/api/business_webhooks/{id}` | Business Webhooks |
| `PATCH` | `/api/business_webhooks/{id}` | Business Webhooks |
| `GET` | `/api/canned-responses` | Message |
| `POST` | `/api/canned-responses` | Message |
| `DELETE` | `/api/canned-responses/{id}` | Message |
| `GET` | `/api/chatbots` | Chatbot |
| `POST` | `/api/chatbots` | Chatbot |
| `DELETE` | `/api/chatbots/{id}` | Chatbot |
| `GET` | `/api/chatbots/{id}` | Chatbot |
| `PATCH` | `/api/chatbots/{id}` | Chatbot |
| `PUT` | `/api/chatbots/{id}` | Chatbot |
| `GET` | `/api/chatbots/{id}/documents` | Chatbot |
| `POST` | `/api/chatbots/{id}/documents` | Chatbot |
| `DELETE` | `/api/chatbots/{id}/documents/{docId}` | Chatbot |
| `PATCH` | `/api/chatbots/{id}/documents/{docId}` | Chatbot |
| `POST` | `/api/chatbots/{id}/simulate` | Chatbot |
| `GET` | `/api/chatbots/model-pricing` | Chatbot |
| `GET` | `/api/contacts` | Contact |
| `POST` | `/api/contacts` | Contact |
| `DELETE` | `/api/contacts/{id}` | Contact |
| `GET` | `/api/contacts/{id}` | Contact |
| `PATCH` | `/api/contacts/{id}` | Contact |
| `GET` | `/api/contacts/{id}/conversations` | Contact |
| `GET` | `/api/contacts/settings` | Contact |
| `POST` | `/api/contacts/settings/fields` | Contact |
| `DELETE` | `/api/contacts/settings/fields/{id}` | Contact |
| `PATCH` | `/api/contacts/settings/fields/{id}` | Contact |
| `PATCH` | `/api/contacts/settings/fields/reorder` | Contact |
| `POST` | `/api/contacts/settings/stages` | Contact |
| `DELETE` | `/api/contacts/settings/stages/{id}` | Contact |
| `PATCH` | `/api/contacts/settings/stages/{id}` | Contact |
| `PATCH` | `/api/contacts/settings/stages/reorder` | Contact |
| `GET` | `/api/conversations` | Conversation |
| `GET` | `/api/conversations/{id}` | Conversation |
| `GET` | `/api/conversations/{id}/activity` | Conversation |
| `GET` | `/api/conversations/{id}/agents` | Conversation |
| `POST` | `/api/conversations/{id}/agents` | Conversation |
| `DELETE` | `/api/conversations/{id}/agents/{agentId}` | Conversation |
| `POST` | `/api/conversations/{id}/assign` | Conversation |
| `GET` | `/api/conversations/{id}/labels` | Conversation |
| `POST` | `/api/conversations/{id}/labels` | Conversation |
| `DELETE` | `/api/conversations/{id}/labels/{labelId}` | Conversation |
| `GET` | `/api/conversations/{id}/messages` | Conversation |
| `POST` | `/api/conversations/{id}/messages` | Conversation |
| `GET` | `/api/conversations/{id}/notes` | Conversation |
| `POST` | `/api/conversations/{id}/notes` | Conversation |
| `PATCH` | `/api/conversations/{id}/notes/{noteId}` | Conversation |
| `POST` | `/api/conversations/{id}/read` | Conversation |
| `POST` | `/api/conversations/{id}/resolve` | Conversation |
| `PATCH` | `/api/conversations/{id}/status` | Conversation |
| `POST` | `/api/conversations/{id}/status` | Conversation |
| `POST` | `/api/conversations/{id}/takeover` | Conversation |
| `POST` | `/api/conversations/bulk-edit` | Conversation |
| `GET` | `/api/conversations/bulk-edit/{jobId}` | Conversation |
| `GET` | `/api/conversations/counts` | Conversation |
| `GET` | `/api/crm/deals/{conversationId}` | CRM |
| `PATCH` | `/api/crm/deals/{conversationId}` | CRM |
| `GET` | `/api/crm/pipelines` | CRM |
| `POST` | `/api/crm/pipelines` | CRM |
| `DELETE` | `/api/crm/pipelines/{id}` | CRM |
| `GET` | `/api/customers` | Customer |
| `GET` | `/api/customers/{id}` | Customer |
| `PUT` | `/api/customers/{id}` | Customer |
| `POST` | `/api/customers/{id}/tags` | Customer |
| `DELETE` | `/api/customers/{id}/tags/{tagId}` | Customer |
| `GET` | `/api/customers/stats` | Customer |
| `GET` | `/api/developer_keys` | Developer Keys |
| `POST` | `/api/developer_keys/regenerate` | Developer Keys |
| `GET` | `/api/flows` | Flow |
| `POST` | `/api/flows` | Flow |
| `DELETE` | `/api/flows/{id}` | Flow |
| `GET` | `/api/flows/{id}` | Flow |
| `PATCH` | `/api/flows/{id}` | Flow |
| `GET` | `/api/forms` | Advanced |
| `POST` | `/api/forms` | Advanced |
| `GET` | `/api/forms/{id}` | Advanced |
| `GET` | `/api/forms/conversation/{id}` | Advanced |
| `POST` | `/api/forms/conversation/{id}/extract` | Advanced |
| `GET` | `/api/health` | System |
| `GET` | `/api/inboxes` | Inbox |
| `POST` | `/api/inboxes` | Inbox |
| `DELETE` | `/api/inboxes/{id}` | Inbox |
| `GET` | `/api/inboxes/{id}` | Inbox |
| `PATCH` | `/api/inboxes/{id}` | Inbox |
| `GET` | `/api/instagram-channels` | Instagram |
| `DELETE` | `/api/instagram-channels/{id}` | Instagram |
| `GET` | `/api/instagram-channels/{id}/status` | Instagram |
| `GET` | `/api/instagram-channels/callback` | Instagram |
| `POST` | `/api/instagram-channels/callback` | Instagram |
| `POST` | `/api/instagram-channels/init-login` | Instagram |
| `GET` | `/api/knowledge/categories` | Knowledge |
| `POST` | `/api/knowledge/categories` | Knowledge |
| `DELETE` | `/api/knowledge/categories/{id}` | Knowledge |
| `GET` | `/api/knowledge/faqs` | Knowledge |
| `POST` | `/api/knowledge/faqs` | Knowledge |
| `DELETE` | `/api/knowledge/faqs/{id}` | Knowledge |
| `PATCH` | `/api/knowledge/faqs/{id}` | Knowledge |
| `GET` | `/api/knowledge/sources` | Knowledge |
| `GET` | `/api/knowledge/stats` | Knowledge |
| `GET` | `/api/labels` | Label |
| `POST` | `/api/labels` | Label |
| `DELETE` | `/api/labels/{id}` | Label |
| `PATCH` | `/api/labels/{id}` | Label |
| `GET` | `/api/labels/conversation/{id}` | Label |
| `POST` | `/api/labels/conversation/{id}` | Label |
| `DELETE` | `/api/labels/conversation/{id}/{labelId}` | Label |
| `GET` | `/api/media/gallery` | Media |
| `POST` | `/api/media/upload` | Media |
| `POST` | `/api/messages` | Message |
| `DELETE` | `/api/messages/{id}` | Message |
| `GET` | `/api/messages/{id}` | Message |
| `PATCH` | `/api/messages/{id}/status` | Message |
| `GET` | `/api/meta-ads/accounts` | Admin |
| `GET` | `/api/meta-ads/campaigns` | Admin |
| `GET` | `/api/meta-ads/ctwa/config` | Admin |
| `PUT` | `/api/meta-ads/ctwa/config` | Admin |
| `GET` | `/api/meta-ads/ctwa/observability/{conversationId}` | Admin |
| `POST` | `/api/meta-ads/ctwa/simulate` | Admin |
| `GET` | `/api/meta-ads/insights/summary` | Admin |
| `GET` | `/api/metrics/ai` | Advanced |
| `GET` | `/api/metrics/dashboard` | Advanced |
| `GET` | `/api/metrics/summary` | Advanced |
| `GET` | `/api/n8n/cookie` | n8n Automation |
| `GET` | `/api/n8n/embed` | n8n Automation |
| `POST` | `/api/n8n/embed-login` | n8n Automation |
| `GET` | `/api/n8n/force` | n8n Automation |
| `GET` | `/api/n8n/host` | n8n Automation |
| `POST` | `/api/n8n/provision` | n8n Automation |
| `GET` | `/api/n8n/x-forwarded-host` | n8n Automation |
| `GET` | `/api/n8n/x-forwarded-proto` | n8n Automation |
| `GET` | `/api/orchestration/agents` | AI |
| `POST` | `/api/orchestration/decide` | AI |
| `POST` | `/api/orchestration/handoff` | AI |
| `GET` | `/api/orchestration/handoffs/{conversationId}` | AI |
| `GET` | `/api/orders` | Orders |
| `GET` | `/api/orders/report` | Orders |
| `GET` | `/api/orders/subscriptions` | Orders |
| `POST` | `/api/organization/create` | Organization |
| `POST` | `/api/organization/delete` | Organization |
| `GET` | `/api/organization/get-active` | Organization |
| `GET` | `/api/organization/get-members` | Organization |
| `POST` | `/api/organization/invite-member` | Organization |
| `GET` | `/api/organization/list` | Organization |
| `POST` | `/api/organization/remove-member` | Organization |
| `POST` | `/api/organization/set-active` | Organization |
| `POST` | `/api/organization/update` | Organization |
| `POST` | `/api/organization/update-member-role` | Organization |
| `GET` | `/api/scalebiz/chat/webhooks/subscriptions` | Volara Compatibility |
| `POST` | `/api/scalebiz/chat/webhooks/subscriptions` | Volara Compatibility |
| `DELETE` | `/api/scalebiz/chat/webhooks/subscriptions/{id}` | Volara Compatibility |
| `GET` | `/api/scalebiz/orders` | Volara Compatibility |
| `POST` | `/api/scalebiz/orders` | Volara Compatibility |
| `GET` | `/api/scalebiz/orders/{id}` | Volara Compatibility |
| `PATCH` | `/api/scalebiz/orders/{id}` | Volara Compatibility |
| `GET` | `/api/scalebiz/users` | Volara Compatibility |
| `GET` | `/api/scalebiz/workflows` | Volara Compatibility |
| `DELETE` | `/api/scalebiz/workflows/{id}/hook` | Volara Compatibility |
| `GET` | `/api/scalebiz/workflows/{id}/hook` | Volara Compatibility |
| `POST` | `/api/scalebiz/workflows/{id}/hook` | Volara Compatibility |
| `GET` | `/api/super-admin/companies` | Super Admin |
| `PATCH` | `/api/super-admin/companies/{id}/status` | Super Admin |
| `POST` | `/api/super-admin/companies/{id}/top-up` | Super Admin |
| `POST` | `/api/super-admin/credits/adjust` | Super Admin |
| `GET` | `/api/super-admin/credits/balance/{orgId}` | Super Admin |
| `GET` | `/api/super-admin/credits/model-pricing` | Super Admin |
| `POST` | `/api/super-admin/credits/model-pricing` | Super Admin |
| `GET` | `/api/super-admin/credits/packages` | Super Admin |
| `GET` | `/api/super-admin/reports/usage` | Super Admin |
| `GET` | `/api/super-admin/stats` | Super Admin |
| `GET` | `/api/super-admin/users` | Super Admin |
| `PATCH` | `/api/super-admin/users/{id}/role` | Super Admin |
| `POST` | `/api/super-admin/users/{id}/suspend` | Super Admin |
| `GET` | `/api/super-admin/webhooks` | Super Admin |
| `GET` | `/api/teams` | Team |
| `POST` | `/api/teams` | Team |
| `DELETE` | `/api/teams/{id}` | Team |
| `GET` | `/api/teams/{id}` | Team |
| `PATCH` | `/api/teams/{id}` | Team |
| `POST` | `/api/teams/{id}/members` | Team |
| `DELETE` | `/api/teams/{id}/members/{userId}` | Team |
| `GET` | `/api/template-variables` | Template Variables |
| `POST` | `/api/template-variables` | Template Variables |
| `DELETE` | `/api/template-variables/{id}` | Template Variables |
| `GET` | `/api/templates` | WhatsApp |
| `POST` | `/api/templates/sync` | WhatsApp |
| `GET` | `/api/tickets/conversations/{conversationId}` | Tickets |
| `POST` | `/api/tickets/kanban` | Tickets |
| `GET` | `/api/tickets/settings` | Tickets |
| `PUT` | `/api/tickets/settings/default-board` | Tickets |
| `GET` | `/api/tiktok-channels` | TikTok |
| `DELETE` | `/api/tiktok-channels/{id}` | TikTok |
| `GET` | `/api/tiktok-channels/{id}/status` | TikTok |
| `GET` | `/api/tiktok-channels/callback` | TikTok |
| `POST` | `/api/tiktok-channels/init-login` | TikTok |
| `GET` | `/api/tiktok-channels/redirect_uri` | TikTok |
| `GET` | `/api/user` | User |
| `GET` | `/api/user/{id}` | User |
| `PATCH` | `/api/user/{id}` | User |
| `GET` | `/api/user/{id}/presence` | User |
| `POST` | `/api/user/{id}/presence` | User |
| `GET` | `/api/user/timezone` | User |
| `PUT` | `/api/user/timezone` | User |
| `POST` | `/api/user/timezone/detect` | User |
| `POST` | `/api/user/timezone/reset` | User |
| `GET` | `/api/v1/admin/billing/organizations` | Admin |
| `GET` | `/api/v1/admin/billing/organizations/{id}/balance` | Admin |
| `POST` | `/api/v1/admin/billing/organizations/{id}/credits` | Admin |
| `GET` | `/api/v1/admin/billing/organizations/{id}/transactions` | Admin |
| `GET` | `/api/v1/admin/billing/pricing` | Admin |
| `POST` | `/api/v1/admin/billing/pricing` | Admin |
| `DELETE` | `/api/v1/admin/billing/pricing/{id}` | Admin |
| `PUT` | `/api/v1/admin/billing/pricing/{id}` | Admin |
| `POST` | `/api/v1/admin/queues/{name}/retry` | Admin |
| `GET` | `/api/v1/admin/queues/stats` | Admin |
| `GET` | `/api/v1/agent-settings` | Admin |
| `PUT` | `/api/v1/agent-settings` | Admin |
| `GET` | `/api/v1/agents` | User |
| `POST` | `/api/v1/agents` | User |
| `GET` | `/api/v1/agents-management` | User |
| `POST` | `/api/v1/agents-management` | User |
| `DELETE` | `/api/v1/agents-management/{id}` | User |
| `PATCH` | `/api/v1/agents-management/{id}` | User |
| `PUT` | `/api/v1/agents-management/{id}` | User |
| `GET` | `/api/v1/agents-management/divisions` | User |
| `POST` | `/api/v1/agents-management/divisions` | User |
| `DELETE` | `/api/v1/agents-management/divisions/{id}` | User |
| `PUT` | `/api/v1/agents-management/divisions/{id}` | User |
| `GET` | `/api/v1/agents-management/login-link` | User |
| `DELETE` | `/api/v1/agents/{id}` | User |
| `PATCH` | `/api/v1/agents/{id}` | User |
| `PUT` | `/api/v1/agents/{id}` | User |
| `GET` | `/api/v1/agents/divisions` | User |
| `POST` | `/api/v1/agents/divisions` | User |
| `DELETE` | `/api/v1/agents/divisions/{id}` | User |
| `PUT` | `/api/v1/agents/divisions/{id}` | User |
| `GET` | `/api/v1/agents/login-link` | User |
| `GET` | `/api/v1/ai_tools` | API Tools |
| `POST` | `/api/v1/ai_tools` | API Tools |
| `PUT` | `/api/v1/ai_tools` | API Tools |
| `DELETE` | `/api/v1/ai_tools/{id}` | API Tools |
| `PATCH` | `/api/v1/ai_tools/{id}` | API Tools |
| `POST` | `/api/v1/ai_tools/execute` | API Tools |
| `POST` | `/api/v1/ai/evaluate` | AI |
| `POST` | `/api/v1/ai/generate` | AI |
| `GET` | `/api/v1/ai/providers` | AI |
| `PUT` | `/api/v1/ai/providers/{provider}` | AI |
| `PATCH` | `/api/v1/ai/providers/active` | AI |
| `GET` | `/api/v1/ai/settings` | AI |
| `PATCH` | `/api/v1/ai/settings` | AI |
| `GET` | `/api/v1/ai/suggest/{conversationId}` | AI |
| `GET` | `/api/v1/app-center/apps` | Admin |
| `GET` | `/api/v1/app-center/apps/{id}` | Admin |
| `GET` | `/api/v1/app-center/categories` | Admin |
| `POST` | `/api/v1/app-center/install` | Admin |
| `GET` | `/api/v1/app-center/installed` | Admin |
| `GET` | `/api/v1/auto-assign/rules` | Advanced |
| `POST` | `/api/v1/auto-assign/rules` | Advanced |
| `DELETE` | `/api/v1/auto-assign/rules/{id}` | Advanced |
| `PATCH` | `/api/v1/auto-assign/rules/{id}` | Advanced |
| `GET` | `/api/v1/auto-assign/sla` | Advanced |
| `POST` | `/api/v1/auto-assign/sla` | Advanced |
| `DELETE` | `/api/v1/auto-assign/sla/{id}` | Advanced |
| `GET` | `/api/v1/auto-assign/sla/breaches` | Advanced |
| `GET` | `/api/v1/billing/balance` | Billing |
| `GET` | `/api/v1/billing/packages` | Billing |
| `POST` | `/api/v1/billing/top-up` | Billing |
| `POST` | `/api/v1/billing/top-up/create-invoice` | Billing |
| `GET` | `/api/v1/billing/transactions` | Billing |
| `GET` | `/api/v1/broadcasts` | Broadcast |
| `POST` | `/api/v1/broadcasts` | Broadcast |
| `GET` | `/api/v1/broadcasts/{id}` | Broadcast |
| `POST` | `/api/v1/broadcasts/{id}/send` | Broadcast |
| `GET` | `/api/v1/broadcasts/jobs` | Broadcast |
| `GET` | `/api/v1/broadcasts/jobs/{id}` | Broadcast |
| `GET` | `/api/v1/business_webhooks` | Business Webhooks |
| `POST` | `/api/v1/business_webhooks` | Business Webhooks |
| `DELETE` | `/api/v1/business_webhooks/{id}` | Business Webhooks |
| `PATCH` | `/api/v1/business_webhooks/{id}` | Business Webhooks |
| `GET` | `/api/v1/canned-responses` | Message |
| `POST` | `/api/v1/canned-responses` | Message |
| `DELETE` | `/api/v1/canned-responses/{id}` | Message |
| `GET` | `/api/v1/chatbots` | Chatbot |
| `POST` | `/api/v1/chatbots` | Chatbot |
| `DELETE` | `/api/v1/chatbots/{id}` | Chatbot |
| `GET` | `/api/v1/chatbots/{id}` | Chatbot |
| `PATCH` | `/api/v1/chatbots/{id}` | Chatbot |
| `PUT` | `/api/v1/chatbots/{id}` | Chatbot |
| `GET` | `/api/v1/chatbots/{id}/documents` | Chatbot |
| `POST` | `/api/v1/chatbots/{id}/documents` | Chatbot |
| `DELETE` | `/api/v1/chatbots/{id}/documents/{docId}` | Chatbot |
| `PATCH` | `/api/v1/chatbots/{id}/documents/{docId}` | Chatbot |
| `POST` | `/api/v1/chatbots/{id}/simulate` | Chatbot |
| `GET` | `/api/v1/chatbots/model-pricing` | Chatbot |
| `GET` | `/api/v1/contacts` | Contact |
| `POST` | `/api/v1/contacts` | Contact |
| `DELETE` | `/api/v1/contacts/{id}` | Contact |
| `GET` | `/api/v1/contacts/{id}` | Contact |
| `PATCH` | `/api/v1/contacts/{id}` | Contact |
| `GET` | `/api/v1/contacts/{id}/conversations` | Contact |
| `GET` | `/api/v1/contacts/settings` | Contact |
| `POST` | `/api/v1/contacts/settings/fields` | Contact |
| `DELETE` | `/api/v1/contacts/settings/fields/{id}` | Contact |
| `PATCH` | `/api/v1/contacts/settings/fields/{id}` | Contact |
| `PATCH` | `/api/v1/contacts/settings/fields/reorder` | Contact |
| `POST` | `/api/v1/contacts/settings/stages` | Contact |
| `DELETE` | `/api/v1/contacts/settings/stages/{id}` | Contact |
| `PATCH` | `/api/v1/contacts/settings/stages/{id}` | Contact |
| `PATCH` | `/api/v1/contacts/settings/stages/reorder` | Contact |
| `GET` | `/api/v1/conversations` | Conversation |
| `GET` | `/api/v1/conversations/{id}` | Conversation |
| `GET` | `/api/v1/conversations/{id}/activity` | Conversation |
| `GET` | `/api/v1/conversations/{id}/agents` | Conversation |
| `POST` | `/api/v1/conversations/{id}/agents` | Conversation |
| `DELETE` | `/api/v1/conversations/{id}/agents/{agentId}` | Conversation |
| `POST` | `/api/v1/conversations/{id}/assign` | Conversation |
| `GET` | `/api/v1/conversations/{id}/labels` | Conversation |
| `POST` | `/api/v1/conversations/{id}/labels` | Conversation |
| `DELETE` | `/api/v1/conversations/{id}/labels/{labelId}` | Conversation |
| `GET` | `/api/v1/conversations/{id}/messages` | Conversation |
| `POST` | `/api/v1/conversations/{id}/messages` | Conversation |
| `GET` | `/api/v1/conversations/{id}/notes` | Conversation |
| `POST` | `/api/v1/conversations/{id}/notes` | Conversation |
| `PATCH` | `/api/v1/conversations/{id}/notes/{noteId}` | Conversation |
| `POST` | `/api/v1/conversations/{id}/read` | Conversation |
| `POST` | `/api/v1/conversations/{id}/resolve` | Conversation |
| `PATCH` | `/api/v1/conversations/{id}/status` | Conversation |
| `POST` | `/api/v1/conversations/{id}/status` | Conversation |
| `POST` | `/api/v1/conversations/{id}/takeover` | Conversation |
| `POST` | `/api/v1/conversations/bulk-edit` | Conversation |
| `GET` | `/api/v1/conversations/bulk-edit/{jobId}` | Conversation |
| `GET` | `/api/v1/conversations/counts` | Conversation |
| `GET` | `/api/v1/crm/deals/{conversationId}` | CRM |
| `PATCH` | `/api/v1/crm/deals/{conversationId}` | CRM |
| `GET` | `/api/v1/crm/pipelines` | CRM |
| `POST` | `/api/v1/crm/pipelines` | CRM |
| `DELETE` | `/api/v1/crm/pipelines/{id}` | CRM |
| `GET` | `/api/v1/customers` | Customer |
| `GET` | `/api/v1/customers/{id}` | Customer |
| `PUT` | `/api/v1/customers/{id}` | Customer |
| `POST` | `/api/v1/customers/{id}/tags` | Customer |
| `DELETE` | `/api/v1/customers/{id}/tags/{tagId}` | Customer |
| `GET` | `/api/v1/customers/stats` | Customer |
| `GET` | `/api/v1/flows` | Flow |
| `POST` | `/api/v1/flows` | Flow |
| `DELETE` | `/api/v1/flows/{id}` | Flow |
| `GET` | `/api/v1/flows/{id}` | Flow |
| `PATCH` | `/api/v1/flows/{id}` | Flow |
| `GET` | `/api/v1/forms` | Advanced |
| `POST` | `/api/v1/forms` | Advanced |
| `GET` | `/api/v1/forms/{id}` | Advanced |
| `GET` | `/api/v1/forms/conversation/{id}` | Advanced |
| `POST` | `/api/v1/forms/conversation/{id}/extract` | Advanced |
| `GET` | `/api/v1/inboxes` | Inbox |
| `POST` | `/api/v1/inboxes` | Inbox |
| `DELETE` | `/api/v1/inboxes/{id}` | Inbox |
| `GET` | `/api/v1/inboxes/{id}` | Inbox |
| `PATCH` | `/api/v1/inboxes/{id}` | Inbox |
| `GET` | `/api/v1/instagram-channels` | Instagram |
| `DELETE` | `/api/v1/instagram-channels/{id}` | Instagram |
| `GET` | `/api/v1/instagram-channels/{id}/status` | Instagram |
| `GET` | `/api/v1/instagram-channels/callback` | Instagram |
| `POST` | `/api/v1/instagram-channels/callback` | Instagram |
| `POST` | `/api/v1/instagram-channels/init-login` | Instagram |
| `GET` | `/api/v1/knowledge/categories` | Knowledge |
| `POST` | `/api/v1/knowledge/categories` | Knowledge |
| `DELETE` | `/api/v1/knowledge/categories/{id}` | Knowledge |
| `GET` | `/api/v1/knowledge/faqs` | Knowledge |
| `POST` | `/api/v1/knowledge/faqs` | Knowledge |
| `DELETE` | `/api/v1/knowledge/faqs/{id}` | Knowledge |
| `PATCH` | `/api/v1/knowledge/faqs/{id}` | Knowledge |
| `GET` | `/api/v1/knowledge/sources` | Knowledge |
| `GET` | `/api/v1/knowledge/stats` | Knowledge |
| `GET` | `/api/v1/labels` | Label |
| `POST` | `/api/v1/labels` | Label |
| `DELETE` | `/api/v1/labels/{id}` | Label |
| `PATCH` | `/api/v1/labels/{id}` | Label |
| `GET` | `/api/v1/labels/conversation/{id}` | Label |
| `POST` | `/api/v1/labels/conversation/{id}` | Label |
| `DELETE` | `/api/v1/labels/conversation/{id}/{labelId}` | Label |
| `GET` | `/api/v1/media/gallery` | Media |
| `POST` | `/api/v1/media/upload` | Media |
| `POST` | `/api/v1/messages` | Message |
| `DELETE` | `/api/v1/messages/{id}` | Message |
| `GET` | `/api/v1/messages/{id}` | Message |
| `PATCH` | `/api/v1/messages/{id}/status` | Message |
| `GET` | `/api/v1/meta-ads/accounts` | Admin |
| `GET` | `/api/v1/meta-ads/campaigns` | Admin |
| `GET` | `/api/v1/meta-ads/ctwa/config` | Admin |
| `PUT` | `/api/v1/meta-ads/ctwa/config` | Admin |
| `GET` | `/api/v1/meta-ads/ctwa/observability/{conversationId}` | Admin |
| `POST` | `/api/v1/meta-ads/ctwa/simulate` | Admin |
| `GET` | `/api/v1/meta-ads/insights/summary` | Admin |
| `GET` | `/api/v1/metrics/ai` | Advanced |
| `GET` | `/api/v1/metrics/dashboard` | Advanced |
| `GET` | `/api/v1/metrics/summary` | Advanced |
| `GET` | `/api/v1/n8n/cookie` | n8n Automation |
| `GET` | `/api/v1/n8n/embed` | n8n Automation |
| `POST` | `/api/v1/n8n/embed-login` | n8n Automation |
| `GET` | `/api/v1/n8n/force` | n8n Automation |
| `GET` | `/api/v1/n8n/host` | n8n Automation |
| `POST` | `/api/v1/n8n/provision` | n8n Automation |
| `GET` | `/api/v1/n8n/x-forwarded-host` | n8n Automation |
| `GET` | `/api/v1/n8n/x-forwarded-proto` | n8n Automation |
| `GET` | `/api/v1/orchestration/agents` | AI |
| `POST` | `/api/v1/orchestration/decide` | AI |
| `POST` | `/api/v1/orchestration/handoff` | AI |
| `GET` | `/api/v1/orchestration/handoffs/{conversationId}` | AI |
| `GET` | `/api/v1/orders` | Orders |
| `GET` | `/api/v1/orders/report` | Orders |
| `GET` | `/api/v1/orders/subscriptions` | Orders |
| `GET` | `/api/v1/super-admin/companies` | Super Admin |
| `PATCH` | `/api/v1/super-admin/companies/{id}/status` | Super Admin |
| `POST` | `/api/v1/super-admin/companies/{id}/top-up` | Super Admin |
| `POST` | `/api/v1/super-admin/credits/adjust` | Super Admin |
| `GET` | `/api/v1/super-admin/credits/balance/{orgId}` | Super Admin |
| `GET` | `/api/v1/super-admin/credits/model-pricing` | Super Admin |
| `POST` | `/api/v1/super-admin/credits/model-pricing` | Super Admin |
| `GET` | `/api/v1/super-admin/credits/packages` | Super Admin |
| `GET` | `/api/v1/super-admin/reports/usage` | Super Admin |
| `GET` | `/api/v1/super-admin/stats` | Super Admin |
| `GET` | `/api/v1/super-admin/users` | Super Admin |
| `PATCH` | `/api/v1/super-admin/users/{id}/role` | Super Admin |
| `POST` | `/api/v1/super-admin/users/{id}/suspend` | Super Admin |
| `GET` | `/api/v1/super-admin/webhooks` | Super Admin |
| `GET` | `/api/v1/teams` | Team |
| `POST` | `/api/v1/teams` | Team |
| `DELETE` | `/api/v1/teams/{id}` | Team |
| `GET` | `/api/v1/teams/{id}` | Team |
| `PATCH` | `/api/v1/teams/{id}` | Team |
| `POST` | `/api/v1/teams/{id}/members` | Team |
| `DELETE` | `/api/v1/teams/{id}/members/{userId}` | Team |
| `GET` | `/api/v1/template-variables` | Template Variables |
| `POST` | `/api/v1/template-variables` | Template Variables |
| `DELETE` | `/api/v1/template-variables/{id}` | Template Variables |
| `GET` | `/api/v1/templates` | WhatsApp |
| `POST` | `/api/v1/templates/sync` | WhatsApp |
| `GET` | `/api/v1/tickets/conversations/{conversationId}` | Tickets |
| `POST` | `/api/v1/tickets/kanban` | Tickets |
| `GET` | `/api/v1/tickets/settings` | Tickets |
| `PUT` | `/api/v1/tickets/settings/default-board` | Tickets |
| `GET` | `/api/v1/tiktok-channels` | TikTok |
| `DELETE` | `/api/v1/tiktok-channels/{id}` | TikTok |
| `GET` | `/api/v1/tiktok-channels/{id}/status` | TikTok |
| `GET` | `/api/v1/tiktok-channels/callback` | TikTok |
| `POST` | `/api/v1/tiktok-channels/init-login` | TikTok |
| `GET` | `/api/v1/tiktok-channels/redirect_uri` | TikTok |
| `GET` | `/api/v1/user` | User |
| `GET` | `/api/v1/user/{id}` | User |
| `PATCH` | `/api/v1/user/{id}` | User |
| `GET` | `/api/v1/user/{id}/presence` | User |
| `POST` | `/api/v1/user/{id}/presence` | User |
| `GET` | `/api/v1/user/timezone` | User |
| `PUT` | `/api/v1/user/timezone` | User |
| `POST` | `/api/v1/user/timezone/detect` | User |
| `POST` | `/api/v1/user/timezone/reset` | User |
| `POST` | `/api/v1/waba/connect/manual` | WABA |
| `GET` | `/api/v1/waba/webhook-config` | WABA |
| `GET` | `/api/v1/webhooks` | Webhook |
| `POST` | `/api/v1/webhooks` | Webhook |
| `DELETE` | `/api/v1/webhooks/{id}` | Webhook |
| `GET` | `/api/v1/webhooks/instagram` | Webhook |
| `POST` | `/api/v1/webhooks/instagram` | Webhook |
| `GET` | `/api/v1/webhooks/tiktok` | Webhook |
| `POST` | `/api/v1/webhooks/tiktok` | Webhook |
| `GET` | `/api/v1/webhooks/whatsapp` | Webhook |
| `POST` | `/api/v1/webhooks/whatsapp` | Webhook |
| `GET` | `/api/v1/webhooks/whatsapp/media/{messageId}` | Webhook |
| `GET` | `/api/v1/whatsapp-channels` | WhatsApp |
| `POST` | `/api/v1/whatsapp-channels` | WhatsApp |
| `DELETE` | `/api/v1/whatsapp-channels/{id}` | WhatsApp |
| `GET` | `/api/v1/whatsapp-channels/{id}` | WhatsApp |
| `PATCH` | `/api/v1/whatsapp-channels/{id}` | WhatsApp |
| `DELETE` | `/api/v1/whatsapp-channels/{id}/badge` | WhatsApp |
| `POST` | `/api/v1/whatsapp-channels/{id}/badge` | WhatsApp |
| `GET` | `/api/v1/whatsapp-channels/{id}/details` | WhatsApp |
| `GET` | `/api/v1/whatsapp-channels/callback` | WhatsApp |
| `GET` | `/api/v1/whatsapp-channels/config` | WhatsApp |
| `POST` | `/api/v1/whatsapp-channels/exchange-token` | WhatsApp |
| `POST` | `/api/v1/whatsapp-channels/init-signup` | WhatsApp |
| `POST` | `/api/waba/connect/manual` | WABA |
| `GET` | `/api/waba/webhook-config` | WABA |
| `GET` | `/api/webhooks` | Webhook |
| `POST` | `/api/webhooks` | Webhook |
| `DELETE` | `/api/webhooks/{id}` | Webhook |
| `GET` | `/api/webhooks/instagram` | Webhook |
| `POST` | `/api/webhooks/instagram` | Webhook |
| `GET` | `/api/webhooks/tiktok` | Webhook |
| `POST` | `/api/webhooks/tiktok` | Webhook |
| `GET` | `/api/webhooks/whatsapp` | Webhook |
| `POST` | `/api/webhooks/whatsapp` | Webhook |
| `GET` | `/api/webhooks/whatsapp/media/{messageId}` | Webhook |
| `GET` | `/api/whatsapp` | WhatsApp |
| `POST` | `/api/whatsapp` | WhatsApp |
| `GET` | `/api/whatsapp-channels` | WhatsApp |
| `POST` | `/api/whatsapp-channels` | WhatsApp |
| `DELETE` | `/api/whatsapp-channels/{id}` | WhatsApp |
| `GET` | `/api/whatsapp-channels/{id}` | WhatsApp |
| `PATCH` | `/api/whatsapp-channels/{id}` | WhatsApp |
| `DELETE` | `/api/whatsapp-channels/{id}/badge` | WhatsApp |
| `POST` | `/api/whatsapp-channels/{id}/badge` | WhatsApp |
| `GET` | `/api/whatsapp-channels/{id}/details` | WhatsApp |
| `GET` | `/api/whatsapp-channels/callback` | WhatsApp |
| `GET` | `/api/whatsapp-channels/config` | WhatsApp |
| `POST` | `/api/whatsapp-channels/exchange-token` | WhatsApp |
| `POST` | `/api/whatsapp-channels/init-signup` | WhatsApp |
| `DELETE` | `/api/whatsapp/{id}` | WhatsApp |
| `GET` | `/api/whatsapp/{id}` | WhatsApp |
| `PATCH` | `/api/whatsapp/{id}` | WhatsApp |
| `DELETE` | `/api/whatsapp/{id}/badge` | WhatsApp |
| `POST` | `/api/whatsapp/{id}/badge` | WhatsApp |
| `GET` | `/api/whatsapp/{id}/details` | WhatsApp |
| `GET` | `/api/whatsapp/callback` | WhatsApp |
| `GET` | `/api/whatsapp/config` | WhatsApp |
| `POST` | `/api/whatsapp/exchange-token` | WhatsApp |
| `POST` | `/api/whatsapp/init-signup` | WhatsApp |
| `GET` | `/api/whatsapp/templates` | WhatsApp |
| `POST` | `/api/whatsapp/templates/sync` | WhatsApp |
| `GET` | `/auth/session` | Better Auth |
| `POST` | `/auth/sign-in/email` | Better Auth |
| `POST` | `/auth/sign-out` | Better Auth |
| `POST` | `/auth/sign-up/email` | Better Auth |
| `GET` | `/health` | System |

## System

### GET /

Service metadata.

Full URL: `https://api.volara.chat/`
Headers: `None`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/'
```

### GET /api/health

API health check.

Full URL: `https://api.volara.chat/api/health`
Headers: `None`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/health'
```

### GET /health

Worker health check.

Full URL: `https://api.volara.chat/health`
Headers: `None`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/health'
```

## Admin

### GET /api/admin/billing/organizations

Full URL: `https://api.volara.chat/api/admin/billing/organizations`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/admin/billing/organizations' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/admin/billing/organizations/{id}/balance

Full URL: `https://api.volara.chat/api/admin/billing/organizations/{id}/balance`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/admin/billing/organizations/{id}/balance' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/admin/billing/organizations/{id}/credits

Full URL: `https://api.volara.chat/api/admin/billing/organizations/{id}/credits`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `amount` | `number` | Yes | `0` |
| `reason` | `string` | No | `"string"` |
| `adminId` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/admin/billing/organizations/{id}/credits' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"amount":0,"reason":"string","adminId":"string"}'
```

### GET /api/admin/billing/organizations/{id}/transactions

Full URL: `https://api.volara.chat/api/admin/billing/organizations/{id}/transactions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `limit` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/admin/billing/organizations/{id}/transactions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/admin/billing/pricing

Full URL: `https://api.volara.chat/api/admin/billing/pricing`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/admin/billing/pricing' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/admin/billing/pricing

Full URL: `https://api.volara.chat/api/admin/billing/pricing`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `modelName` | `string` | Yes | `"string"` |
| `costPerRequest` | `number` | Yes | `0` |
| `description` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/admin/billing/pricing' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"modelName":"string","costPerRequest":0,"description":"string"}'
```

### DELETE /api/admin/billing/pricing/{id}

Full URL: `https://api.volara.chat/api/admin/billing/pricing/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/admin/billing/pricing/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/admin/billing/pricing/{id}

Full URL: `https://api.volara.chat/api/admin/billing/pricing/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `costPerRequest` | `number` | Yes | `0` |
| `description` | `string` | No | `"string"` |
| `isActive` | `boolean` | No | `true` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/admin/billing/pricing/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"costPerRequest":0,"description":"string","isActive":true}'
```

### POST /api/admin/queues/{name}/retry

Full URL: `https://api.volara.chat/api/admin/queues/{name}/retry`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/admin/queues/{name}/retry' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/admin/queues/stats

Full URL: `https://api.volara.chat/api/admin/queues/stats`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/admin/queues/stats' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/agent-settings

Full URL: `https://api.volara.chat/api/agent-settings`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/agent-settings' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/agent-settings

Full URL: `https://api.volara.chat/api/agent-settings`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/agent-settings' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/app-center/apps

Full URL: `https://api.volara.chat/api/app-center/apps`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `category` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/app-center/apps' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/app-center/apps/{id}

Full URL: `https://api.volara.chat/api/app-center/apps/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/app-center/apps/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/app-center/categories

Full URL: `https://api.volara.chat/api/app-center/categories`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/app-center/categories' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/app-center/install

Full URL: `https://api.volara.chat/api/app-center/install`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/app-center/install' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### GET /api/app-center/installed

Full URL: `https://api.volara.chat/api/app-center/installed`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/app-center/installed' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/meta-ads/accounts

Full URL: `https://api.volara.chat/api/meta-ads/accounts`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/meta-ads/accounts' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/meta-ads/campaigns

Full URL: `https://api.volara.chat/api/meta-ads/campaigns`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `status` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/meta-ads/campaigns' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/meta-ads/ctwa/config

Full URL: `https://api.volara.chat/api/meta-ads/ctwa/config`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/meta-ads/ctwa/config' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/meta-ads/ctwa/config

Full URL: `https://api.volara.chat/api/meta-ads/ctwa/config`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `dataset_id` | `string` | Yes | `"string"` |
| `access_token` | `string` | No | `"string"` |
| `test_event_code` | `string` | No | `"string"` |
| `qualified_stage_ids` | `string` | No | `"string"` |
| `purchase_stage_ids` | `string` | No | `"string"` |
| `is_active` | `boolean` | No | `true` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/meta-ads/ctwa/config' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"dataset_id":"string","access_token":"string","test_event_code":"string","qualified_stage_ids":"string","purchase_stage_ids":"string","is_active":true}'
```

### GET /api/meta-ads/ctwa/observability/{conversationId}

Full URL: `https://api.volara.chat/api/meta-ads/ctwa/observability/{conversationId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `limit` | `number` | No | `0` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/meta-ads/ctwa/observability/{conversationId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/meta-ads/ctwa/simulate

Full URL: `https://api.volara.chat/api/meta-ads/ctwa/simulate`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/meta-ads/ctwa/simulate' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### GET /api/meta-ads/insights/summary

Full URL: `https://api.volara.chat/api/meta-ads/insights/summary`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/meta-ads/insights/summary' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/admin/billing/organizations

Full URL: `https://api.volara.chat/api/v1/admin/billing/organizations`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/admin/billing/organizations' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/admin/billing/organizations/{id}/balance

Full URL: `https://api.volara.chat/api/v1/admin/billing/organizations/{id}/balance`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/admin/billing/organizations/{id}/balance' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/admin/billing/organizations/{id}/credits

Full URL: `https://api.volara.chat/api/v1/admin/billing/organizations/{id}/credits`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `amount` | `number` | Yes | `0` |
| `reason` | `string` | No | `"string"` |
| `adminId` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/admin/billing/organizations/{id}/credits' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"amount":0,"reason":"string","adminId":"string"}'
```

### GET /api/v1/admin/billing/organizations/{id}/transactions

Full URL: `https://api.volara.chat/api/v1/admin/billing/organizations/{id}/transactions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `limit` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/admin/billing/organizations/{id}/transactions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/admin/billing/pricing

Full URL: `https://api.volara.chat/api/v1/admin/billing/pricing`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/admin/billing/pricing' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/admin/billing/pricing

Full URL: `https://api.volara.chat/api/v1/admin/billing/pricing`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `modelName` | `string` | Yes | `"string"` |
| `costPerRequest` | `number` | Yes | `0` |
| `description` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/admin/billing/pricing' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"modelName":"string","costPerRequest":0,"description":"string"}'
```

### DELETE /api/v1/admin/billing/pricing/{id}

Full URL: `https://api.volara.chat/api/v1/admin/billing/pricing/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/admin/billing/pricing/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/admin/billing/pricing/{id}

Full URL: `https://api.volara.chat/api/v1/admin/billing/pricing/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `costPerRequest` | `number` | Yes | `0` |
| `description` | `string` | No | `"string"` |
| `isActive` | `boolean` | No | `true` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/admin/billing/pricing/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"costPerRequest":0,"description":"string","isActive":true}'
```

### POST /api/v1/admin/queues/{name}/retry

Full URL: `https://api.volara.chat/api/v1/admin/queues/{name}/retry`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/admin/queues/{name}/retry' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/admin/queues/stats

Full URL: `https://api.volara.chat/api/v1/admin/queues/stats`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/admin/queues/stats' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/agent-settings

Full URL: `https://api.volara.chat/api/v1/agent-settings`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/agent-settings' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/agent-settings

Full URL: `https://api.volara.chat/api/v1/agent-settings`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/agent-settings' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/app-center/apps

Full URL: `https://api.volara.chat/api/v1/app-center/apps`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `category` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/app-center/apps' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/app-center/apps/{id}

Full URL: `https://api.volara.chat/api/v1/app-center/apps/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/app-center/apps/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/app-center/categories

Full URL: `https://api.volara.chat/api/v1/app-center/categories`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/app-center/categories' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/app-center/install

Full URL: `https://api.volara.chat/api/v1/app-center/install`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/app-center/install' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### GET /api/v1/app-center/installed

Full URL: `https://api.volara.chat/api/v1/app-center/installed`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/app-center/installed' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/meta-ads/accounts

Full URL: `https://api.volara.chat/api/v1/meta-ads/accounts`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/meta-ads/accounts' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/meta-ads/campaigns

Full URL: `https://api.volara.chat/api/v1/meta-ads/campaigns`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `status` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/meta-ads/campaigns' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/meta-ads/ctwa/config

Full URL: `https://api.volara.chat/api/v1/meta-ads/ctwa/config`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/meta-ads/ctwa/config' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/meta-ads/ctwa/config

Full URL: `https://api.volara.chat/api/v1/meta-ads/ctwa/config`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `dataset_id` | `string` | Yes | `"string"` |
| `access_token` | `string` | No | `"string"` |
| `test_event_code` | `string` | No | `"string"` |
| `qualified_stage_ids` | `string` | No | `"string"` |
| `purchase_stage_ids` | `string` | No | `"string"` |
| `is_active` | `boolean` | No | `true` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/meta-ads/ctwa/config' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"dataset_id":"string","access_token":"string","test_event_code":"string","qualified_stage_ids":"string","purchase_stage_ids":"string","is_active":true}'
```

### GET /api/v1/meta-ads/ctwa/observability/{conversationId}

Full URL: `https://api.volara.chat/api/v1/meta-ads/ctwa/observability/{conversationId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `limit` | `number` | No | `0` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/meta-ads/ctwa/observability/{conversationId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/meta-ads/ctwa/simulate

Full URL: `https://api.volara.chat/api/v1/meta-ads/ctwa/simulate`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/meta-ads/ctwa/simulate' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### GET /api/v1/meta-ads/insights/summary

Full URL: `https://api.volara.chat/api/v1/meta-ads/insights/summary`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/meta-ads/insights/summary' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## User

### GET /api/agents

Full URL: `https://api.volara.chat/api/agents`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/agents' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/agents

Full URL: `https://api.volara.chat/api/agents`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/agents' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/agents-management

Full URL: `https://api.volara.chat/api/agents-management`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/agents-management' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/agents-management

Full URL: `https://api.volara.chat/api/agents-management`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/agents-management' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/agents-management/{id}

Full URL: `https://api.volara.chat/api/agents-management/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/agents-management/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/agents-management/{id}

Full URL: `https://api.volara.chat/api/agents-management/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/agents-management/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/agents-management/{id}

Full URL: `https://api.volara.chat/api/agents-management/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/agents-management/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/agents-management/divisions

Divisions.

Full URL: `https://api.volara.chat/api/agents-management/divisions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/agents-management/divisions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/agents-management/divisions

Full URL: `https://api.volara.chat/api/agents-management/divisions`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | Yes | `"string"` |
| `description` | `string` | No | `"string"` |
| `color` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/agents-management/divisions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","description":"string","color":"string"}'
```

### DELETE /api/agents-management/divisions/{id}

Full URL: `https://api.volara.chat/api/agents-management/divisions/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/agents-management/divisions/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/agents-management/divisions/{id}

Full URL: `https://api.volara.chat/api/agents-management/divisions/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | No | `"string"` |
| `description` | `string` | No | `"string"` |
| `color` | `string` | No | `"string"` |
| `parent_division_id` | `string` | No | `"string"` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/agents-management/divisions/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","description":"string","color":"string","parent_division_id":"string"}'
```

### GET /api/agents-management/login-link

Full URL: `https://api.volara.chat/api/agents-management/login-link`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/agents-management/login-link' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/agents/{id}

Full URL: `https://api.volara.chat/api/agents/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/agents/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/agents/{id}

Full URL: `https://api.volara.chat/api/agents/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/agents/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/agents/{id}

Full URL: `https://api.volara.chat/api/agents/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/agents/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/agents/divisions

Divisions.

Full URL: `https://api.volara.chat/api/agents/divisions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/agents/divisions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/agents/divisions

Full URL: `https://api.volara.chat/api/agents/divisions`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | Yes | `"string"` |
| `description` | `string` | No | `"string"` |
| `color` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/agents/divisions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","description":"string","color":"string"}'
```

### DELETE /api/agents/divisions/{id}

Full URL: `https://api.volara.chat/api/agents/divisions/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/agents/divisions/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/agents/divisions/{id}

Full URL: `https://api.volara.chat/api/agents/divisions/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | No | `"string"` |
| `description` | `string` | No | `"string"` |
| `color` | `string` | No | `"string"` |
| `parent_division_id` | `string` | No | `"string"` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/agents/divisions/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","description":"string","color":"string","parent_division_id":"string"}'
```

### GET /api/agents/login-link

Full URL: `https://api.volara.chat/api/agents/login-link`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/agents/login-link' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/user

Get all users for an account.

Full URL: `https://api.volara.chat/api/user`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/user' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/user/{id}

Get user by ID.

Full URL: `https://api.volara.chat/api/user/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/user/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/user/{id}

Update user profile.

Full URL: `https://api.volara.chat/api/user/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/user/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/user/{id}/presence

Get user presence.

Full URL: `https://api.volara.chat/api/user/{id}/presence`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/user/{id}/presence' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/user/{id}/presence

Update user presence.

Full URL: `https://api.volara.chat/api/user/{id}/presence`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `status` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/user/{id}/presence' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"status":"string"}'
```

### GET /api/user/timezone

Get user timezone.

Full URL: `https://api.volara.chat/api/user/timezone`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/user/timezone' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/user/timezone

Update user timezone.

Full URL: `https://api.volara.chat/api/user/timezone`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `timezone` | `string` | Yes | `"string"` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/user/timezone' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"timezone":"string"}'
```

### POST /api/user/timezone/detect

Detect user timezone.

Full URL: `https://api.volara.chat/api/user/timezone/detect`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `detected_timezone` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/user/timezone/detect' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"detected_timezone":"string"}'
```

### POST /api/user/timezone/reset

Reset user timezone.

Full URL: `https://api.volara.chat/api/user/timezone/reset`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/user/timezone/reset' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/agents

Full URL: `https://api.volara.chat/api/v1/agents`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/agents' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/agents

Full URL: `https://api.volara.chat/api/v1/agents`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/agents' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/agents-management

Full URL: `https://api.volara.chat/api/v1/agents-management`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/agents-management' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/agents-management

Full URL: `https://api.volara.chat/api/v1/agents-management`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/agents-management' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/agents-management/{id}

Full URL: `https://api.volara.chat/api/v1/agents-management/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/agents-management/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/agents-management/{id}

Full URL: `https://api.volara.chat/api/v1/agents-management/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/agents-management/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/agents-management/{id}

Full URL: `https://api.volara.chat/api/v1/agents-management/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/agents-management/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/agents-management/divisions

Divisions.

Full URL: `https://api.volara.chat/api/v1/agents-management/divisions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/agents-management/divisions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/agents-management/divisions

Full URL: `https://api.volara.chat/api/v1/agents-management/divisions`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | Yes | `"string"` |
| `description` | `string` | No | `"string"` |
| `color` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/agents-management/divisions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","description":"string","color":"string"}'
```

### DELETE /api/v1/agents-management/divisions/{id}

Full URL: `https://api.volara.chat/api/v1/agents-management/divisions/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/agents-management/divisions/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/agents-management/divisions/{id}

Full URL: `https://api.volara.chat/api/v1/agents-management/divisions/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | No | `"string"` |
| `description` | `string` | No | `"string"` |
| `color` | `string` | No | `"string"` |
| `parent_division_id` | `string` | No | `"string"` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/agents-management/divisions/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","description":"string","color":"string","parent_division_id":"string"}'
```

### GET /api/v1/agents-management/login-link

Full URL: `https://api.volara.chat/api/v1/agents-management/login-link`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/agents-management/login-link' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/agents/{id}

Full URL: `https://api.volara.chat/api/v1/agents/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/agents/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/agents/{id}

Full URL: `https://api.volara.chat/api/v1/agents/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/agents/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/agents/{id}

Full URL: `https://api.volara.chat/api/v1/agents/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/agents/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/agents/divisions

Divisions.

Full URL: `https://api.volara.chat/api/v1/agents/divisions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/agents/divisions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/agents/divisions

Full URL: `https://api.volara.chat/api/v1/agents/divisions`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | Yes | `"string"` |
| `description` | `string` | No | `"string"` |
| `color` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/agents/divisions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","description":"string","color":"string"}'
```

### DELETE /api/v1/agents/divisions/{id}

Full URL: `https://api.volara.chat/api/v1/agents/divisions/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/agents/divisions/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/agents/divisions/{id}

Full URL: `https://api.volara.chat/api/v1/agents/divisions/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | No | `"string"` |
| `description` | `string` | No | `"string"` |
| `color` | `string` | No | `"string"` |
| `parent_division_id` | `string` | No | `"string"` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/agents/divisions/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","description":"string","color":"string","parent_division_id":"string"}'
```

### GET /api/v1/agents/login-link

Full URL: `https://api.volara.chat/api/v1/agents/login-link`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/agents/login-link' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/user

Get all users for an account.

Full URL: `https://api.volara.chat/api/v1/user`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/user' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/user/{id}

Get user by ID.

Full URL: `https://api.volara.chat/api/v1/user/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/user/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/user/{id}

Update user profile.

Full URL: `https://api.volara.chat/api/v1/user/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/user/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/user/{id}/presence

Get user presence.

Full URL: `https://api.volara.chat/api/v1/user/{id}/presence`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/user/{id}/presence' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/user/{id}/presence

Update user presence.

Full URL: `https://api.volara.chat/api/v1/user/{id}/presence`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `status` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/user/{id}/presence' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"status":"string"}'
```

### GET /api/v1/user/timezone

Get user timezone.

Full URL: `https://api.volara.chat/api/v1/user/timezone`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/user/timezone' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/user/timezone

Update user timezone.

Full URL: `https://api.volara.chat/api/v1/user/timezone`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `timezone` | `string` | Yes | `"string"` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/user/timezone' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"timezone":"string"}'
```

### POST /api/v1/user/timezone/detect

Detect user timezone.

Full URL: `https://api.volara.chat/api/v1/user/timezone/detect`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `detected_timezone` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/user/timezone/detect' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"detected_timezone":"string"}'
```

### POST /api/v1/user/timezone/reset

Reset user timezone.

Full URL: `https://api.volara.chat/api/v1/user/timezone/reset`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/user/timezone/reset' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## API Tools

### GET /api/ai_tools

Full URL: `https://api.volara.chat/api/ai_tools`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/ai_tools' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/ai_tools

Full URL: `https://api.volara.chat/api/ai_tools`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/ai_tools' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### PUT /api/ai_tools

Full URL: `https://api.volara.chat/api/ai_tools`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/ai_tools' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### DELETE /api/ai_tools/{id}

Full URL: `https://api.volara.chat/api/ai_tools/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/ai_tools/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/ai_tools/{id}

Full URL: `https://api.volara.chat/api/ai_tools/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/ai_tools/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### POST /api/ai_tools/execute

Full URL: `https://api.volara.chat/api/ai_tools/execute`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/ai_tools/execute' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### GET /api/v1/ai_tools

Full URL: `https://api.volara.chat/api/v1/ai_tools`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/ai_tools' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/ai_tools

Full URL: `https://api.volara.chat/api/v1/ai_tools`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/ai_tools' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### PUT /api/v1/ai_tools

Full URL: `https://api.volara.chat/api/v1/ai_tools`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/ai_tools' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### DELETE /api/v1/ai_tools/{id}

Full URL: `https://api.volara.chat/api/v1/ai_tools/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/ai_tools/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/ai_tools/{id}

Full URL: `https://api.volara.chat/api/v1/ai_tools/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/ai_tools/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### POST /api/v1/ai_tools/execute

Full URL: `https://api.volara.chat/api/v1/ai_tools/execute`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/ai_tools/execute' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

## Compatibility

### GET /api/ai-providers

List configured AI providers.

Full URL: `https://api.volara.chat/api/ai-providers`
Headers: `Authorization: Bearer <token>; x-org-slug or x-app-id`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/ai-providers' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/ai-providers/{provider}

Upsert provider configuration.

Full URL: `https://api.volara.chat/api/ai-providers/{provider}`
Headers: `Content-Type: application/json; Authorization: Bearer <token>; x-org-slug or x-app-id`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `provider` | `string` | Yes | `"openai"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `api_key` | `string` | No | `"sk-..."` |
| `base_url` | `string` | No | `"https://api.openai.com/v1"` |
| `model_name` | `string` | No | `"gpt-4o-mini"` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/ai-providers/{provider}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"api_key":"sk-...","base_url":"https://api.openai.com/v1","model_name":"gpt-4o-mini"}'
```

### PATCH /api/ai-providers/active

Set active AI provider.

Full URL: `https://api.volara.chat/api/ai-providers/active`
Headers: `Content-Type: application/json; Authorization: Bearer <token>; x-org-slug or x-app-id`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `provider` | `string` | Yes | `"openai"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/ai-providers/active' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"provider":"openai"}'
```

### GET /api/ai-settings

Compatibility endpoint for AI settings.

Full URL: `https://api.volara.chat/api/ai-settings`
Headers: `Authorization: Bearer <token>; x-org-slug or x-app-id`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"org-slug-or-app-id"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/ai-settings' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/ai-settings

Update AI settings compatibility endpoint.

Full URL: `https://api.volara.chat/api/ai-settings`
Headers: `Content-Type: application/json; Authorization: Bearer <token>; x-org-slug or x-app-id`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `model_provider` | `string` | No | `"openai"` |
| `model_name` | `string` | No | `"gpt-4o-mini"` |
| `temperature` | `number` | No | `0.7` |
| `max_tokens` | `number` | No | `500` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/ai-settings' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"model_provider":"openai","model_name":"gpt-4o-mini","temperature":0.7,"max_tokens":500}'
```

## AI

### POST /api/ai/evaluate

Full URL: `https://api.volara.chat/api/ai/evaluate`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `conversationId` | `string` | Yes | `"string"` |
| `score` | `number` | Yes | `0` |
| `feedback` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/ai/evaluate' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"appId":"string","conversationId":"string","score":0,"feedback":"string"}'
```

### POST /api/ai/generate

Full URL: `https://api.volara.chat/api/ai/generate`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `message` | `string` | Yes | `"string"` |
| `conversationId` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/ai/generate' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"message":"string","conversationId":"string"}'
```

### GET /api/ai/providers

Full URL: `https://api.volara.chat/api/ai/providers`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/ai/providers' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/ai/providers/{provider}

Full URL: `https://api.volara.chat/api/ai/providers/{provider}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `provider` | `union` | Yes | `"azure"` |

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/ai/providers/{provider}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/ai/providers/active

Full URL: `https://api.volara.chat/api/ai/providers/active`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/ai/providers/active' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/ai/settings

Full URL: `https://api.volara.chat/api/ai/settings`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/ai/settings' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/ai/settings

Full URL: `https://api.volara.chat/api/ai/settings`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/ai/settings' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/ai/suggest/{conversationId}

Full URL: `https://api.volara.chat/api/ai/suggest/{conversationId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/ai/suggest/{conversationId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/orchestration/agents

Full URL: `https://api.volara.chat/api/orchestration/agents`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/orchestration/agents' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/orchestration/decide

Full URL: `https://api.volara.chat/api/orchestration/decide`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/orchestration/decide' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/orchestration/handoff

Full URL: `https://api.volara.chat/api/orchestration/handoff`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/orchestration/handoff' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/orchestration/handoffs/{conversationId}

Full URL: `https://api.volara.chat/api/orchestration/handoffs/{conversationId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/orchestration/handoffs/{conversationId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/ai/evaluate

Full URL: `https://api.volara.chat/api/v1/ai/evaluate`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `conversationId` | `string` | Yes | `"string"` |
| `score` | `number` | Yes | `0` |
| `feedback` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/ai/evaluate' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"appId":"string","conversationId":"string","score":0,"feedback":"string"}'
```

### POST /api/v1/ai/generate

Full URL: `https://api.volara.chat/api/v1/ai/generate`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `message` | `string` | Yes | `"string"` |
| `conversationId` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/ai/generate' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"message":"string","conversationId":"string"}'
```

### GET /api/v1/ai/providers

Full URL: `https://api.volara.chat/api/v1/ai/providers`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/ai/providers' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/ai/providers/{provider}

Full URL: `https://api.volara.chat/api/v1/ai/providers/{provider}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `provider` | `union` | Yes | `"azure"` |

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/ai/providers/{provider}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/ai/providers/active

Full URL: `https://api.volara.chat/api/v1/ai/providers/active`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/ai/providers/active' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/ai/settings

Full URL: `https://api.volara.chat/api/v1/ai/settings`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/ai/settings' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/ai/settings

Full URL: `https://api.volara.chat/api/v1/ai/settings`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/ai/settings' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/ai/suggest/{conversationId}

Full URL: `https://api.volara.chat/api/v1/ai/suggest/{conversationId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/ai/suggest/{conversationId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/orchestration/agents

Full URL: `https://api.volara.chat/api/v1/orchestration/agents`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/orchestration/agents' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/orchestration/decide

Full URL: `https://api.volara.chat/api/v1/orchestration/decide`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/orchestration/decide' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/orchestration/handoff

Full URL: `https://api.volara.chat/api/v1/orchestration/handoff`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/orchestration/handoff' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/orchestration/handoffs/{conversationId}

Full URL: `https://api.volara.chat/api/v1/orchestration/handoffs/{conversationId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/orchestration/handoffs/{conversationId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Authority

### POST /api/auth/login

Full URL: `https://api.volara.chat/api/auth/login`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `email` | `string` | Yes | `"string"` |
| `password` | `string` | Yes | `"string"` |
| `app_id` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/auth/login' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"email":"string","password":"string","app_id":"string"}'
```

### POST /api/auth/logout

Full URL: `https://api.volara.chat/api/auth/logout`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/auth/logout' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/auth/me

Full URL: `https://api.volara.chat/api/auth/me`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/auth/me' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Advanced

### GET /api/auto-assign/rules

Rules.

Full URL: `https://api.volara.chat/api/auto-assign/rules`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/auto-assign/rules' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/auto-assign/rules

Full URL: `https://api.volara.chat/api/auto-assign/rules`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/auto-assign/rules' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/auto-assign/rules/{id}

Full URL: `https://api.volara.chat/api/auto-assign/rules/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/auto-assign/rules/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/auto-assign/rules/{id}

Full URL: `https://api.volara.chat/api/auto-assign/rules/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/auto-assign/rules/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/auto-assign/sla

SLA Policies.

Full URL: `https://api.volara.chat/api/auto-assign/sla`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/auto-assign/sla' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/auto-assign/sla

Full URL: `https://api.volara.chat/api/auto-assign/sla`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/auto-assign/sla' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/auto-assign/sla/{id}

Full URL: `https://api.volara.chat/api/auto-assign/sla/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/auto-assign/sla/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/auto-assign/sla/breaches

Breaches.

Full URL: `https://api.volara.chat/api/auto-assign/sla/breaches`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/auto-assign/sla/breaches' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/forms

Full URL: `https://api.volara.chat/api/forms`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/forms' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/forms

Full URL: `https://api.volara.chat/api/forms`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/forms' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/forms/{id}

Full URL: `https://api.volara.chat/api/forms/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/forms/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/forms/conversation/{id}

Full URL: `https://api.volara.chat/api/forms/conversation/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/forms/conversation/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/forms/conversation/{id}/extract

Full URL: `https://api.volara.chat/api/forms/conversation/{id}/extract`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/forms/conversation/{id}/extract' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/metrics/ai

Full URL: `https://api.volara.chat/api/metrics/ai`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/metrics/ai' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/metrics/dashboard

Full URL: `https://api.volara.chat/api/metrics/dashboard`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/metrics/dashboard' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/metrics/summary

Full URL: `https://api.volara.chat/api/metrics/summary`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `period` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/metrics/summary' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/auto-assign/rules

Rules.

Full URL: `https://api.volara.chat/api/v1/auto-assign/rules`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/auto-assign/rules' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/auto-assign/rules

Full URL: `https://api.volara.chat/api/v1/auto-assign/rules`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/auto-assign/rules' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/auto-assign/rules/{id}

Full URL: `https://api.volara.chat/api/v1/auto-assign/rules/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/auto-assign/rules/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/auto-assign/rules/{id}

Full URL: `https://api.volara.chat/api/v1/auto-assign/rules/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/auto-assign/rules/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/auto-assign/sla

SLA Policies.

Full URL: `https://api.volara.chat/api/v1/auto-assign/sla`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/auto-assign/sla' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/auto-assign/sla

Full URL: `https://api.volara.chat/api/v1/auto-assign/sla`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/auto-assign/sla' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/auto-assign/sla/{id}

Full URL: `https://api.volara.chat/api/v1/auto-assign/sla/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/auto-assign/sla/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/auto-assign/sla/breaches

Breaches.

Full URL: `https://api.volara.chat/api/v1/auto-assign/sla/breaches`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/auto-assign/sla/breaches' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/forms

Full URL: `https://api.volara.chat/api/v1/forms`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/forms' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/forms

Full URL: `https://api.volara.chat/api/v1/forms`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/forms' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/forms/{id}

Full URL: `https://api.volara.chat/api/v1/forms/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/forms/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/forms/conversation/{id}

Full URL: `https://api.volara.chat/api/v1/forms/conversation/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/forms/conversation/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/forms/conversation/{id}/extract

Full URL: `https://api.volara.chat/api/v1/forms/conversation/{id}/extract`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/forms/conversation/{id}/extract' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/metrics/ai

Full URL: `https://api.volara.chat/api/v1/metrics/ai`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/metrics/ai' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/metrics/dashboard

Full URL: `https://api.volara.chat/api/v1/metrics/dashboard`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/metrics/dashboard' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/metrics/summary

Full URL: `https://api.volara.chat/api/v1/metrics/summary`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `period` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/metrics/summary' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Billing

### GET /api/billing/balance

Full URL: `https://api.volara.chat/api/billing/balance`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/billing/balance' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/billing/packages

Full URL: `https://api.volara.chat/api/billing/packages`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/billing/packages' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/billing/top-up

Full URL: `https://api.volara.chat/api/billing/top-up`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `packageId` | `string` | Yes | `"string"` |
| `email` | `string` | No | `"string"` |
| `referenceId` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/billing/top-up' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"packageId":"string","email":"string","referenceId":"string"}'
```

### POST /api/billing/top-up/create-invoice

Full URL: `https://api.volara.chat/api/billing/top-up/create-invoice`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `packageName` | `string` | Yes | `"string"` |
| `email` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/billing/top-up/create-invoice' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"packageName":"string","email":"string"}'
```

### GET /api/billing/transactions

Full URL: `https://api.volara.chat/api/billing/transactions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/billing/transactions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/billing/balance

Full URL: `https://api.volara.chat/api/v1/billing/balance`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/billing/balance' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/billing/packages

Full URL: `https://api.volara.chat/api/v1/billing/packages`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/billing/packages' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/billing/top-up

Full URL: `https://api.volara.chat/api/v1/billing/top-up`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `packageId` | `string` | Yes | `"string"` |
| `email` | `string` | No | `"string"` |
| `referenceId` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/billing/top-up' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"packageId":"string","email":"string","referenceId":"string"}'
```

### POST /api/v1/billing/top-up/create-invoice

Full URL: `https://api.volara.chat/api/v1/billing/top-up/create-invoice`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `packageName` | `string` | Yes | `"string"` |
| `email` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/billing/top-up/create-invoice' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"packageName":"string","email":"string"}'
```

### GET /api/v1/billing/transactions

Full URL: `https://api.volara.chat/api/v1/billing/transactions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/billing/transactions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Broadcast

### GET /api/broadcasts

Full URL: `https://api.volara.chat/api/broadcasts`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/broadcasts' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/broadcasts

Full URL: `https://api.volara.chat/api/broadcasts`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/broadcasts' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/broadcasts/{id}

Full URL: `https://api.volara.chat/api/broadcasts/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/broadcasts/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/broadcasts/{id}/send

Full URL: `https://api.volara.chat/api/broadcasts/{id}/send`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/broadcasts/{id}/send' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/broadcasts/jobs

Full URL: `https://api.volara.chat/api/broadcasts/jobs`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `page` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `status` | `string` | No | `"string"` |
| `statuses` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/broadcasts/jobs' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/broadcasts/jobs/{id}

Full URL: `https://api.volara.chat/api/broadcasts/jobs/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/broadcasts/jobs/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/broadcasts

Full URL: `https://api.volara.chat/api/v1/broadcasts`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/broadcasts' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/broadcasts

Full URL: `https://api.volara.chat/api/v1/broadcasts`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/broadcasts' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/broadcasts/{id}

Full URL: `https://api.volara.chat/api/v1/broadcasts/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/broadcasts/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/broadcasts/{id}/send

Full URL: `https://api.volara.chat/api/v1/broadcasts/{id}/send`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/broadcasts/{id}/send' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/broadcasts/jobs

Full URL: `https://api.volara.chat/api/v1/broadcasts/jobs`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `page` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `status` | `string` | No | `"string"` |
| `statuses` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/broadcasts/jobs' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/broadcasts/jobs/{id}

Full URL: `https://api.volara.chat/api/v1/broadcasts/jobs/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/broadcasts/jobs/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Business Webhooks

### GET /api/business_webhooks

Full URL: `https://api.volara.chat/api/business_webhooks`
Headers: `x-business-id: <business-id>; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/business_webhooks' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  -H 'x-business-id: <business-id>'
```

### POST /api/business_webhooks

Full URL: `https://api.volara.chat/api/business_webhooks`
Headers: `Content-Type: application/json; x-business-id: <business-id>; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/business_webhooks' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  -H 'x-business-id: <business-id>' \
  --data '{"key":"value"}'
```

### DELETE /api/business_webhooks/{id}

Full URL: `https://api.volara.chat/api/business_webhooks/{id}`
Headers: `Content-Type: application/json; x-business-id: <business-id>; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/business_webhooks/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  -H 'x-business-id: <business-id>'
```

### PATCH /api/business_webhooks/{id}

Full URL: `https://api.volara.chat/api/business_webhooks/{id}`
Headers: `Content-Type: application/json; x-business-id: <business-id>; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/business_webhooks/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  -H 'x-business-id: <business-id>' \
  --data '{"key":"value"}'
```

### GET /api/v1/business_webhooks

Full URL: `https://api.volara.chat/api/v1/business_webhooks`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/business_webhooks' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/business_webhooks

Full URL: `https://api.volara.chat/api/v1/business_webhooks`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/business_webhooks' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### DELETE /api/v1/business_webhooks/{id}

Full URL: `https://api.volara.chat/api/v1/business_webhooks/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/business_webhooks/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/business_webhooks/{id}

Full URL: `https://api.volara.chat/api/v1/business_webhooks/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/business_webhooks/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

## Message

### GET /api/canned-responses

Full URL: `https://api.volara.chat/api/canned-responses`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/canned-responses' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/canned-responses

Full URL: `https://api.volara.chat/api/canned-responses`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/canned-responses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/canned-responses/{id}

Full URL: `https://api.volara.chat/api/canned-responses/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/canned-responses/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/messages

Send a message.

Full URL: `https://api.volara.chat/api/messages`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |
| `senderId` | `string` | No | `"string"` |
| `content` | `string` | Yes | `"string"` |
| `contentType` | `string` | No | `"string"` |
| `mediaIds` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"conversationId":"string","senderId":"string","content":"string","contentType":"string","mediaIds":"string"}'
```

### DELETE /api/messages/{id}

Delete message (soft delete).

Full URL: `https://api.volara.chat/api/messages/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/messages/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/messages/{id}

Get message by ID.

Full URL: `https://api.volara.chat/api/messages/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/messages/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/messages/{id}/status

Update message status.

Full URL: `https://api.volara.chat/api/messages/{id}/status`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `status` | `string` | Yes | `"string"` |
| `externalId` | `string` | No | `"string"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/messages/{id}/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"status":"string","externalId":"string"}'
```

### GET /api/v1/canned-responses

Full URL: `https://api.volara.chat/api/v1/canned-responses`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/canned-responses' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/canned-responses

Full URL: `https://api.volara.chat/api/v1/canned-responses`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/canned-responses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/canned-responses/{id}

Full URL: `https://api.volara.chat/api/v1/canned-responses/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/canned-responses/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/messages

Send a message.

Full URL: `https://api.volara.chat/api/v1/messages`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |
| `senderId` | `string` | No | `"string"` |
| `content` | `string` | Yes | `"string"` |
| `contentType` | `string` | No | `"string"` |
| `mediaIds` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"conversationId":"string","senderId":"string","content":"string","contentType":"string","mediaIds":"string"}'
```

### DELETE /api/v1/messages/{id}

Delete message (soft delete).

Full URL: `https://api.volara.chat/api/v1/messages/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/messages/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/messages/{id}

Get message by ID.

Full URL: `https://api.volara.chat/api/v1/messages/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/messages/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/messages/{id}/status

Update message status.

Full URL: `https://api.volara.chat/api/v1/messages/{id}/status`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `status` | `string` | Yes | `"string"` |
| `externalId` | `string` | No | `"string"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/messages/{id}/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"status":"string","externalId":"string"}'
```

## Chatbot

### GET /api/chatbots

Full URL: `https://api.volara.chat/api/chatbots`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/chatbots' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/chatbots

Full URL: `https://api.volara.chat/api/chatbots`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/chatbots' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/chatbots/{id}

Full URL: `https://api.volara.chat/api/chatbots/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/chatbots/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/chatbots/{id}

Full URL: `https://api.volara.chat/api/chatbots/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/chatbots/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/chatbots/{id}

Full URL: `https://api.volara.chat/api/chatbots/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/chatbots/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/chatbots/{id}

Full URL: `https://api.volara.chat/api/chatbots/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/chatbots/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/chatbots/{id}/documents

Documents.

Full URL: `https://api.volara.chat/api/chatbots/{id}/documents`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/chatbots/{id}/documents' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/chatbots/{id}/documents

Full URL: `https://api.volara.chat/api/chatbots/{id}/documents`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `title` | `string` | Yes | `"string"` |
| `content` | `string` | Yes | `"string"` |
| `type` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/chatbots/{id}/documents' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"title":"string","content":"string","type":"string"}'
```

### DELETE /api/chatbots/{id}/documents/{docId}

Full URL: `https://api.volara.chat/api/chatbots/{id}/documents/{docId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `docId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/chatbots/{id}/documents/{docId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/chatbots/{id}/documents/{docId}

Full URL: `https://api.volara.chat/api/chatbots/{id}/documents/{docId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `docId` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/chatbots/{id}/documents/{docId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### POST /api/chatbots/{id}/simulate

Full URL: `https://api.volara.chat/api/chatbots/{id}/simulate`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/chatbots/{id}/simulate' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### GET /api/chatbots/model-pricing

Full URL: `https://api.volara.chat/api/chatbots/model-pricing`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/chatbots/model-pricing' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/chatbots

Full URL: `https://api.volara.chat/api/v1/chatbots`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/chatbots' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/chatbots

Full URL: `https://api.volara.chat/api/v1/chatbots`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/chatbots' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/chatbots/{id}

Full URL: `https://api.volara.chat/api/v1/chatbots/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/chatbots/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/chatbots/{id}

Full URL: `https://api.volara.chat/api/v1/chatbots/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/chatbots/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/chatbots/{id}

Full URL: `https://api.volara.chat/api/v1/chatbots/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/chatbots/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/chatbots/{id}

Full URL: `https://api.volara.chat/api/v1/chatbots/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/chatbots/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/chatbots/{id}/documents

Documents.

Full URL: `https://api.volara.chat/api/v1/chatbots/{id}/documents`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/chatbots/{id}/documents' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/chatbots/{id}/documents

Full URL: `https://api.volara.chat/api/v1/chatbots/{id}/documents`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `title` | `string` | Yes | `"string"` |
| `content` | `string` | Yes | `"string"` |
| `type` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/chatbots/{id}/documents' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"title":"string","content":"string","type":"string"}'
```

### DELETE /api/v1/chatbots/{id}/documents/{docId}

Full URL: `https://api.volara.chat/api/v1/chatbots/{id}/documents/{docId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `docId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/chatbots/{id}/documents/{docId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/chatbots/{id}/documents/{docId}

Full URL: `https://api.volara.chat/api/v1/chatbots/{id}/documents/{docId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `docId` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/chatbots/{id}/documents/{docId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### POST /api/v1/chatbots/{id}/simulate

Full URL: `https://api.volara.chat/api/v1/chatbots/{id}/simulate`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/chatbots/{id}/simulate' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### GET /api/v1/chatbots/model-pricing

Full URL: `https://api.volara.chat/api/v1/chatbots/model-pricing`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/chatbots/model-pricing' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Contact

### GET /api/contacts

Full URL: `https://api.volara.chat/api/contacts`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/contacts' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/contacts

Full URL: `https://api.volara.chat/api/contacts`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/contacts' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/contacts/{id}

Full URL: `https://api.volara.chat/api/contacts/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/contacts/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/contacts/{id}

Full URL: `https://api.volara.chat/api/contacts/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/contacts/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/contacts/{id}

Full URL: `https://api.volara.chat/api/contacts/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/contacts/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/contacts/{id}/conversations

Get conversations for a contact.

Full URL: `https://api.volara.chat/api/contacts/{id}/conversations`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/contacts/{id}/conversations' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/contacts/settings

Full URL: `https://api.volara.chat/api/contacts/settings`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/contacts/settings' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/contacts/settings/fields

Full URL: `https://api.volara.chat/api/contacts/settings/fields`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/contacts/settings/fields' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### DELETE /api/contacts/settings/fields/{id}

Full URL: `https://api.volara.chat/api/contacts/settings/fields/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/contacts/settings/fields/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/contacts/settings/fields/{id}

Full URL: `https://api.volara.chat/api/contacts/settings/fields/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/contacts/settings/fields/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### PATCH /api/contacts/settings/fields/reorder

Full URL: `https://api.volara.chat/api/contacts/settings/fields/reorder`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `fieldIds` | `string` | Yes | `"string"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/contacts/settings/fields/reorder' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"fieldIds":"string"}'
```

### POST /api/contacts/settings/stages

Full URL: `https://api.volara.chat/api/contacts/settings/stages`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | Yes | `"string"` |
| `color` | `string` | No | `"string"` |
| `isDefault` | `boolean` | No | `true` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/contacts/settings/stages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","color":"string","isDefault":true}'
```

### DELETE /api/contacts/settings/stages/{id}

Full URL: `https://api.volara.chat/api/contacts/settings/stages/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/contacts/settings/stages/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/contacts/settings/stages/{id}

Full URL: `https://api.volara.chat/api/contacts/settings/stages/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | No | `"string"` |
| `color` | `string` | No | `"string"` |
| `isDefault` | `boolean` | No | `true` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/contacts/settings/stages/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","color":"string","isDefault":true}'
```

### PATCH /api/contacts/settings/stages/reorder

Full URL: `https://api.volara.chat/api/contacts/settings/stages/reorder`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `stageIds` | `string` | Yes | `"string"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/contacts/settings/stages/reorder' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"stageIds":"string"}'
```

### GET /api/v1/contacts

Full URL: `https://api.volara.chat/api/v1/contacts`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/contacts' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/contacts

Full URL: `https://api.volara.chat/api/v1/contacts`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/contacts' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/contacts/{id}

Full URL: `https://api.volara.chat/api/v1/contacts/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/contacts/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/contacts/{id}

Full URL: `https://api.volara.chat/api/v1/contacts/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/contacts/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/contacts/{id}

Full URL: `https://api.volara.chat/api/v1/contacts/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/contacts/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/contacts/{id}/conversations

Get conversations for a contact.

Full URL: `https://api.volara.chat/api/v1/contacts/{id}/conversations`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/contacts/{id}/conversations' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/contacts/settings

Full URL: `https://api.volara.chat/api/v1/contacts/settings`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/contacts/settings' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/contacts/settings/fields

Full URL: `https://api.volara.chat/api/v1/contacts/settings/fields`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/contacts/settings/fields' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### DELETE /api/v1/contacts/settings/fields/{id}

Full URL: `https://api.volara.chat/api/v1/contacts/settings/fields/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/contacts/settings/fields/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/contacts/settings/fields/{id}

Full URL: `https://api.volara.chat/api/v1/contacts/settings/fields/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/contacts/settings/fields/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### PATCH /api/v1/contacts/settings/fields/reorder

Full URL: `https://api.volara.chat/api/v1/contacts/settings/fields/reorder`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `fieldIds` | `string` | Yes | `"string"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/contacts/settings/fields/reorder' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"fieldIds":"string"}'
```

### POST /api/v1/contacts/settings/stages

Full URL: `https://api.volara.chat/api/v1/contacts/settings/stages`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | Yes | `"string"` |
| `color` | `string` | No | `"string"` |
| `isDefault` | `boolean` | No | `true` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/contacts/settings/stages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","color":"string","isDefault":true}'
```

### DELETE /api/v1/contacts/settings/stages/{id}

Full URL: `https://api.volara.chat/api/v1/contacts/settings/stages/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/contacts/settings/stages/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/contacts/settings/stages/{id}

Full URL: `https://api.volara.chat/api/v1/contacts/settings/stages/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | No | `"string"` |
| `color` | `string` | No | `"string"` |
| `isDefault` | `boolean` | No | `true` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/contacts/settings/stages/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","color":"string","isDefault":true}'
```

### PATCH /api/v1/contacts/settings/stages/reorder

Full URL: `https://api.volara.chat/api/v1/contacts/settings/stages/reorder`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `stageIds` | `string` | Yes | `"string"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/contacts/settings/stages/reorder' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"stageIds":"string"}'
```

## Conversation

### GET /api/conversations

List conversations with filters.

Full URL: `https://api.volara.chat/api/conversations`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |
| `appId` | `string` | No | `"string"` |
| `status` | `string` | No | `"string"` |
| `inboxId` | `string` | No | `"string"` |
| `agentId` | `string` | No | `"string"` |
| `priority` | `string` | No | `"string"` |
| `page` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `dateFrom` | `string` | No | `"string"` |
| `dateTo` | `string` | No | `"string"` |
| `labelIds` | `string` | No | `"string"` |
| `resolvedBy` | `string` | No | `"string"` |
| `aiAgentId` | `string` | No | `"string"` |
| `pipelineStageId` | `string` | No | `"string"` |
| `channelType` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/conversations' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/conversations/{id}

Get conversation by ID.

Full URL: `https://api.volara.chat/api/conversations/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/conversations/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/conversations/{id}/activity

=== Activity Log ===.

Full URL: `https://api.volara.chat/api/conversations/{id}/activity`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/conversations/{id}/activity' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/conversations/{id}/agents

Full URL: `https://api.volara.chat/api/conversations/{id}/agents`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/conversations/{id}/agents' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/conversations/{id}/agents

=== Agents ===.

Full URL: `https://api.volara.chat/api/conversations/{id}/agents`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `agentId` | `string` | No | `"string"` |
| `agent_id` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/conversations/{id}/agents' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"agentId":"string","agent_id":"string"}'
```

### DELETE /api/conversations/{id}/agents/{agentId}

Full URL: `https://api.volara.chat/api/conversations/{id}/agents/{agentId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `agentId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/conversations/{id}/agents/{agentId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/conversations/{id}/assign

Assign agent to conversation.

Full URL: `https://api.volara.chat/api/conversations/{id}/assign`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `agentId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/conversations/{id}/assign' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"agentId":"string"}'
```

### GET /api/conversations/{id}/labels

=== Labels ===.

Full URL: `https://api.volara.chat/api/conversations/{id}/labels`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/conversations/{id}/labels' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/conversations/{id}/labels

Full URL: `https://api.volara.chat/api/conversations/{id}/labels`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `labelId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/conversations/{id}/labels' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"labelId":"string"}'
```

### DELETE /api/conversations/{id}/labels/{labelId}

Full URL: `https://api.volara.chat/api/conversations/{id}/labels/{labelId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `labelId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/conversations/{id}/labels/{labelId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/conversations/{id}/messages

Get conversation messages.

Full URL: `https://api.volara.chat/api/conversations/{id}/messages`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `limit` | `string` | No | `"string"` |
| `before` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/conversations/{id}/messages' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/conversations/{id}/messages

Full URL: `https://api.volara.chat/api/conversations/{id}/messages`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/conversations/{id}/messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### GET /api/conversations/{id}/notes

=== Notes ===.

Full URL: `https://api.volara.chat/api/conversations/{id}/notes`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/conversations/{id}/notes' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/conversations/{id}/notes

Full URL: `https://api.volara.chat/api/conversations/{id}/notes`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `content` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/conversations/{id}/notes' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"content":"string"}'
```

### PATCH /api/conversations/{id}/notes/{noteId}

Full URL: `https://api.volara.chat/api/conversations/{id}/notes/{noteId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `noteId` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `content` | `string` | Yes | `"string"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/conversations/{id}/notes/{noteId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"content":"string"}'
```

### POST /api/conversations/{id}/read

Mark conversation as read.

Full URL: `https://api.volara.chat/api/conversations/{id}/read`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/conversations/{id}/read' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/conversations/{id}/resolve

Resolve conversation (shortcut).

Full URL: `https://api.volara.chat/api/conversations/{id}/resolve`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/conversations/{id}/resolve' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/conversations/{id}/status

Update conversation status (PATCH).

Full URL: `https://api.volara.chat/api/conversations/{id}/status`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `status` | `string` | Yes | `"string"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/conversations/{id}/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"status":"string"}'
```

### POST /api/conversations/{id}/status

Update conversation status (POST — frontend uses POST).

Full URL: `https://api.volara.chat/api/conversations/{id}/status`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `status` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/conversations/{id}/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"status":"string"}'
```

### POST /api/conversations/{id}/takeover

Take over conversation with current authenticated agent.

Full URL: `https://api.volara.chat/api/conversations/{id}/takeover`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `agentId` | `string` | No | `"string"` |
| `agent_id` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/conversations/{id}/takeover' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"agentId":"string","agent_id":"string"}'
```

### POST /api/conversations/bulk-edit

Queue bulk-edit conversation actions.

Full URL: `https://api.volara.chat/api/conversations/bulk-edit`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationIds` | `string` | Yes | `"string"` |
| `collaboratorIds` | `string` | No | `"string"` |
| `handledById` | `string` | No | `"string"` |
| `labelId` | `string` | No | `"string"` |
| `pipelineStageId` | `string` | No | `"string"` |
| `resolveStatus` | `union` | No | `"open"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/conversations/bulk-edit' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"conversationIds":"string","collaboratorIds":"string","handledById":"string","labelId":"string","pipelineStageId":"string","resolveStatus":"open"}'
```

### GET /api/conversations/bulk-edit/{jobId}

Get bulk-edit job status.

Full URL: `https://api.volara.chat/api/conversations/bulk-edit/{jobId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `jobId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/conversations/bulk-edit/{jobId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/conversations/counts

Get conversation status counts.

Full URL: `https://api.volara.chat/api/conversations/counts`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/conversations/counts' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/conversations

List conversations with filters.

Full URL: `https://api.volara.chat/api/v1/conversations`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |
| `appId` | `string` | No | `"string"` |
| `status` | `string` | No | `"string"` |
| `inboxId` | `string` | No | `"string"` |
| `agentId` | `string` | No | `"string"` |
| `priority` | `string` | No | `"string"` |
| `page` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `dateFrom` | `string` | No | `"string"` |
| `dateTo` | `string` | No | `"string"` |
| `labelIds` | `string` | No | `"string"` |
| `resolvedBy` | `string` | No | `"string"` |
| `aiAgentId` | `string` | No | `"string"` |
| `pipelineStageId` | `string` | No | `"string"` |
| `channelType` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/conversations' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/conversations/{id}

Get conversation by ID.

Full URL: `https://api.volara.chat/api/v1/conversations/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/conversations/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/conversations/{id}/activity

=== Activity Log ===.

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/activity`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/conversations/{id}/activity' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/conversations/{id}/agents

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/agents`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/conversations/{id}/agents' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/conversations/{id}/agents

=== Agents ===.

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/agents`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `agentId` | `string` | No | `"string"` |
| `agent_id` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/conversations/{id}/agents' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"agentId":"string","agent_id":"string"}'
```

### DELETE /api/v1/conversations/{id}/agents/{agentId}

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/agents/{agentId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `agentId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/conversations/{id}/agents/{agentId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/conversations/{id}/assign

Assign agent to conversation.

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/assign`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `agentId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/conversations/{id}/assign' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"agentId":"string"}'
```

### GET /api/v1/conversations/{id}/labels

=== Labels ===.

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/labels`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/conversations/{id}/labels' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/conversations/{id}/labels

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/labels`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `labelId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/conversations/{id}/labels' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"labelId":"string"}'
```

### DELETE /api/v1/conversations/{id}/labels/{labelId}

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/labels/{labelId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `labelId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/conversations/{id}/labels/{labelId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/conversations/{id}/messages

Get conversation messages.

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/messages`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `limit` | `string` | No | `"string"` |
| `before` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/conversations/{id}/messages' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/conversations/{id}/messages

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/messages`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/conversations/{id}/messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### GET /api/v1/conversations/{id}/notes

=== Notes ===.

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/notes`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/conversations/{id}/notes' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/conversations/{id}/notes

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/notes`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `content` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/conversations/{id}/notes' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"content":"string"}'
```

### PATCH /api/v1/conversations/{id}/notes/{noteId}

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/notes/{noteId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `noteId` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `content` | `string` | Yes | `"string"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/conversations/{id}/notes/{noteId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"content":"string"}'
```

### POST /api/v1/conversations/{id}/read

Mark conversation as read.

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/read`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/conversations/{id}/read' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/conversations/{id}/resolve

Resolve conversation (shortcut).

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/resolve`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/conversations/{id}/resolve' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/conversations/{id}/status

Update conversation status (PATCH).

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/status`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `status` | `string` | Yes | `"string"` |

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/conversations/{id}/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"status":"string"}'
```

### POST /api/v1/conversations/{id}/status

Update conversation status (POST — frontend uses POST).

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/status`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `status` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/conversations/{id}/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"status":"string"}'
```

### POST /api/v1/conversations/{id}/takeover

Take over conversation with current authenticated agent.

Full URL: `https://api.volara.chat/api/v1/conversations/{id}/takeover`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `agentId` | `string` | No | `"string"` |
| `agent_id` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/conversations/{id}/takeover' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"agentId":"string","agent_id":"string"}'
```

### POST /api/v1/conversations/bulk-edit

Queue bulk-edit conversation actions.

Full URL: `https://api.volara.chat/api/v1/conversations/bulk-edit`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationIds` | `string` | Yes | `"string"` |
| `collaboratorIds` | `string` | No | `"string"` |
| `handledById` | `string` | No | `"string"` |
| `labelId` | `string` | No | `"string"` |
| `pipelineStageId` | `string` | No | `"string"` |
| `resolveStatus` | `union` | No | `"open"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/conversations/bulk-edit' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"conversationIds":"string","collaboratorIds":"string","handledById":"string","labelId":"string","pipelineStageId":"string","resolveStatus":"open"}'
```

### GET /api/v1/conversations/bulk-edit/{jobId}

Get bulk-edit job status.

Full URL: `https://api.volara.chat/api/v1/conversations/bulk-edit/{jobId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `jobId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/conversations/bulk-edit/{jobId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/conversations/counts

Get conversation status counts.

Full URL: `https://api.volara.chat/api/v1/conversations/counts`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/conversations/counts' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## CRM

### GET /api/crm/deals/{conversationId}

Full URL: `https://api.volara.chat/api/crm/deals/{conversationId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/crm/deals/{conversationId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/crm/deals/{conversationId}

Full URL: `https://api.volara.chat/api/crm/deals/{conversationId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/crm/deals/{conversationId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/crm/pipelines

Full URL: `https://api.volara.chat/api/crm/pipelines`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/crm/pipelines' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/crm/pipelines

Full URL: `https://api.volara.chat/api/crm/pipelines`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/crm/pipelines' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/crm/pipelines/{id}

Full URL: `https://api.volara.chat/api/crm/pipelines/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/crm/pipelines/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/crm/deals/{conversationId}

Full URL: `https://api.volara.chat/api/v1/crm/deals/{conversationId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/crm/deals/{conversationId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/crm/deals/{conversationId}

Full URL: `https://api.volara.chat/api/v1/crm/deals/{conversationId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/crm/deals/{conversationId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/crm/pipelines

Full URL: `https://api.volara.chat/api/v1/crm/pipelines`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/crm/pipelines' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/crm/pipelines

Full URL: `https://api.volara.chat/api/v1/crm/pipelines`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/crm/pipelines' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/crm/pipelines/{id}

Full URL: `https://api.volara.chat/api/v1/crm/pipelines/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/crm/pipelines/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Customer

### GET /api/customers

Full URL: `https://api.volara.chat/api/customers`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `page` | `string` | No | `"string"` |
| `per_page` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |
| `pipeline_stage_id` | `string` | No | `"string"` |
| `consent_status` | `string` | No | `"string"` |
| `tag_id` | `string` | No | `"string"` |
| `channel` | `string` | No | `"string"` |
| `sort` | `string` | No | `"string"` |
| `order` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/customers' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/customers/{id}

Full URL: `https://api.volara.chat/api/customers/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/customers/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/customers/{id}

Full URL: `https://api.volara.chat/api/customers/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/customers/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### POST /api/customers/{id}/tags

Full URL: `https://api.volara.chat/api/customers/{id}/tags`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `tag_id` | `string` | No | `"string"` |
| `tag_name` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/customers/{id}/tags' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"tag_id":"string","tag_name":"string"}'
```

### DELETE /api/customers/{id}/tags/{tagId}

Full URL: `https://api.volara.chat/api/customers/{id}/tags/{tagId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `tagId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/customers/{id}/tags/{tagId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/customers/stats

Full URL: `https://api.volara.chat/api/customers/stats`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/customers/stats' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/customers

Full URL: `https://api.volara.chat/api/v1/customers`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `page` | `string` | No | `"string"` |
| `per_page` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |
| `pipeline_stage_id` | `string` | No | `"string"` |
| `consent_status` | `string` | No | `"string"` |
| `tag_id` | `string` | No | `"string"` |
| `channel` | `string` | No | `"string"` |
| `sort` | `string` | No | `"string"` |
| `order` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/customers' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/customers/{id}

Full URL: `https://api.volara.chat/api/v1/customers/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/customers/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/customers/{id}

Full URL: `https://api.volara.chat/api/v1/customers/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `*` | `any` | No | `{"key":"value"}` |

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/customers/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"key":"value"}'
```

### POST /api/v1/customers/{id}/tags

Full URL: `https://api.volara.chat/api/v1/customers/{id}/tags`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `tag_id` | `string` | No | `"string"` |
| `tag_name` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/customers/{id}/tags' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"tag_id":"string","tag_name":"string"}'
```

### DELETE /api/v1/customers/{id}/tags/{tagId}

Full URL: `https://api.volara.chat/api/v1/customers/{id}/tags/{tagId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `tagId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/customers/{id}/tags/{tagId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/customers/stats

Full URL: `https://api.volara.chat/api/v1/customers/stats`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/customers/stats' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Developer Keys

### GET /api/developer_keys

Full URL: `https://api.volara.chat/api/developer_keys`
Headers: `x-business-id: <business-id>; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/developer_keys' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  -H 'x-business-id: <business-id>'
```

### POST /api/developer_keys/regenerate

Full URL: `https://api.volara.chat/api/developer_keys/regenerate`
Headers: `Content-Type: application/json; x-business-id: <business-id>; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `business_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/developer_keys/regenerate' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  -H 'x-business-id: <business-id>'
```

## Flow

### GET /api/flows

Full URL: `https://api.volara.chat/api/flows`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/flows' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/flows

Full URL: `https://api.volara.chat/api/flows`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/flows' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/flows/{id}

Full URL: `https://api.volara.chat/api/flows/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/flows/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/flows/{id}

Full URL: `https://api.volara.chat/api/flows/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/flows/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/flows/{id}

Full URL: `https://api.volara.chat/api/flows/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/flows/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/flows

Full URL: `https://api.volara.chat/api/v1/flows`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/flows' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/flows

Full URL: `https://api.volara.chat/api/v1/flows`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/flows' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/flows/{id}

Full URL: `https://api.volara.chat/api/v1/flows/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/flows/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/flows/{id}

Full URL: `https://api.volara.chat/api/v1/flows/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/flows/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/flows/{id}

Full URL: `https://api.volara.chat/api/v1/flows/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/flows/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Inbox

### GET /api/inboxes

Full URL: `https://api.volara.chat/api/inboxes`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/inboxes' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/inboxes

Full URL: `https://api.volara.chat/api/inboxes`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/inboxes' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/inboxes/{id}

Full URL: `https://api.volara.chat/api/inboxes/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/inboxes/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/inboxes/{id}

Full URL: `https://api.volara.chat/api/inboxes/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/inboxes/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/inboxes/{id}

Full URL: `https://api.volara.chat/api/inboxes/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/inboxes/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/inboxes

Full URL: `https://api.volara.chat/api/v1/inboxes`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/inboxes' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/inboxes

Full URL: `https://api.volara.chat/api/v1/inboxes`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/inboxes' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/inboxes/{id}

Full URL: `https://api.volara.chat/api/v1/inboxes/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/inboxes/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/inboxes/{id}

Full URL: `https://api.volara.chat/api/v1/inboxes/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/inboxes/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/inboxes/{id}

Full URL: `https://api.volara.chat/api/v1/inboxes/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/inboxes/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Instagram

### GET /api/instagram-channels

Full URL: `https://api.volara.chat/api/instagram-channels`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/instagram-channels' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/instagram-channels/{id}

Full URL: `https://api.volara.chat/api/instagram-channels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/instagram-channels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/instagram-channels/{id}/status

Full URL: `https://api.volara.chat/api/instagram-channels/{id}/status`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/instagram-channels/{id}/status' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/instagram-channels/callback

Full URL: `https://api.volara.chat/api/instagram-channels/callback`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `code` | `string` | No | `"string"` |
| `state` | `string` | No | `"string"` |
| `hub.mode` | `string` | No | `"string"` |
| `hub.verify_token` | `string` | No | `"string"` |
| `hub.challenge` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/instagram-channels/callback' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/instagram-channels/callback

Instagram Webhook Payload (POST) - receives DMs, comments, etc..

Full URL: `https://api.volara.chat/api/instagram-channels/callback`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/instagram-channels/callback' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/instagram-channels/init-login

Full URL: `https://api.volara.chat/api/instagram-channels/init-login`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/instagram-channels/init-login' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/instagram-channels

Full URL: `https://api.volara.chat/api/v1/instagram-channels`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/instagram-channels' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/instagram-channels/{id}

Full URL: `https://api.volara.chat/api/v1/instagram-channels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/instagram-channels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/instagram-channels/{id}/status

Full URL: `https://api.volara.chat/api/v1/instagram-channels/{id}/status`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/instagram-channels/{id}/status' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/instagram-channels/callback

Full URL: `https://api.volara.chat/api/v1/instagram-channels/callback`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `code` | `string` | No | `"string"` |
| `state` | `string` | No | `"string"` |
| `hub.mode` | `string` | No | `"string"` |
| `hub.verify_token` | `string` | No | `"string"` |
| `hub.challenge` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/instagram-channels/callback' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/instagram-channels/callback

Instagram Webhook Payload (POST) - receives DMs, comments, etc..

Full URL: `https://api.volara.chat/api/v1/instagram-channels/callback`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/instagram-channels/callback' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/instagram-channels/init-login

Full URL: `https://api.volara.chat/api/v1/instagram-channels/init-login`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/instagram-channels/init-login' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Knowledge

### GET /api/knowledge/categories

Categories.

Full URL: `https://api.volara.chat/api/knowledge/categories`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `chatbotId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/knowledge/categories' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/knowledge/categories

Full URL: `https://api.volara.chat/api/knowledge/categories`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/knowledge/categories' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/knowledge/categories/{id}

Full URL: `https://api.volara.chat/api/knowledge/categories/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/knowledge/categories/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/knowledge/faqs

FAQs.

Full URL: `https://api.volara.chat/api/knowledge/faqs`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `chatbotId` | `string` | Yes | `"string"` |
| `categoryId` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/knowledge/faqs' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/knowledge/faqs

Full URL: `https://api.volara.chat/api/knowledge/faqs`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/knowledge/faqs' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/knowledge/faqs/{id}

Full URL: `https://api.volara.chat/api/knowledge/faqs/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/knowledge/faqs/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/knowledge/faqs/{id}

Full URL: `https://api.volara.chat/api/knowledge/faqs/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/knowledge/faqs/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/knowledge/sources

Sources (Mapped from FAQs for now or create service for it).

Full URL: `https://api.volara.chat/api/knowledge/sources`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `chatbotId` | `string` | No | `"string"` |
| `categoryId` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/knowledge/sources' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/knowledge/stats

Stats.

Full URL: `https://api.volara.chat/api/knowledge/stats`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `chatbotId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/knowledge/stats' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/knowledge/categories

Categories.

Full URL: `https://api.volara.chat/api/v1/knowledge/categories`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `chatbotId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/knowledge/categories' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/knowledge/categories

Full URL: `https://api.volara.chat/api/v1/knowledge/categories`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/knowledge/categories' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/knowledge/categories/{id}

Full URL: `https://api.volara.chat/api/v1/knowledge/categories/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/knowledge/categories/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/knowledge/faqs

FAQs.

Full URL: `https://api.volara.chat/api/v1/knowledge/faqs`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `chatbotId` | `string` | Yes | `"string"` |
| `categoryId` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/knowledge/faqs' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/knowledge/faqs

Full URL: `https://api.volara.chat/api/v1/knowledge/faqs`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/knowledge/faqs' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/knowledge/faqs/{id}

Full URL: `https://api.volara.chat/api/v1/knowledge/faqs/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/knowledge/faqs/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/knowledge/faqs/{id}

Full URL: `https://api.volara.chat/api/v1/knowledge/faqs/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/knowledge/faqs/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/knowledge/sources

Sources (Mapped from FAQs for now or create service for it).

Full URL: `https://api.volara.chat/api/v1/knowledge/sources`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `chatbotId` | `string` | No | `"string"` |
| `categoryId` | `string` | No | `"string"` |
| `q` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/knowledge/sources' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/knowledge/stats

Stats.

Full URL: `https://api.volara.chat/api/v1/knowledge/stats`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `chatbotId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/knowledge/stats' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Label

### GET /api/labels

Full URL: `https://api.volara.chat/api/labels`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/labels' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/labels

Full URL: `https://api.volara.chat/api/labels`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/labels' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/labels/{id}

Full URL: `https://api.volara.chat/api/labels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/labels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/labels/{id}

Full URL: `https://api.volara.chat/api/labels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/labels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/labels/conversation/{id}

Conversation Labels.

Full URL: `https://api.volara.chat/api/labels/conversation/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/labels/conversation/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/labels/conversation/{id}

Full URL: `https://api.volara.chat/api/labels/conversation/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `labelId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/labels/conversation/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"labelId":"string"}'
```

### DELETE /api/labels/conversation/{id}/{labelId}

Full URL: `https://api.volara.chat/api/labels/conversation/{id}/{labelId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `labelId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/labels/conversation/{id}/{labelId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/labels

Full URL: `https://api.volara.chat/api/v1/labels`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/labels' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/labels

Full URL: `https://api.volara.chat/api/v1/labels`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/labels' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/labels/{id}

Full URL: `https://api.volara.chat/api/v1/labels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/labels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/labels/{id}

Full URL: `https://api.volara.chat/api/v1/labels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/labels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/labels/conversation/{id}

Conversation Labels.

Full URL: `https://api.volara.chat/api/v1/labels/conversation/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/labels/conversation/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/labels/conversation/{id}

Full URL: `https://api.volara.chat/api/v1/labels/conversation/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `labelId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/labels/conversation/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"labelId":"string"}'
```

### DELETE /api/v1/labels/conversation/{id}/{labelId}

Full URL: `https://api.volara.chat/api/v1/labels/conversation/{id}/{labelId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `labelId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/labels/conversation/{id}/{labelId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Media

### GET /api/media/gallery

Full URL: `https://api.volara.chat/api/media/gallery`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `type` | `string` | No | `"string"` |
| `take` | `string` | No | `"string"` |
| `cursor` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/media/gallery' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/media/upload

Full URL: `https://api.volara.chat/api/media/upload`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `file` | `file` | Yes | `"<binary file>"` |
| `platform` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/media/upload' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"file":"<binary file>","platform":"string"}'
```

### GET /api/v1/media/gallery

Full URL: `https://api.volara.chat/api/v1/media/gallery`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `type` | `string` | No | `"string"` |
| `take` | `string` | No | `"string"` |
| `cursor` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/media/gallery' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/media/upload

Full URL: `https://api.volara.chat/api/v1/media/upload`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `file` | `file` | Yes | `"<binary file>"` |
| `platform` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/media/upload' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"file":"<binary file>","platform":"string"}'
```

## n8n Automation

### GET /api/n8n/cookie

Full URL: `https://api.volara.chat/api/n8n/cookie`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/n8n/cookie' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/n8n/embed

Full URL: `https://api.volara.chat/api/n8n/embed`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/n8n/embed' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/n8n/embed-login

Full URL: `https://api.volara.chat/api/n8n/embed-login`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/n8n/embed-login' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/n8n/force

Full URL: `https://api.volara.chat/api/n8n/force`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/n8n/force' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/n8n/host

Full URL: `https://api.volara.chat/api/n8n/host`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/n8n/host' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/n8n/provision

Full URL: `https://api.volara.chat/api/n8n/provision`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/n8n/provision' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/n8n/x-forwarded-host

Full URL: `https://api.volara.chat/api/n8n/x-forwarded-host`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/n8n/x-forwarded-host' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/n8n/x-forwarded-proto

Full URL: `https://api.volara.chat/api/n8n/x-forwarded-proto`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/n8n/x-forwarded-proto' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/n8n/cookie

Full URL: `https://api.volara.chat/api/v1/n8n/cookie`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/n8n/cookie' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/n8n/embed

Full URL: `https://api.volara.chat/api/v1/n8n/embed`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/n8n/embed' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/n8n/embed-login

Full URL: `https://api.volara.chat/api/v1/n8n/embed-login`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/n8n/embed-login' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/n8n/force

Full URL: `https://api.volara.chat/api/v1/n8n/force`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/n8n/force' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/n8n/host

Full URL: `https://api.volara.chat/api/v1/n8n/host`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/n8n/host' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/n8n/provision

Full URL: `https://api.volara.chat/api/v1/n8n/provision`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/n8n/provision' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/n8n/x-forwarded-host

Full URL: `https://api.volara.chat/api/v1/n8n/x-forwarded-host`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/n8n/x-forwarded-host' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/n8n/x-forwarded-proto

Full URL: `https://api.volara.chat/api/v1/n8n/x-forwarded-proto`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/n8n/x-forwarded-proto' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Orders

### GET /api/orders

Full URL: `https://api.volara.chat/api/orders`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `page` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `payment_type` | `string` | No | `"string"` |
| `order_status` | `string` | No | `"string"` |
| `inbox_id` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |
| `sort_field` | `string` | No | `"string"` |
| `sort_direction` | `string` | No | `"string"` |
| `include_conv` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/orders' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/orders/report

Full URL: `https://api.volara.chat/api/orders/report`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `startDate` | `string` | No | `"string"` |
| `endDate` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/orders/report' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/orders/subscriptions

Full URL: `https://api.volara.chat/api/orders/subscriptions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `page` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |
| `sort_field` | `string` | No | `"string"` |
| `sort_direction` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/orders/subscriptions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/orders

Full URL: `https://api.volara.chat/api/v1/orders`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `page` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `payment_type` | `string` | No | `"string"` |
| `order_status` | `string` | No | `"string"` |
| `inbox_id` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |
| `sort_field` | `string` | No | `"string"` |
| `sort_direction` | `string` | No | `"string"` |
| `include_conv` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/orders' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/orders/report

Full URL: `https://api.volara.chat/api/v1/orders/report`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `startDate` | `string` | No | `"string"` |
| `endDate` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/orders/report' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/orders/subscriptions

Full URL: `https://api.volara.chat/api/v1/orders/subscriptions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `page` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |
| `sort_field` | `string` | No | `"string"` |
| `sort_direction` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/orders/subscriptions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Organization

### POST /api/organization/create

Full URL: `https://api.volara.chat/api/organization/create`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `name` | `string` | Yes | `"string"` |
| `slug` | `string` | Yes | `"string"` |
| `logo` | `string` | No | `"string"` |
| `description` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/organization/create' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"name":"string","slug":"string","logo":"string","description":"string"}'
```

### POST /api/organization/delete

Full URL: `https://api.volara.chat/api/organization/delete`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `organizationId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/organization/delete' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"organizationId":"string"}'
```

### GET /api/organization/get-active

Full URL: `https://api.volara.chat/api/organization/get-active`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/organization/get-active' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/organization/get-members

Full URL: `https://api.volara.chat/api/organization/get-members`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/organization/get-members' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/organization/invite-member

Full URL: `https://api.volara.chat/api/organization/invite-member`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `organizationId` | `string` | Yes | `"string"` |
| `email` | `string` | Yes | `"string"` |
| `role` | `union` | No | `"admin"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/organization/invite-member' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"organizationId":"string","email":"string","role":"admin"}'
```

### GET /api/organization/list

Full URL: `https://api.volara.chat/api/organization/list`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/organization/list' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/organization/remove-member

Full URL: `https://api.volara.chat/api/organization/remove-member`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `organizationId` | `string` | Yes | `"string"` |
| `memberId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/organization/remove-member' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"organizationId":"string","memberId":"string"}'
```

### POST /api/organization/set-active

Full URL: `https://api.volara.chat/api/organization/set-active`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `organizationId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/organization/set-active' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"organizationId":"string"}'
```

### POST /api/organization/update

Full URL: `https://api.volara.chat/api/organization/update`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `organizationId` | `string` | Yes | `"string"` |
| `data` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/organization/update' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"organizationId":"string","data":"string"}'
```

### POST /api/organization/update-member-role

Full URL: `https://api.volara.chat/api/organization/update-member-role`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `organizationId` | `string` | Yes | `"string"` |
| `memberId` | `string` | Yes | `"string"` |
| `role` | `union` | Yes | `"admin"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/organization/update-member-role' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"organizationId":"string","memberId":"string","role":"admin"}'
```

## Volara Compatibility

### GET /api/scalebiz/chat/webhooks/subscriptions

Full URL: `https://api.volara.chat/api/scalebiz/chat/webhooks/subscriptions`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/scalebiz/chat/webhooks/subscriptions' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/scalebiz/chat/webhooks/subscriptions

Full URL: `https://api.volara.chat/api/scalebiz/chat/webhooks/subscriptions`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/scalebiz/chat/webhooks/subscriptions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/scalebiz/chat/webhooks/subscriptions/{id}

Full URL: `https://api.volara.chat/api/scalebiz/chat/webhooks/subscriptions/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/scalebiz/chat/webhooks/subscriptions/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/scalebiz/orders

Full URL: `https://api.volara.chat/api/scalebiz/orders`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/scalebiz/orders' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/scalebiz/orders

Full URL: `https://api.volara.chat/api/scalebiz/orders`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/scalebiz/orders' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/scalebiz/orders/{id}

Full URL: `https://api.volara.chat/api/scalebiz/orders/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/scalebiz/orders/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/scalebiz/orders/{id}

Full URL: `https://api.volara.chat/api/scalebiz/orders/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/scalebiz/orders/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/scalebiz/users

Full URL: `https://api.volara.chat/api/scalebiz/users`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/scalebiz/users' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/scalebiz/workflows

Full URL: `https://api.volara.chat/api/scalebiz/workflows`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/scalebiz/workflows' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/scalebiz/workflows/{id}/hook

Full URL: `https://api.volara.chat/api/scalebiz/workflows/{id}/hook`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/scalebiz/workflows/{id}/hook' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/scalebiz/workflows/{id}/hook

Full URL: `https://api.volara.chat/api/scalebiz/workflows/{id}/hook`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/scalebiz/workflows/{id}/hook' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/scalebiz/workflows/{id}/hook

Full URL: `https://api.volara.chat/api/scalebiz/workflows/{id}/hook`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/scalebiz/workflows/{id}/hook' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Super Admin

### GET /api/super-admin/companies

Full URL: `https://api.volara.chat/api/super-admin/companies`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/super-admin/companies' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/super-admin/companies/{id}/status

Full URL: `https://api.volara.chat/api/super-admin/companies/{id}/status`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/super-admin/companies/{id}/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/super-admin/companies/{id}/top-up

Full URL: `https://api.volara.chat/api/super-admin/companies/{id}/top-up`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/super-admin/companies/{id}/top-up' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/super-admin/credits/adjust

Full URL: `https://api.volara.chat/api/super-admin/credits/adjust`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/super-admin/credits/adjust' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/super-admin/credits/balance/{orgId}

Full URL: `https://api.volara.chat/api/super-admin/credits/balance/{orgId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/super-admin/credits/balance/{orgId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/super-admin/credits/model-pricing

Full URL: `https://api.volara.chat/api/super-admin/credits/model-pricing`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/super-admin/credits/model-pricing' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/super-admin/credits/model-pricing

Full URL: `https://api.volara.chat/api/super-admin/credits/model-pricing`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/super-admin/credits/model-pricing' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/super-admin/credits/packages

Full URL: `https://api.volara.chat/api/super-admin/credits/packages`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/super-admin/credits/packages' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/super-admin/reports/usage

Full URL: `https://api.volara.chat/api/super-admin/reports/usage`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/super-admin/reports/usage' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/super-admin/stats

Full URL: `https://api.volara.chat/api/super-admin/stats`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/super-admin/stats' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/super-admin/users

Full URL: `https://api.volara.chat/api/super-admin/users`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/super-admin/users' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/super-admin/users/{id}/role

Full URL: `https://api.volara.chat/api/super-admin/users/{id}/role`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/super-admin/users/{id}/role' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/super-admin/users/{id}/suspend

Full URL: `https://api.volara.chat/api/super-admin/users/{id}/suspend`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/super-admin/users/{id}/suspend' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/super-admin/webhooks

Full URL: `https://api.volara.chat/api/super-admin/webhooks`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/super-admin/webhooks' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/super-admin/companies

Full URL: `https://api.volara.chat/api/v1/super-admin/companies`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/super-admin/companies' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/super-admin/companies/{id}/status

Full URL: `https://api.volara.chat/api/v1/super-admin/companies/{id}/status`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/super-admin/companies/{id}/status' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/super-admin/companies/{id}/top-up

Full URL: `https://api.volara.chat/api/v1/super-admin/companies/{id}/top-up`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/super-admin/companies/{id}/top-up' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/super-admin/credits/adjust

Full URL: `https://api.volara.chat/api/v1/super-admin/credits/adjust`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/super-admin/credits/adjust' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/super-admin/credits/balance/{orgId}

Full URL: `https://api.volara.chat/api/v1/super-admin/credits/balance/{orgId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/super-admin/credits/balance/{orgId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/super-admin/credits/model-pricing

Full URL: `https://api.volara.chat/api/v1/super-admin/credits/model-pricing`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/super-admin/credits/model-pricing' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/super-admin/credits/model-pricing

Full URL: `https://api.volara.chat/api/v1/super-admin/credits/model-pricing`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/super-admin/credits/model-pricing' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/super-admin/credits/packages

Full URL: `https://api.volara.chat/api/v1/super-admin/credits/packages`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/super-admin/credits/packages' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/super-admin/reports/usage

Full URL: `https://api.volara.chat/api/v1/super-admin/reports/usage`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/super-admin/reports/usage' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/super-admin/stats

Full URL: `https://api.volara.chat/api/v1/super-admin/stats`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/super-admin/stats' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/super-admin/users

Full URL: `https://api.volara.chat/api/v1/super-admin/users`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/super-admin/users' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/super-admin/users/{id}/role

Full URL: `https://api.volara.chat/api/v1/super-admin/users/{id}/role`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/super-admin/users/{id}/role' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/super-admin/users/{id}/suspend

Full URL: `https://api.volara.chat/api/v1/super-admin/users/{id}/suspend`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/super-admin/users/{id}/suspend' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/super-admin/webhooks

Full URL: `https://api.volara.chat/api/v1/super-admin/webhooks`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/super-admin/webhooks' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Team

### GET /api/teams

Full URL: `https://api.volara.chat/api/teams`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/teams' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/teams

Full URL: `https://api.volara.chat/api/teams`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/teams' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/teams/{id}

Full URL: `https://api.volara.chat/api/teams/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/teams/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/teams/{id}

Full URL: `https://api.volara.chat/api/teams/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/teams/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/teams/{id}

Full URL: `https://api.volara.chat/api/teams/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/teams/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/teams/{id}/members

Full URL: `https://api.volara.chat/api/teams/{id}/members`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `userId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/teams/{id}/members' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"userId":"string"}'
```

### DELETE /api/teams/{id}/members/{userId}

Full URL: `https://api.volara.chat/api/teams/{id}/members/{userId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `userId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/teams/{id}/members/{userId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/teams

Full URL: `https://api.volara.chat/api/v1/teams`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/teams' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/teams

Full URL: `https://api.volara.chat/api/v1/teams`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/teams' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/teams/{id}

Full URL: `https://api.volara.chat/api/v1/teams/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/teams/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/teams/{id}

Full URL: `https://api.volara.chat/api/v1/teams/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/teams/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/teams/{id}

Full URL: `https://api.volara.chat/api/v1/teams/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/teams/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/teams/{id}/members

Full URL: `https://api.volara.chat/api/v1/teams/{id}/members`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `userId` | `string` | Yes | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/teams/{id}/members' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"userId":"string"}'
```

### DELETE /api/v1/teams/{id}/members/{userId}

Full URL: `https://api.volara.chat/api/v1/teams/{id}/members/{userId}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |
| `userId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/teams/{id}/members/{userId}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Template Variables

### GET /api/template-variables

Full URL: `https://api.volara.chat/api/template-variables`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/template-variables' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/template-variables

Full URL: `https://api.volara.chat/api/template-variables`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/template-variables' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/template-variables/{id}

Full URL: `https://api.volara.chat/api/template-variables/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/template-variables/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/template-variables

Full URL: `https://api.volara.chat/api/v1/template-variables`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/template-variables' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/template-variables

Full URL: `https://api.volara.chat/api/v1/template-variables`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/template-variables' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/template-variables/{id}

Full URL: `https://api.volara.chat/api/v1/template-variables/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/template-variables/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## WhatsApp

### GET /api/templates

Full URL: `https://api.volara.chat/api/templates`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `status` | `string` | No | `"string"` |
| `category` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |
| `channelId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/templates' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/templates/sync

Full URL: `https://api.volara.chat/api/templates/sync`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `channelId` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/templates/sync' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"channelId":"string"}'
```

### GET /api/v1/templates

Full URL: `https://api.volara.chat/api/v1/templates`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `status` | `string` | No | `"string"` |
| `category` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |
| `channelId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/templates' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/templates/sync

Full URL: `https://api.volara.chat/api/v1/templates/sync`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `channelId` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/templates/sync' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"channelId":"string"}'
```

### GET /api/v1/whatsapp-channels

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/whatsapp-channels' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/whatsapp-channels

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/whatsapp-channels' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/whatsapp-channels/{id}

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/whatsapp-channels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/whatsapp-channels/{id}

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/whatsapp-channels/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/v1/whatsapp-channels/{id}

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/v1/whatsapp-channels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/whatsapp-channels/{id}/badge

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels/{id}/badge`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/whatsapp-channels/{id}/badge' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/whatsapp-channels/{id}/badge

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels/{id}/badge`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `badge` | `file` | Yes | `"<binary file>"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/whatsapp-channels/{id}/badge' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"badge":"<binary file>"}'
```

### GET /api/v1/whatsapp-channels/{id}/details

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels/{id}/details`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/whatsapp-channels/{id}/details' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/whatsapp-channels/callback

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels/callback`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `code` | `string` | No | `"string"` |
| `state` | `string` | No | `"string"` |
| `waba_id` | `string` | No | `"string"` |
| `whatsapp_business_account_id` | `string` | No | `"string"` |
| `phone_number_id` | `string` | No | `"string"` |
| `phone_number_ids` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/whatsapp-channels/callback' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/whatsapp-channels/config

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels/config`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/whatsapp-channels/config' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/whatsapp-channels/exchange-token

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels/exchange-token`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/whatsapp-channels/exchange-token' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/whatsapp-channels/init-signup

Full URL: `https://api.volara.chat/api/v1/whatsapp-channels/init-signup`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/whatsapp-channels/init-signup' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/whatsapp

Full URL: `https://api.volara.chat/api/whatsapp`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/whatsapp

Full URL: `https://api.volara.chat/api/whatsapp`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/whatsapp' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/whatsapp-channels

Full URL: `https://api.volara.chat/api/whatsapp-channels`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp-channels' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/whatsapp-channels

Full URL: `https://api.volara.chat/api/whatsapp-channels`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/whatsapp-channels' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/whatsapp-channels/{id}

Full URL: `https://api.volara.chat/api/whatsapp-channels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/whatsapp-channels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/whatsapp-channels/{id}

Full URL: `https://api.volara.chat/api/whatsapp-channels/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp-channels/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/whatsapp-channels/{id}

Full URL: `https://api.volara.chat/api/whatsapp-channels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/whatsapp-channels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/whatsapp-channels/{id}/badge

Full URL: `https://api.volara.chat/api/whatsapp-channels/{id}/badge`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/whatsapp-channels/{id}/badge' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/whatsapp-channels/{id}/badge

Full URL: `https://api.volara.chat/api/whatsapp-channels/{id}/badge`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `badge` | `file` | Yes | `"<binary file>"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/whatsapp-channels/{id}/badge' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"badge":"<binary file>"}'
```

### GET /api/whatsapp-channels/{id}/details

Full URL: `https://api.volara.chat/api/whatsapp-channels/{id}/details`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp-channels/{id}/details' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/whatsapp-channels/callback

Full URL: `https://api.volara.chat/api/whatsapp-channels/callback`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `code` | `string` | No | `"string"` |
| `state` | `string` | No | `"string"` |
| `waba_id` | `string` | No | `"string"` |
| `whatsapp_business_account_id` | `string` | No | `"string"` |
| `phone_number_id` | `string` | No | `"string"` |
| `phone_number_ids` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp-channels/callback' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/whatsapp-channels/config

Full URL: `https://api.volara.chat/api/whatsapp-channels/config`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp-channels/config' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/whatsapp-channels/exchange-token

Full URL: `https://api.volara.chat/api/whatsapp-channels/exchange-token`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/whatsapp-channels/exchange-token' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/whatsapp-channels/init-signup

Full URL: `https://api.volara.chat/api/whatsapp-channels/init-signup`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/whatsapp-channels/init-signup' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/whatsapp/{id}

Full URL: `https://api.volara.chat/api/whatsapp/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/whatsapp/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/whatsapp/{id}

Full URL: `https://api.volara.chat/api/whatsapp/{id}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp/{id}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PATCH /api/whatsapp/{id}

Full URL: `https://api.volara.chat/api/whatsapp/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X PATCH 'https://api.volara.chat/api/whatsapp/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/whatsapp/{id}/badge

Full URL: `https://api.volara.chat/api/whatsapp/{id}/badge`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/whatsapp/{id}/badge' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/whatsapp/{id}/badge

Full URL: `https://api.volara.chat/api/whatsapp/{id}/badge`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `badge` | `file` | Yes | `"<binary file>"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/whatsapp/{id}/badge' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"badge":"<binary file>"}'
```

### GET /api/whatsapp/{id}/details

Full URL: `https://api.volara.chat/api/whatsapp/{id}/details`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp/{id}/details' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/whatsapp/callback

Full URL: `https://api.volara.chat/api/whatsapp/callback`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `code` | `string` | No | `"string"` |
| `state` | `string` | No | `"string"` |
| `waba_id` | `string` | No | `"string"` |
| `whatsapp_business_account_id` | `string` | No | `"string"` |
| `phone_number_id` | `string` | No | `"string"` |
| `phone_number_ids` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp/callback' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/whatsapp/config

Full URL: `https://api.volara.chat/api/whatsapp/config`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp/config' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/whatsapp/exchange-token

Full URL: `https://api.volara.chat/api/whatsapp/exchange-token`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/whatsapp/exchange-token' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/whatsapp/init-signup

Full URL: `https://api.volara.chat/api/whatsapp/init-signup`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/whatsapp/init-signup' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/whatsapp/templates

Full URL: `https://api.volara.chat/api/whatsapp/templates`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `limit` | `string` | No | `"string"` |
| `status` | `string` | No | `"string"` |
| `category` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |
| `channelId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/whatsapp/templates' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/whatsapp/templates/sync

Full URL: `https://api.volara.chat/api/whatsapp/templates/sync`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `channelId` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/whatsapp/templates/sync' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"channelId":"string"}'
```

## Tickets

### GET /api/tickets/conversations/{conversationId}

Full URL: `https://api.volara.chat/api/tickets/conversations/{conversationId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `board_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/tickets/conversations/{conversationId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/tickets/kanban

Full URL: `https://api.volara.chat/api/tickets/kanban`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/tickets/kanban' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/tickets/settings

Full URL: `https://api.volara.chat/api/tickets/settings`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/tickets/settings' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/tickets/settings/default-board

Full URL: `https://api.volara.chat/api/tickets/settings/default-board`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/tickets/settings/default-board' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/tickets/conversations/{conversationId}

Full URL: `https://api.volara.chat/api/v1/tickets/conversations/{conversationId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `conversationId` | `string` | Yes | `"string"` |

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `board_id` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/tickets/conversations/{conversationId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/tickets/kanban

Full URL: `https://api.volara.chat/api/v1/tickets/kanban`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/tickets/kanban' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/tickets/settings

Full URL: `https://api.volara.chat/api/v1/tickets/settings`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/tickets/settings' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### PUT /api/v1/tickets/settings/default-board

Full URL: `https://api.volara.chat/api/v1/tickets/settings/default-board`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X PUT 'https://api.volara.chat/api/v1/tickets/settings/default-board' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## TikTok

### GET /api/tiktok-channels

Full URL: `https://api.volara.chat/api/tiktok-channels`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/tiktok-channels' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/tiktok-channels/{id}

Full URL: `https://api.volara.chat/api/tiktok-channels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/tiktok-channels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/tiktok-channels/{id}/status

Full URL: `https://api.volara.chat/api/tiktok-channels/{id}/status`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/tiktok-channels/{id}/status' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/tiktok-channels/callback

Full URL: `https://api.volara.chat/api/tiktok-channels/callback`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `code` | `string` | No | `"string"` |
| `state` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/tiktok-channels/callback' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/tiktok-channels/init-login

Full URL: `https://api.volara.chat/api/tiktok-channels/init-login`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/tiktok-channels/init-login' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/tiktok-channels/redirect_uri

Full URL: `https://api.volara.chat/api/tiktok-channels/redirect_uri`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/tiktok-channels/redirect_uri' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/tiktok-channels

Full URL: `https://api.volara.chat/api/v1/tiktok-channels`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `appId` | `string` | No | `"string"` |
| `accountId` | `string` | No | `"string"` |
| `search` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/tiktok-channels' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### DELETE /api/v1/tiktok-channels/{id}

Full URL: `https://api.volara.chat/api/v1/tiktok-channels/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/tiktok-channels/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/tiktok-channels/{id}/status

Full URL: `https://api.volara.chat/api/v1/tiktok-channels/{id}/status`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/tiktok-channels/{id}/status' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/tiktok-channels/callback

Full URL: `https://api.volara.chat/api/v1/tiktok-channels/callback`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `code` | `string` | No | `"string"` |
| `state` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/tiktok-channels/callback' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/tiktok-channels/init-login

Full URL: `https://api.volara.chat/api/v1/tiktok-channels/init-login`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/tiktok-channels/init-login' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/tiktok-channels/redirect_uri

Full URL: `https://api.volara.chat/api/v1/tiktok-channels/redirect_uri`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/tiktok-channels/redirect_uri' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## WABA

### POST /api/v1/waba/connect/manual

Full URL: `https://api.volara.chat/api/v1/waba/connect/manual`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/waba/connect/manual' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/waba/webhook-config

Full URL: `https://api.volara.chat/api/v1/waba/webhook-config`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/waba/webhook-config' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/waba/connect/manual

Full URL: `https://api.volara.chat/api/waba/connect/manual`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/waba/connect/manual' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/waba/webhook-config

Full URL: `https://api.volara.chat/api/waba/webhook-config`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/waba/webhook-config' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Webhook

### GET /api/v1/webhooks

Outbound Management.

Full URL: `https://api.volara.chat/api/v1/webhooks`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/webhooks' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/webhooks

Full URL: `https://api.volara.chat/api/v1/webhooks`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `url` | `string` | Yes | `"string"` |
| `name` | `string` | No | `"string"` |
| `events` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/webhooks' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"url":"string","name":"string","events":"string"}'
```

### DELETE /api/v1/webhooks/{id}

Full URL: `https://api.volara.chat/api/v1/webhooks/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/v1/webhooks/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/webhooks/instagram

Full URL: `https://api.volara.chat/api/v1/webhooks/instagram`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `hub.mode` | `string` | No | `"string"` |
| `hub.verify_token` | `string` | No | `"string"` |
| `hub.challenge` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/webhooks/instagram' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/webhooks/instagram

Full URL: `https://api.volara.chat/api/v1/webhooks/instagram`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/webhooks/instagram' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/webhooks/tiktok

Full URL: `https://api.volara.chat/api/v1/webhooks/tiktok`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `challenge` | `string` | No | `"string"` |
| `verify_token` | `string` | No | `"string"` |
| `hub.mode` | `string` | No | `"string"` |
| `hub.verify_token` | `string` | No | `"string"` |
| `hub.challenge` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/webhooks/tiktok' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/webhooks/tiktok

Full URL: `https://api.volara.chat/api/v1/webhooks/tiktok`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/webhooks/tiktok' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/webhooks/whatsapp

Meta Webhook Verification (GET).

Full URL: `https://api.volara.chat/api/v1/webhooks/whatsapp`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `hub.mode` | `string` | No | `"string"` |
| `hub.verify_token` | `string` | No | `"string"` |
| `hub.challenge` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/webhooks/whatsapp' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/v1/webhooks/whatsapp

Meta Webhook Payloads (POST).

Full URL: `https://api.volara.chat/api/v1/webhooks/whatsapp`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/v1/webhooks/whatsapp' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/v1/webhooks/whatsapp/media/{messageId}

Full URL: `https://api.volara.chat/api/v1/webhooks/whatsapp/media/{messageId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `messageId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/v1/webhooks/whatsapp/media/{messageId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/webhooks

Outbound Management.

Full URL: `https://api.volara.chat/api/webhooks`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/webhooks' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/webhooks

Full URL: `https://api.volara.chat/api/webhooks`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `accountId` | `string` | No | `"string"` |

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `url` | `string` | Yes | `"string"` |
| `name` | `string` | No | `"string"` |
| `events` | `string` | No | `"string"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/api/webhooks' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>' \
  --data '{"url":"string","name":"string","events":"string"}'
```

### DELETE /api/webhooks/{id}

Full URL: `https://api.volara.chat/api/webhooks/{id}`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `id` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X DELETE 'https://api.volara.chat/api/webhooks/{id}' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/webhooks/instagram

Full URL: `https://api.volara.chat/api/webhooks/instagram`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `hub.mode` | `string` | No | `"string"` |
| `hub.verify_token` | `string` | No | `"string"` |
| `hub.challenge` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/webhooks/instagram' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/webhooks/instagram

Full URL: `https://api.volara.chat/api/webhooks/instagram`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/webhooks/instagram' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/webhooks/tiktok

Full URL: `https://api.volara.chat/api/webhooks/tiktok`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `challenge` | `string` | No | `"string"` |
| `verify_token` | `string` | No | `"string"` |
| `hub.mode` | `string` | No | `"string"` |
| `hub.verify_token` | `string` | No | `"string"` |
| `hub.challenge` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/webhooks/tiktok' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/webhooks/tiktok

Full URL: `https://api.volara.chat/api/webhooks/tiktok`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/webhooks/tiktok' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/webhooks/whatsapp

Meta Webhook Verification (GET).

Full URL: `https://api.volara.chat/api/webhooks/whatsapp`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Query params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `hub.mode` | `string` | No | `"string"` |
| `hub.verify_token` | `string` | No | `"string"` |
| `hub.challenge` | `string` | No | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/webhooks/whatsapp' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### POST /api/webhooks/whatsapp

Meta Webhook Payloads (POST).

Full URL: `https://api.volara.chat/api/webhooks/whatsapp`
Headers: `Content-Type: application/json; Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/api/webhooks/whatsapp' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

### GET /api/webhooks/whatsapp/media/{messageId}

Full URL: `https://api.volara.chat/api/webhooks/whatsapp/media/{messageId}`
Headers: `Authorization: Bearer <token> or x-api-key: <developer-api-key>; x-org-slug: <organization-slug> or x-app-id: <app-id>`

Path params:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `messageId` | `string` | Yes | `"string"` |

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/api/webhooks/whatsapp/media/{messageId}' \
  -H 'Authorization: Bearer <token>' \
  -H 'x-api-key: <developer-api-key>' \
  -H 'x-org-slug: <organization-slug>'
```

## Better Auth

### GET /auth/session

Read active Better Auth session.

Full URL: `https://api.volara.chat/auth/session`
Headers: `Cookie session or Authorization: Bearer <token>`

Payload: _None._

Example:

```bash
curl -X GET 'https://api.volara.chat/auth/session' \
  -H 'Authorization: Bearer <token>'
```

### POST /auth/sign-in/email

Better Auth email/password sign in.

Full URL: `https://api.volara.chat/auth/sign-in/email`
Headers: `Content-Type: application/json`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `email` | `string` | Yes | `"user@example.com"` |
| `password` | `string` | Yes | `"password"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/auth/sign-in/email' \
  -H 'Content-Type: application/json' \
  --data '{"email":"user@example.com","password":"password"}'
```

### POST /auth/sign-out

Sign out active Better Auth session.

Full URL: `https://api.volara.chat/auth/sign-out`
Headers: `Cookie session or Authorization: Bearer <token>`

Payload: _None._

Example:

```bash
curl -X POST 'https://api.volara.chat/auth/sign-out' \
  -H 'Authorization: Bearer <token>'
```

### POST /auth/sign-up/email

Better Auth email/password registration.

Full URL: `https://api.volara.chat/auth/sign-up/email`
Headers: `Content-Type: application/json`

Payload:

| Field | Type | Required | Example |
|---|---:|:---:|---|
| `email` | `string` | Yes | `"user@example.com"` |
| `password` | `string` | Yes | `"password"` |
| `name` | `string` | No | `"User Name"` |

Example:

```bash
curl -X POST 'https://api.volara.chat/auth/sign-up/email' \
  -H 'Content-Type: application/json' \
  --data '{"email":"user@example.com","password":"password","name":"User Name"}'
```

