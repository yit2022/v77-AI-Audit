import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { isReadOnly } from "@/lib/auth/rbac";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { POLICY_TEMPLATES, renderTemplate } from "@/lib/policies/templates";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDb();
  const docs = await db
    .select()
    .from(schema.policyDocuments)
    .where(eq(schema.policyDocuments.orgId, session.orgId))
    .orderBy(desc(schema.policyDocuments.updatedAt));
  return NextResponse.json({ templates: POLICY_TEMPLATES.map(({ id, title, category }) => ({ id, title, category })), docs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isReadOnly(session.role)) return NextResponse.json({ error: "Auditors are read-only" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { templateId?: string; title?: string; bodyMarkdown?: string; id?: string };
  await ensureDb();
  if (body.id) {
    await db
      .update(schema.policyDocuments)
      .set({
        title: body.title || "Policy",
        bodyMarkdown: body.bodyMarkdown || "",
        updatedBy: session.userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.policyDocuments.id, body.id));
    return NextResponse.json({ id: body.id });
  }
  const tpl = POLICY_TEMPLATES.find((t) => t.id === body.templateId) || POLICY_TEMPLATES[0];
  const rowId = id();
  await db.insert(schema.policyDocuments).values({
    id: rowId,
    orgId: session.orgId,
    templateId: tpl.id,
    title: body.title || tpl.title,
    bodyMarkdown: body.bodyMarkdown || renderTemplate(tpl.body, session.orgName),
    updatedBy: session.userId,
  });
  return NextResponse.json({ id: rowId });
}
