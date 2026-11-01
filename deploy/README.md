# Contabo deploy (v77aiaudit.tamalakibn.com)

**Server:** 169.58.28.132  
**DNS:** `tamalakibn.com` is authoritative at **Name.com** (`ns1hwy.name.com` …).  
**Required record:** `A` `v77aiaudit` → `169.58.28.132` (or FQDN `v77aiaudit.tamalakibn.com`).

Cloudflare does **not** host this zone (not in the connected Cloudflare account). Add the A record in the Name.com control panel.

## Steps (when SSH works)

1. Clone `yit2022/v77-AI-Audit` on the server (or use `scripts/deploy-contabo.sh --remote user@169.58.28.132`).
2. Copy `.env.example` → `.env`, fill from `deploy-secrets.txt` (admin + DB passwords). `chmod 600 .env`.
3. `bash scripts/deploy-contabo.sh`
4. Verify: HTTPS home, login as `admin@v77.local`, download a PDF report.

AI providers stay on **mock** (no paid API keys).
