import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { billingEnabled } from "@/lib/billing/flags";
import { startCheckout } from "@/lib/billing/service";
import { getAppOrigin } from "@/lib/site";

const bodySchema = z.object({
  tier: z.enum(["team"]),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  if (!billingEnabled()) {
    return NextResponse.json(
      { error: "Billing is not enabled yet. Set V77_BILLING_ENABLED=true and Paystack keys." },
      { status: 503 },
    );
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  try {
    const callbackUrl = `${getAppOrigin(req)}/billing?checkout=return`;
    const result = await startCheckout({
      orgId: session.orgId,
      userId: session.userId,
      email: session.email,
      tier: parsed.data.tier,
      callbackUrl,
      req,
    });
    return NextResponse.json({
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
      invoiceId: result.invoiceId,
      currency: result.currency,
      amountMinor: result.amountMinor,
      eurAmount: result.eurAmount,
      usdAmount: result.usdAmount,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Checkout failed" }, { status: 400 });
  }
}
