import { NextResponse } from "next/server";
import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET() {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const items = await db.select().from(schema.evidenceItems).where(eq(schema.evidenceItems.orgId, session.orgId)).orderBy(desc(schema.evidenceItems.createdAt));
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") || "Evidence");
  const systemId = form.get("systemId") ? String(form.get("systemId")) : null;
  const controlId = form.get("controlId") ? String(form.get("controlId")) : null;
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const evidenceId = id();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dir = path.join(process.cwd(), "uploads", "evidence", session.orgId);
  await fs.mkdir(dir, { recursive: true });
  const storagePath = path.join(dir, `${evidenceId}-${safeName}`);
  await fs.writeFile(storagePath, buffer);
  await ensureDb();
  await db.insert(schema.evidenceItems).values({
    id: evidenceId, orgId: session.orgId, systemId, controlId, title,
    filename: file.name, storagePath, contentType: file.type || "application/octet-stream",
    sha256, uploadedBy: session.userId,
  });
  return NextResponse.json({ id: evidenceId, sha256 }, { status: 201 });
}
