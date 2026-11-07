import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";
import { GLOBAL_JURISDICTIONS } from "@/lib/global/jurisdictions";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Global AI Frameworks (EU, US, UK, Australia & New Zealand) — V77 Trust",
  description:
    "Unified AI governance crosswalk covering the EU AI Act, US State AI Laws (Colorado SB 24-205, NYC LL144, California AB 2013), NIST AI RMF, UK ICO/ATRS/FCA, Australia 10 Mandatory Guardrails (VAISS) & OAIC ADM, New Zealand Privacy Act 2020 (IPP 1–13) & Algorithm Charter, ISO/IEC 42001, GDPR, DORA, and ISO/IEC 27001.",
};

const frameworks = [
  {
    name: "🇪🇺 EU AI Act (Reg. 2024/1689)",
    summary:
      "Full Art. 5(1)(a–h) prohibited practices screening, Annex I/III high-risk classification, Art. 6(3) exemptions, Art. 25 provider escalation, Annex IV technical documentation, and Art. 47/49 conformity exports.",
    points: [
      "Guided 25-question statutory risk classifier",
      "Auto-drafted Annex IV, Art. 47 Declaration of Conformity & Art. 49 EU DB JSON",
      "Art. 27 FRIA & Art. 73 serious-incident deadlines (2 / 10 / 15 days)",
    ],
  },
  {
    name: "🇺🇸 US State & Federal AI Mandates",
    summary:
      "Built for the Colorado AI Act (SB 24-205), NYC Local Law 144 (AEDT Bias Audit), California AB 2013 / SB 942 / CCPA ADMT, Illinois HB 3773, and NIST AI RMF 1.0 / AI 600-1.",
    points: [
      "Colorado SB 24-205 NIST AI RMF / ISO 42001 safe-harbor crosswalk & annual Impact Assessment",
      "NYC Local Law 144 Four-Fifths Rule (0.80 Impact Ratio) hiring bias calculator",
      "California AB 2013 training data summary & 90-day AG discrimination reporting",
    ],
  },
  {
    name: "🇬🇧 United Kingdom (ICO, ATRS & FCA)",
    summary:
      "Aligned with UK DSIT's 5 Cross-Sectoral AI Principles, UK GDPR & the Data (Use and Access) Act 2025, the UK Algorithmic Transparency Recording Standard (ATRS), and FCA / PRA SS1/23.",
    points: [
      "UK ICO AI DPIA & Art. 22 Automated Decision-Making (ADM) human review safeguards",
      "UK ATRS Tier 1 & Tier 2 public-sector algorithmic transparency templates",
      "FCA Consumer Duty fair-outcome testing & PRA SS1/23 model risk governance",
    ],
  },
  {
    name: "🇦🇺 Australia (10 Guardrails & OAIC ADM)",
    summary:
      "Native support for the Australian Government's 10 Mandatory Guardrails for High-Risk AI / Voluntary AI Safety Standard (VAISS), OAIC Privacy Act APP 1 ADM reforms, and NSW AIAF.",
    points: [
      "Complete 10-Guardrail conformity assessment (accountability, data, testing, human control, contestability)",
      "OAIC Privacy Amendment Act 2024 (APP 1) automated decision-making transparency",
      "APRA CPS 230 / CPS 234 operational resilience & DTA government procurement readiness",
    ],
  },
  {
    name: "🇳🇿 New Zealand (Privacy Act 2020 & Algorithm Charter)",
    summary:
      "Covers the NZ Office of the Privacy Commissioner (OPC) AI Guidance across IPPs 1–13, the Algorithm Charter for Aotearoa New Zealand, and the NZ Public Service AI Framework.",
    points: [
      "Mandatory pre-deployment AI Privacy Impact Assessment (PIA) & IPP 8 accuracy checks",
      "Algorithm Charter Probability × Impact risk matrix, peer review & plain-English explainability",
      "Te Tiriti o Waitangi & Māori Data Sovereignty governance checkpoints",
    ],
  },
  {
    name: "🌐 ISO/IEC 42001, NIST AI RMF, GDPR, DORA & ISO 27001",
    summary:
      "Certifiable AI Management System (AIMS) controls mapped once across global privacy, financial resilience (DORA / SR 11-7 / PRA SS1/23 / APRA CPS 230), and information security standards.",
    points: [
      "24 core controls mapped across 10 global statutes and standards",
      "SHA-256 hash-chained evidence locker & 4-tier external Auditor Sign-Off",
      "CI/CD release gate API (/api/v1/compliance-gate) for GitHub Actions",
    ],
  },
];

export default function FrameworksPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Global Multi-Jurisdiction Crosswalk</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[#0F2A4A] sm:text-4xl">
          Audit once. Comply across the EU, USA, UK, Australia &amp; New Zealand.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
          Map once, evidence once. V77 Trust unifies the EU AI Act, US Federal &amp; State AI Laws (NIST AI RMF,
          Colorado SB 24-205, NYC LL144, California AB 2013), UK ICO / ATRS / FCA, Australia&apos;s 10 Mandatory
          High-Risk AI Guardrails (VAISS) &amp; OAIC ADM, New Zealand&apos;s Privacy Act 2020 (IPP 1–13) &amp; Algorithm
          Charter, ISO/IEC 42001, GDPR, DORA, and ISO/IEC 27001 in one shared control catalogue.
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

        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-semibold text-[#0F2A4A]">
            Regional Regulatory Coverage &amp; High-Need Sectors
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {GLOBAL_JURISDICTIONS.map((j) => (
              <div key={j.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-[#0F2A4A]">
                    {j.flag} {j.name}
                  </h3>
                  <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800">
                    {j.incidentReportingWindow}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{j.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {j.flagshipLaws.map((law) => (
                    <span key={law} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {law}
                    </span>
                  ))}
                </div>
                <ul className="mt-3 space-y-1 text-xs text-slate-700">
                  {j.keyObligations.map((ob) => (
                    <li key={ob}>• {ob}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-sm text-slate-600">
          Ready to run the global crosswalk on your AI inventory?{" "}
          <Link href="/signup" className="font-semibold text-sky-800 hover:underline">
            Start 14-day trial
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
