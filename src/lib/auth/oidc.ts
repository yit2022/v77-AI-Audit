export type OidcConfig = {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
};

export type PublicOidcStatus = {
  enabled: boolean;
  issuer?: string;
  authorizationEndpoint?: string;
};

function trimSlash(url: string) {
  return url.replace(/\/$/, "");
}

/** Load OIDC settings from environment. Missing required vars → null (SSO disabled). */
export function loadOidcConfig(env: NodeJS.ProcessEnv = process.env): OidcConfig | null {
  const issuer = env.OIDC_ISSUER?.trim();
  const clientId = env.OIDC_CLIENT_ID?.trim();
  const clientSecret = env.OIDC_CLIENT_SECRET?.trim();
  const redirectUri = env.OIDC_REDIRECT_URI?.trim();
  if (!issuer || !clientId || !clientSecret || !redirectUri) return null;

  const base = trimSlash(issuer);
  const scopes = env.OIDC_SCOPES?.trim() || "openid profile email";
  return {
    issuer: base,
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    authorizationEndpoint: env.OIDC_AUTHORIZATION_ENDPOINT?.trim() || `${base}/authorize`,
    tokenEndpoint: env.OIDC_TOKEN_ENDPOINT?.trim() || `${base}/oauth/token`,
    userinfoEndpoint: env.OIDC_USERINFO_ENDPOINT?.trim() || `${base}/userinfo`,
  };
}

export function getPublicOidcStatus(env: NodeJS.ProcessEnv = process.env): PublicOidcStatus {
  const cfg = loadOidcConfig(env);
  if (!cfg) return { enabled: false };
  return {
    enabled: true,
    issuer: cfg.issuer,
    authorizationEndpoint: cfg.authorizationEndpoint,
  };
}

export function buildAuthorizationUrl(cfg: OidcConfig, state: string): string {
  const url = new URL(cfg.authorizationEndpoint);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scopes);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeAuthorizationCode(
  cfg: OidcConfig,
  code: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ accessToken: string; idToken?: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });
  const res = await fetchImpl(cfg.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`OIDC token exchange failed (${res.status})`);
  const data = (await res.json()) as { access_token?: string; id_token?: string };
  if (!data.access_token) throw new Error("OIDC token response missing access_token");
  return { accessToken: data.access_token, idToken: data.id_token };
}

export async function fetchOidcUserInfo(
  cfg: OidcConfig,
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ email?: string; name?: string; sub?: string }> {
  const res = await fetchImpl(cfg.userinfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`OIDC userinfo failed (${res.status})`);
  return (await res.json()) as { email?: string; name?: string; sub?: string };
}
