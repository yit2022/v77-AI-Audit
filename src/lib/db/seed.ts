import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, ensureDb, schema } from "./index";
import { CONTROL_SEEDS } from "@/lib/crosswalk";
import { id } from "@/lib/ids";
import { insertInChunks } from "./chunk-insert";

function resolveSeedPasswords(): {
  admin: string;
  owner: string;
  auditor: string;
  demoDisabled: boolean;
} {
  const admin = process.env.V77_ADMIN_PASSWORD?.trim();
  const demoDisabled =
    process.env.DISABLE_DEMO_PASSWORDS === "true" ||
    process.env.NODE_ENV === "production" ||
    Boolean(admin);
  if (demoDisabled) {
    if (!admin) {
      throw new Error(
        "V77_ADMIN_PASSWORD is required when demo passwords are disabled (production).",
      );
    }
    const owner = process.env.V77_OWNER_PASSWORD?.trim() || admin;
    const auditor = process.env.V77_AUDITOR_PASSWORD?.trim() || admin;
    return { admin, owner, auditor, demoDisabled: true };
  }
  const local = process.env.V77_DEMO_PASSWORD?.trim() || "demo1234";
  return { admin: local, owner: local, auditor: local, demoDisabled: false };
}

let seeding: Promise<{ seeded: boolean; accounts?: unknown }> | null = null;

/** Top up an already-seeded org so prospects see a full dashboard (idempotent). */
async function enrichDemoOrgIfNeeded(orgId: string) {
  const systems = await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.orgId, orgId));
  if (systems.length >= 4) return;
  const owners = await db
    .select({ userId: schema.memberships.userId, role: schema.memberships.role })
    .from(schema.memberships)
    .where(eq(schema.memberships.orgId, orgId));
  const ownerUserId = owners.find((m) => m.role === "ai_owner")?.userId || owners[0]?.userId || null;
  const auditorUserId = owners.find((m) => m.role === "auditor")?.userId || ownerUserId;
  const names = new Set(systems.map((s) => s.name));
  const toAdd = [];
  if (!names.has("Atlas GPAI Gateway")) {
    toAdd.push({
      id: id(), orgId, name: "Atlas GPAI Gateway",
      description: "Internal gateway routing prompts to foundation models with policy filters.",
      intendedPurpose: "Provide governed model access to product teams.",
      roleInValueChain: "provider", domain: "platform", ownerUserId,
      riskTier: "limited", classificationNotes: "GPAI with systemic-risk watch.", gpai: true,
      lifecycleStatus: "production", vendorName: "Internal", versionLabel: "2.1",
    });
  }
  if (!names.has("Meeting Notes Summariser")) {
    toAdd.push({
      id: id(), orgId, name: "Meeting Notes Summariser",
      description: "Optional meeting transcript summarisation for employees.",
      intendedPurpose: "Draft internal meeting summaries with human review.",
      roleInValueChain: "deployer", domain: "productivity", ownerUserId,
      riskTier: "minimal", classificationNotes: "Minimal risk with transparency notice.", gpai: false,
      lifecycleStatus: "pilot", vendorName: "VendorCo", versionLabel: "0.4",
    });
  }
  if (toAdd.length) await db.insert(schema.aiSystems).values(toAdd);

  const findings = await db.select().from(schema.findings).where(eq(schema.findings.orgId, orgId)).limit(1);
  if (findings.length === 0) {
    const allSystems = await db.select().from(schema.aiSystems).where(eq(schema.aiSystems.orgId, orgId));
    const high = allSystems.find((s) => s.name.includes("HireSense")) || allSystems[0];
    const limited = allSystems.find((s) => s.name.includes("SupportPilot")) || allSystems[1] || high;
    const gpai = allSystems.find((s) => s.name.includes("Atlas")) || high;
    if (high) {
      await db.insert(schema.findings).values([
        {
          id: id(), orgId, systemId: high.id, assessmentId: null,
          title: "Demographic parity gap on shortlist recommendations",
          description: "Fairness suite flagged a >5pp gap across protected groups in the seed dataset.",
          severity: "high", status: "open", frameworkRef: "EU AI Act Art. 10 / NIST Measure 2.5",
          createdBy: auditorUserId,
        },
        {
          id: id(), orgId, systemId: limited.id, assessmentId: null,
          title: "Missing interaction transparency notice",
          description: "Chat widget does not consistently disclose AI assistance to end users.",
          severity: "medium", status: "in_progress", frameworkRef: "EU AI Act Art. 50",
          createdBy: ownerUserId,
        },
        {
          id: id(), orgId, systemId: gpai.id, assessmentId: null,
          title: "Prompt-injection refusal coverage incomplete",
          description: "Red-team pack shows residual jailbreak success on tool-calling path.",
          severity: "medium", status: "open", frameworkRef: "NIST Measure 2.7",
          createdBy: auditorUserId,
        },
      ]);
    }
  }

  const leads = await db.select().from(schema.pilotLeads).limit(1);
  if (leads.length === 0) {
    await db.insert(schema.pilotLeads).values({
      id: id(),
      name: "Jordan Lee",
      email: "jordan.lee@example.com",
      company: "Northwind Financial",
      roleTitle: "Head of AI Risk",
      message: "Interested in a 6-week pilot covering EU AI Act classification and NIST crosswalk.",
      source: "seed_demo",
      status: "new",
      notes: "Demo lead seeded with sample workspace.",
    });
  }
}


async function seedOnce() {
  await ensureDb();
  const existing = await db.select().from(schema.organisations).limit(1);
  if (existing.length > 0) {
    const ctrl = await db.select().from(schema.controls).limit(1);
    if (ctrl.length === 0) {
      await insertInChunks(
        schema.controls,
        CONTROL_SEEDS.map((c) => ({
          id: c.id, code: c.code, title: c.title, description: c.description,
          area: c.area, euRef: c.euRef, nistRef: c.nistRef, isoRef: c.isoRef, gdprRef: c.gdprRef, appliesTo: c.appliesTo,
        })),
      );
    }
    await enrichDemoOrgIfNeeded(existing[0].id);
    return { seeded: false };
  }

  try {
    const passwords = resolveSeedPasswords();
    const orgId = id();
    const adminId = id();
    const ownerId = id();
    const auditorId = id();
    const adminHash = await bcrypt.hash(passwords.admin, 10);
    const ownerHash = await bcrypt.hash(passwords.owner, 10);
    const auditorHash = await bcrypt.hash(passwords.auditor, 10);

    await db.insert(schema.organisations).values({ id: orgId, name: "Tamalaki Business Network Ltd", slug: "tamalaki" });
    await db.insert(schema.users).values([
      { id: adminId, email: "admin@v77.local", name: "Isaac Muthui", passwordHash: adminHash },
      { id: ownerId, email: "owner@v77.local", name: "Amina Okello", passwordHash: ownerHash },
      { id: auditorId, email: "auditor@v77.local", name: "Elena Rossi", passwordHash: auditorHash },
    ]);
    await db.insert(schema.memberships).values([
      { id: id(), orgId, userId: adminId, role: "admin" },
      { id: id(), orgId, userId: ownerId, role: "ai_owner" },
      { id: id(), orgId, userId: auditorId, role: "auditor" },
    ]);
    await insertInChunks(
      schema.controls,
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
    await insertInChunks(
      schema.assessmentControls,
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

    const systemGpai = id();
    const systemMinimal = id();
    await db.insert(schema.aiSystems).values([
      {
        id: systemGpai, orgId, name: "Atlas GPAI Gateway",
        description: "Internal gateway routing prompts to foundation models with policy filters.",
        intendedPurpose: "Provide governed model access to product teams.",
        roleInValueChain: "provider", domain: "platform", ownerUserId: ownerId,
        riskTier: "limited", classificationNotes: "GPAI with systemic-risk watch.", gpai: true,
        lifecycleStatus: "production", vendorName: "Internal", versionLabel: "2.1",
      },
      {
        id: systemMinimal, orgId, name: "Meeting Notes Summariser",
        description: "Optional meeting transcript summarisation for employees.",
        intendedPurpose: "Draft internal meeting summaries with human review.",
        roleInValueChain: "deployer", domain: "productivity", ownerUserId: ownerId,
        riskTier: "minimal", classificationNotes: "Minimal risk with transparency notice.", gpai: false,
        lifecycleStatus: "pilot", vendorName: "VendorCo", versionLabel: "0.4",
      },
    ]);

    await db.insert(schema.findings).values([
      {
        id: id(), orgId, systemId: systemHigh, assessmentId,
        title: "Demographic parity gap on shortlist recommendations",
        description: "Fairness suite flagged a >5pp gap across protected groups in the seed dataset.",
        severity: "high", status: "open", frameworkRef: "EU AI Act Art. 10 / NIST Measure 2.5",
        createdBy: auditorId,
      },
      {
        id: id(), orgId, systemId: systemLimited, assessmentId: null,
        title: "Missing interaction transparency notice",
        description: "Chat widget does not consistently disclose AI assistance to end users.",
        severity: "medium", status: "in_progress", frameworkRef: "EU AI Act Art. 50",
        createdBy: ownerId,
      },
      {
        id: id(), orgId, systemId: systemGpai, assessmentId: null,
        title: "Prompt-injection refusal coverage incomplete",
        description: "Red-team pack shows residual jailbreak success on tool-calling path.",
        severity: "medium", status: "open", frameworkRef: "NIST Measure 2.7",
        createdBy: auditorId,
      },
    ]);

    const scheduleId = id();
    await db.insert(schema.monitoringSchedules).values({
      id: scheduleId, orgId, systemId: systemHigh,
      name: "HireSense weekly drift check", cadenceHours: 168, enabled: true,
      lastRunAt: new Date(Date.now() - 86400000),
      nextRunAt: new Date(Date.now() + 6 * 86400000),
    });
    await db.insert(schema.monitoringRuns).values({
      id: id(), scheduleId, orgId, systemId: systemHigh, status: "ok",
      summaryJson: JSON.stringify({ driftScore: 0.12, samples: 500, note: "Seed demo run" }),
    });
    await db.insert(schema.monitoringAlerts).values({
      id: id(), orgId, systemId: systemHigh, severity: "low", kind: "drift_watch",
      message: "Feature distribution shifted slightly vs baseline (demo).",
      acknowledged: false,
    });

    await db.insert(schema.impactAssessments).values({
      id: id(), orgId, systemId: systemHigh, templateId: "fria",
      title: "HireSense FRIA (demo)", status: "in_progress", createdBy: ownerId,
    });

    // Demo pilot lead so the admin inbox is not empty on first login
    await db.insert(schema.pilotLeads).values({
      id: id(),
      name: "Jordan Lee",
      email: "jordan.lee@example.com",
      company: "Northwind Financial",
      roleTitle: "Head of AI Risk",
      message: "Interested in a 6-week pilot covering EU AI Act classification and NIST crosswalk.",
      source: "seed_demo",
      status: "new",
      notes: "Demo lead seeded with sample workspace.",
    });

    return {
      seeded: true,
      accounts: [
        { email: "admin@v77.local", role: "admin", password: passwords.demoDisabled ? "[set via V77_ADMIN_PASSWORD]" : passwords.admin },
        { email: "owner@v77.local", role: "ai_owner", password: passwords.demoDisabled ? "[set via env]" : passwords.owner },
        { email: "auditor@v77.local", role: "auditor", password: passwords.demoDisabled ? "[set via env]" : passwords.auditor },
      ],
    };
  } catch (e) {
    // Another worker likely won the race
    const again = await db.select().from(schema.organisations).limit(1);
    if (again.length > 0) return { seeded: false };
    throw e;
  }
}

export async function seedIfEmpty(opts?: { force?: boolean }) {
  if (opts?.force) seeding = null;
  if (!seeding) {
    seeding = seedOnce().catch((err) => {
      seeding = null;
      throw err;
    });
  }
  return seeding;
}

export async function findUserByEmail(email: string) {
  await ensureDb();
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}
