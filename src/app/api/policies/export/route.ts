import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { db, ensureDb, schema } from "@/lib/db";
import { markdownToDocx } from "@/lib/export/docx";
import { markdownToPdf } from "@/lib/export/policy-pdf";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const docId = sp.get("id");
  const format = (sp.get("format") || "pdf").toLowerCase();
  if (!docId) return NextResponse.json({ error: "id required" }, { status: 400 });
  await ensureDb();
  const rows = await db
    .select()
    .from(schema.policyDocuments)
    .where(and(eq(schema.policyDocuments.id, docId), eq(schema.policyDocuments.orgId, session.orgId)))
    .limit(1);
  const doc = rows[0];
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (format === "docx") {
    const bytes = await markdownToDocx(doc.title, doc.bodyMarkdown);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${doc.title.replace(/[^\w.-]+/g, "_")}.docx"`,
      },
    });
  }
  const bytes = await markdownToPdf(doc.title, doc.bodyMarkdown);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${doc.title.replace(/[^\w.-]+/g, "_")}.pdf"`,
    },
  });
}
