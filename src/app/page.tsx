export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { seedIfEmpty } from "@/lib/db/seed";
import { LogoMark } from "@/components/logo-mark";
import { PilotRequestForm } from "@/components/pilot-request-form";
import { COMPANY } from "@/lib/company";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionaries";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { RiskTierChecker } from "@/components/risk-tier-checker";

const pillars = [
  {
    title: "Inventory & classify",
    body: "Register every AI system, capture roles in the value chain, and classify EU AI Act risk with a guided questionnaire.",
  },
  {
    title: "Crosswalk & evidence",
    body: "Map controls across the EU AI Act, NIST AI RMF, ISO/IEC 42001 and GDPR. Store evidence in a hash-chained R2 locker.",
  },
  {
    title: "Evaluate & remediate",
    body: "Run fairness, red-team and scored provider evals. Track findings, owners, due dates and auditor sign-off.",
  },
];

const modules = [
  "AI system registry",
  "EU risk classifier",
  "Control crosswalk",
  "Evidence locker (R2)",
  "FRIA / DPIA",
  "Fairness + red-team",
  "Scored eval suites",
  "Findings workflow",
  "Immutable audit log",
  "Monitoring & drift",
  "Multi-tenant RBAC",
  "API keys (/api/v1)",
];

export default async function HomePage() {
  await seedIfEmpty();
  const session = await getSession();
  if (session) redirect("/dashboard");
  const locale = await getRequestLocale();

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8f7fd_0%,_#ffffff_48%,_#ffffff_100%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6 sm:py-6">
        <LogoMark />
        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <LocaleSwitcher value={locale} />
          <Link href="/how-it-works" className="hidden text-sm font-medium text-slate-600 hover:text-[#0F2A4A] sm:inline">
            {t(locale, "mkt.nav.how")}
          </Link>
          <Link href="/frameworks" className="hidden text-sm font-medium text-slate-600 hover:text-[#0F2A4A] md:inline">
            {t(locale, "mkt.nav.frameworks")}
          </Link>
          <Link href="/demo" className="hidden text-sm font-medium text-slate-600 hover:text-[#0F2A4A] md:inline">
            {t(locale, "mkt.nav.demo")}
          </Link>
          <Link href="/resources" className="hidden text-sm font-medium text-slate-600 hover:text-[#0F2A4A] lg:inline">
            {t(locale, "mkt.nav.resources")}
          </Link>
          <Link href="/developers" className="hidden text-sm font-medium text-slate-600 hover:text-[#0F2A4A] lg:inline">
            {t(locale, "mkt.nav.developers")}
          </Link>
          <Link href="/contact" className="hidden text-sm font-medium text-slate-600 hover:text-[#0F2A4A] lg:inline">
            {t(locale, "mkt.nav.contact")}
          </Link>
          <a href="#pricing" className="hidden text-sm font-medium text-slate-600 hover:text-[#0F2A4A] lg:inline">
            {t(locale, "mkt.pricing.title")}
          </a>
          <Link href="/login" className="btn btn-secondary px-3 py-2 sm:px-5">
            {t(locale, "mkt.nav.signin")}
          </Link>
          <Link href="/signup" className="btn btn-primary px-3 py-2 sm:px-5">
            {t(locale, "mkt.nav.signup")}
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10 pt-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Global AI audit platform</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-[#0F2A4A] sm:text-5xl">
              System of record and system of proof for AI governance.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">
              Inventory systems, classify EU AI Act risk, map controls across leading frameworks, run technical
              evaluations, collect evidence, and export auditor-ready reports — with multi-tenant RBAC and an
              immutable audit log.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#risk-checker" className="btn btn-primary">
                Check AI Act risk tier
              </a>
              <a href="#request-pilot" className="btn btn-secondary">
                {t(locale, "mkt.hero.ctaPilot")}
              </a>
              <Link href="/demo" className="btn btn-secondary">
                Product tour
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">Built for global deployers, providers and auditors.</p>
          </div>
          <div className="card relative overflow-hidden p-6">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-100/80" />
            <div className="relative space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk tiers</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="badge badge-prohibited">Prohibited</span>
                  <span className="badge badge-high">High-risk</span>
                  <span className="badge badge-limited">Limited</span>
                  <span className="badge badge-minimal">Minimal</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                Crosswalk: EU AI Act · NIST AI RMF · ISO 42001 · GDPR
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                Eval suites: fairness · robustness · injection · PII · hallucination
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-950">
                Hash-chained evidence on R2 + immutable activity log
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <h2 className="text-2xl font-semibold text-[#0F2A4A]">Built for deployers, providers and auditors</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="card p-5">
              <h3 className="font-semibold text-[#0F2A4A]">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-[#0F2A4A]">Platform modules</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <div
                key={m}
                className="rounded-full border border-[#d7e6ef] bg-sky-50/60 px-4 py-3 text-sm font-medium text-[#0F2A4A]"
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
        <RiskTierChecker />
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
        <div className="card overflow-hidden p-0">
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-[#d7e6ef] bg-[#6FCDF5]/15 p-8 lg:border-b-0 lg:border-r">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Pricing</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#0F2A4A]">{t(locale, "mkt.pricing.title")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Pilots and enterprise plans are scoped to your AI inventory, frameworks and assurance depth.
                Pricing on request — we quote in EUR after a short discovery call. {t(locale, "mkt.footer.sales")}:{" "}
                <a className="font-semibold text-sky-800 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
                  {COMPANY.salesEmail}
                </a>
                .
              </p>
              <ul className="mt-5 space-y-2 text-sm text-[#0F2A4A]">
                <li>• Guided EU AI Act classification and control crosswalk</li>
                <li>• Evidence vault on Cloudflare R2 with hash chain</li>
                <li>• Technical evals, findings workflow and auditor sign-off</li>
              </ul>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-[#0F2A4A]">{t(locale, "mkt.pilot.title")}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Tell us about your programme. We&apos;ll be in touch within 2 business days — or email{" "}
                <a className="font-semibold text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
                  {COMPANY.salesEmail}
                </a>
                .
              </p>
              <div className="mt-5">
                <PilotRequestForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d7e6ef] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="space-y-2">
            <LogoMark />
            <p className="text-xs text-slate-500">{COMPANY.footerCopyright}</p>
            <p className="text-xs text-slate-500">
              {t(locale, "mkt.footer.sales")}:{" "}
              <a className="text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
                {COMPANY.salesEmail}
              </a>
              {" · "}
              {t(locale, "mkt.footer.general")}:{" "}
              <a className="text-sky-700 hover:underline" href={`mailto:${COMPANY.email}`}>
                {COMPANY.email}
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-[#0F2A4A]">
            <Link href="/how-it-works" className="hover:text-sky-700">How it works</Link>
            <Link href="/demo" className="hover:text-sky-700">{t(locale, "mkt.nav.demo")}</Link>
            <Link href="/resources" className="hover:text-sky-700">{t(locale, "mkt.nav.resources")}</Link>
            <Link href="/frameworks" className="hover:text-sky-700">Frameworks</Link>
            <Link href="/security" className="hover:text-sky-700">Security</Link>
            <Link href="/contact" className="hover:text-sky-700">Contact</Link>
            <Link href="/privacy" className="hover:text-sky-700">Privacy</Link>
            <Link href="/terms" className="hover:text-sky-700">Terms</Link>
            <Link href="/login" className="hover:text-sky-700">Sign in</Link>
            <Link href="/signup" className="hover:text-sky-700">Sign up</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
