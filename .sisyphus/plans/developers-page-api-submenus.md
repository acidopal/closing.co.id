# Developers Submenus + API UI Alignment

## TL;DR
> **Summary**: Restructure `/developers` into route-based subpages, add `API Tools` and `Messages sent by API` submenu entries, and align Developers/API keys UX to the provided references while keeping scope frontend-only.
> **Deliverables**:
> - Route migration from single file to `/developers/*` structure
> - Updated Developers overview with inline API keys accordion concept
> - New `API Tools` page UI
> - New `Messages sent by API` page UI with deterministic states
> - Agent-executable manual QA evidence in `.sisyphus/evidence/`
> **Effort**: Medium
> **Parallel**: YES - 2 waves
> **Critical Path**: T1 Route migration → T4 Developers overview → T7 Cross-page navigation + active states → T8 Full QA sweep

## Context
### Original Request
- `add submenu API Tools`
- `add submenu messages sent by API`
- `change ui developers like image i sent`
- `change api keys concepts like image i sent`

### Interview Summary
- Route decision confirmed: use new child routes under `/developers/*`.
- API keys concept confirmed: keep expandable inline accordion behavior (Open API Access block in expanded content).
- Test strategy confirmed: manual QA only (no new test framework setup).
- Defaults applied (no blocking ambiguity): include `/developers/api-tools/new` create-flow shell based on reference and use `?state=` query toggles for deterministic messages/tools state QA.

### Metis Review (gaps addressed)
- Locked route-first strategy to avoid local-state-only submenu regressions.
- Enforced explicit loading/empty/error states for `Messages sent by API`.
- Enforced role/access preservation via existing app layout and sidebar behavior.
- Enforced stable `data-testid` selectors for deterministic agent QA.
- Guarded against scope creep into backend/domain refactors.

## Work Objectives
### Core Objective
Deliver the Developers experience shown in the references by introducing route-based submenu navigation and page layouts for API Tools and Messages sent by API, while preserving existing app shell/permissions and avoiding backend scope expansion.

### Deliverables
1. `/developers` overview page redesigned into stacked submenu rows/cards matching provided hierarchy.
2. Inline expandable API keys section with copy actions and Open API Access details.
3. New `/developers/api-tools` page with tool cards and “Create New Tool” action area.
4. New `/developers/messages-sent-by-api` page with table layout and deterministic view states.
5. Route-aware active submenu behavior and back-navigation from subpages.
6. QA evidence artifacts for happy path + failure/edge path scenarios.

### Definition of Done (verifiable conditions with commands)
- `bun run build:frontend` succeeds from repo root.
- `bun run dev:frontend` serves app on `http://localhost:3005`.
- `/developers` renders submenu rows including `API Tools` and `Messages sent by API`.
- `/developers/api-tools` and `/developers/messages-sent-by-api` are directly reachable URLs.
- API keys accordion expands/collapses and copy actions are clickable.
- Messages page exposes loading, empty, and error states via deterministic toggles/fixtures.
- QA artifacts exist:
  - `.sisyphus/evidence/task-4-developers-overview-happy.png`
  - `.sisyphus/evidence/task-6-messages-table-happy.png`
  - `.sisyphus/evidence/task-6-messages-empty.png`
  - `.sisyphus/evidence/task-6-messages-error.png`
  - `.sisyphus/evidence/task-8-full-flow-mobile.png`

### Must Have
- Route contract:
  - `/developers` (overview)
  - `/developers/api-tools`
  - `/developers/messages-sent-by-api`
- Consistent design tokens and primitives from existing UI system (`card`, `table`, `accordion`, theme vars).
- Stable test selectors:
  - `data-testid="developers-subnav-api-tools"`
  - `data-testid="developers-subnav-messages-sent-by-api"`
  - `data-testid="api-keys-accordion"`
  - `data-testid="messages-api-table"`
- Back-to-developers affordance on both subpages.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No backend schema/module changes.
- No global theme/token redesign.
- No unrelated sidebar/topbar refactors.
- No introduction of new frontend test framework in this scope.
- No placeholder acceptance criteria requiring human-only judgment.

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: **none (framework addition)** + **manual scripted QA** via Playwright/browser automation + build checks.
- QA policy: Every task includes happy path + failure/edge scenario with saved evidence.
- Evidence root: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Shared dependencies are extracted into Wave-1.

Wave 1 (foundation + reusable UI pieces):
- T1 Route migration skeleton
- T2 Developers shared view-model + fixtures
- T3 Reusable submenu row component
- T4 Developers overview redesign + API keys accordion
- T5 API Tools page scaffolding

Wave 2 (dependent pages + integration + hardening):
- T6 Messages sent by API page states + table
- T7 Cross-page navigation and active-state wiring
- T8 Responsive/accessibility/testid hardening + evidence sweep

### Dependency Matrix (full, all tasks)
| Task | Depends On | Blocks |
|---|---|---|
| T1 | — | T4, T5, T6, T7 |
| T2 | — | T4, T5, T6 |
| T3 | T2 | T4, T7 |
| T4 | T1, T2, T3 | T7, T8 |
| T5 | T1, T2 | T7, T8 |
| T6 | T1, T2 | T7, T8 |
| T7 | T4, T5, T6 | T8 |
| T8 | T4, T5, T6, T7 | F1-F4 |

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 5 tasks → `visual-engineering` (3), `implementation` (2)
- Wave 2 → 3 tasks → `visual-engineering` (2), `testing` (1)
- Final Verification → 4 tasks parallel (`oracle`, `unspecified-high`, `unspecified-high+playwright`, `deep`)

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] T1. Migrate `/developers` to nested route structure

  **What to do**:
  - Replace single file route `apps/frontend/src/routes/_app/developers.tsx` with folder-based routes:
    - `apps/frontend/src/routes/_app/developers/index.tsx`
    - `apps/frontend/src/routes/_app/developers/api-tools.tsx`
    - `apps/frontend/src/routes/_app/developers/messages-sent-by-api.tsx`
  - Keep route definitions on TanStack file-route convention (`createFileRoute('/_app/developers/...')`).
  - Provide minimal placeholder render in child routes immediately so URLs are valid before full UI work.
  - Ensure no manual edit of generated route manifest; let existing tooling regenerate as normal.

  **Must NOT do**:
  - Do not manually edit `apps/frontend/src/routeTree.gen.ts`.
  - Do not change sidebar information architecture outside keeping `/developers` entry working.
  - Do not change auth/role guards in `routes/_app.tsx`.

  **Recommended Agent Profile**:
  - Category: `implementation` — Reason: file-structure migration + route correctness.
  - Skills: [`git-master`] — why needed: safe move/delete/add sequence with clear atomic diff.
  - Omitted: [`frontend-ui-ux`] — why not needed: this task is route plumbing, not visual parity.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: T4, T5, T6, T7 | Blocked By: —

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `apps/frontend/src/routes/_app/developers.tsx:15-17` — current route declaration to preserve path.
  - Pattern: `apps/frontend/src/routes/_app/customers/index.tsx` — folder + index route convention.
  - Guardrail: `apps/frontend/src/routeTree.gen.ts:7-9` — generated file must not be edited manually.
  - Shell behavior: `apps/frontend/src/routes/_app.tsx:84-87` — parent layout route remains unchanged.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `apps/frontend/src/routes/_app/developers.tsx` is removed and replaced by the 3 target files under `routes/_app/developers/`.
  - [ ] `bun run build:frontend` succeeds.
  - [ ] Visiting `/developers`, `/developers/api-tools`, and `/developers/messages-sent-by-api` renders non-error screens.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Route migration happy path
    Tool: Playwright
    Steps: Start frontend (`bun run dev:frontend`); open /developers; open /developers/api-tools; open /developers/messages-sent-by-api
    Expected: All three URLs render app shell + route content without blank/error overlay
    Evidence: .sisyphus/evidence/task-1-route-migration-happy.png

  Scenario: Invalid child path edge case
    Tool: Playwright
    Steps: Open /developers/invalid-child
    Expected: App handles unknown route with router fallback (not frozen/white screen)
    Evidence: .sisyphus/evidence/task-1-route-migration-error.png
  ```

  **Commit**: YES | Message: `feat(developers): migrate developers route to nested structure` | Files: `apps/frontend/src/routes/_app/developers/**`, `apps/frontend/src/routes/_app/developers.tsx` (deleted)

- [x] T2. Introduce shared Developers view-model + deterministic fixtures

  **What to do**:
  - Create a co-located shared module (e.g. `apps/frontend/src/routes/_app/developers/_model.ts`) exporting:
    - submenu metadata (title, description, icon key, href, testId)
    - API key accordion display constants
    - API tools card fixture data
    - messages table fixture data for `ready`, `empty`, and `error` states
  - Add a tiny state resolver helper to map query param `state` (`ready|empty|error|loading`) with safe fallback to `ready`.
  - Keep this module frontend-only and purely presentational (no network calls).

  **Must NOT do**:
  - Do not call backend APIs in this module.
  - Do not hardcode duplicated text separately in multiple route files after this module exists.

  **Recommended Agent Profile**:
  - Category: `implementation` — Reason: typed shared constants + state resolver.
  - Skills: [`git-master`] — why needed: maintain focused commit with reusable model.
  - Omitted: [`playwright`] — why not needed: no browser automation required to build model.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T3, T4, T5, T6 | Blocked By: —

  **References** (executor has NO interview context — be exhaustive):
  - API key copy behavior baseline: `apps/frontend/src/routes/_app/developers.tsx:23-28`.
  - Mock-data pattern baseline: `apps/frontend/src/components/apps/meta-ads-tracker/webhook-log.tsx:25-27`.
  - Theme consistency source: `apps/frontend/src/styles.css:6-39` and `:75-115`.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Shared model file exports typed structures consumed by all new Developers sub-routes.
  - [ ] State resolver returns fallback `ready` for invalid query values.
  - [ ] `bun run build:frontend` succeeds after replacing duplicated literals with model imports.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Shared model consumption happy path
    Tool: Bash
    Steps: Run `bun run build:frontend`
    Expected: Build passes and no unresolved import/type errors from developers model module
    Evidence: .sisyphus/evidence/task-2-model-build.txt

  Scenario: Invalid state fallback edge case
    Tool: Playwright
    Steps: Open /developers/messages-sent-by-api?state=unknown
    Expected: Page renders default ready-state layout (not error fallback)
    Evidence: .sisyphus/evidence/task-2-state-fallback.png
  ```

  **Commit**: YES | Message: `feat(developers): add shared developers view model and state fixtures` | Files: `apps/frontend/src/routes/_app/developers/_model.ts`, consumer route files

- [x] T3. Build reusable Developers submenu row component

  **What to do**:
  - Create a reusable row/card component for Developers list entries (icon, title, description, optional right action, chevron, clickable area).
  - Include `data-testid` passthrough so rows can expose deterministic selectors.
  - Support two modes:
    - `link` mode (navigates to child route)
    - `expandable` mode (hosts API keys accordion trigger/content)
  - Keep styling token-driven and consistent with existing card borders/radii/spacing.

  **Must NOT do**:
  - Do not duplicate row markup independently across all pages.
  - Do not add one-off inline styles that bypass design tokens.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: reusable UI primitive + interaction affordances.
  - Skills: [`frontend-ui-ux`] — why needed: consistent spacing, icon alignment, interaction polish.
  - Omitted: [`organization-best-practices`] — why not needed: unrelated auth/org domain.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T4, T7 | Blocked By: T2

  **References** (executor has NO interview context — be exhaustive):
  - Sidebar section row rhythm: `apps/frontend/src/components/Sidebar.tsx:328-340`.
  - Card primitives: `apps/frontend/src/components/ui/card.tsx:5-20`, `:23-33`, `:72-79`.
  - Accordion primitives: `apps/frontend/src/components/ui/accordion.tsx:6-13`, `:26-53`, `:55-75`.

  **Acceptance Criteria** (agent-executable only):
  - [ ] New row component supports both link and expandable modes with one API.
  - [ ] Row component accepts and renders `data-testid` values.
  - [ ] Hover/focus/active states are visible and keyboard focusable.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Row component interaction happy path
    Tool: Playwright
    Steps: Open /developers; hover and focus each submenu row; activate a link row via keyboard Enter
    Expected: Visual hover/focus states appear; navigation triggers on Enter for link mode
    Evidence: .sisyphus/evidence/task-3-row-component-happy.png

  Scenario: Expandable mode edge case
    Tool: Playwright
    Steps: On /developers, activate expandable row trigger twice
    Expected: First activation expands, second collapses; no layout jump causing overlap
    Evidence: .sisyphus/evidence/task-3-row-component-error.png
  ```

  **Commit**: YES | Message: `feat(developers): add reusable submenu row component` | Files: `apps/frontend/src/components/developers/**` or `apps/frontend/src/routes/_app/developers/**`

- [x] T4. Implement `/developers` overview with API keys accordion concept

  **What to do**:
  - Rebuild `apps/frontend/src/routes/_app/developers/index.tsx` to match the requested structure/order:
    1) API keys (expandable)
    2) Webhooks
    3) API Tools
    4) Messages sent by API
    5) API Documentation
  - Use reusable row component from T3.
  - API keys expanded content must include:
    - Open API Access heading
    - API key display + copy action
    - API documentation link
    - OpenAPI address display + copy action
  - Keep spacing, border radius, muted text tone, and chevron behavior aligned with screenshots while honoring existing token system.

  **Must NOT do**:
  - Do not keep old “Developer Tools” hero-card layout from legacy file.
  - Do not remove Webhooks row/action from overview hierarchy.
  - Do not hardwire external docs URLs in multiple places (source from shared model).

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: high-fidelity layout transformation.
  - Skills: [`frontend-ui-ux`] — why needed: screenshot-faithful component composition and spacing.
  - Omitted: [`playwright`] — why not needed: implementation task; QA in scenario steps.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T7, T8 | Blocked By: T1, T2, T3

  **References** (executor has NO interview context — be exhaustive):
  - Legacy developers baseline to replace: `apps/frontend/src/routes/_app/developers.tsx:31-145`.
  - Page header baseline: `apps/frontend/src/components/PageHeader.tsx:18-64`.
  - Accordion behavior primitive: `apps/frontend/src/components/ui/accordion.tsx:26-53`, `:55-75`.
  - Card token baseline: `apps/frontend/src/components/ui/card.tsx:14-17`.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `/developers` shows all five rows in exact order listed above.
  - [ ] API keys row is collapsed by default and expands inline on trigger.
  - [ ] Expanded API keys content contains both copy controls (key + OpenAPI address).
  - [ ] `data-testid="api-keys-accordion"` exists and is stable.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Developers overview happy path
    Tool: Playwright
    Steps: Open /developers; verify row order; click API keys row to expand; click copy controls
    Expected: Accordion opens inline; both copy triggers are clickable; no visual overlap/clipping
    Evidence: .sisyphus/evidence/task-4-developers-overview-happy.png

  Scenario: Accordion collapse edge case
    Tool: Playwright
    Steps: Expand API keys row, then collapse it, then expand again
    Expected: State toggles reliably and content re-renders without duplicated sections
    Evidence: .sisyphus/evidence/task-4-developers-overview-error.png
  ```

  **Commit**: YES | Message: `feat(developers): redesign developers overview with api keys accordion` | Files: `apps/frontend/src/routes/_app/developers/index.tsx`, shared developers components/model

- [x] T5. Implement `/developers/api-tools` page (list + create flow shell)

  **What to do**:
  - Build `apps/frontend/src/routes/_app/developers/api-tools.tsx` to match reference:
    - Back button to `/developers`
    - Page title + helper description
    - “Create New Tool” primary action
    - Tool cards grid with title/description + settings button
  - Add route `apps/frontend/src/routes/_app/developers/api-tools/new.tsx` for the create-tool form shell shown in reference:
    - left panel: form fields and Create Tool button
    - right panel: request preview/test panel
    - back button to `/developers/api-tools`
  - Seed tools/form defaults from T2 fixtures only (no backend write integration in this scope).

  **Must NOT do**:
  - Do not wire real create/update API mutation endpoints in this task.
  - Do not add unrelated settings persistence.
  - Do not alter global app navigation groups.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: two-page UI composition with screenshot alignment.
  - Skills: [`frontend-ui-ux`] — why needed: card grid rhythm and split-panel form layout.
  - Omitted: [`organization-best-practices`] — why not needed: unrelated org auth scope.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T7, T8 | Blocked By: T1, T2

  **References** (executor has NO interview context — be exhaustive):
  - Route pattern under nested folders: `apps/frontend/src/routes/_app/channels/instagram/index.tsx`.
  - Card/list UI baseline: `apps/frontend/src/components/ui/card.tsx:5-20`, `:72-79`.
  - Header/back pattern: `apps/frontend/src/components/PageHeader.tsx:31-40`.
  - Token source: `apps/frontend/src/styles.css:6-39`, `:75-115`.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `/developers/api-tools` renders back button, title/description, create button, and tool card grid.
  - [ ] Clicking create action navigates to `/developers/api-tools/new`.
  - [ ] `/developers/api-tools/new` renders split-panel create-tool shell with visible form + request preview region.
  - [ ] `bun run build:frontend` succeeds after adding both routes.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: API Tools list + create flow happy path
    Tool: Playwright
    Steps: Open /developers/api-tools; click Create New Tool; verify URL /developers/api-tools/new; click Back to tools
    Expected: Navigation works both directions and both screens render expected structure
    Evidence: .sisyphus/evidence/task-5-api-tools-happy.png

  Scenario: Empty tool list edge case
    Tool: Playwright
    Steps: Open /developers/api-tools?state=empty (state resolver from fixtures)
    Expected: Empty-state messaging appears with visible Create New Tool action
    Evidence: .sisyphus/evidence/task-5-api-tools-error.png
  ```

  **Commit**: YES | Message: `feat(developers): add api tools list and create flow shell` | Files: `apps/frontend/src/routes/_app/developers/api-tools.tsx`, `apps/frontend/src/routes/_app/developers/api-tools/new.tsx`, shared model/components

- [x] T6. Implement `/developers/messages-sent-by-api` table with deterministic states

  **What to do**:
  - Build `apps/frontend/src/routes/_app/developers/messages-sent-by-api.tsx` page structure from reference:
    - Back button to `/developers`
    - Title “Messages sent by API”
    - “Export to Excel” action button (UI-only behavior in this scope)
    - Data table with columns: MESSAGE, CREATED AT, STATUS, ERROR, INBOX, CONTACT, ACTIONS
  - Render row status pills (read/delivered/failed) and action button styling per reference.
  - Implement deterministic view-state switching from query param:
    - `?state=loading`
    - `?state=empty`
    - `?state=error`
    - default ready state

  **Must NOT do**:
  - Do not implement real Excel export backend integration.
  - Do not introduce new backend endpoints.
  - Do not hide failure state; error rows/state must be visibly testable.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: table-heavy page with multiple UI states.
  - Skills: [`frontend-ui-ux`] — why needed: dense table readability and status badge hierarchy.
  - Omitted: [`playwright`] — why not needed: browser QA executed in scenario phase.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: T7, T8 | Blocked By: T1, T2

  **References** (executor has NO interview context — be exhaustive):
  - Table primitives: `apps/frontend/src/components/ui/table.tsx:5-17`, `:53-63`, `:66-89`.
  - Badge style approach: `apps/frontend/src/components/apps/meta-ads-tracker/webhook-log.tsx:77-99`.
  - Existing API client if later wired: `apps/frontend/src/lib/api.ts:221-267`.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `/developers/messages-sent-by-api` shows required title, back button, export action, and table shell.
  - [ ] `data-testid="messages-api-table"` exists on table container.
  - [ ] `state=loading`, `state=empty`, and `state=error` each render distinct deterministic UI.
  - [ ] Ready state renders at least one failed status row with visible error message text.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Messages table ready-state happy path
    Tool: Playwright
    Steps: Open /developers/messages-sent-by-api; verify table headers; verify at least one status pill and one Open Chat action button
    Expected: Table matches required column structure and actions render
    Evidence: .sisyphus/evidence/task-6-messages-table-happy.png

  Scenario: Empty + error state edge cases
    Tool: Playwright
    Steps: Open /developers/messages-sent-by-api?state=empty then /developers/messages-sent-by-api?state=error
    Expected: Empty view shows no-data message; error view shows explicit error banner/message (not blank table)
    Evidence: .sisyphus/evidence/task-6-messages-empty.png and .sisyphus/evidence/task-6-messages-error.png
  ```

  **Commit**: YES | Message: `feat(developers): add messages sent by api page with table states` | Files: `apps/frontend/src/routes/_app/developers/messages-sent-by-api.tsx`, shared model/components

- [x] T7. Wire cross-page navigation + active state + stable selectors

  **What to do**:
  - Ensure submenu rows navigate correctly between overview and subpages:
    - API Tools row → `/developers/api-tools`
    - Messages row → `/developers/messages-sent-by-api`
  - Implement active-state treatment for current subsection (overview row highlight and/or child-page context indicator).
  - Ensure both subpages include explicit back button to `/developers`.
  - Add/verify mandatory selectors:
    - `data-testid="developers-subnav-api-tools"`
    - `data-testid="developers-subnav-messages-sent-by-api"`
    - `data-testid="api-keys-accordion"`
    - `data-testid="messages-api-table"`

  **Must NOT do**:
  - Do not change sidebar group labels/paths.
  - Do not introduce localStorage-based submenu state.
  - Do not break direct deep-link navigation to child routes.

  **Recommended Agent Profile**:
  - Category: `implementation` — Reason: route/state glue and selector guarantees.
  - Skills: [`git-master`] — why needed: safe cross-file updates with clear diff boundaries.
  - Omitted: [`frontend-ui-ux`] — why not needed: visual baseline already established in prior tasks.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T8 | Blocked By: T4, T5, T6

  **References** (executor has NO interview context — be exhaustive):
  - Sidebar entry path authority: `apps/frontend/src/components/Sidebar.tsx:328-334`.
  - Link usage pattern: `apps/frontend/src/components/Sidebar.tsx:115-130`.
  - Route shell/guards: `apps/frontend/src/routes/_app.tsx:218-227`.
  - PageHeader back button API: `apps/frontend/src/components/PageHeader.tsx:11-15`, `:31-39`.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Submenu links navigate to correct target routes from `/developers`.
  - [ ] Back buttons return to `/developers` from both subpages.
  - [ ] Deep-link open of each child route works without prior navigation.
  - [ ] All four required `data-testid` attributes exist and are queryable.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: Navigation wiring happy path
    Tool: Playwright
    Steps: Open /developers; click API Tools row; click Back; click Messages row; click Back
    Expected: URL transitions are correct on each click and returns to /developers each time
    Evidence: .sisyphus/evidence/task-7-navigation-happy.png

  Scenario: Deep-link edge case
    Tool: Playwright
    Steps: Open /developers/messages-sent-by-api directly in a fresh tab/session
    Expected: Page renders correctly with app shell; back button still returns to /developers
    Evidence: .sisyphus/evidence/task-7-navigation-error.png
  ```

  **Commit**: YES | Message: `feat(developers): wire submenu navigation active states and selectors` | Files: developers route files + shared components

- [x] T8. Responsive + accessibility hardening and evidence sweep

  **What to do**:
  - Validate and refine layouts for desktop and mobile:
    - desktop viewport: `1280x800`
    - mobile viewport: `390x844`
  - Ensure table pages remain horizontally usable (scroll container works, no clipped controls).
  - Ensure accordion trigger and row links are keyboard accessible and show visible focus.
  - Capture final consolidated evidence set for full flow across all pages.
  - Run frontend build as final hard gate.

  **Must NOT do**:
  - Do not introduce new visual redesign outside spacing/alignment/accessibility fixes.
  - Do not skip failure-state verification during evidence capture.

  **Recommended Agent Profile**:
  - Category: `testing` — Reason: final cross-page verification and QA evidence completion.
  - Skills: [`playwright`] — why needed: deterministic, repeatable UI traversal and screenshots.
  - Omitted: [`git-master`] — why not needed: this is verification-focused, minimal code edits expected.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: F1-F4 | Blocked By: T4, T5, T6, T7

  **References** (executor has NO interview context — be exhaustive):
  - Table container responsiveness: `apps/frontend/src/components/ui/table.tsx:7-10`.
  - Accordion accessibility baseline: `apps/frontend/src/components/ui/accordion.tsx:32-40`.
  - Existing evidence convention folder: `.sisyphus/evidence/`.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun run build:frontend` succeeds after all refinements.
  - [ ] Desktop and mobile screenshots confirm no clipped primary actions on all three routes.
  - [ ] Keyboard navigation reaches submenu rows, accordion trigger, and back buttons.
  - [ ] Consolidated evidence files are present in `.sisyphus/evidence/`.

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: End-to-end full-flow happy path
    Tool: Playwright
    Steps: Desktop viewport 1280x800; navigate /developers -> /developers/api-tools -> /developers/api-tools/new -> /developers/messages-sent-by-api -> back to /developers
    Expected: All pages render with correct hierarchy and controls; no console-breaking UI state
    Evidence: .sisyphus/evidence/task-8-full-flow-desktop.png

  Scenario: Mobile layout edge case
    Tool: Playwright
    Steps: Mobile viewport 390x844; open each developers route and interact with accordion + table horizontal area
    Expected: Content remains usable (scroll where needed), no overlapped/hidden critical controls
    Evidence: .sisyphus/evidence/task-8-full-flow-mobile.png
  ```

  **Commit**: YES | Message: `chore(developers): complete responsive hardening and qa evidence capture` | Files: touched developers route/components + `.sisyphus/evidence/*`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Manual QA — unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- `feat(developers): migrate developers route to nested /developers/* structure`
- `feat(developers): redesign overview with api keys accordion row concept`
- `feat(developers): add api tools page layout and actions shell`
- `feat(developers): add messages-sent-by-api table states and navigation`
- `chore(developers): add test ids and qa evidence workflow`

## Success Criteria
- User can open Developers and see all required submenu entries in the requested order.
- User can navigate to API Tools and Messages sent by API via submenu and direct URL.
- API keys concept matches requested inline accordion behavior.
- UI alignment is reference-faithful while staying on existing token system.
- Build passes and evidence files prove happy + failure/edge behavior paths.
