"use client";

import { useMemo, useState } from "react";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/statuses";

export type LeadRow = {
  id: string;
  name: string;
  email: string;
  company: string;
  roleTitle: string;
  message: string;
  source: string;
  status: string;
  notes: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
};

export function LeadsInboxClient({ initialLeads }: { initialLeads: LeadRow[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<string>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const visible = useMemo(
    () => (filter === "all" ? leads : leads.filter((l) => l.status === filter)),
    [leads, filter],
  );

  async function patch(id: string, body: { status?: LeadStatus; notes?: string }) {
    setSaving(id);
    setError("");
    const res = await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    setSaving(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not update lead");
      return;
    }
    const data = await res.json();
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data.lead } : l)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
        <select className="select w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{visible.length} lead{visible.length === 1 ? "" : "s"}</span>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {visible.length === 0 ? (
        <div className="card p-8 text-sm text-slate-600">No pilot leads yet.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((lead) => (
            <div key={lead.id} className="card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-[#0F2A4A]">{lead.name}</div>
                  <div className="mt-0.5 truncate text-sm text-slate-600">
                    {lead.email}
                    {lead.company ? ` · ${lead.company}` : ""}
                    {lead.roleTitle ? ` · ${lead.roleTitle}` : ""}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {lead.source} · {new Date(lead.createdAt).toLocaleString()}
                  </div>
                  {lead.message ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{lead.message}</p>
                  ) : null}
                </div>
                <select
                  className="select w-full sm:w-40"
                  value={lead.status || "new"}
                  disabled={saving === lead.id}
                  onChange={(e) => patch(lead.id, { status: e.target.value as LeadStatus })}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs font-semibold text-slate-600">Internal notes</label>
                <textarea
                  className="textarea"
                  defaultValue={lead.notes || ""}
                  key={`${lead.id}-${lead.updatedAt ?? ""}`}
                  onBlur={(e) => {
                    if (e.target.value !== (lead.notes || "")) {
                      void patch(lead.id, { notes: e.target.value });
                    }
                  }}
                  placeholder="Call notes, next step…"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
