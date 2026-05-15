import { NextResponse } from "next/server";
import { signQrToken, QR_EXPIRY_MS } from "@/lib/qr-token";
import { TABLE_COUNT } from "@/lib/prep-time";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret =
    process.env.QR_SECRET ||
    process.env.STAFF_COOKIE_SECRET ||
    "dev-qr-secret";

  // Use the customer host so codes always point at the right domain
  const url = new URL(req.url);
  const customerHost = process.env.NEXT_PUBLIC_CUSTOMER_HOST;
  const base = customerHost
    ? `https://${customerHost}`
    : `${url.protocol}//${url.host}`;

  const now = Date.now();
  const expiresAt = now + QR_EXPIRY_MS;

  const entries = await Promise.all(
    Array.from({ length: TABLE_COUNT }, async (_, i) => {
      const table = i + 1;
      const { ts, token } = await signQrToken(table, secret);
      const signed = `${base}/menu?table=${table}&ts=${ts}&token=${encodeURIComponent(token)}`;
      return { table, url: signed };
    }),
  );

  return NextResponse.json({ entries, expiresAt });
}
