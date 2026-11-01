"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InventoryCsvImport() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStatus("loading");
    setMessage("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/systems/import", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setMessage(data.error || "Import failed");
      return;
    }
    setStatus("done");
    setMessage(`Imported ${data.imported} system${data.imported === 1 ? "" : "s"}.`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="btn btn-secondary cursor-pointer">
        {status === "loading" ? "Importing…" : "Import CSV"}
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={onChange} disabled={status === "loading"} />
      </label>
      <a className="text-xs font-medium text-sky-700 hover:underline" href="/templates/ai-inventory-import.csv">
        Download template
      </a>
      {message ? (
        <span className={`text-xs ${status === "error" ? "text-red-700" : "text-slate-600"}`}>{message}</span>
      ) : null}
    </div>
  );
}
