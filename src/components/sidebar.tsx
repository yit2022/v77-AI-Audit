"use client";

import { LogoMark } from "@/components/logo-mark";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { t, type Locale } from "@/lib/i18n/dictionaries";

const linkDefs: Array<{ href: string; key: string }> = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/compliance", key: "nav.compliance" },
  { href: "/eu-ai-act", key: "nav.euAiAct" },
  { href: "/systems", key: "nav.inventory" },
  { href: "/controls", key: "nav.controls" },
  { href: "/gap-analysis", key: "nav.gapAnalysis" },
  { href: "/assessments", key: "nav.assessments" },
  { href: "/evidence", key: "nav.evidence" },
  { href: "/evidence-requests", key: "nav.evidenceRequests" },
  { href: "/policies", key: "nav.policies" },
  { href: "/model-cards", key: "nav.modelCards" },
  { href: "/vendors", key: "nav.vendors" },
  { href: "/incidents", key: "nav.incidents" },
  { href: "/tests/fairness", key: "nav.fairness" },
  { href: "/tests/redteam", key: "nav.redteam" },
  { href: "/tests/evals", key: "nav.evals" },
  { href: "/impact", key: "nav.impact" },
  { href: "/monitoring", key: "nav.monitoring" },
  { href: "/reminders", key: "nav.reminders" },
  { href: "/findings", key: "nav.findings" },
  { href: "/approvals", key: "nav.approvals" },
  { href: "/auditor", key: "nav.auditor" },
  { href: "/board-report", key: "nav.boardReport" },
  { href: "/partner", key: "nav.partner" },
  { href: "/billing", key: "nav.billing" },
  { href: "/onboarding", key: "nav.onboarding" },
  { href: "/notifications", key: "nav.notifications" },
  { href: "/activity", key: "nav.activity" },
  { href: "/settings", key: "nav.settings" },
];

export function Sidebar({
  userName,
  orgName,
  role,
  locale = "en",
}: {
  userName: string;
  orgName: string;
  role: string;
  locale?: Locale;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const links = linkDefs.map((l) => ({ href: l.href, label: t(locale, l.key) }));
  const navLinks =
    role === "admin"
      ? [
          ...links.slice(0, -1),
          { href: "/leads", label: t(locale, "nav.leads") },
          { href: "/platform", label: t(locale, "nav.platform") },
          links[links.length - 1],
        ]
      : links;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-[#d7e6ef] bg-white px-4 py-3 lg:hidden">
        <LogoMark />
        <button type="button" className="btn btn-secondary" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          Menu
        </button>
      </div>
      <aside
        className={`${open ? "flex" : "hidden"} w-full flex-col border-r border-[#d7e6ef] bg-white lg:flex lg:w-64 lg:min-h-screen`}
      >
        <div className="hidden border-b border-[#d7e6ef] p-4 lg:block">
          <LogoMark />
          <p className="mt-2 truncate text-xs text-slate-500">{orgName}</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="App">
          {navLinks.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-sky-50 text-sky-900" : "text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#d7e6ef] p-4">
          <div className="text-sm font-medium text-slate-800">{userName}</div>
          <div className="text-xs capitalize text-slate-500">{role.replace("_", " ")}</div>
          <div className="mt-3">
            <LocaleSwitcher value={locale} />
          </div>
          <button type="button" onClick={logout} className="btn btn-secondary mt-3 w-full">
            {t(locale, "nav.signOut")}
          </button>
        </div>
      </aside>
    </>
  );
}
