import { NextResponse } from "next/server";
import { listArchive } from "@/lib/server-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const archive = await listArchive();
  return NextResponse.json({ archive });
}
