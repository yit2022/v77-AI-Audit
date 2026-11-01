"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  title: string;
  description: string;
  status: string;
  cadenceDays: number;
  nextDueAt: string;
  expiresAt: string | null;
  assigneeUserId: string | null;
  systemId: string | null;
  controlId: string | null;
};

type Member = { id: string; name: string; email: string };
type System = { id: string; name: string };
type Control = { id: string; code: string; title: string };

export function EvidenceRequestsClient({
  rows,
  summary,
  members,
  systems,
  controls,
  labels,
}: {
  rows: Row[];
  summary: { overdue: number; expiringSoon: number; expired: number; total: number };
  members: Member[];
  systems: System[];
  controls: Control[];
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const title = (document.getElementById("er-title") as HTMLInputElement).value;
    const description = (document.getElementById("er-desc") as HTMLTextAreaElement).value;
    const nextDueAt = (document.getElementById("er-due") as HTMLInputElement).value;
    const expiresAt = (document.getElementById("er-exp") as HTMLInputElement).value;
    const cadenceDays = Number((document.getElementById("er-cadence") as HTMLInputElement).value || 90);
    const assigneeUserId = (document.getElementById("er-assignee") as HTMLSelectElement).value || undefined;
    const systemId = (document.getElementById("er-system") as HTMLSelectElement).value || undefined;
    const controlId = (document.getElementById("er-control") as HTMLSelectElement).value || undefined;
    await fetch("/api/evidence-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        nextDueAt: nextDueAt ? new Date(nextDueAt).toISOString() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        cadenceDays,
        assigneeUserId,
        systemId,
        controlId,
      }),
    });
    setBusy(false);
    router.refresh();
  }

  async function act(id: string, action: "complete" | "cancel") {
    await fetch("/api/evidence-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    router.refresh();
  }

  const memberName = (id: string | null) => members.find((m) => m.id === id)?.name || labels.unassigned;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">{labels.total}</div>
          <div className="mt-1 text-2xl font-semibold text-[#0F2A4A]">{summary.total}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">{labels.overdue}</div>
          <div className="mt-1 text-2xl font-semibold text-rose-700">{summary.overdue}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">{labels.expiringSoon}</div>
          <div className="mt-1 text-2xl font-semibold text-amber-700">{summary.expiringSoon}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold uppercase text-slate-500">{labels.expired}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-700">{summary.expired}</div>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-[#0F2A4A]">{labels.schedule}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="er-title">
              {labels.title}
            </label>
            <input id="er-title" className="input w-full" placeholder={labels.titlePlaceholder} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="er-desc">
              {labels.description}
            </label>
            <textarea id="er-desc" className="textarea w-full" rows={2} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="er-due">
              {labels.nextDue}
            </label>
            <input id="er-due" type="date" className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="er-exp">
              {labels.expires}
            </label>
            <input id="er-exp" type="date" className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="er-cadence">
              {labels.cadence}
            </label>
            <input id="er-cadence" type="number" min={7} max={365} defaultValue={90} className="input w-full" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="er-assignee">
              {labels.assignee}
            </label>
            <select id="er-assignee" className="select w-full">
              <option value="">{labels.unassigned}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="er-system">
              {labels.system}
            </label>
            <select id="er-system" className="select w-full">
              <option value="">{labels.any}</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="er-control">
              {labels.control}
            </label>
            <select id="er-control" className="select w-full">
              <option value="">{labels.any}</option>
              {controls.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void create()}>
          {labels.create}
        </button>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium text-[#0F2A4A]">{r.title}</div>
                <p className="mt-1 text-slate-600">{r.description || labels.noDescription}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {labels.assignee}: {memberName(r.assigneeUserId)} · {labels.nextDue}:{" "}
                  {r.nextDueAt?.slice?.(0, 10) || r.nextDueAt} · {labels.expires}:{" "}
                  {r.expiresAt ? r.expiresAt.slice(0, 10) : "—"} · {labels.cadence}: {r.cadenceDays}d · {r.status}
                </p>
              </div>
              {r.status !== "cancelled" ? (
                <div className="flex gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => void act(r.id, "complete")}>
                    {labels.complete}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => void act(r.id, "cancel")}>
                    {labels.cancel}
                  </button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
        {rows.length === 0 ? <li className="text-sm text-slate-500">{labels.empty}</li> : null}
      </ul>
    </div>
  );
}
