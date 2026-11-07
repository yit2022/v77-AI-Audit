"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { renderModelCardMarkdown } from "@/lib/model-cards";

const FIELDS = [
  ["version", "Version"],
  ["intendedUse", "Intended use (EU AI Act Art. 13)"],
  ["outOfScope", "Out-of-scope & prohibited uses (Art. 5)"],
  ["trainingDataSummary", "Training & validation data summary (Art. 10 & Art. 53)"],
  ["evaluationSummary", "Evaluation & red-team summary (Art. 15)"],
  ["ethicalConsiderations", "Ethical considerations, risk tier & fundamental rights (Art. 27)"],
  ["limitations", "Known technical limitations"],
  ["caveats", "Deployer caveats, human oversight (Art. 14) & transparency (Art. 50)"],
  ["contact", "Governance contact"],
] as const;

export function ModelCardsClient({ systems }: { systems: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [systemId, setSystemId] = useState(systems[0]?.id || "");
  const [msg, setMsg] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!systemId) return;
    void fetch(`/api/model-cards?systemId=${systemId}`)
      .then((r) => r.json())
      .then((b) => {
        const c = b.card || {};
        const next: Record<string, string> = {};
        for (const [k] of FIELDS) next[k] = c[k] || "";
        setValues(next);
      });
  }, [systemId]);

  async function save() {
    setMsg("");
    const res = await fetch("/api/model-cards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, ...values }),
    });
    setMsg(res.ok ? "Model card saved." : (await res.json().catch(() => ({}))).error || "Failed");
    router.refresh();
  }

  async function autoPopulate() {
    setMsg("");
    const res = await fetch("/api/model-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemId, overwrite: true }),
    });
    if (!res.ok) {
      setMsg("Could not auto-populate model card.");
      return;
    }
    const body = (await res.json().catch(() => ({}))) as { card?: Record<string, string> };
    if (body.card) {
      setValues(body.card);
    }
    setMsg("Model card synthesized from system metadata, risk classification, fairness, red-team, and eval runs.");
    router.refresh();
  }

  function downloadMarkdown() {
    const sys = systems.find((s) => s.id === systemId);
    const md = renderModelCardMarkdown(sys?.name || systemId, values);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model-card-${systemId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!systems.length) return <p className="text-sm text-slate-600">Add an AI system first.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select className="select w-72" value={systemId} onChange={(e) => setSystemId(e.target.value)}>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => void autoPopulate()}>
            Auto-populate from system &amp; test evidence
          </button>
          <button type="button" className="btn btn-secondary" onClick={downloadMarkdown}>
            Download Model Card (.md)
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void save()}>
            Save model card
          </button>
        </div>
      </div>
      {FIELDS.map(([key, label]) => (
        <div key={key}>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor={key}>
            {label}
          </label>
          {key === "version" || key === "contact" ? (
            <input
              id={key}
              className="input"
              value={values[key] || ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          ) : (
            <textarea
              id={key}
              className="textarea"
              value={values[key] || ""}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          )}
        </div>
      ))}
      <button type="button" className="btn btn-primary" onClick={() => void save()}>
        Save model card
      </button>
      {msg ? <p className="text-sm text-sky-800">{msg}</p> : null}
    </div>
  );
}
