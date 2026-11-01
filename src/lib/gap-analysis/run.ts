import { and, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { getProvider, realProvidersEnabled } from "@/lib/providers";
import { appendAuditLog } from "@/lib/audit/log";

export type GapItem = {
  controlCode: string;
  title: string;
  status: string;
  severity: "high" | "medium" | "low";
  recommendation: string;
  frameworks: string;
};

function mockGaps(rows: Array<{ code: string; title: string; status: string; euRef: string; nistRef: string; isoRef: string }>): {
  summary: string;
  gaps: GapItem[];
} {
  const open = rows.filter((r) => r.status !== "implemented" && r.status !== "not_applicable");
  const gaps: GapItem[] = open.slice(0, 12).map((r) => ({
    controlCode: r.code,
    title: r.title,
    status: r.status,
    severity: r.status === "not_started" ? "high" : "medium",
    recommendation: `Prioritise evidence and implementation for ${r.code}. Align owners and due dates before the next reassessment.`,
    frameworks: [r.euRef, r.nistRef, r.isoRef].filter(Boolean).join(" · "),
  }));
  const summary =
    gaps.length === 0
      ? "No material control gaps detected in the latest assessment snapshot (mock analysis)."
      : `Mock gap analysis found ${gaps.length} control(s) needing attention. Enable Workers AI (V77_ENABLE_REAL_PROVIDERS) for richer mapping narrative.`;
  return { summary, gaps };
}

export async function runGapAnalysis(opts: {
  orgId: string;
  userId: string;
  systemId: string;
  assessmentId?: string | null;
  preferProvider?: string;
}): Promise<{ id: string; summary: string; gaps: GapItem[]; provider: string }> {
  await ensureDb();
  let assessmentId = opts.assessmentId || null;
  if (!assessmentId) {
    const latest = await db
      .select()
      .from(schema.assessments)
      .where(and(eq(schema.assessments.orgId, opts.orgId), eq(schema.assessments.systemId, opts.systemId)))
      .limit(1);
    assessmentId = latest[0]?.id ?? null;
  }

  let controlRows: Array<{ code: string; title: string; status: string; euRef: string; nistRef: string; isoRef: string }> = [];
  if (assessmentId) {
    const joined = await db
      .select({
        code: schema.controls.code,
        title: schema.controls.title,
        status: schema.assessmentControls.status,
        euRef: schema.controls.euRef,
        nistRef: schema.controls.nistRef,
        isoRef: schema.controls.isoRef,
      })
      .from(schema.assessmentControls)
      .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
      .where(eq(schema.assessmentControls.assessmentId, assessmentId));
    controlRows = joined;
  }

  const providerId = realProvidersEnabled() && opts.preferProvider === "workers_ai" ? "workers_ai" : "mock";
  let summary = "";
  let gaps: GapItem[] = [];
  let usedProvider = providerId;

  if (providerId === "workers_ai") {
    try {
      const provider = getProvider("workers_ai");
      const prompt = [
        "You are an EU AI Act / NIST AI RMF control gap analyst for V77 Trust.",
        "Return ONLY valid JSON: {\"summary\": string, \"gaps\": [{\"controlCode\",\"title\",\"status\",\"severity\":\"high|medium|low\",\"recommendation\",\"frameworks\"}]}",
        "Controls:",
        JSON.stringify(controlRows.slice(0, 40)),
      ].join("\n");
      const raw = await provider.complete([
        { role: "system", content: "Output JSON only. No markdown fences." },
        { role: "user", content: prompt },
      ]);
      const parsed = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim()) as {
        summary?: string;
        gaps?: GapItem[];
      };
      summary = parsed.summary || "AI gap analysis completed.";
      gaps = Array.isArray(parsed.gaps) ? parsed.gaps : [];
    } catch {
      usedProvider = "mock";
      const m = mockGaps(controlRows);
      summary = m.summary + " (Workers AI unavailable — mock fallback.)";
      gaps = m.gaps;
    }
  } else {
    const m = mockGaps(controlRows);
    summary = m.summary;
    gaps = m.gaps;
  }

  const rowId = id();
  await db.insert(schema.gapAnalyses).values({
    id: rowId,
    orgId: opts.orgId,
    systemId: opts.systemId,
    assessmentId,
    provider: usedProvider,
    summary,
    gapsJson: JSON.stringify(gaps),
    createdBy: opts.userId,
  });
  await appendAuditLog({
    orgId: opts.orgId,
    actorUserId: opts.userId,
    action: "gap_analysis.created",
    entityType: "gap_analysis",
    entityId: rowId,
    detail: { provider: usedProvider, gapCount: gaps.length },
  });
  return { id: rowId, summary, gaps, provider: usedProvider };
}
