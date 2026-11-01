export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, RiskBadge, EmptyState } from "@/components/ui";

export default async function AssessmentsPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const rows = await db
    .select({
      assessment: schema.assessments,
      systemName: schema.aiSystems.name,
      riskTier: schema.aiSystems.riskTier,
    })
    .from(schema.assessments)
    .innerJoin(schema.aiSystems, eq(schema.assessments.systemId, schema.aiSystems.id))
    .where(eq(schema.assessments.orgId, session.orgId))
    .orderBy(desc(schema.assessments.createdAt));

  return (
    <div>
      <PageHeader
        title="Assessments"
        subtitle="Control status and owners for each AI system engagement."
      />
      {rows.length === 0 ? (
        <EmptyState title="No assessments" body="Classify a system to generate a control pack." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-2">Assessment</th>
                <th className="px-5 py-2">System</th>
                <th className="px-5 py-2">Risk</th>
                <th className="px-5 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ assessment, systemName, riskTier }) => (
                <tr key={assessment.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">
                    <Link className="font-medium text-teal-800 hover:underline" href={`/assessments/${assessment.id}`}>
                      {assessment.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{systemName}</td>
                  <td className="px-5 py-3"><RiskBadge tier={riskTier} /></td>
                  <td className="px-5 py-3 capitalize text-slate-600">{assessment.status.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
