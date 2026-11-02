export const revalidate = 300;

import { MarketingChrome } from "@/components/marketing-chrome";
import { PricingPlans } from "@/components/pricing-plans";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: `Pricing — ${COMPANY.productName}`,
  description: "EUR list prices, USD card checkout, 14-day trial.",
};

export default function PricingPage() {
  return (
    <MarketingChrome>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Pricing</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#0F2A4A]">Simple plans for EU AI Act readiness</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          Start with a 14-day self-serve trial. Upgrade to Team when you need more systems, users and frameworks.
        </p>
        <div className="mt-8">
          <PricingPlans />
        </div>
      </div>
    </MarketingChrome>
  );
}
