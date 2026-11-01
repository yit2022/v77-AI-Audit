import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { buildAuthorizationUrl, loadOidcConfig } from "@/lib/auth/oidc";

export async function GET() {
  const cfg = loadOidcConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "OIDC is not configured. Set OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_REDIRECT_URI." },
      { status: 503 },
    );
  }
  const state = randomBytes(16).toString("hex");
  const url = buildAuthorizationUrl(cfg, state);
  const res = NextResponse.redirect(url);
  res.cookies.set("v77_oidc_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
