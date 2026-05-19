# Super Admin Dashboard Learnings

## Schema Findings
- `users`: Standard user table.
- `apps`: Represents companies/organizations in this context.
- `chatbots`: Represents AI models. Each chatbot can have a specific model associated with it.
- `credit_transactions`: Tracks AI credit usage.
    - `type: 'usage'`: Used to track credit consumption.
    - `amount`: Typically negative for usage, hence using `Math.abs()` for aggregation.

## Implementation Details
- `SuperAdminService` is implemented as an abstract class with static methods, following the pattern in `apps/backend/src/modules/billing/service.ts`.
- `getStats()` aggregates:
    - `totalUsers`: Count from `users` table.
    - `totalCompanies`: Count from `apps` table.
    - `activeAIModels`: Count from `chatbots` table where `is_deleted` is false.
    - `totalCreditUsage`: Absolute sum of `amount` from `credit_transactions` where `type` is 'usage'.

## User Management
- `getUsers`: Uses `skip` and `take` for pagination. Supports case-insensitive search on `email` and `name`.
- `updateUserRole`: Updates the `role` field in the `users` table.
- `suspendUser`: Sets the `active` field to `false`. The schema also has a `deleted_at` field, but `active: false` is a more reversible suspension mechanism.

## Company Management
- `getCompanies`: Paginated list of companies from `apps` table. Searchable by `app_name` and `business_name`.
- `updateCompanyStatus`: Toggles the `is_active` flag on the `apps` table.
- `manualCreditTopUp`: Uses `prisma.$transaction` to atomically increment `ai_credits` in the `apps` table and log the entry in `credit_transactions` (type: 'top_up').

## Webhook Logs
- `getWebhookLogs`: Queries the `webhook_events` table. Supports filtering by `app_id` and `status`.
- Uses standard pagination with `skip` and `take`.

## Elysia Models
- Created `apps/backend/src/modules/super-admin/model.ts` using `new Elysia().model({ ... })`.
- Definitions include:
    - `getUsersQuery`: Optional `page` (numeric), `limit` (numeric), and `search` (string).
    - `updateUserRoleBody`: Required `role` (string).
    - `suspendUserParams`: Required `userId` (string).
    - `getCompaniesQuery`: Optional `page` (numeric), `limit` (numeric), and `search` (string).
    - `updateCompanyStatusBody`: Required `isActive` (boolean) to match the service's `is_active` toggle.
    - `manualCreditTopUpBody`: Required `amount` (number) and optional `reason` (string).
    - `getWebhookLogsQuery`: Optional `page` (numeric), `limit` (numeric), `appId` (string), and `status` (string).
- Used `t.Numeric()` for query parameters to handle string-to-number conversion in Elysia.

## Endpoints and Guards
- Created `apps/backend/src/modules/super-admin/index.ts` to expose Super Admin API.
- Implemented `superAdminGuard` as a middleware using `.derive()`.
    - It verifies the session using Better Auth (`auth.api.getSession`).
    - It explicitly checks the `role` field in the `users` table to ensure it is `'super_admin'`.
- Protected Routes:
    - `GET /stats`: Summary of platform activity.
    - `GET /users`: Paginated user list.
    - `PATCH /users/:id/role`: Change user roles.
    - `POST /users/:id/suspend`: Deactivate users.
    - `GET /companies`: Paginated list of organizations.
    - `PATCH /companies/:id/status`: Toggle company active state.
    - `POST /companies/:id/top-up`: Manual credit addition.
    - `GET /webhooks`: Platform-wide webhook event logs.

## Module Registration
- Registered `superAdmin` module in `apps/backend/src/index.ts`.
- Exported `superAdmin` from `apps/backend/src/modules/index.ts` for centralized access.
- Applied `.use(superAdmin)` to both `/api` (compatibility) and `/api/v1` route groups.

## Frontend Layout Refactor
- Created `apps/frontend/src/routes/_admin.tsx` as a layout wrapper for Super Admin pages.
- Implemented `beforeLoad` in TanStack Router to enforce role-based access:
    - Checks for `scalechat_token` and `scalechat_user` in `localStorage`.
    - Redirects to `/login` if authentication data is missing or invalid.
    - Explicitly verifies `user.role === 'super_admin'`.
    - Redirects to `/` if the user does not have the required role.
- This layout allows administrative routes to exist independently of organization-specific contexts (`$appId`).

## Admin UI Components
- Created `AdminSidebar.tsx` and `AdminTopBar.tsx` in `apps/frontend/src/components/admin/`.
- **Styling**: Matched the project's glassmorphism aesthetic using `glass-lg` and indigo accents (`indigo-600`) to distinguish from the standard emerald-themed organization view.
- **AdminSidebar**:
    - Centralized navigation for global platform management (Dashboard, Users, Companies, Webhooks, AI Pricing).
    - Includes a logo with "Admin Console" title.
    - Simplified logout logic that clears `localStorage` and redirects to `/login`.
- **AdminTopBar**:
    - Shows the current "Platform Overview" context.
    - Displays the Super Admin's name retrieved from `localStorage`.
    - Integrated with the mobile sidebar state.
- **Layout Integration**: Updated `_admin.tsx` to wrap the application in these new components, providing a consistent workspace for platform administrators.

## Admin Dashboard Page
- Created `apps/frontend/src/routes/admin/index.tsx` for the platform overview.
- **Data Fetching**:
    - Utilized the Elysia Eden client from `@/lib/server`.
    - Path: `api.api.v1['super-admin'].stats.get()` to match the backend registration.
- **UI Highlights**:
    - Implemented a responsive grid of metric cards.
    - Added loading states (spinner) and error handling with a retry mechanism.
    - Used indigo/purple/blue accents to maintain the admin-specific visual identity.
- **Metrics**: Displays Total Users, Total Companies, Active AI Models, and Total Credit Usage (formatted with locale strings).

## TanStack Router & Query Research (2026-04-09)
- **Query keys should include every pagination/filter parameter** (page, limit, search) so each key is unique and the cache operates deterministically; see `Query Keys` → "If your query function depends on a variable, include it in your query key" (https://github.com/tanstack/query/blob/main/docs/framework/react/guides/query-keys.md#if-your-query-function-depends-on-a-variable-include-it-in-your-query-key).
- **Paginated queries keep `placeholderData`/`keepPreviousData` around** while a new page loads so the UI does not flicker when the `['projects', page]` key changes and keeps the previous page data available until the next page finishes (https://github.com/tanstack/query/blob/main/docs/framework/react/guides/paginated-queries.md#better-paginated-queries-with-placeholderdata).
- **Mutations should invalidate related queries on success** (via `useMutation.onSuccess` + `queryClient.invalidateQueries`, wrapping multiple keys inside `Promise.all` if needed) so suspend/top-up/update actions refresh user/company lists and avoid stale cache after writing data (https://github.com/tanstack/query/blob/main/docs/framework/react/guides/invalidations-from-mutations.md).
- **Router loaders express dependencies and caching**: `loaderDeps` should slice off only the pagination/search params you actually use, the cache keys are built from those deps + the pathname, and `staleTime` defaults to 0 (with `staleReloadMode: 'background'` and `router.invalidate()` to refresh everything) so route-level caches stay in sync with query params (https://github.com/tanstack/router/blob/main/docs/router/guide/data-loading.md#using-loaderdeps-to-access-search-params and https://github.com/tanstack/router/blob/main/docs/router/guide/data-loading.md#dependency-based-stale-while-revalidate-caching).
- **External data loading hooks into TanStack Query**: route loaders should call `queryClient.ensureQueryData` and route components can read through `useSuspenseQuery`, giving predictable route-level data fetching before render (https://github.com/tanstack/router/blob/main/docs/router/guide/external-data-loading.md#a-more-realistic-example-using-tanstack-query).
- **Pitfalls to watch for**: returning the entire `search` object from `loaderDeps` will reload whenever any unrelated search param changes; default `staleTime` is 0 so caches go stale quickly and you may need to tune `staleTime`, `gcTime`, or call `router.invalidate()` manually after critical mutations to avoid showing stale data; `pendingMinMs`/`pendingMs` guard against flashing loaders (https://github.com/tanstack/router/blob/main/docs/router/guide/data-loading.md#using-loaderdeps-to-access-search-params and https://github.com/tanstack/router/blob/main/docs/router/guide/data-loading.md#dependency-based-stale-while-revalidate-caching).

## Frontend Pattern Map (2026-04-09)
- **Dashboard** (`apps/frontend/src/routes/_app/dashboard.tsx`): card grid + charts with refresh button and loading state; reuse `PageHeader`/metric card layout for super-admin overview.
- **Users Manager** (`apps/frontend/src/routes/_app/customers/index.tsx`): debounced search, pagination + metadata counters, sortable columns & visibility toggles, and selection accumulation, which mirrors the expected user list behavior.
- **Companies Manager** (`apps/frontend/src/routes/admin/credit-adjustment.tsx`): organization dropdown search, manual top-up form, and transaction table with load/error handling—ideal for manual balance adjustments and status toggles.
- **Webhook Monitor** (`apps/frontend/src/components/apps/meta-ads-tracker/webhook-log.tsx`): filter input, status badges, and `<details>` payload expansion demonstrate the UI/UX for log tables with collapsible JSON views.
- **Query Key Baseline** (`apps/frontend/src/lib/server.ts`): typed `treaty<App>` client with shared header injection; new super-admin query keys should follow this centralized `api.api` naming.

### Mutation + Invalidation Samples
1. **`admin/credit-adjustment.tsx` (lines 203-245)**: `credits.post` updates on success then re-fetches organizations & selected transactions, matching Super Admin manual top-up flows.
2. **`components/settings/BillingManager.tsx` (lines 51-63)**: `billing['top-up'].post` immediately calls `fetchData()` to refresh balance & transaction history.
3. **`routes/_app/team.tsx` (lines 451-465)**: `agentsManagement.delete` prompts confirmation and re-invokes `loadData()` to refresh agents/divisions/teams.

## Backend Test Notes (2026-04-09)
- Added `apps/backend/test/super-admin.test.ts` to cover `SuperAdminService` pagination for users and companies plus the manual credit top-up transaction path using a mocked Prisma client.
- Tests verify the search filters, skip/take math, and `totalPages` metadata (including the case where there are fewer records than the limit) so UI pagination stays accurate.
- The manual credit top-up test asserts the `$transaction` callback increments `ai_credits` and logs a `credit_transactions` entry with the provided description, guarding the atomic balance update.
- Removed `as any` casts from the Super Admin tests by introducing lightweight Decimal helpers and typed transaction callbacks so the suite remains strict while preserving the existing coverage and behavior.
- Swapped to `@prisma/client-runtime-utils`' `Decimal` in the Super Admin tests so the typed company and credit transaction fixtures align with the Prisma client's generated shapes without resorting to `as any`.

## Admin Dashboard Task 3.1 (2026-04-09)
- Added `apps/frontend/src/routes/admin/index.tsx` as the `/admin/` super-admin dashboard route.
- Data source is `api.api.v1['super-admin'].stats.get()` and the page only renders fields that exist in the current payload: `totalUsers`, `totalCompanies`, `activeAIModels`, and `totalCreditUsage`.
- Implemented admin-consistent indigo card styling, a basic bar chart for platform totals, explicit loading spinner state, and error state with retry button.
- Represented “credits bought vs used” truthfully by showing **Used Credits** from `totalCreditUsage` and labeling **Bought Credits** as not available from current `/super-admin/stats` response (no fabricated field).
- `bun run build` passes after the change; frontend package currently has no `test` script, so `bun --filter frontend test` is not a runnable verification target in this repository state.

## QA Validation Update (2026-04-09)
- Hands-on browser QA for `/admin/` was executed with Playwright in a super-admin localStorage context (`scalechat_token`, `scalechat_user.role = super_admin`).
- In plain local run against the configured API host, browser console recorded CORS failures to `/api/v1/super-admin/stats`; to verify UI behavior deterministically, QA used Playwright route mocking for that endpoint response.
- Verified visible selectors/state: `Total Users`, `Total Companies`, `Active AI Models`, `Total Credits Used`, `Platform Totals`, chart SVG (`svg.recharts-surface`), and clickable `Refresh` button.
- With mocked stats response, console error count was zero and all dashboard checks passed.
