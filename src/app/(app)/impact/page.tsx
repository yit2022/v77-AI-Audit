export const dynamic = "force-dynamic";

import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/ui";
import { IMPACT_TEMPLATES } from "@/lib/impact/templates";
import { ImpactCreateForm } from "@/components/impact-form";

export default async function ImpactListPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const items = await db
    .select()
    .from(schema.impactAssessments)
    .where(eq(schema.impactAssessments.orgId, session.orgId))
    .orderBy(desc(schema.impactAssessments.updatedAt));
  const systems = await db
    .select({ id: schema.aiSystems.id, name: schema.aiSystems.name })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));

  return (
    <div>
      <PageHeader
        title="Global Impact & Conformity Assessments"
        subtitle="Multi-jurisdiction statutory impact templates with 1-click telemetry auto-drafting across EU, US, UK, Australia, and New Zealand."
      />
      <div className="card mb-6 border-sky-200 bg-sky-50/70 p-4 text-sm text-slate-700">
        <strong className="text-[#0F2A4A]">6 Global Statutory Assessment Templates Included:</strong>{" "}
        <strong>EU</strong> (Art. 27 FRIA &amp; GDPR Art. 35 DPIA) ·{" "}
        <strong>United States</strong> (Colorado SB 24-205 / NYC LL144 / NIST AI RMF) ·{" "}
        <strong>United Kingdom</strong> (UK ATRS Tier 1/2 &amp; UK GDPR / ICO AI Assessment) ·{" "}
        <strong>Australia</strong> (10 Mandatory High-Risk AI Guardrails &amp; OAIC APP 1 ADM) ·{" "}
        <strong>New Zealand</strong> (Privacy Act 2020 IPP 1–13 &amp; Algorithm Charter). Open any assessment and click{" "}
        <strong>Auto-draft from system telemetry</strong> to populate statutory answers from your live Evals, Fairness, and Red-Team runs.
      </div>
      <ImpactCreateForm systems={systems} templates={IMPACT_TEMPLATES.map((t) => ({ id: t.id, name: t.name }))} />
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <Link key={item.id} href={`/impact/${item.id}`} className="card block p-4 hover:border-sky-300">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  {item.templateId} · {item.status.replaceAll("_", " ")}
                </div>
              </div>
              <span className="text-sm text-sky-700">Open →</span>
            </div>
          </Link>
        ))}
        {items.length === 0 ? (
          <EmptyState
            title="No impact assessments yet"
            body="Start a FRIA for high-risk deployers or a DPIA for personal-data AI processing."
          />
        ) : null}
      </div>
    </div>
  );
}
