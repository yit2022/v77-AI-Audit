"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FairnessForm({ systems }: { systems: { id: string; name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/tests/fairness", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-5 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">System</label>
        <select name="systemId" className="select" required defaultValue={systems[0]?.id}>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Sensitive column</label>
        <input name="sensitiveColumn" className="input" defaultValue="group" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Predictions CSV</label>
        <input name="file" type="file" accept=".csv,text/csv" className="input" required />
      </div>
      <div className="md:col-span-3 flex items-center gap-3">
        <button className="btn btn-primary" disabled={loading || systems.length === 0}>
          {loading ? "Running…" : "Run fairness analysis"}
        </button>
        {error ? <span className="text-sm text-red-700">{error}</span> : null}
        <span className="text-xs text-slate-500">
          Example header: y_true,y_pred,group
        </span>
      </div>
    </form>
  );
}
