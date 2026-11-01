# V77 Trust

Global AI audit and governance platform by **Vertex77 sp. z o.o.** (Warsaw, Poland).

V77 Trust is the system of record and system of proof for AI: inventory, EU AI Act risk classification, a control crosswalk spanning the EU AI Act / NIST AI RMF / ISO/IEC 42001, assessments, evidence vault, fairness tests, LLM red-teaming, auditor workspace, policy templates, vendor questionnaires, incident register, model cards, and HTML/PDF/DOCX exports.

Public site: [v77trust.com](https://v77trust.com) · Contact: contact@vertex77.com · Sales: sales@vertex77.com

> Buyer handover (architecture, deploy, env vars, no secrets): see **[HANDOVER.md](./HANDOVER.md)**.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Drizzle ORM + Cloudflare **D1** (SQLite) in production; local seed/dev supported
- OpenNext → Cloudflare Workers (`v77-ai-auditor`) with D1 + R2 + Workers AI bindings
- Cookie sessions, org memberships, roles: `admin` | `ai_owner` | `reviewer` | `auditor`
- Vitest unit tests; i18n EN / DE / FR

## Quick start (local)

```bash
npm install --legacy-peer-deps
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Demo accounts

| Email | Role | Password |
|-------|------|----------|
| admin@v77.local | admin | demo1234 |
| owner@v77.local | ai_owner | demo1234 |
| auditor@v77.local | auditor | demo1234 |

## Cloudflare deploy

See `wrangler.jsonc` (Worker name, D1, R2, AI binding, custom domains) and `HANDOVER.md`.

```bash
npm test
# build + deploy via project scripts / wrangler (OpenNext output)
npx wrangler deploy
```

`V77_ENABLE_REAL_PROVIDERS` defaults to `false` (mock providers). Set `true` to use the Workers AI binding for gap analysis and other flagged features.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed org, users, controls, sample systems |

## Billing note

Plan tiers and seat limits are stored in D1 (`plan_catalog`, org `plan_tier` / `seat_limit`). There is **no payment provider**. All tiers show **pricing on request** — contact sales@vertex77.com.

## Ownership

Copyright © Vertex77 sp. z o.o. All rights reserved.
