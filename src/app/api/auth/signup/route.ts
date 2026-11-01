import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { id } from "@/lib/ids";
import { createSession } from "@/lib/auth/session";
import { appendAuditLog } from "@/lib/audit/log";
import { rateLimit } from "@/lib/security/rate-limit";
import { seedIfEmpty } from "@/lib/db/seed";
import { sendEmail } from "@/lib/email/send";
import { signupEmail } from "@/lib/email/templates";
import { trialEndsAtFrom } from "@/lib/billing/trial";

const bodySchema = z.object({
  orgName: z.string().min(2).max(120),
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  password: z.string().min(8).max(128),
});

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "org";
  return `${base}-${id().slice(0, 8)}`;
}

export async function POST(req: Request) {
  await seedIfEmpty();
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown";
  const limited = rateLimit({ key: `signup:${ip}`, limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  await ensureDb();
  const email = parsed.data.email.trim().toLowerCase();
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing.length) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const orgId = id();
  const userId = id();
  const membershipId = id();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const trialEndsAt = trialEndsAtFrom();
  await db.insert(schema.organisations).values({
    id: orgId,
    name: parsed.data.orgName.trim(),
    slug: slugify(parsed.data.orgName),
    planTier: "pilot",
    billingStatus: "trialing",
    trialEndsAt,
    seatLimit: 5,
  });
  await db.insert(schema.users).values({
    id: userId,
    email,
    name: parsed.data.name.trim(),
    passwordHash,
  });
  await db.insert(schema.memberships).values({
    id: membershipId,
    orgId,
    userId,
    role: "admin",
  });
  await createSession(userId, orgId);
  await appendAuditLog({
    orgId,
    actorUserId: userId,
    action: "org.signup",
    entityType: "organisation",
    entityId: orgId,
    detail: { email },
  });

  const tpl = signupEmail({ name: parsed.data.name.trim(), orgName: parsed.data.orgName.trim() });
  await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text, tags: tpl.tags });

  return NextResponse.json({ ok: true, orgId, userId }, { status: 201 });
}
