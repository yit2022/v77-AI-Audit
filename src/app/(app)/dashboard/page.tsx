export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq, count, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, RiskBadge } from "@/components/ui";
import { DemoTour } from "@/components/demo-tour";
import { getEuIndustryPlaybook, parseInstitutionAndVendor } from "@/lib/eu-ai-act/industries";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();

  const [systemCountRows, assessmentRows, evidenceRows, controlRows, recentSystems] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(schema.aiSystems)
        .where(eq(schema.aiSystems.orgId, session.orgId)),
      db
        .select({
          id: schema.assessments.id,
          systemId: schema.assessments.systemId,
          status: schema.assessments.status,
        })
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
          vendorName: schema.aiSystems.vendorName,
          lifecycleStatus: schema.aiSystems.lifecycleStatus,
        })
        .from(schema.aiSystems)
        .where(eq(schema.aiSystems.orgId, session.orgId))
        .orderBy(desc(schema.aiSystems.createdAt))
        .limit(12),
    ]);

  const assessmentBySystem = new Map<
    string,
    { id: string; status: string; signedOff: boolean }
  >();
  for (const a of assessmentRows) {
    if (!assessmentBySystem.has(a.systemId)) {
      assessmentBySystem.set(a.systemId, {
        id: a.id,
        status: a.status,
        signedOff: a.status === "signed_off" || a.status === "approved",
      });
    }
  }

  // Group active projects by Audited Institution / Client Entity
  const institutionMap = new Map<string, number>();
  for (const s of recentSystems) {
    const { institution } = parseInstitutionAndVendor(s.vendorName, session.orgName);
    institutionMap.set(institution, (institutionMap.get(institution) || 0) + 1);
  }

  const stats = [
    { label: "Active AI Audit Projects", value: Number(systemCountRows[0]?.value ?? 0), href: "/systems" },
    { label: "Audited Institutions / Units", value: Math.max(institutionMap.size, 1), href: "/systems" },
    { label: "Conformity Assessments", value: assessmentRows.length, href: "/assessments" },
    { label: "SHA-256 Evidence Items", value: Number(evidenceRows[0]?.value ?? 0), href: "/evidence" },
  ];

  return (
    <div>
      <DemoTour />
      <PageHeader
        title="European AI Audit & Compliance Command Dashboard"
        subtitle={`Workspace: ${session.orgName} · Track active AI audit projects, which Audited Institution / Client Entity each project belongs to, and their 6-stage EU AI Act conformity progress.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/partner" className="btn btn-secondary">
              Multi-Client / Partner Orgs
            </Link>
            <Link href="/auditor" className="btn btn-secondary">
              Auditor Workbench
            </Link>
            <Link href="/systems/new" className="btn btn-primary">
              + Start New AI Audit Project
            </Link>
          </div>
        }
      />

      {/* 6-Step European AI Audit Project Pipeline */}
      <div className="card mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F2A4A]">
              6-Step European AI Audit Pipeline (All 11 Regulated EU Sectors)
            </h2>
            <p className="text-xs text-slate-500">
              Covers Banking/Credit, Insurance, HR/Recruitment, Healthcare (MDR/IVDR), Critical Infrastructure (NIS2), Automotive/Manufacturing (Machinery Reg), Education, Public Sector, Biometrics, E-Commerce (DSA), and GPAI:
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            {
              step: "Step 1: Register",
              title: "Select Blueprint & Institution",
              desc: "Dropdown-select industry, AI blueprint & Audited Institution (100% AI pre-filled).",
              href: "/systems/new",
            },
            {
              step: "Step 2: Classify",
              title: "EU AI Act Risk Tier",
              desc: "Pre-populated 25-question Art. 5, Annex I/III, Art. 6(3) & Art. 25 classifier.",
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
              desc: "1-click pre-populated EU AI Act, GDPR, DORA & ISO 42001 control notes.",
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

      {/* Audited Institutions / Entities Breakdown */}
      {institutionMap.size > 0 ? (
        <div className="mt-6 card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#0F2A4A]">
                Audited Institutions / Client Entities &amp; Business Units in This Workspace
              </h2>
              <p className="text-xs text-slate-500">
                Every AI audit project is tagged with its owning Institution / Client Entity and Business Unit:
              </p>
            </div>
            <Link href="/systems/new" className="text-xs font-semibold text-sky-800 hover:underline">
              + Add Project for Another Institution →
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from(institutionMap.entries()).map(([inst, cnt]) => (
              <Link
                key={inst}
                href={`/systems?institution=${encodeURIComponent(inst)}`}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/70 px-3.5 py-2 text-xs font-medium text-[#0F2A4A] hover:border-sky-400"
              >
                <span className="font-semibold">{inst}</span>
                <span className="rounded-full bg-[#0F2A4A] px-2 py-0.5 text-[11px] font-bold text-white">
                  {cnt} {cnt === 1 ? "project" : "projects"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Active Audit Projects Table */}
      <div className="mt-6 card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3.5">
          <div>
            <span className="text-sm font-semibold text-slate-800">
              Active AI Audit Projects &amp; Assigned Institutions
            </span>
            <span className="ml-2 text-xs text-slate-500">
              Click any project to open its 6-Step 360° Command Center ({controlRows[0]?.value ?? 24} statutory controls per project)
            </span>
          </div>
          <Link href="/systems" className="text-xs font-semibold text-sky-800 hover:underline">
            View &amp; filter full project registry →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Audited Institution / Entity</th>
                <th className="px-5 py-2.5 font-semibold">AI Audit Project / System</th>
                <th className="px-5 py-2.5 font-semibold">EU Regulated Sector</th>
                <th className="px-5 py-2.5 font-semibold">Audit Project Status</th>
                <th className="px-5 py-2.5 font-semibold">EU Risk Tier</th>
                <th className="px-5 py-2.5 text-right font-semibold">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentSystems.map((s) => {
                const { institution, modelVendor } = parseInstitutionAndVendor(s.vendorName, session.orgName);
                const playbook = getEuIndustryPlaybook(s.domain);
                const assess = assessmentBySystem.get(s.id);
                let stageLabel = "Stage 1/6 · Needs Risk Classification";
                let stageColor = "bg-amber-50 text-amber-800 border-amber-200";
                if (assess?.signedOff) {
                  stageLabel = "Stage 6/6 · Auditor Signed Off";
                  stageColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
                } else if (assess) {
                  stageLabel = "Stage 5/6 · Controls & Audit In Progress";
                  stageColor = "bg-sky-50 text-sky-800 border-sky-200";
                } else if (s.riskTier) {
                  stageLabel = "Stage 3/6 · Classified — Testing & Docs";
                  stageColor = "bg-indigo-50 text-indigo-800 border-indigo-200";
                }

                return (
                  <tr key={s.id} className="border-t border-slate-100 align-middle">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-[#0F2A4A]">{institution}</div>
                      <div className="text-[11px] text-slate-500">Model: {modelVendor}</div>
                    </td>
                    <td className="px-5 py-3">
                      <Link className="font-semibold text-sky-900 hover:underline" href={`/systems/${s.id}`}>
                        {s.name}
                      </Link>
                      <div className="text-[11px] capitalize text-slate-500">
                        Role: {s.roleInValueChain} · Lifecycle: {s.lifecycleStatus}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-700">{playbook.shortLabel}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${stageColor}`}>
                        {stageLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <RiskBadge tier={s.riskTier} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        <Link href={`/systems/${s.id}`} className="btn btn-primary px-3 py-1 text-xs">
                          Command Center →
                        </Link>
                        {assess ? (
                          <Link href={`/assessments/${assess.id}`} className="btn btn-secondary px-2.5 py-1 text-xs">
                            24 Controls
                          </Link>
                        ) : (
                          <Link href={`/classification/${s.id}`} className="btn btn-secondary px-2.5 py-1 text-xs">
                            Classify
                          </Link>
                        )}
                        <a href={`/api/audit-pack?systemId=${s.id}`} className="btn btn-secondary px-2.5 py-1 text-xs">
                          Audit ZIP
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
