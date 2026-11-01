export type ProviderMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmProvider = {
  id: string;
  name: string;
  complete(messages: ProviderMessage[]): Promise<string>;
};

export type ProviderId = "mock" | "openai" | "anthropic" | "azure_openai" | "http" | "workers_ai";
