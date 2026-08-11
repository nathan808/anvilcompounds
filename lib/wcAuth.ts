import crypto from "crypto";

// Shared WooCommerce-customer + WP-JWT helpers used by both the account
// registration route and the NextAuth config (lib/authOptions.ts) — the
// derived-password convention (see derivePassword below) needs to live in
// exactly one place now that more than one auth path relies on it.

export function derivePassword(email: string, birthday: string): string {
  const secret = process.env.ANVIL_AUTH_SECRET ?? "anvil_research_2024";
  return crypto
    .createHmac("sha256", secret)
    .update(`${email.toLowerCase().trim()}:${birthday}`)
    .digest("hex")
    .slice(0, 32);
}

export function wcAuthHeader(): string | null {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key || !secret) return null;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

export interface WCCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing?: { phone?: string; [k: string]: unknown };
  meta_data: { key: string; value: string }[];
}

export function getMeta(customer: WCCustomer, key: string): string {
  return customer.meta_data?.find((m) => m.key === key)?.value ?? "";
}

// US-only, matching this store's domestic-only shipping — strips formatting
// and normalizes to E.164 (+1XXXXXXXXXX) for both Twilio and storage/lookup.
export function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

// Every function below is called from inside NextAuth's authorize()
// callback (lib/authOptions.ts). A thrown exception there — WC unreachable,
// a network timeout, malformed JSON — surfaces to the user as NextAuth's
// opaque "There is a problem with the server configuration" page instead of
// a normal "couldn't sign you in" message. Catching here and returning null
// keeps that failure mode readable; authorize() already treats null as
// "not found / didn't verify" and reports it as a clean sign-in failure.
export async function findWcCustomerByEmail(email: string): Promise<WCCustomer | null> {
  const wcUrl = process.env.WC_URL;
  const auth = wcAuthHeader();
  if (!wcUrl || !auth) return null;
  try {
    const res = await fetch(`${wcUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) return null;
    const customers = (await res.json()) as WCCustomer[];
    return customers[0] ?? null;
  } catch {
    return null;
  }
}

// WooCommerce's REST `?search=` filters by name/email/username, not phone —
// billing_phone is plain user meta with no index WP_User_Query searches by
// default. Rather than paginating every customer to filter client-side
// (slow, and still wrong once the customer list is large), this calls a
// small custom endpoint — see wordpress/phone-lookup-endpoint.php — that
// does an indexed meta lookup directly. Requires ANVIL_PHONE_LOOKUP_SECRET
// to be set to the same value on both Vercel and in that WP snippet.
export async function findWcCustomerByPhone(phone: string): Promise<WCCustomer | null> {
  const wcUrl = process.env.WC_URL;
  const auth = wcAuthHeader();
  const lookupSecret = process.env.ANVIL_PHONE_LOOKUP_SECRET;
  if (!wcUrl || !auth || !lookupSecret) return null;

  const e164 = toE164(phone);
  if (!e164) return null;

  try {
    const lookupRes = await fetch(
      `${wcUrl}/wp-json/anvil/v1/customer-by-phone?phone=${encodeURIComponent(e164)}`,
      { headers: { "x-anvil-secret": lookupSecret } }
    );
    if (!lookupRes.ok) return null;
    const { id } = (await lookupRes.json()) as { id: number | null };
    if (!id) return null;

    const custRes = await fetch(`${wcUrl}/wp-json/wc/v3/customers/${id}`, {
      headers: { Authorization: auth },
    });
    if (!custRes.ok) return null;
    return (await custRes.json()) as WCCustomer;
  } catch {
    return null;
  }
}

export async function fetchWpJwt(email: string, password: string): Promise<string | null> {
  const wcUrl = process.env.WC_URL;
  if (!wcUrl) return null;
  try {
    const res = await fetch(`${wcUrl}/wp-json/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

export async function updateWcCustomer(id: number, body: Record<string, unknown>): Promise<WCCustomer | null> {
  const wcUrl = process.env.WC_URL;
  const auth = wcAuthHeader();
  if (!wcUrl || !auth) return null;
  try {
    const res = await fetch(`${wcUrl}/wp-json/wc/v3/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as WCCustomer;
  } catch {
    return null;
  }
}

export async function createWcCustomer(
  body: Record<string, unknown>
): Promise<{ customer: WCCustomer | null; status: number }> {
  const wcUrl = process.env.WC_URL;
  const auth = wcAuthHeader();
  if (!wcUrl || !auth) return { customer: null, status: 500 };
  try {
    const res = await fetch(`${wcUrl}/wp-json/wc/v3/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { customer: null, status: res.status };
    return { customer: (await res.json()) as WCCustomer, status: res.status };
  } catch {
    return { customer: null, status: 500 };
  }
}

// Derives+sets the customer's WP password from their email+birthday and
// fetches a fresh WP JWT with it — the step that makes every provider
// (credentials, phone, Google) converge on the same JWT convention every
// existing /api/account/* route already trusts (see lib/verifyJwt.ts).
export async function establishWpSession(customer: WCCustomer, birthday: string): Promise<string | null> {
  const password = derivePassword(customer.email, birthday);
  const updated = await updateWcCustomer(customer.id, { password });
  if (!updated) return null;
  return fetchWpJwt(customer.email, password);
}
