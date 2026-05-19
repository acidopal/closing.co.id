# Decisions
- Keep the new developers route files intentionally minimal (simple centered copy) so that later UI-focused tasks can build on the nested entry points without merging larger markup now.
- Reverted the accidental backend seed/tsconfig changes to keep this task locked to the developers route migration and its notes.
- Rendered API tools and messages placeholders directly from the shared `_model.ts` fixtures so the pending UI work can layer on top without touching hardcoded constants again.
- Enforced `/developers/...` hrefs in `developersSubmenuItems` so navigation text links match the public-facing routes QA agents rely on.
- Logged that the fallback evidence now relies on Playwright’s `--wait-for-selector '[data-testid="messages-api-table"]'` so the captured art reflects visible content rather than a blank shell.
- Implemented a single discriminated row API (`mode: 'link' | 'expandable'`) in `DevelopersSubmenuRow` so T4/T7 can reuse one component instead of maintaining separate link/accordion markup.
- Kept `data-testid` as passthrough (`'data-testid'?: string`) on the reusable row API so deterministic selectors remain controlled by route/model metadata.
- Wired the first expandable host on `/developers` using `apiKeyAccordionContent.accordionTestId` to satisfy T3 interaction QA without expanding into full T4 information architecture.

- Extended `developersSubmenuItems` in `_model.ts` to define the five-row `/developers` IA in metadata so row order/test IDs stay centralized and reusable.
- Implemented clipboard interactions in `routes/_app/developers/index.tsx` via a local async copy helper and transient copied-state labels, avoiding ad-hoc duplicate row markup.

- For the evidence-quality gate, prioritized one labeled stitched image over separate raw captures to make the expand→collapse→expand proof deterministic in a single artifact.
- Kept this retry evidence-only (no developers UI code edits) and refreshed only `.sisyphus/evidence/task-4-developers-overview-error.png` plus append-only notepad entries.

- Kept API Tools list fixtures and state resolution in `routes/_app/developers/-model.ts` so list/empty scenarios remain centralized and reusable by both route UI and QA.
- Implemented `routes/_app/developers/api-tools/new.tsx` as a nested child route while preserving `api-tools.tsx` as the parent entry; parent now routes to `<Outlet />` for `/new` to keep create-shell rendering deterministic.
- Chose frontend-only create-shell controls (form placeholders + disabled submit) to satisfy scope and avoid backend mutation coupling in T5.

- For T6, kept state resolution in shared `routes/_app/developers/-model.ts` and only extended fixtures (added one failed ready-row) so query-driven rendering stays frontend-only and deterministic.
- Implemented export as a disabled UI action (`messages-api-export-action`) with no backend wiring to satisfy shell requirements without violating scope.

- T6 recovery decision: restored `developers-subnav-api-tools` to `/developers/api-tools` in shared submenu metadata and removed agent-link coupling from developers navigation.

- Rendered the new DevelopersSubsectionTabs component immediately after each page header so every `/developers*` view shows the same shared metadata-based nav with a clear active indicator while maintaining the existing section spacing.

- Added an `overflow-x-auto` wrapper around the messages table to honor responsive/table controls without changing the core column layout or introducing additional scroll traps.
- Verified the keyboard path (submenu rows, accordion trigger, subpage back links) through Playwright focus/Enter automation rather than ad-hoc manual checks so the evidence artefacts could also prove accessibility.
- Captured the final desktop and mobile flows via temporary scripts under `/tmp/playwright-task8`, keeping dependency installs outside the tracked repo while still producing `.sisyphus/evidence/task-8-full-flow-*.png`.

- F4 scope-fidelity audit (deep): REJECT due wording mismatch against original ask/plan—shared submenu metadata defines `title: 'AI Tools'` in `apps/frontend/src/routes/_app/developers/-model.ts`, which propagates to overview/tabs labels and diverges from the required `API Tools` submenu naming.
- Confirmed in-scope items otherwise align: required developers routes exist (`index.tsx`, `api-tools.tsx`, `messages-sent-by-api.tsx`), mandatory test IDs are present (`developers-subnav-api-tools`, `developers-subnav-messages-sent-by-api`, `api-keys-accordion`, `messages-api-table`), and T4/T6/T7/T8 evidence artifacts are present under `.sisyphus/evidence/`.
- No unauthorized backend/domain scope expansion detected in reviewed deliverable files; the `/developers/api-tools/new` shell remains frontend-only and is explicitly planned.
- 2026-04-09: Chose to keep the API documentation route minimal (static header/paragraph plus the existing subsection tabs) because the request only needs a placeholder and the TanStack router already wires it in via `createFileRoute`.
- 2026-04-09: Reused the shared Button + SettingsIcon combo from the UI library for card-level actions and left the container structure untouched so existing E2E selectors remain usable.
