export const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy": [
    "default-src 'self'",
    // Next.js still needs inline styles; scripts stay self + inline for CF/OpenNext bootstrap.
    // unsafe-eval removed (Round 9 hardening).
    "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.stripe.com",
    "font-src 'self' data:",
    "connect-src 'self' https://cloudflareinsights.com https://*.cloudflareinsights.com https://api.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

export function applySecurityHeaders(headers: Headers) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
}
