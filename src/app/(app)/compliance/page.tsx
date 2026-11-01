export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import {
  buildTrend,
  overdueRemediation,
  activeFrameworks,
  overallReadiness,
  readinessByFramework,
  topRisks,
  type FrameworkKey,
} from "@/lib/compliance/dashboard";

const FRAMEWORK_LABELS: Record<FrameworkKey, string> = {
  eu_ai_act: "EU AI Act",
  nist: "NIST AI RMF",
  iso42001: "ISO/IEC 42001",
  gdpr: "GDPR",
  dora: "DORA",
  iso27001: "ISO/IEC 27001",
};

export default async function ComplianceDashboardPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();

  const controlRows = await db
    .select({
      status: schema.assessmentControls.status,
      euRef: schema.controls.euRef,
      nistRef: schema.controls.nistRef,
      isoRef: schema.controls.isoRef,
      gdprRef: schema.controls.gdprRef,
      doraRef: schema.controls.doraRef,
      iso27001Ref: schema.controls.iso27001Ref,
    })
    .from(schema.assessmentControls)
    .innerJoin(schema.assessments, eq(schema.assessmentControls.assessmentId, schema.assessments.id))
    .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
    .where(eq(schema.assessments.orgId, session.orgId));

  const findings = await db.select().from(schema.findings).where(eq(schema.findings.orgId, session.orgId));
  const tasks = await db
    .select()
    .from(schema.remediationTasks)
    .where(eq(schema.remediationTasks.orgId, session.orgId));

  const scores = readinessByFramework(controlRows);
  const overall = overallReadiness(scores, activeFrameworks(controlRows));
  const risks = topRisks(
    findings.map((f) => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      status: f.status,
      frameworkRef: f.frameworkRef,
      systemId: f.systemId,
    })),
  );
  const overdue = overdueRemediation(
    tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      findingId: t.findingId,
    })),
  );
  const openFindings = findings.filter((f) => f.status === "open" || f.status === "in_progress").length;
  const trend = buildTrend({ openFindings, overallReadiness: overall });

  return (
    <div>
      <PageHeader
        title="Executive compliance"
        subtitle="Readiness by framework, top risks, overdue remediation, and recent trend."
        actions={
          <Link href="/findings" className="btn btn-secondary">
            Open findings
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <div className="card p-4 lg:col-span-1">
          <div className="text-xs uppercase tracking-wide text-slate-500">Overall readiness</div>
          <div className="mt-2 text-3xl font-semibold text-sky-900">{overall}%</div>
        </div>
        {(Object.keys(FRAMEWORK_LABELS) as FrameworkKey[]).map((k) => (
          <div key={k} className="card p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{FRAMEWORK_LABELS[k]}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{scores[k]}%</div>
            <div className="mt-2 h-2 overflow-hidden rounded bg-slate-100">
              <div className="h-full bg-sky-400" style={{ width: `${scores[k]}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">Top risks</h2>
          <ul className="mt-3 space-y-2">
            {risks.length === 0 ? (
              <li className="text-sm text-slate-500">No open high-priority findings.</li>
            ) : (
              risks.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800">{r.title}</span>
                  <span className="text-xs uppercase text-slate-500">{r.severity}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900">Overdue remediation</h2>
          <ul className="mt-3 space-y-2">
            {overdue.length === 0 ? (
              <li className="text-sm text-slate-500">Nothing overdue.</li>
            ) : (
              overdue.map((t) => (
                <li key={t.id} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs">Due {t.dueDate}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h2 className="text-sm font-semibold text-slate-900">Trend</h2>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {trend.map((p) => (
            <div key={p.label} className="rounded-lg border border-slate-100 p-3 text-center">
              <div className="text-xs text-slate-500">{p.label}</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">{p.readiness}%</div>
              <div className="text-xs text-slate-500">{p.openFindings} open findings</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
