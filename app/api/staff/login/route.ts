import { NextResponse } from "next/server";
import {
  COOKIE_MAX_AGE_SECONDS,
  COOKIE_NAME,
  makeCookieValue,
} from "@/lib/staff-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const password = (body as { password?: unknown })?.password;

  const expected = process.env.STAFF_PASSWORD;
  const secret = process.env.STAFF_COOKIE_SECRET;
  if (!expected || !secret) {
    return NextResponse.json({ error: "auth not configured" }, { status: 500 });
  }
  if (typeof password !== "string" || password !== expected) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  const value = await makeCookieValue(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}
