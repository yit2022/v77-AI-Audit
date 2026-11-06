"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SAMPLE_BALANCED_CSV = [
  "y_true,y_pred,group",
  "1,1,female",
  "1,1,female",
  "1,1,female",
  "1,0,female",
  "0,0,female",
  "0,0,female",
  "0,0,female",
  "0,1,female",
  "1,1,male",
  "1,1,male",
  "1,1,male",
  "1,0,male",
  "0,0,male",
  "0,0,male",
  "0,0,male",
  "0,1,male",
].join("\n");

const SAMPLE_DISPARATE_CSV = [
  "y_true,y_pred,group",
  "1,1,majority",
  "1,1,majority",
  "1,1,majority",
  "1,1,majority",
  "0,1,majority",
  "0,0,majority",
  "1,0,minority",
  "1,0,minority",
  "1,0,minority",
  "1,1,minority",
  "0,0,minority",
  "0,0,minority",
].join("\n");

export function FairnessForm({ systems }: { systems: { id: string; name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState(systems[0]?.id || "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError("");
    const fd = new FormData(form);
    const res = await fetch("/api/tests/fairness", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed");
      return;
    }
    form.reset();
    router.refresh();
  }

  async function runSamplePreset(csvContent: string, filename: string) {
    if (!selectedSystemId) return;
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.set("systemId", selectedSystemId);
    fd.set("sensitiveColumn", "group");
    fd.set("file", new File([csvContent], filename, { type: "text/csv" }));
    const res = await fetch("/api/tests/fairness", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-5 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="fairness-system">
          System
        </label>
        <select
          id="fairness-system"
          name="systemId"
          className="select"
          required
          value={selectedSystemId}
          onChange={(e) => setSelectedSystemId(e.target.value)}
        >
          {systems.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="fairness-col">
          Sensitive column
        </label>
        <input id="fairness-col" name="sensitiveColumn" className="input" defaultValue="group" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="fairness-file">
          Predictions CSV
        </label>
        <input id="fairness-file" name="file" type="file" accept=".csv,text/csv" className="input" required />
      </div>
      <div className="md:col-span-3 flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={loading || systems.length === 0}>
          {loading ? "Running…" : "Run fairness analysis"}
        </button>
        <button
          type="button"
          className="btn btn-secondary text-xs"
          disabled={loading || systems.length === 0}
          onClick={() => void runSamplePreset(SAMPLE_BALANCED_CSV, "annex-iii-credit-balanced.csv")}
        >
          Run sample: Balanced Credit Cohort (Pass)
        </button>
        <button
          type="button"
          className="btn btn-secondary text-xs"
          disabled={loading || systems.length === 0}
          onClick={() => void runSamplePreset(SAMPLE_DISPARATE_CSV, "annex-iii-hiring-disparate.csv")}
        >
          Run sample: Disparate Impact Hiring Cohort (Fail)
        </button>
        {error ? <span className="text-sm text-red-700">{error}</span> : null}
        <span className="text-xs text-slate-500">
          Example header: y_true,y_pred,group
        </span>
      </div>
    </form>
  );
}
