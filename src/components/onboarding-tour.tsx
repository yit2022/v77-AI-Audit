"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ONBOARDING_STEPS, ONBOARDING_STORAGE_KEY } from "@/lib/onboarding/steps";

/**
 * Non-blocking product tour. NEVER uses a full-screen inset-0 overlay —
 * that intercepted all sidebar/main clicks and made the app unusable.
 */
export function OnboardingTour({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) {
        setOpen(true);
      } else {
        const parsed = JSON.parse(raw) as { completed?: boolean; index?: number };
        if (!parsed.completed) {
          setIndex(Math.min(parsed.index ?? 0, ONBOARDING_STEPS.length - 1));
          setOpen(true);
        }
      }
    } catch {
      setOpen(true);
    }
    setHydrated(true);
  }, []);

  function persist(next: { completed?: boolean; index?: number }) {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
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

  if (!hydrated) return null;

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
    <div
      className="fixed bottom-4 right-4 z-40 w-[min(100%-2rem,24rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
      role="dialog"
      aria-modal="false"
      aria-labelledby="onboarding-tour-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
            Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}
          </p>
          <h2 id="onboarding-tour-title" className="mt-1 text-sm font-semibold text-slate-900">
            Step {index + 1} of {ONBOARDING_STEPS.length}: {step.title}
          </h2>
        </div>
        <button type="button" className="text-xs text-slate-500 hover:text-slate-800" onClick={() => close(true)}>
          Skip
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
      <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="rounded-full bg-sky-400 transition-all"
          style={{ width: `${((index + 1) / ONBOARDING_STEPS.length) * 100}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Link
          href={step.href}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
          onClick={() => persist({ completed: false, index })}
        >
          Open {step.title.split(" ")[0].toLowerCase()}
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 disabled:opacity-40"
            disabled={index === 0}
            onClick={() => {
              const n = Math.max(0, index - 1);
              setIndex(n);
              persist({ completed: false, index: n });
            }}
          >
            Back
          </button>
          <button
            type="button"
            className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
            onClick={next}
          >
            {index >= ONBOARDING_STEPS.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
