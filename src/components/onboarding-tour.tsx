"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ONBOARDING_STEPS, ONBOARDING_STORAGE_KEY } from "@/lib/onboarding/steps";

export function OnboardingTour({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) {
        setOpen(true);
        return;
      }
      const parsed = JSON.parse(raw) as { completed?: boolean; index?: number };
      if (!parsed.completed) {
        setIndex(Math.min(parsed.index ?? 0, ONBOARDING_STEPS.length - 1));
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function persist(next: { completed?: boolean; index?: number }) {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
  }

  function close(completed: boolean) {
    persist({ completed, index });
    setOpen(false);
  }

  function next() {
    if (index >= ONBOARDING_STEPS.length - 1) {
      close(true);
      return;
    }
    const n = index + 1;
    setIndex(n);
    persist({ completed: false, index: n });
  }

  if (!open) {
    return (
      <button
        type="button"
        className="fixed bottom-5 right-5 z-40 rounded-full border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-900 shadow-md hover:bg-sky-50"
        onClick={() => {
          setIndex(0);
          setOpen(true);
          persist({ completed: false, index: 0 });
        }}
      >
        Restart tour
      </button>
    );
  }

  const step = ONBOARDING_STEPS[index];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="card w-full max-w-lg p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
              Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Step {index + 1} of {ONBOARDING_STEPS.length}: {step.title}
            </h2>
          </div>
          <button type="button" className="text-sm text-slate-500 hover:text-slate-800" onClick={() => close(true)}>
            Skip
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.body}</p>
        <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="rounded-full bg-sky-400 transition-all"
            style={{ width: `${((index + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <Link href={step.href} className="btn btn-secondary" onClick={() => persist({ completed: false, index })}>
            Open {step.title.split(" ")[0].toLowerCase()}
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={index === 0}
              onClick={() => {
                const n = Math.max(0, index - 1);
                setIndex(n);
                persist({ completed: false, index: n });
              }}
            >
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={next}>
              {index >= ONBOARDING_STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
