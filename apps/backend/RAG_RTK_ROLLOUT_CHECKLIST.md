# RAG + RTK + Mandatory AI Telemetry Rollout Checklist

This checklist is for staging/prod rollout and post-deploy verification.

## 1) Apply migrations (staging first)

Run from repo root:

```bash
pnpm --filter backend exec prisma migrate status
pnpm --filter backend exec prisma migrate deploy
```

Expected after deploy:
- `ai_response_logs` exists.
- `embeddings` has `faq_id` and `chunk_index`.

## 2) Deploy API + worker together

Because telemetry and knowledge lifecycle rely on queue workers, deploy API and worker in one release window.

Required maintenance jobs:
- `retry-ai-response-log`
- `knowledge-change-event`
- `sync-knowledge-index`
- `purge-knowledge-index`

## 3) Smoke test all AI entrypoints

Trigger at least one AI response per entrypoint:
- `simulate`
- `webhook_live`
- `flow_runtime`
- `followup`

For staging smoke tests, ensure each path sends a normal user-visible message and does not fail-open.

## 4) Verify telemetry rows and integrity

Use automated verifier:

```bash
cd apps/backend
bun run scripts/verify-ai-telemetry.ts --hours 24 --require-entrypoints
```

Optional scoping:

```bash
bun run scripts/verify-ai-telemetry.ts --hours 6 --app-id <app_uuid> --chatbot-id <chatbot_uuid> --require-entrypoints
bun run scripts/verify-ai-telemetry.ts --hours 1 --conversation-id <conversation_uuid>
```

Success criteria:
- `ai_response_logs` table exists with full required columns.
- Rows exist in selected window.
- Mandatory entrypoints are present.
- No invalid token/cost fields.
- `rtk_summary` is object-shaped.
- No sustained spike on `retry_pending` or `failed`.

## 5) Knowledge lifecycle checks (update/delete)

### Update scenario
- Update source/faq content.
- Confirm lifecycle jobs execute (`knowledge-change-event` -> `sync-knowledge-index`).
- Confirm retrieval uses latest content.
- Confirm source status transitions to `processing` then `ready` (for source).

### Delete scenario
- Delete source/faq (soft delete).
- Confirm retrieval excludes deleted item immediately.
- Confirm purge job executes (`knowledge-change-event` -> `purge-knowledge-index`).
- Confirm old `ai_response_logs` still preserve reference snapshot data.

## 6) Rollback safety

If anomaly occurs:
- Keep API response path live (logging failure already fail-open + retry queue).
- Pause only worker consumer if needed, investigate queue backlog and failed jobs.
- Do not drop `ai_response_logs` (it is audit source of truth).
