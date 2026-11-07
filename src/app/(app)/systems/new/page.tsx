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
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              EU AI Act Annex III / Sector Domain
            </label>
            <select name="domain" className="select" defaultValue="banking_credit">
              <option value="banking_credit">Banking &amp; Creditworthiness Scoring (Annex III pt. 5(b) / DORA)</option>
              <option value="insurance_risk">Life &amp; Health Insurance Pricing / Risk (Annex III pt. 5(c) / DORA)</option>
              <option value="finance_aml">Financial Services AML / Fraud Detection (Art. 6 / DORA)</option>
              <option value="employment_hr">Employment, Recruitment &amp; Worker Management (Annex III pt. 4)</option>
              <option value="healthcare_medtech">Healthcare &amp; Medical Devices (Annex I / III)</option>
              <option value="education">Education &amp; Vocational Training (Annex III pt. 3)</option>
              <option value="critical_infrastructure">Critical Infrastructure &amp; Energy (Annex III pt. 2)</option>
              <option value="biometrics">Biometrics &amp; Identification (Annex III pt. 1)</option>
              <option value="public_services">Essential Public Services &amp; Benefits (Annex III pt. 5(a))</option>
              <option value="general">General Enterprise / Customer Support (Art. 50 / GPAI)</option>
            </select>
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
