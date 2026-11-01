import { and, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { ONBOARDING_STEPS } from "./steps";

export type ChecklistItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  done: boolean;
};

export async function getOrgChecklist(orgId: string): Promise<ChecklistItem[]> {
  await ensureDb();
  const rows = await db.select().from(schema.orgOnboarding).where(eq(schema.orgOnboarding.orgId, orgId));
  const byStep = new Map(rows.map((r) => [r.stepId, r]));
  return ONBOARDING_STEPS.map((s) => ({
    id: s.id,
    title: s.title,
    body: s.body,
    href: s.href,
    done: Boolean(byStep.get(s.id)?.done),
  }));
}

export async function setChecklistStep(orgId: string, stepId: string, done: boolean) {
  await ensureDb();
  if (!ONBOARDING_STEPS.some((s) => s.id === stepId)) return null;
  const existing = await db
    .select()
    .from(schema.orgOnboarding)
    .where(and(eq(schema.orgOnboarding.orgId, orgId), eq(schema.orgOnboarding.stepId, stepId)))
    .limit(1);
  const now = new Date();
  if (existing[0]) {
    await db
      .update(schema.orgOnboarding)
      .set({ done, doneAt: done ? now : null, updatedAt: now })
      .where(eq(schema.orgOnboarding.id, existing[0].id));
  } else {
    await db.insert(schema.orgOnboarding).values({
      id: id(),
      orgId,
      stepId,
      done,
      doneAt: done ? now : null,
      updatedAt: now,
    });
  }
  return getOrgChecklist(orgId);
}
