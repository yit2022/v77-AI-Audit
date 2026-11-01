"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type System = { id: string; name: string };
type Finding = {
  id: string;
  systemId: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  frameworkRef: string;
  createdAt: string | Date;
};
type Task = {
  id: string;
  findingId: string;
  title: string;
  ownerName: string;
  dueDate: string | null;
  status: string;
};

export function FindingsClient({
  systems,
  initialFindings,
  initialTasks,
}: {
  systems: System[];
  initialFindings: Finding[];
  initialTasks: Task[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function createFinding() {
    if (!systems[0]) return;
    setBusy(true);
    setError("");
    const body = {
      systemId: (document.getElementById("f-system") as HTMLSelectElement).value,
      title: (document.getElementById("f-title") as HTMLInputElement).value,
      description: (document.getElementById("f-desc") as HTMLTextAreaElement).value,
      severity: (document.getElementById("f-sev") as HTMLSelectElement).value,
      frameworkRef: (document.getElementById("f-ref") as HTMLInputElement).value,
    };
    const res = await fetch("/api/findings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Failed");
      return;
    }
    (document.getElementById("f-title") as HTMLInputElement).value = "";
    router.refresh();
  }

  async function createTask(findingId: string) {
    setBusy(true);
    setError("");
    const title = (document.getElementById(`t-title-${findingId}`) as HTMLInputElement)?.value;
    const ownerName = (document.getElementById(`t-owner-${findingId}`) as HTMLInputElement)?.value;
    const dueDate = (document.getElementById(`t-due-${findingId}`) as HTMLInputElement)?.value;
    const res = await fetch("/api/remediation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ findingId, title, ownerName, dueDate: dueDate || null }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || "Task failed");
      return;
    }
    router.refresh();
  }

  async function setFindingStatus(id: string, status: string) {
    await fetch("/api/findings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  async function setTaskStatus(id: string, status: string) {
    await fetch("/api/remediation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  const tasksByFinding = initialTasks.reduce<Record<string, Task[]>>((acc, t) => {
    (acc[t.findingId] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-slate-900">New finding</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">System</label>
            <select id="f-system" className="select" defaultValue={systems[0]?.id}>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Severity</label>
            <select id="f-sev" className="select" defaultValue="medium">
              {["low", "medium", "high", "critical"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Title</label>
            <input id="f-title" className="input" placeholder="Missing human oversight evidence" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
            <textarea id="f-desc" className="input min-h-[72px]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Framework ref</label>
            <input id="f-ref" className="input" placeholder="EU AI Act Art. 14" />
          </div>
        </div>
        <button type="button" className="btn btn-primary" disabled={busy || !systems.length} onClick={createFinding}>
          Create finding
        </button>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="space-y-4">
        {initialFindings.map((f) => (
          <div key={f.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-900">{f.title}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {f.severity} · {f.status} · {f.frameworkRef || "no framework ref"}
                </div>
                {f.description ? <p className="mt-2 text-sm text-slate-600">{f.description}</p> : null}
              </div>
              <select
                className="select w-auto"
                value={f.status}
                onChange={(e) => setFindingStatus(f.id, e.target.value)}
              >
                {["open", "in_progress", "resolved", "accepted"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remediation</div>
              {(tasksByFinding[f.id] ?? []).map((t) => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-slate-800">{t.title}</div>
                    <div className="text-xs text-slate-500">
                      Owner: {t.ownerName || "unassigned"}
                      {t.dueDate ? ` · due ${t.dueDate}` : ""}
                    </div>
                  </div>
                  <select
                    className="select w-auto"
                    value={t.status}
                    onChange={(e) => setTaskStatus(t.id, e.target.value)}
                  >
                    {["open", "in_progress", "done", "cancelled"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <input id={`t-title-${f.id}`} className="input flex-1" placeholder="Remediation task" />
                <input id={`t-owner-${f.id}`} className="input w-40" placeholder="Owner name" />
                <input id={`t-due-${f.id}`} className="input w-40" type="date" />
                <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => createTask(f.id)}>
                  Add task
                </button>
              </div>
            </div>
          </div>
        ))}
        {initialFindings.length === 0 ? (
          <p className="text-sm text-slate-500">No findings yet. Create one to start the remediation workflow.</p>
        ) : null}
      </div>
    </div>
  );
}
