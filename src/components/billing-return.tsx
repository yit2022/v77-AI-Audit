"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function BillingReturn() {
  const search = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const checkout = search.get("checkout");
    const reference = search.get("reference") || search.get("trxref");
    if (checkout !== "return" || !reference) return;
    let cancelled = false;
    (async () => {
      setMsg("Confirming payment with Paystack…");
      const res = await fetch("/api/billing/verify-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (res.ok && data.ok) {
        setMsg(data.alreadyPaid ? "Plan already active." : "Payment confirmed — plan activated.");
      } else if (data.failed) {
        setMsg("Payment was not completed.");
      } else {
        setMsg(data.reason === "verify_failed" ? "Payment still pending — we will keep checking." : data.error || data.reason || "Could not confirm payment yet.");
      }
      router.replace("/billing");
      router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [search, router]);

  if (!msg) return null;
  return <p className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950">{msg}</p>;
}
