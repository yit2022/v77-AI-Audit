"use client";

import { useRouter } from "next/navigation";
import { ART_73_CATEGORIES, computeArt73Deadline, renderArt73AuthorityReport } from "@/lib/eu-ai-act/incidents";

export function IncidentsClient({
  systems,
  incidents,
}: {
  systems: Array<{ id: string; name: string }>;
  incidents: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    seriousIncident: boolean;
    euArticleRef?: string;
    discoveredAt?: string;
    authorityNotified?: boolean;
    createdAt?: string;
  }>;
}) {
  const router = useRouter();

  async function create() {
    const artSelect = document.getElementById("inc-art-ref") as HTMLSelectElement | null;
    const payload = {
      title: (document.getElementById("inc-title") as HTMLInputElement).value,
      systemId: (document.getElementById("inc-system") as HTMLSelectElement).value || undefined,
      severity: (document.getElementById("inc-sev") as HTMLSelectElement).value,
      discoveredAt: (document.getElementById("inc-discovered") as HTMLInputElement).value,
      occurredAt: (document.getElementById("inc-occurred") as HTMLInputElement).value,
      description: (document.getElementById("inc-desc") as HTMLTextAreaElement).value,
      impactSummary: (document.getElementById("inc-impact") as HTMLTextAreaElement).value,
      seriousIncident: (document.getElementById("inc-serious") as HTMLInputElement).checked,
      authorityNotified: (document.getElementById("inc-auth") as HTMLInputElement).checked,
      euArticleRef: artSelect?.value || "Art. 73(2)",
    };
    await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="card space-y-3 p-5">
        <h2 className="font-semibold text-[#0F2A4A]">Log incident (EU AI Act serious-incident fields)</h2>
        <input id="inc-title" className="input" placeholder="Title" />
        <div className="grid gap-3 sm:grid-cols-2">
          <select id="inc-system" className="select">
            <option value="">No linked system</option>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select id="inc-art-ref" className="select" defaultValue="Art. 73(2)">
            {ART_73_CATEGORIES.map((c) => (
              <option key={c.id} value={c.articleRef}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <select id="inc-sev" className="select w-40" defaultValue="medium">
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <div className="grid gap-3 sm:grid-cols-2">
          <input id="inc-discovered" className="input" placeholder="Discovered at (YYYY-MM-DD)" />
          <input id="inc-occurred" className="input" placeholder="Occurred at (YYYY-MM-DD)" />
        </div>
        <textarea id="inc-desc" className="textarea" placeholder="Description" />
        <textarea id="inc-impact" className="textarea" placeholder="Impact summary" />
        <label className="flex items-center gap-2 text-sm">
          <input id="inc-serious" type="checkbox" /> Serious incident (Art. 73)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input id="inc-auth" type="checkbox" /> Market surveillance authority notified (record only — no email send)
        </label>
        <button type="button" className="btn btn-primary" onClick={() => void create()}>
          Save incident
        </button>
      </div>
      <ul className="space-y-2">
        {incidents.map((i) => {
          const deadline = i.seriousIncident
            ? computeArt73Deadline({
                euArticleRef: i.euArticleRef,
                discoveredAt: i.discoveredAt,
                createdAt: i.createdAt,
              })
            : null;
          return (
            <li key={i.id} className="card p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-[#0F2A4A]">{i.title}</div>
                <div className="flex flex-wrap items-center gap-2">
                  {deadline ? (
                    <span
                      className={`badge ${
                        i.authorityNotified
                          ? "badge-minimal"
                          : deadline.overdue
                            ? "badge-high"
                            : "badge-limited"
                      }`}
                    >
                      {i.authorityNotified
                        ? `${deadline.articleRef} Notified`
                        : `${deadline.articleRef} due ${deadline.deadlineIso} (${deadline.deadlineDays}d window)`}
                    </span>
                  ) : null}
                  {i.seriousIncident ? (
                    <button
                      type="button"
                      className="btn btn-secondary px-2.5 py-1 text-xs"
                      onClick={() => {
                        const md = renderArt73AuthorityReport(i);
                        const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `art73-authority-report-${i.id.slice(0, 8)}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download Art. 73 Authority Dossier (.md)
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="mt-1 text-slate-600">
                {i.severity} · {i.status}
                {i.seriousIncident ? ` · serious incident (${i.euArticleRef || "Art. 73(2)"})` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
