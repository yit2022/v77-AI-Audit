import type { Metadata } from "next";
import { MarketingChrome } from "@/components/marketing-chrome";
import { COMPANY } from "@/lib/company";

export const revalidate = 300;

export const metadata: Metadata = {
  description: `Privacy notice for ${COMPANY.productName}, operated by ${COMPANY.legalName}.`,
  title: "Privacy — V77 Trust",
};

export default function PrivacyPage() {
  return (
    <MarketingChrome>
      <article className="mx-auto max-w-3xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Privacy</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0F2A4A]">Privacy notice</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: 1 November 2026</p>
        <div className="prose-slate mt-8 space-y-5 text-sm leading-relaxed text-slate-700">
          <p>
            {COMPANY.productName} is operated by {COMPANY.legalName} (&quot;we&quot;, &quot;us&quot;), {COMPANY.addressLine}.
            This notice explains how we handle personal data when you visit v77trust.com, request a pilot, or use the
            product.
          </p>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">What we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Account data: name, email, organisation membership and role.</li>
            <li>Pilot requests: name, work email, organisation, role title and message you submit.</li>
            <li>Product content you upload (AI system records, evidence files, assessment notes).</li>
            <li>Technical logs needed for security, rate limiting and abuse prevention.</li>
          </ul>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">How we use it</h2>
          <p>
            We use this data to provide the service, respond to pilot requests, secure the platform, and improve
            reliability. We do not sell personal data. Pilot form submissions are stored in V77; we do not auto-send
            marketing emails from that form.
          </p>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">Processors and hosting</h2>
          <p>
            The application runs on Cloudflare (Workers, D1, R2). Sub-processors may change as the platform evolves;
            material changes will be reflected in this notice.
          </p>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">Retention and rights</h2>
          <p>
            Account and workspace data are retained while your organisation uses {COMPANY.productName} and for a
            reasonable period afterward for legal and security purposes. Depending on applicable law (including the GDPR)
            you may have rights to access, correct, delete or restrict processing of your personal data.
          </p>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">Contact</h2>
          <p>
            {COMPANY.legalName}
            <br />
            {COMPANY.addressLine}
            <br />
            Email:{" "}
            <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.email}`}>
              {COMPANY.email}
            </a>
            {" · "}
            <a className="font-semibold text-sky-700 hover:underline" href={COMPANY.website}>
              {COMPANY.website.replace("https://", "")}
            </a>
          </p>
        </div>
      </article>
    </MarketingChrome>
  );
}
