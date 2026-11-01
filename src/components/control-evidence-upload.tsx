"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ControlEvidenceUpload({
  systemId,
  controlId,
  controlCode,
}: {
  systemId: string;
  controlId: string;
  controlCode: string;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("systemId", systemId);
    fd.set("controlId", controlId);
    if (!fd.get("title")) fd.set("title", `${controlCode} evidence`);
    const res = await fetch("/api/evidence", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      setMsg("Upload failed");
      return;
    }
    const data = await res.json();
    setMsg(`Stored ${String(data.sha256 || "").slice(0, 10)}…`);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="file" name="file" required className="text-xs" />
      <input type="hidden" name="title" value={`${controlCode} evidence`} />
      <button type="submit" className="btn btn-secondary !px-3 !py-1 text-xs" disabled={loading}>
        {loading ? "Uploading…" : "Upload to R2"}
      </button>
      {msg ? <span className="text-xs text-slate-500">{msg}</span> : null}
    </form>
  );
}
