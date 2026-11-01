"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Partner = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  customDomain?: string;
};

type Client = {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  seatLimit: number;
  members: number;
  systems: number;
};

type Linkable = { id: string; name: string; slug: string; partnerId: string | null };

export function PartnerClient({
  partner,
  clients,
  linkable,
  labels,
}: {
  partner: Partner | null;
  clients: Client[];
  linkable: Linkable[];
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Request failed");
      return;
    }
    setMsg(labels.saved || "Saved");
    router.refresh();
  }

  if (!partner) {
    return (
      <div className="card space-y-4 p-5">
        <p className="text-sm text-slate-600">{labels.createHint}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="partner-name">
              {labels.partnerName}
            </label>
            <input id="partner-name" className="input w-72" placeholder="Northbridge Advisory" />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => {
              const name = (document.getElementById("partner-name") as HTMLInputElement).value;
              void post({ action: "create", name });
            }}
          >
            {labels.createPartner}
          </button>
        </div>
        {msg ? <p className="text-sm text-sky-800">{msg}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section
        className="card overflow-hidden"
        style={{ borderTop: `4px solid ${partner.accentColor}` }}
      >
        <div className="flex flex-wrap items-center gap-4 p-5" style={{ background: `${partner.primaryColor}08` }}>
          {partner.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.logoUrl} alt="" className="h-12 w-12 rounded-lg object-contain bg-white p-1 border" />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ background: partner.primaryColor }}
            >
              {partner.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-[#0F2A4A]">{partner.name}</h2>
            <p className="text-xs text-slate-500">/{partner.slug}</p>
          </div>
        </div>
        <div className="grid gap-3 border-t border-slate-100 p-5 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.partnerName}</label>
            <input id="brand-name" className="input w-full" defaultValue={partner.name} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.logoUrl}</label>
            <input id="brand-logo" className="input w-full" defaultValue={partner.logoUrl} placeholder="https://…" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.customDomain || "Custom domain"}</label>
            <input id="brand-domain" className="input w-full" defaultValue={partner.customDomain || ""} placeholder="trust.partner.example" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.primaryColor}</label>
            <input id="brand-primary" className="input w-full" defaultValue={partner.primaryColor} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">{labels.accentColor}</label>
            <input id="brand-accent" className="input w-full" defaultValue={partner.accentColor} />
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() =>
              void post({
                action: "branding",
                name: (document.getElementById("brand-name") as HTMLInputElement).value,
                logoUrl: (document.getElementById("brand-logo") as HTMLInputElement).value,
                primaryColor: (document.getElementById("brand-primary") as HTMLInputElement).value,
                accentColor: (document.getElementById("brand-accent") as HTMLInputElement).value,
                customDomain: (document.getElementById("brand-domain") as HTMLInputElement).value,
              })
            }
          >
            {labels.saveBranding}
          </button>
          {msg ? <span className="ml-3 text-sm text-sky-800">{msg}</span> : null}
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-sm font-semibold text-[#0F2A4A]">{labels.clients}</h3>
        <p className="mt-1 text-xs text-slate-500">{labels.clientsHint}</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="client-name">
              {labels.newClient}
            </label>
            <input id="client-name" className="input w-72" placeholder="Client GmbH" />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => {
              const orgName = (document.getElementById("client-name") as HTMLInputElement).value;
              void post({ action: "create_client", orgName });
            }}
          >
            {labels.addClient}
          </button>
        </div>
        {linkable.length ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="link-org">
                {labels.linkExisting}
              </label>
              <select id="link-org" className="select min-w-[16rem]">
                {linkable.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => {
                const orgId = (document.getElementById("link-org") as HTMLSelectElement).value;
                void post({ action: "link_client", orgId });
              }}
            >
              {labels.linkClient}
            </button>
          </div>
        ) : null}
        <ul className="mt-5 divide-y divide-slate-100">
          {clients.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <div className="font-medium text-[#0F2A4A]">{c.name}</div>
                <div className="text-xs text-slate-500">
                  /{c.slug} · {c.planTier} · {c.members} members · {c.systems} systems
                </div>
              </div>
            </li>
          ))}
          {clients.length === 0 ? <li className="py-3 text-sm text-slate-500">{labels.noClients}</li> : null}
        </ul>
      </section>
    </div>
  );
}
