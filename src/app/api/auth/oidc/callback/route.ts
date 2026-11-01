import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, ensureDb, schema } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import {
  exchangeAuthorizationCode,
  fetchOidcUserInfo,
  loadOidcConfig,
} from "@/lib/auth/oidc";

export async function GET(req: Request) {
  const cfg = loadOidcConfig();
  if (!cfg) {
    return NextResponse.redirect(new URL("/login?error=oidc_disabled", req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expected = jar.get("v77_oidc_state")?.value;
  jar.delete("v77_oidc_state");

  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(new URL("/login?error=oidc_state", req.url));
  }

  try {
    const tokens = await exchangeAuthorizationCode(cfg, code);
    const profile = await fetchOidcUserInfo(cfg, tokens.accessToken);
    const email = profile.email?.toLowerCase();
    if (!email) {
      return NextResponse.redirect(new URL("/login?error=oidc_email", req.url));
    }

    await ensureDb();
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    const user = users[0];
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=oidc_unknown_user", req.url));
    }
    const memberships = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, user.id))
      .limit(1);
    const membership = memberships[0];
    if (!membership) {
      return NextResponse.redirect(new URL("/login?error=oidc_no_org", req.url));
    }
    await createSession(user.id, membership.orgId);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=oidc_exchange", req.url));
  }
}
