// Verifies a customer's JWT (issued by the JWT Auth plugin on the WordPress
// backend — see app/api/auth/login|register|verify-2fa) and returns the
// WooCommerce customer ID it belongs to, WITHOUT trusting anything the
// client claims about its own identity.
//
// The JWT Auth plugin owns the signing secret (this app never has it), so
// signature/expiry verification has to happen against WordPress itself via
// its /token/validate endpoint — decoding the payload locally only tells you
// what the token *claims*, not whether it's genuine. Once validated, the
// embedded WP user ID is trustworthy — and WooCommerce customers are just
// WP users, so that ID IS the customer ID (same numbers used everywhere
// else in this codebase, e.g. wcCustomerId from /api/auth/login).

interface JwtPayload {
  data?: { user?: { id?: string | number } };
  exp?: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export async function getAuthenticatedCustomerId(token: string | null): Promise<number | null> {
  if (!token) return null;
  const wcUrl = process.env.WC_URL;
  if (!wcUrl) return null;

  try {
    const res = await fetch(`${wcUrl}/wp-json/jwt-auth/v1/token/validate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
  } catch {
    return null;
  }

  const payload = decodeJwtPayload(token);
  const id = payload?.data?.user?.id;
  if (id === undefined || id === null) return null;
  const numId = typeof id === "string" ? parseInt(id, 10) : id;
  return Number.isFinite(numId) ? numId : null;
}
