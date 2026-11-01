#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${PORT:-3457}"
DATA_DIR="${V77_E2E_DATA:-$ROOT/data-e2e}"
mkdir -p "$DATA_DIR"
export V77_DATA_DIR="$DATA_DIR"
# Prefer a dedicated env if the app supports it; fall through to default seed DB
COOKIE_JAR="$(mktemp)"
BASE="http://127.0.0.1:$PORT"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

echo "Starting server on $PORT..."
npm run start -- -p "$PORT" > /tmp/v77-e2e-server.log 2>&1 &
SERVER_PID=$!

for i in $(seq 1 60); do
  if curl -sf "$BASE/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Server died"; tail -50 /tmp/v77-e2e-server.log; exit 1
  fi
  if [[ $i -eq 60 ]]; then
    echo "Server did not become ready"; tail -50 /tmp/v77-e2e-server.log; exit 1
  fi
done

echo "GET /"
code=$(curl -s -o /tmp/v77-home.html -w "%{http_code}" "$BASE/")
[[ "$code" == "200" ]] || { echo "home $code"; exit 1; }
grep -q "AI Auditor" /tmp/v77-home.html

echo "GET /login"
code=$(curl -s -o /tmp/v77-login.html -w "%{http_code}" "$BASE/login")
[[ "$code" == "200" ]] || { echo "login $code"; exit 1; }

echo "POST /api/auth/login"
code=$(curl -s -c "$COOKIE_JAR" -o /tmp/v77-login.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@v77.local","password":"demo1234"}' \
  "$BASE/api/auth/login")
[[ "$code" == "200" ]] || { echo "login api $code"; cat /tmp/v77-login.json; exit 1; }

echo "GET /dashboard (authed)"
code=$(curl -s -b "$COOKIE_JAR" -o /tmp/v77-dash.html -w "%{http_code}" "$BASE/dashboard")
[[ "$code" == "200" ]] || { echo "dashboard $code"; exit 1; }

echo "GET /api/systems"
code=$(curl -s -b "$COOKIE_JAR" -o /tmp/v77-systems.json -w "%{http_code}" "$BASE/api/systems")
[[ "$code" == "200" ]] || { echo "systems $code"; cat /tmp/v77-systems.json; exit 1; }

echo "GET /api/tests/evals"
code=$(curl -s -b "$COOKIE_JAR" -o /tmp/v77-evals.json -w "%{http_code}" "$BASE/api/tests/evals")
[[ "$code" == "200" ]] || { echo "evals $code"; exit 1; }

echo "GET /api/findings"
code=$(curl -s -b "$COOKIE_JAR" -o /tmp/v77-findings.json -w "%{http_code}" "$BASE/api/findings")
[[ "$code" == "200" ]] || { echo "findings $code"; exit 1; }

echo "GET /findings page"
code=$(curl -s -b "$COOKIE_JAR" -o /tmp/v77-findings.html -w "%{http_code}" "$BASE/findings")
[[ "$code" == "200" ]] || { echo "findings page $code"; exit 1; }

echo "GET /settings"
code=$(curl -s -b "$COOKIE_JAR" -o /tmp/v77-settings.html -w "%{http_code}" "$BASE/settings")
[[ "$code" == "200" ]] || { echo "settings $code"; exit 1; }

echo "GET /api/v1/systems without key => 401"
code=$(curl -s -o /tmp/v77-v1.json -w "%{http_code}" "$BASE/api/v1/systems")
[[ "$code" == "401" ]] || { echo "v1 expected 401 got $code"; exit 1; }

echo "E2E smoke OK"
