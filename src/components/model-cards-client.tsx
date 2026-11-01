"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const FIELDS = [
  ["version", "Version"],
  ["intendedUse", "Intended use"],
  ["outOfScope", "Out of scope"],
  ["trainingDataSummary", "Training data summary"],
  ["evaluationSummary", "Evaluation summary"],
  ["ethicalConsiderations", "Ethical considerations"],
  ["limitations", "Limitations"],
  ["caveats", "Caveats"],
  ["contact", "Contact"],
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

  if (!systems.length) return <p className="text-sm text-slate-600">Add an AI system first.</p>;

  return (
    <div className="space-y-4">
      <select className="select w-72" value={systemId} onChange={(e) => setSystemId(e.target.value)}>
        {systems.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
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
