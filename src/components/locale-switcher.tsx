"use client";

import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";

const COOKIE = "v77_locale";

export function LocaleSwitcher({ value }: { value: Locale }) {
  function onChange(next: Locale) {
    document.cookie = `${COOKIE}=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    window.location.reload();
  }

  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      <span className="sr-only">Language</span>
      <select
        className="select w-auto py-1 text-xs"
        aria-label="Language"
        value={value}
        onChange={(e) => onChange(e.target.value as Locale)}
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}
