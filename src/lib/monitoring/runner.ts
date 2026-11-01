import { desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { detectControlDrift, detectFairnessDrift, summariseFindings, type DriftFinding } from "./drift";

export async function runMonitoringCheck(scheduleId: string) {
  await ensureDb();
  const schedules = await db
    .select()
    .from(schema.monitoringSchedules)
    .where(eq(schema.monitoringSchedules.id, scheduleId))
    .limit(1);
  const schedule = schedules[0];
  if (!schedule) throw new Error("Schedule not found");

  const assessments = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.systemId, schedule.systemId))
    .orderBy(desc(schema.assessments.updatedAt));

  const findings: DriftFinding[] = [];
  let controlBaseline: Array<{ code: string; status: string }> = [];
  let controlCurrent: Array<{ code: string; status: string }> = [];

  if (assessments.length >= 1) {
    const latest = assessments[0];
    const latestControls = await db
      .select({ code: schema.controls.code, status: schema.assessmentControls.status })
      .from(schema.assessmentControls)
      .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
      .where(eq(schema.assessmentControls.assessmentId, latest.id));
    controlCurrent = latestControls;

    if (assessments.length >= 2) {
      const prior = assessments[1];
      controlBaseline = await db
        .select({ code: schema.controls.code, status: schema.assessmentControls.status })
        .from(schema.assessmentControls)
        .innerJoin(schema.controls, eq(schema.assessmentControls.controlId, schema.controls.id))
        .where(eq(schema.assessmentControls.assessmentId, prior.id));
      findings.push(...detectControlDrift(controlBaseline, controlCurrent));
    } else {
      // Compare implemented vs non-implemented within latest as a soft check
      const weak = controlCurrent.filter((c) => c.status === "gap" || c.status === "not_started");
      if (weak.length > 0) {
        findings.push({
          kind: "control_regression",
          severity: "low",
          message: `${weak.length} control(s) still not started or marked as gap.`,
        });
      }
    }
  }

  const fairnessRuns = await db
    .select()
    .from(schema.fairnessRuns)
    .where(eq(schema.fairnessRuns.systemId, schedule.systemId))
    .orderBy(desc(schema.fairnessRuns.createdAt));

  if (fairnessRuns.length >= 2) {
    const parseMetrics = (raw: string): Record<string, number> => {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const out: Record<string, number> = {};
          for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            if (typeof v === "number") out[k] = v;
          }
          return out;
        }
        if (Array.isArray(parsed)) {
          const out: Record<string, number> = {};
          for (const row of parsed) {
            if (row && typeof row === "object" && "metric" in row && "value" in row) {
              const m = row as { metric: string; value: number };
              if (typeof m.value === "number") out[m.metric] = m.value;
            }
          }
          return out;
        }
      } catch {
        return {};
      }
      return {};
    };
    findings.push(
      ...detectFairnessDrift(parseMetrics(fairnessRuns[1].metricsJson), parseMetrics(fairnessRuns[0].metricsJson)),
    );
  }

  const status = summariseFindings(findings);
  const runId = id();
  const now = new Date();
  await db.insert(schema.monitoringRuns).values({
    id: runId,
    scheduleId: schedule.id,
    orgId: schedule.orgId,
    systemId: schedule.systemId,
    status,
    summaryJson: JSON.stringify({ findings, controlCount: controlCurrent.length }),
  });

  for (const f of findings) {
    if (f.severity === "low" && f.kind === "missing_baseline") continue;
    await db.insert(schema.monitoringAlerts).values({
      id: id(),
      orgId: schedule.orgId,
      systemId: schedule.systemId,
      runId,
      severity: f.severity,
      kind: f.kind,
      message: f.message,
    });
  }

  const next = new Date(now.getTime() + schedule.cadenceHours * 60 * 60 * 1000);
  await db
    .update(schema.monitoringSchedules)
    .set({ lastRunAt: now, nextRunAt: next })
    .where(eq(schema.monitoringSchedules.id, schedule.id));

  return { runId, status, findings, nextRunAt: next };
}

export async function dueSchedules(now = new Date()) {
  await ensureDb();
  const all = await db.select().from(schema.monitoringSchedules).where(eq(schema.monitoringSchedules.enabled, true));
  return all.filter((s) => !s.nextRunAt || new Date(s.nextRunAt).getTime() <= now.getTime());
}
