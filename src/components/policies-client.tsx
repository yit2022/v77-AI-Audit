"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tpl = { id: string; title: string; category: string };
type Doc = { id: string; title: string; templateId: string; updatedAt: string | Date };

export function PoliciesClient({ templates, docs }: { templates: Tpl[]; docs: Doc[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function createFrom(templateId: string) {
    setMsg("");
    const res = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    });
    setMsg(res.ok ? "Policy draft created." : (await res.json().catch(() => ({}))).error || "Failed");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-[#0F2A4A]">Template library</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="text-xs font-semibold uppercase text-sky-700">{t.category}</div>
              <div className="mt-1 font-medium text-[#0F2A4A]">{t.title}</div>
              <button type="button" className="btn btn-secondary mt-3" onClick={() => void createFrom(t.id)}>
                Create draft
              </button>
            </div>
          ))}
        </div>
      </section>
      {msg ? <p className="text-sm text-sky-800">{msg}</p> : null}
      <section>
        <h2 className="text-lg font-semibold text-[#0F2A4A]">Your drafts</h2>
        <ul className="mt-3 space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="card flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <div>
                <div className="font-medium text-[#0F2A4A]">{d.title}</div>
                <div className="text-xs text-slate-500">Updated {new Date(d.updatedAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <a className="btn btn-secondary" href={`/api/policies/export?id=${d.id}&format=pdf`}>
                  PDF
                </a>
                <a className="btn btn-secondary" href={`/api/policies/export?id=${d.id}&format=docx`}>
                  DOCX
                </a>
              </div>
            </li>
          ))}
          {docs.length === 0 ? <li className="text-sm text-slate-600">No drafts yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
