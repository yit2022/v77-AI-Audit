#!/usr/bin/env bash
# Deploy V77 AI Auditor to Contabo (169.58.28.132) once SSH is available.
# Usage (on the server, from the cloned repo app directory):
#   cp .env.example .env && edit secrets (chmod 600 .env)
#   bash scripts/deploy-contabo.sh
#
# From a workstation with SSH:
#   bash scripts/deploy-contabo.sh --remote user@169.58.28.132
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${1:-}"
HOST_IP="169.58.28.132"
DOMAIN="v77aiaudit.tamalakibn.com"

if [[ "${1:-}" == "--remote" ]]; then
  REMOTE="${2:?user@host required}"
  shift 2 || true
  echo "Syncing to ${REMOTE}:/opt/v77-ai-audit ..."
  ssh "$REMOTE" "sudo mkdir -p /opt/v77-ai-audit && sudo chown \$USER:\$USER /opt/v77-ai-audit"
  rsync -az --delete \
    --exclude node_modules --exclude .next --exclude data --exclude data-e2e \
    --exclude uploads --exclude .git --exclude '.env' \
    "$ROOT/" "$REMOTE:/opt/v77-ai-audit/"
  if [[ -f "$ROOT/.env" ]]; then
    scp "$ROOT/.env" "$REMOTE:/opt/v77-ai-audit/.env"
    ssh "$REMOTE" "chmod 600 /opt/v77-ai-audit/.env"
  else
    echo "WARNING: no local .env — create /opt/v77-ai-audit/.env on the server before up"
  fi
  ssh "$REMOTE" "cd /opt/v77-ai-audit && bash scripts/deploy-contabo.sh"
  exit 0
fi

cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.example and set V77_ADMIN_PASSWORD / POSTGRES_PASSWORD"
  exit 1
fi
chmod 600 .env || true

# DNS reminder (Name.com authoritative)
echo "Ensure DNS A record exists: ${DOMAIN} → ${HOST_IP} (at Name.com)"
echo "Building and starting stack..."
docker compose pull
docker compose up -d --build

echo "Waiting for app health via Caddy (may take a minute for TLS)..."
for i in $(seq 1 60); do
  if curl -fsS "https://${DOMAIN}/" >/dev/null 2>&1; then
    echo "HTTPS OK: https://${DOMAIN}/"
    exit 0
  fi
  sleep 5
done
echo "Stack started; HTTPS not yet verified (DNS or TLS may still be pending)."
docker compose ps
