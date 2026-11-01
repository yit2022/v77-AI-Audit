import { and, asc, desc, eq, isNull, lte } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { canWrite } from "@/lib/auth/rbac";
import { sendEmail } from "@/lib/email/send";
import { reminderEmail } from "@/lib/email/templates";

/** Create or refresh due in-app reminders from reassessment schedules; email when Resend is configured. */
export async function syncReassessmentReminders(orgId: string) {
  await ensureDb();
  const now = new Date();
  const schedules = await db
    .select({
      schedule: schema.reassessmentSchedules,
      systemName: schema.aiSystems.name,
    })
    .from(schema.reassessmentSchedules)
    .innerJoin(schema.aiSystems, eq(schema.reassessmentSchedules.systemId, schema.aiSystems.id))
    .where(
      and(
        eq(schema.reassessmentSchedules.orgId, orgId),
        eq(schema.reassessmentSchedules.enabled, true),
        lte(schema.reassessmentSchedules.nextDueAt, new Date(now.getTime() + 14 * 86400000)),
      ),
    );

  for (const { schedule, systemName } of schedules) {
    const title = `Re-assessment due: ${systemName}`;
    const existing = await db
      .select({ id: schema.inAppReminders.id })
      .from(schema.inAppReminders)
      .where(
        and(
          eq(schema.inAppReminders.orgId, orgId),
          eq(schema.inAppReminders.kind, "reassessment"),
          eq(schema.inAppReminders.href, `/assessments?systemId=${schedule.systemId}`),
          isNull(schema.inAppReminders.acknowledgedAt),
        ),
      )
      .limit(1);
    if (existing[0]) continue;
    await db.insert(schema.inAppReminders).values({
      id: id(),
      orgId,
      kind: "reassessment",
      title,
      body: `Scheduled every ${schedule.cadenceDays} days. Complete the next assessment pack in-app.`,
      href: `/assessments?systemId=${schedule.systemId}`,
      dueAt: schedule.nextDueAt,
    });
    try {
      const admins = await db
        .select({ email: schema.users.email })
        .from(schema.memberships)
        .innerJoin(schema.users, eq(schema.memberships.userId, schema.users.id))
        .where(and(eq(schema.memberships.orgId, orgId), eq(schema.memberships.role, "admin")))
        .limit(1);
      if (admins[0]?.email) {
        const tpl = reminderEmail({
          title,
          dueAt: schedule.nextDueAt.toISOString().slice(0, 10),
        });
        await sendEmail({ to: admins[0].email, subject: tpl.subject, html: tpl.html, text: tpl.text, tags: tpl.tags });
      }
    } catch { /* non-blocking */ }
  }

  // Monitoring due reminders
  const monitors = await db
    .select({
      schedule: schema.monitoringSchedules,
      systemName: schema.aiSystems.name,
    })
    .from(schema.monitoringSchedules)
    .innerJoin(schema.aiSystems, eq(schema.monitoringSchedules.systemId, schema.aiSystems.id))
    .where(
      and(
        eq(schema.monitoringSchedules.orgId, orgId),
        eq(schema.monitoringSchedules.enabled, true),
        lte(schema.monitoringSchedules.nextRunAt, now),
      ),
    );
  for (const { schedule, systemName } of monitors) {
    const href = `/monitoring`;
    const title = `Monitoring run due: ${systemName}`;
    const existing = await db
      .select({ id: schema.inAppReminders.id })
      .from(schema.inAppReminders)
      .where(
        and(
          eq(schema.inAppReminders.orgId, orgId),
          eq(schema.inAppReminders.kind, "monitoring"),
          eq(schema.inAppReminders.title, title),
          isNull(schema.inAppReminders.acknowledgedAt),
        ),
      )
      .limit(1);
    if (existing[0]) continue;
    await db.insert(schema.inAppReminders).values({
      id: id(),
      orgId,
      kind: "monitoring",
      title,
      body: `Cadence ${schedule.cadenceHours}h. Run the monitor from the Monitoring page (in-app only — no email).`,
      href,
      dueAt: schedule.nextRunAt,
    });
  }
}

export async function listReminders(orgId: string) {
  await ensureDb();
  return db
    .select()
    .from(schema.inAppReminders)
    .where(eq(schema.inAppReminders.orgId, orgId))
    .orderBy(asc(schema.inAppReminders.acknowledgedAt), desc(schema.inAppReminders.createdAt));
}

export async function acknowledgeReminder(orgId: string, reminderId: string) {
  await ensureDb();
  await db
    .update(schema.inAppReminders)
    .set({ acknowledgedAt: new Date() })
    .where(and(eq(schema.inAppReminders.id, reminderId), eq(schema.inAppReminders.orgId, orgId)));
}

export async function createReassessmentSchedule(opts: {
  orgId: string;
  role: string;
  systemId: string;
  cadenceDays: number;
}) {
  if (!canWrite(opts.role)) throw new Error("Owner role required");
  await ensureDb();
  const rowId = id();
  const nextDueAt = new Date(Date.now() + opts.cadenceDays * 86400000);
  await db.insert(schema.reassessmentSchedules).values({
    id: rowId,
    orgId: opts.orgId,
    systemId: opts.systemId,
    cadenceDays: opts.cadenceDays,
    nextDueAt,
    enabled: true,
  });
  return rowId;
}
