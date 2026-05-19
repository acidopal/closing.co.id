# Learnings

## 2026-03-26 Session: App ID Format Change

### App ID Generation
- Old format: `org_{slug}_{random4}` (max 64 chars, slug-based)
- New format: `app_{32_hex_chars}` (36 chars total, random)
- Implementation: `randomBytes(16).toString('hex')` produces 32 hex chars
- Regex: `/^app_[a-f0-9]{32}$/`

### App Secret
- Was: Generated immediately as plain hex (not hashed!)
- Now: Set to `null` by default
- Schema: Changed `app_secret_hash String` to `app_secret_hash String?`

### Prisma 7 Adapter Pattern
- Requires adapter for database connection
- Use `PrismaPg` adapter with `pg` Pool:
  ```typescript
  import { Pool } from 'pg'
  import { PrismaPg } from '@prisma/adapter-pg'
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  ```

## Better Auth Table Mapping
- Better Auth models use `@@map("table_name")` for custom table names
- Default Better Auth models: user, session, account, verification, organization, member, invitation
- Each can be remapped via `@@map("users")` etc.
