import { NextResponse } from "next/server";
import { z } from "zod";
import { PASSWORD_MIN_LEN, resetPasswordWithToken } from "@/lib/auth/password-reset";
import { rateLimit } from "@/lib/security/rate-limit";
import { seedIfEmpty } from "@/lib/db/seed";

const bodySchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(PASSWORD_MIN_LEN).max(128),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const limited = rateLimit({ key: `reset:ip:${ip}`, limit: 20, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const result = await resetPasswordWithToken({
    token: parsed.data.token,
    newPassword: parsed.data.password,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
