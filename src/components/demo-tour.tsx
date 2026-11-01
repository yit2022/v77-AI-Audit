"use client";

import { useEffect, useMemo, useState } from "react";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to the buyer demo",
    body: "This guided tour walks through inventory → assessment → evidence → Trust Center using a seeded sample organisation.",
  },
  {
    id: "inventory",
    title: "AI system inventory",
    body: "Start with the sample “Customer Support Copilot”. Open Inventory to review risk tier, owner, and purpose.",
    href: "/inventory",
  },
  {
    id: "assess",
    title: "Run an assessment",
    body: "Assessments score controls against EU AI Act obligations. Open Assessments and review the sample system.",
    href: "/assessments",
  },
  {
    id: "evidence",
    title: "Evidence & requests",
    body: "Evidence requests keep proof fresh. Visit Evidence Requests to see cadence and assignees.",
    href: "/evidence-requests",
  },
  {
    id: "board",
    title: "Board pack",
    body: "Generate a board PDF with readiness scores across AI Act, GDPR, DORA, and ISO 27001.",
    href: "/board-report",
  },
  {
    id: "trust",
    title: "Trust Center",
    body: "Share a public-ready Trust Center snapshot with buyers and auditors.",
    href: "/trust-center",
  },
] as const;

const STORAGE_KEY = "v77_demo_tour_v1";

export function DemoTour({ forceOpen = false }: { forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [forceOpen]);

  const current = STEPS[step];
  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  function dismiss(permanent: boolean) {
    setOpen(false);
    if (permanent) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }

  if (!open || !current) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Guided demo</p>
        <button type="button" className="text-xs text-slate-500 hover:text-slate-800" onClick={() => dismiss(true)}>
          Skip
        </button>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded bg-slate-100">
        <div className="h-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{current.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{current.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {"href" in current && current.href ? (
          <a
            href={current.href}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            Open step
          </a>
        ) : null}
        {step > 0 ? (
          <button type="button" className="text-xs text-slate-600" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800"
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white"
            onClick={() => dismiss(true)}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
