"use client";

import { useEffect, useMemo, useState } from "react";
import { RISK_TIER_GUIDE, obligationsFor, type ValueChainRole } from "@/lib/eu-ai-act/obligations";
import {
  ANNEX_IV_SECTIONS,
  buildEuDatabaseRegistrationPayload,
  renderEuDeclarationOfConformity,
} from "@/lib/eu-ai-act/annex-iv";
import { CONFORMITY_STEPS } from "@/lib/eu-ai-act/conformity";

type SystemOpt = {
  id: string;
  name: string;
  riskTier: string | null;
  roleInValueChain: string;
};

export function EuAiActClient({ systems }: { systems: SystemOpt[] }) {
  const [systemId, setSystemId] = useState(systems[0]?.id || "");
  const system = systems.find((s) => s.id === systemId) || systems[0];
  const role = (system?.roleInValueChain || "provider") as ValueChainRole;
  const tier = (system?.riskTier || "minimal") as "prohibited" | "high_risk" | "limited" | "minimal" | "gpai";
  const obligations = useMemo(() => (system ? obligationsFor(role, tier) : []), [system, role, tier]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stepStatus, setStepStatus] = useState<Record<string, string>>({});
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!systemId) return;
    setMsg("");
    void (async () => {
      const [a, c] = await Promise.all([
        fetch(`/api/eu-ai-act/annex?systemId=${systemId}`).then((r) => r.json()),
        fetch(`/api/eu-ai-act/conformity?systemId=${systemId}`).then((r) => r.json()),
      ]);
      try {
        setAnswers(a.doc ? JSON.parse(a.doc.answersJson || "{}") : {});
      } catch {
        setAnswers({});
      }
      const st: Record<string, string> = {};
      const notes: Record<string, string> = {};
      for (const row of c.steps || []) {
        st[row.stepId] = row.status;
        notes[row.stepId] = row.notes || "";
      }
      setStepStatus(st);
      setStepNotes(notes);
    })();
  }, [systemId]);

  async function saveAnnex() {
    setMsg("");
    const res = await fetch("/api/eu-ai-act/annex", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, answers }),
    });
    setMsg(res.ok ? "Annex IV draft saved." : "Could not save Annex IV draft.");
  }

  async function autoPopulateAnnex() {
    setMsg("");
    const res = await fetch("/api/eu-ai-act/annex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId }),
    });
    if (!res.ok) {
      setMsg("Could not auto-populate Annex IV draft.");
      return;
    }
    const body = (await res.json().catch(() => ({}))) as { answers?: Record<string, string> };
    if (body.answers) {
      setAnswers(body.answers);
    }
    setMsg("Annex IV drafted automatically from system metadata, controls, and test runs.");
  }

  async function saveStep(stepId: string, status: string) {
    setMsg("");
    const res = await fetch("/api/eu-ai-act/conformity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, stepId, status, notes: stepNotes[stepId] || "" }),
    });
    if (res.ok) setStepStatus((s) => ({ ...s, [stepId]: status }));
    setMsg(res.ok ? "Conformity step updated." : "Could not update step.");
  }

  function downloadArt47Declaration() {
    if (!system) return;
    const md = renderEuDeclarationOfConformity({
      orgName: "Registered EU Operator",
      systemId: system.id,
      systemName: system.name,
      intendedPurpose: answers.iv_1_general || system.name,
      riskTier: system.riskTier,
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eu-declaration-of-conformity-art47-${system.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadArt49Json() {
    if (!system) return;
    const payload = buildEuDatabaseRegistrationPayload({
      orgName: "Registered EU Operator",
      system: {
        id: system.id,
        name: system.name,
        description: answers.iv_1_general || system.name,
        intendedPurpose: answers.iv_1_general || system.name,
        domain: "enterprise",
        riskTier: system.riskTier,
        roleInValueChain: system.roleInValueChain,
      },
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eu-database-registration-art49-${system.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!systems.length) {
    return <div className="card p-6 text-sm text-slate-600">Add an AI system first to use the EU AI Act workspace.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="eu-system">
            System
          </label>
          <select id="eu-system" className="select w-72" value={systemId} onChange={(e) => setSystemId(e.target.value)}>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <a className="btn btn-secondary" href={`/api/audit-pack?systemId=${systemId}`}>
          Export audit pack (ZIP)
        </a>
        <button type="button" className="btn btn-secondary" onClick={downloadArt47Declaration}>
          Download Art. 47 Declaration (.md)
        </button>
        <button type="button" className="btn btn-secondary" onClick={downloadArt49Json}>
          Download Art. 49 EU DB (.json)
        </button>
        <a className="btn btn-secondary" href={`/impact`}>
          Open FRIA / DPIA
        </a>
      </div>
      {msg ? <p className="text-sm text-sky-800" role="status">{msg}</p> : null}

      <section aria-labelledby="risk-tiers-heading">
        <h2 id="risk-tiers-heading" className="text-lg font-semibold text-[#0F2A4A]">
          Risk tiers
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RISK_TIER_GUIDE.map((r) => (
            <div
              key={r.id}
              className={`card p-4 ${system?.riskTier === r.id ? "border-sky-400 ring-1 ring-sky-200" : ""}`}
            >
              <div className="text-sm font-semibold text-[#0F2A4A]">{r.title}</div>
              <p className="mt-1 text-sm text-slate-600">{r.summary}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Selected system role: <strong>{role}</strong> · classified tier: <strong>{system?.riskTier || "unclassified"}</strong>
        </p>
      </section>

      <section aria-labelledby="obligations-heading">
        <h2 id="obligations-heading" className="text-lg font-semibold text-[#0F2A4A]">
          Obligations checklist ({role})
        </h2>
        <ul className="mt-3 space-y-2">
          {obligations.map((o) => (
            <li key={o.id} className="card p-4">
              <div className="font-medium text-[#0F2A4A]">
                {o.title} <span className="text-xs font-normal text-slate-500">· {o.article}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{o.detail}</p>
            </li>
          ))}
          {obligations.length === 0 ? (
            <li className="text-sm text-slate-600">No mandatory checklist items for this role/tier combination.</li>
          ) : null}
        </ul>
      </section>

      <section aria-labelledby="annex-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="annex-heading" className="text-lg font-semibold text-[#0F2A4A]">
            Annex IV technical documentation
          </h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => void autoPopulateAnnex()}>
              Auto-populate from system &amp; test evidence
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void saveAnnex()}>
              Save draft
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-4">
          {ANNEX_IV_SECTIONS.map((s) => (
            <div key={s.id} className="card p-4">
              <label className="block text-sm font-semibold text-[#0F2A4A]" htmlFor={s.id}>
                {s.title}
              </label>
              <p className="mt-1 text-xs text-slate-500">
                {s.annexRef} — {s.guidance}
              </p>
              <textarea
                id={s.id}
                className="textarea mt-2"
                value={answers[s.id] || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [s.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="conformity-heading">
        <h2 id="conformity-heading" className="text-lg font-semibold text-[#0F2A4A]">
          Conformity assessment tracker
        </h2>
        <div className="mt-3 space-y-3">
          {CONFORMITY_STEPS.map((step) => (
            <div key={step.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-medium text-[#0F2A4A]">
                    {step.title} <span className="text-xs font-normal text-slate-500">· {step.article}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{step.detail}</p>
                </div>
                <select
                  className="select w-full sm:w-44"
                  aria-label={`Status for ${step.title}`}
                  value={stepStatus[step.id] || "not_started"}
                  onChange={(e) => void saveStep(step.id, e.target.value)}
                >
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <label className="mt-2 block text-xs font-semibold text-slate-600" htmlFor={`notes-${step.id}`}>
                Notes
              </label>
              <textarea
                id={`notes-${step.id}`}
                className="textarea mt-1"
                value={stepNotes[step.id] || ""}
                onChange={(e) => setStepNotes((n) => ({ ...n, [step.id]: e.target.value }))}
                onBlur={() => void saveStep(step.id, stepStatus[step.id] || "not_started")}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
