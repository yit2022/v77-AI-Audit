"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProviderOption = { id: string; name: string; configured: boolean };

export function RedTeamForm({ systems }: { systems: { id: string; name: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([
    { id: "mock", name: "Mock LLM Provider", configured: true },
  ]);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.providers) setProviders(data.providers);
      })
      .catch(() => undefined);
  }, []);

  async function run() {
    if (!systems[0]) return;
    setLoading(true);
    setError("");
    const systemId = (document.getElementById("rt-system") as HTMLSelectElement).value;
    const provider = (document.getElementById("rt-provider") as HTMLSelectElement).value;
    const systemPrompt = (document.getElementById("rt-system-prompt") as HTMLTextAreaElement | null)?.value || "";
    const targetEndpointUrl = (document.getElementById("rt-endpoint-url") as HTMLInputElement | null)?.value || "";
    const res = await fetch("/api/tests/redteam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemId,
        provider,
        ...(systemPrompt.trim() ? { systemPrompt: systemPrompt.trim() } : {}),
        ...(targetEndpointUrl.trim() ? { targetEndpointUrl: targetEndpointUrl.trim() } : {}),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Red-team run failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="rt-system">
            System
          </label>
          <select id="rt-system" className="select" defaultValue={systems[0]?.id}>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px]">
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="rt-provider">
            Provider
          </label>
          <select id="rt-provider" className="select" defaultValue="mock">
            {providers.map((p) => (
              <option key={p.id} value={p.id} disabled={!p.configured}>
                {p.name}{p.configured ? "" : " (not configured)"}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !systems.length}>
          {loading ? "Running suite…" : "Run red-team suite"}
        </button>
        {error ? <span className="text-sm text-red-700">{error}</span> : null}
      </div>
      <div className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="rt-system-prompt">
            System prompt under test (optional)
          </label>
          <textarea
            id="rt-system-prompt"
            rows={2}
            className="textarea text-xs"
            placeholder="Paste your production system prompt / guardrail instructions to test against jailbreak & injection attacks..."
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="rt-endpoint-url">
            Custom HTTP LLM endpoint URL (optional)
          </label>
          <input
            id="rt-endpoint-url"
            type="url"
            className="input text-xs"
            placeholder="https://api.yourcompany.eu/v1/chat (overrides provider if set)"
          />
        </div>
      </div>
    </div>
  );
}
