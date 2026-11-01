export type Locale = "en" | "de" | "fr" | "pl" | "nl" | "es" | "it" | "sv";

export const LOCALES: Array<{ code: Locale; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "fr", label: "French", native: "Français" },
  { code: "pl", label: "Polish", native: "Polski" },
  { code: "nl", label: "Dutch", native: "Nederlands" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "sv", label: "Swedish", native: "Svenska" },
];

const LOCALE_SET = new Set<string>(LOCALES.map((l) => l.code));

export function isLocale(v: string | null | undefined): v is Locale {
  return Boolean(v && LOCALE_SET.has(v));
}
