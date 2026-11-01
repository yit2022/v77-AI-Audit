import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    message?: string;
    stack?: string;
    url?: string;
  };
  const message = String(body.message || "").slice(0, 2000);
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
  const session = await getSession().catch(() => null);
  await ensureDb();
  await db.insert(schema.clientErrorEvents).values({
    id: id(),
    orgId: session?.orgId ?? null,
    message,
    stack: String(body.stack || "").slice(0, 8000),
    url: String(body.url || "").slice(0, 2000),
    userAgent: req.headers.get("user-agent")?.slice(0, 500) || "",
  });
  return NextResponse.json({ ok: true });
}
