# V77 AI Auditor

Global AI audit platform by **Tamalaki Business Network Ltd** (Founder & CEO: Isaac Muthui).

V77 is the system of record and system of proof for AI: inventory, EU AI Act risk classification, a control crosswalk spanning the EU AI Act / NIST AI RMF / ISO/IEC 42001, assessments, evidence vault, fairness tests, LLM red-teaming, auditor workspace, and HTML report export.

> Positioning: global product. Do not describe V77 as an African or Kenya-built product in customer materials.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Drizzle ORM + **PGlite** (embedded Postgres) by default; set `DATABASE_URL` (postgres://…) to use real Postgres
- Docker Compose includes Postgres 16 and wires `DATABASE_URL` for production-parity networking
- Cookie sessions, org memberships, roles: `admin` | `ai_owner` | `auditor`
- Vitest for classification / crosswalk / fairness unit tests

## Quick start (local, no Docker)

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

## Docker Compose

```bash
cp .env.example .env   # set V77_ADMIN_PASSWORD + POSTGRES_PASSWORD
docker compose up --build
```

Requires Docker. If Docker is unavailable, use the local PGlite path above.

### Contabo production (`v77aiaudit.tamalakibn.com`)

See `deploy/README.md`, `deploy/Caddyfile`, and `scripts/deploy-contabo.sh`.
DNS for `tamalakibn.com` is at **Name.com**; add `A v77aiaudit → 169.58.28.132`. Production disables `demo1234` and requires `V77_ADMIN_PASSWORD`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed org, users, controls, sample systems |

## Architecture

Browser → Next.js (UI + Route Handlers) → Auth/RBAC → domain modules → PGlite (`data/v77-pglite`) + `uploads/evidence/`.

Control descriptions are short original paraphrases with article/clause references only (no copyrighted ISO normative text).

## MVP vs plan gaps

**Included:** multi-tenant org + roles, inventory, EU risk wizard, crosswalk v0, assessments, evidence vault, fairness + mock LLM red-team (16 scenarios), auditor workspace, HTML report, seed data, tests, CI, Docker Compose.

**Not yet:** EN 18286 checklist, NYC LL144 format, WORM object lock, notified-body workflows, multi-region residency. SSO/OIDC groundwork is env-configured.

## Ownership

Copyright © Tamalaki Business Network Ltd. All rights reserved for this MVP codebase.
