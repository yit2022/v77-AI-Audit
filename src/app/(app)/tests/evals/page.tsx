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
            results?: Array<{
              caseId: string;
              category: string;
              name: string;
              passed: boolean;
              score: number;
              reason: string;
              euAiActRef?: string;
              iso42001Ref?: string;
            }>;
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
              {parsed.results?.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {parsed.results.map((c) => (
                    <div
                      key={c.caseId}
                      className={`rounded-lg border p-2.5 text-xs ${
                        c.passed ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-medium text-slate-800">
                        <span>{c.name}</span>
                        <span>{c.passed ? "PASS" : "FAIL"}</span>
                      </div>
                      <div className="mt-0.5 text-slate-600">{c.reason}</div>
                      {c.euAiActRef || c.iso42001Ref ? (
                        <div className="mt-1 text-[11px] text-slate-500">
                          {[c.euAiActRef, c.iso42001Ref].filter(Boolean).join(" · ")}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
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
