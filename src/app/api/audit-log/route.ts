import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { seedIfEmpty } from "@/lib/db/seed";
import { verifyAuditChain } from "@/lib/audit/log";

export async function GET() {
  await seedIfEmpty();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const entries = await db
    .select()
    .from(schema.auditLog)
    .where(eq(schema.auditLog.orgId, session.orgId))
    .orderBy(asc(schema.auditLog.createdAt));
  const chain = verifyAuditChain(entries.map((e) => ({ sha256: e.sha256, prevSha256: e.prevSha256 })));
  return NextResponse.json({ entries, chain });
}
