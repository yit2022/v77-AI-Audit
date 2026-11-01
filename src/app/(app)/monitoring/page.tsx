export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PageHeader, EmptyState } from "@/components/ui";
import { MonitoringClient } from "@/components/monitoring-client";

export default async function MonitoringPage() {
  const session = await getSession();
  if (!session) return null;
  await ensureDb();
  const schedules = await db
    .select({
      schedule: schema.monitoringSchedules,
      systemName: schema.aiSystems.name,
    })
    .from(schema.monitoringSchedules)
    .innerJoin(schema.aiSystems, eq(schema.monitoringSchedules.systemId, schema.aiSystems.id))
    .where(eq(schema.monitoringSchedules.orgId, session.orgId))
    .orderBy(desc(schema.monitoringSchedules.createdAt));
  const alerts = await db
    .select({
      alert: schema.monitoringAlerts,
      systemName: schema.aiSystems.name,
    })
    .from(schema.monitoringAlerts)
    .innerJoin(schema.aiSystems, eq(schema.monitoringAlerts.systemId, schema.aiSystems.id))
    .where(eq(schema.monitoringAlerts.orgId, session.orgId))
    .orderBy(desc(schema.monitoringAlerts.createdAt));
  const systems = await db
    .select({ id: schema.aiSystems.id, name: schema.aiSystems.name })
    .from(schema.aiSystems)
    .where(eq(schema.aiSystems.orgId, session.orgId));

  return (
    <div>
      <PageHeader
        title="Continuous monitoring"
        subtitle="Scheduled re-checks for control regressions and fairness drift."
      />
      <MonitoringClient
        systems={systems}
        schedules={schedules.map(({ schedule, systemName }) => ({
          id: schedule.id,
          name: schedule.name,
          systemName,
          cadenceHours: schedule.cadenceHours,
          enabled: schedule.enabled,
          lastRunAt: schedule.lastRunAt?.toISOString() ?? null,
          nextRunAt: schedule.nextRunAt?.toISOString() ?? null,
        }))}
        alerts={alerts.map(({ alert, systemName }) => ({
          id: alert.id,
          systemName,
          severity: alert.severity,
          kind: alert.kind,
          message: alert.message,
          acknowledged: alert.acknowledged,
          createdAt: alert.createdAt.toISOString(),
        }))}
      />
      {schedules.length === 0 && alerts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No monitors yet"
            body="Create a schedule to re-check an AI system for control and fairness drift."
          />
        </div>
      ) : null}
    </div>
  );
}
