import { NextResponse } from "next/server";
import { db, ensureDb, schema } from "@/lib/db";
import { authenticateApiKey } from "@/lib/auth/api-key";
import { seedIfEmpty } from "@/lib/db/seed";

export async function GET(req: Request) {
  await seedIfEmpty();
  const a = await authenticateApiKey(req.headers.get("authorization"));
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const controls = await db.select().from(schema.controls);
  return NextResponse.json({ controls, orgId: a.orgId });
}
