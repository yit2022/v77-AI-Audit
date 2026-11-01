import { and, desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { canApprove, canWrite } from "@/lib/auth/rbac";
import { appendAuditLog } from "@/lib/audit/log";

export async function listApprovals(orgId: string) {
  await ensureDb();
  return db
    .select()
    .from(schema.approvalRequests)
    .where(eq(schema.approvalRequests.orgId, orgId))
    .orderBy(desc(schema.approvalRequests.createdAt));
}

export async function requestApproval(opts: {
  orgId: string;
  userId: string;
  role: string;
  entityType: string;
  entityId: string;
  title: string;
}) {
  if (!canWrite(opts.role) && !canApprove(opts.role)) {
    throw new Error("Not allowed to request approval");
  }
  await ensureDb();
  const rowId = id();
  await db.insert(schema.approvalRequests).values({
    id: rowId,
    orgId: opts.orgId,
    entityType: opts.entityType,
    entityId: opts.entityId,
    title: opts.title,
    status: "pending",
    requestedBy: opts.userId,
  });
  await appendAuditLog({
    orgId: opts.orgId,
    actorUserId: opts.userId,
    action: "approval.requested",
    entityType: opts.entityType,
    entityId: opts.entityId,
    detail: { title: opts.title },
  });
  return rowId;
}

export async function decideApproval(opts: {
  orgId: string;
  userId: string;
  role: string;
  approvalId: string;
  decision: "approved" | "rejected";
  note?: string;
}) {
  if (!canApprove(opts.role)) throw new Error("Reviewer or owner required to decide");
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.approvalRequests)
    .where(and(eq(schema.approvalRequests.id, opts.approvalId), eq(schema.approvalRequests.orgId, opts.orgId)))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error("Not found");
  if (row.status !== "pending") throw new Error("Already decided");
  await db
    .update(schema.approvalRequests)
    .set({
      status: opts.decision,
      reviewedBy: opts.userId,
      decisionNote: opts.note || "",
      decidedAt: new Date(),
    })
    .where(eq(schema.approvalRequests.id, opts.approvalId));
  await appendAuditLog({
    orgId: opts.orgId,
    actorUserId: opts.userId,
    action: `approval.${opts.decision}`,
    entityType: row.entityType,
    entityId: row.entityId,
    detail: { note: opts.note || "" },
  });
}
