import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";
import { COMPANY } from "@/lib/company";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact — V77 Trust",
  description: `Contact ${COMPANY.productName} / ${COMPANY.legalName} — sales and general enquiries.`,
};

export default function ContactPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-3xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Contact</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0F2A4A]">Talk to V77 Trust</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">
          {COMPANY.legalName} operates {COMPANY.productName} from {COMPANY.addressLine}.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <h2 className="font-semibold text-[#0F2A4A]">Sales &amp; pilots</h2>
            <p className="mt-2 text-sm text-slate-600">Pricing on request, discovery calls and pilot scoping.</p>
            <a className="mt-3 inline-block text-sm font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
              {COMPANY.salesEmail}
            </a>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-[#0F2A4A]">General &amp; privacy</h2>
            <p className="mt-2 text-sm text-slate-600">Product questions, privacy rights and security enquiries.</p>
            <a className="mt-3 inline-block text-sm font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.email}`}>
              {COMPANY.email}
            </a>
          </div>
        </div>
        <p className="mt-8 text-sm text-slate-600">
          Prefer a structured brief?{" "}
          <Link href="/#request-pilot" className="font-semibold text-sky-700 hover:underline">
            Request a pilot
          </Link>{" "}
          on the homepage — we reply within 2 business days.
        </p>
      </section>
    </MarketingChrome>
  );
}
