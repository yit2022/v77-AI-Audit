import { COMPANY } from "@/lib/company";
import { isMarketingOptedOut } from "@/lib/email/unsubscribe";

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  fromName?: string;
  tags?: string[];
};

export type EmailResult = { ok: true; id?: string; mode: "resend" | "noop" } | { ok: false; error: string; mode: "resend" | "noop" };

const DEFAULT_FROM = "noreply@mail.v77trust.com";
const DEFAULT_REPLY = "support@v77trust.com";

export function emailConfigured(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim());
}

/**
 * Build a Resend-safe `from` value.
 * Accepts either a bare address (`noreply@…`) or a full `Name <addr>` in V77_EMAIL_FROM
 * (wrangler ships the latter — do not wrap it again).
 */
export function formatFromAddress(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  fromName?: string,
): string {
  const raw = (env.V77_EMAIL_FROM?.trim() || DEFAULT_FROM).trim();
  const display = (fromName || COMPANY.productName).trim() || COMPANY.productName;
  const angled = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (angled) {
    const name = angled[1].trim().replace(/^["']|["']$/g, "") || display;
    const email = angled[2].trim();
    return `${name} <${email}>`;
  }
  if (raw.includes("@")) return `${display} <${raw}>`;
  return `${display} <${DEFAULT_FROM}>`;
}

function isMarketing(tags?: string[]) {
  return (tags || []).some((t) => t === "marketing" || t.startsWith("lifecycle_") || t === "day3_tips" || t.startsWith("trial_ending"));
}

/** Resolve recipients; optional V77_EMAIL_TEST_REDIRECT rewrites all outbound (local/smoke only — never set in prod wrangler). */
export function resolveEmailRecipients(
  to: string | string[],
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string[] {
  const redirect = env.V77_EMAIL_TEST_REDIRECT?.trim().toLowerCase();
  if (redirect) return [redirect];
  return (Array.isArray(to) ? to : [to]).map((e) => e.trim().toLowerCase()).filter(Boolean);
}

/** Send transactional mail via Resend when RESEND_API_KEY is set; otherwise log and no-op. */
export async function sendEmail(
  payload: EmailPayload,
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<EmailResult> {
  const key = env.RESEND_API_KEY?.trim();
  const from = formatFromAddress(env, payload.fromName);
  const replyTo = payload.replyTo || env.V77_EMAIL_REPLY_TO?.trim() || DEFAULT_REPLY;
  let to = resolveEmailRecipients(payload.to, env);

  if (isMarketing(payload.tags)) {
    const filtered: string[] = [];
    for (const addr of to) {
      if (await isMarketingOptedOut(addr)) continue;
      filtered.push(addr);
    }
    to = filtered;
    if (!to.length) {
      return { ok: true, mode: key ? "resend" : "noop" };
    }
  }

  if (!key) {
    console.info("[email:noop]", {
      to,
      subject: payload.subject,
      from,
      replyTo,
    });
    return { ok: true, mode: "noop" };
  }

  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: replyTo,
        tags: (payload.tags || []).map((t) => ({ name: "kind", value: t.slice(0, 40) })),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      console.error("[email:resend:error]", res.status, data.message || data);
      return { ok: false, error: data.message || `Resend ${res.status}`, mode: "resend" };
    }
    return { ok: true, id: data.id, mode: "resend" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send failed";
    console.error("[email:resend:exception]", msg);
    return { ok: false, error: msg, mode: "resend" };
  }
}
