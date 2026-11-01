"use client";

import { useRouter } from "next/navigation";

export function RegistryFilters({
  riskTier,
  lifecycleStatus,
  role,
}: {
  riskTier: string;
  lifecycleStatus: string;
  role: string;
}) {
  const router = useRouter();

  function apply() {
    const risk = (document.getElementById("reg-risk") as HTMLSelectElement).value;
    const life = (document.getElementById("reg-life") as HTMLSelectElement).value;
    const r = (document.getElementById("reg-role") as HTMLSelectElement).value;
    const q = new URLSearchParams();
    if (risk !== "all") q.set("riskTier", risk);
    if (life !== "all") q.set("lifecycleStatus", life);
    if (r !== "all") q.set("role", r);
    router.push(`/systems${q.toString() ? `?${q}` : ""}`);
  }

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Risk tier</label>
        <select id="reg-risk" className="select" defaultValue={riskTier}>
          <option value="all">All</option>
          <option value="prohibited">Prohibited</option>
          <option value="high_risk">High-risk</option>
          <option value="limited">Limited</option>
          <option value="minimal">Minimal</option>
          <option value="gpai">GPAI</option>
          <option value="unclassified">Unclassified</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Lifecycle</label>
        <select id="reg-life" className="select" defaultValue={lifecycleStatus}>
          <option value="all">All</option>
          <option value="discovered">Discovered</option>
          <option value="pilot">Pilot</option>
          <option value="production">Production</option>
          <option value="retired">Retired</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Role</label>
        <select id="reg-role" className="select" defaultValue={role}>
          <option value="all">All</option>
          <option value="provider">Provider</option>
          <option value="deployer">Deployer</option>
          <option value="importer">Importer</option>
          <option value="distributor">Distributor</option>
        </select>
      </div>
      <button type="button" className="btn btn-secondary" onClick={apply}>
        Apply filters
      </button>
    </div>
  );
}
