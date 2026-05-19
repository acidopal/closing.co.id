#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./deploy/cloudflare/scripts/check-conversation-d1.sh <conversation_id>

Environment variables:
  D1_DATABASE_NAME   D1 database name from Wrangler config (default: scalebiz)
  D1_TARGET          remote|local (default: remote)
  D1_MESSAGE_LIMIT   last message rows to show (default: 50)
  WRANGLER_CONFIG    Wrangler config path (default: deploy/cloudflare/wrangler.toml)

Examples:
  D1_DATABASE_NAME=scalebiz D1_TARGET=remote ./deploy/cloudflare/scripts/check-conversation-d1.sh 85ecb6a6-b0a3-4db1-96bf-a9152e8e7f35
  D1_DATABASE_NAME=scalebiz D1_TARGET=local ./deploy/cloudflare/scripts/check-conversation-d1.sh 85ecb6a6-b0a3-4db1-96bf-a9152e8e7f35
EOF
}

if [ "${1:-}" = "" ] || [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  usage
  exit 0
fi

CONVERSATION_ID="${1}"
D1_DATABASE_NAME="${D1_DATABASE_NAME:-scalebiz}"
D1_TARGET="${D1_TARGET:-remote}"
D1_MESSAGE_LIMIT="${D1_MESSAGE_LIMIT:-50}"
WRANGLER_CONFIG="${WRANGLER_CONFIG:-deploy/cloudflare/wrangler.toml}"

if ! [[ "${CONVERSATION_ID}" =~ ^[0-9a-fA-F-]{36}$ ]]; then
  echo "Invalid conversation_id format: ${CONVERSATION_ID}"
  exit 2
fi

if ! [[ "${D1_MESSAGE_LIMIT}" =~ ^[0-9]+$ ]]; then
  echo "D1_MESSAGE_LIMIT must be numeric."
  exit 3
fi

if [ ! -f "${WRANGLER_CONFIG}" ]; then
  echo "Wrangler config not found: ${WRANGLER_CONFIG}"
  exit 4
fi

if ! command -v wrangler >/dev/null 2>&1; then
  echo "wrangler command is required."
  exit 5
fi

TARGET_FLAG="--remote"
if [ "${D1_TARGET}" = "local" ]; then
  TARGET_FLAG="--local"
fi

echo "Checking conversation on D1"
echo "conversation_id=${CONVERSATION_ID}"
echo "database=${D1_DATABASE_NAME}"
echo "target=${D1_TARGET}"
echo

SQL_CONVERSATION=$(
  cat <<EOF
SELECT
  c.id,
  c.app_id,
  c.inbox_id,
  c.status,
  c.assignee_id,
  json_extract(CASE WHEN json_valid(COALESCE(c.additional_attributes, '{}')) THEN COALESCE(c.additional_attributes, '{}') ELSE '{}' END, '$.chatbot_followup.next_due_at') AS next_due_at,
  json_extract(CASE WHEN json_valid(COALESCE(c.additional_attributes, '{}')) THEN COALESCE(c.additional_attributes, '{}') ELSE '{}' END, '$.chatbot_followup.next_rule_index') AS next_rule_index,
  json_extract(CASE WHEN json_valid(COALESCE(c.additional_attributes, '{}')) THEN COALESCE(c.additional_attributes, '{}') ELSE '{}' END, '$.chatbot_followup.anchor_at') AS anchor_at,
  json_extract(CASE WHEN json_valid(COALESCE(c.additional_attributes, '{}')) THEN COALESCE(c.additional_attributes, '{}') ELSE '{}' END, '$.chatbot_followup.last_sent_at') AS last_sent_at,
  json_extract(CASE WHEN json_valid(COALESCE(c.additional_attributes, '{}')) THEN COALESCE(c.additional_attributes, '{}') ELSE '{}' END, '$.chatbot_followup.processing_token') AS processing_token,
  json_extract(CASE WHEN json_valid(COALESCE(c.additional_attributes, '{}')) THEN COALESCE(c.additional_attributes, '{}') ELSE '{}' END, '$.chatbot_followup_logs') AS followup_logs_json
FROM conversations c
WHERE c.id = '${CONVERSATION_ID}'
LIMIT 1;
EOF
)

SQL_MESSAGES=$(
  cat <<EOF
SELECT
  m.id,
  m.created_at,
  m.sender_type,
  m.content_type,
  substr(COALESCE(m.content, ''), 1, 180) AS content_preview,
  json_extract(CASE WHEN json_valid(COALESCE(m.additional_attributes, '{}')) THEN COALESCE(m.additional_attributes, '{}') ELSE '{}' END, '$.source') AS source,
  json_extract(CASE WHEN json_valid(COALESCE(m.additional_attributes, '{}')) THEN COALESCE(m.additional_attributes, '{}') ELSE '{}' END, '$.ai_followup') AS ai_followup,
  json_extract(CASE WHEN json_valid(COALESCE(m.additional_attributes, '{}')) THEN COALESCE(m.additional_attributes, '{}') ELSE '{}' END, '$.ai_followup_rule_id') AS ai_followup_rule_id
FROM messages m
WHERE m.conversation_id = '${CONVERSATION_ID}'
  AND (m.deleted_at IS NULL OR m.deleted_at = '')
  AND (m.is_deleted IS NULL OR lower(CAST(m.is_deleted AS TEXT)) IN ('0', 'false', 'f', 'no'))
ORDER BY datetime(COALESCE(m.created_at, '1970-01-01')) DESC, m.id DESC
LIMIT ${D1_MESSAGE_LIMIT};
EOF
)

echo "=== Conversation State ==="
wrangler d1 execute "${D1_DATABASE_NAME}" "${TARGET_FLAG}" --config "${WRANGLER_CONFIG}" --command "${SQL_CONVERSATION}"
echo

echo "=== Last Messages ==="
wrangler d1 execute "${D1_DATABASE_NAME}" "${TARGET_FLAG}" --config "${WRANGLER_CONFIG}" --command "${SQL_MESSAGES}"
