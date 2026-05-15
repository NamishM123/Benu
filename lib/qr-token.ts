export const QR_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signQrToken(
  table: number,
  secret: string,
): Promise<{ ts: number; token: string }> {
  const ts = Date.now();
  const token = await hmac(secret, `table=${table}&ts=${ts}`);
  return { ts, token };
}

export type VerifyResult = "valid" | "expired" | "invalid";

export async function verifyQrToken(
  table: number,
  ts: number,
  token: string,
  secret: string,
): Promise<VerifyResult> {
  if (Date.now() - ts > QR_EXPIRY_MS) return "expired";
  const expected = await hmac(secret, `table=${table}&ts=${ts}`);
  return token === expected ? "valid" : "invalid";
}
