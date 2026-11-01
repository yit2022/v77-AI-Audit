export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { getImpactTemplate } from "@/lib/impact/templates";
import { ImpactEditor } from "@/components/impact-editor";

export default async function ImpactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.impactAssessments)
    .where(and(eq(schema.impactAssessments.id, id), eq(schema.impactAssessments.orgId, session.orgId)))
    .limit(1);
  const impact = rows[0];
  if (!impact) notFound();
  const template = getImpactTemplate(impact.templateId);
  if (!template) notFound();
  const answers = await db.select().from(schema.impactAnswers).where(eq(schema.impactAnswers.impactId, impact.id));
  const answerMap = Object.fromEntries(answers.map((a) => [a.questionId, a.answer]));

  return (
    <div>
      <PageHeader
        title={impact.title}
        subtitle={`${template.legalBasis} · Status: ${impact.status.replaceAll("_", " ")}`}
      />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">{template.description}</p>
      <ImpactEditor
        impactId={impact.id}
        status={impact.status}
        questions={template.questions}
        answers={answerMap}
      />
    </div>
  );
}
