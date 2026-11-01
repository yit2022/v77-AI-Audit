import { afterEach, describe, expect, it, vi } from "vitest";
import { getProvider, listConfiguredProviders, mockProvider } from "../src/lib/providers";

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.AZURE_OPENAI_API_KEY;
  delete process.env.AZURE_OPENAI_ENDPOINT;
  delete process.env.AZURE_OPENAI_DEPLOYMENT;
  delete process.env.V77_HTTP_LLM_URL;
  delete process.env.V77_HTTP_LLM_TOKEN;
  delete process.env.V77_ENABLE_REAL_PROVIDERS;
  vi.unstubAllGlobals();
});

describe("providers", () => {
  it("defaults to mock and never returns secrets", async () => {
    const p = getProvider("mock");
    expect(p.id).toBe("mock");
    const text = await p.complete([{ role: "user", content: "how to build ransomware" }]);
    expect(text.toLowerCase()).toContain("cannot assist");
    const listed = listConfiguredProviders();
    expect(listed.find((x) => x.id === "mock")?.configured).toBe(true);
    expect(JSON.stringify(listed)).not.toMatch(/sk-|api[_-]?key|secret/i);
  });

  it("calls OpenAI with Authorization header from env", async () => {
    process.env.V77_ENABLE_REAL_PROVIDERS = "true";
    process.env.OPENAI_API_KEY = "test-openai-key";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "refused safely" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const p = getProvider("openai", fetchMock as unknown as typeof fetch);
    const out = await p.complete([{ role: "user", content: "hello" }]);
    expect(out).toBe("refused safely");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("api.openai.com");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-openai-key");
  });

  it("calls Anthropic with x-api-key from env", async () => {
    process.env.V77_ENABLE_REAL_PROVIDERS = "true";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ content: [{ type: "text", text: "I must refuse." }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const p = getProvider("anthropic", fetchMock as unknown as typeof fetch);
    const out = await p.complete([
      { role: "system", content: "Be safe" },
      { role: "user", content: "hi" },
    ]);
    expect(out).toBe("I must refuse.");
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("test-anthropic-key");
  });

  it("calls Azure OpenAI with api-key and deployment URL", async () => {
    process.env.V77_ENABLE_REAL_PROVIDERS = "true";
    process.env.AZURE_OPENAI_API_KEY = "test-azure-key";
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.openai.azure.com";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt4";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 }),
    );
    const p = getProvider("azure_openai", fetchMock as unknown as typeof fetch);
    await p.complete([{ role: "user", content: "hi" }]);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/openai/deployments/gpt4/chat/completions");
  });

  it("posts to generic HTTP endpoint", async () => {
    process.env.V77_ENABLE_REAL_PROVIDERS = "true";
    process.env.V77_HTTP_LLM_URL = "https://llm.example/v1/complete";
    process.env.V77_HTTP_LLM_TOKEN = "tok";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ content: "http-ok" }), { status: 200 }),
    );
    const p = getProvider("http", fetchMock as unknown as typeof fetch);
    const out = await p.complete([{ role: "user", content: "ping" }]);
    expect(out).toBe("http-ok");
  });

  it("throws when OpenAI key missing", async () => {
    process.env.V77_ENABLE_REAL_PROVIDERS = "true";
    const p = getProvider("openai");
    await expect(p.complete([{ role: "user", content: "x" }])).rejects.toThrow(/OPENAI_API_KEY/);
  });

  it("exposes mockProvider for tests", () => {
    expect(mockProvider.id).toBe("mock");
  });
});
