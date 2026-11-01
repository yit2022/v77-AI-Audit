import { describe, expect, it } from "vitest";
import { getAppOrigin, getConfiguredDomain, inviteAcceptUrl } from "../src/lib/site";
import siteConfig from "../site.config.json";

describe("site domain config", () => {
  it("reads customDomain from site.config.json", () => {
    expect(getConfiguredDomain()).toBe(siteConfig.customDomain);
  });

  it("builds invite URLs from origin", () => {
    const prev = process.env.V77_APP_ORIGIN;
    process.env.V77_APP_ORIGIN = "https://example.test";
    expect(inviteAcceptUrl("tok-1")).toBe("https://example.test/invite/tok-1");
    if (prev === undefined) delete process.env.V77_APP_ORIGIN;
    else process.env.V77_APP_ORIGIN = prev;
  });

  it("getAppOrigin prefers V77_APP_ORIGIN", () => {
    const prev = process.env.V77_APP_ORIGIN;
    process.env.V77_APP_ORIGIN = "https://future-domain.example";
    expect(getAppOrigin()).toBe("https://future-domain.example");
    if (prev === undefined) delete process.env.V77_APP_ORIGIN;
    else process.env.V77_APP_ORIGIN = prev;
  });
});
