export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, RiskBadge, EmptyState } from "@/components/ui";

export default async function SystemsPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId))
    .orderBy(desc(schema.aiSystems.createdAt));

  return (
    <div>
      <PageHeader
        title="AI Inventory"
        subtitle="Catalogue models, applications and agents with intended purpose and value-chain role."
        actions={
          <Link href="/systems/new" className="btn btn-primary">
            New system
          </Link>
        }
      />
      {systems.length === 0 ? (
        <EmptyState
          title="No systems yet"
          body="Add your first AI system to start classification and assessment."
        />
      ) : (
        <div className="grid gap-4">
          {systems.map((s) => (
            <Link
              key={s.id}
              href={`/systems/${s.id}`}
              className="card block p-5 hover:border-teal-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{s.name}</h2>
                  <p className="mt-1 max-w-3xl text-sm text-slate-500">
                    {s.description || "No description"}
                  </p>
                </div>
                <RiskBadge tier={s.riskTier} />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>Domain: {s.domain}</span>
                <span className="capitalize">Role: {s.roleInValueChain}</span>
                {s.gpai ? <span>GPAI flagged</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
