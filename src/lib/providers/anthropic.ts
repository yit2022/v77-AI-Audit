import type { LlmProvider, ProviderMessage } from "./types";

function requireKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return key;
}

export function createAnthropicProvider(fetchImpl: typeof fetch = fetch): LlmProvider {
  return {
    id: "anthropic",
    name: "Anthropic",
    async complete(messages: ProviderMessage[]): Promise<string> {
      const key = requireKey();
      const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
      const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
      const chat = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
      const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: system || undefined,
          messages: chat,
        }),
      });
      if (!res.ok) {
        throw new Error(`Anthropic request failed with status ${res.status}`);
      }
      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      return data.content?.filter((c) => c.type === "text").map((c) => c.text ?? "").join("") ?? "";
    },
  };
}
