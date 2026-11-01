"use client";

import { useMemo, useState } from "react";
import { PUBLIC_RISK_QUESTIONS } from "@/lib/risk-checker/public";
import type { Answer } from "@/lib/classification";

type Result = {
  tier: string;
  label: string;
  summary: string;
  nextSteps: string[];
  disclaimer: string;
};

export function RiskTierChecker() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [err, setErr] = useState("");

  const q = PUBLIC_RISK_QUESTIONS[step];
  const progress = useMemo(
    () => Math.round(((step + (result ? 1 : 0)) / PUBLIC_RISK_QUESTIONS.length) * 100),
    [step, result],
  );

  async function choose(a: Answer) {
    if (!q) return;
    const next = { ...answers, [q.id]: a };
    setAnswers(next);
    if (step < PUBLIC_RISK_QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/risk-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed");
      setResult(body.result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!result) return;
    setBusy(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/risk-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          saveLead: true,
          name: fd.get("name"),
          email: fd.get("email"),
          company: fd.get("company"),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not save");
      setLeadDone(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="risk-checker" className="card overflow-hidden">
      <div className="border-b border-[#d7e6ef] bg-sky-50/70 px-5 py-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Lead magnet · no login</p>
        <h2 className="mt-1 text-xl font-semibold text-[#0F2A4A] sm:text-2xl">AI Act risk tier checker</h2>
        <p className="mt-1 text-sm text-slate-600">
          Answer {PUBLIC_RISK_QUESTIONS.length} questions for an indicative EU AI Act tier. Then request a pilot —
          we store the lead in V77 (no email send from the app).
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {!result && q ? (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              {q.section.replace("_", " ")} · {step + 1}/{PUBLIC_RISK_QUESTIONS.length}
            </p>
            <p className="mt-2 text-base font-medium text-[#0F2A4A]">{q.prompt}</p>
            <p className="mt-2 text-xs text-slate-500">{q.help}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(["yes", "no", "na"] as Answer[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  className="btn btn-secondary min-w-[5.5rem] capitalize"
                  disabled={busy}
                  onClick={() => void choose(a)}
                >
                  {a === "na" ? "N/A" : a}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <div>
              <span className="badge badge-high text-sm">{result.label}</span>
              <p className="mt-3 text-sm text-slate-700">{result.summary}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {result.nextSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">{result.disclaimer}</p>
            </div>

            {leadDone ? (
              <p className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-[#0F2A4A]">
                Thanks — your pilot request is saved. We&apos;ll be in touch within 2 business days.
              </p>
            ) : (
              <form onSubmit={saveLead} className="space-y-3 rounded-2xl border border-[#d7e6ef] bg-slate-50/80 p-4">
                <h3 className="font-semibold text-[#0F2A4A]">Request a pilot with this result</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="name" className="input" placeholder="Name" required />
                  <input name="email" type="email" className="input" placeholder="Work email" required />
                  <input name="company" className="input sm:col-span-2" placeholder="Organisation" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? "Saving…" : "Request a pilot"}
                </button>
              </form>
            )}

            <button
              type="button"
              className="text-sm font-semibold text-sky-800 hover:underline"
              onClick={() => {
                setResult(null);
                setAnswers({});
                setStep(0);
                setLeadDone(false);
              }}
            >
              Start over
            </button>
          </div>
        ) : null}

        {err ? <p className="mt-3 text-sm text-red-700">{err}</p> : null}
      </div>
    </div>
  );
}
