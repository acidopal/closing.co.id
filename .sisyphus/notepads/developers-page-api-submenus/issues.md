# Issues
- Bent dev-server start due to lingering TanStack devtools port 42069, so I had to kill the occupying node process before launching for QA.
- No new issues observed while wiring the shared model into the three developers routes.
- Playwright initially redirected `/developers` to `/login` and could not see submenu selectors until I established an authenticated local session.
- Running two Playwright `browser_run_code` flows in parallel against the same page context caused one `page.goto` abort; serializing the runs resolved it.

- Playwright MCP sandbox only allowed screenshots under the plugin directory; artifacts were copied into `.sisyphus/evidence/` afterward to satisfy required output paths.

- Initial `/developers/api-tools/new` QA failed because the parent `api-tools.tsx` route did not expose `<Outlet />` for child rendering; resolved by adding child-route detection with `useMatches` and returning `<Outlet />` for `/api-tools/new`.
- No remaining blockers after the outlet fix; both happy and empty-state QA screenshots captured successfully.

- `bun run dev:frontend` initially failed again due port `42069` already in use (`EADDRINUSE` from TanStack devtools); resolved by killing the occupying process before rerun.
- Playwright CLI was present but direct `require('playwright')` failed until a temporary `bun add --no-save playwright` install was applied for serial localStorage-seeded screenshot scripting.

- Dev server spawned for the Playwright run exited on its own after the script completed, so a later `kill` against the saved PID reported “no such process” and no manual cleanup was required.
- `bun run dev:frontend` couldn’t start initially because port 42069 was still owned by the TanStack devtools event bus (left over from prior work); killing that node process freed the port and let the server launch cleanly.
- Building the Playwright flow required a disposable `/tmp/playwright-task8` project (npm init + install) so the automation scripts could import Playwright without touching the repo’s lockfile or package manifest.
- Added `scripts/qa/developers-pages.mjs` and ran it after seeding `scalechat_token`, `scalechat_user`, and the org/app context in localStorage so the protected `/developers*` routes load without hitting the login page.
  - Sequential Playwright flows touched `/developers`, `/developers/api-tools`, `/developers/api-tools/new`, and `/developers/messages-sent-by-api`, verifying the API keys accordion, submenu row selectors, back buttons, and deep-links while confirming each page renders in network idle state on both desktop (1280×820) and mobile (`iPhone 13`) viewports.
  - The mobile `messages` table still renders the required headers and maintained a scrollable width (`scrollWidth > clientWidth`), proving the overflow container remains usable when the viewport is narrow.
  - Evidence: `.sisyphus/evidence/developers-overview-desktop.png`, `developers-api-tools-desktop.png`, `developers-api-tools-new-desktop.png`, `messages-api-desktop.png`, and the matching `-mobile.png` versions for each route.
