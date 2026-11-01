import { mockProvider } from "./mock";
import { createOpenAiProvider } from "./openai";
import { createAnthropicProvider } from "./anthropic";
import { createAzureOpenAiProvider } from "./azure";
import { createHttpProvider } from "./http";
import { createWorkersAiProvider } from "./workers-ai";
import { realProvidersEnabled } from "./flags";
import { withSafeProvider } from "./safe";
import type { LlmProvider, ProviderId } from "./types";

export type { LlmProvider, ProviderMessage, ProviderId } from "./types";
export { mockProvider } from "./mock";
export { realProvidersEnabled } from "./flags";

export function listConfiguredProviders(): Array<{ id: ProviderId; name: string; configured: boolean }> {
  const real = realProvidersEnabled();
  const rows: Array<{ id: ProviderId; name: string; configured: boolean }> = [
    { id: "mock", name: "Mock LLM Provider", configured: true },
  ];
  if (!real) return rows;

  rows.push(
    {
      id: "workers_ai",
      name: "Cloudflare Workers AI",
      // Binding presence is runtime; treat as configured when flag is on so UI can offer it.
      configured: true,
    },
    { id: "openai", name: "OpenAI", configured: Boolean(process.env.OPENAI_API_KEY) },
    { id: "anthropic", name: "Anthropic", configured: Boolean(process.env.ANTHROPIC_API_KEY) },
    {
      id: "azure_openai",
      name: "Azure OpenAI",
      configured: Boolean(
        process.env.AZURE_OPENAI_API_KEY &&
          process.env.AZURE_OPENAI_ENDPOINT &&
          process.env.AZURE_OPENAI_DEPLOYMENT,
      ),
    },
    { id: "http", name: "Generic HTTP LLM", configured: Boolean(process.env.V77_HTTP_LLM_URL) },
  );
  return rows;
}

export function getProvider(id: string = "mock", fetchImpl: typeof fetch = fetch): LlmProvider {
  const requested = (id || "mock") as ProviderId;
  if (requested !== "mock" && !realProvidersEnabled()) {
    return mockProvider;
  }
  switch (requested) {
    case "openai":
      return withSafeProvider(createOpenAiProvider(fetchImpl));
    case "anthropic":
      return withSafeProvider(createAnthropicProvider(fetchImpl));
    case "azure_openai":
      return withSafeProvider(createAzureOpenAiProvider(fetchImpl));
    case "http":
      return withSafeProvider(createHttpProvider(fetchImpl));
    case "workers_ai":
      return withSafeProvider(createWorkersAiProvider());
    case "mock":
    default:
      return mockProvider;
  }
}
