"use client";

import { useRouter } from "next/navigation";

export function IncidentsClient({
  systems,
  incidents,
}: {
  systems: Array<{ id: string; name: string }>;
  incidents: Array<{ id: string; title: string; severity: string; status: string; seriousIncident: boolean }>;
}) {
  const router = useRouter();

  async function create() {
    const payload = {
      title: (document.getElementById("inc-title") as HTMLInputElement).value,
      systemId: (document.getElementById("inc-system") as HTMLSelectElement).value || undefined,
      severity: (document.getElementById("inc-sev") as HTMLSelectElement).value,
      discoveredAt: (document.getElementById("inc-discovered") as HTMLInputElement).value,
      occurredAt: (document.getElementById("inc-occurred") as HTMLInputElement).value,
      description: (document.getElementById("inc-desc") as HTMLTextAreaElement).value,
      impactSummary: (document.getElementById("inc-impact") as HTMLTextAreaElement).value,
      seriousIncident: (document.getElementById("inc-serious") as HTMLInputElement).checked,
      authorityNotified: (document.getElementById("inc-auth") as HTMLInputElement).checked,
      euArticleRef: "Art. 73",
    };
    await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="card space-y-3 p-5">
        <h2 className="font-semibold text-[#0F2A4A]">Log incident (EU AI Act serious-incident fields)</h2>
        <input id="inc-title" className="input" placeholder="Title" />
        <select id="inc-system" className="select">
          <option value="">No linked system</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select id="inc-sev" className="select w-40" defaultValue="medium">
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <input id="inc-discovered" className="input" placeholder="Discovered at (ISO date)" />
          <input id="inc-occurred" className="input" placeholder="Occurred at (ISO date)" />
        </div>
        <textarea id="inc-desc" className="textarea" placeholder="Description" />
        <textarea id="inc-impact" className="textarea" placeholder="Impact summary" />
        <label className="flex items-center gap-2 text-sm">
          <input id="inc-serious" type="checkbox" /> Serious incident (Art. 73)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input id="inc-auth" type="checkbox" /> Market surveillance authority notified (record only — no email send)
        </label>
        <button type="button" className="btn btn-primary" onClick={() => void create()}>
          Save incident
        </button>
      </div>
      <ul className="space-y-2">
        {incidents.map((i) => (
          <li key={i.id} className="card p-4 text-sm">
            <div className="font-medium text-[#0F2A4A]">{i.title}</div>
            <p className="text-slate-600">
              {i.severity} · {i.status}
              {i.seriousIncident ? " · serious incident" : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
