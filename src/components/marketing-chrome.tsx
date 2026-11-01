import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";
import { COMPANY } from "@/lib/company";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/dictionaries";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function MarketingChrome({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  const nav = [
    { href: "/how-it-works", key: "mkt.nav.how" as const },
    { href: "/frameworks", key: "mkt.nav.frameworks" as const },
    { href: "/security", key: "mkt.nav.security" as const },
    { href: "/contact", key: "mkt.nav.contact" as const },
    { href: "/developers", key: "mkt.nav.developers" as const },
  ];

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
              {t(locale, n.key)}
            </Link>
          ))}
          <LocaleSwitcher value={locale} />
          <Link href="/login" className="btn btn-secondary px-3 py-2 sm:px-5">
            {t(locale, "mkt.nav.signin")}
          </Link>
          <Link href="/signup" className="btn btn-primary px-3 py-2 sm:px-5">
            {t(locale, "mkt.nav.signup")}
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
              {t(locale, "mkt.footer.sales")}:{" "}
              <a className="text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
                {COMPANY.salesEmail}
              </a>
              {" · "}
              {t(locale, "mkt.footer.general")}:{" "}
              <a className="text-sky-700 hover:underline" href={`mailto:${COMPANY.email}`}>
                {COMPANY.email}
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-[#0F2A4A]">
            <Link href="/how-it-works" className="hover:text-sky-700">
              {t(locale, "mkt.nav.how")}
            </Link>
            <Link href="/frameworks" className="hover:text-sky-700">
              {t(locale, "mkt.nav.frameworks")}
            </Link>
            <Link href="/security" className="hover:text-sky-700">
              {t(locale, "mkt.nav.security")}
            </Link>
            <Link href="/developers" className="hover:text-sky-700">
              {t(locale, "mkt.nav.developers")}
            </Link>
            <Link href="/contact" className="hover:text-sky-700">
              {t(locale, "mkt.nav.contact")}
            </Link>
            <Link href="/privacy" className="hover:text-sky-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-sky-700">
              Terms
            </Link>
            <Link href="/login" className="hover:text-sky-700">
              {t(locale, "mkt.nav.signin")}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
