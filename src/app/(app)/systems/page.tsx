export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, RiskBadge, EmptyState } from "@/components/ui";
import { filterRegistry, summariseRegistry } from "@/lib/registry/summary";
import { RegistryFilters } from "@/components/registry-filters";
import { InventoryCsvImport } from "@/components/inventory-csv-import";

export default async function SystemsPage({
  searchParams,
}: {
  searchParams: Promise<{ riskTier?: string; lifecycleStatus?: string; role?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;
  await ensureDb();
  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId))
    .orderBy(desc(schema.aiSystems.createdAt));

  const summary = summariseRegistry(
    systems.map((s) => ({
      id: s.id,
      name: s.name,
      riskTier: s.riskTier,
      roleInValueChain: s.roleInValueChain,
      lifecycleStatus: s.lifecycleStatus,
      gpai: s.gpai,
    })),
  );
  const filteredIds = new Set(
    filterRegistry(
      systems.map((s) => ({
        id: s.id,
        name: s.name,
        riskTier: s.riskTier,
        roleInValueChain: s.roleInValueChain,
        lifecycleStatus: s.lifecycleStatus,
        gpai: s.gpai,
      })),
      {
        riskTier: sp.riskTier ?? "all",
        lifecycleStatus: sp.lifecycleStatus ?? "all",
        role: sp.role ?? "all",
      },
    ).map((s) => s.id),
  );
  const visible = systems.filter((s) => filteredIds.has(s.id));

  return (
    <div>
      <PageHeader
        title="AI Inventory & Registry"
        subtitle="EU AI Act risk tiers, value-chain roles, lifecycle status, and guided classification."
        actions={
          <>
            <InventoryCsvImport />
            <a className="btn btn-secondary" href="/api/systems?format=registry">
              Export registry JSON
            </a>
            <Link href="/systems/new" className="btn btn-primary">
              New system
            </Link>
          </>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", summary.total],
          ["High-risk", summary.byRisk.high_risk ?? 0],
          ["Limited", summary.byRisk.limited ?? 0],
          ["Unclassified", summary.unclassified],
          ["GPAI", summary.gpaiCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
          </div>
        ))}
      </div>
      <RegistryFilters
        riskTier={sp.riskTier ?? "all"}
        lifecycleStatus={sp.lifecycleStatus ?? "all"}
        role={sp.role ?? "all"}
      />
      {visible.length === 0 ? (
        <EmptyState
          title="No systems match"
          body="Add an AI system or clear filters to see the full registry."
        />
      ) : (
        <div className="mt-4 grid gap-4">
          {visible.map((s) => (
            <Link key={s.id} href={`/systems/${s.id}`} className="card block p-5 hover:border-sky-300">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{s.name}</h2>
                  <p className="mt-1 max-w-3xl text-sm text-slate-500">{s.description || "No description"}</p>
                </div>
                <RiskBadge tier={s.riskTier} />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>Domain: {s.domain}</span>
                <span className="capitalize">Role: {s.roleInValueChain}</span>
                <span className="capitalize">Lifecycle: {s.lifecycleStatus}</span>
                {s.versionLabel ? <span>Version: {s.versionLabel}</span> : null}
                {s.vendorName ? <span>Vendor: {s.vendorName}</span> : null}
                {s.gpai ? <span>GPAI flagged</span> : null}
                <span>
                  <span className="text-sky-700">Classify →</span>{" "}
                  <span className="underline decoration-sky-400/40">/classification/{s.id}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
