import { COMPANY } from "@/lib/company";

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

const DEFAULT_FROM = "noreply@v77trust.com";
const DEFAULT_REPLY = "support@v77trust.com";

export function emailConfigured(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim());
}

/** Send transactional mail via Resend when RESEND_API_KEY is set; otherwise log and no-op. */
export async function sendEmail(
  payload: EmailPayload,
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<EmailResult> {
  const key = env.RESEND_API_KEY?.trim();
  const fromAddr = env.V77_EMAIL_FROM?.trim() || DEFAULT_FROM;
  const fromName = payload.fromName || COMPANY.productName;
  const replyTo = payload.replyTo || env.V77_EMAIL_REPLY_TO?.trim() || DEFAULT_REPLY;
  const to = Array.isArray(payload.to) ? payload.to : [payload.to];

  if (!key) {
    console.info("[email:noop]", {
      to,
      subject: payload.subject,
      from: `${fromName} <${fromAddr}>`,
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
        from: `${fromName} <${fromAddr}>`,
        to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        reply_to: replyTo,
        tags: (payload.tags || []).map((t) => ({ name: "kind", value: t })),
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
