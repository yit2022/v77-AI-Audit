#!/usr/bin/env bash
# Export D1 schema+data for V77 Trust (no secrets in the dump beyond customer data you already hold).
# Usage: bash scripts/d1-backup.sh [output-dir]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="${1:-"$ROOT/backups"}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT"
DB_NAME="${V77_D1_NAME:-v77-ai-audit}"
FILE="$OUT/v77-d1-${STAMP}.sql"
echo "Exporting D1 ${DB_NAME} → ${FILE}"
npx wrangler d1 export "$DB_NAME" --remote --output "$FILE"
# Also write a lightweight JSON inventory of table names from the SQL header (best-effort)
python3 - << PY
from pathlib import Path
p = Path("$FILE")
tables = sorted({line.split("CREATE TABLE",1)[-1].split("(")[0].strip().strip('"') for line in p.read_text(errors="ignore").splitlines() if "CREATE TABLE" in line.upper()})
meta = Path("$OUT") / f"v77-d1-${STAMP}.tables.txt"
meta.write_text("\n".join(tables) + "\n")
print("tables:", len(tables))
print("wrote", meta)
PY
echo "Done. Store ${FILE} in your encrypted backup location. Do not commit dumps."
