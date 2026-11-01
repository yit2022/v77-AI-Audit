import { NextResponse } from "next/server";
import { z } from "zod";
import { acceptInvite } from "@/lib/invites";
import { createSession } from "@/lib/auth/session";
import { seedIfEmpty } from "@/lib/db/seed";

const schema = z.object({
  token: z.string().min(10),
  name: z.string().min(1),
  password: z.string().min(10),
});

export async function POST(req: Request) {
  await seedIfEmpty();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  try {
    const result = await acceptInvite(parsed.data);
    await createSession(result.userId, result.orgId);
    return NextResponse.json({ ok: true, user: { email: result.email, role: result.role } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
