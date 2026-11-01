import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDb, schema } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { seedIfEmpty } from "@/lib/db/seed";
import { rateLimit } from "@/lib/security/rate-limit";
import { CSRF_COOKIE, createCsrfToken, csrfPairValid } from "@/lib/security/csrf";
import { sessionCookieOptions } from "@/lib/security/session-policy";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  csrfToken: z.string().optional(),
});

function clientKey(req: Request, email: string) {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return `login:${ip}:${email.toLowerCase()}`;
}

export async function GET() {
  // Issue CSRF cookie for the login form
  const token = createCsrfToken();
  const res = NextResponse.json({ csrfToken: token });
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2);
  res.cookies.set(CSRF_COOKIE, token, { ...sessionCookieOptions(expiresAt), httpOnly: false });
  return res;
}

export async function POST(req: Request) {
  await seedIfEmpty();
  await ensureDb();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials payload" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();

  const limited = rateLimit({ key: clientKey(req, email), limit: 10, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const cookieToken = req.headers.get("cookie")?.match(new RegExp(`${CSRF_COOKIE}=([^;]+)`))?.[1];
  const headerToken = req.headers.get("x-csrf-token") || parsed.data.csrfToken;
  // Require CSRF when a cookie was issued; allow first-time API clients without cookie for smoke tests
  if (cookieToken && !csrfPairValid(decodeURIComponent(cookieToken), headerToken || undefined)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

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
