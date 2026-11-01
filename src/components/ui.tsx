import type { ReactNode } from "react";

export function RiskBadge({ tier }: { tier?: string | null }) {
  if (!tier) return <span className="badge badge-neutral">Unclassified</span>;
  const map: Record<string, string> = {
    prohibited: "badge-prohibited",
    high_risk: "badge-high",
    limited: "badge-limited",
    minimal: "badge-minimal",
    gpai: "badge-gpai",
  };
  return <span className={`badge ${map[tier] ?? "badge-neutral"}`}>{tier.replace("_", " ")}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-8 text-center">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}
