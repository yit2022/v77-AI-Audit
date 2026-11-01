/** Session cookie policy for production HTTPS and local HTTP. */
export function sessionCookieOptions(expiresAt: Date): {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  expires: Date;
  secure: boolean;
} {
  const secure =
    process.env.V77_COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" && process.env.V77_COOKIE_SECURE !== "false");
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    secure,
  };
}

export function assertSessionIdShape(sid: string | undefined | null): boolean {
  if (!sid) return false;
  // uuid v4-ish from id()
  return /^[0-9a-f-]{36}$/i.test(sid);
}
