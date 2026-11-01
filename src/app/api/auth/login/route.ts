import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { seedIfEmpty } from "@/lib/db/seed";

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  await seedIfEmpty();
  await ensureDb();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials payload" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const user = users[0];
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const memberships = await db.select().from(schema.memberships).where(eq(schema.memberships.userId, user.id)).limit(1);
  const membership = memberships[0];
  if (!membership) return NextResponse.json({ error: "No organisation membership" }, { status: 403 });
  await createSession(user.id, membership.orgId);
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: membership.role } });
}
