"use client";

import { COMPANY } from "@/lib/company";
import { useState } from "react";

export function PilotRequestForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("loading");
    setError("");
    const fd = new FormData(form);
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
    form.reset();
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-[#0F2A4A]">
        Thanks — we&apos;ve received your request. We&apos;ll be in touch within 2 business days.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="pilot-name" className="mb-1 block text-xs font-semibold text-slate-600">
            Name
          </label>
          <input id="pilot-name" name="name" className="input" required autoComplete="name" />
        </div>
        <div>
          <label htmlFor="pilot-email" className="mb-1 block text-xs font-semibold text-slate-600">
            Work email
          </label>
          <input id="pilot-email" name="email" type="email" className="input" required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="pilot-company" className="mb-1 block text-xs font-semibold text-slate-600">
            Organisation
          </label>
          <input id="pilot-company" name="company" className="input" autoComplete="organization" />
        </div>
        <div>
          <label htmlFor="pilot-role" className="mb-1 block text-xs font-semibold text-slate-600">
            Role
          </label>
          <input id="pilot-role" name="roleTitle" className="input" placeholder="CISO / AI lead / Auditor" autoComplete="organization-title" />
        </div>
      </div>
      <div>
        <label htmlFor="pilot-message" className="mb-1 block text-xs font-semibold text-slate-600">
          What should we cover in a pilot?
        </label>
        <textarea id="pilot-message" name="message" className="textarea" placeholder="Frameworks, systems in scope, timeline…" />
      </div>
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <button className="btn btn-primary" disabled={status === "loading"}>
        {status === "loading" ? "Submitting…" : "Request a pilot"}
      </button>
      <p className="text-xs text-slate-500">
        We&apos;ll be in touch within 2 business days. Sales:{" "}
        <a className="font-medium text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
          {COMPANY.salesEmail}
        </a>
        . Data Controller: {COMPANY.legalName} ({COMPANY.addressLine}) — processed under GDPR Art. 6(1)(b) to respond to your enquiry. See{" "}
        <a className="font-medium text-sky-700 hover:underline" href="/privacy">
          Privacy Notice
        </a>
        .
      </p>
    </form>
  );
}
