"use client";

import { useState } from "react";

type Q = { id: string; section: string; prompt: string };

export function VendorPublicForm({
  token,
  vendorName,
  questions,
  locked,
}: {
  token: string;
  vendorName: string;
  questions: Q[];
  locked: boolean;
}) {
  const [done, setDone] = useState(locked);
  const [msg, setMsg] = useState(locked ? "Already submitted." : "");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (done) return;
    const fd = new FormData(e.currentTarget);
    const answers: Record<string, string> = {};
    for (const q of questions) answers[q.id] = String(fd.get(q.id) || "");
    const res = await fetch("/api/vendors/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, answers }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setDone(true);
      setMsg(`Submitted. Risk signal: ${body.riskScore || "recorded"}.`);
    } else setMsg(body.error || "Submit failed");
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#0F2A4A]">Vendor questionnaire — {vendorName}</h1>
      <p className="text-sm text-slate-600">
        Complete this third-party AI risk form for V77 Trust. Do not paste secrets. Operated by Vertex77 sp. z o.o.
      </p>
      {questions.map((q) => (
        <div key={q.id}>
          <label className="block text-sm font-semibold text-[#0F2A4A]" htmlFor={q.id}>
            <span className="text-xs font-normal uppercase text-sky-700">{q.section}</span>
            <br />
            {q.prompt}
          </label>
          <textarea id={q.id} name={q.id} className="textarea mt-2" disabled={done} required={!done} />
        </div>
      ))}
      {!done ? (
        <button type="submit" className="btn btn-primary">
          Submit responses
        </button>
      ) : null}
      {msg ? <p className="text-sm text-sky-800">{msg}</p> : null}
    </form>
  );
}
