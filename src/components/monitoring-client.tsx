"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Schedule = {
  id: string;
  name: string;
  systemName: string;
  cadenceHours: number;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
};

type Alert = {
  id: string;
  systemName: string;
  severity: string;
  kind: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
};

export function MonitoringClient({
  systems,
  schedules,
  alerts,
}: {
  systems: { id: string; name: string }[];
  schedules: Schedule[];
  alerts: Alert[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function create() {
    if (!systems[0]) return;
    setBusy(true);
    const systemId = (document.getElementById("mon-system") as HTMLSelectElement).value;
    const cadenceHours = Number((document.getElementById("mon-cadence") as HTMLSelectElement).value);
    const res = await fetch("/api/monitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, cadenceHours }),
    });
    setBusy(false);
    setMsg(res.ok ? "Schedule created." : "Could not create schedule.");
    router.refresh();
  }

  async function run(scheduleId: string) {
    setBusy(true);
    await fetch("/api/monitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run", scheduleId }),
    });
    setBusy(false);
    router.refresh();
  }

  async function runDue() {
    setBusy(true);
    const res = await fetch("/api/monitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run_due" }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(`Ran ${data.ran ?? 0} due schedule(s).`);
    router.refresh();
  }

  async function ack(alertId: string) {
    await fetch("/api/monitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ack", alertId }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-end gap-3 p-5">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-600">System</label>
          <select id="mon-system" className="select" defaultValue={systems[0]?.id}>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Cadence</label>
          <select id="mon-cadence" className="select" defaultValue="24">
            <option value="1">Hourly</option>
            <option value="24">Daily</option>
            <option value="168">Weekly</option>
          </select>
        </div>
        <button className="btn btn-primary" type="button" disabled={busy || !systems.length} onClick={create}>
          Add schedule
        </button>
        <button className="btn btn-secondary" type="button" disabled={busy} onClick={runDue}>
          Run due checks
        </button>
        {msg ? <span className="text-sm text-sky-900">{msg}</span> : null}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Schedules</h2>
        <div className="space-y-2">
          {schedules.map((s) => (
            <div key={s.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium text-slate-900">{s.name}</div>
                <div className="text-xs text-slate-500">
                  {s.systemName} · every {s.cadenceHours}h · next {s.nextRunAt ? new Date(s.nextRunAt).toLocaleString() : "—"}
                </div>
              </div>
              <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => run(s.id)}>
                Run now
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Alerts & drift</h2>
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`card p-4 ${a.acknowledged ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {a.severity} · {a.kind.replaceAll("_", " ")} · {a.systemName}
                  </div>
                  <div className="mt-1 text-sm text-slate-800">{a.message}</div>
                </div>
                {!a.acknowledged ? (
                  <button className="btn btn-secondary" type="button" onClick={() => ack(a.id)}>
                    Acknowledge
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">Acknowledged</span>
                )}
              </div>
            </div>
          ))}
          {alerts.length === 0 ? <p className="text-sm text-slate-500">No alerts yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
