import type { Metadata } from "next";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";
import { GLOBAL_JURISDICTIONS } from "@/lib/global/jurisdictions";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "European AI Governance Frameworks (EU AI Act, GDPR, DORA, ISO 42001) — V77 Trust",
  description:
    "Unified European Union AI governance crosswalk covering the EU AI Act (Reg. 2024/1689), GDPR (Reg. 2016/679), DORA (Reg. 2022/2554 for Banking & Insurance), EN ISO/IEC 42001:2023, ISO/IEC 27001:2022, and NIST AI RMF.",
};

const frameworks = [
  {
    name: "🇪🇺 EU AI Act (Regulation (EU) 2024/1689)",
    summary:
      "Full Art. 5(1)(a–h) prohibited practices screening, Annex I/III high-risk classification (including Annex III pt. 5(b) Creditworthiness & pt. 5(c) Life/Health Insurance), Art. 6(3) exemptions, Art. 25 provider escalation, Annex IV technical documentation, and Art. 47/49 conformity exports.",
    points: [
      "Guided 25-question statutory risk classifier",
      "Auto-drafted Annex IV, Art. 47 Declaration of Conformity & Art. 49 EU DB JSON",
      "Art. 27 FRIA & Art. 73 serious-incident deadlines (2 / 10 / 15 days)",
    ],
  },
  {
    name: "🏦 DORA (Regulation (EU) 2022/2554 — Banking & Insurance)",
    summary:
      "Digital Operational Resilience Act crosswalk for European credit institutions, insurers, and investment firms deploying high-risk AI and third-party foundation models.",
    points: [
      "DORA Arts. 5–16 ICT & AI risk management integrated with EU AI Act Art. 9(9)",
      "DORA Art. 19 major ICT/AI incident reporting & Art. 28 third-party AI vendor register",
      "EBA / EIOPA supervisory audit pack & model risk governance",
    ],
  },
  {
    name: "🔒 GDPR (Regulation (EU) 2016/679 — Arts. 5, 22, 25, 32, 35)",
    summary:
      "European data protection controls for personal-data AI training, inference, automated credit/insurance profiling (Art. 22), and data subject rights.",
    points: [
      "Automated DPIA (Art. 35) complementary to EU AI Act Art. 27 FRIA",
      "Art. 22 human intervention, explanation & contestability workflows",
      "72-hour national Data Protection Authority (Art. 33) breach notification tracking",
    ],
  },
  {
    name: "📜 EN ISO/IEC 42001:2023 (AIMS)",
    summary:
      "Certifiable AI Management System (AIMS) standard adopted by CEN-CENELEC across the European Union for Clause 4–10 and Annex A controls.",
    points: [
      "Clause 4–10 governance & Annex A control implementation tracking",
      "SHA-256 hash-chained evidence locker & 4-tier external Auditor Sign-Off",
      "Readiness gap analysis for accredited European certification bodies & Notified Bodies",
    ],
  },
  {
    name: "🛡️ EN ISO/IEC 27001:2022 & EU AI Act Art. 15 Cybersecurity",
    summary:
      "Information security and AI robustness controls mapped across EN ISO/IEC 27001:2022, EU AI Act Art. 15, and OWASP LLM Top 10.",
    points: [
      "16-scenario OWASP LLM Top 10 adversarial red-team suite (prompt injection, data poisoning, PII exfiltration)",
      "10-case scored evaluation benchmark & Four-Fifths subgroup fairness checks (Art. 10)",
      "Immutable cryptographic SHA-256 audit log & role-based access control",
    ],
  },
  {
    name: "📐 NIST AI RMF 1.0 (GOVERN · MAP · MEASURE · MANAGE)",
    summary:
      "Technical risk management crosswalk linking NIST AI RMF 1.0 functions directly to EU AI Act Articles 9–15 and EN ISO/IEC 42001.",
    points: [
      "24 core controls mapped once across all 6 frameworks",
      "Automated gap analysis & weighted readiness scoring",
      "CI/CD release gate API (/api/v1/compliance-gate) for GitHub Actions",
    ],
  },
];

export default function FrameworksPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">European AI Statutory Crosswalk</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[#0F2A4A] sm:text-4xl">
          Audit once. Comply across the EU AI Act, GDPR, DORA &amp; EN ISO/IEC 42001.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
          Map once, evidence once. V77 Trust unifies the EU AI Act (Regulation (EU) 2024/1689), GDPR (Regulation (EU)
          2016/679), DORA (Regulation (EU) 2022/2554 for European banks and insurers), EN ISO/IEC 42001:2023, EN
          ISO/IEC 27001:2022, and NIST AI RMF 1.0 in one shared 24-control catalogue.
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
