"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProviderOption = { id: string; name: string; configured: boolean };

export function EvalSuiteForm({ systems }: { systems: { id: string; name: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([
    { id: "mock", name: "Mock LLM Provider", configured: true },
  ]);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.providers) setProviders(d.providers);
      })
      .catch(() => undefined);
  }, []);

  async function run() {
    if (!systems[0]) return;
    setBusy(true);
    setError("");
    const systemId = (document.getElementById("eval-system") as HTMLSelectElement).value;
    const provider = (document.getElementById("eval-provider") as HTMLSelectElement).value;
    const res = await fetch("/api/tests/evals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, provider }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Eval failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="card flex flex-wrap items-end gap-3 p-5">
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs font-semibold text-slate-600">System</label>
        <select id="eval-system" className="select" defaultValue={systems[0]?.id}>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="min-w-[180px]">
        <label className="mb-1 block text-xs font-semibold text-slate-600">Provider</label>
        <select id="eval-provider" className="select" defaultValue="mock">
          {providers.map((p) => (
            <option key={p.id} value={p.id} disabled={!p.configured}>
              {p.name}{p.configured ? "" : " (not configured)"}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary" type="button" disabled={busy || !systems.length} onClick={run}>
        {busy ? "Running…" : "Run scored eval suite"}
      </button>
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </div>
  );
}
