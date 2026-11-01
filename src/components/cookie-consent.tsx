"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isLocale, t, type Locale } from "@/lib/i18n/dictionaries";

const KEY = "v77_cookie_consent";

type Consent = "essential" | "all" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY) as Consent;
      setConsent(raw === "essential" || raw === "all" ? raw : null);
      const m = document.cookie.match(/(?:^|; )v77_locale=([^;]+)/);
      const loc = m ? decodeURIComponent(m[1]) : "en";
      setLocale(isLocale(loc) ? loc : "en");
    } catch {
      setConsent(null);
    }
    setReady(true);
  }, []);

  function choose(next: Exclude<Consent, null>) {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    setConsent(next);
    // No tracking scripts are loaded by default or on "essential".
    // "all" is recorded for future optional analytics — still no third-party tags shipped yet.
  }

  if (!ready || consent) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d7e6ef] bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h2 id="cookie-title" className="text-sm font-semibold text-[#0F2A4A]">
            {t(locale, "cookie.title")}
          </h2>
          <p id="cookie-desc" className="mt-1 text-sm text-slate-600">
            {t(locale, "cookie.body")}{" "}
            <Link href="/privacy" className="font-medium text-sky-700 hover:underline">
              {t(locale, "cookie.privacyLink")}
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => choose("essential")}>
            {t(locale, "cookie.acceptEssential")}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => choose("all")}>
            {t(locale, "cookie.acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
