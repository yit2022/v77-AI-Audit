"use client";

import { useState } from "react";

export function BillingCheckoutButton({
  tier,
  enabled,
  label = "Pay by card",
  interval = "monthly",
}: {
  tier: string;
  enabled: boolean;
  label?: string;
  interval?: "monthly" | "annual";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!enabled) {
    return (
      <p className="mt-3 text-xs text-slate-500">
        Card checkout unlocks when billing keys are configured.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        className="btn btn-primary text-sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const res = await fetch("/api/billing/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tier, interval }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setError(data.error || "Checkout failed");
              setBusy(false);
              return;
            }
            if (data.authorizationUrl) {
              window.location.href = data.authorizationUrl as string;
              return;
            }
            setError("No authorization URL returned");
          } catch {
            setError("Network error");
          }
          setBusy(false);
        }}
      >
        {busy ? "Starting…" : label}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
