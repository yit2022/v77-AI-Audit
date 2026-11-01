"use client";

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

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-sky-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-2">Control</th>
            <th className="px-4 py-2">Crosswalk</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Notes & evidence</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3">
                <div className="font-mono text-xs text-sky-700">{r.code}</div>
                <div className="font-medium text-[#0F2A4A]">{r.title}</div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                <div>EU: {r.euRef}</div>
                <div>NIST: {r.nistRef}</div>
                <div>ISO: {r.isoRef}</div>
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
  );
}
