import { NextResponse } from "next/server";
import { getPublicSsoStatus } from "@/lib/auth/sso";

/** @deprecated Prefer /api/auth/sso/status — kept for compatibility. */
export async function GET() {
  return NextResponse.json(getPublicSsoStatus());
}
