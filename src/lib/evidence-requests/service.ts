import { and, asc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";

export type EvidenceRequestInput = {
  orgId: string;
  title: string;
  description?: string;
  systemId?: string | null;
  controlId?: string | null;
  assigneeUserId?: string | null;
  cadenceDays?: number;
  nextDueAt: Date;
  expiresAt?: Date | null;
  createdBy?: string | null;
};

export function isExpired(expiresAt: Date | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() < now.getTime();
}

export function isOverdue(nextDueAt: Date, status: string, now = new Date()): boolean {
  if (status === "done" || status === "cancelled") return false;
  return nextDueAt.getTime() < now.getTime();
}

export async function listEvidenceRequests(orgId: string) {
  await ensureDb();
  return db
    .select()
    .from(schema.evidenceRequests)
    .where(eq(schema.evidenceRequests.orgId, orgId))
    .orderBy(asc(schema.evidenceRequests.nextDueAt));
}

export async function createEvidenceRequest(input: EvidenceRequestInput) {
  await ensureDb();
  const rowId = id();
  const cadence = Math.max(7, Math.min(365, input.cadenceDays ?? 90));
  await db.insert(schema.evidenceRequests).values({
    id: rowId,
    orgId: input.orgId,
    title: input.title.trim(),
    description: (input.description || "").trim(),
    systemId: input.systemId || null,
    controlId: input.controlId || null,
    assigneeUserId: input.assigneeUserId || null,
    cadenceDays: cadence,
    nextDueAt: input.nextDueAt,
    expiresAt: input.expiresAt || null,
    status: "open",
    createdBy: input.createdBy || null,
  });
  return rowId;
}

/** Mark complete and roll the next due date forward by cadence (recurring evidence task). */
export async function completeEvidenceRequest(orgId: string, requestId: string) {
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.evidenceRequests)
    .where(and(eq(schema.evidenceRequests.id, requestId), eq(schema.evidenceRequests.orgId, orgId)))
    .limit(1);
  const row = rows[0];
  if (!row) return false;
  const now = new Date();
  const nextDueAt = new Date(now.getTime() + row.cadenceDays * 24 * 60 * 60 * 1000);
  await db
    .update(schema.evidenceRequests)
    .set({ status: "open", nextDueAt, completedAt: now, updatedAt: now })
    .where(eq(schema.evidenceRequests.id, requestId));
  return true;
}

export async function cancelEvidenceRequest(orgId: string, requestId: string) {
  await ensureDb();
  await db
    .update(schema.evidenceRequests)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(schema.evidenceRequests.id, requestId), eq(schema.evidenceRequests.orgId, orgId)));
  return true;
}

export function summarizeExpiry(
  rows: Array<{ status: string; nextDueAt: Date; expiresAt: Date | null }>,
  now = new Date(),
) {
  let overdue = 0;
  let expiringSoon = 0;
  let expired = 0;
  const soonMs = 7 * 24 * 60 * 60 * 1000;
  for (const r of rows) {
    if (r.status === "cancelled") continue;
    if (isExpired(r.expiresAt, now)) expired++;
    else if (r.expiresAt && r.expiresAt.getTime() - now.getTime() <= soonMs) expiringSoon++;
    if (isOverdue(r.nextDueAt, r.status, now)) overdue++;
  }
  return { overdue, expiringSoon, expired, total: rows.filter((r) => r.status !== "cancelled").length };
}
