FROM oven/bun:1.2.15-alpine AS base
WORKDIR /app

FROM base AS deps
COPY bun.lock package.json tsconfig.json bunfig.toml ./
COPY apps/backend apps/backend
COPY apps/frontend apps/frontend
RUN bun install --frozen-lockfile --ignore-scripts \
	&& ln -s /app/node_modules /app/apps/backend/node_modules

FROM deps AS build
RUN bun run --filter backend build

FROM oven/bun:1.2.15-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/package.json ./apps/backend/package.json
COPY package.json ./package.json

WORKDIR /app/apps/backend
EXPOSE 3010
EXPOSE 3011

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
	CMD wget -q -O- http://127.0.0.1:3010/health || exit 1

CMD ["bun", "run", "dist/index.js"]
