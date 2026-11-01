import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { createReassessmentSchedule } from "@/lib/reminders";
import { db, ensureDb, schema } from "@/lib/db";
import { isReadOnly } from "@/lib/auth/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const rows = await db
    .select({
      schedule: schema.reassessmentSchedules,
      systemName: schema.aiSystems.name,
    })
    .from(schema.reassessmentSchedules)
    .innerJoin(schema.aiSystems, eq(schema.reassessmentSchedules.systemId, schema.aiSystems.id))
    .where(eq(schema.reassessmentSchedules.orgId, session.orgId));
  return NextResponse.json({
    schedules: rows.map(({ schedule, systemName }) => ({ ...schedule, systemName })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { systemId?: string; cadenceDays?: number };
  if (!body.systemId) return NextResponse.json({ error: "systemId required" }, { status: 400 });
  try {
    const id = await createReassessmentSchedule({
      orgId: session.orgId,
      role: session.role,
      systemId: body.systemId,
      cadenceDays: body.cadenceDays || 90,
    });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
