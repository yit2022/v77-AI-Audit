import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";
import { dueSchedules, runMonitoringCheck } from "@/lib/monitoring/runner";

export async function GET() {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const schedules = await db
    .select()
    .from(schema.monitoringSchedules)
    .where(eq(schema.monitoringSchedules.orgId, session.orgId))
    .orderBy(desc(schema.monitoringSchedules.createdAt));
  const alerts = await db
    .select()
    .from(schema.monitoringAlerts)
    .where(eq(schema.monitoringAlerts.orgId, session.orgId))
    .orderBy(desc(schema.monitoringAlerts.createdAt));
  const runs = await db
    .select()
    .from(schema.monitoringRuns)
    .where(eq(schema.monitoringRuns.orgId, session.orgId))
    .orderBy(desc(schema.monitoringRuns.createdAt))
    .limit(50);
  return NextResponse.json({ schedules, alerts, runs });
}

const createSchema = z.object({
  systemId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  cadenceHours: z.number().int().min(1).max(24 * 30).default(24),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.action === "run_due") {
    const due = (await dueSchedules()).filter((s) => s.orgId === session.orgId);
    const results = [];
    for (const s of due) results.push(await runMonitoringCheck(s.id));
    return NextResponse.json({ ran: results.length, results });
  }
  if (body?.action === "run" && body.scheduleId) {
    const result = await runMonitoringCheck(body.scheduleId);
    return NextResponse.json(result);
  }
  if (body?.action === "ack" && body.alertId) {
    await ensureDb();
    await db
      .update(schema.monitoringAlerts)
      .set({ acknowledged: true })
      .where(and(eq(schema.monitoringAlerts.id, body.alertId), eq(schema.monitoringAlerts.orgId, session.orgId)));
    return NextResponse.json({ ok: true });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await ensureDb();
  const systems = await db
    .select()
    .from(schema.aiSystems)
    .where(and(eq(schema.aiSystems.id, parsed.data.systemId), eq(schema.aiSystems.orgId, session.orgId)))
    .limit(1);
  if (!systems[0]) return NextResponse.json({ error: "System not found" }, { status: 404 });
  const scheduleId = id();
  const nextRunAt = new Date();
  await db.insert(schema.monitoringSchedules).values({
    id: scheduleId,
    orgId: session.orgId,
    systemId: parsed.data.systemId,
    name: parsed.data.name || `Monitor · ${systems[0].name}`,
    cadenceHours: parsed.data.cadenceHours,
    enabled: true,
    nextRunAt,
  });
  return NextResponse.json({ id: scheduleId }, { status: 201 });
}
