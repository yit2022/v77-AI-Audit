import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "How it works — V77 Trust",
  description: "From AI inventory to auditor-ready evidence: how V77 Trust runs global AI governance programmes.",
};

const steps = [
  {
    title: "1. Inventory every AI system",
    body: "Register systems with purpose, vendor, lifecycle, value-chain role and GPAI flags. Import from CSV or create records in the registry.",
  },
  {
    title: "2. Classify EU AI Act risk",
    body: "Walk a guided questionnaire to place each system in prohibited, high-risk, limited or minimal tiers with classification notes.",
  },
  {
    title: "3. Map controls across frameworks",
    body: "Use the control crosswalk spanning the EU AI Act, NIST AI RMF, ISO/IEC 42001 and GDPR. Track implementation status per assessment.",
  },
  {
    title: "4. Collect hash-chained evidence",
    body: "Store artefacts in the R2 evidence vault with integrity hashing. Link evidence to controls, assessments and findings.",
  },
  {
    title: "5. Evaluate and remediate",
    body: "Run fairness tests, LLM red-team scenarios and scored eval suites. Open findings, assign owners and track remediation to sign-off.",
  },
  {
    title: "6. Export auditor-ready reports",
    body: "Generate branded PDF packs and compliance dashboards. The immutable activity log records who changed what and when.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">How it works</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[#0F2A4A] sm:text-4xl">
          A single system of record and system of proof for AI governance.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
          V77 Trust is built for deployers, providers and auditors who need inventory, classification, evidence and
          technical assurance in one multi-tenant workspace — without stitching together spreadsheets and slide decks.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {steps.map((s) => (
            <div key={s.title} className="card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-[#0F2A4A]">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/signup" className="btn btn-primary">
            Start free workspace
          </Link>
          <Link href="/#request-pilot" className="btn btn-secondary">
            Request a pilot
          </Link>
        </div>
      </section>
    </MarketingChrome>
  );
}
