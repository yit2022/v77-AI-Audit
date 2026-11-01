import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { authenticateApiKey } from "@/lib/auth/api-key";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET(req: Request) {
  await seedIfEmpty();
  const a = await authenticateApiKey(req.headers.get("authorization"));
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const findings = await db.select().from(schema.findings).where(eq(schema.findings.orgId, a.orgId));
  return NextResponse.json({ findings });
}
