"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";
import {
  EU_INDUSTRY_PLAYBOOKS,
  INSTITUTION_PRESETS_BY_SECTOR,
  VENDOR_PRESETS,
  VERSION_PRESETS,
  formatInstitutionAndVendor,
  type EuIndustryId,
  type EuSystemArchetype,
} from "@/lib/eu-ai-act/industries";

export default function NewSystemPage() {
  const router = useRouter();
  const initialPlaybook = EU_INDUSTRY_PLAYBOOKS[0];
  const initialArchetype = initialPlaybook.archetypes[0];
  const initialInstitutions = INSTITUTION_PRESETS_BY_SECTOR[initialPlaybook.id] || [];

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<EuIndustryId>(initialPlaybook.id);
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>(initialArchetype.id);
  const [institutionName, setInstitutionName] = useState<string>(
    initialInstitutions[0] || "EuroBank AG — Retail & SME Credit Division (Frankfurt, DE)",
  );
  const [name, setName] = useState<string>(initialArchetype.name);
  const [description, setDescription] = useState<string>(initialArchetype.description);
  const [intendedPurpose, setIntendedPurpose] = useState<string>(initialArchetype.intendedPurpose);
  const [roleInValueChain, setRoleInValueChain] = useState<"provider" | "deployer" | "importer" | "distributor">(
    initialArchetype.roleInValueChain,
  );
  const [lifecycleStatus, setLifecycleStatus] = useState<"discovered" | "pilot" | "production" | "retired">(
    initialArchetype.lifecycleStatus,
  );
  const [vendorName, setVendorName] = useState<string>(initialArchetype.vendorName);
  const [versionLabel, setVersionLabel] = useState<string>(initialArchetype.versionLabel);
  const [euDatabaseId, setEuDatabaseId] = useState<string>(initialArchetype.euDatabaseId);

  const activePlaybook =
    EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === selectedIndustry) || EU_INDUSTRY_PLAYBOOKS[0];
  const sectorInstitutions =
    INSTITUTION_PRESETS_BY_SECTOR[activePlaybook.id] || INSTITUTION_PRESETS_BY_SECTOR.banking_credit;

  function applyArchetype(arch: EuSystemArchetype) {
    setSelectedArchetypeId(arch.id);
    setName(arch.name);
    setDescription(arch.description);
    setIntendedPurpose(arch.intendedPurpose);
    setRoleInValueChain(arch.roleInValueChain);
    setLifecycleStatus(arch.lifecycleStatus);
    setVendorName(arch.vendorName);
    setVersionLabel(arch.versionLabel);
    setEuDatabaseId(arch.euDatabaseId);
  }

  function handleIndustryChange(industryId: EuIndustryId) {
    setSelectedIndustry(industryId);
    const pb = EU_INDUSTRY_PLAYBOOKS.find((p) => p.id === industryId);
    if (!pb) return;
    const instList = INSTITUTION_PRESETS_BY_SECTOR[pb.id] || [];
    if (instList[0]) {
      setInstitutionName(instList[0]);
    }
    if (pb.archetypes[0]) {
      applyArchetype(pb.archetypes[0]);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const combinedVendor = formatInstitutionAndVendor(institutionName, vendorName);
    const res = await fetch("/api/systems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        intendedPurpose,
        roleInValueChain,
        domain: selectedIndustry,
        lifecycleStatus,
        versionLabel,
        vendorName: combinedVendor,
        euDatabaseId,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Could not create system");
      return;
    }
    const data = await res.json();
    router.push(`/classification/${data.system.id}?archetype=${encodeURIComponent(selectedArchetypeId)}`);
    router.refresh();
  }

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Step 1: Start AI Audit Project — Dropdown & AI Auto-Populated Registration"
        subtitle="Zero guesswork: Select the European Industry Sector, AI System Blueprint, and Audited Institution from the dropdowns below. Every statutory field is automatically pre-populated by AI and remains 100% editable."
      />

      {/* Top Master Dropdown Bar: Industry + Archetype + Audited Institution */}
      <div className="card border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/40 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center rounded-full bg-[#0F2A4A] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              Zero-Guesswork AI Auto-Population Engine
            </span>
            <h2 className="mt-1 text-base font-semibold text-[#0F2A4A]">
              1. Select Industry Sector, AI System Blueprint &amp; Audited Institution
            </h2>
            <p className="text-xs text-slate-600">
              Selecting from these dropdowns automatically fills the System Name, Technical Description, Statutory Intended Purpose (Art. 3(12)), Role, Vendor, Version, and EU Database ID below.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Dropdown 1: European Industry Sector */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#0F2A4A]">
              1. European Regulated Industry (11 Sectors)
            </label>
            <select
              className="select border-sky-300 bg-white font-medium text-slate-900"
              value={selectedIndustry}
              onChange={(e) => handleIndustryChange(e.target.value as EuIndustryId)}
            >
              {EU_INDUSTRY_PLAYBOOKS.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Specific AI System Archetype / Blueprint */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#0F2A4A]">
              2. AI System Blueprint (Auto-Fills All Fields)
            </label>
            <select
              className="select border-sky-300 bg-white font-medium text-slate-900"
              value={selectedArchetypeId}
              onChange={(e) => {
                const arch = activePlaybook.archetypes.find((a) => a.id === e.target.value);
                if (arch) applyArchetype(arch);
              }}
            >
              {activePlaybook.archetypes.map((arch) => (
                <option key={arch.id} value={arch.id}>
                  {arch.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 3: Audited Institution / Client Entity */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#0F2A4A]">
              3. Audited Institution / Client Entity
            </label>
            <select
              className="select border-sky-300 bg-white font-medium text-slate-900"
              value={sectorInstitutions.includes(institutionName) ? institutionName : "__custom__"}
              onChange={(e) => {
                if (e.target.value !== "__custom__") {
                  setInstitutionName(e.target.value);
                }
              }}
            >
              {sectorInstitutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
              <option value="__custom__">+ Custom Institution / Client Name (Edit below)</option>
            </select>
          </div>
        </div>

        {/* Quick Pill Bar for 1-Click Industry Switching */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {EU_INDUSTRY_PLAYBOOKS.map((pb) => (
            <button
              key={pb.id}
              type="button"
              onClick={() => handleIndustryChange(pb.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedIndustry === pb.id
                  ? "bg-[#0F2A4A] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
              }`}
            >
              {pb.shortLabel.split(" (")[0]}
            </button>
          ))}
        </div>

        {/* Active Industry Statutory Playbook Preview */}
        <div className="mt-4 rounded-xl border border-sky-200 bg-white/90 p-3.5 text-xs text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm text-[#0F2A4A]">{activePlaybook.name} — Statutory Audit Scope</strong>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 font-semibold text-sky-950">
              {activePlaybook.euAiActBasis}
            </span>
          </div>
          <p className="mt-1.5">
            <strong>EU Co-Regulations Automatically Mapped:</strong> {activePlaybook.coRegulations.join(" · ")}
          </p>
          <p className="mt-0.5">
            <strong>Supervisory Authorities:</strong> {activePlaybook.competentAuthorities.join(" · ")}
          </p>
        </div>
      </div>

      {/* Main Pre-Populated Form with Dropdown Selectors for Every Field */}
      <form onSubmit={onSubmit} className="card space-y-5 p-6">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-sm font-semibold text-[#0F2A4A]">
            2. AI-Prepopulated Project &amp; Statutory Inventory Details (Ready to Save or Customize)
          </h3>
          <p className="text-xs text-slate-500">
            Every field below is already populated from your selected blueprint. Use the quick-select dropdown on any field to switch templates, or edit the text directly.
          </p>
        </div>

        {/* Audited Institution / Client Entity Field */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-[#0F2A4A]">
              Audited Institution / Client Entity &amp; Business Unit (Shown on Dashboard &amp; Audit Certificates)
            </label>
            <select
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700"
              value={sectorInstitutions.includes(institutionName) ? institutionName : ""}
              onChange={(e) => {
                if (e.target.value) setInstitutionName(e.target.value);
              }}
            >
              <option value="">Switch Institution Preset…</option>
              {sectorInstitutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>
          <input
            className="input bg-white"
            required
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            placeholder="e.g. EuroBank AG — Retail Credit Division (Frankfurt, DE)"
          />
        </div>

        {/* Name Field with Dropdown Selector */}
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700">AI System / Audit Project Name</label>
            <select
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
              value={activePlaybook.archetypes.some((a) => a.name === name) ? name : ""}
              onChange={(e) => {
                const arch = activePlaybook.archetypes.find((a) => a.name === e.target.value);
                if (arch) {
                  applyArchetype(arch);
                } else if (e.target.value) {
                  setName(e.target.value);
                }
              }}
            >
              <option value="">Select Pre-Built System Name…</option>
              {activePlaybook.archetypes.map((arch) => (
                <option key={arch.id} value={arch.name}>
                  {arch.name}
                </option>
              ))}
              {activePlaybook.typicalSystems.map((sys) => (
                <option key={sys} value={sys}>
                  {sys}
                </option>
              ))}
            </select>
          </div>
          <input
            name="name"
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Description Field with Dropdown Selector */}
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700">
              System Description &amp; Technical Architecture (Annex IV Section 1)
            </label>
            <select
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
              value=""
              onChange={(e) => {
                if (e.target.value) setDescription(e.target.value);
              }}
            >
              <option value="">Select AI Pre-Populated Description Template…</option>
              {activePlaybook.archetypes.map((arch) => (
                <option key={arch.id} value={arch.description}>
                  {arch.name}: {arch.description.slice(0, 75)}…
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="description"
            className="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Intended Purpose Field with Dropdown Selector */}
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700">
              Intended Purpose — EU AI Act Art. 3(12) Statutory Wording
            </label>
            <select
              className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
              value=""
              onChange={(e) => {
                if (e.target.value) setIntendedPurpose(e.target.value);
              }}
            >
              <option value="">Select Statutory Intended Purpose Template…</option>
              {activePlaybook.archetypes.map((arch) => (
                <option key={arch.id} value={arch.intendedPurpose}>
                  {arch.name}: {arch.intendedPurpose.slice(0, 75)}…
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="intendedPurpose"
            className="textarea"
            rows={3}
            value={intendedPurpose}
            onChange={(e) => setIntendedPurpose(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              EU AI Act Sector / Annex I &amp; III Domain
            </label>
            <select
              name="domain"
              className="select"
              value={selectedIndustry}
              onChange={(e) => handleIndustryChange(e.target.value as EuIndustryId)}
            >
              {EU_INDUSTRY_PLAYBOOKS.map((pb) => (
                <option key={pb.id} value={pb.id}>
                  {pb.shortLabel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Value-Chain Role (Art. 3)</label>
            <select
              name="roleInValueChain"
              className="select"
              value={roleInValueChain}
              onChange={(e) =>
                setRoleInValueChain(e.target.value as "provider" | "deployer" | "importer" | "distributor")
              }
            >
              <option value="provider">Provider (Art. 16 — develops or places on EU market under own name)</option>
              <option value="deployer">Deployer (Art. 26 — uses AI system under its authority in the EU)</option>
              <option value="importer">Importer (Art. 23)</option>
              <option value="distributor">Distributor (Art. 24)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Lifecycle Stage</label>
            <select
              name="lifecycleStatus"
              className="select"
              value={lifecycleStatus}
              onChange={(e) =>
                setLifecycleStatus(e.target.value as "discovered" | "pilot" | "production" | "retired")
              }
            >
              <option value="discovered">Discovered / Pre-Assessment</option>
              <option value="pilot">Pilot / Real-World Testing (Art. 60)</option>
              <option value="production">In Production / Placed on EU Market</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Model / Release Version</label>
              <select
                className="rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
                value={VERSION_PRESETS.includes(versionLabel) ? versionLabel : ""}
                onChange={(e) => {
                  if (e.target.value) setVersionLabel(e.target.value);
                }}
              >
                <option value="">Select Version Preset…</option>
                {VERSION_PRESETS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <input
              name="versionLabel"
              className="input"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">AI Vendor / Foundation Model Provider</label>
              <select
                className="rounded border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
                value={VENDOR_PRESETS.includes(vendorName) ? vendorName : ""}
                onChange={(e) => {
                  if (e.target.value) setVendorName(e.target.value);
                }}
              >
                <option value="">Select EU/Global Provider…</option>
                {VENDOR_PRESETS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <input
              name="vendorName"
              className="input"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Art. 49 EU Database Registration ID (Pre-Populated)
            </label>
            <input
              name="euDatabaseId"
              className="input"
              value={euDatabaseId}
              onChange={(e) => setEuDatabaseId(e.target.value)}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-500">
            Audited Institution: <strong className="text-slate-800">{institutionName}</strong> · Blueprint:{" "}
            <strong className="text-slate-800">{name}</strong>
          </span>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Saving Project…" : "Save Project & Continue to Step 2: Pre-Populated EU Risk Classifier →"}
          </button>
        </div>
      </form>
    </div>
  );
}
