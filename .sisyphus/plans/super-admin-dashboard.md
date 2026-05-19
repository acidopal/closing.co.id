# Super Admin Dashboard End-to-End Implementation

## Phase 1: Backend Services & API (Super Admin Plugin)
- [x] TASK 1.1 — Create `SuperAdminService` with `getStats()` to aggregate total users, companies, active AI models, and total revenue/credit usage.
- [x] TASK 1.2 — Add `getUsers()`, `updateUserRole()`, and `suspendUser()` to `SuperAdminService`.
- [x] TASK 1.3 — Add `getCompanies()`, `updateCompanyStatus()`, and `manualCreditTopUp(appId, amount, reason)` to `SuperAdminService`.
- [x] TASK 1.4 — Add `getWebhookLogs(appId?, status?)` to query `webhook_events` with pagination and filters.
- [x] TASK 1.5 — Create `apps/backend/src/modules/super-admin/model.ts` for Elysia validation schemas.
- [x] TASK 1.6 — Create `apps/backend/src/modules/super-admin/index.ts` to expose endpoints (`/super-admin/*`) protected by `superAdminGuard`.
- [x] TASK 1.7 — Register the `superAdminModule` in `apps/backend/src/index.ts`.

## Phase 2: Frontend Global Routing & Layout (The Clean `/admin` Path)
- [x] TASK 2.1 — Refactor frontend layout setup: Create `apps/frontend/src/routes/_admin.tsx` as a layout wrapper that checks `agent?.role === 'super_admin'` (redirects to `/` if not). This allows routes without `$lang` or `$appId`.
- [x] TASK 2.2 — Create `apps/frontend/src/components/admin/AdminSidebar.tsx` and `AdminTopBar.tsx` (a simplified version of the main sidebar, specific to Super Admin navigation: Dashboard, Users, Companies, Webhooks, AI Pricing).
- [x] TASK 2.3 — Create `apps/frontend/src/routes/admin/index.tsx` (Dashboard landing page).

## Phase 3: Frontend Views (Admin Pages)
- [x] TASK 3.1 — Build **Dashboard Page** (`/admin/`): Display overview cards (Total Users, Companies, Total Credits Bought vs Used) and basic charts if data permits.
- [ ] TASK 3.2 — Build **Users Manager** (`/admin/users`): Table with search, pagination, and actions to "Promote to Admin/Super Admin" or "Suspend".
- [ ] TASK 3.3 — Build **Companies Manager** (`/admin/companies`): Table showing `apps`/`organizations`, their current `ai_credits` balance, with an action modal for "Manual Top-Up" and "Status Toggle".
- [ ] TASK 3.4 — Build **Webhook Monitor** (`/admin/webhooks`): Table connecting to `webhook_events`, filterable by `app_id` dropdown, status (success/failed), and showing the JSON payload in a collapsible row/modal.

## Phase 4: Integration & Testing
- [ ] TASK 4.1 — Ensure TanStack Query keys are set up correctly in `apps/frontend/src/lib/server.ts` (if needed) for the new `/super-admin` endpoints.
- [x] TASK 4.2 — Write unit tests for `SuperAdminService` (`apps/backend/test/super-admin.test.ts`) covering pagination and top-up logic.
- [ ] TASK 4.3 — Integration verification: Verify all admin views load correctly and manual top-up reflects on the company's billing history.
