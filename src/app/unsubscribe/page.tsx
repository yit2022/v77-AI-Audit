import { MarketingChrome } from "@/components/marketing-chrome";
import { COMPANY } from "@/lib/company";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; email?: string; token?: string }>;
}) {
  const sp = await searchParams;
  const success = sp.ok === "1";
  const failed = Boolean(sp.error);

  return (
    <MarketingChrome>
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="card p-8">
          <h1 className="text-xl font-semibold text-[#0F2A4A]">Email preferences</h1>
          {success ? (
            <p className="mt-3 text-sm text-slate-600">
              You are unsubscribed from non-transactional {COMPANY.productName} emails (tips and trial reminders).
              Billing and security messages may still be sent.
            </p>
          ) : failed ? (
            <p className="mt-3 text-sm text-amber-800">That unsubscribe link is invalid or expired.</p>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Use the unsubscribe link in a product tip email to opt out of marketing messages.
            </p>
          )}
        </div>
      </div>
    </MarketingChrome>
  );
}
