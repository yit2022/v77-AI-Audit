"use client";

import { useState } from "react";

export function BillingCancelButton({
  cancelAtPeriodEnd,
  periodEndLabel,
}: {
  cancelAtPeriodEnd: boolean;
  periodEndLabel?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState(cancelAtPeriodEnd);

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-[#0F2A4A]">Subscription</h3>
      <p className="mt-1 text-xs text-slate-600">
        {state
          ? `Cancels at period end${periodEndLabel ? ` (${periodEndLabel})` : ""}. You keep access until then.`
          : "Cancel at the end of the current billing period. No immediate lockout."}
      </p>
      <button
        type="button"
        className="btn btn-secondary mt-3 text-sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const res = await fetch("/api/billing/cancel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cancel: !state }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setError(data.error || "Update failed");
            } else {
              setState(Boolean(data.cancelAtPeriodEnd));
            }
          } catch {
            setError("Network error");
          }
          setBusy(false);
        }}
      >
        {busy ? "Saving…" : state ? "Keep subscription" : "Cancel at period end"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
