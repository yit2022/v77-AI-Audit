import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";

const commentSchema = z.object({ assessmentId: z.string().uuid(), body: z.string().min(1) });
const signoffSchema = z.object({
  assessmentId: z.string().uuid(),
  opinion: z.enum(["pass", "pass_with_findings", "fail"]),
  summary: z.string().default(""),
});

export async function GET(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const assessmentId = new URL(req.url).searchParams.get("assessmentId");
  if (!assessmentId) return NextResponse.json({ error: "assessmentId required" }, { status: 400 });
  await ensureDb();
  const comments = await db.select({
    id: schema.auditorComments.id, body: schema.auditorComments.body,
    createdAt: schema.auditorComments.createdAt, authorName: schema.users.name,
  }).from(schema.auditorComments)
    .innerJoin(schema.users, eq(schema.auditorComments.authorUserId, schema.users.id))
    .where(eq(schema.auditorComments.assessmentId, assessmentId))
    .orderBy(desc(schema.auditorComments.createdAt));
  const signoffs = await db.select().from(schema.auditorSignoffs).where(eq(schema.auditorSignoffs.assessmentId, assessmentId)).limit(1);
  return NextResponse.json({ comments, signoff: signoffs[0] ?? null });
}

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  await ensureDb();
  if (json?.action === "signoff") {
    if (session.role !== "auditor" && session.role !== "admin") {
      return NextResponse.json({ error: "Only auditors can sign off" }, { status: 403 });
    }
    const parsed = signoffSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    const existing = await db.select().from(schema.auditorSignoffs).where(eq(schema.auditorSignoffs.assessmentId, parsed.data.assessmentId)).limit(1);
    if (existing[0]) {
      await db.update(schema.auditorSignoffs).set({
        opinion: parsed.data.opinion, summary: parsed.data.summary,
        auditorUserId: session.userId, signedAt: new Date(),
      }).where(eq(schema.auditorSignoffs.id, existing[0].id));
    } else {
      await db.insert(schema.auditorSignoffs).values({
        id: id(), assessmentId: parsed.data.assessmentId, auditorUserId: session.userId,
        opinion: parsed.data.opinion, summary: parsed.data.summary,
      });
    }
    await db.update(schema.assessments).set({ status: "signed_off", updatedAt: new Date() }).where(eq(schema.assessments.id, parsed.data.assessmentId));
    return NextResponse.json({ ok: true });
  }
  const parsed = commentSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await db.insert(schema.auditorComments).values({
    id: id(), orgId: session.orgId, assessmentId: parsed.data.assessmentId,
    authorUserId: session.userId, body: parsed.data.body,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
