---
inclusion: always
---

# Scalebiz — Docker Best Practices

- Multi-stage builds to minimize image size
- Alpine-based images (`node:20-alpine`, `oven/bun:1-alpine`)
- Run as non-root user in production
- Copy package files first → install deps → copy source (layer caching)
- Use `.dockerignore` to exclude node_modules, .git, .env, dist
- No secrets in Dockerfile or build args — use runtime env vars
- Pin base image versions — never use `:latest`
- Add HEALTHCHECK instruction for production containers
