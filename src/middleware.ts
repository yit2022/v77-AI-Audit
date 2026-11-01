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
    const res = NextResponse.redirect(url);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
    return res;
  }
  // /inventory/:id → /systems/:id
  if (pathname.startsWith("/inventory/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/systems/" + pathname.slice("/inventory/".length);
    const res = NextResponse.redirect(url);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
    return res;
  }
  if (pathname.startsWith("/ai-systems/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/systems/" + pathname.slice("/ai-systems/".length);
    const res = NextResponse.redirect(url);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
    return res;
  }
  if (pathname.startsWith("/app/") && pathname !== "/app") {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(4) || "/dashboard";
    const res = NextResponse.redirect(url);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
    return res;
  }

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
