"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  vendorName: string;
  status: string;
  riskScore: string;
  shareUrl: string;
  createdAt: string;
};

export function VendorsClient({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [share, setShare] = useState("");

  async function create() {
    const vendorName = (document.getElementById("vendor-name") as HTMLInputElement).value;
    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorName }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) setShare(body.shareUrl || "");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="vendor-name">
            Vendor name
          </label>
          <input id="vendor-name" className="input w-72" placeholder="Acme Models GmbH" />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => void create()}>
          Create shareable questionnaire
        </button>
      </div>
      {share ? (
        <p className="text-sm text-sky-800">
          Share link (no email send):{" "}
          <a className="font-semibold underline" href={share}>
            {share}
          </a>
        </p>
      ) : null}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card p-4 text-sm">
            <div className="font-medium text-[#0F2A4A]">{r.vendorName}</div>
            <p className="mt-1 text-slate-600">
              {r.status}
              {r.riskScore ? ` · ${r.riskScore}` : ""}
            </p>
            <a className="mt-2 inline-block font-semibold text-sky-700 hover:underline" href={r.shareUrl}>
              Open share link
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
