/** Real (non-mock) providers stay off unless explicitly enabled. No paid keys ship by default. */
export function realProvidersEnabled(): boolean {
  return process.env.V77_ENABLE_REAL_PROVIDERS === "true";
}
