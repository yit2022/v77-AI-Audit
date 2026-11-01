export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { AssessmentControlsClient } from "@/components/assessment-controls";

export default async function AssessmentDetailPage({
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
    .from(schema.assessments)
    .where(and(eq(schema.assessments.id, id), eq(schema.assessments.orgId, session.orgId)))
    .limit(1);
  const assessment = rows[0];
  if (!assessment) notFound();

  const controls = await db
    .select({
      ac: schema.assessmentControls,
      control: schema.controls,
    })
    .from(schema.assessmentControls)
    .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
    .where(eq(schema.assessmentControls.assessmentId, assessment.id));

  return (
    <div>
      <PageHeader
        title={assessment.name}
        subtitle={`Status: ${assessment.status.replace("_", " ")}`}
      />
      <AssessmentControlsClient
        items={controls.map(({ ac, control }) => ({
          id: ac.id,
          status: ac.status,
          notes: ac.notes ?? "",
          code: control.code,
          title: control.title,
          euRef: control.euRef,
          nistRef: control.nistRef,
          isoRef: control.isoRef,
        }))}
      />
    </div>
  );
}
