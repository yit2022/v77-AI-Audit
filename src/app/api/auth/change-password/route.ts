import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, destroySession } from "@/lib/auth/session";
import { PASSWORD_MIN_LEN, changePassword } from "@/lib/auth/password-reset";
import { rateLimit } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(PASSWORD_MIN_LEN).max(128),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = rateLimit({
    key: `changepw:${session.userId}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const result = await changePassword({
    userId: session.userId,
    orgId: session.orgId,
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  // Sessions were wiped; clear cookie too
  await destroySession();
  return NextResponse.json({ ok: true, reauth: true });
}
