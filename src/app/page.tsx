export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { seedIfEmpty } from "@/lib/db/seed";

const pillars = [
  {
    title: "Inventory & classify",
    body: "Register every AI system, capture roles in the value chain, and classify EU AI Act risk with a guided questionnaire.",
  },
  {
    title: "Crosswalk & evidence",
    body: "Map controls across the EU AI Act, NIST AI RMF, ISO/IEC 42001 and GDPR. Store evidence in a hash-chained locker.",
  },
  {
    title: "Evaluate & remediate",
    body: "Run fairness, red-team and scored provider evals. Track findings, owners, due dates and auditor sign-off.",
  },
];

const modules = [
  "AI system registry",
  "EU risk classifier",
  "Control crosswalk",
  "Evidence locker",
  "FRIA / DPIA",
  "Fairness + red-team",
  "Scored eval suites",
  "Findings workflow",
  "Immutable audit log",
  "Monitoring & drift",
  "Multi-tenant RBAC",
  "API keys (/api/v1)",
];

export default async function HomePage() {
  await seedIfEmpty();
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8f7fd_0%,_#ffffff_50%,_#ffffff_100%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">V77</div>
          <div className="text-sm font-semibold text-slate-900">AI Auditor</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-500 sm:inline">Tamalaki Business Network Ltd</span>
          <Link href="/login" className="btn btn-primary">Sign in</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
              Global AI audit platform
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              System of record and system of proof for AI governance.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
              Inventory systems, classify EU AI Act risk, map controls across leading frameworks,
              run technical evaluations, collect evidence, and export auditor-ready reports —
              with multi-tenant RBAC and an immutable audit log.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="btn btn-primary">Open demo workspace</Link>
              <a href="#capabilities" className="btn btn-secondary">See capabilities</a>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Production credentials are provisioned separately (not shown here).
            </p>
          </div>
          <div className="card relative overflow-hidden p-6">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-100/80" />
            <div className="relative space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk tiers</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="badge badge-prohibited">Prohibited</span>
                  <span className="badge badge-high">High-risk</span>
                  <span className="badge badge-limited">Limited</span>
                  <span className="badge badge-minimal">Minimal</span>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                Crosswalk: EU AI Act · NIST AI RMF · ISO 42001 · GDPR
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                Eval suites: fairness · robustness · injection · PII · hallucination
              </div>
              <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-950">
                Hash-chained evidence + audit log for auditor trust
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-2xl font-semibold text-slate-900">Built for deployers, providers and auditors</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="card p-5">
              <h3 className="font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-900">Platform modules</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <div
                key={m}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                {m}
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/login" className="btn btn-primary">Sign in to explore</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
