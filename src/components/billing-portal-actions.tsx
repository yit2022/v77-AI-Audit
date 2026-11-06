"use client";

import { useState } from "react";

export function BillingCancelButton({
  cancelAtPeriodEnd,
  periodEndLabel,
  stripeCustomerId,
}: {
  cancelAtPeriodEnd: boolean;
  periodEndLabel?: string | null;
  stripeCustomerId?: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState(cancelAtPeriodEnd);

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-[#0F2A4A]">Subscription & EU VAT invoicing</h3>
      <p className="mt-1 text-xs text-slate-600">
        {state
          ? `Cancels at period end${periodEndLabel ? ` (${periodEndLabel})` : ""}. You keep access until then.`
          : "Manage your card or SEPA Direct Debit mandate, update your EU VAT number, or cancel at the end of the current billing period."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {stripeCustomerId && stripeCustomerId.startsWith("cus_") ? (
          <button
            type="button"
            className="btn btn-primary text-sm"
            disabled={portalBusy}
            onClick={async () => {
              setPortalBusy(true);
              setError("");
              try {
                const res = await fetch("/api/billing/portal", { method: "POST" });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.url) {
                  setError(data.error || "Could not open Stripe Customer Portal");
                  setPortalBusy(false);
                  return;
                }
                window.location.href = data.url as string;
                return;
              } catch {
                setError("Network error");
              }
              setPortalBusy(false);
            }}
          >
            {portalBusy ? "Opening Stripe…" : "Manage in Stripe Customer Portal"}
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-secondary text-sm"
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
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
