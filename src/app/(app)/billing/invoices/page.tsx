export const dynamic = "force-dynamic";

import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listInvoices } from "@/lib/billing/service";
import { PageHeader } from "@/components/ui";
import { formatEur } from "@/lib/money/eur";

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session) return null;
  const invoices = await listInvoices(session.orgId);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Download VAT-compliant invoices & receipts issued by Vertex77 sp. z o.o. (VAT-UE: PL5214148501)."
        actions={
          <Link href="/billing" className="btn btn-secondary text-sm">
            Back to plans
          </Link>
        }
      />
      <div className="card overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">EUR (ex VAT)</th>
              <th className="px-4 py-3">Charged</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Download</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No invoices yet.
                </td>
              </tr>
            ) : (
              invoices.map((i) => (
                <tr key={i.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600">
                    {i.createdAt ? new Date(i.createdAt).toISOString().slice(0, 10) : "—"}
                  </td>
                  <td className="px-4 py-3">{i.description || i.planTier}</td>
                  <td className="px-4 py-3">{formatEur(i.amountEurCents / 100)}</td>
                  <td className="px-4 py-3">
                    {(i.chargeAmountMinor / 100).toFixed(2)} {i.chargeCurrency}
                  </td>
                  <td className="px-4 py-3 capitalize">{i.status}</td>
                  <td className="px-4 py-3">
                    <a className="font-medium text-sky-700 hover:underline" href={`/api/billing/invoices/${i.id}/download`}>
                      Download
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
