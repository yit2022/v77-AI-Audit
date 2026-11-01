import { NextResponse } from "next/server";
import { ensureDb, db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Uptime / load-balancer health. No auth. Does not leak secrets. */
export async function GET() {
  const started = Date.now();
  let dbOk = false;
  try {
    await ensureDb();
    await db.select({ n: sql<number>`1` }).from(schema.organisations).limit(1);
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const body = {
    ok: dbOk,
    service: "v77-trust",
    operator: "Vertex77 sp. z o.o.",
    checks: { database: dbOk ? "up" : "down" },
    latencyMs: Date.now() - started,
    ts: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
