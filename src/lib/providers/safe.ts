import type { LlmProvider, ProviderMessage } from "./types";

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}\b/g;
const IBAN_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g;
const CARD_RE = /\b(?:\d[ -]*?){13,19}\b/g;

/** Strip common PII patterns before sending prompts to external providers. */
export function redactPii(text: string): string {
  return text
    .replace(EMAIL_RE, "[REDACTED_EMAIL]")
    .replace(IBAN_RE, "[REDACTED_IBAN]")
    .replace(CARD_RE, "[REDACTED_CARD]")
    .replace(PHONE_RE, "[REDACTED_PHONE]");
}

export function redactMessages(messages: ProviderMessage[]): ProviderMessage[] {
  return messages.map((m) => ({ ...m, content: redactPii(m.content) }));
}

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type SafeProviderOptions = {
  timeoutMs?: number;
  maxRetries?: number;
  /** Soft cap on estimated input chars (proxy for cost). */
  maxInputChars?: number;
  redact?: boolean;
};

/** Wrap any provider with timeouts, retries, input cost caps, and PII redaction. */
export function withSafeProvider(provider: LlmProvider, opts: SafeProviderOptions = {}): LlmProvider {
  const timeoutMs = opts.timeoutMs ?? envInt("V77_PROVIDER_TIMEOUT_MS", 25_000);
  const maxRetries = opts.maxRetries ?? envInt("V77_PROVIDER_MAX_RETRIES", 2);
  const maxInputChars = opts.maxInputChars ?? envInt("V77_PROVIDER_MAX_INPUT_CHARS", 24_000);
  const redact = opts.redact !== false;

  return {
    id: provider.id,
    name: `${provider.name} (hardened)`,
    async complete(messages: ProviderMessage[]): Promise<string> {
      const prepared = redact ? redactMessages(messages) : messages;
      const chars = prepared.reduce((n, m) => n + m.content.length, 0);
      if (chars > maxInputChars) {
        throw new Error(`Provider input exceeds cost cap (${chars} > ${maxInputChars} chars)`);
      }

      let lastErr: unknown;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
          // Providers may ignore AbortSignal; we still race with timeout.
          const result = await Promise.race([
            provider.complete(prepared),
            new Promise<string>((_, reject) => {
              ctrl.signal.addEventListener("abort", () => reject(new Error(`Provider timeout after ${timeoutMs}ms`)));
            }),
          ]);
          clearTimeout(timer);
          return result;
        } catch (e) {
          clearTimeout(timer);
          lastErr = e;
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
            continue;
          }
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error("Provider failed");
    },
  };
}
