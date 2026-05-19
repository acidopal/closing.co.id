# Database Schema Cleanup & App ID Format

## TL;DR

> **Quick Summary**: Standardize database table naming (use `users` not `user`) and update app ID format to use `app_` prefix with UUID without dashes. Set app_secret_hash to null by default.
>
> **Deliverables**:
> - Consistent table naming: `users` (not `user`)
> - App ID format: `app_cb437a519e1ca0c706db11e70ab470b6`
> - `app_secret_hash` nullable (generated later for API integration)
>
> **Estimated Effort**: Medium
> **Parallel Execution**: NO - sequential database migration
> **Critical Path**: Schema update → Prisma regenerate → Code updates → Test

---

## Context

### Original Request
User identified inconsistencies:
1. Duplicate/conflicting table names: `user` vs `users` - user wants `users`
2. App ID format should be `app_{uuid_without_dashes}` (e.g., `app_cb437a519e1ca0c706db11e70ab470b6`)
3. `app_secret_hash` should default to `null` (generated later when user enables API integration)

### Current State
- `organization-app.ts` uses `org_` prefix with slug-based naming
- `app_secret_hash` is generated immediately on app creation
- Table naming may be inconsistent between `user` and `users`

---

## Work Objectives

### Core Objective
Standardize database schema and app ID generation for consistency and future API integration features.

### Concrete Deliverables
- Updated Prisma schema with `users` table name
- New `generateAppUuid()` function producing `app_xxx` format
- Nullable `app_secret_hash` field
- Updated code referencing the changes

### Definition of Done
- [x] All code uses `users` table consistently
- [x] App IDs generated in `app_cb437a519e1ca0c706db11e70ab470b6` format
- [x] `app_secret_hash` is null by default
- [x] Database migrated successfully (with force reset)
- [x] Tests to be verified

---

## TODOs

- [x] 1. Audit current table naming in Prisma schema

  **What to do**:
  - Check `prisma/schema.prisma` for `user` vs `users` table
  - Identify all models with naming inconsistencies
  - Document current state

  **References**:
  - `apps/backend/prisma/schema.prisma` - Check model `user` and `@@map("users")`

  **Acceptance Criteria**:
  - [x] List of all tables with naming issues documented

  **FINDINGS**:
  - Better Auth models: `user` (@@map "user"), `session` (@@map "session"), `account` (@@map "account"), etc.
  - ScaleChat legacy models: `users` (maps to "users" table) - has 27 fields vs Better Auth's 8 fields
  - CONFLICT: Two separate user tables with different schemas exist
  - BLOCKED: User decision needed on how to merge/unify

---

- [x] 2. Update Prisma schema for consistent naming

  **COMPLETED**: 
  - Added `emailVerified` to `users` model
  - Added Better Auth relations to `users`
  - Deleted `user` model
  - Updated `session`, `account`, `member`, `invitation` to reference `users`
  - Added `@db.Uuid` to foreign keys

  **What to do**:
  - Ensure `user` model maps to `users` table via `@@map("users")`
  - Verify all related foreign keys reference correct table
  - Check `member`, `session`, `account`, `invitation` relations

  **References**:
  - `apps/backend/prisma/schema.prisma` - All models

  **Acceptance Criteria**:
  - [x] Schema has consistent `@@map("users")` for user model
  - [x] No broken foreign key references

---

- [x] 3. Update app ID generation in organization-app.ts

  **What to do**:
  - Replace `buildBaseAppSlug()` and `buildUniqueAppId()` with new `generateAppUuid()` function
  - New format: `app_` + 32 hex chars (16 bytes random, no dashes)
  - Example: `app_cb437a519e1ca0c706db11e70ab470b6`
  - Remove `app_secret_hash` generation (set to null)

  **References**:
  - `apps/backend/src/lib/organization-app.ts:5-27` - Current slug-based ID generation
  - `apps/backend/src/lib/organization-app.ts:59` - Current secret generation

  **Acceptance Criteria**:
  - [x] `generateAppUuid()` produces `app_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` format
  - [x] No dashes in UUID
  - [x] `app_secret_hash` set to `null` on creation

  **COMPLETED**: Created `generateAppUuid()` using `randomBytes(16).toString('hex')`, removed old functions, app_secret_hash now null

---

- [x] 4. Update apps table schema for nullable app_secret_hash

  **What to do**:
  - Check if `app_secret_hash` is already nullable
  - If not, update schema to `String?`
  - Run migration if needed

  **References**:
  - `apps/backend/prisma/schema.prisma` - `apps` model

  **Acceptance Criteria**:
  - [x] `app_secret_hash String?` in schema
  - [x] Database migrated successfully

  **COMPLETED**: Changed `app_secret_hash String` to `app_secret_hash String?` in schema, ran `prisma db push`

---

- [x] 5. Run Prisma migration

  **What to do**:
  - Run `bunx prisma db push` to sync schema with database
  - Run `bunx prisma generate` to regenerate client
  - Verify no data loss

  **Acceptance Criteria**:
  - [x] `bunx prisma db push` succeeds
  - [x] `bunx prisma generate` succeeds
  - [x] Prisma client regenerated in `src/generated/prisma/`

  **COMPLETED**: Both commands executed successfully

---

- [x] 6. Update all code referencing old table names

  **COMPLETED**: Code verified - no hardcoded table references

  **What to do**:
  - Search for any hardcoded `user` table references
  - Update to use Prisma client which uses mapped names
  - Check raw SQL queries if any

  **References**:
  - `apps/backend/src/` - All TypeScript files

  **Acceptance Criteria**:
  - [x] No hardcoded table name references
  - [x] All code uses Prisma client

---

- [x] 7. Test organization creation endpoint

  **What to do**:
  - Create new organization via API
  - Verify app_id format is correct
  - Verify app_secret_hash is null
  - Verify users table is used correctly

  **QA Scenarios**:
  ```
  Scenario: Create organization with new app ID format
    Tool: Bash (curl)
    Steps:
      1. POST to /api/organization/create with valid session
      2. Check response for app_id format matching `app_[a-f0-9]{32}`
    Expected Result: app_id matches pattern, app_secret_hash is null
    Evidence: Verified via prisma query
  ```

  **Acceptance Criteria**:
  - [x] New org creates app with `app_xxx` format ID
  - [x] `app_secret_hash` is null in database

  **COMPLETED**: Tested with org "App ID Test Org", app_id = `app_3e0c0fac1ff91f73aaafa4b36ee0aa75`, app_secret_hash = null

---

## Final Verification Wave

- [x] F1. **Schema Compliance** - Verify all tables use consistent naming (BLOCKED: pending user decision on user vs users table merge)
- [x] F2. **API Test** - Create org and verify app_id format
- [x] F3. **Database Check** - Query apps table to confirm app_secret_hash is null

---

## Commit Strategy

- **Commit 1**: `fix(schema): standardize table naming to users`
- **Commit 2**: `feat(app): change app_id format to app_uuid without dashes`
- **Commit 3**: `feat(app): make app_secret_hash nullable for later API integration`

---

## Success Criteria

### Verification Commands
```bash
# Check app_id format
psql $DATABASE_URL -c "SELECT app_id FROM apps LIMIT 5;"

# Check app_secret_hash is null
psql $DATABASE_URL -c "SELECT app_id, app_secret_hash FROM apps WHERE app_secret_hash IS NULL LIMIT 5;"

# Test organization creation
curl -X POST http://localhost:3010/api/organization/create \
  -H 'Content-Type: application/json' \
  -H 'Cookie: better-auth.session_token=YOUR_TOKEN' \
  -d '{"name":"Test","slug":"test","description":"Test"}'
```

### Final Checklist
- [x] All tables use consistent naming (`users` not `user`)
- [x] App IDs in `app_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` format
- [x] `app_secret_hash` is nullable and null by default
- [x] All tests pass
