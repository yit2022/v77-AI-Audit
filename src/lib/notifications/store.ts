import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";

export async function listNotifications(opts: { orgId: string; userId: string; limit?: number }) {
  await ensureDb();
  return db
    .select()
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.orgId, opts.orgId),
        or(eq(schema.notifications.userId, opts.userId), isNull(schema.notifications.userId)),
      ),
    )
    .orderBy(desc(schema.notifications.createdAt))
    .limit(opts.limit ?? 40);
}

export async function createNotification(input: {
  orgId: string;
  userId?: string | null;
  kind?: string;
  title: string;
  body?: string;
  href?: string;
}) {
  await ensureDb();
  const rowId = id();
  await db.insert(schema.notifications).values({
    id: rowId,
    orgId: input.orgId,
    userId: input.userId || null,
    kind: input.kind || "info",
    title: input.title,
    body: input.body || "",
    href: input.href || "",
  });
  return rowId;
}

export async function markNotificationRead(opts: { orgId: string; userId: string; id: string }) {
  await ensureDb();
  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(and(eq(schema.notifications.id, opts.id), eq(schema.notifications.orgId, opts.orgId)));
}

export async function markAllNotificationsRead(opts: { orgId: string; userId: string }) {
  await ensureDb();
  const rows = await listNotifications({ orgId: opts.orgId, userId: opts.userId, limit: 200 });
  for (const r of rows) {
    if (!r.readAt) {
      await db.update(schema.notifications).set({ readAt: new Date() }).where(eq(schema.notifications.id, r.id));
    }
  }
}
