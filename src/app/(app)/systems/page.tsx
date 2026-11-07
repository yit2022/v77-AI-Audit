export const dynamic = "force-dynamic";

import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, RiskBadge, EmptyState } from "@/components/ui";
import { filterRegistry, summariseRegistry } from "@/lib/registry/summary";
import { RegistryFilters } from "@/components/registry-filters";
import { InventoryCsvImport } from "@/components/inventory-csv-import";
import {
  classifyEuSovereigntyPosture,
  getEuIndustryPlaybook,
  getRecommendedPolicyPacks,
  parseInstitutionAndVendor,
} from "@/lib/eu-ai-act/industries";

export default async function SystemsPage({
  searchParams,
}: {
  searchParams: Promise<{ riskTier?: string; lifecycleStatus?: string; role?: string; institution?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const sp = await searchParams;
  await ensureDb();

  const [systems, assessmentRows] = await Promise.all([
    db
      .select()
      .from(schema.aiSystems)
      .where(eq(schema.aiSystems.orgId, session.orgId))
      .orderBy(desc(schema.aiSystems.createdAt)),
    db
      .select({
        id: schema.assessments.id,
        systemId: schema.assessments.systemId,
        status: schema.assessments.status,
      })
      .from(schema.assessments)
      .where(eq(schema.assessments.orgId, session.orgId)),
  ]);

  const assessmentBySystem = new Map<string, { id: string; status: string; signedOff: boolean }>();
  for (const a of assessmentRows) {
    if (!assessmentBySystem.has(a.systemId)) {
      assessmentBySystem.set(a.systemId, {
        id: a.id,
        status: a.status,
        signedOff: a.status === "signed_off" || a.status === "approved",
      });
    }
  }

  const allInstitutions = Array.from(
    new Set(systems.map((s) => parseInstitutionAndVendor(s.vendorName, session.orgName).institution)),
  );

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

  const activeInstitutionFilter = sp.institution?.trim() || "all";
  const visible = systems.filter((s) => {
    if (!filteredIds.has(s.id)) return false;
    if (activeInstitutionFilter !== "all") {
      const { institution } = parseInstitutionAndVendor(s.vendorName, session.orgName);
      if (institution !== activeInstitutionFilter) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Active AI Audit Projects & Institution Registry"
        subtitle={`Workspace: ${session.orgName} · View all AI systems being audited, which Institution / Client Entity they belong to, their European sector playbook, and their 6-stage conformity status.`}
        actions={
          <>
            <InventoryCsvImport />
            <a className="btn btn-secondary" href="/api/systems?format=registry">
              Export Registry JSON
            </a>
            <Link href="/systems/new" className="btn btn-primary">
              + Start New AI Audit Project
            </Link>
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Total Projects", summary.total],
          ["Institutions / Units", Math.max(allInstitutions.length, 1)],
          ["High-Risk (Annex I/III)", summary.byRisk.high_risk ?? 0],
          ["Limited Risk (Art. 50)", summary.byRisk.limited ?? 0],
          ["GPAI (Chapter V)", summary.gpaiCount],
          ["Unclassified", summary.unclassified],
        ].map(([label, value]) => (
          <div key={String(label)} className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Institution Filter Bar */}
      {allInstitutions.length > 0 ? (
        <div className="mb-4 card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#0F2A4A]">
            Filter Projects by Audited Institution / Client Entity:
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Link
              href="/systems"
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activeInstitutionFilter === "all"
                  ? "bg-[#0F2A4A] text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-sky-50"
              }`}
            >
              All Institutions ({systems.length})
            </Link>
            {allInstitutions.map((inst) => (
              <Link
                key={inst}
                href={`/systems?institution=${encodeURIComponent(inst)}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  activeInstitutionFilter === inst
                    ? "bg-[#0F2A4A] text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-sky-50"
                }`}
              >
                {inst}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <RegistryFilters
        riskTier={sp.riskTier ?? "all"}
        lifecycleStatus={sp.lifecycleStatus ?? "all"}
        role={sp.role ?? "all"}
      />

      {visible.length === 0 ? (
        <EmptyState
          title="No AI audit projects match"
          body="Start a new AI audit project with our pre-populated European blueprints or clear the filters above."
        />
      ) : (
        <div className="mt-4 grid gap-4">
          {visible.map((s) => {
            const { institution, modelVendor } = parseInstitutionAndVendor(s.vendorName, session.orgName);
            const sovereignty = classifyEuSovereigntyPosture(modelVendor);
            const policyPacks = getRecommendedPolicyPacks(s.domain, s.riskTier, s.gpai);
            const playbook = getEuIndustryPlaybook(s.domain);
            const assess = assessmentBySystem.get(s.id);
            let stageBadge = "Stage 1/6 · Needs Risk Classification";
            let stageClass = "border-amber-200 bg-amber-50 text-amber-800";
            if (assess?.signedOff) {
              stageBadge = "Stage 6/6 · Auditor Signed Off";
              stageClass = "border-emerald-200 bg-emerald-50 text-emerald-800";
            } else if (assess) {
              stageBadge = "Stage 5/6 · Controls & Evidence In Progress";
              stageClass = "border-sky-200 bg-sky-50 text-sky-800";
            } else if (s.riskTier) {
              stageBadge = "Stage 3/6 · Classified — Testing & Docs";
              stageClass = "border-indigo-200 bg-indigo-50 text-indigo-800";
            }

            return (
              <div key={s.id} className="card p-5 transition hover:border-sky-300">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-[#0F2A4A]">
                        Institution: {institution}
                      </span>
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {playbook.shortLabel}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sovereignty.badgeClass}`}>
                        {sovereignty.shortBadge}
                      </span>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${stageClass}`}>
                        {stageBadge}
                      </span>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">
                      <Link href={`/systems/${s.id}`} className="hover:text-sky-800 hover:underline">
                        {s.name}
                      </Link>
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-slate-600">
                      {s.description || "No description"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {policyPacks.map((pk) => (
                        <span
                          key={pk.id}
                          className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#0F2A4A]"
                        >
                          {pk.code}: {pk.title.split(" (")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <RiskBadge tier={s.riskTier} />
                    <div className="flex flex-wrap gap-1.5">
                      <Link href={`/systems/${s.id}`} className="btn btn-primary px-3 py-1 text-xs">
                        Open 360° Command Center →
                      </Link>
                      {assess ? (
                        <Link href={`/assessments/${assess.id}`} className="btn btn-secondary px-2.5 py-1 text-xs">
                          24 Controls
                        </Link>
                      ) : (
                        <Link href={`/classification/${s.id}`} className="btn btn-secondary px-2.5 py-1 text-xs">
                          Classify Risk
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>
                    <strong className="text-slate-700">Audited Institution:</strong> {institution}
                  </span>
                  <span>
                    <strong className="text-slate-700">Model / Vendor:</strong> {modelVendor}
                  </span>
                  <span className="capitalize">
                    <strong className="text-slate-700">EU Role:</strong> {s.roleInValueChain}
                  </span>
                  <span className="capitalize">
                    <strong className="text-slate-700">Lifecycle:</strong> {s.lifecycleStatus}
                  </span>
                  {s.versionLabel ? (
                    <span>
                      <strong className="text-slate-700">Version:</strong> {s.versionLabel}
                    </span>
                  ) : null}
                  {s.euDatabaseId ? (
                    <span>
                      <strong className="text-slate-700">EU DB ID:</strong> {s.euDatabaseId}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
