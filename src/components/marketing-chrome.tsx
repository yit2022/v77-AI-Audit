import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";
import { COMPANY } from "@/lib/company";

const nav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/frameworks", label: "Frameworks" },
  { href: "/security", label: "Security" },
  { href: "/contact", label: "Contact" },
];

export function MarketingChrome({ children }: { children: React.ReactNode }) {
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
              {n.label}
            </Link>
          ))}
          <Link href="/login" className="btn btn-secondary px-3 py-2 sm:px-5">
            Sign in
          </Link>
          <Link href="/signup" className="btn btn-primary px-3 py-2 sm:px-5">
            Start free
          </Link>
        </nav>
      </header>
      <div id="main-content" tabIndex={-1}>{children}</div>
      <footer className="border-t border-[#d7e6ef] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="space-y-2">
            <LogoMark />
            <p className="text-xs text-slate-500">{COMPANY.footerCopyright}</p>
            <p className="text-xs text-slate-500">
              Sales:{" "}
              <a className="text-sky-700 hover:underline" href={`mailto:${COMPANY.salesEmail}`}>
                {COMPANY.salesEmail}
              </a>
              {" · "}
              General:{" "}
              <a className="text-sky-700 hover:underline" href={`mailto:${COMPANY.email}`}>
                {COMPANY.email}
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-[#0F2A4A]">
            <Link href="/how-it-works" className="hover:text-sky-700">
              How it works
            </Link>
            <Link href="/frameworks" className="hover:text-sky-700">
              Frameworks
            </Link>
            <Link href="/security" className="hover:text-sky-700">
              Security
            </Link>
            <Link href="/contact" className="hover:text-sky-700">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-sky-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-sky-700">
              Terms
            </Link>
            <Link href="/login" className="hover:text-sky-700">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-sky-700">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
