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
    const systemPrompt = (document.getElementById("eval-system-prompt") as HTMLTextAreaElement | null)?.value || "";
    const customEndpointUrl = (document.getElementById("eval-endpoint") as HTMLInputElement | null)?.value || "";
    const res = await fetch("/api/tests/evals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, provider, systemPrompt, customEndpointUrl }),
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
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="eval-system">
            System
          </label>
          <select id="eval-system" className="select" defaultValue={systems[0]?.id}>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="eval-provider">
            Provider
          </label>
          <select id="eval-provider" className="select" defaultValue="mock">
            {providers.map((p) => (
              <option key={p.id} value={p.id} disabled={!p.configured}>
                {p.name}
                {p.configured ? "" : " (not configured)"}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="button" disabled={busy || !systems.length} onClick={run}>
          {busy ? "Running…" : "Run scored eval suite"}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="eval-system-prompt">
            Target System Prompt under test (optional)
          </label>
          <textarea
            id="eval-system-prompt"
            className="textarea"
            rows={2}
            placeholder="Paste your application's system prompt to test its robustness, PII refusal, and groundedness…"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="eval-endpoint">
            Custom HTTP LLM Endpoint URL (optional)
          </label>
          <input
            id="eval-endpoint"
            type="url"
            className="input"
            placeholder="https://api.yourcompany.eu/v1/chat (POST { messages })"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Leave blank to run against the selected LLM provider (e.g. Cloudflare Workers AI).
          </p>
        </div>
      </div>
      {error ? <span className="block text-sm text-red-700">{error}</span> : null}
    </div>
  );
}
