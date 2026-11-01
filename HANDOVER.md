# V77 Trust — buyer / operator handover

Sale-ready handover for **V77 Trust** (product) operated by **Vertex77 sp. z o.o.** (Warsaw, Poland).
Contact: `contact@vertex77.com` · Sales: `sales@vertex77.com` · Public site: `https://v77trust.com`

This document contains **no secrets**. Rotate every credential listed under “Secrets to provision” before production use.

## What you are buying

Multi-tenant AI governance / audit SaaS:

- AI system inventory, EU AI Act classification, control crosswalk (EU AI Act / NIST AI RMF / ISO/IEC 42001 paraphrases)
- Assessments, evidence vault (R2), fairness / red-team / evals (mock or flagged real providers)
- Approvals, reminders, Trust Center, public developer API docs
- Round 8 product depth: Workers AI control gap analysis (flag + mock fallback), policy template library with PDF/DOCX export, vendor questionnaires (`/vendor/[token]`), EU AI Act Art. 73 incident register, model cards, billing plan/seat scaffolding (no payment provider — “pricing on request”), platform owner super-console

## Architecture

```
Browser → Cloudflare Worker (OpenNext) → Route Handlers / RSC
                ├─ D1 (SQLite) via Drizzle
                ├─ R2 (evidence objects)
                └─ Workers AI binding `AI` (optional; behind V77_ENABLE_REAL_PROVIDERS)
```

- **App**: Next.js 15 App Router + TypeScript + Tailwind, packaged with OpenNext for Cloudflare Workers
- **Worker name**: `v77-ai-auditor`
- **Database**: Cloudflare D1 `v77-ai-audit` (binding `DB`)
- **Object storage**: R2 bucket `v77-ai-audit-evidence` (binding `EVIDENCE`)
- **AI**: Workers AI binding `AI` — used only when `V77_ENABLE_REAL_PROVIDERS=true`; otherwise mock providers
- **Auth**: cookie sessions, org memberships, roles `admin` | `ai_owner` | `reviewer` | `auditor`
- **i18n**: EN / DE / FR dictionaries
- **SSO**: OIDC + SAML scaffolding behind `V77_SSO_ENABLED` (not a full IdP integration out of the box)

Local/dev can also run against embedded SQLite / seed without Cloudflare bindings.

## Repository & deploy

- GitHub: `https://github.com/yit2022/v77-AI-Audit`
- App root: repository root (this folder)
- Deploy: `npx wrangler deploy` after `npm run build` / OpenNext build (see `package.json` scripts)
- Custom domains (Wrangler routes): `v77trust.com`, `www.v77trust.com`, legacy alias as configured in `wrangler.jsonc`

### Typical ship sequence

```bash
npm install --legacy-peer-deps
npm test
npm run cf:build   # or the project's OpenNext build script
npx wrangler deploy
```

D1 schema is applied at runtime via `ensureDb()` migrations (`src/lib/db/migrations.ts` + DDL). No separate migrate step is required for the Worker path, but verify new tables after first request.

## Environment variables (non-secret catalogue)

Set as Worker `vars`, secrets, or `.env` locally. **Never commit secret values.**

| Name | Purpose | Notes |
|------|---------|-------|
| `V77_APP_ORIGIN` | Canonical public origin | e.g. `https://v77trust.com` |
| `V77_CUSTOM_DOMAIN` | Display / cookie domain helper | e.g. `v77trust.com` |
| `V77_ENABLE_REAL_PROVIDERS` | Gate Workers AI / real LLM providers | Default `false` (mock fallback) |
| `V77_PLATFORM_ADMIN_EMAILS` | Comma-separated platform super-console allowlist | Default `admin@v77.local` |
| `V77_SSO_ENABLED` | Enable SSO UI/routes scaffolding | Default off |
| `V77_SAML_ENABLED` | Enable SAML ACS/metadata stubs | Requires SSO flag |
| `V77_OIDC_*` / SAML IdP vars | IdP endpoints, client ids | See `.env.example` — secrets separate |
| `SESSION` / auth secret vars | Session signing | **Must rotate** on ownership transfer |
| `DATABASE_URL` | Optional Postgres for non-Worker hosts | Worker uses D1 binding |
| `V77_ADMIN_PASSWORD` | Seed/bootstrap admin (non-demo hosts) | Demo password disabled in hardened deploys |

Cloudflare bindings (not env vars): `DB`, `EVIDENCE`, `AI`, `ASSETS`.

## Secrets to provision / rotate on sale

1. Cloudflare account API token / Wrangler login for the target account
2. Session / JWT signing secret(s)
3. Any OIDC client secret / SAML signing key
4. GitHub deploy keys or Actions secrets (if CI pushes)
5. DNS / domain registrar access for `v77trust.com` (and www)
6. R2 / D1 access remains inside the CF account — transfer account or re-bind resources

## Demo accounts (local / sale demo only)

| Email | Role | Password |
|-------|------|----------|
| admin@v77.local | admin (+ platform console if allowlisted) | demo1234 |
| owner@v77.local | ai_owner | demo1234 |
| auditor@v77.local | auditor (read-only) | demo1234 |

Disable or wipe demo users before any customer production.

## Product surfaces (Round 8)

| Path | Notes |
|------|-------|
| `/gap-analysis` | Control mapping/gap analysis; Workers AI when flag on |
| `/policies` | AI policy / AUP / model risk templates; export DOCX/PDF |
| `/vendors` | Create tokenised questionnaire links (no email send) |
| `/vendor/[token]` | Public vendor fill-in form |
| `/incidents` | Art. 73 serious-incident register fields |
| `/model-cards` | System documentation editor |
| `/billing` | Plan tiers + EUR prices; Paystack card checkout when enabled; invoices |
| `/platform` | Owner super-console (orgs, tiers, usage scaffold) |

## Explicit non-goals in this codebase

- No automatic authority notification for incidents (record-keeping only)
- Mobile money / M-Pesa channels are never enabled (Paystack card-only when billing is on)
- Live Paystack/Resend keys are not bundled — billing stays behind `V77_BILLING_ENABLED=false` until provisioned

## Branding

Legal entity and customer materials: **Vertex77 sp. z o.o.** only. Product name: **V77 Trust**.

## Support during transition

Prefer `sales@vertex77.com` for commercial handover and `contact@vertex77.com` for product/privacy questions until cutover completes.


## Round 9 additions (quality / trust / conversion)

- Public AI Act risk tier checker on `/` (`#risk-checker`) → pilot CTA; leads stored with `source=risk_checker`
- Product tour `/demo` (screenshots under `public/demo/`)
- Resources `/resources` + three EU AI Act articles
- `GET /api/health` uptime check (DB ping)
- `bash scripts/d1-backup.sh` — Wrangler D1 remote export
- `bash scripts/dep-audit.sh` — npm audit JSON summary
- CSP without `unsafe-eval`; `object-src 'none'`
- Org onboarding checklist `/onboarding` + in-app notification centre

## Round 10 (audit depth + partner channel)

- Partner/reseller portal (`/partner`) with white-label branding and multi-client orgs
- Control crosswalk expanded: GDPR AI-related, DORA (Regulation (EU) 2022/2554), ISO/IEC 27001 Annex A identifiers
- Evidence request automation with assignee, cadence, due/expiry tracking (`/evidence-requests`)
- Executive board report landscape PDF (`/board-report`, `/api/reports/board`)
- New app strings translated across EN DE FR PL NL ES IT SV

## Round 11 (billing + email + AI readiness + demo + white-label)

- Paystack billing with split/subaccount support, **card-only** channels, EUR display prices, `PAYSTACK_CURRENCY` (default USD + EUR→USD conversion; EUR when set), webhook HMAC verification, plan activation, `/billing/invoices`
- Flag `V77_BILLING_ENABLED=false` until keys exist; checkout display name **V77 Trust**
- Resend transactional email abstraction (`noreply@v77trust.com`, reply-to `support@v77trust.com`) for signup, invite, reminder, evidence request, lead notification — localised templates; no-op without `RESEND_API_KEY`
- Real-AI provider hardening: timeouts, retries, input cost caps, PII redaction (`V77_ENABLE_REAL_PROVIDERS` remains `false`)
- Buyer guided demo tour + seeded sample org (`v77-buyer-demo`)
- Deeper white-label: partner `custom_domain`, partner-branded emails and board PDFs

### Secrets / keys to provision (names only)

| Name | Purpose |
|------|---------|
| `PAYSTACK_SECRET_KEY` | Paystack server secret (webhook HMAC + initialize/verify) |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key (optional client use) |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `V77_BILLING_ENABLED` | Must be `true` to expose live checkout (keep `false` until keys exist) |
| `PAYSTACK_CURRENCY` | Charge currency: `USD` (default) or `EUR` |
| `PAYSTACK_EUR_USD_RATE` | EUR→USD conversion when charging USD |
| `V77_EMAIL_FROM` | From address (default `noreply@v77trust.com`) |
| `V77_EMAIL_REPLY_TO` | Reply-To (default `support@v77trust.com`) |
| `V77_LEAD_NOTIFY_EMAIL` | Optional lead notification inbox (defaults to sales@vertex77.com) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / Azure OpenAI vars | Only if enabling real providers later |
| `V77_ENABLE_REAL_PROVIDERS` | Keep `false` until provider keys and spend controls are ready |
| Partner Paystack `subaccount` / `split_code` | Stored per organisation in D1 (not env secrets) |

Also rotate existing secrets from earlier rounds: session secret, `V77_PLATFORM_ADMIN_EMAILS`, admin seed password, Cloudflare/Wrangler credentials.
