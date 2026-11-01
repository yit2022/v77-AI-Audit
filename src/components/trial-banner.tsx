import Link from "next/link";
import type { OrgAccess } from "@/lib/billing/trial";

export function TrialBanner({ access }: { access: OrgAccess }) {
  if (access.billingStatus === "active") {
    if (access.cancelAtPeriodEnd) {
      return (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 sm:px-6 lg:px-8">
          Subscription cancels at period end
          {access.currentPeriodEnd
            ? ` (${access.currentPeriodEnd.toISOString().slice(0, 10)})`
            : ""}
          .{" "}
          <Link href="/billing" className="font-semibold underline">
            Manage billing
          </Link>
        </div>
      );
    }
    return null;
  }

  if (access.trialActive) {
    return (
      <div className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-950 sm:px-6 lg:px-8">
        {access.daysLeft === 1 ? "1 day" : `${access.daysLeft ?? "—"} days`} left on your 14-day trial.{" "}
        <Link href="/billing" className="font-semibold text-sky-800 underline">
          Upgrade to Team
        </Link>{" "}
        — card checkout, charged in USD.
      </div>
    );
  }

  if (access.readOnly) {
    return (
      <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-950 sm:px-6 lg:px-8">
        {access.trialExpired
          ? "Your trial has ended — workspace is read-only."
          : "Subscription inactive — workspace is read-only."}{" "}
        <Link href="/billing" className="font-semibold underline">
          Upgrade to restore editing
        </Link>
      </div>
    );
  }

  return null;
}
