import { createHash, randomBytes } from "crypto";

export const CSRF_COOKIE = "v77_csrf";
export const CSRF_HEADER = "x-csrf-token";

export function createCsrfToken(): string {
  return randomBytes(24).toString("base64url");
}

export function csrfPairValid(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length < 16 || headerToken.length < 16) return false;
  return cookieToken === headerToken;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
