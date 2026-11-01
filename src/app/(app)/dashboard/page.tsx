export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq, count } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, RiskBadge } from "@/components/ui";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();

  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));
  const assessments = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.orgId, session.orgId));
  const evidence = await db
    .select({ value: count() })
    .from(schema.evidenceItems)
    .where(eq(schema.evidenceItems.orgId, session.orgId));
  const controls = await db.select({ value: count() }).from(schema.controls);

  const stats = [
    { label: "AI systems", value: systems.length, href: "/systems" },
    { label: "Assessments", value: assessments.length, href: "/assessments" },
    { label: "Evidence items", value: Number(evidence[0]?.value ?? 0), href: "/evidence" },
    { label: "Controls in library", value: Number(controls[0]?.value ?? 0), href: "/controls" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome, ${session.name}. Track inventory, risk tiers, and assurance work for ${session.orgName}.`}
        actions={
          <Link href="/systems/new" className="btn btn-primary">
            Add AI system
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 hover:border-teal-300">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {s.label}
            </div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">
              {s.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800">
          Recent systems
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-2 font-semibold">Name</th>
              <th className="px-5 py-2 font-semibold">Domain</th>
              <th className="px-5 py-2 font-semibold">Role</th>
              <th className="px-5 py-2 font-semibold">Risk</th>
            </tr>
          </thead>
          <tbody>
            {systems.slice(0, 8).map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-5 py-3">
                  <Link className="font-medium text-teal-800 hover:underline" href={`/systems/${s.id}`}>
                    {s.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{s.domain}</td>
                <td className="px-5 py-3 capitalize text-slate-600">
                  {s.roleInValueChain}
                </td>
                <td className="px-5 py-3">
                  <RiskBadge tier={s.riskTier} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
