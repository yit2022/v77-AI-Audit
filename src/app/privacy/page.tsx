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
        <p className="mt-2 text-sm text-slate-500">Last updated: 6 November 2026 · Version 2.0 (EU / GDPR)</p>
        <div className="prose-slate mt-8 space-y-5 text-sm leading-relaxed text-slate-700">
          <p>
            {COMPANY.productName} is operated by <strong>{COMPANY.fullLegalName}</strong> ({COMPANY.legalName}, &quot;we&quot;,
            &quot;us&quot;), with its registered seat at {COMPANY.addressLine}, entered in the Register of Entrepreneurs of the
            National Court Register maintained by {COMPANY.registryCourt} under <strong>KRS {COMPANY.krs}</strong>,{" "}
            <strong>NIP {COMPANY.nip}</strong>, <strong>VAT-UE {COMPANY.vatEu}</strong>, <strong>REGON {COMPANY.regon}</strong>,
            share capital {COMPANY.shareCapital}. This Privacy Notice explains how we process personal data in accordance
            with Regulation (EU) 2016/679 (<strong>GDPR / RODO</strong>) when you visit v77trust.com, request a pilot, or use
            the {COMPANY.productName} platform.
          </p>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">1. Data Controller vs. Data Processor roles</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>{COMPANY.legalName} as Data Controller (GDPR Art. 4(7)):</strong> We act as the Data Controller for
              account registration, billing and VAT invoicing, pilot/commercial enquiries, security audit logs, and website
              operations.
            </li>
            <li>
              <strong>{COMPANY.legalName} as Data Processor (GDPR Art. 4(8) &amp; Art. 28):</strong> For customer workspace
              content (AI system inventory records, FRIA/DPIA assessments, uploaded evidence files, and vendor questionnaire
              responses), your organisation is the Data Controller and {COMPANY.legalName} processes that data solely on your
              documented instructions under our GDPR Article 28 Data Processing Agreement (DPA / <em>umowa powierzenia
              przetwarzania danych</em>, available on request at{" "}
              <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.privacyEmail}`}>
                {COMPANY.privacyEmail}
              </a>
              ).
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">2. Categories of personal data &amp; GDPR Art. 6 legal bases</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Workspace account &amp; authentication data</strong> (name, work email, organisation membership, RBAC
              role, hashed password, session identifiers) — processed to perform our contract with your organisation (
              <strong>GDPR Art. 6(1)(b)</strong>). Providing this data is necessary to create and maintain an account.
            </li>
            <li>
              <strong>Billing, payment &amp; EU VAT invoicing records</strong> (billing contact, company address, EU VAT / VIES
              ID, Stripe customer/subscription identifiers, invoice history) — processed for contract performance (
              <strong>GDPR Art. 6(1)(b)</strong>) and compliance with Polish and EU tax and accounting laws, including the
              Polish Accounting Act (<em>Ustawa o rachunkowości</em>) and VAT Act (<strong>GDPR Art. 6(1)(c)</strong>).
            </li>
            <li>
              <strong>Pilot &amp; B2B sales enquiries</strong> (name, work email, organisation, role title, message) —
              processed to take steps at your request prior to entering into a contract (<strong>GDPR Art. 6(1)(b)</strong>)
              and our legitimate interest in responding to B2B enquiries (<strong>GDPR Art. 6(1)(f)</strong>). We do not send
              unsolicited marketing from pilot submissions.
            </li>
            <li>
              <strong>Security, rate-limiting &amp; audit logs</strong> (IP address, request timestamps, CSRF tokens,
              hash-chained activity records) — processed under our legitimate interest in platform security, abuse prevention,
              and NIS2 / ISO/IEC 27001-aligned auditability (<strong>GDPR Art. 6(1)(f)</strong>).
            </li>
            <li>
              <strong>Cookies &amp; local storage</strong> — strictly necessary cookies (<code>v77_session</code>,{" "}
              <code>v77_csrf</code>, <code>v77_locale</code>) and consent state (<code>v77_cookie_consent</code>) operate
              under ePrivacy Art. 5(3) / Polish PKE Art. 399 exemptions for essential service delivery; any optional
              analytics require prior opt-in consent (<strong>GDPR Art. 6(1)(a)</strong>), which can be withdrawn at any time
              via &quot;Cookie settings&quot; in the footer.
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">3. Sub-processors &amp; recipients</h2>
          <p>We do not sell personal data. We engage the following infrastructure and service sub-processors:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Cloudflare, Inc. / Cloudflare Germany GmbH</strong> — application compute (Workers), relational database
              (D1), and encrypted evidence object storage (R2) with EU/EEA data locality controls.
            </li>
            <li>
              <strong>Stripe Payments Europe, Limited</strong> (Dublin, Ireland) — native EUR payment processing (3DS2 Cards
              and SEPA Direct Debit), EU VAT / VIES validation, and subscription invoicing.
            </li>
            <li>
              <strong>Resend, Inc.</strong> — transactional system emails (workspace invitations, password resets, payment
              receipts, and governance reminders).
            </li>
            <li>
              <strong>Optional AI evaluation providers</strong> — disabled by default (<code>V77_ENABLE_REAL_PROVIDERS=false</code>).
              When explicitly enabled by a customer, prompts pass through automated PII redaction (<code>redactPii</code>)
              before reaching the selected provider (Cloudflare Workers AI, Azure OpenAI EU, OpenAI, or Anthropic).
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">4. International data transfers</h2>
          <p>
            Where a sub-processor processes data outside the European Economic Area (EEA), transfers are safeguarded by the
            EU-U.S. Data Privacy Framework (DPF) adequacy decision and/or the European Commission&apos;s Standard Contractual
            Clauses (SCCs, Commission Implementing Decision (EU) 2021/914) alongside supplementary encryption and PII
            minimisation measures.
          </p>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">5. Retention periods</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Workspace &amp; account data:</strong> retained for the duration of the subscription or trial plus up to
              30 days prior to permanent deletion (or exported immediately upon request).
            </li>
            <li>
              <strong>Billing &amp; tax invoices:</strong> retained for <strong>5 years</strong> from the end of the calendar
              year in which the tax deadline expired, as required by Polish tax and accounting law (Art. 74 of the Polish
              Accounting Act / Art. 86 § 1 Ordynacja podatkowa).
            </li>
            <li>
              <strong>Pilot &amp; contact enquiries:</strong> retained for up to <strong>12 months</strong> from last
              interaction if no commercial agreement is concluded.
            </li>
            <li>
              <strong>Security &amp; technical logs:</strong> retained for up to <strong>90 days</strong> unless required
              longer for incident investigation.
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">6. Your GDPR rights &amp; Supervisory Authority (PUODO)</h2>
          <p>
            Under GDPR Articles 15–22, you have the right to request access to your personal data, rectification, erasure
            (&quot;right to be forgotten&quot;), restriction of processing, data portability (Article 20), and to object to
            processing based on legitimate interests (Article 21). Where processing is based on consent, you may withdraw
            consent at any time without affecting the lawfulness of prior processing.
          </p>
          <p>
            You also have the right to lodge a complaint with the Polish data protection supervisory authority:{" "}
            <strong>Prezes Urzędu Ochrony Danych Osobowych (PUODO)</strong>, ul. Stawki 2, 00-193 Warszawa, Poland (
            <a className="font-semibold text-sky-700 hover:underline" href="https://uodo.gov.pl" rel="noopener noreferrer">
              uodo.gov.pl
            </a>
            ), or with the supervisory authority in the EU Member State of your habitual residence or place of work.
          </p>

          <h2 className="text-lg font-semibold text-[#0F2A4A]">7. Contact &amp; Privacy enquiries</h2>
          <p>
            {COMPANY.fullLegalName} ({COMPANY.legalName})
            <br />
            {COMPANY.addressLine}
            <br />
            KRS: {COMPANY.krs} · NIP: {COMPANY.nip} · VAT-UE: {COMPANY.vatEu} · REGON: {COMPANY.regon}
            <br />
            Privacy &amp; GDPR requests:{" "}
            <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.privacyEmail}`}>
              {COMPANY.privacyEmail}
            </a>
            {" · General: "}
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
