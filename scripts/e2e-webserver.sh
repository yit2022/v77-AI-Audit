#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-3317}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
rm -rf data-e2e
mkdir -p data-e2e
export DISABLE_DEMO_PASSWORDS=false
export V77_DEMO_PASSWORD=demo1234
export V77_ADMIN_PASSWORD=demo1234
export V77_OWNER_PASSWORD=demo1234
export V77_AUDITOR_PASSWORD=demo1234
export V77_FORCE_SQLITE=true
export V77_DATA_DIR="$ROOT/data-e2e"
export V77_APP_ORIGIN="http://127.0.0.1:${PORT}"
export V77_COOKIE_SECURE=false
export NODE_ENV=production
if [[ ! -d .next ]]; then
  npm run build
fi
exec npx next start -H 127.0.0.1 -p "$PORT"
