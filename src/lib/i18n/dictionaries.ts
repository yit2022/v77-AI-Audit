import type { Locale } from "./locales";
export type { Locale } from "./locales";
export { LOCALES, isLocale } from "./locales";
import en from "./dict/en";

type Dict = Record<string, string>;

const cache: Partial<Record<Locale, Dict>> = { en };

const loaders: Record<Locale, () => Promise<Dict>> = {
  en: async () => en,
  de: async () => (await import("./dict/de")).default,
  fr: async () => (await import("./dict/fr")).default,
  pl: async () => (await import("./dict/pl")).default,
  nl: async () => (await import("./dict/nl")).default,
  es: async () => (await import("./dict/es")).default,
  it: async () => (await import("./dict/it")).default,
  sv: async () => (await import("./dict/sv")).default,
};

/** Eager sync lookup — uses en (+ cached locales). Prefer ensureLocale on clients. */
export function t(locale: Locale, key: string): string {
  return cache[locale]?.[key] ?? en[key] ?? key;
}

export async function ensureLocale(locale: Locale): Promise<void> {
  if (cache[locale]) return;
  cache[locale] = await loaders[locale]();
}

export function hasTranslation(locale: Locale, key: string): boolean {
  return Boolean(cache[locale]?.[key] ?? (locale === "en" ? en[key] : false));
}

export function dictKeys(): string[] {
  return Object.keys(en);
}

/** Marketing/static pages: always English SSR strings (no cookie/DB). */
export function tEn(key: string): string {
  return en[key] ?? key;
}
