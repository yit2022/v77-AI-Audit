import { mockProvider } from "./mock";
import { createOpenAiProvider } from "./openai";
import { createAnthropicProvider } from "./anthropic";
import { createAzureOpenAiProvider } from "./azure";
import { createHttpProvider } from "./http";
import type { LlmProvider, ProviderId } from "./types";

export type { LlmProvider, ProviderMessage, ProviderId } from "./types";
export { mockProvider } from "./mock";

export function listConfiguredProviders(): Array<{ id: ProviderId; name: string; configured: boolean }> {
  return [
    { id: "mock", name: "Mock LLM Provider", configured: true },
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
  ];
}

export function getProvider(id: string = "mock", fetchImpl: typeof fetch = fetch): LlmProvider {
  switch (id as ProviderId) {
    case "openai":
      return createOpenAiProvider(fetchImpl);
    case "anthropic":
      return createAnthropicProvider(fetchImpl);
    case "azure_openai":
      return createAzureOpenAiProvider(fetchImpl);
    case "http":
      return createHttpProvider(fetchImpl);
    case "mock":
    default:
      return mockProvider;
  }
}
