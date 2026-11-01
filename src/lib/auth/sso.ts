import { getPublicOidcStatus, loadOidcConfig, type PublicOidcStatus } from "@/lib/auth/oidc";

/** Master flag. When false, OIDC/SAML buttons stay hidden even if IdP env vars exist. */
export function isSsoFlagEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const v = (env.V77_SSO_ENABLED || "").trim().toLowerCase();
  // Default: enabled when OIDC is fully configured (backward compatible).
  // Set V77_SSO_ENABLED=false to force-hide. Set =true to require explicit opt-in with SAML stubs.
  if (v === "false" || v === "0" || v === "off") return false;
  if (v === "true" || v === "1" || v === "on") return true;
  return Boolean(loadOidcConfig(env));
}

export function isSamlEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (!isSsoFlagEnabled(env)) return false;
  const v = (env.V77_SAML_ENABLED || "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "on";
}

export type PublicSsoStatus = PublicOidcStatus & {
  flagEnabled: boolean;
  samlEnabled: boolean;
  providers: Array<"oidc" | "saml">;
};

export function getPublicSsoStatus(env: NodeJS.ProcessEnv = process.env): PublicSsoStatus {
  const flagEnabled = isSsoFlagEnabled(env);
  const oidc = getPublicOidcStatus(env);
  const samlEnabled = isSamlEnabled(env);
  const providers: Array<"oidc" | "saml"> = [];
  if (flagEnabled && oidc.enabled) providers.push("oidc");
  if (samlEnabled) providers.push("saml");
  return {
    enabled: providers.length > 0,
    flagEnabled,
    samlEnabled,
    providers,
    issuer: oidc.issuer,
    authorizationEndpoint: oidc.authorizationEndpoint,
  };
}
