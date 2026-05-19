# Issues

## 2026-03-26 Session

### BLOCKED: Table Naming Conflict (user vs users)

**Problem**: Two separate user models exist with different schemas:

| Model | Table | Fields | Purpose |
|-------|-------|--------|---------|
| `user` (Better Auth) | `user` | 8 fields | Authentication |
| `users` (ScaleChat) | `users` | 27 fields | Application users |

**Fields in `user` (Better Auth)**:
- id, name, email, emailVerified, image, createdAt, updatedAt
- Relations: sessions, accounts, members, invitations

**Fields in `users` (ScaleChat)**:
- account_id, password_hash, role, avatar_url, active, phone_number, custom_attributes, app_id, timezone, etc.

**Usage**: Both models are used in the SAME 6 files:
- src/modules/super-admin/service.ts
- src/modules/auth/index.ts
- src/modules/conversation/index.ts
- src/modules/super-admin/index.ts
- src/modules/agent/service.ts
- src/modules/user/service.ts

**User Request**: "redundant table user and users please consistent! i choose table users"

**Options**:
1. **Merge models**: Add ScaleChat fields to Better Auth's `user` model, migrate data, drop `users`
2. **Keep Better Auth's model**: Configure Better Auth to use `users` table via `@@map("users")`
3. **Keep ScaleChat's model**: Migrate Better Auth to use ScaleChat schema

**Decision Needed**: How to merge these tables without breaking Better Auth or losing data.
