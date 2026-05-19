#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/closing.co.id}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/.env.production.local}"
DEPLOY_REF="${DEPLOY_REF:-origin/main}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d%H%M%S)}"
COMPOSE_FILE="${APP_DIR}/deploy/docker-compose.production.yml"

if [ ! -f "${ENV_FILE}" ]; then
  echo "Missing ${ENV_FILE}"
  exit 1
fi

cd "${APP_DIR}"

git fetch origin main --prune
git checkout --force "${DEPLOY_REF}"

export IMAGE_TAG

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build --pull backend-api frontend
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d postgres redis
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" run --rm migrate
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --remove-orphans backend-api backend-worker backend-scheduler frontend

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" ps
docker image prune -f >/dev/null
