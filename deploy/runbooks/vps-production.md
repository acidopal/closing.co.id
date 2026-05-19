# VPS Production Runbook (K3s Single Node)

## 1) Preconditions

- DNS points to VPS origin:
  - `app.scalebiz.chat`
  - `api.scalebiz.chat`
- Managed external state:
  - `DATABASE_URL` points to managed Postgres
  - `REDIS_URL` points to managed Redis
- Kubernetes secret exists in `scalebiz` namespace (`scalebiz-secrets`)

## 2) One-Time TLS Bootstrap

```bash
ACME_EMAIL=ops@scalebiz.chat ./deploy/scripts/setup-cert-manager.sh
```

## 2.1) Meta Webhooks mTLS Root CA (Required for Meta CA Migration)

```bash
./deploy/scripts/create-meta-webhook-mtls-secret.sh
```

Then enable Helm values:
- `webhookIngress.enabled=true`
- `webhookIngress.host=webhook-api.scalebiz.chat` (or your chosen webhook-only host)
- `webhookMtls.enabled=true`
- `webhookMtls.traefik.caSecretName=meta-webhooks-ca`
- `webhookMtls.traefik.clientAuthType=VerifyClientCertIfGiven`

Recommended callback URL in Meta App:
- `https://webhook-api.scalebiz.chat/api/v1/webhooks/whatsapp`

## 3) Standard Deploy (Near-Zero Downtime)

CI path (aktif):
- Push ke `main` triggers `.github/workflows/ci-cd.yml`
- Build image backend/frontend di GitHub runner
- Transfer image archive ke VPS via SSH
- Import image ke K3s (`k3s ctr images import`)
- Deploy uses `helm upgrade --install --atomic --wait --timeout 10m --history-max 20`

GitHub Environment secrets (environment `Dev`) yang wajib:
- `SSH_HOST`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `SSH_SUDO_PASSWORD` (boleh kosong jika sudo passwordless)

## 4) Post-Deploy Verification

```bash
curl -fsS https://api.scalebiz.chat/health
curl -fsSL https://app.scalebiz.chat/login >/dev/null
```

CI pipeline also validates websocket handshake for:
- `wss://api.scalebiz.chat/socket.io/?EIO=4&transport=websocket`

## 5) Live Logs

```bash
kubectl -n scalebiz logs deployment/scalebiz-api -f --since=10m
kubectl -n scalebiz logs deployment/scalebiz-frontend -f --since=10m
kubectl -n scalebiz logs deployment/scalebiz-worker -f --since=10m
kubectl -n scalebiz logs deployment/scalebiz-scheduler -f --since=10m
```

## 6) Rollback Trigger Conditions

Rollback wajib jika salah satu ini terjadi pasca deploy:
- API health check gagal berulang (>3 kali)
- Frontend login endpoint gagal berulang
- Socket.IO handshake gagal berulang
- Queue worker backlog naik terus dan tidak turun
- Error rate user-facing naik signifikan dibanding baseline

## 7) Rollback Procedure

1. Open GitHub Actions workflow: `Rollback Scalebiz (Helm)`.
2. Input `revision` Helm stabil terakhir.
3. Jalankan workflow.
4. Verifikasi rollout semua deployment (`api`, `frontend`, `worker`, `scheduler`) sukses.
5. Ulangi smoke checks API + frontend + websocket.

## 8) Database Migration Policy

Expand-contract wajib:
1. Rilis N: jalankan migrasi additive saja (new column/table/index, nullable fields).
2. Rilis N: deploy app yang membaca/menulis schema baru sambil kompatibel schema lama.
3. Rilis N+1: hapus schema lama (drop column/constraint) setelah observasi aman.

Larangan:
- Jangan gabungkan migration destructive + app release yang bergantung langsung dalam satu deployment window.
