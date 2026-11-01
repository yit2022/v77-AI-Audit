export const dynamic = "force-dynamic";

import { asc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { verifyAuditChain } from "@/lib/audit/log";

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const entries = await db
    .select()
    .from(schema.auditLog)
    .where(eq(schema.auditLog.orgId, session.orgId))
    .orderBy(asc(schema.auditLog.createdAt));
  const chain = verifyAuditChain(entries.map((e) => ({ sha256: e.sha256, prevSha256: e.prevSha256 })));

  return (
    <div>
      <PageHeader
        title="Activity log"
        subtitle={`Immutable hash-chained audit trail ${chain.ok ? "(chain intact)" : `(chain broken at ${chain.brokenAt})`}.`}
      />
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Entity</th>
              <th className="px-4 py-2">Hash</th>
            </tr>
          </thead>
          <tbody>
            {[...entries].reverse().map((e) => (
              <tr key={e.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                  {e.createdAt ? new Date(e.createdAt).toISOString().replace("T", " ").slice(0, 19) : "—"}
                </td>
                <td className="px-4 py-3 font-medium text-[#0F2A4A]">{e.action}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{e.entityType}</div>
                  <div className="font-mono text-xs text-slate-400">{e.entityId || "—"}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.sha256.slice(0, 16)}…</td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No activity recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
