"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Gap = {
  controlCode: string;
  title: string;
  status: string;
  severity: string;
  recommendation: string;
  frameworks: string;
};

export function GapAnalysisClient({
  systems,
  history,
}: {
  systems: Array<{ id: string; name: string }>;
  history: Array<{ id: string; summary: string; provider: string; createdAt: string; gapsJson: string }>;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ summary: string; gaps: Gap[]; provider: string } | null>(null);

  async function run() {
    setBusy(true);
    setMsg("");
    const systemId = (document.getElementById("gap-system") as HTMLSelectElement).value;
    const res = await fetch("/api/gap-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, provider: "workers_ai" }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error || "Failed");
      return;
    }
    setResult({ summary: body.summary, gaps: body.gaps || [], provider: body.provider });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="gap-system">
            System
          </label>
          <select id="gap-system" className="select w-72">
            {systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary" disabled={busy || !systems.length} onClick={() => void run()}>
          {busy ? "Analysing…" : "Run AI gap analysis"}
        </button>
        <p className="text-xs text-slate-500">
          Uses Workers AI when <code>V77_ENABLE_REAL_PROVIDERS=true</code>; otherwise mock fallback (free).
        </p>
      </div>
      {msg ? <p className="text-sm text-red-700">{msg}</p> : null}
      {result ? (
        <section className="card space-y-3 p-5">
          <p className="text-xs font-semibold uppercase text-sky-700">Provider: {result.provider}</p>
          <p className="text-sm text-slate-700">{result.summary}</p>
          <ul className="space-y-2">
            {result.gaps.map((g, i) => (
              <li key={`${g.controlCode}-${i}`} className="rounded-lg border border-slate-100 p-3 text-sm">
                <div className="font-medium text-[#0F2A4A]">
                  {g.controlCode} — {g.title}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    ({g.status} · {g.severity})
                  </span>
                </div>
                <p className="mt-1 text-slate-600">{g.recommendation}</p>
                <p className="mt-1 text-xs text-slate-400">{g.frameworks}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section>
        <h2 className="text-sm font-semibold text-[#0F2A4A]">Recent analyses</h2>
        <ul className="mt-2 space-y-2">
          {history.map((h) => (
            <li key={h.id} className="card p-3 text-sm text-slate-600">
              <span className="font-medium text-slate-800">{h.provider}</span> · {new Date(h.createdAt).toLocaleString()} —{" "}
              {h.summary.slice(0, 160)}
              {h.summary.length > 160 ? "…" : ""}
            </li>
          ))}
          {history.length === 0 ? <li className="text-sm text-slate-500">No analyses yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
