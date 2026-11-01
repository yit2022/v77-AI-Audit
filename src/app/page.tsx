export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { seedIfEmpty } from "@/lib/db/seed";

export default async function HomePage() {
  await seedIfEmpty();
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="card p-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          Tamalaki Business Network Ltd
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">V77 AI Auditor</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
          System of record and system of proof for AI. Inventory systems, classify EU AI Act risk,
          map controls across the EU AI Act, NIST AI RMF and ISO/IEC 42001, run fairness and red-team
          tests, collect evidence, and export auditor-ready reports.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="btn btn-primary">Sign in to demo</Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "AI inventory & roles",
            "EU risk classification",
            "Control crosswalk",
            "Assessments & owners",
            "Evidence vault",
            "Fairness + LLM red-team",
            "Auditor workspace",
            "HTML audit report",
          ].map((m) => (
            <div key={m} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              {m}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
