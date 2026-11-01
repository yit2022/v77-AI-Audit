import { NextResponse } from "next/server";
import { getPublicSsoStatus } from "@/lib/auth/sso";

export async function GET() {
  return NextResponse.json(getPublicSsoStatus());
}
