# AI Credit System with Xendit Payment Integration

## TL;DR

> **Quick Summary**: Build a comprehensive AI credit system with per-model pricing, Xendit payment integration, and admin dashboard. Credits are managed at organization-level (multi-tenant) with grace period handling and low-balance alerts.
>
> **Deliverables**:
> - Database schema migration (org-level credits)
> - Xendit payment integration (invoices + webhooks)
> - AI credit deduction with per-model pricing
> - Admin dashboard (pricing, adjustments, reports)
> - Billing frontend (top-up, transactions)
> - Grace period + low credit alerts
> - Reconciliation cron job
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Schema migration → Billing service refactor → Xendit service → Webhook handler → AI service updates → Admin APIs → Frontend UI

---

## Context

### Original Request
Build AI credit system where:
- Multiple AI models with different credit costs per response
- Users can top-up credits via Xendit payment integration
- Full admin features for credit management

### Interview Summary
**Key Discussions**:
- **Pricing Model**: Per-model pricing (different costs per model), configured in `ai_model_pricing` table
- **Top-up Packages**: Tier-based (Starter $10, Pro $30, Enterprise $100)
- **Zero Credits Behavior**: Grace period - allow negative balance briefly, require top-up
- **Admin Features**: Full admin (credit adjustment, reports, model pricing config)
- **Credit Scope**: MIGRATE from per-app to organization-level (multi-tenant SaaS)
- **Test Strategy**: None (manual QA only via Playwright)
- **Expiration**: Credits never expire

**Research Findings**:
- **Existing Infrastructure**: BillingService already exists with `getBalance()`, `topUp()`, `deductCredits()` methods
- **Database**: Prisma + PostgreSQL, `credit_transactions` table exists, `ai_model_pricing` table exists but not used
- **Current Credit Deduction**: Hardcoded 0.3 credits BEFORE LLM call (needs to move AFTER + use pricing table)
- **AI Integration**: No actual LLM calls yet (mock responses only)
- **Xendit**: Invoice API with webhook callbacks, token-based verification (not HMAC)
- **Tech Stack**: ElysiaJS + Bun (backend), React + Vite + TanStack Router (frontend), Prisma ORM, BullMQ

---

## Work Objectives

### Core Objective
Build a production-ready AI credit system with:
1. Organization-level credit management (migrate from per-app)
2. Per-model pricing (use `ai_model_pricing` table)
3. Xendit payment integration (invoices + webhooks + reconciliation)
4. Grace period for negative balances
5. Low credit alerts (email + Slack notifications)
6. Admin dashboard for credit management
7. Billing frontend with top-up flow

### Concrete Deliverables
- **Database**:
  - Schema migration: Add `ai_credits`, `ai_credit_warning_threshold`, `ai_low_credit_alert_sent` to `organizations` table
  - New table: `payment_requests` (Xendit invoice tracking)
  - Seed data: Default pricing for common AI models
- **Backend**:
  - XenditService: Invoice creation, webhook client initialization
  - Webhook handler: `/api/webhooks/xendit` endpoint
  - Reconciliation cron job: BullMQ job to catch missed webhooks
  - BillingService updates: Org-level methods, grace period logic, low balance alerts
  - AIService updates: Use pricing table, reservation pattern, deduct after success
  - Admin API endpoints: Credit adjustment, model pricing CRUD, reports
  - Top-up API endpoint: Create Xendit invoices
- **Frontend**:
  - Billing page updates: Xendit top-up flow, package selection
  - TransactionHistory component: Reusable transaction display
  - Admin pages: Model pricing, credit adjustment, organization balance

### Definition of Done
- [ ] Database migrated: `organizations` table has credit fields
- [ ] `bun run db:migrate deploy` → success
- [ ] Xendit SDK installed and configured
- [ ] Webhook handler processes test payments correctly
- [ ] AI credit deduction uses pricing table
- [ ] Grace period allows negative balances (verified manually)
- [ ] Low credit alerts sent when threshold reached
- [ ] Admin dashboard shows all credit data
- [ ] Users can top-up credits via Xendit
- [ ] Reconciliation job runs successfully
- [ ] All manual QA scenarios pass

### Must Have
- Organization-level credit management (multi-tenant)
- Per-model pricing via `ai_model_pricing` table
- Xendit payment integration (create invoice, webhook handler, reconciliation)
- Grace period for negative balances
- Low credit alerts (email + Slack)
- Credit transaction history (complete audit trail)
- Admin features (adjust credits, configure pricing, view reports)
- Top-up packages (Starter, Pro, Enterprise)
- Credit deduction AFTER successful LLM response

### Must NOT Have (Guardrails)
- Do NOT deduct credits before LLM call completes (use reservation pattern)
- Do not grant credits on success redirect URLs (client-side forgeable)
- Do not assume webhook delivery is guaranteed (implement reconciliation)
- Do not allow arbitrary credit adjustments (require reason field)
- Do not skip transaction logging (log all credit movements)
- Do not implement automated refunds (manual admin adjustment only)
- Do not implement subscription model (one-time purchases only)
- Do not allow per-user credits (organization-level only)
- Do not implement real-time pricing updates (admin configures manually)
- Do not expose API keys in frontend code (server-side only)
- Do not trust `paidAmount` from webhooks without validation
- Do not allow credit expiration (credits never expire)
- Do not implement credit transfer between organizations (separate balances)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed via Playwright. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN. Use `bun test` for integration tests.

### Test Decision
- **Infrastructure exists**: YES (bun test built-in)
- **Automated tests**: None (manual QA only via Playwright)
- **Framework**: bun test
- **If TDD**: N/A - Manual QA only

### QA Policy
Every task includes agent-executed QA scenarios using Playwright for browser automation.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

**QA Approach**:
- **Frontend/UI**: Use Playwright — navigate to billing page, interact with DOM, assert behavior, capture screenshots
- **API/Backend**: Use Bash (curl) — send HTTP requests, assert status + response fields
- **CLI/TUI**: Use interactive_bash (tmux) — run commands, send keystrokes, validate output
- **Evidence**: Screenshots for UI, curl output for API, logs for backend

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - schema, installation, config):
├── Task 1: Database schema migration [quick]
├── Task 2: Seed AI model pricing [quick]
├── Task 3: Install Xendit SDK [quick]
└── Task 4: Create Xendit service module [quick]

Wave 2 (Backend Core - services and handlers):
├── Task 5: Create webhook handler [quick]
├── Task 6: Create reconciliation cron job [quick]
├── Task 7: Update AI service - credit deduction [deep]
└── Task 8: Update BillingService - org-level methods [quick]

Wave 3 (Admin APIs - credit management):
├── Task 9: Create admin API endpoints [unspecified-high]
└── Task 10: Create billing top-up endpoint [quick]

Wave 4 (Frontend - UI components and pages):
├── Task 11: Update billing frontend - top-up flow [visual-engineering]
├── Task 12: Create transaction history component [visual-engineering]
├── Task 13: Create model pricing admin page [visual-engineering]
├── Task 14: Create credit adjustment admin page [visual-engineering]
└── Task 15: Create organization balance view [visual-engineering]

Wave 5 (Documentation and testing):
├── Task 16: Add environment variables documentation [quick]
└── Task 17: Final QA - manual testing [deep]

Critical Path: Task 1 → Task 8 → Task 7 → Task 5 → Task 11
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

- **Task 1**: Blocks → Tasks 2-4, 7-8, 9-10
- **Task 3**: Blocks → Task 4
- **Task 4**: Blocks → Task 5, 9-10
- **Task 5**: Blocks → Task 17
- **Task 6**: Blocks → Task 17
- **Task 7**: Blocked By → Tasks 1, 4, 8 | Blocks → Tasks 5, 9, 10
- **Task 8**: Blocked By → Task 1 | Blocks → Tasks 7, 9, 10
- **Task 9**: Blocked By → Task 8 | Blocks → Tasks 10, 11
- **Task 10**: Blocked By → Task 4, 8, 9 | Blocks → Task 11
- **Task 11**: Blocked By → Task 10 | Blocks → Tasks 12-15
- **Task 12**: Blocks → Task 11
- **Task 13**: Blocked By → Task 9 | Blocks → Task 17
- **Task 14**: Blocked By → Task 9 | Blocks → Task 17
- **Task 15**: Blocked By → Task 9 | Blocks → Task 17
- **Task 16**: Blocks → Task 17

---

## TODOs

> Each task includes: Agent Profile + Parallelization + QA Scenarios

---

- [x] 1. **Database schema migration** - Add org-level credit fields
  **Agent**: `quick`
  **What to do**:
  - Create migration: `apps/backend/prisma/migrations/[timestamp]_org_credits.sql`
  - Add to `organizations` table: `ai_credits`, `ai_credit_warning_threshold`, `ai_low_credit_alert_sent`
  - Create `payment_requests` table: id, org_id, external_id, xendit_invoice_id, amount, credits, status, created_at, updated_at
  - Migrate existing credit data from `apps` to `organizations`
  - Keep `ai_credits` in apps for backward compatibility
  - Test: `bun run db:migrate deploy`
  - Verify: `bun run db:studio`

  **Must NOT do**:
  - Delete existing credit data
  - Modify `credit_transactions` table
  - Skip data backup

  **References**:
  - Existing schema: `apps/backend/prisma/schema.prisma` lines 440-485
  - Credit fields: `apps/backend/prisma/schema.prisma` lines 439-451

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-4)
  - **Blocks**: Tasks 7, 9
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] Migration file created
  - [ ] `bun run db:migrate deploy` → success
  - [ ] Organizations have credit fields
  - [ ] Payment_requests table exists
  - [ ] Data migrated from apps to orgs
  - [ ] Verified in Prisma Studio

  **QA Scenarios**:
  **Scenario 1: Migration runs successfully**
    - Tool: Bash
    - Steps: `bun run db:migrate deploy`, verify success
    - Expected: Migration completes without errors
    - Evidence: `.sisyphus/evidence/task-1-migration.log`

  **Scenario 2: Data migrated correctly**
    - Tool: Bash
    - Steps: Query apps and orgs tables, verify credit totals match
    - Expected: All app credits migrated to org-level
    - Evidence: `.sisyphus/evidence/task-1-data.json`

  **Commit**: YES
  - Message: `feat(schema): add org-level credits and payment_requests table`
  - Files: `apps/backend/prisma/migrations/[timestamp]_org_credits.sql`
  - Pre-commit: `bun run db:generate && bun run db:migrate deploy`

---

- [x] 2. **Seed AI model pricing** - populate default pricing
  **Agent**: `quick`
  **What to do**:
  - Update seed file: `apps/backend/prisma/seed.ts`
  - Add models: gpt-4o-mini (1.0), gpt-4o (3.0), gpt-4-turbo (5.0), claude-3-sonnet (2.0), gemini-1.5-flash (0.5)
  - Mark all as `is_active: true`
  - Test: `bun run db:seed`
  - Verify: Query `ai_model_pricing` table

  **Must NOT do**:
  - Set unrealistic prices
  - Add non-existent models
  - Make pricing permanent

  **References**:
  - Existing seed: `apps/backend/prisma/seed.ts`
  - Pricing structure: `ai_model_pricing` table

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 7, 9
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] Seed file updated
  - [ ] `bun run db:seed` → success
  - [ ] Query returns default pricing
  - [ ] At least 3 models have entries

  **QA Scenarios**:
  **Scenario 1: Seeding completes**
    - Tool: Bash
    - Steps: `bun run db:seed`, query count
    - Expected: Seed data inserted
    - Evidence: `.sisyphus/evidence/task-2-seed.log`

  **Commit**: YES
  - Message: `feat(config): add seed data for AI model pricing`
  - Files: `apps/backend/prisma/seed.ts`
  - Pre-commit: `bun run db:seed`

---

- [x] 3. **Install Xendit SDK** - add xendit-node package
  **Agent**: `quick`
  **What to do**:
  - Run: `bun add xendit-node` in apps/backend
  - Add to `.env.example`: XENDIT_SECRET_KEY, XENDIT_CALLBACK_TOKEN, XENDIT_WEBHOOK_URL
  - Verify package in package.json
  - Test import

  **Must NOT do**:
  - Hardcode API keys
  - Commit `.env` file
  - Install unnecessary packages

  **References**:
  - Package manager: Bun
  - Xendit SDK: `https://github.com/xendit/xendit-node`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 4, Task 10
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] Package installed
  - [ ] `.env.example` has Xendit vars
  - [ ] Client can be initialized
  - [ ] Package in package.json

  **QA Scenarios**:
  **Scenario 1: Package installation**
    - Tool: Bash
    - Steps: Check package.json for xendit-node
    - Expected: Package listed in dependencies
    - Evidence: `.sisyphus/evidence/task-3-package.log`

  **Commit**: YES
  - Message: `feat(xendit): install xendit-node SDK and add environment variables`
  - Files: `apps/backend/package.json`, `apps/backend/.env.example`

---

- [x] 4. **Create Xendit service module** - invoice creation
  **Agent**: `quick`
  **What to do**:
  - Create: `apps/backend/src/modules/xendit/service.ts`
  - Create: `apps/backend/src/modules/xendit/model.ts`
  - Create: `apps/backend/src/modules/xendit/index.ts`
  - Methods: `getClient()`, `createInvoice(data)`
  - Add error handling for missing keys
  - Export module

  **Must NOT do**:
  - Hardcode API keys
  - Implement webhook processing here
  - Create API routes here

  **References**:
  - Existing service pattern: `apps/backend/src/modules/billing/service.ts`
  - Xendit SDK docs: `https://github.com/xendit/xendit-node`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 5, Task 10
  - **Blocked By**: Task 3

  **Acceptance Criteria**:
  - [ ] Service file created
  - [ ] Model file created
  - [ ] `createInvoice()` method works
  - [ ] Client initializes with env vars
  - [ ] Error handling for missing keys
  - [ ] Module exports correctly

  **QA Scenarios**:
  **Scenario 1: Service initialization**
    - Tool: Bash (bun repl)
    - Steps: Import and call `getClient()`
    - Expected: Client initializes without errors
    - Evidence: `.sisyphus/evidence/task-4-client.txt`

  **Commit**: YES
  - Message: `feat(xendit): add Xendit service module with invoice creation`
  - Files: `apps/backend/src/modules/xendit/`

---

- [x] 5. **Create webhook handler** - process Xendit payment callbacks
  **Agent**: `quick`
  **What to do**:
  - Create: `apps/backend/src/modules/webhooks/xendit.ts`
  - Add POST endpoint: `/api/webhooks/xendit`
  - Implement token verification (constant-time comparison)
  - Implement invoice callback processing:
    - Verify status is 'PAID'
    - Check payment request exists and is PENDING
    - Grant credits to organization
    - Update payment status to COMPLETED
    - Create credit transaction
  - Add idempotency check (prevent duplicates)
  - Add logging for all events
  - Register route in main app

  **Must NOT do**:
  - Grant credits on success redirect URLs
  - Process webhooks without token verification
  - Process duplicate webhooks
  - Block response for more than 5 seconds

  **References**:
  - BillingService: `apps/backend/src/modules/billing/service.ts`
  - Xendit webhook docs: `https://docs.xendit.co/docs/handling-webhooks`
  - Token verification: Use Node.js crypto module

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 4)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 8, Task 11
  - **Blocked By**: Task 4
  **Acceptance Criteria**:
  - [ ] POST endpoint created at `/api/webhooks/xendit`
  - [ ] Token verification with constant-time comparison
  - [ ] Only PAID status grants credits
  - [ ] Idempotent processing
  - [ ] Credits granted correctly
  - [ ] Logging for all events
  - [ ] Response under 5 seconds
  **QA Scenarios**:
  **Scenario 1: Valid webhook with PAID status**
    - Tool: Bash (curl)
    - Steps: Create test payment, send webhook with valid token
    - Expected: Credits granted, payment marked complete
    - Evidence: `.sisyphus/evidence/task-5-webhook-success.json`
  **Scenario 2: Invalid token**
    - Tool: Bash (curl)
    - Steps: Send webhook with invalid token
    - Expected: 401 response, no data modified
    - Evidence: `.sisyphus/evidence/task-5-invalid-token.json`
  **Scenario 3: Duplicate webhook (idempotency)**
    - Tool: Bash (curl)
    - Steps: Send same webhook twice
    - Expected: Both 200, but credits only granted once
    - Evidence: `.sisyphus/evidence/task-5-idempotency.json`
  **Commit**: YES
  - Message: `feat(webhook): add Xendit webhook handler with idempotent processing`
  - Files: `apps/backend/src/modules/webhooks/xendit.ts`

---

- [x] 6. **Create reconciliation cron job** - catch missed webhooks
  **Agent**: `quick`
  **What to do**:
  - Create: `apps/backend/src/workers/reconciliation.ts`
  - Schedule: Run every 5 minutes
  - Job logic:
    - Find PENDING payment requests (last 48 hours)
    - Call Xendit API for each
    - If PAID, process as if webhook received
    - Log results for monitoring
  - Add error handling for API failures
  - Add rate limiting (max 10 concurrent)
  - Register job with BullMQ
  **Must NOT do**:
  - Block main request flow
  - Process all pending requests (limit to recent)
  - Run more frequently than every 5 minutes
  - Skip error handling
  **References**:
  - BullMQ pattern: `apps/backend/src/workers/index.ts`
  - XenditService: `apps/backend/src/modules/xendit/service.ts`
  - Cron patterns: `https://docs.bullmq.io/patterns/cron`
  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 5)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 11
  - **Blocked By**: Task 5
  **Acceptance Criteria**:
  - [ ] Cron job registered (every 5 minutes)
  - [ ] Finds PENDING payment requests
  - [ ] Calls Xendit API to check status
  - [ ] Processes PAID invoices
  - [ ] Logs results
  - [ ] Error handling implemented
  - [ ] Rate limiting implemented
  **QA Scenarios**:
  **Scenario 1: Job registration**
    - Tool: Bash
    - Steps: `bullmq queues`, verify queue exists
    - Expected: Job registered, queue visible
    - Evidence: `.sisyphus/evidence/task-6-job-registered.log`
  **Scenario 2: Pending payment reconciliation**
    - Tool: Bash
    - Steps: Create pending payment, wait 6 minutes
    - Expected: Job runs, status updated
    - Evidence: `.sisyphus/evidence/task-6-reconciliation.log`
  **Commit**: YES
  - Message: `feat(cron): add reconciliation job for missed Xendit webhooks`
  - Files: `apps/backend/src/workers/reconciliation.ts`

---
- [x] 7. **Update AI service** - use pricing table and reservation pattern
  **Agent**: `deep`
  **What to do**:
  - Update: `apps/backend/src/modules/ai/service.ts`
  - Add method: `calculateCreditCost(modelName): Promise<number>`
    - Query `ai_model_pricing` table
    - Return default 1.0 if not found
  - Add reservation pattern:
    - `reserveCredits(appId, modelName, credits): Promise<string>`
    - `finalizeReservation(appId, reservationId, metadata): Promise<void>`
    - `refundReservation(appId, reservationId): Promise<void>`
  - Update `generateResponse()` and `getSuggestions()`:
    - Calculate cost from pricing table
    - Reserve credits before LLM call
    - If LLM succeeds: finalize reservation
    - If LLM fails: refund reservation
  - Add grace period check:
    - Allow negative up to -100
    - Block requests below -100
  **Must NOT do**:
  - Deduct credits before LLM call
  - Use hardcoded costs
  - Block requests immediately on low balance
  **References**:
  - Current AIService: `apps/backend/src/modules/ai/service.ts`
  - BillingService: `apps/backend/src/modules/billing/service.ts`
  - Pricing table: `apps/backend/prisma/schema.prisma`
  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 8)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 9
  - **Blocked By**: Task 1, Task 8
  **Acceptance Criteria**:
  - [ ] `calculateCreditCost()` returns correct cost
  - [ ] Reservation methods implemented
  - [ ] `generateResponse()` uses pricing table
  - [ ] Credit deduction happens AFTER LLM response
  - [ ] Failed LLM calls trigger refund
  - [ ] Grace period allows negative up to -100
  - [ ] Error messages clear
  - [ ] Logging for all operations
  **QA Scenarios**:
  **Scenario 1: Credit calculation**
    - Tool: Bash (bun repl)
    - Steps: Call `calculateCreditCost()`, verify returns correct cost
    - Expected: Correct cost from pricing table
    - Evidence: `.sisyphus/evidence/task-7-credit-calc.txt`
  **Scenario 2: Reservation and finalization**
    - Tool: Bash (bun repl)
    - Steps: Reserve credits, simulate LLM success, finalize
    - Expected: Reservation finalized, credits deducted
    - Evidence: `.sisyphus/evidence/task-7-reservation.txt`
  **Scenario 3: Grace period - negative balance allowed**
    - Tool: Bash (bun repl)
    - Steps: Set balance to -50, try to reserve credits
    - Expected: Request allowed (within grace period)
    - Evidence: `.sisyphus/evidence/task-7-grace-period.txt`
  **Commit**: YES
  - Message: `feat(ai): refactor credit deduction with pricing table and reservation pattern`
  - Files: `apps/backend/src/modules/ai/service.ts`

---
- [x] 8. **Update BillingService** - add org-level methods and grace period
  **Agent**: `quick`
  **What to do**:
  - Update: `apps/backend/src/modules/billing/service.ts`
  - Add method: `getOrgBalance(orgId): Promise<OrgBalance>`
  - Add method: `topUpOrgCredits(orgId, amount, description, paymentId?): Promise<Transaction>`
  - Add method: `checkLowBalance(orgId): Promise<boolean>`
  - Add method: `sendLowBalanceAlert(orgId): Promise<void>`
  - Add method: `deductOrgCredits(orgId, amount, description, metadata?): Promise<Transaction>`
  - Add grace period logic:
    - `isInGracePeriod(orgId): Promise<boolean>`
    - Allow negative down to -100
  - Add alert configuration:
    - Check `ai_credit_warning_threshold`
    - Send alert if below threshold
    - Update `ai_low_credit_alert_sent` flag
  **Must NOT do**:
  - Change method signatures
  - Skip transaction logging
  - Allow arbitrary negative balances
  **References**:
  - Current BillingService: `apps/backend/src/modules/billing/service.ts`
  - Organization schema: `apps/backend/prisma/schema.prisma`
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 7
  - **Blocked By**: Task 1
  **Acceptance Criteria**:
  - [ ] `getOrgBalance()` returns correct balance
  - [ ] `topUpOrgCredits()` creates transaction
  - [ ] `checkLowBalance()` returns correct status
  - [ ] `sendLowBalanceAlert()` sends notification
  - [ ] `deductOrgCredits()` creates transaction
  - [ ] `isInGracePeriod()` returns correct status
  - [ ] Grace period allows negative up to -100
  - [ ] Alerts sent when threshold reached
  - [ ] Flag updated correctly
  - [ ] All methods use transactions
  **QA Scenarios**:
  **Scenario 1: Get org balance**
    - Tool: Bash (bun repl)
    - Steps: Call `getOrgBalance()`, verify balance returned
    - Expected: Correct balance from organizations table
    - Evidence: `.sisyphus/evidence/task-8-org-balance.txt`
  **Scenario 2: Top-up org credits**
    - Tool: Bash (bun repl)
    - Steps: Call `topUpOrgCredits()`, verify balance updated
    - Expected: Balance incremented, transaction created
    - Evidence: `.sisyphus/evidence/task-8-topup.txt`
  **Scenario 3: Grace period check**
    - Tool: Bash (bun repl)
    - Steps: Test various negative balances
    - Expected: Returns true up to -100, false below -100
    - Evidence: `.sisyphus/evidence/task-8-grace-period.txt`
  **Commit**: YES
  - Message: `feat(billing): add org-level methods and grace period support`
  - Files: `apps/backend/src/modules/billing/service.ts`

---

- [x] 9. **Create admin API endpoints** - credit management
  **Agent**: `unspecified-high`
  **What to do**:
  - Update: `apps/backend/src/modules/super-admin/index.ts`
  - Add endpoints:
    - POST `/api/super-admin/credits/adjust` - manual credit adjustment
    - GET `/api/super-admin/credits/packages` - list packages
    - GET/POST `/api/super-admin/credits/model-pricing` - CRUD pricing
    - GET `/api/super-admin/credits/balance/:orgId` - org balance
    - GET `/api/super-admin/reports/usage` - usage report
  - Add authentication check (super-admin only)
  - Add validation for all inputs
  - Use transactions for data integrity

  **Must NOT do**:
  - Expose without authentication
  - Skip validation
  - Allow arbitrary adjustments without reason

  **References**:
  - Existing super-admin: `apps/backend/src/modules/super-admin/index.ts`
  - BillingService: `apps/backend/src/modules/billing/service.ts`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 10, 13-15
  - **Blocked By**: Task 7, Task 8

  **Acceptance Criteria**:
  - [ ] All endpoints created
  - [ ] Super-admin auth required
  - [ ] Input validation working
  - [ ] Transactions used
  - [ ] Actions logged

  **QA Scenarios**:
  **Scenario 1: Manual credit adjustment**
    - Tool: Bash (curl)
    - Steps: POST adjust endpoint with valid data
    - Expected: Credits adjusted, transaction logged
    - Evidence: `.sisyphus/evidence/task-9-adjust.json`

  **Commit**: YES
  - Message: `feat(admin): add credit management API endpoints`
  - Files: `apps/backend/src/modules/super-admin/index.ts`

---

- [x] 10. **Create billing top-up endpoint** - Xendit invoice creation
  **Agent**: `quick`
  **What to do**:
  - Update: `apps/backend/src/modules/billing/index.ts`
  - Add POST `/api/billing/top-up` endpoint
  - Accept: packageId, orgId
  - Call XenditService.createInvoice()
  - Create payment_requests record (PENDING)
  - Return invoice URL

  **Must NOT do**:
  - Process payments in this endpoint
  - Grant credits here (webhooks only)
  - Skip validation

  **References**:
  - Existing billing: `apps/backend/src/modules/billing/index.ts`
  - XenditService: `apps/backend/src/modules/xendit/service.ts`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 11
  - **Blocked By**: Task 4, Task 8, Task 9

  **Acceptance Criteria**:
  - [ ] Endpoint created
  - [ ] Invoice created via Xendit
  - [ ] Payment request recorded
  - [ ] Invoice URL returned

  **QA Scenarios**:
  **Scenario 1: Successful top-up request**
    - Tool: Bash (curl)
    - Steps: POST with valid package
    - Expected: Invoice URL returned
    - Evidence: `.sisyphus/evidence/task-10-topup.json`

  **Commit**: YES
  - Message: `feat(billing): add top-up endpoint with Xendit integration`
  - Files: `apps/backend/src/modules/billing/index.ts`

---

- [x] 11. **Update billing frontend** - top-up flow
  **Agent**: `visual-engineering`
  **What to do**:
  - Update: `apps/frontend/src/routes/$lang/$appId/billing/index.tsx`
  - Add package cards (Starter, Pro, Enterprise)
  - Add top-up button → calls /api/billing/top-up
  - Redirect to Xendit invoice URL
  - Add loading states
  - Add error handling

  **Must NOT do**:
  - Confirm payments on redirect
  - Create new pages (update existing)

  **References**:
  - Existing billing page: `apps/frontend/src/routes/$lang/$appId/billing/index.tsx`
  - API client: `apps/frontend/src/lib/server.ts`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 12-15
  - **Blocked By**: Task 10

  **Acceptance Criteria**:
  - [ ] Package cards displayed
  - [ ] Top-up button works
  - [ ] Redirect to Xendit
  - [ ] Loading states shown
  - [ ] Errors handled

  **QA Scenarios**:
  **Scenario 1: Package selection and top-up**
    - Tool: Playwright
    - Steps: Click top-up, verify redirect
    - Expected: Redirect to Xendit payment
    - Evidence: `.sisyphus/evidence/task-11-topup-flow.png`

  **Commit**: YES
  - Message: `feat(frontend): add Xendit top-up flow to billing page`
  - Files: `apps/frontend/src/routes/$lang/$appId/billing/index.tsx`

---

- [x] 12. **Create transaction history component**
  **Agent**: `visual-engineering`
  **What to do**:
  - Create: `apps/frontend/src/components/billing/TransactionHistory.tsx`
  - Display transaction list with:
    - Date, type, amount, description
    - Color-code: green (top-up), red (usage)
  - Add loading/empty states
  - Format currency as IDR

  **Must NOT do**:
  - Fetch all data (paginate)
  - Implement real-time updates

  **References**:
  - Component patterns: `apps/frontend/src/components/`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 11

  **Acceptance Criteria**:
  - [ ] Component created
  - [ ] Transactions displayed
  - [ ] Color-coding works
  - [ ] Empty/loading states

  **QA Scenarios**:
  **Scenario 1: Transaction display**
    - Tool: Playwright
    - Steps: Render with test data
    - Expected: All transactions shown correctly
    - Evidence: `.sisyphus/evidence/task-12-transactions.png`

  **Commit**: YES
  - Message: `feat(frontend): add transaction history component`
  - Files: `apps/frontend/src/components/billing/TransactionHistory.tsx`

---

- [x] 13. **Create model pricing admin page**
  **Agent**: `visual-engineering`
  **What to do**:
  - Create: `apps/frontend/src/routes/$lang/admin/model-pricing.tsx`
  - Display pricing table
  - Add inline editing
  - Add validation (positive numbers only)
  - Add success/error toasts

  **Must NOT do**:
  - Complex state management
  - Real-time updates

  **References**:
  - Admin patterns: `apps/frontend/src/routes/$lang/admin/`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 9

  **Acceptance Criteria**:
  - [ ] Page created
  - [ ] Table displays pricing
  - [ ] Inline editing works
  - [ ] Validation working
  - [ ] Toasts shown

  **QA Scenarios**:
  **Scenario 1: Display and edit pricing**
    - Tool: Playwright
    - Steps: Load page, edit price, save
    - Expected: Price updated, toast shown
    - Evidence: `.sisyphus/evidence/task-13-pricing.png`

  **Commit**: YES
  - Message: `feat(frontend): add model pricing admin page`
  - Files: `apps/frontend/src/routes/$lang/admin/model-pricing.tsx`

---

- [ ] 14. **Create organization balance view**
  **Agent**: `visual-engineering`
  **What to do**:
  - Create: `apps/frontend/src/routes/$lang/admin/org-balance.tsx`
  - Display org list with balances
  - Add search/filter
  - Add sort by balance
  - Add CSV export

  **Must NOT do**:
  - Show app-level balances
  - Real-time updates

  **References**:
  - Admin patterns: `apps/frontend/src/routes/$lang/admin/`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 9

  **Acceptance Criteria**:
  - [ ] Page created
  - [ ] Orgs displayed with balances
  - [ ] Search works
  - [ ] Sort works
  - [ ] Export works

  **QA Scenarios**:
  **Scenario 1: Display and search orgs**
    - Tool: Playwright
    - Steps: Load page, search, sort
    - Expected: Results filtered correctly
    - Evidence: `.sisyphus/evidence/task-14-org-balance.png`

  **Commit**: YES
  - Message: `feat(frontend): add organization balance admin view`
  - Files: `apps/frontend/src/routes/$lang/admin/org-balance.tsx`

---

- [ ] 15. **Create credit adjustment admin page**
  **Agent**: `visual-engineering`
  **What to do**:
  - Create: `apps/frontend/src/routes/$lang/admin/credit-adjustment.tsx`
  - Add org search
  - Add adjustment form (amount, reason)
  - Show current balance
  - Display audit log

  **Must NOT do**:
  - Allow arbitrary amounts
  - Skip reason field

  **References**:
  - Admin patterns: `apps/frontend/src/routes/$lang/admin/`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 9

  **Acceptance Criteria**:
  - [ ] Page created
  - [ ] Search works
  - [ ] Adjustment form works
  - [ ] Balance shown
  - [ ] Audit log displayed

  **QA Scenarios**:
  **Scenario 1: Search and adjust credits**
    - Tool: Playwright
    - Steps: Search org, enter amount/reason, submit
    - Expected: Credits adjusted, log updated
    - Evidence: `.sisyphus/evidence/task-15-adjustment.png`

  **Commit**: YES
  - Message: `feat(frontend): add credit adjustment admin page`
  - Files: `apps/frontend/src/routes/$lang/admin/credit-adjustment.tsx`

---

- [ ] 16. **Add environment variables documentation**
  **Agent**: `quick`
  **What to do**:
  - Update: `apps/backend/.env.example`
  - Add XENDIT_SECRET_KEY, XENDIT_CALLBACK_TOKEN, XENDIT_WEBHOOK_URL
  - Add comments explaining each

  **Must NOT do**:
  - Add actual API keys
  - Commit .env file

  **Acceptance Criteria**:
  - [ ] .env.example updated
  - [ ] All Xendit vars documented
  - [ ] Comments added

  **Commit**: YES
  - Message: `docs: add Xendit environment variables documentation`
  - Files: `apps/backend/.env.example`

---

- [ ] 17. **Final QA - Manual Testing**
  **Agent**: `deep`
  **What to do**:
  - Run all QA scenarios from Tasks 1-16
  - Test integration across features
  - Test edge cases (empty states, errors)
  - Save evidence to `.sisyphus/evidence/`

  **Acceptance Criteria**:
  - [ ] All scenarios pass
  - [ ] Integration tested
  - [ ] Edge cases tested
  - [ ] Evidence saved

---

## Final Verification Wave (MANDATORY)

> 4 review agents run in PARALLEL. ALL must approve.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Verify all "Must Have" items exist, all "Must NOT Have" items absent.
  Output: `VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter. Check for `as any`, empty catches, console.log.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Execute ALL QA scenarios from ALL tasks.
  Output: `Scenarios [N/N pass] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  Verify implementation matches spec, no scope creep.
  Output: `Tasks [N/N compliant] | VERDICT`

---

## Success Criteria

- [ ] Database migrated: orgs have credit fields
- [ ] Xendit SDK installed and configured
- [ ] Webhook handler processes payments correctly
- [ ] AI credit deduction uses pricing table
- [ ] Grace period allows negative balances
- [ ] Low credit alerts sent
- [ ] Admin dashboard shows all features
- [ ] Users can top-up via Xendit
- [ ] Reconciliation job runs
- [ ] All manual QA scenarios pass
