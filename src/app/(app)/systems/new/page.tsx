"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";

export default function NewSystemPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/systems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        description: fd.get("description"),
        intendedPurpose: fd.get("intendedPurpose"),
        roleInValueChain: fd.get("roleInValueChain"),
        domain: fd.get("domain"),
        lifecycleStatus: fd.get("lifecycleStatus"),
        versionLabel: fd.get("versionLabel"),
        vendorName: fd.get("vendorName"),
        euDatabaseId: fd.get("euDatabaseId"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Could not create system");
      return;
    }
    const data = await res.json();
    router.push(`/classification/${data.system.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Register AI system"
        subtitle="Capture inventory fields, then continue to the EU AI Act risk classifier."
      />
      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Name</label>
          <input name="name" className="input" required placeholder="e.g. CreditShield Score" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
          <textarea name="description" className="textarea" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Intended purpose</label>
          <textarea name="intendedPurpose" className="textarea" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Value-chain role</label>
            <select name="roleInValueChain" className="select" defaultValue="provider">
              <option value="provider">Provider</option>
              <option value="deployer">Deployer</option>
              <option value="importer">Importer</option>
              <option value="distributor">Distributor</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Lifecycle</label>
            <select name="lifecycleStatus" className="select" defaultValue="discovered">
              <option value="discovered">Discovered</option>
              <option value="pilot">Pilot</option>
              <option value="production">Production</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Domain</label>
            <input name="domain" className="input" defaultValue="general" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Version</label>
            <input name="versionLabel" className="input" placeholder="v1.2.0" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Vendor / model provider</label>
            <input name="vendorName" className="input" placeholder="Internal / OpenAI / ..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">EU database ID</label>
            <input name="euDatabaseId" className="input" placeholder="Optional registration id" />
          </div>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Save & classify"}
        </button>
      </form>
    </div>
  );
}
