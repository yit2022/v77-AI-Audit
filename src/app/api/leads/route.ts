import { NextResponse } from "next/server";
import { z } from "zod";
import { createPilotLead } from "@/lib/leads";
import { rateLimit } from "@/lib/security/rate-limit";
import { ensureDb } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  company: z.string().max(200).optional(),
  roleTitle: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  await ensureDb();
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
  const limited = rateLimit({ key: `lead:${ip}`, limit: 8, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const lead = await createPilotLead(parsed.data);
  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
