export type Locale = "en" | "de" | "fr";

export const LOCALES: Array<{ code: Locale; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "fr", label: "French", native: "Français" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.euAiAct": "EU AI Act",
  "nav.inventory": "AI Inventory",
  "nav.compliance": "Compliance",
  "nav.impact": "FRIA / DPIA",
  "nav.settings": "Settings",
  "common.language": "Language",
  "common.save": "Save",
  "eu.title": "EU AI Act deep dive",
  "eu.subtitle": "Risk tiers, role obligations, Annex IV documentation and conformity tracking.",
  "cookie.title": "Cookies & privacy",
  "cookie.body": "We use essential cookies to run V77 Trust. Analytics and marketing cookies stay off unless you opt in.",
  "cookie.acceptEssential": "Essential only",
  "cookie.acceptAll": "Accept all",
  "money.currency": "EUR",
};

/** German stubs — incomplete on purpose; falls back to EN. */
const de: Dict = {
  "nav.dashboard": "Übersicht",
  "nav.euAiAct": "EU-KI-Verordnung",
  "nav.inventory": "KI-Inventar",
  "nav.compliance": "Compliance",
  "nav.impact": "FRIA / DSFA",
  "nav.settings": "Einstellungen",
  "common.language": "Sprache",
  "common.save": "Speichern",
  "eu.title": "EU-KI-Verordnung — Vertiefung",
  "eu.subtitle": "Risikostufen, Pflichten je Rolle, Anhang-IV-Dokumentation und Konformitätsverfolgung.",
  "cookie.title": "Cookies & Datenschutz",
  "cookie.body": "Wir verwenden notwendige Cookies für V77 Trust. Analyse- und Marketing-Cookies bleiben deaktiviert, bis Sie zustimmen.",
  "cookie.acceptEssential": "Nur notwendige",
  "cookie.acceptAll": "Alle akzeptieren",
  "money.currency": "EUR",
};

/** French stubs — incomplete on purpose; falls back to EN. */
const fr: Dict = {
  "nav.dashboard": "Tableau de bord",
  "nav.euAiAct": "Règlement IA de l’UE",
  "nav.inventory": "Inventaire IA",
  "nav.compliance": "Conformité",
  "nav.impact": "FRIA / AIPD",
  "nav.settings": "Paramètres",
  "common.language": "Langue",
  "common.save": "Enregistrer",
  "eu.title": "Règlement IA — approfondissement",
  "eu.subtitle": "Niveaux de risque, obligations par rôle, documentation annexe IV et suivi de conformité.",
  "cookie.title": "Cookies et confidentialité",
  "cookie.body": "Nous utilisons des cookies essentiels pour V77 Trust. Les cookies analytiques et marketing restent désactivés sauf consentement.",
  "cookie.acceptEssential": "Essentiels uniquement",
  "cookie.acceptAll": "Tout accepter",
  "money.currency": "EUR",
};

const TABLES: Record<Locale, Dict> = { en, de, fr };

export function t(locale: Locale, key: string): string {
  return TABLES[locale]?.[key] ?? TABLES.en[key] ?? key;
}

export function isLocale(v: string | null | undefined): v is Locale {
  return v === "en" || v === "de" || v === "fr";
}
