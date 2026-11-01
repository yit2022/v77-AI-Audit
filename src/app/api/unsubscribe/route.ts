import { NextResponse } from "next/server";
import { z } from "zod";
import { applyUnsubscribe } from "@/lib/email/unsubscribe";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(8),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const ok = await applyUnsubscribe(parsed.data.email, parsed.data.token);
  if (!ok) return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") || "";
  const token = url.searchParams.get("token") || "";
  const parsed = schema.safeParse({ email, token });
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/unsubscribe?error=invalid", url.origin));
  }
  const ok = await applyUnsubscribe(parsed.data.email, parsed.data.token);
  const dest = new URL("/unsubscribe", url.origin);
  dest.searchParams.set(ok ? "ok" : "error", ok ? "1" : "invalid");
  return NextResponse.redirect(dest);
}
