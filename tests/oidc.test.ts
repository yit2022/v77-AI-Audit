import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthorizationUrl,
  exchangeAuthorizationCode,
  getPublicOidcStatus,
  loadOidcConfig,
} from "../src/lib/auth/oidc";

afterEach(() => {
  vi.unstubAllGlobals();
});

const fullEnv = {
  OIDC_ISSUER: "https://auth.example.com",
  OIDC_CLIENT_ID: "v77-client",
  OIDC_CLIENT_SECRET: "super-secret",
  OIDC_REDIRECT_URI: "http://localhost:3000/api/auth/oidc/callback",
};

describe("OIDC groundwork", () => {
  it("disables SSO when env is incomplete", () => {
    expect(loadOidcConfig({})).toBeNull();
    expect(getPublicOidcStatus({ OIDC_ISSUER: "https://x" }).enabled).toBe(false);
  });

  it("loads config and never exposes secret in public status", () => {
    const cfg = loadOidcConfig(fullEnv);
    expect(cfg?.clientId).toBe("v77-client");
    expect(cfg?.authorizationEndpoint).toBe("https://auth.example.com/authorize");
    const pub = getPublicOidcStatus(fullEnv);
    expect(pub.enabled).toBe(true);
    expect(JSON.stringify(pub)).not.toContain("super-secret");
    expect(JSON.stringify(pub)).not.toContain("CLIENT_SECRET");
  });

  it("builds authorization URL with state", () => {
    const cfg = loadOidcConfig(fullEnv)!;
    const url = buildAuthorizationUrl(cfg, "abc123");
    expect(url).toContain("client_id=v77-client");
    expect(url).toContain("state=abc123");
    expect(url).toContain("response_type=code");
  });

  it("exchanges code via token endpoint without logging secrets", async () => {
    const cfg = loadOidcConfig(fullEnv)!;
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = String(init?.body ?? "");
      expect(body).toContain("client_secret=super-secret");
      return new Response(JSON.stringify({ access_token: "atok" }), { status: 200 });
    });
    const tokens = await exchangeAuthorizationCode(cfg, "code-1", fetchMock as unknown as typeof fetch);
    expect(tokens.accessToken).toBe("atok");
  });
});
