---
inclusion: always
---

# Scalebiz — Project Structure

## Backend Module Pattern (`apps/backend/src/modules/<feature>/`)
Each module follows a consistent 3-file pattern:
- `index.ts` — ElysiaJS route definitions (Elysia plugin)
- `model.ts` — Zod/Elysia type schemas for request/response validation
- `service.ts` — Business logic, Prisma queries, external API calls

Modules are registered in `apps/backend/src/modules/index.ts`.

## Backend Shared Libraries (`apps/backend/src/lib/`)
- `prisma.ts` — Prisma client singleton
- `redis.ts` — Redis/ioredis connection
- `queue.ts` — BullMQ queue setup
- `realtime.ts` — Socket.io helpers
- `s3.ts` — S3/R2 upload utilities
- `meta-api.ts` — Meta/Facebook Graph API helpers
- `utils.ts` — General utilities

## Frontend Structure (`apps/frontend/src/`)
- `routes/` — TanStack Router file-based routes
  - `$lang/` — Localized routes (e.g., `/en/scalebiz/...`)
  - `admin/` — Super admin routes
- `components/` — React components
  - `ui/` — shadcn/ui primitives (Button, Dialog, etc.)
  - `admin/` — Super admin dashboard components
  - `apps/` — App-specific components
  - `billing/` — Billing & credit components
  - `flows/` — Flow builder components
  - `settings/` — Settings page components
- `hooks/` — Custom React hooks
- `lib/` — Utilities, API client (Eden Treaty), helpers

## Database
- Schema: `apps/backend/prisma/schema.prisma`
- Generated client: `apps/backend/src/generated/prisma/`
- All tables use `app_id` for multi-tenant isolation
- Soft deletes via `deleted_at` column

## Naming Conventions
- Backend modules: kebab-case folders (`agent-settings/`, `auto-assign/`)
- Frontend components: PascalCase files (`ChatWindow.tsx`, `ConversationList.tsx`)
- Frontend routes: kebab-case or `$param` for dynamic segments
- Database tables: snake_case (Prisma model names match table names)
