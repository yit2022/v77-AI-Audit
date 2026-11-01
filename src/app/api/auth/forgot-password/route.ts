import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import { rateLimit } from "@/lib/security/rate-limit";
import { seedIfEmpty } from "@/lib/db/seed";

const bodySchema = z.object({
  email: z.string().email().max(200),
  locale: z.string().max(8).optional(),
});

const GENERIC =
  "If an account exists for that email, we sent a password reset link. It expires in 60 minutes.";

function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(req: Request) {
  await seedIfEmpty();
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    // Still generic to avoid enumeration via validation differences on email shape beyond zod
    return NextResponse.json({ ok: true, message: GENERIC });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const ip = clientIp(req);

  const ipLimit = rateLimit({ key: `forgot:ip:${ip}`, limit: 10, windowMs: 60 * 60 * 1000 });
  const emailLimit = rateLimit({ key: `forgot:email:${email}`, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!ipLimit.ok || !emailLimit.ok) {
    return NextResponse.json(
      { ok: true, message: GENERIC },
      { status: 200, headers: { "Retry-After": String(Math.max(ipLimit.retryAfterSec, emailLimit.retryAfterSec)) } },
    );
  }

  await requestPasswordReset({ email, locale: parsed.data.locale, req });
  return NextResponse.json({ ok: true, message: GENERIC });
}
