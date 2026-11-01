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
        title="Fairness tests"
        subtitle="Upload a predictions CSV with y_true, y_pred, and a sensitive attribute column. Computes demographic parity and equalized odds."
      />
      <FairnessForm systems={systems.map((s) => ({ id: s.id, name: s.name }))} />
      <div className="mt-6 space-y-4">
        {runs.map((r) => {
          const m = JSON.parse(r.metricsJson);
          return (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="font-medium text-slate-900">{r.filename}</div>
                <div className="text-xs text-slate-500">
                  {r.createdAt ? new Date(r.createdAt).toISOString() : ""}
                </div>
              </div>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
