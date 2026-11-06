import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { billingEnabled } from "@/lib/billing/flags";
import { getOrgSubscription } from "@/lib/billing/service";
import { createStripePortalSession } from "@/lib/billing/stripe";
import { getAppOrigin } from "@/lib/site";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  if (!billingEnabled()) {
    return NextResponse.json({ error: "Billing is not enabled yet" }, { status: 503 });
  }
  try {
    const sub = await getOrgSubscription(session.orgId);
    const customerId = sub?.paystackCustomerCode || "";
    const returnUrl = `${getAppOrigin(req)}/billing`;
    const portal = await createStripePortalSession({ customerId, returnUrl });
    return NextResponse.json({ url: portal.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not open Stripe Customer Portal" },
      { status: 400 },
    );
  }
}
