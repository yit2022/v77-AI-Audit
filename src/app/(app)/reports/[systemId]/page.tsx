export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { RiskBadge } from "@/components/ui";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ systemId: string }>;
}) {
  const { systemId } = await params;
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(and(eq(schema.aiSystems.id, systemId), eq(schema.aiSystems.orgId, session.orgId)))
    .limit(1);
  const system = systems[0];
  if (!system) notFound();

  const assessments = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.systemId, system.id));
  const latest = assessments[0];
  let controlRows: Array<{
    status: string;
    code: string;
    title: string;
    euRef: string;
    nistRef: string;
    isoRef: string;
  }> = [];
  let signoff = null as null | { opinion: string; summary: string; signedAt: Date | null };
  if (latest) {
    const joined = await db
      .select({
        status: schema.assessmentControls.status,
        code: schema.controls.code,
        title: schema.controls.title,
        euRef: schema.controls.euRef,
        nistRef: schema.controls.nistRef,
        isoRef: schema.controls.isoRef,
      })
      .from(schema.assessmentControls)
      .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
      .where(eq(schema.assessmentControls.assessmentId, latest.id));
    controlRows = joined;
    const so = await db
      .select()
      .from(schema.auditorSignoffs)
      .where(eq(schema.auditorSignoffs.assessmentId, latest.id))
      .limit(1);
    if (so[0]) signoff = so[0];
  }

  const evidence = await db
    .select()
    .from(schema.evidenceItems)
    .where(eq(schema.evidenceItems.systemId, system.id));
  const fairness = await db
    .select()
    .from(schema.fairnessRuns)
    .where(eq(schema.fairnessRuns.systemId, system.id));
  const redteam = await db
    .select()
    .from(schema.redteamRuns)
    .where(eq(schema.redteamRuns.systemId, system.id));

  return (
    <div className="mx-auto max-w-4xl bg-white p-10 print:p-0">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
            V77 AI Auditor · Audit report
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{system.name}</h1>
          <p className="mt-2 text-sm text-slate-600">{system.description}</p>
        </div>
        <RiskBadge tier={system.riskTier} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">1. System profile</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs uppercase text-slate-500">Organisation</dt><dd>{session.orgName}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">Value-chain role</dt><dd className="capitalize">{system.roleInValueChain}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">Intended purpose</dt><dd>{system.intendedPurpose || "—"}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">GPAI</dt><dd>{system.gpai ? "Yes" : "No"}</dd></div>
        </dl>
        {system.classificationNotes ? (
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{system.classificationNotes}</p>
        ) : null}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">2. Control assessment</h2>
        {latest ? (
          <p className="mt-1 text-sm text-slate-500">{latest.name} · {latest.status}</p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">No assessment linked.</p>
        )}
        <table className="mt-4 w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Control</th>
              <th className="py-2">Status</th>
              <th className="py-2">Refs</th>
            </tr>
          </thead>
          <tbody>
            {controlRows.map((c) => (
              <tr key={c.code} className="border-b border-slate-100 align-top">
                <td className="py-2">
                  <div className="font-mono text-xs text-sky-700">{c.code}</div>
                  <div>{c.title}</div>
                </td>
                <td className="py-2 capitalize">{c.status.replaceAll("_", " ")}</td>
                <td className="py-2 text-xs text-slate-500">
                  EU {c.euRef}; NIST {c.nistRef}; ISO {c.isoRef}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">3. Technical tests</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Fairness runs: {fairness.length}</li>
          <li>Red-team runs: {redteam.length}{redteam[0] ? ` (latest pass ${redteam[0].passCount} / fail ${redteam[0].failCount})` : ""}</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">4. Evidence index</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {evidence.map((e) => (
            <li key={e.id}>
              {e.title} — {e.filename} (sha256:{e.sha256.slice(0, 12)}…)
            </li>
          ))}
          {evidence.length === 0 ? <li>No evidence linked to this system.</li> : null}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">5. Auditor opinion</h2>
        {signoff ? (
          <div className="mt-2 rounded-lg border border-slate-200 p-4 text-sm">
            <div className="font-semibold capitalize">{signoff.opinion.replaceAll("_", " ")}</div>
            <p className="mt-1 text-slate-700">{signoff.summary}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Not signed off.</p>
        )}
      </section>

      <p className="mt-10 text-xs text-slate-400">
        Generated by V77 Trust · Not a notified-body certificate.
        Export this page via your browser (Print → Save as PDF) for an offline pack.
      </p>
    </div>
  );
}
