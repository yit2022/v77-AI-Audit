import { describe, expect, it, afterEach } from "vitest";
import { getProvider, listConfiguredProviders, realProvidersEnabled } from "@/lib/providers";

describe("real provider feature flag", () => {
  const prev = process.env.V77_ENABLE_REAL_PROVIDERS;
  afterEach(() => {
    if (prev === undefined) delete process.env.V77_ENABLE_REAL_PROVIDERS;
    else process.env.V77_ENABLE_REAL_PROVIDERS = prev;
  });

  it("defaults to mock-only listing", () => {
    delete process.env.V77_ENABLE_REAL_PROVIDERS;
    expect(realProvidersEnabled()).toBe(false);
    const ids = listConfiguredProviders().map((p) => p.id);
    expect(ids).toEqual(["mock"]);
  });

  it("falls back to mock when real providers disabled", () => {
    process.env.V77_ENABLE_REAL_PROVIDERS = "false";
    expect(getProvider("openai").id).toBe("mock");
    expect(getProvider("workers_ai").id).toBe("mock");
  });

  it("lists workers_ai when flag enabled", () => {
    process.env.V77_ENABLE_REAL_PROVIDERS = "true";
    const ids = listConfiguredProviders().map((p) => p.id);
    expect(ids).toContain("workers_ai");
    expect(ids).toContain("mock");
  });
});
