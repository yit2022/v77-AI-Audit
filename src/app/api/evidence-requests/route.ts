import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isReadOnly } from "@/lib/auth/rbac";
import {
  cancelEvidenceRequest,
  completeEvidenceRequest,
  createEvidenceRequest,
  listEvidenceRequests,
  summarizeExpiry,
} from "@/lib/evidence-requests/service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listEvidenceRequests(session.orgId);
  const summary = summarizeExpiry(rows);
  return NextResponse.json({
    summary,
    requests: rows.map((r) => ({
      ...r,
      nextDueAt: r.nextDueAt?.toISOString?.() ?? r.nextDueAt,
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    systemId?: string;
    controlId?: string;
    assigneeUserId?: string;
    cadenceDays?: number;
    nextDueAt?: string;
    expiresAt?: string;
  };
  if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!body.nextDueAt) return NextResponse.json({ error: "nextDueAt required" }, { status: 400 });
  const nextDueAt = new Date(body.nextDueAt);
  if (Number.isNaN(nextDueAt.getTime())) return NextResponse.json({ error: "invalid nextDueAt" }, { status: 400 });
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "invalid expiresAt" }, { status: 400 });
  }
  const rowId = await createEvidenceRequest({
    orgId: session.orgId,
    title: body.title,
    description: body.description,
    systemId: body.systemId,
    controlId: body.controlId,
    assigneeUserId: body.assigneeUserId,
    cadenceDays: body.cadenceDays,
    nextDueAt,
    expiresAt,
    createdBy: session.userId,
  });
  return NextResponse.json({ id: rowId });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { id?: string; action?: string };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (body.action === "complete") {
    await completeEvidenceRequest(session.orgId, body.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "cancel") {
    await cancelEvidenceRequest(session.orgId, body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "action must be complete|cancel" }, { status: 400 });
}
