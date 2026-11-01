import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  createNotification,
} from "@/lib/notifications/store";
import { isReadOnly } from "@/lib/auth/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listNotifications({ orgId: session.orgId, userId: session.userId });
  return NextResponse.json({
    notifications: rows.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      href: n.href,
      read: Boolean(n.readAt),
      createdAt: n.createdAt?.toISOString?.() || n.createdAt,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean };
  if (body.all) {
    await markAllNotificationsRead({ orgId: session.orgId, userId: session.userId });
    return NextResponse.json({ ok: true });
  }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await markNotificationRead({ orgId: session.orgId, userId: session.userId, id: body.id });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    body?: string;
    href?: string;
    kind?: string;
  };
  if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
  const id = await createNotification({
    orgId: session.orgId,
    userId: null,
    title: body.title.trim(),
    body: body.body || "",
    href: body.href || "",
    kind: body.kind || "info",
  });
  return NextResponse.json({ id });
}
