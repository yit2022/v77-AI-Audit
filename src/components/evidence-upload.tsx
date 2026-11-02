"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EvidenceUpload({
  systems,
  controls,
}: {
  systems: { id: string; name: string }[];
  controls: { id: string; code: string; title: string }[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setMsg("");
    const fd = new FormData(form);
    const res = await fetch("/api/evidence", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      setMsg("Upload failed");
      return;
    }
    const data = await res.json();
    setMsg(`Stored with SHA-256 ${data.sha256.slice(0, 12)}…`);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-5 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Title</label>
        <input name="title" className="input" required placeholder="Model card / FRIA / test log" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">File</label>
        <input name="file" type="file" className="input" required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">System (optional)</label>
        <select name="systemId" className="select" defaultValue="">
          <option value="">—</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Control (optional)</label>
        <select name="controlId" className="select" defaultValue="">
          <option value="">—</option>
          {controls.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Uploading…" : "Upload evidence"}
        </button>
        {msg ? <span className="text-sm text-slate-600">{msg}</span> : null}
      </div>
    </form>
  );
}
