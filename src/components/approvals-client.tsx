"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  title: string;
  entityType: string;
  entityId: string;
  status: string;
  decisionNote: string;
  createdAt: string | Date;
};

export function ApprovalsClient({
  approvals,
  canDecide,
  canRequest,
}: {
  approvals: Row[];
  canDecide: boolean;
  canRequest: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function decide(id: string, decision: "approved" | "rejected") {
    setMsg("");
    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalId: id, decision }),
    });
    setMsg(res.ok ? `Marked ${decision}.` : (await res.json().catch(() => ({}))).error || "Failed");
    router.refresh();
  }

  async function requestDemo() {
    setMsg("");
    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "assessment",
        entityId: "manual",
        title: "Assessment pack ready for review",
      }),
    });
    setMsg(res.ok ? "Approval requested." : (await res.json().catch(() => ({}))).error || "Failed");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canRequest ? (
        <button type="button" className="btn btn-secondary" onClick={() => void requestDemo()}>
          Request assessment approval
        </button>
      ) : (
        <p className="text-sm text-slate-600">Auditors are read-only — request approvals via an owner.</p>
      )}
      {msg ? (
        <p className="text-sm text-sky-800" role="status">
          {msg}
        </p>
      ) : null}
      <ul className="space-y-3">
        {approvals.map((a) => (
          <li key={a.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium text-[#0F2A4A]">{a.title}</div>
                <p className="mt-1 text-xs text-slate-500">
                  {a.entityType} · {a.status} · {new Date(a.createdAt).toLocaleString()}
                </p>
                {a.decisionNote ? <p className="mt-1 text-sm text-slate-600">{a.decisionNote}</p> : null}
              </div>
              {canDecide && a.status === "pending" ? (
                <div className="flex gap-2">
                  <button type="button" className="btn btn-primary" onClick={() => void decide(a.id, "approved")}>
                    Approve
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => void decide(a.id, "rejected")}>
                    Reject
                  </button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {approvals.length === 0 ? <p className="text-sm text-slate-600">No approval requests yet.</p> : null}
    </div>
  );
}
