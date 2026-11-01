import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOrgChecklist, setChecklistStep } from "@/lib/onboarding/checklist";
import { isReadOnly } from "@/lib/auth/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await getOrgChecklist(session.orgId);
  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { stepId?: string; done?: boolean };
  if (!body.stepId || typeof body.done !== "boolean") {
    return NextResponse.json({ error: "stepId and done required" }, { status: 400 });
  }
  const items = await setChecklistStep(session.orgId, body.stepId, body.done);
  if (!items) return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  return NextResponse.json({ items });
}
