import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { loadEvidenceBlob } from "@/lib/storage/evidence";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.evidenceItems)
    .where(and(eq(schema.evidenceItems.id, id), eq(schema.evidenceItems.orgId, session.orgId)))
    .limit(1);
  const item = rows[0];
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const blob = await loadEvidenceBlob(item.storagePath);
  if (!blob) return NextResponse.json({ error: "Blob missing" }, { status: 404 });
  return new NextResponse(new Uint8Array(blob.buffer), {
    status: 200,
    headers: {
      "Content-Type": item.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${item.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
