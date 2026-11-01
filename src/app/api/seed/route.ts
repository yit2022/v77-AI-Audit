import { NextResponse } from "next/server";
import { seedIfEmpty } from "@/lib/db/seed";
export async function POST() { return NextResponse.json(await seedIfEmpty()); }
export async function GET() { return NextResponse.json(await seedIfEmpty()); }
