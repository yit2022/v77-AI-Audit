import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { decideApproval, listApprovals, requestApproval } from "@/lib/approvals";
import { isReadOnly } from "@/lib/auth/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listApprovals(session.orgId);
  return NextResponse.json({ approvals: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as {
    entityType?: string;
    entityId?: string;
    title?: string;
    approvalId?: string;
    decision?: "approved" | "rejected";
    note?: string;
  };
  try {
    if (body.approvalId && body.decision) {
      await decideApproval({
        orgId: session.orgId,
        userId: session.userId,
        role: session.role,
        approvalId: body.approvalId,
        decision: body.decision,
        note: body.note,
      });
      return NextResponse.json({ ok: true });
    }
    if (!body.entityType || !body.entityId || !body.title) {
      return NextResponse.json({ error: "entityType, entityId, title required" }, { status: 400 });
    }
    const id = await requestApproval({
      orgId: session.orgId,
      userId: session.userId,
      role: session.role,
      entityType: body.entityType,
      entityId: body.entityId,
      title: body.title,
    });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
