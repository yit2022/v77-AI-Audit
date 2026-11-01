import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listInvoices } from "@/lib/billing/service";
import { formatEur } from "@/lib/money/eur";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoices = await listInvoices(session.orgId);
  return NextResponse.json({
    invoices: invoices.map((i) => ({
      id: i.id,
      planTier: i.planTier,
      status: i.status,
      description: i.description,
      amountEur: formatEur(i.amountEurCents / 100),
      chargeCurrency: i.chargeCurrency,
      chargeAmountMinor: i.chargeAmountMinor,
      paystackReference: i.paystackReference,
      paidAt: i.paidAt,
      createdAt: i.createdAt,
    })),
  });
}
