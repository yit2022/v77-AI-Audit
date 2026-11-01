import { NextRequest, NextResponse } from "next/server";
import { seedIfEmpty } from "@/lib/db/seed";

export async function POST(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  return NextResponse.json(await seedIfEmpty({ force }));
}
export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  return NextResponse.json(await seedIfEmpty({ force }));
}
