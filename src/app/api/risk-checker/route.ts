import { NextResponse } from "next/server";
import { z } from "zod";
import { createPilotLead } from "@/lib/leads";
import { rateLimit } from "@/lib/security/rate-limit";
import { ensureDb } from "@/lib/db";
import { isAnswer, runPublicRiskCheck, PUBLIC_RISK_QUESTION_IDS } from "@/lib/risk-checker/public";
import type { ClassificationInput } from "@/lib/classification";

const schemaBody = z.object({
  answers: z.record(z.string()),
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(200).optional(),
  company: z.string().max(200).optional(),
  saveLead: z.boolean().optional(),
});

export async function POST(req: Request) {
  await ensureDb();
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
  const limited = rateLimit({ key: `risk:${ip}`, limit: 30, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = schemaBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const answers: ClassificationInput = {};
  for (const id of PUBLIC_RISK_QUESTION_IDS) {
    const v = parsed.data.answers[id];
    if (isAnswer(v)) answers[id] = v;
  }
  const result = runPublicRiskCheck(answers);

  let leadId: string | undefined;
  if (parsed.data.saveLead && parsed.data.email && parsed.data.name) {
    const leadLimit = rateLimit({ key: `lead:${ip}`, limit: 8, windowMs: 60 * 60 * 1000 });
    if (!leadLimit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    const lead = await createPilotLead({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      message: `Risk checker result: ${result.label} (${result.tier}). ${result.summary}`,
      source: "risk_checker",
      roleTitle: "",
    });
    leadId = lead.id;
  }

  return NextResponse.json({ result, leadId });
}
