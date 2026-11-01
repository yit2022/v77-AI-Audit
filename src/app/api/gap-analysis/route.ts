import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { isReadOnly } from "@/lib/auth/rbac";
import { runGapAnalysis } from "@/lib/gap-analysis/run";
import { db, ensureDb, schema } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.gapAnalyses)
    .where(eq(schema.gapAnalyses.orgId, session.orgId))
    .orderBy(desc(schema.gapAnalyses.createdAt))
    .limit(20);
  return NextResponse.json({ analyses: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as {
    systemId?: string;
    assessmentId?: string;
    provider?: string;
  };
  if (!body.systemId) return NextResponse.json({ error: "systemId required" }, { status: 400 });
  try {
    const result = await runGapAnalysis({
      orgId: session.orgId,
      userId: session.userId,
      systemId: body.systemId,
      assessmentId: body.assessmentId,
      preferProvider: body.provider || "workers_ai",
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
