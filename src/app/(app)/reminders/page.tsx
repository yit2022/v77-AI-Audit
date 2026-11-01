export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth/session";
import { listReminders, syncReassessmentReminders } from "@/lib/reminders";
import { PageHeader } from "@/components/ui";
import { RemindersClient } from "@/components/reminders-client";
import { ReassessmentForm } from "@/components/reassessment-form";
import { db, ensureDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function RemindersPage() {
  const session = await getSession();
  if (!session) return null;
  await syncReassessmentReminders(session.orgId);
  const reminders = await listReminders(session.orgId);
  await ensureDb();
  const systems = await db
    .select({ id: schema.aiSystems.id, name: schema.aiSystems.name })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reminders"
        subtitle="Scheduled re-assessments and monitoring due dates — in-app only. V77 Trust never sends reminder emails."
      />
      <ReassessmentForm systems={systems} />
      <RemindersClient
        reminders={reminders.map((r) => ({
          id: r.id,
          kind: r.kind,
          title: r.title,
          body: r.body,
          href: r.href,
          dueAt: r.dueAt ? r.dueAt.toISOString() : null,
          acknowledgedAt: r.acknowledgedAt ? r.acknowledgedAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
