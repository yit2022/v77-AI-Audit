"use client";

import { LogoMark } from "@/components/logo-mark";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ensureLocale, t, type Locale } from "@/lib/i18n/dictionaries";

type NavItem = { href: string; key: string };
type NavSection = { id: string; label: string; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { href: "/dashboard", key: "nav.dashboard" },
      { href: "/compliance", key: "nav.compliance" },
      { href: "/onboarding", key: "nav.onboarding" },
      { href: "/notifications", key: "nav.notifications" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory & Risk",
    items: [
      { href: "/systems", key: "nav.inventory" },
      { href: "/eu-ai-act", key: "nav.euAiAct" },
      { href: "/impact", key: "nav.impact" },
      { href: "/monitoring", key: "nav.monitoring" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    items: [
      { href: "/controls", key: "nav.controls" },
      { href: "/gap-analysis", key: "nav.gapAnalysis" },
      { href: "/assessments", key: "nav.assessments" },
      { href: "/findings", key: "nav.findings" },
      { href: "/approvals", key: "nav.approvals" },
    ],
  },
  {
    id: "evidence",
    label: "Evidence",
    items: [
      { href: "/evidence", key: "nav.evidence" },
      { href: "/evidence-requests", key: "nav.evidenceRequests" },
      { href: "/policies", key: "nav.policies" },
      { href: "/model-cards", key: "nav.modelCards" },
    ],
  },
  {
    id: "testing",
    label: "Testing",
    items: [
      { href: "/tests/fairness", key: "nav.fairness" },
      { href: "/tests/redteam", key: "nav.redteam" },
      { href: "/tests/evals", key: "nav.evals" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      { href: "/vendors", key: "nav.vendors" },
      { href: "/incidents", key: "nav.incidents" },
      { href: "/reminders", key: "nav.reminders" },
      { href: "/auditor", key: "nav.auditor" },
      { href: "/board-report", key: "nav.boardReport" },
      { href: "/partner", key: "nav.partner" },
      { href: "/activity", key: "nav.activity" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { href: "/billing", key: "nav.billing" },
      { href: "/settings", key: "nav.settings" },
    ],
  },
];

function sectionContainsPath(section: NavSection, pathname: string) {
  return section.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
}

export function Sidebar({
  userName,
  orgName,
  role,
  locale = "en",
  showPlatform = false,
}: {
  userName: string;
  orgName: string;
  role: string;
  locale?: Locale;
  showPlatform?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [localeReady, setLocaleReady] = useState(locale === "en");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    void ensureLocale(locale).then(() => {
      if (!cancelled) setLocaleReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    // Expand the section that contains the active route; leave others as user left them.
    const active = SECTIONS.find((s) => sectionContainsPath(s, pathname));
    if (!active) return;
    setCollapsed((prev) => ({ ...prev, [active.id]: false }));
  }, [pathname]);

  const sections = useMemo(() => {
    return SECTIONS.map((section) => {
      let items = section.items;
      if (section.id === "settings" && role === "admin") {
        items = [
          ...items.filter((i) => i.href !== "/settings"),
          { href: "/leads", key: "nav.leads" },
          ...(showPlatform ? [{ href: "/platform", key: "nav.platform" }] : []),
          { href: "/settings", key: "nav.settings" },
        ];
      }
      return { ...section, items };
    });
  }, [role, showPlatform]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isCollapsed(id: string) {
    // Default open so every destination is one click away; users can collapse sections.
    if (collapsed[id] === undefined) return false;
    return collapsed[id];
  }

  const label = (key: string) => (localeReady ? t(locale, key) : t("en", key));

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
        <nav className="flex-1 space-y-3 overflow-y-auto p-3" aria-label="App">
          {sections.map((section) => {
            const closed = isCollapsed(section.id);
            return (
              <div key={section.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 hover:bg-slate-50"
                  aria-expanded={!closed}
                  onClick={() => setCollapsed((prev) => ({ ...prev, [section.id]: !isCollapsed(section.id) }))}
                >
                  <span>{section.label}</span>
                  <span aria-hidden className="text-slate-400">
                    {closed ? "+" : "−"}
                  </span>
                </button>
                {!closed ? (
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((l) => {
                      const activePath = pendingHref || pathname;
                      const active = activePath === l.href || activePath.startsWith(l.href + "/");
                      return (
                        <Link
                          key={l.href}
                          href={l.href}
                          prefetch={true}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            active ? "bg-sky-50 text-sky-900" : "text-slate-700 hover:bg-slate-50"
                          }`}
                          onClick={() => {
                            setPendingHref(l.href);
                            setOpen(false);
                          }}
                        >
                          <span>{label(l.key)}</span>
                          {pendingHref === l.href && pathname !== l.href ? (
                            <span className="h-2 w-2 animate-ping rounded-full bg-sky-500" aria-hidden />
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
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
            {label("nav.signOut")}
          </button>
        </div>
      </aside>
    </>
  );
}
