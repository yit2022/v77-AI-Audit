import type { LlmProvider, ProviderMessage } from "./types";

type AiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
};

async function getAiBinding(): Promise<AiBinding | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const ai = (ctx.env as { AI?: AiBinding }).AI;
    return ai ?? null;
  } catch {
    return null;
  }
}

export function createWorkersAiProvider(): LlmProvider {
  return {
    id: "workers_ai",
    name: "Cloudflare Workers AI",
    async complete(messages: ProviderMessage[]): Promise<string> {
      const ai = await getAiBinding();
      if (!ai) {
        throw new Error("Workers AI binding is not available");
      }
      const model = process.env.V77_WORKERS_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";
      const result = (await ai.run(model, {
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      })) as { response?: string; result?: { response?: string } };
      return result.response ?? result.result?.response ?? JSON.stringify(result);
    },
  };
}

export async function workersAiConfigured(): Promise<boolean> {
  return Boolean(await getAiBinding());
}
