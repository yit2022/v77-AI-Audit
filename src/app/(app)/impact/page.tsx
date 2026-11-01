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
        title="Impact assessments"
        subtitle="EU AI Act Art. 27 FRIA and complementary GDPR DPIA templates."
      />
      <div className="card mb-6 border-sky-200 bg-sky-50/70 p-4 text-sm text-slate-700">
        <strong className="text-[#0F2A4A]">GDPR / DPIA linkage:</strong> when a high-risk system processes personal
        data, complete both an Art. 27 FRIA and a GDPR Art. 35 DPIA. Neither replaces the other — start both from this
        page and keep them linked in your evidence vault. Continue obligations tracking in{" "}
        <a className="font-semibold text-sky-700 hover:underline" href="/eu-ai-act">
          EU AI Act
        </a>
        .
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
