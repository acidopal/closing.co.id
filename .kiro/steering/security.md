---
inclusion: always
---

# Scalebiz — Security Best Practices

- Never commit secrets, tokens, or API keys — use environment variables
- `.env` in `.gitignore`, only `.env.example` committed
- All API endpoints must validate input via Elysia `t.Object()` schemas
- Always scope DB queries by `app_id`/`account_id` — never allow cross-tenant access
- Sanitize user input before storing or rendering (XSS prevention)
- Use parameterized queries (Prisma handles this) — never concatenate SQL
- Auth tokens validated on every request via `appContext` plugin
- Rate limit sensitive endpoints (auth, webhook)
- File uploads: validate MIME types and file sizes before S3/R2 upload
- Dependencies: regularly audit for vulnerabilities
- Docker: non-root user, minimal base images (alpine), no secrets in build args
- CORS: configure explicitly, no wildcard `*` in production
