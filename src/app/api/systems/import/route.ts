import { NextResponse } from "next/server";
import { db, ensureDb, schema } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { id } from "@/lib/ids";
import { parseInventoryCsv } from "@/lib/registry/csv-import";
import { appendAuditLog } from "@/lib/audit/log";

export async function POST(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "auditor") {
    return NextResponse.json({ error: "Auditors cannot import inventory" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";
  let text = "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });
    text = await file.text();
  } else {
    text = await req.text();
  }
  if (!text.trim()) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

  const { rows, errors } = parseInventoryCsv(text);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows", details: errors }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: "Limit is 500 rows per import" }, { status: 400 });
  }

  const created: string[] = [];
  for (const row of rows) {
    const systemId = id();
    await db.insert(schema.aiSystems).values({
      id: systemId,
      orgId: session.orgId,
      name: row.name,
      description: row.description ?? "",
      intendedPurpose: row.intendedPurpose ?? "",
      roleInValueChain: row.roleInValueChain ?? "provider",
      domain: row.domain ?? "general",
      ownerUserId: session.userId,
      lifecycleStatus: row.lifecycleStatus ?? "discovered",
      versionLabel: row.versionLabel ?? "",
      vendorName: row.vendorName ?? "",
      euDatabaseId: row.euDatabaseId ?? "",
      riskTier: row.riskTier ?? null,
      gpai: row.gpai ?? false,
    });
    created.push(systemId);
  }

  await appendAuditLog({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "systems.import_csv",
    entityType: "ai_system",
    entityId: session.orgId,
    detail: { count: created.length, errors },
  });

  return NextResponse.json({ ok: true, imported: created.length, ids: created, warnings: errors }, { status: 201 });
}
