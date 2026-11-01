"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReassessmentForm({ systems }: { systems: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function create() {
    setMsg("");
    const systemId = (document.getElementById("re-system") as HTMLSelectElement).value;
    const cadenceDays = Number((document.getElementById("re-cadence") as HTMLInputElement).value || 90);
    const res = await fetch("/api/reassessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, cadenceDays }),
    });
    setMsg(res.ok ? "Re-assessment schedule created." : (await res.json().catch(() => ({}))).error || "Failed");
    router.refresh();
  }

  if (!systems.length) return null;

  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold text-[#0F2A4A]">Schedule re-assessment</h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="re-system">
            System
          </label>
          <select id="re-system" className="select w-64">
            {systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="re-cadence">
            Cadence (days)
          </label>
          <input id="re-cadence" className="input w-28" type="number" min={7} defaultValue={90} />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => void create()}>
          Schedule
        </button>
      </div>
      {msg ? (
        <p className="mt-2 text-sm text-sky-800" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
