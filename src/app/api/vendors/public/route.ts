import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { VENDOR_QUESTIONS, scoreAnswers } from "@/lib/vendors/questions";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  await ensureDb();
  const rows = await db.select().from(schema.vendorQuestionnaires).where(eq(schema.vendorQuestionnaires.token, token)).limit(1);
  const q = rows[0];
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    vendorName: q.vendorName,
    status: q.status,
    questions: VENDOR_QUESTIONS,
    answers: q.status === "submitted" ? JSON.parse(q.answersJson || "{}") : {},
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { token?: string; answers?: Record<string, string> };
  if (!body.token || !body.answers) return NextResponse.json({ error: "token and answers required" }, { status: 400 });
  await ensureDb();
  const rows = await db.select().from(schema.vendorQuestionnaires).where(eq(schema.vendorQuestionnaires.token, body.token)).limit(1);
  const q = rows[0];
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (q.status === "submitted") return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  const scored = scoreAnswers(body.answers);
  await db
    .update(schema.vendorQuestionnaires)
    .set({
      answersJson: JSON.stringify(body.answers),
      riskScore: scored.label,
      status: "submitted",
      submittedAt: new Date(),
    })
    .where(eq(schema.vendorQuestionnaires.id, q.id));
  return NextResponse.json({ ok: true, riskScore: scored.label });
}
