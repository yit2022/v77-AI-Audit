import type { Metadata } from "next";
import { MarketingChrome } from "@/components/marketing-chrome";
import { COMPANY } from "@/lib/company";

export const revalidate = 300;

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
        <p className="mt-2 text-sm text-slate-500">Last updated: 6 November 2026 · Version 2.0 (B2B Regulamin)</p>
        <div className="mt-8 space-y-5 text-sm leading-relaxed text-slate-700">
          <p>
            These Terms of Use (<em>Regulamin świadczenia usług drogą elektroniczną</em> within the meaning of Art. 8 of the
            Polish Act on Providing Services by Electronic Means — UŚUDE) govern access to {COMPANY.productName} websites and
            cloud software operated by <strong>{COMPANY.fullLegalName}</strong> ({COMPANY.legalName}), {COMPANY.addressLine},{" "}
            KRS {COMPANY.krs} ({COMPANY.registryCourt}), NIP {COMPANY.nip}, VAT-UE {COMPANY.vatEu}, REGON {COMPANY.regon},
            share capital {COMPANY.shareCapital}. By creating an account or using the service on behalf of an organisation,
            you agree to these terms. Separate signed pilot or enterprise agreements (MSA) prevail where executed.
          </p>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">1. B2B professional scope</h2>
          <p>
            {COMPANY.productName} is a business-to-business (B2B) AI governance and audit platform intended exclusively for
            corporate entities, public sector bodies, and professional practitioners acting in their trade or profession.
          </p>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">2. The service &amp; technical requirements</h2>
          <p>
            {COMPANY.productName} provides AI governance tooling (AI system inventory, EU AI Act risk classification, control
            crosswalks, evidence vault, technical evaluations, and audit reporting). Accessing the platform requires a modern
            standards-compliant web browser with TLS 1.2+ and cookies enabled for session authentication.
          </p>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">3. Billing, EUR subscriptions &amp; EU VAT</h2>
          <p>
            Self-serve plans are billed in <strong>EUR (ex VAT)</strong> via Stripe (supporting corporate payment cards with
            PSD2 SCA and SEPA Direct Debit). For B2B customers established in the EU outside Poland with a valid VIES VAT
            number, intra-Community reverse charge (0% VAT under Art. 196 of Council Directive 2006/112/EC) applies. For
            Polish customers, standard 23% Polish VAT is added. Subscriptions renew monthly or annually unless cancelled at
            period end via the Billing portal.
          </p>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">4. Your responsibilities</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Provide accurate corporate and account information and keep credentials confidential.</li>
            <li>Only upload content and evidence that your organisation is authorised to process.</li>
            <li>Do not submit unlawful content, attempt to disrupt the service, or bypass tenant access controls.</li>
            <li>Comply with applicable EU AI Act, GDPR, and sector regulations for the AI systems you register.</li>
          </ul>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">5. Data ownership &amp; EU Data Act switching / export rights</h2>
          <p>
            We retain ownership of the {COMPANY.productName} platform, branding, and documentation. Your organisation retains
            full ownership of all workspace content and uploaded evidence. In accordance with <strong>Chapter VI of the EU
            Data Act (Regulation (EU) 2023/2854)</strong>, you may export all exportable data and digital assets at any time
            during your subscription — and for 30 days following termination — in structured, machine-readable formats (CSV,
            JSON, PDF, DOCX, and signed ZIP audit packs via the UI and <code>/api/v1</code>) with <strong>zero data egress or
            switching fees</strong>.
          </p>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">6. Disclaimer &amp; limitation of liability</h2>
          <p>
            The platform assists governance and conformity programmes but does not constitute formal legal advice, notified
            body certification, or a guarantee of regulatory approval. Except in cases of willful misconduct (<em>wina
            umyślna</em>) as required under Article 473 § 2 of the Polish Civil Code (<em>Kodeks cywilny</em>) or mandatory
            statutory liability, {COMPANY.legalName} shall not be liable for indirect, consequential, or lost-profit damages,
            and our aggregate liability arising out of or relating to the service is capped at the total fees paid by your
            organisation to {COMPANY.legalName} in the twelve (12) months preceding the event giving rise to the claim.
          </p>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">7. Governing law, complaints &amp; jurisdiction</h2>
          <p>
            Service complaints or support requests may be submitted to{" "}
            <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.email}`}>
              {COMPANY.email}
            </a>{" "}
            and are answered within 14 days. Unless a signed agreement states otherwise, these terms are governed by the laws
            of the Republic of Poland (excluding the UN Convention on Contracts for the International Sale of Goods), and any
            disputes between commercial entities shall be resolved by the common courts having jurisdiction over the
            registered seat of {COMPANY.legalName} in Warsaw, Poland.
          </p>
        </div>
      </article>
    </MarketingChrome>
  );
}
