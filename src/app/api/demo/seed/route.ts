import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ensureBuyerDemoOrg } from "@/lib/demo/sample-org";
import { isPlatformAdminEmail } from "@/lib/platform/admin";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformAdminEmail(session.email) && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await ensureBuyerDemoOrg();
  return NextResponse.json(result);
}
