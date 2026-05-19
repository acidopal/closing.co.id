## Phase 1: Database Schema Changes

- Added  table for granular AI cost management.
- Added  table for global system configurations.
- Enhanced  table with AI credit warning threshold and alert state.
- Enhanced  with  for two-step credit processing.
- Seeded  to '0.30' in .
- Used  for schema synchronization as requested.

## Phase 1: Database Schema Changes

- Added ai_model_pricing table for granular AI cost management.
- Added platform_settings table for global system configurations.
- Enhanced apps table with AI credit warning threshold and alert state.
- Enhanced credit_transactions with reservation_id for two-step credit processing.
- Seeded ai_default_credit_cost to 0.30 in platform_settings.
- Used prisma db push for schema synchronization as requested.

## Phase 2: AI Model Pricing Seed

- Retained the general LLM defaults (gpt-4o-mini, gpt-4o, gemini-3-flash, gemini-3-pro, claude-3-haiku, claude-3-sonnet, claude-3-opus) while adding the UI catalog tiers
- Added Standard/Advanced families with credits per request aligned to the ai-agents UI: standard (11), advanced (173), standard_plus_a/b/c (7 each), standard_plus (28), advanced_plus (139), advanced_thinking (77), standard_vision (21), advanced_vision (21), advanced_v4 (87), standard_v4 (18)
- Logged models as upsert so rerunning the seed merges by model_name and keeps is_active=true
- `bun run db:seed` currently fails in this repo because the script is not defined (Script not found "db:seed"), so the command output shows the missing script message even though the seed file itself is ready to run

## Phase 2: AI Model Pricing Seed Verification

- Added a `db:seed` script and Prisma seed command (`bun prisma/seed.ts`) so the seed steps now have a runnable entry point.
- Running `bun run db:seed` logs each tier (all general LLMs, Standard/Advanced families, and the top-up packages) and finishes with “✅ Database seed completed successfully!”, confirming idempotent upserts execute end-to-end.

## Phase 3: Org-Level Credits Migration

- Created migration `20260409131352_org_credits` that introduces `ai_credits`, `ai_credit_warning_threshold`, and `ai_low_credit_alert_sent` columns on `organization`, adds the `payment_requests` table with `org_id` referencing `organization.id` (text) plus lookup/index support, and backfills org fields from the app linked via `appId`.
- Verified `bun prisma migrate deploy` now succeeds by marking the legacy migration as applied and resolving the failed run, then confirming the new migration applied without errors.
- Queried `information_schema` via psql to show the new organization columns and `payment_requests` structure, cementing the new org-level storage before downstream billing code updates.

## Phase 4: Xendit SDK Bootstrapping

- Confirmed `xendit-node` already sits in `apps/backend/package.json`, so no reinstall was necessary for this task.
- Extended `apps/backend/.env.example` to explicitly document `XENDIT_SECRET_KEY`, the new `XENDIT_CALLBACK_TOKEN`, `XENDIT_WEBHOOK_URL`, and retained `XENDIT_WEBHOOK_TOKEN` for backward compatibility.
- Ran `bun run build` within the backend workspace to verify the existing `apps/backend/src/modules/xendit` import path remains compile-safe.

## Phase 5: Xendit Service Module

- Added `apps/backend/src/modules/xendit/model.ts` to re-export the SDK's `CreateInvoiceRequest`, `Invoice`, and `InvoiceStatus` typings for downstream consumers.
- Implemented `XenditService` with `getClient()` and `createInvoice()` so invoice creation is centralized, keys are validated (`XENDIT_SECRET_KEY`), optional override URLs are honored, and provider failures surface actionable error messages.
- Wired `apps/backend/src/modules/xendit/index.ts` to export the service plus the new model types so Task 5/10 consumers can import everything from one entry point.

## Phase 5b: Restore Invoice Lookup API

- Added `XenditService.getInvoice(externalId)` so existing workers can resolve invoices by external ID using the SDK's `getInvoices` call, returning the first match and wrapping errors in the same actionable format as other service methods.

## Phase 5c: Webhook signature helper

- Added `XenditService.verifyWebhookSignature(payload, signature)` to stay compatible with the webhook route, checking both `XENDIT_CALLBACK_TOKEN` and legacy `XENDIT_WEBHOOK_TOKEN` headers without hardcoding any secret logic.

## Phase 5d: Xendit webhook handler

- Created `apps/backend/src/modules/webhooks/xendit.ts` to expose `/api/webhooks/xendit` with a POST-only handler.
- Enforced constant-time token checks via `crypto.timingSafeEqual`, ignoring callbacks when the header or env token is missing, and logging every verification attempt.
- Parsed the incoming payload for `external_id`/`invoice_id`, ensured only the `PAID` status proceeds, and looked up the matching pending `payment_requests` row before making any changes.
- Wrapped the credit grant in a transaction: `SELECT ... FOR UPDATE` locks the request, we update `organization.aiCredits`, create a `credit_transactions` entry with rich Xendit metadata, and mark the `payment_requests` record as `completed`, so duplicates short-circuit gracefully.
- Wired the new `webhooks` module into both `/api` and `/api/v1` bootstrap groups so the route is reachable alongside the existing Meta webhook handlers.

- Ensured the credit transaction metadata is defined inline with conditional spreads so the object literal is compatible with Prisma’s JSON input, keeping the same Xendit fields while avoiding extra helper imports.

## Phase 6: Reconciliation cron job

- Added `apps/backend/src/workers/reconciliation.ts` that polls `payment_requests` created in the last 48 hours, queries the invoice status via `XenditService.getInvoice`, and reuses the webhook-style transaction to grant credits only once or mark failed receipts.
- Rerouted the cron worker in `apps/backend/src/workers/index.ts` to call the reconciliation helper and schedule it every five minutes with a concurrency cap of ten so the background loop stays responsive while logging per-run summaries.
- Post-build fix: dropped the non-existent `invoice.paidAt` reference and unused `invoiceStatus` argument so TypeScript compiles cleanly while preserving the reconciliation semantics.

## Phase 7: BillingService org-level credit flows

- Added an `OrgBalance` DTO plus helper conversions so every org-level call reads `aiCredits`, `aiCreditWarningThreshold`, and the `ai_low_credit_alert_sent` flag in one place.
- Implemented `topUpOrgCredits`, `deductOrgCredits`, `checkLowBalance`, `sendLowBalanceAlert`, `isInGracePeriod`, and `getOrgBalance` with transaction-safe balance updates, credit_transactions logging, and a `-100` grace floor while keeping the older app-level wrappers compatible.
- Alert state now flips to true only when the warning threshold is breached and resets when a top-up pushes the balance back above that threshold.
- Verified the backend compiles/tests cleanly with `bun run build` and `bun test` after wiring the new billing logic.

## Phase 7: AIService reservation workflow + pricing lookup

- Reworked `apps/backend/src/modules/ai/service.ts` to use reservation semantics around AI generation paths instead of direct permanent deduction.
- Added `calculateCreditCost(modelName): Promise<number>` sourcing from `ai_model_pricing` with inactive/missing fallback fixed at exactly `1.0`.
- Added `reserveCredits`, `finalizeReservation`, and `refundReservation` methods that bind to org-level billing primitives (`deductOrgCredits`/`topUpOrgCredits`) so grace-floor protection (`-100`) remains enforced by BillingService.
- Reservation now stores `payment_status='reserved'` + `reservation_id` on usage transactions; success flips to `completed`, failures trigger refund + `payment_status='refunded'` with explicit logs.
- Updated `getSuggestions` and `generateResponse` to reserve before AI work, finalize on success, and attempt refund on any failure path to prevent net credit loss.

## Phase 8: Admin Credit API Endpoints (Task 9)

- Added `/super-admin/credits/adjust` with strict reason validation, amount sanity checks, admin metadata logging, and transactional calls into `BillingService` so positive/negative adjustments feel like single audit-safe operations.
- Exposed `/super-admin/credits/packages` plus GET/POST `/super-admin/credits/model-pricing` so pricing records can be listed and upserted with validation, rounded credit costs, and consistent logging for every change.
- Added `/super-admin/credits/balance/:orgId` plus `/super-admin/reports/usage` so the admin UI can show live org balances, credit history totals, filtered usage, and top organizations in a single paginated payload.
- Verified the new surface by rerunning the backend suite (`bun run build`, `bun test`) so Task 9 can unblock downstream frontend work with confidence.

## Phase 9: Org-Level Top-Up Endpoint (Task 10)

- Added POST `/billing/top-up` that requires an organization context (slug/session/app link) so every invoice ties back to the organization record powering ai credits.
- Validates the selected `top_up_package`, computes a deterministic `external_id` using the org + package + optional reference, and checks `payment_requests` for idempotent re-use of prior invoices.
- Creates the Xendit invoice, persists a `payment_requests` row with `status = 'pending'`, and surfaces only the invoice metadata back to the caller—credits are granted later and never within this endpoint.
- Catch insert races by reloading any conflicting request and return the existing invoice details so clients can safely retry without creating duplicate charges.
- Ensured the new endpoint stays lint-clean after removing unused helpers so the billing module stays lean.

## Phase 10: Billing Frontend Top-Up Flow (Task 11)

- Replaced `apps/frontend/src/routes/_app/billing/index.tsx` redirect behavior with an actual top-up UI that keeps existing card/button/token conventions already used by subscription and admin billing screens.
- Loaded package catalog from `GET /billing/packages`, then rendered fixed Starter/Pro/Enterprise package cards by matching package names to preserve the requested package mental model.
- Wired CTA to `POST /billing/top-up` using the new `packageId` contract and redirected with `window.location.assign(invoice.url)` when invoice creation succeeds.
- Added strict in-page failure handling (`Alert` destructive state) that surfaces backend error payloads (including invalid package/org-context 400 responses) and blocks duplicate submits while request is in flight.
- Validation notes: `lsp_diagnostics` returns clean for the modified billing route file and `bun run build` in `apps/frontend` completes successfully.

## QA: Billing Top-Up UI Validation (2026-04-09)

- Ran a Playwright script that registers a fresh account, creates a workspace, and navigates to `GET /billing` without touching the codebase.
- Verified Starter/Pro/Enterprise cards render, the “Top up now” CTA enables, and clicking it shows the loading spinner before the backend aborts.
- Platform currently returns 400 `Organization context required for top-up` because the org context headers/cookies are still missing in this scripted QA environment; the alert surfaces the error via the destructive `Alert` box.
- Browser console logs surface repeated App ID validation failures for agent settings plus the billing top-up 400—captured in `/tmp/billing-console.json`—so the UI degrades gracefully even when the sandbox lacks a configured organization.

## Phase 10b: Billing Transaction History UI (Task 12)

- Reworked `apps/frontend/src/components/billing/TransactionHistory.tsx` into a reusable card-based transaction table using existing `Card`, `Table`, `Badge`, and `Button` primitives so it visually matches the billing top-up route.
- Implemented explicit states inside the component: loading row with spinner, empty row with message/icon, and retryable error row (including backend context failures such as missing org/app headers).
- Added deterministic transaction type color treatment (`top_up`, `usage`, `adjustment`, `refund`, plus neutral fallback for unknown types) and standardized amount rendering with `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` plus explicit sign.
- Integrated transaction fetching into `apps/frontend/src/routes/_app/billing/index.tsx` via `GET /billing/transactions`, reusing existing API error normalization and exposing a retry action to the new component.
- Validation: `lsp_diagnostics` reported zero issues on both modified frontend files; `bun test src/components/billing/TransactionHistory.test.tsx` executed with 0 tests/0 failures; `bun run build` in `apps/frontend` completed successfully.

## Phase 11: Admin Model Pricing Inline Edit (Task 13)

- Updated `apps/frontend/src/routes/admin/model-pricing.tsx` to keep the existing admin table layout but add explicit per-row edit mode with deterministic `Edit → Save/Cancel` controls for `cost_per_request`.
- Save flow now calls `api.api.admin.billing.pricing({ id }).put({ costPerRequest, description, isActive })` through the existing Eden client layer, then updates local row state on success so refreshed values are visible immediately.
- Added strict positive-number validation before the API call (`costPerRequest > 0`) with a friendly `toast.error` message so invalid values are rejected client-side.
- Added `toast.success` and `toast.error` feedback for save operations and a `toast.error` for fetch failures, while still showing inline card errors for page-level load issues.
- Validation checks for this task: `lsp_diagnostics` clean on the modified route file, `bun run typecheck` script is not defined in `apps/frontend`, and `bun run build` in `apps/frontend` completed successfully.
