# Draft: AI Credit System

## Requirements (confirmed)
- AI credit system with flat rate per AI response (same cost regardless of model)
- Credit deduction on each AI response
- Top-up credits via Xendit payment gateway with fixed packages
- Grace period when credits run out (allow negative briefly, require top-up)
- Full admin features (credit adjustment, reports, model pricing config)

## Technical Decisions
- **Pricing model**: Tier-based packages (Starter $10, Pro $30, Enterprise $100)
- **Credit deduction**: Per-model pricing from `ai_model_pricing` table
- **Zero credits**: Grace period - allow negative, require top-up
- **Credit scope**: Organization-level (MIGRATE from per-app to per-org)
- **Test strategy**: None (manual QA only)
- **Expiration**: Credits never expire

## Scope Boundaries
- INCLUDE:
  - Migrate credits from app-level to org-level
  - Per-model pricing via `ai_model_pricing` table
  - Xendit payment integration (create invoice, webhook handler, reconciliation)
  - Admin dashboard for credit management
  - Grace period implementation with alerts
  - Tier-based credit packages
  - Credit deduction AFTER successful LLM response
  - Reservation pattern for reliability
- EXCLUDE:
  - Subscription model
  - Automated refund processing
  - User-level credits
  - Automated tests (manual QA only)

### Codebase Architecture (from explore agent)

**Tech Stack**: ElysiaJS + Bun (backend), React + Vite + TanStack Router (frontend), Prisma ORM + PostgreSQL

**Existing Credit Infrastructure** (CRITICAL - Already Exists!):
- `apps` table: `ai_credits`, `ai_credit_warning_threshold`, `ai_low_credit_alert_sent` fields
- `credit_transactions` table: Tracks all credit movements (type: top_up/usage, amount, description, metadata)
- `ai_model_pricing` table: Stores model pricing per request (not yet integrated)
- `BillingService`: Has `getBalance()`, `getTransactions()`, `topUp()`, `deductCredits()`
- AI module already calls `BillingService.deductCredits(0.3, "AI Response")`

**Auth & Context Flow**:
- Better Auth with organization plugin
- `appContext` plugin resolves org/app from: URL params > headers > session > legacy app_id
- All routes get `resolvedAppId`, `orgId`, `orgSlug`, `userId` automatically

**Module Pattern** (`apps/backend/src/modules/[module]/`):
- `index.ts` - Elysia routes
- `service.ts` - Business logic (static methods)
- `model.ts` - TypeScript validation schemas (elysia t.Object)

**API Integration**: Eden Treaty for type-safe frontend ↔ backend communication

### AI Integration Patterns (from explore agent)

**AI Service Layer**: `/modules/ai/service.ts`
- `AIService.generateResponse()` and `AIService.getSuggestions()` - main entry points
- Currently hardcoded 0.3 credits per request (deducted BEFORE LLM call)
- Returns mock responses - no actual LLM API calls yet

**Credit Deduction Flow** (current):
1. Request arrives → `appContext` resolves org/app
2. `AIService` deducts credits via `BillingService.deductCredits(0.3, ...)`
3. Mock response returned
4. **Issue**: Credits deducted before LLM call - no refund if LLM fails

**Database Tables**:
- `ai_settings`: Model config (provider, model_name, temperature, api_key, etc.)
- `ai_model_pricing`: Cost per model (exists but NOT used yet)
- `credit_transactions`: All credit movements with type, amount, description, metadata
- `apps`: Has `ai_credits`, `ai_credit_warning_threshold`, `ai_low_credit_alert_sent`

**BillingService Methods** (`/modules/billing/service.ts`):
- `deductCredits(appId, amount, description)` - Checks balance, uses transaction
- `topUp(appId, amount, description)` - Adds credits
- `getBalance(appId)` - Returns current balance
- `getTransactions(appId)` - Returns transaction history

**API Auth**: `Basic Base64(secretKey + ':')` for API calls, `x-callback-token` header for webhooks

**Key Invoice API**:
```typescript
POST /v2/invoices/
{ externalId, amount, payerEmail?, description?, currency?, invoiceDuration?, successRedirectUrl?, metadata? }
→ { id, invoiceUrl, status: 'PENDING', ... }
```

**Webhook Security**:
- Token comparison (not HMAC) - use constant-time comparison
- Always validate: status === 'PAID', amount >= expected, externalId exists, local status is PENDING
- Use DB state guard (PENDING → COMPLETED one-way) for idempotency

**Critical Pitfalls**:
- `paidAmount` ≠ `amount` (fees) - check `paidAmount >= amount`
- NEVER grant credits on redirect URL - only in webhook
- Keep webhook handler <5s to avoid timeout retries
- Implement reconciliation job to catch missed webhooks

## Open Questions
1. Specific credit packages and pricing? (e.g., 100 credits = $5?)
2. Default credit cost per AI response? (1 credit per message?)
3. Credit expiration? (never expire, or yearly?)
4. Organization-level credits or per-user? (multi-tenant consideration)
5. Credit transaction history - how long to retain?

## Scope Boundaries
- INCLUDE:
  - Credit balance tracking
  - Credit deduction on AI responses
  - Xendit payment integration
  - Admin dashboard for credit management
  - Fixed credit packages
- EXCLUDE:
  - Token-based pricing
  - Subscription model
  - Refund processing (manual admin adjustment only)
