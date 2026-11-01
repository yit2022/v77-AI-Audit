import type { LlmProvider, ProviderMessage } from "./types";

function requireKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return key;
}

export function createOpenAiProvider(fetchImpl: typeof fetch = fetch): LlmProvider {
  return {
    id: "openai",
    name: "OpenAI",
    async complete(messages: ProviderMessage[]): Promise<string> {
      const key = requireKey();
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
      const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature: 0 }),
      });
      if (!res.ok) {
        throw new Error(`OpenAI request failed with status ${res.status}`);
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}
