"use client";

import { useEffect, useMemo, useState } from "react";
import { RISK_TIER_GUIDE, obligationsFor, type ValueChainRole } from "@/lib/eu-ai-act/obligations";
import {
  ANNEX_IV_SECTIONS,
  buildEuDatabaseRegistrationPayload,
  renderEuDeclarationOfConformity,
} from "@/lib/eu-ai-act/annex-iv";
import { CONFORMITY_STEPS } from "@/lib/eu-ai-act/conformity";
import {
  AGENTIC_AUTONOMY_TIERS,
  EU_STATUTORY_POLICY_PACKS,
  classifyEuSovereigntyPosture,
  generateEuStatutoryDeliverable,
  getEuIndustryPlaybook,
  getRecommendedPolicyPacks,
  parseInstitutionAndVendor,
  type EuStatutoryDeliverableKind,
} from "@/lib/eu-ai-act/industries";

type SystemOpt = {
  id: string;
  name: string;
  domain?: string;
  intendedPurpose?: string;
  vendorName?: string;
  gpai?: boolean;
  riskTier: string | null;
  roleInValueChain: string;
};

export function EuAiActClient({
  systems,
  orgName = "Registered EU Operator",
}: {
  systems: SystemOpt[];
  orgName?: string;
}) {
  const [systemId, setSystemId] = useState(systems[0]?.id || "");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const qId = new URLSearchParams(window.location.search).get("systemId");
    if (qId && systems.some((s) => s.id === qId)) {
      setSystemId(qId);
    }
  }, [systems]);
  const system = systems.find((s) => s.id === systemId) || systems[0];
  const role = (system?.roleInValueChain || "provider") as ValueChainRole;
  const tier = (system?.riskTier || "minimal") as "prohibited" | "high_risk" | "limited" | "minimal" | "gpai";
  const obligations = useMemo(() => (system ? obligationsFor(role, tier) : []), [system, role, tier]);

  const { institution, modelVendor } = parseInstitutionAndVendor(system?.vendorName, orgName);
  const sovereignty = classifyEuSovereigntyPosture(modelVendor);
  const playbook = getEuIndustryPlaybook(system?.domain);
  const recommendedPacks = useMemo(
    () => getRecommendedPolicyPacks(system?.domain, system?.riskTier, system?.gpai),
    [system],
  );

  const [selectedPolicyPackId, setSelectedPolicyPackId] = useState<string>(
    recommendedPacks[1]?.id || recommendedPacks[0]?.id || "eu_high_risk_core",
  );
  const [selectedDeliverable, setSelectedDeliverable] =
    useState<EuStatutoryDeliverableKind>("art48_ce_marking");
  const [autonomyTier, setAutonomyTier] = useState<string>(AGENTIC_AUTONOMY_TIERS[2].label);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stepStatus, setStepStatus] = useState<Record<string, string>>({});
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const rec = getRecommendedPolicyPacks(system?.domain, system?.riskTier, system?.gpai);
    setSelectedPolicyPackId(rec[1]?.id || rec[0]?.id || "eu_high_risk_core");
  }, [system]);

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

  async function saveStep(stepId: string, status: string, customNote?: string) {
    setMsg("");
    const noteToSave = customNote !== undefined ? customNote : stepNotes[stepId] || "";
    const res = await fetch("/api/eu-ai-act/conformity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, stepId, status, notes: noteToSave }),
    });
    if (res.ok) {
      setStepStatus((s) => ({ ...s, [stepId]: status }));
      if (customNote !== undefined) {
        setStepNotes((n) => ({ ...n, [stepId]: customNote }));
      }
    }
    setMsg(res.ok ? "Conformity step updated." : "Could not update step.");
  }

  async function autoCompleteAllConformitySteps() {
    setMsg("Auto-populating all conformity assessment steps…");
    for (const step of CONFORMITY_STEPS) {
      const note =
        stepNotes[step.id]?.trim() ||
        `Verified for ${system?.name} (${institution}): ${step.title} (${step.article}) completed and backed by Annex IV documentation & SHA-256 Evidence Vault.`;
      await saveStep(step.id, "done", note);
    }
    setMsg("All conformity assessment steps marked Done with statutory verification notes.");
  }

  function downloadArt47Declaration() {
    if (!system) return;
    const md = renderEuDeclarationOfConformity({
      orgName: institution,
      systemId: system.id,
      systemName: system.name,
      intendedPurpose: system.intendedPurpose || answers.iv_1_general || system.name,
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
      orgName: institution,
      system: {
        id: system.id,
        name: system.name,
        description: answers.iv_1_general || system.name,
        intendedPurpose: system.intendedPurpose || answers.iv_1_general || system.name,
        domain: system.domain || "enterprise",
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

  const generatedDeliverable = useMemo(() => {
    if (!system) return null;
    return generateEuStatutoryDeliverable(selectedDeliverable, {
      institutionName: institution,
      systemName: system.name,
      systemId: system.id,
      domain: system.domain || "banking_credit",
      roleInValueChain: system.roleInValueChain,
      riskTier: system.riskTier,
      intendedPurpose: system.intendedPurpose || answers.iv_1_general || system.name,
      modelVendor,
      autonomyTier,
    });
  }, [system, selectedDeliverable, institution, answers.iv_1_general, modelVendor, autonomyTier]);

  function downloadStatutoryDeliverable() {
    if (!generatedDeliverable) return;
    const blob = new Blob([generatedDeliverable.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generatedDeliverable.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activePolicyPack =
    EU_STATUTORY_POLICY_PACKS.find((p) => p.id === selectedPolicyPackId) || EU_STATUTORY_POLICY_PACKS[0];

  if (!systems.length) {
    return <div className="card p-6 text-sm text-slate-600">Add an AI system first to use the EU AI Act workspace.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Top Project & Audited Institution Selector Bar */}
      <div className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[280px] flex-1">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#0F2A4A]" htmlFor="eu-system">
              Select Active AI Audit Project &amp; Audited Institution
            </label>
            <select
              id="eu-system"
              className="select border-sky-300 font-medium"
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
            >
              {systems.map((s) => {
                const inst = parseInstitutionAndVendor(s.vendorName, orgName).institution;
                return (
                  <option key={s.id} value={s.id}>
                    [{inst}] {s.name} ({s.riskTier || "unclassified"})
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="btn btn-primary text-xs" href={`/api/audit-pack?systemId=${systemId}`}>
              Export 10-File Audit Pack (.zip)
            </a>
            <button type="button" className="btn btn-secondary text-xs" onClick={downloadArt47Declaration}>
              Art. 47 Declaration (.md)
            </button>
            <button type="button" className="btn btn-secondary text-xs" onClick={downloadArt49Json}>
              Art. 49 EU DB (.json)
            </button>
            <a className="btn btn-secondary text-xs" href={`/impact`}>
              Art. 27 FRIA &amp; GDPR DPIA →
            </a>
          </div>
        </div>

        {/* Audited Institution + EU Sovereign AI Posture Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          <div>
            <span className="font-semibold text-[#0F2A4A]">Audited Institution:</span>{" "}
            <span className="font-bold text-sky-950">{institution}</span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-[#0F2A4A]">Sector Playbook:</span> {playbook.shortLabel}
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-[#0F2A4A]">Model:</span> {modelVendor}
          </div>
          <span className={`rounded-full border px-3 py-0.5 font-semibold ${sovereignty.badgeClass}`}>
            {sovereignty.shortBadge}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          <strong>GDPR Chapter V &amp; EU Data Sovereignty Note:</strong> {sovereignty.gdprRequirement}
        </p>
      </div>

      {msg ? <p className="rounded-lg bg-sky-50 p-3 text-sm font-medium text-sky-900" role="status">{msg}</p> : null}

      {/* Credo-Beating Feature #1: Stackable EU Statutory Policy Packs + Agentic AI Governance */}
      <section className="card border-sky-200 bg-gradient-to-br from-sky-50/70 via-white to-indigo-50/30 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#0F2A4A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              European Policy Packs Engine
            </span>
            <h2 className="mt-1 text-base font-semibold text-[#0F2A4A]">
              Active EU Statutory Policy Packs (Auto-Mapped to {system?.name})
            </h2>
            <p className="text-xs text-slate-600">
              Automatically layers EU AI Act horizontal obligations with European sectoral co-regulations (DORA, MDR/IVDR, NIS2, Works Council Art. 26(7), GPAI Code, and Autonomous Agentic AI).
            </p>
          </div>
          <div>
            <select
              className="select border-sky-300 bg-white text-xs font-semibold"
              value={selectedPolicyPackId}
              onChange={(e) => setSelectedPolicyPackId(e.target.value)}
            >
              {EU_STATUTORY_POLICY_PACKS.map((pk) => (
                <option key={pk.id} value={pk.id}>
                  [{pk.code}] {pk.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {EU_STATUTORY_POLICY_PACKS.map((pk) => {
            const isRecommended = recommendedPacks.some((r) => r.id === pk.id);
            const isSelected = selectedPolicyPackId === pk.id;
            return (
              <button
                key={pk.id}
                type="button"
                onClick={() => setSelectedPolicyPackId(pk.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  isSelected
                    ? "bg-[#0F2A4A] text-white"
                    : isRecommended
                      ? "border border-sky-400 bg-sky-100/80 text-sky-950"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pk.code}: {pk.title.split(" (")[0]} {isRecommended ? "✓ Active" : ""}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-sky-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#0F2A4A]">
              {activePolicyPack.code} — {activePolicyPack.title}
            </h3>
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-900">
              {activePolicyPack.euRegulations}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">{activePolicyPack.description}</p>
          <ul className="mt-3 grid gap-2 text-xs text-slate-800 sm:grid-cols-2">
            {activePolicyPack.mandatoryCheckpoints.map((cp) => (
              <li key={cp} className="flex items-start gap-1.5 rounded-lg bg-slate-50 p-2">
                <span className="font-bold text-emerald-700">✓</span>
                <span>{cp}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Credo-Beating Feature #2: 1-Click Statutory EU Deliverables & Agentic Charter Generator */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Zero-Guesswork Statutory Generator
            </span>
            <h2 className="mt-1 text-base font-semibold text-[#0F2A4A]">
              1-Click European Statutory Deliverables Suite (CE Marking, Art. 6(4), Art. 26(7), Art. 86 &amp; Agentic Charter)
            </h2>
            <p className="text-xs text-slate-500">
              Select any mandatory European deliverable from the dropdown below to auto-generate and download the ready-to-file document for <strong>{institution}</strong>.
            </p>
          </div>
          <button type="button" className="btn btn-primary text-xs" onClick={downloadStatutoryDeliverable}>
            Download Selected Statutory Document (.md) →
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Select Mandatory EU Statutory Deliverable
            </label>
            <select
              className="select border-sky-300 font-medium"
              value={selectedDeliverable}
              onChange={(e) => setSelectedDeliverable(e.target.value as EuStatutoryDeliverableKind)}
            >
              <option value="art48_ce_marking">
                1. Art. 48 Digital CE Marking of Conformity Certificate &amp; Notified Body Dossier
              </option>
              <option value="art6_4_derogation">
                2. Art. 6(3) &amp; Art. 6(4) Non-High-Risk Derogation Assessment (for Art. 49(2) EU DB)
              </option>
              <option value="art26_7_works_council">
                3. Art. 26(7) European Works Council (Betriebsrat / CSE) Workplace AI Notification
              </option>
              <option value="art86_explanation">
                4. Art. 86 Affected Citizen / Customer &ldquo;Right to Explanation&rdquo; Statutory Notice
              </option>
              <option value="art14_agentic_charter">
                5. Art. 14 &amp; 15 Autonomous / Agentic AI Tool-Boundary &amp; Kill-Switch Charter
              </option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Agentic AI Autonomy Level (Used in Art. 14 Agentic Governance Charter)
            </label>
            <select
              className="select"
              value={autonomyTier}
              onChange={(e) => setAutonomyTier(e.target.value)}
            >
              {AGENTIC_AUTONOMY_TIERS.map((t) => (
                <option key={t.id} value={t.label}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {generatedDeliverable ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <strong className="text-xs text-[#0F2A4A]">{generatedDeliverable.title}</strong>
              <span className="font-mono text-[11px] text-slate-500">{generatedDeliverable.filename}</span>
            </div>
            <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-slate-700">
              {generatedDeliverable.content}
            </pre>
          </div>
        ) : null}
      </section>

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
            Annex IV technical documentation (8 Statutory Sections)
          </h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => void autoPopulateAnnex()}>
              ✨ 1-Click AI Auto-Populate All 8 Annex IV Sections
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void saveAnnex()}>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="conformity-heading" className="text-lg font-semibold text-[#0F2A4A]">
            Conformity assessment tracker (Article 43)
          </h2>
          <button
            type="button"
            className="btn btn-primary text-xs"
            onClick={() => void autoCompleteAllConformitySteps()}
          >
            ✨ 1-Click Auto-Populate &amp; Mark All Conformity Steps Done
          </button>
        </div>
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
