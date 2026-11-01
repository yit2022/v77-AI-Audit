import { COMPANY } from "@/lib/company";

export type PartnerEmailBrand = {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
};

export type LocaleCode = "en" | "de" | "fr" | "pl" | "nl" | "es" | "it" | "sv";

const COPY: Record<
  LocaleCode,
  {
    signupSubject: string;
    signupBody: (name: string, org: string) => string;
    inviteSubject: (org: string) => string;
    inviteBody: (org: string, role: string, url: string) => string;
    reminderSubject: string;
    reminderBody: (title: string, due: string) => string;
    evidenceSubject: string;
    evidenceBody: (title: string, due: string, url: string) => string;
    leadSubject: string;
    leadBody: (name: string, company: string) => string;
    passwordResetSubject: string;
    passwordResetBody: (name: string, url: string) => string;
    ctaOpen: string;
  }
> = {
  en: {
    signupSubject: `Welcome to ${COMPANY.productName}`,
    signupBody: (name, org) => `Hi ${name},\n\nYour organisation “${org}” is ready on ${COMPANY.productName}. Sign in to continue your AI Act readiness work.\n\n— ${COMPANY.productName}`,
    inviteSubject: (org) => `You're invited to ${org} on ${COMPANY.productName}`,
    inviteBody: (org, role, url) => `You've been invited to join “${org}” as ${role}.\n\nAccept: ${url}\n\n— ${COMPANY.productName}`,
    reminderSubject: `Reminder from ${COMPANY.productName}`,
    reminderBody: (title, due) => `Reminder: ${title}\nDue: ${due}\n\n— ${COMPANY.productName}`,
    evidenceSubject: `Evidence requested — ${COMPANY.productName}`,
    evidenceBody: (title, due, url) => `Please upload evidence for: ${title}\nDue: ${due}\n\nOpen: ${url}\n\n— ${COMPANY.productName}`,
    leadSubject: `New sales lead — ${COMPANY.productName}`,
    leadBody: (name, company) => `New lead from ${name} (${company}). Check the platform admin inbox.`,
        passwordResetSubject: 'Reset your V77 Trust password',
    passwordResetBody: (name, url) => `Hi ${name},

We received a request to reset your password. This link expires in 60 minutes:

${url}

If you did not request this, you can ignore this email.

— V77 Trust`,
    ctaOpen: "Open V77 Trust",
  },
  de: {
    signupSubject: `Willkommen bei ${COMPANY.productName}`,
    signupBody: (name, org) => `Hallo ${name},\n\nIhre Organisation „${org}“ ist bereit. Melden Sie sich an, um fortzufahren.\n\n— ${COMPANY.productName}`,
    inviteSubject: (org) => `Einladung zu ${org} auf ${COMPANY.productName}`,
    inviteBody: (org, role, url) => `Sie wurden zu „${org}“ als ${role} eingeladen.\n\nAnnehmen: ${url}\n\n— ${COMPANY.productName}`,
    reminderSubject: `Erinnerung von ${COMPANY.productName}`,
    reminderBody: (title, due) => `Erinnerung: ${title}\nFällig: ${due}\n\n— ${COMPANY.productName}`,
    evidenceSubject: `Nachweis angefordert — ${COMPANY.productName}`,
    evidenceBody: (title, due, url) => `Bitte laden Sie Nachweise hoch für: ${title}\nFällig: ${due}\n\nÖffnen: ${url}\n\n— ${COMPANY.productName}`,
    leadSubject: `Neuer Lead — ${COMPANY.productName}`,
    leadBody: (name, company) => `Neuer Lead von ${name} (${company}).`,
        passwordResetSubject: 'Passwort für V77 Trust zurücksetzen',
    passwordResetBody: (name, url) => `Hallo ${name},

Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Dieser Link ist 60 Minuten gültig:

${url}

Wenn Sie das nicht waren, ignorieren Sie diese E-Mail.

— V77 Trust`,
    ctaOpen: "V77 Trust öffnen",
  },
  fr: {
    signupSubject: `Bienvenue sur ${COMPANY.productName}`,
    signupBody: (name, org) => `Bonjour ${name},\n\nVotre organisation « ${org} » est prête. Connectez-vous pour continuer.\n\n— ${COMPANY.productName}`,
    inviteSubject: (org) => `Invitation à ${org} sur ${COMPANY.productName}`,
    inviteBody: (org, role, url) => `Vous êtes invité(e) à rejoindre « ${org} » en tant que ${role}.\n\nAccepter : ${url}\n\n— ${COMPANY.productName}`,
    reminderSubject: `Rappel — ${COMPANY.productName}`,
    reminderBody: (title, due) => `Rappel : ${title}\nÉchéance : ${due}\n\n— ${COMPANY.productName}`,
    evidenceSubject: `Preuve demandée — ${COMPANY.productName}`,
    evidenceBody: (title, due, url) => `Veuillez téléverser une preuve pour : ${title}\nÉchéance : ${due}\n\nOuvrir : ${url}\n\n— ${COMPANY.productName}`,
    leadSubject: `Nouveau lead — ${COMPANY.productName}`,
    leadBody: (name, company) => `Nouveau lead de ${name} (${company}).`,
        passwordResetSubject: 'Réinitialiser votre mot de passe V77 Trust',
    passwordResetBody: (name, url) => `Bonjour ${name},

Nous avons reçu une demande de réinitialisation. Ce lien expire dans 60 minutes :

${url}

Si ce n’était pas vous, ignorez cet e-mail.

— V77 Trust`,
    ctaOpen: "Ouvrir V77 Trust",
  },
  pl: {
    signupSubject: `Witamy w ${COMPANY.productName}`,
    signupBody: (name, org) => `Cześć ${name},\n\nOrganizacja „${org}” jest gotowa. Zaloguj się, aby kontynuować.\n\n— ${COMPANY.productName}`,
    inviteSubject: (org) => `Zaproszenie do ${org} w ${COMPANY.productName}`,
    inviteBody: (org, role, url) => `Zaproszono Cię do „${org}” jako ${role}.\n\nAkceptuj: ${url}\n\n— ${COMPANY.productName}`,
    reminderSubject: `Przypomnienie — ${COMPANY.productName}`,
    reminderBody: (title, due) => `Przypomnienie: ${title}\nTermin: ${due}\n\n— ${COMPANY.productName}`,
    evidenceSubject: `Prośba o dowód — ${COMPANY.productName}`,
    evidenceBody: (title, due, url) => `Prześlij dowód dla: ${title}\nTermin: ${due}\n\nOtwórz: ${url}\n\n— ${COMPANY.productName}`,
    leadSubject: `Nowy lead — ${COMPANY.productName}`,
    leadBody: (name, company) => `Nowy lead od ${name} (${company}).`,
        passwordResetSubject: 'Zresetuj hasło V77 Trust',
    passwordResetBody: (name, url) => `Cześć ${name},

Otrzymaliśmy prośbę o reset hasła. Link jest ważny 60 minut:

${url}

Jeśli to nie Ty, zignoruj tę wiadomość.

— V77 Trust`,
    ctaOpen: "Otwórz V77 Trust",
  },
  nl: {
    signupSubject: `Welkom bij ${COMPANY.productName}`,
    signupBody: (name, org) => `Hallo ${name},\n\nJe organisatie “${org}” is klaar. Log in om verder te gaan.\n\n— ${COMPANY.productName}`,
    inviteSubject: (org) => `Uitnodiging voor ${org} op ${COMPANY.productName}`,
    inviteBody: (org, role, url) => `Je bent uitgenodigd voor “${org}” als ${role}.\n\nAccepteren: ${url}\n\n— ${COMPANY.productName}`,
    reminderSubject: `Herinnering — ${COMPANY.productName}`,
    reminderBody: (title, due) => `Herinnering: ${title}\nDeadline: ${due}\n\n— ${COMPANY.productName}`,
    evidenceSubject: `Bewijs gevraagd — ${COMPANY.productName}`,
    evidenceBody: (title, due, url) => `Upload bewijs voor: ${title}\nDeadline: ${due}\n\nOpen: ${url}\n\n— ${COMPANY.productName}`,
    leadSubject: `Nieuwe lead — ${COMPANY.productName}`,
    leadBody: (name, company) => `Nieuwe lead van ${name} (${company}).`,
        passwordResetSubject: 'V77 Trust-wachtwoord opnieuw instellen',
    passwordResetBody: (name, url) => `Hallo ${name},

We ontvingen een verzoek om je wachtwoord te resetten. Deze link verloopt over 60 minuten:

${url}

Als jij dit niet was, negeer deze e-mail.

— V77 Trust`,
    ctaOpen: "Open V77 Trust",
  },
  es: {
    signupSubject: `Bienvenido a ${COMPANY.productName}`,
    signupBody: (name, org) => `Hola ${name},\n\nTu organización “${org}” está lista. Inicia sesión para continuar.\n\n— ${COMPANY.productName}`,
    inviteSubject: (org) => `Invitación a ${org} en ${COMPANY.productName}`,
    inviteBody: (org, role, url) => `Te han invitado a “${org}” como ${role}.\n\nAceptar: ${url}\n\n— ${COMPANY.productName}`,
    reminderSubject: `Recordatorio — ${COMPANY.productName}`,
    reminderBody: (title, due) => `Recordatorio: ${title}\nVence: ${due}\n\n— ${COMPANY.productName}`,
    evidenceSubject: `Evidencia solicitada — ${COMPANY.productName}`,
    evidenceBody: (title, due, url) => `Sube evidencia para: ${title}\nVence: ${due}\n\nAbrir: ${url}\n\n— ${COMPANY.productName}`,
    leadSubject: `Nuevo lead — ${COMPANY.productName}`,
    leadBody: (name, company) => `Nuevo lead de ${name} (${company}).`,
        passwordResetSubject: 'Restablecer contraseña de V77 Trust',
    passwordResetBody: (name, url) => `Hola ${name},

Recibimos una solicitud para restablecer tu contraseña. Este enlace caduca en 60 minutos:

${url}

Si no fuiste tú, ignora este correo.

— V77 Trust`,
    ctaOpen: "Abrir V77 Trust",
  },
  it: {
    signupSubject: `Benvenuto su ${COMPANY.productName}`,
    signupBody: (name, org) => `Ciao ${name},\n\nLa tua organizzazione “${org}” è pronta. Accedi per continuare.\n\n— ${COMPANY.productName}`,
    inviteSubject: (org) => `Invito a ${org} su ${COMPANY.productName}`,
    inviteBody: (org, role, url) => `Sei stato invitato a “${org}” come ${role}.\n\nAccetta: ${url}\n\n— ${COMPANY.productName}`,
    reminderSubject: `Promemoria — ${COMPANY.productName}`,
    reminderBody: (title, due) => `Promemoria: ${title}\nScadenza: ${due}\n\n— ${COMPANY.productName}`,
    evidenceSubject: `Evidenza richiesta — ${COMPANY.productName}`,
    evidenceBody: (title, due, url) => `Carica evidenza per: ${title}\nScadenza: ${due}\n\nApri: ${url}\n\n— ${COMPANY.productName}`,
    leadSubject: `Nuovo lead — ${COMPANY.productName}`,
    leadBody: (name, company) => `Nuovo lead da ${name} (${company}).`,
        passwordResetSubject: 'Reimposta la password di V77 Trust',
    passwordResetBody: (name, url) => `Ciao ${name},

Abbiamo ricevuto una richiesta di reset password. Questo link scade tra 60 minuti:

${url}

Se non sei stato tu, ignora questa email.

— V77 Trust`,
    ctaOpen: "Apri V77 Trust",
  },
  sv: {
    signupSubject: `Välkommen till ${COMPANY.productName}`,
    signupBody: (name, org) => `Hej ${name},\n\nDin organisation “${org}” är redo. Logga in för att fortsätta.\n\n— ${COMPANY.productName}`,
    inviteSubject: (org) => `Inbjudan till ${org} på ${COMPANY.productName}`,
    inviteBody: (org, role, url) => `Du har bjudits in till “${org}” som ${role}.\n\nAcceptera: ${url}\n\n— ${COMPANY.productName}`,
    reminderSubject: `Påminnelse — ${COMPANY.productName}`,
    reminderBody: (title, due) => `Påminnelse: ${title}\nFörfaller: ${due}\n\n— ${COMPANY.productName}`,
    evidenceSubject: `Bevis begärt — ${COMPANY.productName}`,
    evidenceBody: (title, due, url) => `Ladda upp bevis för: ${title}\nFörfaller: ${due}\n\nÖppna: ${url}\n\n— ${COMPANY.productName}`,
    leadSubject: `Ny lead — ${COMPANY.productName}`,
    leadBody: (name, company) => `Ny lead från ${name} (${company}).`,
        passwordResetSubject: 'Återställ ditt V77 Trust-lösenord',
    passwordResetBody: (name, url) => `Hej ${name},

Vi fick en begäran om att återställa ditt lösenord. Länken gäller i 60 minuter:

${url}

Om det inte var du kan du ignorera mejlet.

— V77 Trust`,
    ctaOpen: "Öppna V77 Trust",
  },
};

function normalizeLocale(locale?: string): LocaleCode {
  const l = (locale || "en").slice(0, 2).toLowerCase() as LocaleCode;
  return COPY[l] ? l : "en";
}

function brandShell(textBody: string, brand?: PartnerEmailBrand): { html: string; text: string; fromName: string } {
  const name = brand?.name?.trim() || COMPANY.productName;
  const color = brand?.primaryColor || "#0F2A4A";
  const accent = brand?.accentColor || "#6FCDF5";
  const logo = brand?.logoUrl
    ? `<img src="${brand.logoUrl}" alt="${name}" style="max-height:40px;margin-bottom:16px" />`
    : "";
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#0f172a;background:#f8fafc;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e2e8f0">
    ${logo}
    <div style="height:4px;background:${accent};border-radius:2px;margin-bottom:20px"></div>
    <pre style="white-space:pre-wrap;font-family:inherit;margin:0;line-height:1.5">${escapeHtml(textBody)}</pre>
    <p style="margin-top:24px;font-size:12px;color:#64748b">${name} · <span style="color:${color}">${COMPANY.legalName}</span></p>
  </div></body></html>`;
  return { html, text: textBody, fromName: name };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function signupEmail(opts: { name: string; orgName: string; locale?: string; brand?: PartnerEmailBrand }) {
  const c = COPY[normalizeLocale(opts.locale)];
  const body = c.signupBody(opts.name, opts.orgName);
  const shell = brandShell(body, opts.brand);
  return { subject: c.signupSubject, ...shell, tags: ["signup"] };
}

export function inviteEmail(opts: {
  orgName: string;
  role: string;
  acceptUrl: string;
  locale?: string;
  brand?: PartnerEmailBrand;
}) {
  const c = COPY[normalizeLocale(opts.locale)];
  const body = c.inviteBody(opts.orgName, opts.role, opts.acceptUrl);
  const shell = brandShell(body, opts.brand);
  return { subject: c.inviteSubject(opts.orgName), ...shell, tags: ["invite"] };
}

export function reminderEmail(opts: { title: string; dueAt: string; locale?: string; brand?: PartnerEmailBrand }) {
  const c = COPY[normalizeLocale(opts.locale)];
  const body = c.reminderBody(opts.title, opts.dueAt);
  const shell = brandShell(body, opts.brand);
  return { subject: c.reminderSubject, ...shell, tags: ["reminder"] };
}

export function evidenceRequestEmail(opts: {
  title: string;
  dueAt: string;
  url: string;
  locale?: string;
  brand?: PartnerEmailBrand;
}) {
  const c = COPY[normalizeLocale(opts.locale)];
  const body = c.evidenceBody(opts.title, opts.dueAt, opts.url);
  const shell = brandShell(body, opts.brand);
  return { subject: c.evidenceSubject, ...shell, tags: ["evidence"] };
}

export function leadNotificationEmail(opts: { name: string; company: string; locale?: string }) {
  const c = COPY[normalizeLocale(opts.locale)];
  const body = c.leadBody(opts.name, opts.company);
  const shell = brandShell(body);
  return { subject: c.leadSubject, ...shell, tags: ["lead"] };
}

export function passwordResetEmail(opts: { name: string; resetUrl: string; locale?: string; brand?: PartnerEmailBrand }) {
  const c = COPY[normalizeLocale(opts.locale)];
  const body = c.passwordResetBody(opts.name, opts.resetUrl);
  const shell = brandShell(body, opts.brand);
  return { subject: c.passwordResetSubject, ...shell, tags: ["password_reset"] };
}
