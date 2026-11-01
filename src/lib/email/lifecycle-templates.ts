import { COMPANY } from "@/lib/company";
import type { LocaleCode } from "./templates";

type L = LocaleCode;

const LOCALES: L[] = ["en", "de", "fr", "pl", "nl", "es", "it", "sv"];

function norm(locale?: string): L {
  const l = (locale || "en").slice(0, 2).toLowerCase() as L;
  return LOCALES.includes(l) ? l : "en";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function shell(textBody: string, unsub?: string): { html: string; text: string; fromName: string } {
  const footer = unsub
    ? `\n\n— ${COMPANY.productName}\nUnsubscribe: ${unsub}`
    : `\n\n— ${COMPANY.productName}`;
  const full = textBody + footer;
  const unsubHtml = unsub
    ? `<p style="margin-top:28px;font-size:11px;color:#94a3b8"><a href="${escapeHtml(unsub)}" style="color:#64748b">Unsubscribe</a> from product tips</p>`
    : "";
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#0f172a;background:#f8fafc;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e2e8f0">
    <a href="https://v77trust.com" style="display:inline-block;margin:0 0 16px;text-decoration:none"><img src="https://v77trust.com/brand/v77-email-logo.png" alt="V77 Trust" width="160" height="48" style="display:block;width:160px;height:auto;border:0;outline:none" /></a>
    <div style="height:4px;background:#6FCDF5;border-radius:2px;margin-bottom:20px"></div>
    <pre style="white-space:pre-wrap;font-family:inherit;margin:0;line-height:1.5">${escapeHtml(textBody)}</pre>
    <p style="margin-top:24px;font-size:12px;line-height:1.5;color:#64748b">${COMPANY.productName} · ${COMPANY.legalName}<br/>${COMPANY.addressLine}<br/><a href="https://v77trust.com" style="color:#64748b;text-decoration:underline">v77trust.com</a></p>
    ${unsubHtml}
  </div></body></html>`;
  return { html, text: full, fromName: COMPANY.productName };
}

const day3: Record<L, (name: string, org: string) => { subject: string; body: string }> = {
  en: (n, o) => ({
    subject: `3 tips to get value from ${COMPANY.productName}`,
    body: `Hi ${n},\n\nQuick wins for “${o}”:\n1. Add your first AI systems to the inventory\n2. Run the risk checker / classification\n3. Upload one piece of evidence to the vault\n\nYour 14-day trial is active — upgrade anytime from Billing.`,
  }),
  de: (n, o) => ({
    subject: `3 Tipps für ${COMPANY.productName}`,
    body: `Hallo ${n},\n\nSchnelle Erfolge für „${o}“:\n1. KI-Systeme inventarisieren\n2. Risikoprüfung / Klassifizierung\n3. Einen Nachweis hochladen\n\nIhre 14-Tage-Testphase läuft — Upgrade unter Abrechnung.`,
  }),
  fr: (n, o) => ({
    subject: `3 conseils pour ${COMPANY.productName}`,
    body: `Bonjour ${n},\n\nPour « ${o} » :\n1. Ajoutez vos systèmes d’IA\n2. Lancez la classification\n3. Téléversez une preuve\n\nVotre essai de 14 jours est actif — passez à l’offre payante dans Facturation.`,
  }),
  pl: (n, o) => ({
    subject: `3 wskazówki — ${COMPANY.productName}`,
    body: `Cześć ${n},\n\nDla „${o}”:\n1. Dodaj systemy AI\n2. Uruchom klasyfikację ryzyka\n3. Prześlij dowód\n\nTwój 14-dniowy trial jest aktywny — ulepsz plan w Billing.`,
  }),
  nl: (n, o) => ({
    subject: `3 tips voor ${COMPANY.productName}`,
    body: `Hallo ${n},\n\nVoor “${o}”:\n1. Voeg AI-systemen toe\n2. Start de risicoclassificatie\n3. Upload bewijs\n\nJe proefperiode van 14 dagen loopt — upgrade via Facturatie.`,
  }),
  es: (n, o) => ({
    subject: `3 consejos para ${COMPANY.productName}`,
    body: `Hola ${n},\n\nPara “${o}”:\n1. Añade sistemas de IA\n2. Ejecuta la clasificación\n3. Sube una evidencia\n\nTu prueba de 14 días está activa — mejora el plan en Facturación.`,
  }),
  it: (n, o) => ({
    subject: `3 consigli per ${COMPANY.productName}`,
    body: `Ciao ${n},\n\nPer “${o}”:\n1. Aggiungi i sistemi di IA\n2. Esegui la classificazione\n3. Carica una prova\n\nLa prova di 14 giorni è attiva — passa al piano a pagamento in Fatturazione.`,
  }),
  sv: (n, o) => ({
    subject: `3 tips för ${COMPANY.productName}`,
    body: `Hej ${n},\n\nFör “${o}”:\n1. Lägg till AI-system\n2. Kör riskklassificering\n3. Ladda upp bevis\n\nDin 14-dagars provperiod är aktiv — uppgradera under Fakturering.`,
  }),
};

const trialEnd: Record<L, (name: string, org: string, days: number) => { subject: string; body: string }> = {
  en: (n, o, d) => ({
    subject: `Your ${COMPANY.productName} trial ends in ${d} day${d === 1 ? "" : "s"}`,
    body: `Hi ${n},\n\nThe trial for “${o}” ends in ${d} day${d === 1 ? "" : "s"}. After that the workspace becomes read-only until you upgrade.\n\nUpgrade from Billing → Team (card, charged in USD).`,
  }),
  de: (n, o, d) => ({
    subject: `Ihre Testphase endet in ${d} Tag(en)`,
    body: `Hallo ${n},\n\nDie Testphase für „${o}“ endet in ${d} Tag(en). Danach ist der Workspace schreibgeschützt.\n\nUpgrade unter Abrechnung.`,
  }),
  fr: (n, o, d) => ({
    subject: `Fin de l’essai dans ${d} jour(s)`,
    body: `Bonjour ${n},\n\nL’essai de « ${o} » se termine dans ${d} jour(s). Ensuite, l’espace passe en lecture seule.\n\nPassez à l’offre Team dans Facturation.`,
  }),
  pl: (n, o, d) => ({
    subject: `Trial kończy się za ${d} dni`,
    body: `Cześć ${n},\n\nTrial dla „${o}” kończy się za ${d} dni. Potem tryb tylko do odczytu.\n\nUlepsz plan w Billing.`,
  }),
  nl: (n, o, d) => ({
    subject: `Proefperiode eindigt over ${d} dag(en)`,
    body: `Hallo ${n},\n\nDe proefperiode van “${o}” eindigt over ${d} dag(en). Daarna alleen-lezen.\n\nUpgrade via Facturatie.`,
  }),
  es: (n, o, d) => ({
    subject: `La prueba termina en ${d} día(s)`,
    body: `Hola ${n},\n\nLa prueba de “${o}” termina en ${d} día(s). Después, solo lectura.\n\nMejora el plan en Facturación.`,
  }),
  it: (n, o, d) => ({
    subject: `La prova termina tra ${d} giorno/i`,
    body: `Ciao ${n},\n\nLa prova di “${o}” termina tra ${d} giorno/i. Poi in sola lettura.\n\nPassa a Team in Fatturazione.`,
  }),
  sv: (n, o, d) => ({
    subject: `Provperioden slutar om ${d} dag(ar)`,
    body: `Hej ${n},\n\nProvperioden för “${o}” slutar om ${d} dag(ar). Därefter skrivskyddat.\n\nUppgradera under Fakturering.`,
  }),
};

const receipt: Record<L, (name: string, plan: string, desc: string, eur: string, charge: string, ref: string) => { subject: string; body: string }> = {
  en: (n, plan, desc, eur, charge, ref) => ({
    subject: `Payment received — ${COMPANY.productName}`,
    body: `Hi ${n},\n\nWe received your payment for ${plan}.\n${desc}\nEUR list: ${eur}\nCharged: ${charge}\nReference: ${ref}\n\nPrices exclude VAT where applicable.`,
  }),
  de: (n, plan, desc, eur, charge, ref) => ({
    subject: `Zahlung erhalten — ${COMPANY.productName}`,
    body: `Hallo ${n},\n\nZahlung für ${plan} erhalten.\n${desc}\nEUR: ${eur}\nBelastet: ${charge}\nReferenz: ${ref}\n\nPreise zzgl. MwSt.`,
  }),
  fr: (n, plan, desc, eur, charge, ref) => ({
    subject: `Paiement reçu — ${COMPANY.productName}`,
    body: `Bonjour ${n},\n\nPaiement reçu pour ${plan}.\n${desc}\nEUR: ${eur}\nDébit: ${charge}\nRéf: ${ref}\n\nPrix hors TVA.`,
  }),
  pl: (n, plan, desc, eur, charge, ref) => ({
    subject: `Płatność otrzymana — ${COMPANY.productName}`,
    body: `Cześć ${n},\n\nOtrzymaliśmy płatność za ${plan}.\n${desc}\nEUR: ${eur}\nObciążenie: ${charge}\nRef: ${ref}\n\nCeny netto (bez VAT).`,
  }),
  nl: (n, plan, desc, eur, charge, ref) => ({
    subject: `Betaling ontvangen — ${COMPANY.productName}`,
    body: `Hallo ${n},\n\nBetaling voor ${plan} ontvangen.\n${desc}\nEUR: ${eur}\nAfgeschreven: ${charge}\nRef: ${ref}\n\nPrijzen excl. btw.`,
  }),
  es: (n, plan, desc, eur, charge, ref) => ({
    subject: `Pago recibido — ${COMPANY.productName}`,
    body: `Hola ${n},\n\nHemos recibido el pago de ${plan}.\n${desc}\nEUR: ${eur}\nCargo: ${charge}\nRef: ${ref}\n\nPrecios sin IVA.`,
  }),
  it: (n, plan, desc, eur, charge, ref) => ({
    subject: `Pagamento ricevuto — ${COMPANY.productName}`,
    body: `Ciao ${n},\n\nPagamento ricevuto per ${plan}.\n${desc}\nEUR: ${eur}\nAddebito: ${charge}\nRif: ${ref}\n\nPrezzi IVA esclusa.`,
  }),
  sv: (n, plan, desc, eur, charge, ref) => ({
    subject: `Betalning mottagen — ${COMPANY.productName}`,
    body: `Hej ${n},\n\nVi har mottagit betalning för ${plan}.\n${desc}\nEUR: ${eur}\nDebiterat: ${charge}\nRef: ${ref}\n\nPriser exkl. moms.`,
  }),
};

const failed: Record<L, (name: string, plan: string, ref: string) => { subject: string; body: string }> = {
  en: (n, plan, ref) => ({
    subject: `Payment failed — ${COMPANY.productName}`,
    body: `Hi ${n},\n\nWe could not complete payment for ${plan}.\nReference: ${ref}\n\nPlease try again from Billing or contact ${COMPANY.salesEmail}.`,
  }),
  de: (n, plan, ref) => ({
    subject: `Zahlung fehlgeschlagen — ${COMPANY.productName}`,
    body: `Hallo ${n},\n\nZahlung für ${plan} fehlgeschlagen.\nReferenz: ${ref}\n\nBitte erneut unter Abrechnung versuchen.`,
  }),
  fr: (n, plan, ref) => ({
    subject: `Échec du paiement — ${COMPANY.productName}`,
    body: `Bonjour ${n},\n\nÉchec du paiement pour ${plan}.\nRéf: ${ref}\n\nRéessayez dans Facturation.`,
  }),
  pl: (n, plan, ref) => ({
    subject: `Płatność nieudana — ${COMPANY.productName}`,
    body: `Cześć ${n},\n\nNie udało się pobrać płatności za ${plan}.\nRef: ${ref}\n\nSpróbuj ponownie w Billing.`,
  }),
  nl: (n, plan, ref) => ({
    subject: `Betaling mislukt — ${COMPANY.productName}`,
    body: `Hallo ${n},\n\nBetaling voor ${plan} mislukt.\nRef: ${ref}\n\nProbeer opnieuw via Facturatie.`,
  }),
  es: (n, plan, ref) => ({
    subject: `Pago fallido — ${COMPANY.productName}`,
    body: `Hola ${n},\n\nNo se pudo completar el pago de ${plan}.\nRef: ${ref}\n\nInténtalo de nuevo en Facturación.`,
  }),
  it: (n, plan, ref) => ({
    subject: `Pagamento non riuscito — ${COMPANY.productName}`,
    body: `Ciao ${n},\n\nPagamento non riuscito per ${plan}.\nRif: ${ref}\n\nRiprova in Fatturazione.`,
  }),
  sv: (n, plan, ref) => ({
    subject: `Betalning misslyckades — ${COMPANY.productName}`,
    body: `Hej ${n},\n\nBetalningen för ${plan} misslyckades.\nRef: ${ref}\n\nFörsök igen under Fakturering.`,
  }),
};

export function day3TipsEmail(opts: { name: string; orgName: string; locale?: string; unsubscribeUrl?: string }) {
  const c = day3[norm(opts.locale)](opts.name, opts.orgName);
  return { subject: c.subject, ...shell(c.body, opts.unsubscribeUrl), tags: ["day3_tips", "marketing"] };
}

export function trialEndingEmail(opts: {
  name: string;
  orgName: string;
  daysLeft: number;
  trialDays?: number;
  locale?: string;
  unsubscribeUrl?: string;
}) {
  const c = trialEnd[norm(opts.locale)](opts.name, opts.orgName, opts.daysLeft);
  return { subject: c.subject, ...shell(c.body, opts.unsubscribeUrl), tags: ["trial_ending", "marketing"] };
}

export function paymentReceiptEmail(opts: {
  name: string;
  planTier: string;
  description: string;
  amountEur: number;
  chargeLabel: string;
  reference: string;
  locale?: string;
}) {
  const eur = `€${opts.amountEur.toFixed(2)}`;
  const c = receipt[norm(opts.locale)](opts.name, opts.planTier, opts.description, eur, opts.chargeLabel, opts.reference);
  return { subject: c.subject, ...shell(c.body), tags: ["payment_receipt"] };
}

export function paymentFailedEmail(opts: { name: string; planTier: string; reference: string; locale?: string }) {
  const c = failed[norm(opts.locale)](opts.name, opts.planTier, opts.reference);
  return { subject: c.subject, ...shell(c.body), tags: ["payment_failed"] };
}
