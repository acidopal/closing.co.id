---
inclusion: always
---

# Scalebiz — Product Overview

Scalebiz is an omnichannel chat platform (SaaS) that unifies WhatsApp, Instagram, and TikTok messaging into a single agent dashboard, enhanced with AI-powered knowledge assistance.

## Target Users
- Customer support teams
- Social media admins
- Sales & CRM teams
- SME to Enterprise

## Core Capabilities
- Unified inbox across all messaging channels
- Realtime messaging via WebSocket + Socket.io
- Agent assignment (manual & auto), SLA timers
- AI knowledge assistant (RAG-based: suggested replies, auto-reply, summarization)
- Multi-tenant architecture with organization-level isolation (`app_id` on all tables)
- CRM pipeline with drag-and-drop stages
- Broadcast messaging & WhatsApp template management
- Billing & AI credit system via Xendit

## Conversation Lifecycle
Statuses: `open` → `pending` → `resolved`
- Incoming messages on a resolved conversation create a NEW conversation (not reopen)
- 24h messaging window enforced for WhatsApp and Instagram

## Business Language
- "App" = a tenant workspace (multi-tenant unit)
- "Inbox" = a channel connection (e.g., one WhatsApp number, one Instagram account)
- "Contact" = end customer who sends messages
- "Conversation" = a chat thread between contact and agents
- "Agent" = support team member using the dashboard
