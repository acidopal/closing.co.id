---
inclusion: always
---

# Scalebiz — Coding Conventions

## General
- Use TypeScript strict mode everywhere
- Formatter: Biome (tabs, single quotes, no semicolons)
- No `any` types — use proper Prisma types or Zod inference where possible
- Prefer `const` over `let`; never use `var`

## Backend (ElysiaJS + Bun)

### Module Pattern
Every backend feature module in `apps/backend/src/modules/<feature>/` has:
- `index.ts` — Elysia plugin with route definitions, uses `appContext` plugin for auth
- `model.ts` — Elysia `t.Object()` schemas for request/response validation
- `service.ts` — `abstract class` with `static` methods for business logic + Prisma queries

### Route Conventions
- Use `appContext` plugin to resolve `resolvedAppId` for multi-tenant isolation
- Always validate params/query/body with Elysia `t.Object()` schemas
- Return `{ data: ... }` for success, `{ error: string }` for errors
- Set `tags` on Elysia instances for OpenAPI grouping

### Service Conventions
- Services are abstract classes with static methods (no instantiation)
- Import `prisma` from `../../lib/prisma`
- Always filter by `app_id` / `account_id` for tenant isolation
- Use soft deletes (`deleted_at`) where the schema supports it

### Error Handling
- Set `set.status` for non-200 responses
- Return `{ error: 'message' }` — don't throw from route handlers

## Frontend (React + TanStack)

### File Organization
- Components: PascalCase (`ChatWindow.tsx`)
- Hooks: camelCase with `use` prefix (`useTimezone.ts`)
- Lib/utils: camelCase (`api.ts`, `socket.ts`)
- Routes: kebab-case, file-based via TanStack Router

### API Calls
- Use Eden Treaty client from `lib/server.ts` for type-safe calls
- Use `lib/api.ts` fetch wrapper for non-treaty endpoints
- Auth headers injected automatically via `getAuthHeaders()`

### State Management
- Server state: TanStack Query (no Redux/Zustand for API data)
- Local UI state: React `useState` / `useReducer`
- Shared preferences: localStorage helpers in `lib/`

### Component Patterns
- Use shadcn/ui primitives from `components/ui/`
- Modals: separate `*Modal.tsx` component files
- Keep components focused — extract hooks for complex logic
- Use Lucide React for icons

## Database (Prisma)
- All queries must scope by `app_id` or `account_id` for multi-tenancy
- Use `include` / `select` to avoid over-fetching
- Prefer `findMany` with `take` limits over unbounded queries
- Timestamps: `created_at`, `updated_at`, `deleted_at` (soft delete)
