"use client";

import { useState } from "react";

export function PilotRequestForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        company: fd.get("company"),
        roleTitle: fd.get("roleTitle"),
        message: fd.get("message"),
        source: "landing_pilot_cta",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not submit request");
      setStatus("error");
      return;
    }
    setStatus("done");
    e.currentTarget.reset();
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-[#0F2A4A]">
        Thanks — we&apos;ve received your request. We&apos;ll be in touch within 2 business days.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" id="request-pilot">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Name</label>
          <input name="name" className="input" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Work email</label>
          <input name="email" type="email" className="input" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Organisation</label>
          <input name="company" className="input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Role</label>
          <input name="roleTitle" className="input" placeholder="CISO / AI lead / Auditor" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">What should we cover in a pilot?</label>
        <textarea name="message" className="textarea" placeholder="Frameworks, systems in scope, timeline…" />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className="btn btn-primary" disabled={status === "loading"}>
        {status === "loading" ? "Submitting…" : "Request a pilot"}
      </button>
      <p className="text-xs text-slate-500">We&apos;ll be in touch within 2 business days.</p>
    </form>
  );
}
