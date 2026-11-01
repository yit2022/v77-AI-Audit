import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { parsePredictionsCsv, computeFairness } from "@/lib/fairness";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET() {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const runs = await db.select().from(schema.fairnessRuns).where(eq(schema.fairnessRuns.orgId, session.orgId)).orderBy(desc(schema.fairnessRuns.createdAt));
  return NextResponse.json({ runs: runs.map((r) => ({ ...r, metrics: JSON.parse(r.metricsJson) })) });
}

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  const systemId = String(form.get("systemId") || "");
  const sensitiveColumn = String(form.get("sensitiveColumn") || "group");
  if (!(file instanceof File) || !systemId) return NextResponse.json({ error: "file and systemId required" }, { status: 400 });
  try {
    const rows = parsePredictionsCsv(await file.text(), sensitiveColumn);
    const metrics = computeFairness(rows);
    await ensureDb();
    const runId = id();
    await db.insert(schema.fairnessRuns).values({
      id: runId, orgId: session.orgId, systemId, filename: file.name,
      metricsJson: JSON.stringify(metrics), createdBy: session.userId,
    });
    return NextResponse.json({ id: runId, metrics }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fairness computation failed" }, { status: 400 });
  }
}
