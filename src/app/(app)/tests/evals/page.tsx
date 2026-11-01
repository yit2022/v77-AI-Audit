export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/ui";
import { EvalSuiteForm } from "@/components/eval-suite-form";

export default async function EvalSuitePage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const systems = await db
    .select({ id: schema.aiSystems.id, name: schema.aiSystems.name })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));
  const runs = await db
    .select()
    .from(schema.evalRuns)
    .where(eq(schema.evalRuns.orgId, session.orgId))
    .orderBy(desc(schema.evalRuns.createdAt));

  return (
    <div>
      <PageHeader
        title="Evaluation suites"
        subtitle="Scored robustness, prompt-injection, PII leakage and hallucination checks via configured model providers. Fairness CSV suites remain under Fairness Tests."
      />
      <EvalSuiteForm systems={systems} />
      <div className="mt-6 space-y-3">
        {runs.map((r) => {
          const parsed = JSON.parse(r.resultsJson) as {
            categoryScores?: Record<string, { score: number; pass: number; total: number }>;
          };
          return (
            <div key={r.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">
                  Score {(Number(r.overallScore) * 100).toFixed(0)}% · {r.passCount} pass / {r.failCount} fail
                </div>
                <div className="text-xs text-slate-500">
                  {r.provider} · {r.createdAt.toISOString()}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                {Object.entries(parsed.categoryScores ?? {}).map(([k, v]) => (
                  <span key={k} className="rounded-full bg-slate-100 px-2 py-1">
                    {k.replaceAll("_", " ")}: {(v.score * 100).toFixed(0)}% ({v.pass}/{v.total})
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {runs.length === 0 ? (
          <EmptyState title="No eval runs yet" body="Run the scored suite against a registered AI system." />
        ) : null}
      </div>
    </div>
  );
}
