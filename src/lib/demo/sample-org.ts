import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import bcrypt from "bcryptjs";

export const DEMO_ORG_SLUG = "v77-buyer-demo";
export const DEMO_USER_EMAIL = "demo@v77trust.com";

/** Idempotent buyer-demo organisation with sample inventory for guided tours. */
export async function ensureBuyerDemoOrg(): Promise<{ orgId: string; userId: string; created: boolean }> {
  await ensureDb();
  const existing = await db.select().from(schema.organisations).where(eq(schema.organisations.slug, DEMO_ORG_SLUG)).limit(1);
  if (existing[0]) {
    const mem = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.orgId, existing[0].id))
      .limit(1);
    return { orgId: existing[0].id, userId: mem[0]?.userId || "", created: false };
  }

  const orgId = id();
  const userId = id();
  const passwordHash = await bcrypt.hash("DemoTour2026!", 10);
  await db.insert(schema.organisations).values({
    id: orgId,
    name: "V77 Buyer Demo Co.",
    slug: DEMO_ORG_SLUG,
    planTier: "pilot",
    seatLimit: 5,
  });
  await db.insert(schema.users).values({
    id: userId,
    email: DEMO_USER_EMAIL,
    name: "Demo Buyer",
    passwordHash,
  });
  await db.insert(schema.memberships).values({
    id: id(),
    orgId,
    userId,
    role: "admin",
  });

  await db.insert(schema.aiSystems).values({
    id: id(),
    orgId,
    name: "Customer Support Copilot",
    description: "Sample high-risk conversational assistant for buyer demos.",
    intendedPurpose: "Assist support agents with draft replies",
    riskTier: "high",
    lifecycleStatus: "in_use",
    ownerUserId: userId,
  });

  try {
    await db.insert(schema.orgOnboarding).values({
      id: id(),
      orgId,
      stepId: "inventory",
      done: true,
      doneAt: new Date(),
    });
  } catch {
    /* optional */
  }

  return { orgId, userId, created: true };
}
