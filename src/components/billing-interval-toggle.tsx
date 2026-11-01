"use client";

import { useRouter, usePathname } from "next/navigation";
import type { BillingInterval } from "@/lib/billing/currency";

export function BillingIntervalToggle({ interval }: { interval: BillingInterval }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm">
      {(["monthly", "annual"] as const).map((v) => (
        <button
          key={v}
          type="button"
          className={`rounded-full px-4 py-1.5 capitalize ${interval === v ? "bg-[#0F2A4A] text-white" : "text-slate-600"}`}
          onClick={() => router.push(`${pathname}?interval=${v}`)}
        >
          {v}
          {v === "annual" ? <span className="ml-1 text-xs opacity-80">save 2 mo</span> : null}
        </button>
      ))}
    </div>
  );
}
