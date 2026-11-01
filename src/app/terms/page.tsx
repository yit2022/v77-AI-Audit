import type { Metadata } from "next";
import { MarketingChrome } from "@/components/marketing-chrome";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  description: `Terms of use for ${COMPANY.productName}, operated by ${COMPANY.legalName}.`,
  title: "Terms — V77 Trust",
};

export default function TermsPage() {
  return (
    <MarketingChrome>
      <article className="mx-auto max-w-3xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Terms</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0F2A4A]">Terms of use</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: 1 November 2026</p>
        <div className="mt-8 space-y-5 text-sm leading-relaxed text-slate-700">
          <p>
            These terms govern access to {COMPANY.productName} websites and software operated by {COMPANY.legalName},{" "}
            {COMPANY.addressLine}. By creating an account or using the service you agree to them. Separate pilot or
            enterprise agreements prevail where signed.
          </p>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">The service</h2>
          <p>
            {COMPANY.productName} provides AI governance tooling (inventory, classification, controls, evidence,
            evaluations and reporting). Features may change. Demo and free workspaces are provided as-is for evaluation.
          </p>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">Your responsibilities</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Provide accurate account information and keep credentials confidential.</li>
            <li>Only upload content you have rights to process.</li>
            <li>Do not attempt to disrupt the service, bypass access controls, or misuse other tenants&apos; data.</li>
            <li>Comply with applicable AI, privacy and employment laws for systems you register.</li>
          </ul>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">Intellectual property</h2>
          <p>
            We retain ownership of the {COMPANY.productName} platform, branding and documentation. You retain ownership of
            your organisation&apos;s content. You grant us a limited licence to host and process that content solely to
            provide the service.
          </p>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">Disclaimer and liability</h2>
          <p>
            The platform assists governance programmes but does not constitute legal advice or a guarantee of regulatory
            conformity. To the fullest extent permitted by law, {COMPANY.legalName} is not liable for indirect or
            consequential damages arising from use of the service.
          </p>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">Contact</h2>
          <p>
            {COMPANY.legalName}, {COMPANY.addressLine}. Email{" "}
            <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.email}`}>
              {COMPANY.email}
            </a>
            .
          </p>
          <h2 className="text-lg font-semibold text-[#0F2A4A]">Governing law</h2>
          <p>
            Unless a signed agreement states otherwise, these terms are governed by the laws of Poland, without prejudice
            to mandatory consumer protections that may apply in your country of residence.
          </p>
        </div>
      </article>
    </MarketingChrome>
  );
}
