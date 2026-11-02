import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SECURITY_HEADERS } from "@/lib/security/headers";

/** Friendly aliases users / bookmarks / old copy expect. */
const ALIASES: Record<string, string> = {
  "/inventory": "/systems",
  "/ai-systems": "/systems",
  "/register": "/signup",
  "/sign-up": "/signup",
  "/sign-in": "/login",
  "/signin": "/login",
  "/app": "/dashboard",
  "/account": "/settings",
  "/profile": "/settings",
  "/home": "/",
  "/docs": "/developers",
  "/documentation": "/developers",
  "/api-docs": "/developers",
  "/status": "/api/health",
  "/health": "/api/health",
  "/billing/portal": "/billing",
  "/plans": "/pricing",
  "/pricing-plans": "/pricing",
  "/trial": "/signup",
  "/get-started": "/signup",
  "/password-reset": "/forgot-password",
  "/reset": "/forgot-password",
  "/team": "/settings",
  "/members": "/settings",
  "/org": "/settings",
  "/organisation": "/settings",
  "/organization": "/settings",
  "/trust-center": "/settings",
  "/risk-checker": "/#risk-checker",
  "/pilot": "/#pricing",
  "/request-pilot": "/#pricing",
};

const MARKETING = new Set([
  "/",
  "/pricing",
  "/how-it-works",
  "/demo",
  "/resources",
  "/frameworks",
  "/security",
  "/developers",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
  "/signup",
  "/forgot-password",
  "/unsubscribe",
]);

const SESSION_COOKIE = "v77_session";

function withSecurity(res: NextResponse, cachePublic = false) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  if (cachePublic) {
    // Override Next's private no-store for edge-cacheable marketing HTML.
    res.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=86400",
    );
  }
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const mapped = ALIASES[pathname];
  if (mapped) {
    const url = req.nextUrl.clone();
    if (mapped.includes("#")) {
      const [path, hash] = mapped.split("#");
      url.pathname = path || "/";
      url.hash = hash;
    } else {
      url.pathname = mapped;
    }
    return withSecurity(NextResponse.redirect(url));
  }
  if (pathname.startsWith("/inventory/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/systems/" + pathname.slice("/inventory/".length);
    return withSecurity(NextResponse.redirect(url));
  }
  if (pathname.startsWith("/ai-systems/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/systems/" + pathname.slice("/ai-systems/".length);
    return withSecurity(NextResponse.redirect(url));
  }
  if (pathname.startsWith("/app/") && pathname !== "/app") {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(4) || "/dashboard";
    return withSecurity(NextResponse.redirect(url));
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession && (pathname === "/" || pathname === "/signup" || pathname === "/login")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return withSecurity(NextResponse.redirect(url));
  }

  const isMarketing =
    MARKETING.has(pathname) ||
    pathname.startsWith("/resources/") ||
    pathname.startsWith("/trust/");

  return withSecurity(NextResponse.next(), isMarketing && !hasSession);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
