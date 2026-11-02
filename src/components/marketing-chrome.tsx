"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";
import { COMPANY } from "@/lib/company";
import { ensureLocale, isLocale, t, tEn, type Locale } from "@/lib/i18n/dictionaries";
import { LocaleSwitcher } from "@/components/locale-switcher";

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|; )v77_locale=([^;]+)/);
  const raw = m ? decodeURIComponent(m[1]) : "en";
  return isLocale(raw) ? raw : "en";
}

export function MarketingChrome({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loc = readLocaleCookie();
    setLocale(loc);
    document.documentElement.lang = loc;
    void ensureLocale(loc).then(() => setReady(true));
  }, []);

  const tr = (key: string) => (ready ? t(locale, key) : tEn(key));
  const nav = [
    { href: "/pricing", key: "mkt.pricing.title" },
    { href: "/how-it-works", key: "mkt.nav.how" },
    { href: "/demo", key: "mkt.nav.demo" },
    { href: "/resources", key: "mkt.nav.resources" },
    { href: "/frameworks", key: "mkt.nav.frameworks" },
    { href: "/security", key: "mkt.nav.security" },
    { href: "/contact", key: "mkt.nav.contact" },
    { href: "/developers", key: "mkt.nav.developers" },
  ] as const;

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8f7fd_0%,_#ffffff_48%,_#ffffff_100%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6 sm:py-6">
        <LogoMark />
        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3" aria-label="Primary">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="hidden text-sm font-medium text-slate-600 hover:text-[#0F2A4A] sm:inline"
            >
              {tr(n.key)}
            </Link>
          ))}
          <LocaleSwitcher value={locale} />
          <Link href="/login" className="btn btn-secondary px-3 py-2 sm:px-5">
            {tr("mkt.nav.signin")}
          </Link>
          <Link href="/signup" className="btn btn-primary px-3 py-2 sm:px-5">
            {tr("mkt.nav.signup")}
          </Link>
        </nav>
      </header>
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <footer className="border-t border-[#d7e6ef] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="space-y-2">
            <LogoMark />
            <p className="text-xs text-slate-500">{COMPANY.footerCopyright}</p>
            <p className="text-xs text-slate-500">
              {tr("mkt.footer.sales")}:{" "}
              <a className="text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
                {COMPANY.salesEmail}
              </a>
              {" · "}
              {tr("mkt.footer.general")}:{" "}
              <a className="text-sky-700 hover:underline" href={`mailto:${COMPANY.email}`}>
                {COMPANY.email}
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-[#0F2A4A]">
            <Link href="/how-it-works" className="hover:text-sky-700">
              {tr("mkt.nav.how")}
            </Link>
            <Link href="/frameworks" className="hover:text-sky-700">
              {tr("mkt.nav.frameworks")}
            </Link>
            <Link href="/security" className="hover:text-sky-700">
              {tr("mkt.nav.security")}
            </Link>
            <Link href="/developers" className="hover:text-sky-700">
              {tr("mkt.nav.developers")}
            </Link>
            <Link href="/contact" className="hover:text-sky-700">
              {tr("mkt.nav.contact")}
            </Link>
            <Link href="/privacy" className="hover:text-sky-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-sky-700">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
