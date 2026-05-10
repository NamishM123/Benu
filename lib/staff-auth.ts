// HMAC-signed cookie helpers usable from both Edge (middleware) and Node
// (route handlers). Cookie format: `<expiresAtMs>.<base64url HMAC-SHA256>`.

export const COOKIE_NAME = "benu_staff";
const SESSION_DAYS = 30;

function b64uEncode(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64uDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function makeCookieValue(secret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expiresAt);
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return `${payload}.${b64uEncode(sig)}`;
}

export async function verifyCookieValue(
  value: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const payload = value.slice(0, dot);
  const sigB64 = value.slice(dot + 1);
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  let sigBytes: Uint8Array;
  try {
    sigBytes = b64uDecode(sigB64);
  } catch {
    return false;
  }
  const key = await importKey(secret);
  // Copy into a fresh ArrayBuffer so the type matches BufferSource cleanly.
  const sigBuf = sigBytes.buffer.slice(
    sigBytes.byteOffset,
    sigBytes.byteOffset + sigBytes.byteLength,
  ) as ArrayBuffer;
  return crypto.subtle.verify(
    "HMAC",
    key,
    sigBuf,
    new TextEncoder().encode(payload),
  );
}

export const COOKIE_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
