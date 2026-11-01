"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Q = { id: string; prompt: string; guidance: string; euRef: string; required: boolean };

export function ImpactEditor({
  impactId,
  status,
  questions,
  answers: initial,
}: {
  impactId: string;
  status: string;
  questions: Q[];
  answers: Record<string, string>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(nextStatus?: string) {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/impact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: impactId, answers, status: nextStatus }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage(body.error || "Save failed");
      return;
    }
    setMessage(nextStatus === "complete" ? "Marked complete." : "Saved.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <label className="text-sm font-semibold text-slate-900" htmlFor={q.id}>
              {q.prompt}{q.required ? " *" : ""}
            </label>
            <span className="shrink-0 text-xs text-sky-700">{q.euRef}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{q.guidance}</p>
          <textarea
            id={q.id}
            className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm"
            rows={4}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => save()}>
          Save draft
        </button>
        <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => save("in_review")}>
          Submit for review
        </button>
        <button className="btn btn-primary" type="button" disabled={busy} onClick={() => save("complete")}>
          Mark complete
        </button>
        <span className="self-center text-sm text-slate-500">Current: {status.replaceAll("_", " ")}</span>
        {message ? <span className="self-center text-sm text-sky-900">{message}</span> : null}
      </div>
    </div>
  );
}
