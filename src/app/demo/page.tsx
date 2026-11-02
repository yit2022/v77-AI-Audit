import Image from "next/image";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";
import { COMPANY } from "@/lib/company";

export const revalidate = 300;

const SHOTS = [
  { src: "/demo/live-home.png", title: "Marketing home (live)", body: "Captured from the production site — hero, modules and conversion paths." },
  { src: "/demo/01-dashboard.svg", title: "Executive dashboard", body: "Posture, findings and next actions for the organisation." },
  { src: "/demo/02-inventory.svg", title: "AI inventory", body: "Register systems with EU AI Act tier, role and domain." },
  { src: "/demo/03-controls.svg", title: "Control crosswalk", body: "EU AI Act / NIST AI RMF / ISO 42001 / GDPR mapped controls." },
  { src: "/demo/04-evidence.svg", title: "Evidence vault", body: "Hash-chained objects on Cloudflare R2." },
  { src: "/demo/05-gap-analysis.svg", title: "Gap analysis", body: "AI-assisted control gaps with mock fallback when providers are off." },
  { src: "/demo/live-developers.png", title: "Developers / API (live)", body: "Public API documentation surface captured from production." },
];

export default function DemoPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Product tour</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#0F2A4A] sm:text-4xl">See V77 Trust without signing in</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          Screenshots generated from the live product UI (V77 Trust by {COMPANY.legalName}). For a guided walkthrough with your
          systems,{" "}
          <Link href="/#request-pilot" className="font-semibold text-sky-800 hover:underline">
            request a pilot
          </Link>
          .
        </p>
        <div className="mt-10 space-y-10">
          {SHOTS.map((s, i) => (
            <figure key={s.src} className="card overflow-hidden p-0">
              <div className="border-b border-[#d7e6ef] bg-slate-50 px-4 py-3 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Step {i + 1}</p>
                <h2 className="text-lg font-semibold text-[#0F2A4A]">{s.title}</h2>
                <p className="text-sm text-slate-600">{s.body}</p>
              </div>
              <div className="bg-[radial-gradient(ellipse_at_top,_#e8f7fd_0%,_#ffffff_55%)] p-3 sm:p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.title} className="mx-auto w-full max-w-3xl rounded-xl border border-[#d7e6ef] shadow-sm" />
              </div>
            </figure>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/#risk-checker" className="btn btn-primary">
            Try the risk tier checker
          </Link>
          <Link href="/signup" className="btn btn-secondary">
            Create organisation
          </Link>
        </div>
      </section>
    </MarketingChrome>
  );
}
