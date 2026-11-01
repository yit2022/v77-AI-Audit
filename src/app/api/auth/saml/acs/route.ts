import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { isSamlEnabled } from "@/lib/auth/sso";
import { extractEmailFromSamlResponse } from "@/lib/auth/saml";
import { db, ensureDb, schema } from "@/lib/db";
import { createSession } from "@/lib/auth/session";

/**
 * SAML Assertion Consumer Service (POST). Scaffolding only — validates presence of email NameID
 * for already-provisioned users. Full XML signature verification is intentionally out of scope
 * until a customer IdP is connected (no paid IdP dependency).
 */
export async function POST(req: NextRequest) {
  if (!isSamlEnabled()) {
    return NextResponse.redirect(new URL("/login?error=saml_disabled", req.url));
  }
  const form = await req.formData().catch(() => null);
  const raw = String(form?.get("SAMLResponse") || "");
  if (!raw) return NextResponse.redirect(new URL("/login?error=saml_missing", req.url));
  let xml = raw;
  try {
    xml = Buffer.from(raw, "base64").toString("utf8");
  } catch {
    /* already xml */
  }
  const email = extractEmailFromSamlResponse(xml);
  if (!email) return NextResponse.redirect(new URL("/login?error=saml_email", req.url));

  await ensureDb();
  const users = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).limit(1);
  const user = users[0];
  if (!user) return NextResponse.redirect(new URL("/login?error=saml_unknown_user", req.url));
  const memberships = await db.select().from(schema.memberships).where(eq(schema.memberships.userId, user.id)).limit(1);
  const m = memberships[0];
  if (!m) return NextResponse.redirect(new URL("/login?error=saml_no_org", req.url));
  await createSession(user.id, m.orgId);
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
