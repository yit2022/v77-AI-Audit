"use client";

import Link from "next/link";
import { useState } from "react";
import { ControlEvidenceUpload } from "@/components/control-evidence-upload";

type Item = {
  id: string;
  controlId: string;
  status: string;
  notes: string;
  code: string;
  title: string;
  euRef: string;
  nistRef: string;
  isoRef: string;
};

const STATUSES = ["not_started", "in_progress", "implemented", "not_applicable", "waived"];

export function AssessmentControlsClient({
  items,
  systemId,
}: {
  items: Item[];
  systemId: string;
}) {
  const [rows, setRows] = useState(items);
  const [saving, setSaving] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  async function update(id: string, patch: Partial<Item>) {
    setSaving(id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    await fetch("/api/assessments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentControlId: id,
        status: patch.status,
        notes: patch.notes,
      }),
    });
    setSaving(null);
  }

  const doneCount = rows.filter(
    (r) => r.status === "implemented" || r.status === "not_applicable" || r.status === "waived",
  ).length;
  const pct = rows.length ? Math.round((doneCount / rows.length) * 100) : 0;

  const filteredRows = rows.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        r.code.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.euRef.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Readiness Progress & Pipeline Navigation */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#0F2A4A]">
              24-Control Statutory Readiness: {doneCount}/{rows.length} Controls Addressed ({pct}%)
            </h2>
            <p className="text-xs text-slate-500">
              Update implementation status, document audit notes, and attach SHA-256 hashed evidence files per control.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/systems/${systemId}`} className="btn btn-secondary text-xs">
              ← Back to System Command Center
            </Link>
            <Link href={`/eu-ai-act?systemId=${systemId}`} className="btn btn-secondary text-xs">
              Step 4: Annex IV &amp; Art. 47 DoC →
            </Link>
            <Link href="/auditor" className="btn btn-primary text-xs">
              Step 6: Auditor Sign-Off Workbench →
            </Link>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-sky-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 text-xs">
            {["all", ...STATUSES].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`rounded-full px-3 py-1 font-medium capitalize ${
                  filterStatus === st
                    ? "bg-[#0F2A4A] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {st.replaceAll("_", " ")}
              </button>
            ))}
          </div>
          <input
            className="input max-w-xs text-xs"
            placeholder="Search control code, title, or EU Article…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-sky-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Control</th>
              <th className="px-4 py-2">EU AI Act / ISO / NIST Crosswalk</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Implementation Notes &amp; SHA-256 Evidence</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-sky-700">{r.code}</div>
                  <div className="font-medium text-[#0F2A4A]">{r.title}</div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  <div>EU AI Act: {r.euRef}</div>
                  <div>EN ISO 42001: {r.isoRef}</div>
                  <div>NIST AI RMF: {r.nistRef}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="select"
                    value={r.status}
                    onChange={(e) => update(r.id, { status: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  {saving === r.id ? <div className="mt-1 text-xs text-slate-400">Saving…</div> : null}
                </td>
                <td className="px-4 py-3">
                  <textarea
                    className="textarea"
                    placeholder="Document how this control is implemented (saved on blur)…"
                    value={r.notes}
                    onChange={(e) =>
                      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, notes: e.target.value } : x)))
                    }
                    onBlur={(e) => update(r.id, { notes: e.target.value })}
                  />
                  <ControlEvidenceUpload systemId={systemId} controlId={r.controlId} controlCode={r.code} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
