"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RedTeamForm({ systems }: { systems: { id: string; name: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!systems[0]) return;
    setLoading(true);
    setError("");
    const systemId = (document.getElementById("rt-system") as HTMLSelectElement).value;
    const res = await fetch("/api/tests/redteam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, provider: "mock" }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Red-team run failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="card flex flex-wrap items-end gap-3 p-5">
      <div className="min-w-[220px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-slate-600">System</label>
        <select id="rt-system" className="select" defaultValue={systems[0]?.id}>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary" onClick={run} disabled={loading || !systems.length}>
        {loading ? "Running suite…" : "Run mock red-team suite"}
      </button>
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </div>
  );
}
