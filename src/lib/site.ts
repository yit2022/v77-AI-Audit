import siteConfig from "../../site.config.json";

/** Single place for public origin / custom domain — change site.config.json and run npm run sync-domain. */
export function getConfiguredDomain(): string {
  return (
    process.env.V77_CUSTOM_DOMAIN?.trim() ||
    (siteConfig as { customDomain?: string }).customDomain ||
    "localhost:3000"
  );
}

export function getAppOrigin(req?: Request): string {
  const fromEnv = process.env.V77_APP_ORIGIN?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) return `${proto}://${host}`;
  }
  const domain = getConfiguredDomain();
  if (domain.startsWith("localhost")) return `http://${domain}`;
  return `https://${domain}`;
}

export function inviteAcceptUrl(token: string, req?: Request): string {
  return `${getAppOrigin(req)}/invite/${encodeURIComponent(token)}`;
}
