import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";
import { hashEvidenceContent } from "@/lib/evidence/chain";
import { storeEvidenceBlob } from "@/lib/storage/evidence";
import { appendAuditLog } from "@/lib/audit/log";
import { assertOrgWritable } from "@/lib/billing/trial";
import { assertUnderLimit } from "@/lib/billing/limits";

export async function GET(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const controlId = new URL(req.url).searchParams.get("controlId");
  const items = controlId
    ? await db
        .select()
        .from(schema.evidenceItems)
        .where(and(eq(schema.evidenceItems.orgId, session.orgId), eq(schema.evidenceItems.controlId, controlId)))
        .orderBy(desc(schema.evidenceItems.createdAt))
    : await db
        .select()
        .from(schema.evidenceItems)
        .where(eq(schema.evidenceItems.orgId, session.orgId))
        .orderBy(desc(schema.evidenceItems.createdAt));
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await assertOrgWritable(session.orgId);
    await assertUnderLimit(session.orgId, "storageBytes");
  } catch (e) {
    const err = e as { status?: number; code?: string; message?: string; kind?: string; used?: number; limit?: number };
    return NextResponse.json(
      { error: err.message || "Forbidden", code: err.code, kind: err.kind, used: err.used, limit: err.limit, upgrade: true },
      { status: err.status || 402 },
    );
  }
  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") || "Evidence");
  const systemId = form.get("systemId") ? String(form.get("systemId")) : null;
  const controlId = form.get("controlId") ? String(form.get("controlId")) : null;
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = hashEvidenceContent(buffer);
  const evidenceId = id();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = await storeEvidenceBlob({
    orgId: session.orgId,
    evidenceId,
    safeName,
    buffer,
    contentType: file.type || "application/octet-stream",
  });
  await ensureDb();
  const latest = await db
    .select()
    .from(schema.evidenceItems)
    .where(eq(schema.evidenceItems.orgId, session.orgId))
    .orderBy(desc(schema.evidenceItems.createdAt))
    .limit(1);
  const prevSha256 = latest[0]?.sha256 ?? "";
  await db.insert(schema.evidenceItems).values({
    id: evidenceId,
    orgId: session.orgId,
    systemId,
    controlId,
    title,
    filename: file.name,
    storagePath,
    contentType: file.type || "application/octet-stream",
    sha256,
    prevSha256,
    uploadedBy: session.userId,
  });
  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "evidence.upload",
    entityType: "evidence",
    entityId: evidenceId,
    detail: { controlId, systemId, title, filename: file.name },
  });
  return NextResponse.json({ id: evidenceId, sha256, prevSha256 }, { status: 201 });
}
