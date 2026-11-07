"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Assessment = {
  id: string;
  name: string;
  status: string;
  systemName: string;
  institutionName?: string;
};
type Comment = { id: string; body: string; authorName: string; createdAt: string };
type Signoff = { opinion: string; summary: string; signedAt: string } | null;

const OPINION_SUMMARY_TEMPLATES: Record<string, string[]> = {
  pass: [
    "Unqualified Conformity Opinion (Pass): Based on our examination of the 24 statutory controls, Annex IV technical documentation, Art. 27 FRIA, GDPR Art. 35 DPIA, Art. 10 Four-Fifths fairness verification, and Art. 15 OWASP Red-Team & Scored Evals, the AI system satisfies the applicable requirements of Regulation (EU) 2024/1689 (EU AI Act) and EN ISO/IEC 42001:2023.",
    "Unqualified Conformity Opinion (Pass — Financial / DORA Scope): All EU AI Act Chapter III / Annex III obligations, GDPR Art. 22 human intervention safeguards, and DORA (Reg. (EU) 2022/2554) ICT risk controls are verified and backed by SHA-256 evidence.",
  ],
  pass_with_findings: [
    "Qualified Conformity Opinion (Pass with Findings): The AI system demonstrates substantial conformity with Regulation (EU) 2024/1689 (EU AI Act), GDPR, and EN ISO/IEC 42001, subject to timely remediation of the non-blocking observations logged in the Findings Register prior to next post-market review (Art. 72).",
    "Qualified Conformity Opinion (Conditional Market Release): Technical robustness (Art. 15), fairness (Art. 10), and Annex IV documentation are verified; minor documentation updates on human oversight SOPs (Art. 14) are tracked with assigned remediation deadlines.",
  ],
  fail: [
    "Adverse Opinion (Non-Conformant / Blocker): Material non-conformities identified under EU AI Act Chapter III (e.g., incomplete Art. 10 fairness verification, missing Art. 14 human override controls, or unaddressed high-severity findings). Market placement or production deployment must be withheld until corrective actions are verified.",
  ],
};

const FINDING_PRESETS = [
  {
    title: "Art. 14 Human Oversight Override SOP Requires Formal Operator Sign-Off Log",
    severity: "medium",
    ref: "EU AI Act Art. 14 & Art. 26(2)",
    desc: "While human-in-the-loop review is active in the workflow, operator override rationale should be logged in structured form for Art. 12 / Art. 19 6-month retention.",
  },
  {
    title: "Art. 10 Subgroup Demographic Parity Monitoring Threshold Alert Needed",
    severity: "high",
    ref: "EU AI Act Art. 10(2)(f) & Art. 72",
    desc: "Configure automated post-market drift alerting if any protected subgroup Four-Fifths ratio approaches the 0.80 statutory threshold.",
  },
  {
    title: "Annex IV Section 3 Monitoring & Control Specifications Update Required",
    severity: "low",
    ref: "EU AI Act Art. 11 & Annex IV Sec. 3",
    desc: "Expand Annex IV Section 3 to include the latest versioned threshold parameters from the production release.",
  },
  {
    title: "Art. 27 FRIA Notification Package Ready for Market Surveillance Authority Filing",
    severity: "low",
    ref: "EU AI Act Art. 27(3)",
    desc: "FRIA is complete and verified; schedule formal notification submission to the relevant National Competent Authority.",
  },
];

const WORKING_PAPER_PRESETS = [
  "Verified SHA-256 cryptographic hashes in the Evidence Vault against Annex IV technical documentation and Art. 12 logging outputs; no integrity discrepancies found.",
  "Reviewed Art. 10 Four-Fifths disparate-impact run and Art. 15 OWASP LLM Top 10 adversarial red-team report; all critical guardrails passed.",
  "Confirmed Art. 27 Fundamental Rights Impact Assessment (FRIA) and GDPR Art. 35 DPIA are aligned and signed by the DPO / AI Risk Owner.",
];

type Dossier = {
  system: {
    id: string;
    name: string;
    domain: string;
    roleInValueChain: string;
    riskTier: string | null;
    intendedPurpose: string | null;
    classificationNotes: string | null;
  } | null;
  controls: Array<{
    id: string;
    status: string;
    notes: string | null;
    code: string;
    title: string;
    euRef: string;
    gdprRef: string;
    doraRef: string;
    isoRef: string;
  }>;
  evidence: Array<{
    id: string;
    title: string;
    filename: string;
    sha256: string;
    controlId: string | null;
  }>;
  findings: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    frameworkRef: string;
  }>;
  annexSectionsDrafted: number;
  friaCount: number;
  dpiaCount: number;
  latestFairness: { filename: string } | null;
  latestRedteam: { passCount: number; failCount: number; provider: string } | null;
  latestEval: { overallScore: string | number; passCount: number; failCount: number } | null;
};

export function AuditorClient({
  assessments,
  canSign,
}: {
  assessments: Assessment[];
  canSign: boolean;
}) {
  const [assessmentId, setAssessmentId] = useState(assessments[0]?.id ?? "");
  const [comments, setComments] = useState<Comment[]>([]);
  const [signoff, setSignoff] = useState<Signoff>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [body, setBody] = useState("");
  const [opinion, setOpinion] = useState("pass_with_findings");
  const [summary, setSummary] = useState("");
  const [msg, setMsg] = useState("");

  // Inline Auditor Finding creation
  const [findingTitle, setFindingTitle] = useState("");
  const [findingSeverity, setFindingSeverity] = useState("high");
  const [findingRef, setFindingRef] = useState("EU AI Act Art. 9 / DORA Art. 6");
  const [findingDesc, setFindingDesc] = useState("");

  async function load(id: string) {
    if (!id) return;
    const res = await fetch(`/api/auditor?assessmentId=${id}`);
    const data = await res.json();
    setComments(data.comments || []);
    setSignoff(data.signoff);
    setDossier(data.dossier || null);
  }

  useEffect(() => {
    load(assessmentId);
  }, [assessmentId]);

  async function addComment() {
    if (!body.trim()) return;
    await fetch("/api/auditor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, body }),
    });
    setBody("");
    setMsg("Working-paper comment added");
    load(assessmentId);
  }

  async function raiseFinding() {
    if (!findingTitle.trim() || !dossier?.system?.id) return;
    const res = await fetch("/api/findings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemId: dossier.system.id,
        title: findingTitle.trim(),
        severity: findingSeverity,
        frameworkRef: findingRef.trim() || "EU AI Act Art. 9",
        description: findingDesc.trim() || "Raised during formal EU AI Act / DORA audit review.",
      }),
    });
    if (res.ok) {
      setFindingTitle("");
      setFindingDesc("");
      setMsg("Audit finding logged and appended to SHA-256 audit log");
      load(assessmentId);
    }
  }

  async function doSignoff() {
    const res = await fetch("/api/auditor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signoff", assessmentId, opinion, summary }),
    });
    if (!res.ok) {
      setMsg("Sign-off failed");
      return;
    }
    setMsg("Formal statutory sign-off recorded in immutable SHA-256 log");
    load(assessmentId);
  }

  const controls = dossier?.controls || [];
  const implementedCount = controls.filter(
    (c) => c.status === "implemented" || c.status === "not_applicable" || c.status === "waived",
  ).length;
  const readinessPct = controls.length ? Math.round((implementedCount / controls.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Phase Selector & Engagement Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[280px] flex-1">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Select Audit Engagement (Audited Institution · AI Project &amp; Assessment)
            </label>
            <select
              className="select"
              value={assessmentId}
              onChange={(e) => setAssessmentId(e.target.value)}
            >
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.institutionName || "Audited Institution"}] {a.systemName} — {a.name} ({a.status.replaceAll("_", " ")})
                </option>
              ))}
            </select>
          </div>
          {dossier?.system ? (
            <div className="flex flex-wrap gap-2">
              <Link href={`/systems/${dossier.system.id}`} className="btn btn-secondary text-xs">
                System Command Center →
              </Link>
              <a className="btn btn-secondary text-xs" href={`/api/assessments/${assessmentId}/report`}>
                Download Signed PDF Report
              </a>
              <a className="btn btn-primary text-xs" href={`/api/audit-pack?systemId=${dossier.system.id}`}>
                Download 10-Artifact Audit Pack (.zip)
              </a>
            </div>
          ) : null}
        </div>

        {/* 5-Phase Auditor Procedure Guide */}
        <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs sm:grid-cols-5">
          <div className="rounded-lg bg-slate-50 p-2.5">
            <strong className="text-[#0F2A4A]">Phase 1: Scope &amp; Risk</strong>
            <p className="mt-0.5 text-slate-600">Verify Art. 5 / Annex III / Art. 6(3) classification &amp; DORA scope.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <strong className="text-[#0F2A4A]">Phase 2: Technical Lab</strong>
            <p className="mt-0.5 text-slate-600">Inspect Art. 10 Fairness, Art. 15 OWASP Red-Team &amp; Scored Evals.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <strong className="text-[#0F2A4A]">Phase 3: Statutory Docs</strong>
            <p className="mt-0.5 text-slate-600">Review Annex IV (8 sections), Art. 27 FRIA &amp; GDPR Art. 35 DPIA.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5">
            <strong className="text-[#0F2A4A]">Phase 4: Controls &amp; Vault</strong>
            <p className="mt-0.5 text-slate-600">Verify 24 controls, SHA-256 evidence hashes &amp; raise findings.</p>
          </div>
          <div className="rounded-lg bg-sky-50 p-2.5">
            <strong className="text-[#0F2A4A]">Phase 5: Statutory Opinion</strong>
            <p className="mt-0.5 text-slate-600">Issue formal opinion &amp; export Art. 47 / Art. 49 Audit Pack.</p>
          </div>
        </div>
      </div>

      {/* Phases 1, 2 & 3 Summary Cards */}
      {dossier?.system ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card space-y-2 p-5">
            <h2 className="text-sm font-semibold text-[#0F2A4A]">
              Phase 1: System Scope &amp; Statutory Classification
            </h2>
            <p className="text-xs text-slate-600">
              <strong>System:</strong> {dossier.system.name} ({dossier.system.domain} · {dossier.system.roleInValueChain})
            </p>
            <p className="text-xs text-slate-600">
              <strong>EU AI Act Risk Tier:</strong>{" "}
              <span className="font-bold uppercase text-sky-900">{dossier.system.riskTier || "unclassified"}</span>
            </p>
            <p className="text-xs text-slate-600">
              <strong>Intended Purpose:</strong> {dossier.system.intendedPurpose || "—"}
            </p>
            {dossier.system.classificationNotes ? (
              <p className="rounded bg-slate-50 p-2 text-xs text-slate-600">{dossier.system.classificationNotes}</p>
            ) : null}
          </div>

          <div className="card space-y-2 p-5">
            <h2 className="text-sm font-semibold text-[#0F2A4A]">
              Phase 2: Technical Verification Evidence (Art. 10 &amp; 15)
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex justify-between rounded bg-slate-50 px-2.5 py-1.5">
                <span>Fairness (Four-Fifths Rule):</span>
                <strong>{dossier.latestFairness ? `Verified (${dossier.latestFairness.filename})` : "Missing run"}</strong>
              </li>
              <li className="flex justify-between rounded bg-slate-50 px-2.5 py-1.5">
                <span>OWASP LLM Top 10 Red-Team:</span>
                <strong>
                  {dossier.latestRedteam
                    ? `${dossier.latestRedteam.passCount} pass / ${dossier.latestRedteam.failCount} fail`
                    : "Missing run"}
                </strong>
              </li>
              <li className="flex justify-between rounded bg-slate-50 px-2.5 py-1.5">
                <span>Scored Evaluation Benchmark:</span>
                <strong>
                  {dossier.latestEval
                    ? `${(Number(dossier.latestEval.overallScore) * 100).toFixed(0)}% (${dossier.latestEval.passCount} pass)`
                    : "Missing run"}
                </strong>
              </li>
            </ul>
          </div>

          <div className="card space-y-2 p-5">
            <h2 className="text-sm font-semibold text-[#0F2A4A]">
              Phase 3: Statutory Dossiers (Annex IV, FRIA &amp; DPIA)
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex justify-between rounded bg-slate-50 px-2.5 py-1.5">
                <span>Annex IV Technical File (Art. 11):</span>
                <Link href={`/eu-ai-act?systemId=${dossier.system.id}`} className="font-bold text-sky-700 hover:underline">
                  {dossier.annexSectionsDrafted}/8 sections →
                </Link>
              </li>
              <li className="flex justify-between rounded bg-slate-50 px-2.5 py-1.5">
                <span>Art. 27 FRIA &amp; GDPR Art. 35 DPIA:</span>
                <Link href="/impact" className="font-bold text-sky-700 hover:underline">
                  {dossier.friaCount} FRIA · {dossier.dpiaCount} DPIA →
                </Link>
              </li>
              <li className="flex justify-between rounded bg-slate-50 px-2.5 py-1.5">
                <span>SHA-256 Evidence Locker Items:</span>
                <Link href="/evidence" className="font-bold text-sky-700 hover:underline">
                  {dossier.evidence.length} hashed artifacts →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* Phase 4: 24-Control & SHA-256 Evidence Inspection Table */}
      {controls.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0F2A4A]">
                Phase 4: 24-Control Crosswalk &amp; SHA-256 Evidence Inspection ({implementedCount}/{controls.length} Ready — {readinessPct}%)
              </h2>
              <p className="text-xs text-slate-500">
                Verify control implementation notes and cryptographic SHA-256 evidence across EU AI Act, GDPR, DORA, and EN ISO/IEC 42001.
              </p>
            </div>
            <Link href={`/assessments/${assessmentId}`} className="btn btn-secondary text-xs">
              Edit Controls in Assessment →
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white text-[11px] uppercase text-slate-500 shadow-sm">
                <tr>
                  <th className="px-4 py-2">Control</th>
                  <th className="px-4 py-2">EU AI Act / GDPR / DORA / ISO 42001</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Implementer Notes</th>
                </tr>
              </thead>
              <tbody>
                {controls.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-semibold text-sky-700">{c.code}</span>
                      <div className="font-medium text-slate-900">{c.title}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      <div>EU AI Act: {c.euRef}</div>
                      <div>GDPR: {c.gdprRef} · DORA: {c.doraRef || "—"}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                          c.status === "implemented"
                            ? "bg-emerald-100 text-emerald-900"
                            : c.status === "in_progress"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{c.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Phase 5: Formal Sign-Off, Raise Finding & Working-Paper Comments */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card space-y-3 p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-[#0F2A4A]">
            Phase 5: Formal Statutory Audit Opinion &amp; Sign-Off
          </h2>
          {signoff ? (
            <div className="rounded-lg bg-sky-50 p-3 text-sm text-sky-950">
              <div className="font-semibold capitalize">
                Recorded Opinion: {signoff.opinion.replaceAll("_", " ")}
              </div>
              <p className="mt-1 text-sky-900">{signoff.summary}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No formal sign-off recorded for this engagement yet.</p>
          )}
          {canSign ? (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="block text-xs font-semibold text-slate-600">Audit Opinion</label>
              <select
                className="select"
                value={opinion}
                onChange={(e) => {
                  const nextOp = e.target.value;
                  setOpinion(nextOp);
                  const tpls = OPINION_SUMMARY_TEMPLATES[nextOp] || [];
                  if (tpls[0]) setSummary(tpls[0]);
                }}
              >
                <option value="pass">Pass (Unqualified Conformity)</option>
                <option value="pass_with_findings">Pass with findings (Qualified)</option>
                <option value="fail">Fail (Non-Conformant / Blocker)</option>
              </select>
              <select
                className="w-full rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 py-1 text-xs text-slate-700"
                value=""
                onChange={(e) => {
                  if (e.target.value) setSummary(e.target.value);
                }}
              >
                <option value="">✨ Select Pre-Populated Statutory Opinion Wording…</option>
                {(OPINION_SUMMARY_TEMPLATES[opinion] || []).map((tpl, idx) => (
                  <option key={idx} value={tpl}>
                    {tpl.slice(0, 80)}…
                  </option>
                ))}
              </select>
              <textarea
                className="textarea"
                placeholder="Executive audit opinion summary (EU AI Act Art. 43 / DORA / EN ISO/IEC 42001)…"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <button className="btn btn-primary w-full" onClick={doSignoff}>
                Record Formal Statutory Sign-Off
              </button>
            </div>
          ) : null}
          {msg ? <p className="text-xs font-medium text-emerald-700">{msg}</p> : null}
        </div>

        <div className="card space-y-3 p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-[#0F2A4A]">
            Raise Audit Finding (Non-Conformity / Gap)
          </h2>
          <p className="text-xs text-slate-500">
            Select a pre-populated statutory finding template or enter custom details ({dossier?.findings?.length || 0} existing findings).
          </p>
          <select
            className="w-full rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 py-1.5 text-xs text-slate-700"
            value=""
            onChange={(e) => {
              const idx = Number(e.target.value);
              const preset = FINDING_PRESETS[idx];
              if (preset) {
                setFindingTitle(preset.title);
                setFindingSeverity(preset.severity);
                setFindingRef(preset.ref);
                setFindingDesc(preset.desc);
              }
            }}
          >
            <option value="">✨ Select Pre-Populated Audit Finding Template…</option>
            {FINDING_PRESETS.map((p, idx) => (
              <option key={idx} value={String(idx)}>
                [{p.severity.toUpperCase()}] {p.title}
              </option>
            ))}
          </select>
          <input
            className="input text-sm"
            placeholder="Finding title (e.g. Missing Art. 14 override SOP)"
            value={findingTitle}
            onChange={(e) => setFindingTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <select className="select text-xs" value={findingSeverity} onChange={(e) => setFindingSeverity(e.target.value)}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              className="input text-xs"
              placeholder="Statutory ref (e.g. Art. 14 / DORA)"
              value={findingRef}
              onChange={(e) => setFindingRef(e.target.value)}
            />
          </div>
          <textarea
            className="textarea text-xs"
            placeholder="Auditor observation & required remediation…"
            value={findingDesc}
            onChange={(e) => setFindingDesc(e.target.value)}
          />
          <button type="button" className="btn btn-secondary w-full text-xs" onClick={raiseFinding}>
            Log Audit Finding
          </button>
        </div>

        <div className="card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-[#0F2A4A]">Auditor Working-Paper Comments</h2>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-slate-50 p-3 text-xs">
                <div className="text-[11px] text-slate-500">
                  {c.authorName} · {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                </div>
                <p className="mt-1 text-slate-800">{c.body}</p>
              </div>
            ))}
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500">No working-paper comments yet.</p>
            ) : null}
          </div>
          <div className="mt-3 space-y-2">
            <select
              className="w-full rounded-lg border border-sky-200 bg-sky-50/70 px-2.5 py-1 text-xs text-slate-700"
              value=""
              onChange={(e) => {
                if (e.target.value) setBody(e.target.value);
              }}
            >
              <option value="">✨ Select Pre-Populated Working-Paper Note…</option>
              {WORKING_PAPER_PRESETS.map((wp, idx) => (
                <option key={idx} value={wp}>
                  {wp.slice(0, 75)}…
                </option>
              ))}
            </select>
            <textarea
              className="textarea text-xs"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add an auditor working-paper note…"
            />
          </div>
          <button className="btn btn-secondary mt-2 w-full text-xs" onClick={addComment}>
            Post Working-Paper Note
          </button>
        </div>
      </div>
    </div>
  );
}
