import type { LlmProvider, ProviderMessage } from "./types";

function requireUrl(): string {
  const url = process.env.V77_HTTP_LLM_URL;
  if (!url) throw new Error("V77_HTTP_LLM_URL is not set");
  return url;
}

export function createHttpProvider(fetchImpl: typeof fetch = fetch): LlmProvider {
  return {
    id: "http",
    name: "Generic HTTP LLM",
    async complete(messages: ProviderMessage[]): Promise<string> {
      const url = requireUrl();
      const token = process.env.V77_HTTP_LLM_TOKEN;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) {
        throw new Error(`HTTP LLM request failed with status ${res.status}`);
      }
      const data = (await res.json()) as { content?: string; text?: string; message?: string };
      return data.content ?? data.text ?? data.message ?? "";
    },
  };
}
