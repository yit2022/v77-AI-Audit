import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";

export const metadata: Metadata = {
  title: "Frameworks — V77 Trust",
  description: "Crosswalk for the EU AI Act, NIST AI RMF and ISO/IEC 42001 with GDPR-aligned controls.",
};

const frameworks = [
  {
    name: "EU AI Act",
    summary:
      "Risk-tier classification, Annex III high-risk obligations, transparency for limited-risk systems, and GPAI documentation expectations.",
    points: [
      "Guided risk questionnaire mapped to Act categories",
      "Control pack for high-risk deployer / provider duties",
      "FRIA / DPIA templates for fundamental-rights impact",
    ],
  },
  {
    name: "NIST AI RMF",
    summary:
      "Govern, Map, Measure and Manage functions crosswalked into the same control catalogue used for EU obligations.",
    points: [
      "Map organisational AI risk context and stakeholders",
      "Measure technical trustworthiness (fairness, robustness, PII)",
      "Manage findings with owners, due dates and evidence",
    ],
  },
  {
    name: "ISO/IEC 42001",
    summary:
      "AI management system controls for policy, roles, lifecycle and continual improvement — aligned in the crosswalk.",
    points: [
      "AIMS-oriented control areas in the registry",
      "Assessment workflow for implementation status",
      "Auditor workspace for review comments and sign-off",
    ],
  },
];

export default function FrameworksPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Frameworks</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[#0F2A4A] sm:text-4xl">
          One crosswalk for the frameworks that matter.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
          Map once, evidence once. V77 Trust keeps EU AI Act, NIST AI RMF and ISO/IEC 42001 controls in a shared catalogue
          with GDPR references so programmes do not diverge into parallel trackers.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {frameworks.map((f) => (
            <article key={f.name} className="card flex flex-col p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-[#0F2A4A]">{f.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.summary}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#0F2A4A]">
                {f.points.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/signup" className="btn btn-primary">
            Explore in a free workspace
          </Link>
        </div>
      </section>
    </MarketingChrome>
  );
}
