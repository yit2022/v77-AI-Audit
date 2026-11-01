#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="${1:-"$ROOT/backups/npm-audit.json"}"
mkdir -p "$(dirname "$OUT")"
echo "Running npm audit --json"
set +e
npm audit --json > "$OUT" 2>"$OUT.err"
CODE=$?
set -e
# Always produce a human summary
python3 - << PY
import json, pathlib, sys
p = pathlib.Path("$OUT")
try:
    data = json.loads(p.read_text() or "{}")
except Exception as e:
    print("audit json parse failed", e)
    sys.exit(0)
vuln = data.get("metadata", {}).get("vulnerabilities", {})
print("npm audit vulnerabilities:", vuln)
total = sum(int(v or 0) for v in vuln.values()) if isinstance(vuln, dict) else 0
print("total:", total)
# Fail CI only on critical/high if V77_AUDIT_STRICT=1
import os
if os.environ.get("V77_AUDIT_STRICT") == "1":
    bad = int(vuln.get("high") or 0) + int(vuln.get("critical") or 0)
    sys.exit(1 if bad else 0)
sys.exit(0)
PY
