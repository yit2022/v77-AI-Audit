export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { FindingsClient } from "@/components/findings-client";
import { verifyAuditChain } from "@/lib/audit/log";
import { asc } from "drizzle-orm";

export default async function FindingsPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const systems = await db
    .select({ id: schema.aiSystems.id, name: schema.aiSystems.name })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));
  const findings = await db
    .select()
    .from(schema.findings)
    .where(eq(schema.findings.orgId, session.orgId))
    .orderBy(desc(schema.findings.createdAt));
  const tasks = await db
    .select()
    .from(schema.remediationTasks)
    .where(eq(schema.remediationTasks.orgId, session.orgId))
    .orderBy(desc(schema.remediationTasks.createdAt));
  const auditEntries = await db
    .select()
    .from(schema.auditLog)
    .where(eq(schema.auditLog.orgId, session.orgId))
    .orderBy(asc(schema.auditLog.createdAt));
  const chain = verifyAuditChain(
    auditEntries.map((e) => ({ sha256: e.sha256, prevSha256: e.prevSha256 })),
  );

  return (
    <div>
      <PageHeader
        title="Findings & remediation"
        subtitle="Track audit findings, assign remediation owners and due dates. Auditor sign-off and mutations append to an immutable hash-chained audit log."
      />
      <FindingsClient systems={systems} initialFindings={findings} initialTasks={tasks} />
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Immutable audit log {chain.ok ? "(chain intact)" : `(chain broken at ${chain.brokenAt})`}
        </h2>
        <div className="card divide-y divide-slate-100">
          {auditEntries
            .slice()
            .reverse()
            .slice(0, 40)
            .map((e) => (
              <div key={e.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-slate-800">{e.action}</span>
                  <span className="text-xs text-slate-500">{e.createdAt.toISOString()}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {e.entityType}:{e.entityId || "—"} · sha256 {e.sha256.slice(0, 12)}…
                </div>
              </div>
            ))}
          {auditEntries.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">No audit events yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
