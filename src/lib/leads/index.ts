import { desc, eq } from "drizzle-orm";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { sendEmail } from "@/lib/email/send";
import { leadNotificationEmail } from "@/lib/email/templates";
import { COMPANY } from "@/lib/company";

import type { LeadStatus } from "./statuses";
export { LEAD_STATUSES, type LeadStatus } from "./statuses";

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
  const now = new Date();
  await db.insert(schema.pilotLeads).values({
    id: leadId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: (input.company || "").trim(),
    roleTitle: (input.roleTitle || "").trim(),
    message: (input.message || "").trim(),
    source: input.source || "landing",
    status: "new",
    notes: "",
    updatedAt: now,
    createdAt: now,
  });
  const tpl = leadNotificationEmail({ name: input.name.trim(), company: (input.company || "").trim() || "—" });
  const notifyTo = process.env.V77_LEAD_NOTIFY_EMAIL?.trim() || COMPANY.salesEmail;
  await sendEmail({ to: notifyTo, subject: tpl.subject, html: tpl.html, text: tpl.text, tags: tpl.tags });
  return { id: leadId };
}

export async function listPilotLeads(limit = 100) {
  await ensureDb();
  return db.select().from(schema.pilotLeads).orderBy(desc(schema.pilotLeads.createdAt)).limit(limit);
}

export async function updatePilotLead(
  leadId: string,
  patch: { status?: LeadStatus; notes?: string },
) {
  await ensureDb();
  const existing = await db.select().from(schema.pilotLeads).where(eq(schema.pilotLeads.id, leadId)).limit(1);
  if (!existing[0]) return null;
  await db
    .update(schema.pilotLeads)
    .set({
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.pilotLeads.id, leadId));
  const rows = await db.select().from(schema.pilotLeads).where(eq(schema.pilotLeads.id, leadId)).limit(1);
  return rows[0] ?? null;
}
