import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "./index";
import { CONTROL_SEEDS } from "@/lib/crosswalk";
import { id } from "@/lib/ids";

const DEMO_PASSWORD = "demo1234";

let seeding: Promise<{ seeded: boolean; accounts?: unknown }> | null = null;

async function seedOnce() {
  await ensureDb();
  const existing = await db.select().from(schema.organisations).limit(1);
  if (existing.length > 0) {
    const ctrl = await db.select().from(schema.controls).limit(1);
    if (ctrl.length === 0) {
      await db.insert(schema.controls).values(
        CONTROL_SEEDS.map((c) => ({
          id: c.id, code: c.code, title: c.title, description: c.description,
          area: c.area, euRef: c.euRef, nistRef: c.nistRef, isoRef: c.isoRef, gdprRef: c.gdprRef, appliesTo: c.appliesTo,
        })),
      );
    }
    return { seeded: false };
  }

  try {
    const orgId = id();
    const adminId = id();
    const ownerId = id();
    const auditorId = id();
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

    await db.insert(schema.organisations).values({ id: orgId, name: "Tamalaki Business Network Ltd", slug: "tamalaki" });
    await db.insert(schema.users).values([
      { id: adminId, email: "admin@v77.local", name: "Isaac Muthui", passwordHash: hash },
      { id: ownerId, email: "owner@v77.local", name: "Amina Okello", passwordHash: hash },
      { id: auditorId, email: "auditor@v77.local", name: "Elena Rossi", passwordHash: hash },
    ]);
    await db.insert(schema.memberships).values([
      { id: id(), orgId, userId: adminId, role: "admin" },
      { id: id(), orgId, userId: ownerId, role: "ai_owner" },
      { id: id(), orgId, userId: auditorId, role: "auditor" },
    ]);
    await db.insert(schema.controls).values(
      CONTROL_SEEDS.map((c) => ({
        id: c.id, code: c.code, title: c.title, description: c.description,
        area: c.area, euRef: c.euRef, nistRef: c.nistRef, isoRef: c.isoRef, gdprRef: c.gdprRef, appliesTo: c.appliesTo,
      })),
    );

    const systemHigh = id();
    const systemLimited = id();
    await db.insert(schema.aiSystems).values([
      {
        id: systemHigh, orgId, name: "HireSense Ranking",
        description: "ML model that ranks job applicants from CV embeddings.",
        intendedPurpose: "Support recruiters in shortlisting candidates.",
        roleInValueChain: "provider", domain: "employment", ownerUserId: ownerId,
        riskTier: "high_risk", classificationNotes: "Annex III employment use case.", gpai: false,
      },
      {
        id: systemLimited, orgId, name: "SupportPilot Chat",
        description: "Customer-support LLM assistant with tool use.",
        intendedPurpose: "Answer product questions and draft replies.",
        roleInValueChain: "deployer", domain: "customer_support", ownerUserId: ownerId,
        riskTier: "limited", classificationNotes: "Art. 50 interaction transparency.", gpai: true,
      },
    ]);

    const assessmentId = id();
    await db.insert(schema.assessments).values({
      id: assessmentId, orgId, systemId: systemHigh, name: "HireSense — Q4 readiness", status: "in_review",
    });
    const highControls = CONTROL_SEEDS.filter((c) => c.appliesTo.split(",").includes("high_risk"));
    await db.insert(schema.assessmentControls).values(
      highControls.map((c, i) => ({
        id: id(), assessmentId, controlId: c.id,
        status: i < 3 ? "implemented" : i < 6 ? "in_progress" : "not_started",
        ownerUserId: ownerId, notes: i < 3 ? "Seeded as implemented for demo." : "",
      })),
    );
    await db.insert(schema.auditorComments).values({
      id: id(), orgId, assessmentId, authorUserId: auditorId,
      body: "Please attach bias-test evidence for HireSense before sign-off.",
    });

    return {
      seeded: true,
      accounts: [
        { email: "admin@v77.local", role: "admin", password: DEMO_PASSWORD },
        { email: "owner@v77.local", role: "ai_owner", password: DEMO_PASSWORD },
        { email: "auditor@v77.local", role: "auditor", password: DEMO_PASSWORD },
      ],
    };
  } catch (e) {
    // Another worker likely won the race
    const again = await db.select().from(schema.organisations).limit(1);
    if (again.length > 0) return { seeded: false };
    throw e;
  }
}

export async function seedIfEmpty() {
  if (!seeding) seeding = seedOnce().finally(() => { /* keep resolved promise */ });
  return seeding;
}

export async function findUserByEmail(email: string) {
  await ensureDb();
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}
