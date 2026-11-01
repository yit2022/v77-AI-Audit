import { NextResponse } from "next/server";
import { z } from "zod";
import { createPilotLead, listPilotLeads, updatePilotLead, LEAD_STATUSES } from "@/lib/leads";
import { rateLimit } from "@/lib/security/rate-limit";
import { ensureDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  company: z.string().max(200).optional(),
  roleTitle: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(64).optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().max(5000).optional(),
});

export async function POST(req: Request) {
  await ensureDb();
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
  const limited = rateLimit({ key: `lead:${ip}`, limit: 8, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const lead = await createPilotLead(parsed.data);
  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}

export async function GET() {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const leads = await listPilotLeads(200);
  return NextResponse.json({ leads });
}

export async function PATCH(req: Request) {
  await ensureDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  if (!parsed.data.status && parsed.data.notes === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  const lead = await updatePilotLead(parsed.data.id, {
    status: parsed.data.status,
    notes: parsed.data.notes,
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}
