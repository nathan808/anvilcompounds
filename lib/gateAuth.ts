// Signs/verifies the cookie that marks a visitor as having passed the
// Turnstile + attestation gate (middleware.ts). Uses Web Crypto (crypto.subtle)
// rather than node:crypto so the same code runs in both the Edge middleware
// and the Node route handler that issues the cookie.

export const GATE_COOKIE_NAME = "anvil_gate";
const GATE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const secret = process.env.GATE_SECRET;
  if (!secret) throw new Error("GATE_SECRET is not set");
  return secret;
}

function toBase64Url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let str = "";
  for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const str = atob(padded);
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
  return arr;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(sig);
}

export async function signGateToken(): Promise<string> {
  const exp = Date.now() + GATE_DURATION_MS;
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ exp })).buffer);
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

export async function verifyGateToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expectedSig = await hmac(payload);
  if (sig !== expectedSig) return false;
  try {
    const { exp } = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}
