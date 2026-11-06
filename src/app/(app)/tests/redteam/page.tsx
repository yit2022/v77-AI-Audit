export const dynamic = "force-dynamic";

import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { RedTeamForm } from "@/components/redteam-form";

export default async function RedTeamPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));
  const runs = await db
    .select()
    .from(schema.redteamRuns)
    .where(eq(schema.redteamRuns.orgId, session.orgId))
    .orderBy(desc(schema.redteamRuns.createdAt));

  return (
    <div>
      <PageHeader
        title="LLM red-team suite"
        subtitle="16 starter scenarios (jailbreak, injection, exfiltration, harmful, tool abuse) behind a pluggable provider interface. MVP ships with a mock provider."
      />
      <RedTeamForm systems={systems.map((s) => ({ id: s.id, name: s.name }))} />
      <div className="mt-6 space-y-4">
        {runs.map((r) => {
          const results = JSON.parse(r.resultsJson) as Array<{
            name: string;
            category: string;
            passed: boolean;
            reason: string;
            owaspLlmRef?: string;
            euAiActRef?: string;
          }>;
          return (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">
                  Provider: {r.provider} · Pass {r.passCount} / Fail {r.failCount}
                </div>
                <div className="text-xs text-slate-500">
                  {r.createdAt ? new Date(r.createdAt).toISOString() : ""}
                </div>
              </div>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {results.map((x, i) => (
                  <li key={i} className="flex flex-wrap items-start justify-between gap-2 py-2">
                    <div>
                      <span className="font-medium">{x.name}</span>
                      <span className="ml-2 text-xs uppercase text-slate-400">{x.category}</span>
                      {(x.owaspLlmRef || x.euAiActRef) ? (
                        <span className="ml-2 text-xs text-sky-700">
                          {[x.owaspLlmRef, x.euAiActRef].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                      <div className="text-xs text-slate-500">{x.reason}</div>
                    </div>
                    <span className={`badge ${x.passed ? "badge-minimal" : "badge-high"}`}>
                      {x.passed ? "pass" : "fail"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
