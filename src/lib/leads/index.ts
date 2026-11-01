import { desc } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";

export type PilotLeadInput = {
  name: string;
  email: string;
  company?: string;
  roleTitle?: string;
  message?: string;
  source?: string;
};

export async function createPilotLead(input: PilotLeadInput) {
  await ensureDb();
  const leadId = id();
  await db.insert(schema.pilotLeads).values({
    id: leadId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: (input.company || "").trim(),
    roleTitle: (input.roleTitle || "").trim(),
    message: (input.message || "").trim(),
    source: input.source || "landing",
  });
  return { id: leadId };
}

export async function listPilotLeads(limit = 50) {
  await ensureDb();
  return db.select().from(schema.pilotLeads).orderBy(desc(schema.pilotLeads.createdAt)).limit(limit);
}
