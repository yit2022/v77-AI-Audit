import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { runRedTeamSuite } from "@/lib/redteam/runner";
import { id } from "@/lib/ids";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET() {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const runs = await db.select().from(schema.redteamRuns).where(eq(schema.redteamRuns.orgId, session.orgId)).orderBy(desc(schema.redteamRuns.createdAt));
  return NextResponse.json({ runs: runs.map((r) => ({ ...r, results: JSON.parse(r.resultsJson) })) });
}

const bodySchema = z.object({ systemId: z.string().uuid(), provider: z.string().default("mock") });

export async function POST(req: Request) {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  try {
    const suite = await runRedTeamSuite(parsed.data.provider);
    await ensureDb();
    const runId = id();
    await db.insert(schema.redteamRuns).values({
      id: runId, orgId: session.orgId, systemId: parsed.data.systemId, provider: suite.providerId,
      resultsJson: JSON.stringify(suite.results), passCount: suite.passCount, failCount: suite.failCount,
      createdBy: session.userId,
    });
    return NextResponse.json({ id: runId, ...suite }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Red-team run failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
