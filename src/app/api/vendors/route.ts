import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth/session";
import { isReadOnly } from "@/lib/auth/rbac";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { getAppOrigin } from "@/lib/site";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.vendorQuestionnaires)
    .where(eq(schema.vendorQuestionnaires.orgId, session.orgId))
    .orderBy(desc(schema.vendorQuestionnaires.createdAt));
  const origin = getAppOrigin();
  return NextResponse.json({
    questionnaires: rows.map((r) => ({
      ...r,
      shareUrl: `${origin}/vendor/${r.token}`,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { vendorName?: string };
  if (!body.vendorName?.trim()) return NextResponse.json({ error: "vendorName required" }, { status: 400 });
  await ensureDb();
  const token = randomBytes(18).toString("base64url");
  const rowId = id();
  await db.insert(schema.vendorQuestionnaires).values({
    id: rowId,
    orgId: session.orgId,
    vendorName: body.vendorName.trim(),
    token,
    createdBy: session.userId,
  });
  return NextResponse.json({ id: rowId, token, shareUrl: `${getAppOrigin()}/vendor/${token}` });
}
