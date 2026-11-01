/**
 * SAML 2.0 scaffolding (no paid IdP). Metadata + ACS stubs for enterprise SSO readiness.
 * Enable with V77_SAML_ENABLED=true and optional V77_SAML_* env vars.
 */
export type SamlConfig = {
  entityId: string;
  acsUrl: string;
  metadataUrl: string;
  idpEntityId?: string;
  idpSsoUrl?: string;
  idpCertificate?: string;
};

export function loadSamlConfig(env: NodeJS.ProcessEnv = process.env): SamlConfig | null {
  const origin = (env.V77_APP_ORIGIN || "https://v77trust.com").replace(/\/$/, "");
  const entityId = env.V77_SAML_SP_ENTITY_ID?.trim() || `${origin}/saml/metadata`;
  const acsUrl = env.V77_SAML_ACS_URL?.trim() || `${origin}/api/auth/saml/acs`;
  const metadataUrl = `${origin}/api/auth/saml/metadata`;
  return {
    entityId,
    acsUrl,
    metadataUrl,
    idpEntityId: env.V77_SAML_IDP_ENTITY_ID?.trim() || undefined,
    idpSsoUrl: env.V77_SAML_IDP_SSO_URL?.trim() || undefined,
    idpCertificate: env.V77_SAML_IDP_CERTIFICATE?.trim() || undefined,
  };
}

/** Minimal SP metadata XML for IdP onboarding (unsigned). */
export function buildSpMetadataXml(cfg: SamlConfig): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor entityID="${escapeXml(cfg.entityId)}" xmlns="urn:oasis:names:tc:SAML:2.0:metadata">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" AuthnRequestsSigned="false" WantAssertionsSigned="true">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(cfg.acsUrl)}" index="0" isDefault="true"/>
  </SPSSODescriptor>
  <Organization>
    <OrganizationName xml:lang="en">V77 Trust</OrganizationName>
    <OrganizationDisplayName xml:lang="en">V77 Trust (Vertex77 sp. z o.o.)</OrganizationDisplayName>
    <OrganizationURL xml:lang="en">https://v77trust.com</OrganizationURL>
  </Organization>
</EntityDescriptor>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Parse a crude NameID / email from a SAML Response body (scaffolding — not full XML crypto). */
export function extractEmailFromSamlResponse(xml: string): string | null {
  const nameId = xml.match(/<saml2?:NameID[^>]*>([^<]+)<\/saml2?:NameID>/i) || xml.match(/<NameID[^>]*>([^<]+)<\/NameID>/i);
  if (nameId?.[1]?.includes("@")) return nameId[1].trim();
  const emailAttr = xml.match(/EmailAddress[^>]*>\s*([^<]+)/i) || xml.match(/emailaddress[^>]*>\s*([^<]+)/i);
  if (emailAttr?.[1]?.includes("@")) return emailAttr[1].trim();
  return null;
}
