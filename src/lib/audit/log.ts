import { createHash } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";

export type AuditEntryInput = {
  orgId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  detail?: Record<string, unknown>;
};

export function hashAuditEntry(payload: {
  prevSha256: string;
  orgId: string;
  action: string;
  entityType: string;
  entityId: string;
  detailJson: string;
  createdAtIso: string;
}): string {
  return createHash("sha256")
    .update(
      [
        payload.prevSha256 || "GENESIS",
        payload.orgId,
        payload.action,
        payload.entityType,
        payload.entityId,
        payload.detailJson,
        payload.createdAtIso,
      ].join("|"),
    )
    .digest("hex");
}

export function verifyAuditChain(
  entries: Array<{ sha256: string; prevSha256: string }>,
): { ok: boolean; brokenAt?: number } {
  let expectedPrev = "";
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if ((e.prevSha256 || "") !== expectedPrev) return { ok: false, brokenAt: i };
    expectedPrev = e.sha256;
  }
  return { ok: true };
}

/** Append-only audit log with hash chaining. Never updates or deletes prior rows. */
export async function appendAuditLog(input: AuditEntryInput): Promise<{ id: string; sha256: string }> {
  await ensureDb();
  const latest = await db
    .select({ sha256: schema.auditLog.sha256 })
    .from(schema.auditLog)
    .where(eq(schema.auditLog.orgId, input.orgId))
    .orderBy(desc(schema.auditLog.createdAt))
    .limit(1);
  const prevSha256 = latest[0]?.sha256 ?? "";
  const entryId = id();
  const createdAt = new Date();
  const detailJson = JSON.stringify(input.detail ?? {});
  const sha256 = hashAuditEntry({
    prevSha256,
    orgId: input.orgId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? "",
    detailJson,
    createdAtIso: createdAt.toISOString(),
  });
  await db.insert(schema.auditLog).values({
    id: entryId,
    orgId: input.orgId,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? "",
    detailJson,
    prevSha256,
    sha256,
    createdAt,
  });
  return { id: entryId, sha256 };
}
