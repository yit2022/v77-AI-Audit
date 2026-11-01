import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { acknowledgeReminder, listReminders, syncReassessmentReminders } from "@/lib/reminders";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await syncReassessmentReminders(session.orgId);
  const reminders = await listReminders(session.orgId);
  return NextResponse.json({ reminders });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await acknowledgeReminder(session.orgId, body.id);
  return NextResponse.json({ ok: true });
}
