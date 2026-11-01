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

  const lines = [
    `${COMPANY.productName} invoice`,
    `Legal entity: ${COMPANY.legalName}`,
    `Invoice id: ${invoice.id}`,
    `Status: ${invoice.status}`,
    `Plan: ${invoice.planTier}`,
    `Description: ${invoice.description}`,
    `EUR list (ex VAT): ${(invoice.amountEurCents / 100).toFixed(2)} EUR`,
    `Charged: ${(invoice.chargeAmountMinor / 100).toFixed(2)} ${invoice.chargeCurrency}`,
    `Paystack reference: ${invoice.paystackReference}`,
    `Created: ${invoice.createdAt ? new Date(invoice.createdAt).toISOString() : ""}`,
    `Paid: ${invoice.paidAt ? new Date(invoice.paidAt).toISOString() : "—"}`,
    "",
    "Prices exclude VAT. Card charges are processed in USD at checkout unless EUR charging is enabled.",
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="v77-invoice-${invoice.id.slice(0, 8)}.txt"`,
    },
  });
}
