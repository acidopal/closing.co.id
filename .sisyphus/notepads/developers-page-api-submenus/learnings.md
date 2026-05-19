# Learnings
- Developers routes now require a directory-per-path layout so TanStack Router can auto-register each submenu.
- Verified with Playwright CLI that `/developers`, `/developers/api-tools`, and `/developers/messages-sent-by-api` render while `/developers/invalid-child` falls back cleanly.
- Centralized developers submenu, API tools, and messages fixtures into `_model.ts` so every sub-route consumes the same metadata and test IDs without duplicating copy.
- Adjusted submenu hrefs to the user-facing `/developers/*` routes to keep navigation friendly and consistent with the public URLs.
- Captured `.sisyphus/evidence/task-2-state-fallback.png` showing the ready-state table when `?state=unknown` is supplied.
- Prevented blank screenshot captures by letting Playwright wait for `[data-testid="messages-api-table"]` before taking the fallback evidence image.
- A reusable `DevelopersSubmenuRow` now lives at `apps/frontend/src/components/developers/submenu-row.tsx` and supports both `mode="link"` and `mode="expandable"` with one shared row layout.
- Keeping the row shell on `Card` plus expandable behavior on `Accordion` preserved token-driven spacing/radius/focus styles without duplicating row markup.
- For deterministic Playwright QA behind auth-guarded routes, pre-seeding `localStorage` (`scalechat_token` + `scalechat_user` with admin role) lets `/developers` interactions run reliably.
- Fixed T3 compile typing by aligning `DevelopersSubmenuRow` with Base UI Accordion Root props (`multiple/defaultValue[]`) instead of unsupported `type/collapsible` props.
- For unambiguous T3 QA artifacts, a single stitched screenshot per scenario (labeled Step 1/Step 2) clearly proves keyboard Enter navigation and accordion expand→collapse state transition.

- T4 `/developers` overview now renders in exact order: API Keys (expandable), Webhooks, API Tools, Messages sent by API, API Documentation, with links kept on `/developers/*`.
- API keys accordion remains collapsed by default and now includes working copy controls for both the API key and OpenAPI address, plus an inline API docs link under the Open API Access heading.
- T4 QA evidence captured with Playwright: `.sisyphus/evidence/task-4-developers-overview-happy.png` (order + expand + copy controls) and `.sisyphus/evidence/task-4-developers-overview-error.png` (expand→collapse→expand without duplicate panels).

- T4 evidence retry now uses a single stitched artifact with explicit labels (`Step 1 Expanded`, `Step 2 Collapsed`, `Step 3 Expanded Again`) so the accordion transition sequence is unambiguous at a glance.
- Self-check via `look_at` confirms the regenerated `task-4-developers-overview-error.png` visibly shows expanded content, hidden/collapsed state, and expanded content again.

- For file-based nested routes like `/_app/developers/api-tools/new`, the parent route file (`api-tools.tsx`) must delegate to `<Outlet />` on child matches; otherwise the URL changes but the child shell never renders.
- Added `resolveApiToolsState` in the shared developers model so `?state=empty` QA remains deterministic without duplicating state parsing in-page.
- Playwright MCP can write screenshots directly to absolute workspace paths, which made `.sisyphus/evidence/task-5-api-tools-{happy,error}.png` capture deterministic.
- For T5 evidence clarity, one serial Playwright flow can capture step-1 and step-2 states and stitch them into a single labeled artifact that proves list→create transition in one image.

- T6 `/developers/messages-sent-by-api` now uses shared `Table` primitives and keeps `data-testid="messages-api-table"` mounted for `ready|loading|empty|error`, which made state QA deterministic from one selector.
- Ready-state fixtures now include a failed message row with inline error text (`Error: Recipient number rejected by downstream provider.`), so failure visibility is explicit in happy-state evidence.

- T6 fix: message table headers/columns now follow exact required sequence (`MESSAGE`, `CREATED AT`, `STATUS`, `ERROR`, `INBOX`, `CONTACT`, `ACTIONS`) while preserving deterministic `ready|loading|empty|error` rendering.

- Added a shared DevelopersSubsectionTabs nav (powered by the developers view model metadata) so the Overview, API Tools, and Messages sections show consistent titles and an accessible active-state indicator on every `/developers*` page.
- Playwright task-7 automation now seeds `scalechat_token` + JSON-serialized `scalechat_user` before navigating so the nav/back flows are captured cleanly for the new task-7 navigation happy/error evidence.

- Wrapped the messages table in an `overflow-x-auto` container so narrow phones can scroll the >760px table without clipping actions or controls while the desktop layout still renders a full table.
- Keyboard focus on `[data-testid]` rows, accordion trigger, and back buttons was validated by Playwright flows that focused each target, used Enter to activate, and returned to `/developers` before taking the final evidence shots.
- Desktop/mobile flow proof also reused localStorage seeding (scalechat_token/refresh/app_id/org_slug/secret plus a JSON `scalechat_user`) to bypass auth gating so deterministic 1280x800 and 390x844 evidence could be captured in one shot each.

- F1 audit (plan compliance): required selectors are present (`developers-subnav-api-tools`, `developers-subnav-messages-sent-by-api`, `api-keys-accordion`, `messages-api-table`) and required evidence files for tasks 4/6/7/8 are present under `.sisyphus/evidence/`.
- F1 audit (plan compliance): found requirement mismatches in implementation — Developers submenu label is `AI Tools` instead of required `API Tools` (`apps/frontend/src/routes/_app/developers/-model.ts`), Messages action label is `Export CSV` instead of required `Export to Excel` (`apps/frontend/src/routes/_app/developers/messages-sent-by-api.tsx`), and API Tools cards do not expose a settings button (`apps/frontend/src/routes/_app/developers/api-tools.tsx`).
- F1 audit (scope fidelity): evaluated `/developers*` implementation remains frontend-only (fixture/state-driven, no backend calls), but branch-level git status currently includes many unrelated backend/frontend modifications that should be excluded from this deliverable review scope.
- Code review note: `DevelopersSubsectionTabs` normalizes trailing slashes and sets `aria-current="page"` on each `role="tab"` link, which keeps the Overview/API Tools/Messages tabs keyboard-focusable while still highlighting the active subsection even for nested routes like `/developers/api-tools/new`.
- Issue observed: the shared submenu metadata exports `title: 'AI Tools'` and still points the docs/cop actions at `/developers/api-documentation`, yet no matching route file exists in `apps/frontend/src/routes/_app/developers/`; this makes the API Tools tab/row label diverge from the requested "API Tools" copy and clicking the API Documentation row/link resolves to a dead route, so the shared metadata should be corrected (rename to "API Tools" and point to a real route).
- 2026-04-09: Renamed the developer submenu entry to "API Tools" and aligned the exported messages action copy with the reviewer ask while keeping the existing test IDs and structure intact.
- 2026-04-09: Adding a per-card Settings control inside the API Tools grid is best done inside each card content row so the badge layout stays untouched, and an auth-mocked Playwright smoke test can cover all three routes by seeding the expected localStorage keys before each navigation.
