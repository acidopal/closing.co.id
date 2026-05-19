---
inclusion: always
---

# Scalebiz — Technology Stack

## Monorepo Structure
- Package manager: Bun (workspaces)
- Linter/Formatter: Biome
- Root: `package.json` with `apps/*` workspaces

## Backend (`apps/backend/`)
- Runtime: Bun
- Framework: ElysiaJS (Hono-like, type-safe)
- Database: PostgreSQL + Prisma ORM (v7, with `@prisma/adapter-pg`)
- Generated client: `apps/backend/src/generated/prisma/`
- Queue: BullMQ + Redis (ioredis)
- Realtime: Socket.io
- Auth: better-auth + bcryptjs
- Storage: AWS S3 / R2 (`@aws-sdk/client-s3`)
- Payments: Xendit
- API docs: `@elysiajs/swagger` + `@elysiajs/openapi`

## Frontend (`apps/frontend/`)
- Framework: React 18 + TanStack Start (SSR)
- Router: TanStack Router (file-based routing)
- State: TanStack Query
- Styling: TailwindCSS v4 + shadcn/ui components
- Rich text: Tiptap
- Charts: Recharts
- Drag & drop: dnd-kit
- Flow editor: @xyflow/react
- API client: Eden Treaty (end-to-end type-safe with ElysiaJS)
- Validation: Zod v4
- Toasts: Sonner
- Icons: Lucide React

## Type Safety
Eden Treaty provides full end-to-end type safety:
```typescript
import { treaty } from "@elysiajs/eden"
import type { App } from "backend"
const api = treaty<App>(API_BASE_URL)
```

## Key Commands
```bash
bun install              # Install deps
bun run dev              # Start both apps
bun run dev:backend      # Backend only
bun run dev:frontend     # Frontend only
bun run db:generate      # Generate Prisma client
bun run db:pull          # Pull DB schema
bun run db:studio        # Prisma Studio
```
