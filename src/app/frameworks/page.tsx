import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";

export const metadata: Metadata = {
  title: "Frameworks — V77 Trust",
  description:
    "Crosswalk for the EU AI Act, NIST AI RMF, ISO/IEC 42001, GDPR AI controls, DORA and ISO/IEC 27001.",
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
  {
    name: "GDPR (AI-related)",
    summary:
      "Lawful basis, DPIA, automated decision-making, special-category data and transparency duties when AI processes personal data.",
    points: [
      "Arts. 5–6, 9, 12–14, 22, 25, 30, 32, 33–36 cited where applicable",
      "DPIA linked to FRIA when both apply",
      "No invented article numbers — public Regulation (EU) 2016/679 only",
    ],
  },
  {
    name: "DORA",
    summary:
      "ICT risk management and third-party risk for financial entities when AI supports critical or important functions (Regulation (EU) 2022/2554).",
    points: [
      "Arts. 5–6 governance and ICT risk framework",
      "Arts. 17–19 ICT-related incident management",
      "Arts. 28–30 ICT third-party risk for AI vendors",
    ],
  },
  {
    name: "ISO/IEC 27001",
    summary:
      "Information security Annex A themes mapped to AI admin access, logging, secure development and supplier risk — identifiers only, no standard text reproduced.",
    points: [
      "A.5 access, supplier and incident themes",
      "A.8 logging, monitoring and secure development themes",
      "Crosswalked alongside AI Act and DORA controls",
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
          Map once, evidence once. V77 Trust keeps EU AI Act, NIST AI RMF, ISO/IEC 42001, GDPR AI-related, DORA and
          ISO/IEC 27001 references in a shared catalogue so programmes do not diverge into parallel trackers.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {frameworks.map((f) => (
            <article key={f.name} className="card flex flex-col p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-[#0F2A4A]">{f.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.summary}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-sky-600">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-10 text-sm text-slate-600">
          Ready to run the crosswalk on your inventory?{" "}
          <Link href="/signup" className="font-semibold text-sky-800 hover:underline">
            Start free
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="font-semibold text-sky-800 hover:underline">
            talk to sales
          </Link>
          .
        </p>
      </section>
    </MarketingChrome>
  );
}
