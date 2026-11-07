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
        title="EU AI Act Art. 27 FRIA & GDPR Art. 35 DPIA"
        subtitle="European statutory impact assessment templates with 1-click telemetry auto-drafting from your live Evals, Fairness, and Red-Team runs."
      />
      <div className="card mb-6 border-sky-200 bg-sky-50/70 p-4 text-sm text-slate-700">
        <strong className="text-[#0F2A4A]">EU AI Act Art. 27 FRIA &amp; GDPR Art. 35 DPIA Linkage:</strong> when a
        high-risk AI system (such as banking credit scoring or insurance risk assessment under Annex III pt. 5)
        processes personal data, deployers must complete both an <strong>Article 27 Fundamental Rights Impact Assessment (FRIA)</strong>{" "}
        and a <strong>GDPR Article 35 Data Protection Impact Assessment (DPIA)</strong>. Start either assessment below
        and click <strong>Auto-draft from system telemetry</strong> to populate statutory answers automatically.
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
