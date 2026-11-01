import { NextResponse } from "next/server";
import { isSamlEnabled } from "@/lib/auth/sso";
import { buildSpMetadataXml, loadSamlConfig } from "@/lib/auth/saml";

export async function GET() {
  if (!isSamlEnabled()) {
    return NextResponse.json({ error: "SAML SSO is disabled. Set V77_SSO_ENABLED and V77_SAML_ENABLED." }, { status: 404 });
  }
  const cfg = loadSamlConfig();
  if (!cfg) return NextResponse.json({ error: "SAML not configured" }, { status: 500 });
  return new NextResponse(buildSpMetadataXml(cfg), {
    status: 200,
    headers: { "Content-Type": "application/samlmetadata+xml; charset=utf-8" },
  });
}
