export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq, count, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, RiskBadge } from "@/components/ui";
import { DemoTour } from "@/components/demo-tour";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();

  const [systemCountRows, assessmentCountRows, evidenceRows, controlRows, recentSystems] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(schema.aiSystems)
        .where(eq(schema.aiSystems.orgId, session.orgId)),
      db
        .select({ value: count() })
        .from(schema.assessments)
        .where(eq(schema.assessments.orgId, session.orgId)),
      db
        .select({ value: count() })
        .from(schema.evidenceItems)
        .where(eq(schema.evidenceItems.orgId, session.orgId)),
      db.select({ value: count() }).from(schema.controls),
      db
        .select({
          id: schema.aiSystems.id,
          name: schema.aiSystems.name,
          domain: schema.aiSystems.domain,
          roleInValueChain: schema.aiSystems.roleInValueChain,
          riskTier: schema.aiSystems.riskTier,
        })
        .from(schema.aiSystems)
        .where(eq(schema.aiSystems.orgId, session.orgId))
        .orderBy(desc(schema.aiSystems.createdAt))
        .limit(8),
    ]);

  const stats = [
    { label: "AI systems", value: Number(systemCountRows[0]?.value ?? 0), href: "/systems" },
    { label: "Assessments", value: Number(assessmentCountRows[0]?.value ?? 0), href: "/assessments" },
    { label: "Evidence items", value: Number(evidenceRows[0]?.value ?? 0), href: "/evidence" },
    { label: "Controls in library", value: Number(controlRows[0]?.value ?? 0), href: "/controls" },
  ];

  return (
    <div>
      <DemoTour />
      <PageHeader
        title="EU AI Act & DORA Audit Command Dashboard"
        subtitle={`Welcome, ${session.name}. Execute your 6-step European AI compliance & audit workflow for ${session.orgName}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/auditor" className="btn btn-secondary">
              Auditor Workbench
            </Link>
            <Link href="/systems/new" className="btn btn-primary">
              + Register AI System (Start Project)
            </Link>
          </div>
        }
      />

      {/* 6-Step EU AI Act & Banking/Insurance Audit Project Pipeline */}
      <div className="card mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F2A4A]">
              How to Run an EU AI Act / Banking &amp; Insurance (DORA) Audit Project — Step by Step
            </h2>
            <p className="text-xs text-slate-500">
              Whether you are internal Bank/Insurance staff preparing a high-risk AI system or an internal/external Auditor verifying conformity, follow these 6 steps:
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            {
              step: "Step 1: Register",
              title: "AI System Inventory",
              desc: "Register credit, insurance, HR, or GenAI systems & Annex III domain.",
              href: "/systems/new",
            },
            {
              step: "Step 2: Classify",
              title: "EU AI Act Risk Tier",
              desc: "Run 25-question Art. 5, Annex III, Art. 6(3) & Art. 25 classifier.",
              href: "/systems",
            },
            {
              step: "Step 3: Test",
              title: "Fairness & Red-Team",
              desc: "Run Art. 10 Four-Fifths bias, OWASP LLM Top 10 & Scored Evals.",
              href: "/tests/fairness",
            },
            {
              step: "Step 4: Auto-Draft",
              title: "Annex IV, FRIA & DPIA",
              desc: "1-click auto-draft Annex IV, Art. 27 FRIA, GDPR DPIA & Model Card.",
              href: "/eu-ai-act",
            },
            {
              step: "Step 5: Evidence",
              title: "24 Controls & Vault",
              desc: "Map EU AI Act, GDPR, DORA & ISO 42001 controls with SHA-256 files.",
              href: "/assessments",
            },
            {
              step: "Step 6: Sign-Off",
              title: "Auditor & Audit Pack",
              desc: "Formal Auditor sign-off, Art. 47 DoC, Art. 49 JSON & 10-file ZIP.",
              href: "/auditor",
            },
          ].map((item) => (
            <Link
              key={item.step}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-sky-400 hover:bg-sky-50/40"
            >
              <div className="text-[11px] font-bold uppercase tracking-wide text-sky-700">{item.step}</div>
              <div className="mt-0.5 text-xs font-semibold text-[#0F2A4A]">{item.title}</div>
              <p className="mt-1 text-[11px] leading-snug text-slate-600">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 hover:border-sky-300">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <span className="text-sm font-semibold text-slate-800">
            Active AI Systems — Click any system to open its 360° Command Center
          </span>
          <Link href="/systems" className="text-xs font-semibold text-sky-800 hover:underline">
            View full registry →
          </Link>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-2 font-semibold">AI System</th>
              <th className="px-5 py-2 font-semibold">Annex III / Sector Domain</th>
              <th className="px-5 py-2 font-semibold">Value-Chain Role</th>
              <th className="px-5 py-2 font-semibold">EU Risk Tier</th>
              <th className="px-5 py-2 text-right font-semibold">Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentSystems.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-5 py-3">
                  <Link className="font-semibold text-sky-900 hover:underline" href={`/systems/${s.id}`}>
                    {s.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{s.domain}</td>
                <td className="px-5 py-3 capitalize text-slate-600">{s.roleInValueChain}</td>
                <td className="px-5 py-3">
                  <RiskBadge tier={s.riskTier} />
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex flex-wrap justify-end gap-2">
                    <Link href={`/systems/${s.id}`} className="btn btn-primary px-3 py-1 text-xs">
                      Command Center →
                    </Link>
                    <Link href={`/classification/${s.id}`} className="btn btn-secondary px-2.5 py-1 text-xs">
                      Classify
                    </Link>
                    <a href={`/api/audit-pack?systemId=${s.id}`} className="btn btn-secondary px-2.5 py-1 text-xs">
                      Audit Pack ZIP
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
