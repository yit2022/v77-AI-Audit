import { describe, expect, it } from "vitest";
import { resolveDbBackend } from "../src/lib/db/backend";

describe("resolveDbBackend", () => {
  it("falls back to sqlite when DATABASE_URL is unset", () => {
    expect(resolveDbBackend({})).toBe("sqlite");
    expect(resolveDbBackend({ DATABASE_URL: "" })).toBe("sqlite");
    expect(resolveDbBackend({ DATABASE_URL: "  " })).toBe("sqlite");
  });

  it("selects postgres for postgres URLs", () => {
    expect(resolveDbBackend({ DATABASE_URL: "postgres://v77:v77@localhost:5432/v77" })).toBe("postgres");
    expect(resolveDbBackend({ DATABASE_URL: "postgresql://user:pass@db/v77" })).toBe("postgres");
  });

  it("ignores non-postgres URLs", () => {
    expect(resolveDbBackend({ DATABASE_URL: "mysql://localhost/v77" })).toBe("sqlite");
  });
});
