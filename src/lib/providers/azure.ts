import type { LlmProvider, ProviderMessage } from "./types";

function requireConfig() {
  const key = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!key) throw new Error("AZURE_OPENAI_API_KEY is not set");
  if (!endpoint) throw new Error("AZURE_OPENAI_ENDPOINT is not set");
  if (!deployment) throw new Error("AZURE_OPENAI_DEPLOYMENT is not set");
  return { key, endpoint: endpoint.replace(/\/$/, ""), deployment };
}

export function createAzureOpenAiProvider(fetchImpl: typeof fetch = fetch): LlmProvider {
  return {
    id: "azure_openai",
    name: "Azure OpenAI",
    async complete(messages: ProviderMessage[]): Promise<string> {
      const { key, endpoint, deployment } = requireConfig();
      const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
      const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
      const res = await fetchImpl(url, {
        method: "POST",
        headers: {
          "api-key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages, temperature: 0 }),
      });
      if (!res.ok) {
        throw new Error(`Azure OpenAI request failed with status ${res.status}`);
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}
