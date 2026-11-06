import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getInvoice } from "@/lib/billing/service";
import { COMPANY } from "@/lib/company";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const invoice = await getInvoice(session.orgId, id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cleanRef = invoice.paystackReference.split(":")[0] || invoice.paystackReference;
  const stripeSession = invoice.paystackReference.split(":")[1] || "";

  const lines = [
    `${COMPANY.productName} — Commercial Invoice / Payment Receipt`,
    `Seller: ${COMPANY.fullLegalName} (${COMPANY.legalName})`,
    `Registered office: ${COMPANY.addressLine}`,
    `KRS: ${COMPANY.krs} (${COMPANY.registryCourt})`,
    `NIP: ${COMPANY.nip} · EU VAT (VIES): ${COMPANY.vatEu} · REGON: ${COMPANY.regon}`,
    `Share capital: ${COMPANY.shareCapital}`,
    "",
    `Invoice ID: ${invoice.id}`,
    `Status: ${invoice.status}`,
    `Plan: ${invoice.planTier}`,
    `Description: ${invoice.description}`,
    `Net amount (ex VAT): ${(invoice.amountEurCents / 100).toFixed(2)} EUR`,
    `Total charged: ${(invoice.chargeAmountMinor / 100).toFixed(2)} ${invoice.chargeCurrency}`,
    `Reference: ${cleanRef}`,
    ...(stripeSession ? [`Stripe Session ID: ${stripeSession}`] : []),
    `Created: ${invoice.createdAt ? new Date(invoice.createdAt).toISOString() : ""}`,
    `Paid: ${invoice.paidAt ? new Date(invoice.paidAt).toISOString() : "—"}`,
    "",
    "VAT note: Displayed net prices exclude VAT. For B2B customers in the European Union outside Poland with a valid VIES VAT ID, intra-Community reverse charge (0% VAT, Art. 196 Council Directive 2006/112/EC) applies. For Polish entities, standard 23% PL VAT applies.",
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="v77-invoice-${invoice.id.slice(0, 8)}.txt"`,
    },
  });
}
