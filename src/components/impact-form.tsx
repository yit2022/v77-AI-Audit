"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImpactCreateForm({
  systems,
  templates,
}: {
  systems: { id: string; name: string }[];
  templates: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!systems[0]) return;
    setBusy(true);
    setError("");
    const systemId = (document.getElementById("impact-system") as HTMLSelectElement).value;
    const templateId = (document.getElementById("impact-template") as HTMLSelectElement).value;
    const res = await fetch("/api/impact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, templateId }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not create assessment");
      return;
    }
    const data = await res.json();
    router.push(`/impact/${data.id}`);
    router.refresh();
  }

  return (
    <div className="card flex flex-wrap items-end gap-3 p-5">
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-slate-600">System</label>
        <select id="impact-system" className="select" defaultValue={systems[0]?.id}>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[220px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-slate-600">Template</label>
        <select id="impact-template" className="select" defaultValue={templates[0]?.id}>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary" type="button" onClick={create} disabled={busy || !systems.length}>
        {busy ? "Creating…" : "Start assessment"}
      </button>
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </div>
  );
}
