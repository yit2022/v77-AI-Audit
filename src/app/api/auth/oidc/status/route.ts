import { NextResponse } from "next/server";
import { getPublicOidcStatus } from "@/lib/auth/oidc";

export async function GET() {
  return NextResponse.json(getPublicOidcStatus());
}
