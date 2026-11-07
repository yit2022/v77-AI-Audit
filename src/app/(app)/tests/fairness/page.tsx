export const dynamic = "force-dynamic";

import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { FairnessForm } from "@/components/fairness-form";

export default async function FairnessPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));
  const runs = await db
    .select()
    .from(schema.fairnessRuns)
    .where(eq(schema.fairnessRuns.orgId, session.orgId))
    .orderBy(desc(schema.fairnessRuns.createdAt));

  return (
    <div>
      <PageHeader
        title="Algorithmic Fairness & Non-Discrimination Lab (EU AI Act Art. 10 & Art. 15)"
        subtitle="Computes Four-Fifths (80%) impact ratio, demographic parity, and equalized odds across protected subgroups to verify EU AI Act Art. 10(2)(f)–(g) bias examination and EU Charter Art. 21 non-discrimination."
      />
      <FairnessForm systems={systems.map((s) => ({ id: s.id, name: s.name }))} />
      <div className="mt-6 space-y-4">
        {runs.map((r) => {
          const m = JSON.parse(r.metricsJson);
          const ratio = Number(m.demographicParityRatio ?? 1);
          const verdict = m.verdict || (ratio >= 0.8 ? "pass" : "fail");
          return (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{r.filename}</span>
                  <span className={`badge ${verdict === "pass" ? "badge-minimal" : verdict === "review" ? "badge-limited" : "badge-high"}`}>
                    {verdict === "pass" ? "Art. 10 Pass" : verdict === "review" ? "Art. 10 Review" : "Disparate Impact Fail"}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {r.createdAt ? new Date(r.createdAt).toISOString() : ""}
                </div>
              </div>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase text-slate-500">Four-Fifths Ratio (≥0.80)</dt>
                  <dd className="font-semibold">{ratio.toFixed(3)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Demographic parity Δ</dt>
                  <dd className="font-semibold">{m.demographicParityDifference?.toFixed(3)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Equalized odds Δ</dt>
                  <dd className="font-semibold">{m.equalizedOddsDifference?.toFixed(3)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-500">Accuracy</dt>
                  <dd className="font-semibold">{(m.overallAccuracy * 100)?.toFixed(1)}%</dd>
                </div>
              </dl>
              {Array.isArray(m.warnings) && m.warnings.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs text-amber-800">
                  {m.warnings.map((w: string, idx: number) => (
                    <li key={idx}>• {w}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
