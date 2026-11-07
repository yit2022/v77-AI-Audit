export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, RiskBadge } from "@/components/ui";
import { getEuIndustryPlaybook, parseInstitutionAndVendor } from "@/lib/eu-ai-act/industries";

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.aiSystems)
    .where(and(eq(schema.aiSystems.id, id), eq(schema.aiSystems.orgId, session.orgId)))
    .limit(1);
  const system = rows[0];
  if (!system) notFound();

  const [
    assessments,
    annexDocs,
    impacts,
    modelCards,
    fairnessRuns,
    redteamRuns,
    evalRuns,
    evidenceItems,
    findings,
  ] = await Promise.all([
    db
      .select()
      .from(schema.assessments)
      .where(and(eq(schema.assessments.systemId, system.id), eq(schema.assessments.orgId, session.orgId)))
      .orderBy(desc(schema.assessments.createdAt)),
    db
      .select()
      .from(schema.euAnnexDocs)
      .where(and(eq(schema.euAnnexDocs.systemId, system.id), eq(schema.euAnnexDocs.orgId, session.orgId)))
      .limit(1),
    db
      .select()
      .from(schema.impactAssessments)
      .where(and(eq(schema.impactAssessments.systemId, system.id), eq(schema.impactAssessments.orgId, session.orgId))),
    db
      .select()
      .from(schema.modelCards)
      .where(and(eq(schema.modelCards.systemId, system.id), eq(schema.modelCards.orgId, session.orgId)))
      .limit(1),
    db
      .select()
      .from(schema.fairnessRuns)
      .where(and(eq(schema.fairnessRuns.systemId, system.id), eq(schema.fairnessRuns.orgId, session.orgId)))
      .orderBy(desc(schema.fairnessRuns.createdAt))
      .limit(1),
    db
      .select()
      .from(schema.redteamRuns)
      .where(and(eq(schema.redteamRuns.systemId, system.id), eq(schema.redteamRuns.orgId, session.orgId)))
      .orderBy(desc(schema.redteamRuns.createdAt))
      .limit(1),
    db
      .select()
      .from(schema.evalRuns)
      .where(and(eq(schema.evalRuns.systemId, system.id), eq(schema.evalRuns.orgId, session.orgId)))
      .orderBy(desc(schema.evalRuns.createdAt))
      .limit(1),
    db
      .select()
      .from(schema.evidenceItems)
      .where(and(eq(schema.evidenceItems.systemId, system.id), eq(schema.evidenceItems.orgId, session.orgId))),
    db
      .select()
      .from(schema.findings)
      .where(and(eq(schema.findings.systemId, system.id), eq(schema.findings.orgId, session.orgId))),
  ]);

  const latestAssessment = assessments[0];
  const controlRows = latestAssessment
    ? await db
        .select()
        .from(schema.assessmentControls)
        .where(eq(schema.assessmentControls.assessmentId, latestAssessment.id))
    : [];

  const totalControls = controlRows.length;
  const implementedControls = controlRows.filter(
    (c) => c.status === "implemented" || c.status === "not_applicable" || c.status === "waived",
  ).length;
  const controlReadinessPct = totalControls > 0 ? Math.round((implementedControls / totalControls) * 100) : 0;

  let annexFilledCount = 0;
  if (annexDocs[0]?.answersJson) {
    try {
      const parsed = JSON.parse(annexDocs[0].answersJson) as Record<string, string>;
      annexFilledCount = Object.values(parsed).filter((v) => v && v.trim().length > 0).length;
    } catch {
      annexFilledCount = 0;
    }
  }

  const friaCount = impacts.filter((i) => i.templateId === "fria").length;
  const dpiaCount = impacts.filter((i) => i.templateId === "dpia").length;
  const openFindingsCount = findings.filter((f) => f.status === "open" || f.status === "in_progress").length;

  const pipelineSteps = [
    {
      step: "1. Registered",
      done: true,
      detail: `${system.domain} · ${system.roleInValueChain}`,
      href: `/systems/${system.id}`,
    },
    {
      step: "2. EU Risk Classified",
      done: Boolean(system.riskTier && system.riskTier !== "unclassified"),
      detail: system.riskTier ? system.riskTier.replace("_", " ").toUpperCase() : "Pending classification",
      href: `/classification/${system.id}`,
    },
    {
      step: "3. Technical Verification",
      done: Boolean(fairnessRuns[0] || redteamRuns[0] || evalRuns[0]),
      detail: `${fairnessRuns.length ? "Fairness ✓" : "Fairness ○"} · ${redteamRuns.length ? "Red-Team ✓" : "Red-Team ○"} · ${evalRuns.length ? "Evals ✓" : "Evals ○"}`,
      href: `/tests/evals`,
    },
    {
      step: "4. Annex IV, FRIA & DPIA",
      done: annexFilledCount >= 4 || (friaCount > 0 && dpiaCount > 0),
      detail: `Annex IV: ${annexFilledCount}/8 · FRIA: ${friaCount} · DPIA: ${dpiaCount}`,
      href: `/eu-ai-act?systemId=${system.id}`,
    },
    {
      step: "5. 24 Controls & Evidence",
      done: controlReadinessPct >= 80 && evidenceItems.length > 0,
      detail: `${implementedControls}/${totalControls || 24} controls (${controlReadinessPct}%) · ${evidenceItems.length} SHA-256 files`,
      href: latestAssessment ? `/assessments/${latestAssessment.id}` : `/classification/${system.id}`,
    },
    {
      step: "6. Auditor Sign-Off & Export",
      done: latestAssessment?.status === "signed_off",
      detail: latestAssessment?.status === "signed_off" ? "Signed off by Auditor" : "Ready for Auditor Workbench",
      href: `/auditor`,
    },
  ];

  const playbook = getEuIndustryPlaybook(system.domain);
  const { institution, modelVendor } = parseInstitutionAndVendor(system.vendorName, session.orgName);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${system.name} — 360° EU AI Audit Command Center`}
        subtitle={`Audited Institution: ${institution} · Sector: ${playbook.name} · ${
          system.description ||
          "End-to-end European Union AI Act (Reg. 2024/1689), GDPR, and EN ISO/IEC 42001 system workspace."
        }`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/classification/${system.id}`} className="btn btn-primary">
              {system.riskTier ? "Re-run EU Risk Classifier" : "Step 2: Classify Risk"}
            </Link>
            <a className="btn btn-secondary" href={`/api/audit-pack?systemId=${system.id}`}>
              Download 10-Artifact Audit Pack (.zip)
            </a>
            <Link href={`/reports/${system.id}`} className="btn btn-secondary">
              Executive Dossier (HTML/PDF)
            </Link>
          </div>
        }
      />

      {/* Audited Institution & European Sector Statutory Banner */}
      <div className="card border-sky-200 bg-sky-50/60 p-4 text-xs text-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-bold text-[#0F2A4A]">Audited Institution / Client Entity:</span>{" "}
            <span className="font-semibold text-sky-950">{institution}</span>
            <span className="mx-2 text-slate-400">|</span>
            <span className="font-bold text-[#0F2A4A]">Industry Playbook:</span>{" "}
            <span className="font-semibold text-sky-950">{playbook.name}</span>
          </div>
          <span className="rounded-full bg-white px-2.5 py-0.5 font-semibold text-sky-900">
            {playbook.euAiActBasis}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1">
          <span>
            <strong>EU Co-Regulations:</strong> {playbook.coRegulations.join(" · ")}
          </span>
          <span>
            <strong>Competent Authorities:</strong> {playbook.competentAuthorities.join(" · ")}
          </span>
        </div>
      </div>

      {/* 6-Step Guided EU AI Act Project Pipeline */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0F2A4A]">
              6-Step European AI Audit Project Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Follow each step in order from system classification to technical verification, statutory documentation, control evidence, and formal auditor sign-off.
            </p>
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900">
            {pipelineSteps.filter((s) => s.done).length} / 6 Stages Complete
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {pipelineSteps.map((p) => (
            <Link
              key={p.step}
              href={p.href}
              className={`rounded-xl border p-3.5 transition hover:border-sky-400 ${
                p.done ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50/70"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-[#0F2A4A]">{p.step}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    p.done ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {p.done ? "DONE" : "NEXT"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600">{p.detail}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Row 1: System Profile + Statutory Documentation + Technical Verification */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0F2A4A]">1 &amp; 2. System Profile &amp; EU Risk Tier</h2>
            <RiskBadge tier={system.riskTier} />
          </div>
          <dl className="grid gap-2.5 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-slate-500">Audited Institution / Client Entity</dt>
              <dd className="mt-0.5 font-semibold text-[#0F2A4A]">{institution}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Intended purpose</dt>
              <dd className="mt-0.5 text-slate-800">{system.intendedPurpose || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Sector / Annex III Domain</dt>
              <dd className="mt-0.5 text-slate-800">{playbook.shortLabel}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Value-chain role (Art. 3)</dt>
              <dd className="mt-0.5 capitalize text-slate-800">{system.roleInValueChain}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Lifecycle &amp; GPAI</dt>
              <dd className="mt-0.5 text-slate-800">
                {system.lifecycleStatus} · GPAI: {system.gpai ? "Yes (Art. 53)" : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Vendor / Model</dt>
              <dd className="mt-0.5 text-slate-800">{modelVendor} ({system.versionLabel || "v1.0"})</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Art. 49 EU Database ID</dt>
              <dd className="mt-0.5 font-mono text-xs text-slate-700">{system.euDatabaseId || "Not registered yet"}</dd>
            </div>
          </dl>
          {system.classificationNotes ? (
            <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3 text-xs text-slate-700">
              <strong className="text-[#0F2A4A]">Statutory Classification Rationale:</strong> {system.classificationNotes}
            </div>
          ) : null}
        </div>

        <div className="card flex flex-col justify-between space-y-3 p-5">
          <div>
            <h2 className="text-sm font-semibold text-[#0F2A4A]">
              3. Technical Verification Lab (Art. 10 &amp; Art. 15)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Quantitative bias, OWASP LLM Top 10 adversarial robustness, and scored accuracy/PII benchmarks.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">Fairness &amp; Bias (Art. 10 Four-Fifths)</span>
                <Link href="/tests/fairness" className="font-semibold text-sky-700 hover:underline">
                  {fairnessRuns[0] ? `Evaluated (${fairnessRuns[0].filename}) →` : "Run Fairness Test →"}
                </Link>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">OWASP LLM Top 10 Red-Team (Art. 15)</span>
                <Link href="/tests/redteam" className="font-semibold text-sky-700 hover:underline">
                  {redteamRuns[0]
                    ? `${redteamRuns[0].passCount} pass / ${redteamRuns[0].failCount} fail →`
                    : "Run Red-Team Suite →"}
                </Link>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">Scored Evaluation Suite (Art. 15)</span>
                <Link href="/tests/evals" className="font-semibold text-sky-700 hover:underline">
                  {evalRuns[0]
                    ? `Score ${(Number(evalRuns[0].overallScore) * 100).toFixed(0)}% (${evalRuns[0].passCount} pass) →`
                    : "Run Scored Evals →"}
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/tests/fairness" className="btn btn-secondary text-xs">
              Fairness Lab
            </Link>
            <Link href="/tests/redteam" className="btn btn-secondary text-xs">
              Red-Team Lab
            </Link>
            <Link href="/tests/evals" className="btn btn-secondary text-xs">
              Scored Evals
            </Link>
          </div>
        </div>

        <div className="card flex flex-col justify-between space-y-3 p-5">
          <div>
            <h2 className="text-sm font-semibold text-[#0F2A4A]">
              4. Statutory Documentation (Annex IV, FRIA, DPIA &amp; Model Card)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Auto-drafted from your system profile and live technical test telemetry.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">Annex IV Technical File (Art. 11)</span>
                <Link href={`/eu-ai-act?systemId=${system.id}`} className="font-semibold text-sky-700 hover:underline">
                  {annexFilledCount}/8 sections drafted →
                </Link>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">Art. 27 FRIA &amp; GDPR Art. 35 DPIA</span>
                <Link href="/impact" className="font-semibold text-sky-700 hover:underline">
                  {friaCount} FRIA · {dpiaCount} DPIA →
                </Link>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-800">Art. 13 Transparency Model Card</span>
                <Link href="/model-cards" className="font-semibold text-sky-700 hover:underline">
                  {modelCards[0] ? "Drafted (Open) →" : "Auto-draft Model Card →"}
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={`/eu-ai-act?systemId=${system.id}`} className="btn btn-primary text-xs">
              Open Annex IV &amp; Art. 47 DoC
            </Link>
            <Link href="/impact" className="btn btn-secondary text-xs">
              FRIA / DPIA
            </Link>
            <Link href="/model-cards" className="btn btn-secondary text-xs">
              Model Card
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2: Controls, Evidence, Findings & Auditor Sign-Off */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#0F2A4A]">
                5. Control Crosswalk &amp; SHA-256 Evidence ({controlReadinessPct}% Ready)
              </h2>
              <p className="text-xs text-slate-500">
                24 controls mapped across EU AI Act, GDPR, DORA, EN ISO/IEC 42001, and ISO/IEC 27001.
              </p>
            </div>
            {latestAssessment ? (
              <Link href={`/assessments/${latestAssessment.id}`} className="btn btn-primary text-xs">
                Open 24-Control Assessment →
              </Link>
            ) : (
              <Link href={`/classification/${system.id}`} className="btn btn-primary text-xs">
                Classify to Create Assessment →
              </Link>
            )}
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-sky-600 transition-all" style={{ width: `${controlReadinessPct}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
            <span>
              <strong>{implementedControls}</strong> / {totalControls || 24} controls implemented or N/A
            </span>
            <span>
              <strong>{evidenceItems.length}</strong> SHA-256 evidence files in vault
            </span>
            <span>
              <strong>{openFindingsCount}</strong> open findings
            </span>
          </div>
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
            {assessments.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div>
                  <Link className="font-medium text-sky-900 hover:underline" href={`/assessments/${a.id}`}>
                    {a.name}
                  </Link>
                  <span className="ml-2 rounded bg-white px-2 py-0.5 text-xs uppercase text-slate-600">
                    {a.status.replace("_", " ")}
                  </span>
                </div>
                <a className="text-xs font-semibold text-sky-700 hover:underline" href={`/api/assessments/${a.id}/report`}>
                  Signed PDF →
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="card flex flex-col justify-between p-5">
          <div>
            <h2 className="text-sm font-semibold text-[#0F2A4A]">
              6. Conformity Sign-Off, CI/CD Gate &amp; Regulator Export
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Hand off to your internal or external auditor in the Auditor Workbench, enforce release gates in CI/CD, and export signed conformity packages.
            </p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <div className="font-semibold text-[#0F2A4A]">CI/CD Release Gate Endpoint (`GET /api/v1/compliance-gate`)</div>
              <code className="mt-1 block break-all font-mono text-[11px] text-sky-900">
                curl -H &quot;Authorization: Bearer $V77_API_KEY&quot; &quot;https://v77trust.com/api/v1/compliance-gate?systemId={system.id}&quot;
              </code>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/auditor" className="btn btn-primary text-xs">
              Open Auditor Sign-Off Workbench
            </Link>
            <a className="btn btn-secondary text-xs" href={`/api/audit-pack?systemId=${system.id}`}>
              Download 10-Artifact Audit Pack (.zip)
            </a>
            <Link href={`/eu-ai-act?systemId=${system.id}`} className="btn btn-secondary text-xs">
              Art. 47 DoC &amp; Art. 49 EU DB JSON
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
