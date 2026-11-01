export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, RiskBadge } from "@/components/ui";

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
    .where(
      and(eq(schema.aiSystems.id, id), eq(schema.aiSystems.orgId, session.orgId)),
    )
    .limit(1);
  const system = rows[0];
  if (!system) notFound();

  const assessments = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.systemId, system.id));

  return (
    <div>
      <PageHeader
        title={system.name}
        subtitle={system.description}
        actions={
          <>
            <Link href={`/classification/${system.id}`} className="btn btn-primary">
              Run classification
            </Link>
            <Link href={`/reports/${system.id}`} className="btn btn-secondary">
              HTML report
            </Link>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card space-y-3 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-800">Profile</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-slate-500">Intended purpose</dt>
              <dd className="mt-1 text-slate-800">{system.intendedPurpose || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Domain</dt>
              <dd className="mt-1 capitalize text-slate-800">{system.domain}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Value-chain role</dt>
              <dd className="mt-1 capitalize text-slate-800">{system.roleInValueChain}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">GPAI</dt>
              <dd className="mt-1 text-slate-800">{system.gpai ? "Yes" : "No"}</dd>
            </div>
          </dl>
          {system.classificationNotes ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {system.classificationNotes}
            </p>
          ) : null}
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-800">Risk tier</h2>
          <div className="mt-3">
            <RiskBadge tier={system.riskTier} />
          </div>
          <h2 className="mt-6 text-sm font-semibold text-slate-800">Assessments</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {assessments.map((a) => (
              <li key={a.id}>
                <Link className="text-teal-800 hover:underline" href={`/assessments/${a.id}`}>
                  {a.name}
                </Link>
                <span className="ml-2 text-xs text-slate-500">{a.status}</span>
              </li>
            ))}
            {assessments.length === 0 ? (
              <li className="text-slate-500">None yet — classify to create one.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
