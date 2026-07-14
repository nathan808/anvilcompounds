// Server-only. Never import this from a client component.
//
// Talks to Bankful's hosted-payment API directly from Next.js. Payment
// CONFIRMATION is owned entirely by the Bankful WooCommerce plugin, which
// verifies its own HMAC signature on /wp-json/bankful/v1/order-updated — we
// do not reimplement or duplicate that here. This file only ever creates the
// hosted-page redirect link; it never receives or verifies a payment result.

const BANKFUL_API_BASE = "https://api.paybybankful.com";

export type BankfulMethodId = "ethereum" | "echeck";

export class BankfulError extends Error {
  code: "ORDER_KEY_MISMATCH" | "ORDER_NOT_PAYABLE" | "UPSTREAM_ERROR";
  constructor(code: BankfulError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

interface WcOrderForBankful {
  id: number;
  order_key: string;
  status: string;
  total: string;
  customer_ip_address: string;
  meta_data: { key: string; value: string }[];
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

async function fetchWcOrder(orderId: number): Promise<WcOrderForBankful> {
  const url = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!url || !key || !secret) throw new Error("WC env vars not configured");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${url}/wp-json/wc/v3/orders/${orderId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`WC order fetch failed: ${res.status}`);
  return res.json();
}

// Module-scope token cache. TTL is undocumented by Bankful, so we don't try
// to predict expiry — we hold onto it until a downstream call tells us it's
// no longer good (401), then re-exchange exactly once.
let cachedToken: string | null = null;

async function exchangeToken(): Promise<string> {
  const key = process.env.BANKFUL_API_KEY;
  const secret = process.env.BANKFUL_API_SECRET;
  if (!key || !secret) {
    // Deliberately generic — never state which credential is missing, and
    // never include the credential itself in any thrown message.
    throw new Error("Bankful credentials not configured");
  }

  const body = new URLSearchParams({ bf_api_key: key, bf_api_secret: secret });
  const res = await fetch(`${BANKFUL_API_BASE}/api/woocommerce-v2/validate-credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Bankful credential exchange failed: ${res.status}`);
  }

  const json = (await res.json()) as { status?: string; data?: { bf_api_access_token?: string } };
  if (json.status !== "success" || !json.data?.bf_api_access_token) {
    throw new Error("Bankful credential exchange did not return an access token");
  }

  return json.data.bf_api_access_token;
}

export async function getAccessToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken) return cachedToken;
  cachedToken = await exchangeToken();
  return cachedToken;
}

// Customer-facing (Vercel) domain — distinct from WC_URL, which is the bare
// domain serving WordPress's own /wp-json/* routes directly. www resolves to
// the Next.js app; the bare domain redirects browser paths to www but still
// serves /wp-json/* directly (verified live before writing this).
const SITE_URL = "https://www.anvilcompounds.shop";

export async function createPaymentLink(
  orderId: number,
  orderKey: string,
  method: BankfulMethodId
): Promise<{ redirectUrl: string }> {
  const order = await fetchWcOrder(orderId);

  if (order.order_key !== orderKey) {
    throw new BankfulError("ORDER_KEY_MISMATCH", "Order key does not match");
  }
  if (order.status !== "on-hold") {
    throw new BankfulError("ORDER_NOT_PAYABLE", `Order ${orderId} is not payable (status: ${order.status})`);
  }

  const wcUrl = process.env.WC_URL;
  if (!wcUrl) throw new Error("WC env vars not configured");

  const requestBody = {
    transaction_mode: process.env.BANKFUL_ENV === "live" ? "live" : "sandbox",
    cartName: "WooCommerce-Hosted-Page",
    order_id: order.id,
    request_amount: order.total, // dollars, decimal string — from the WC order, never computed here
    request_currency: "USD",
    callback_url: `${wcUrl}/wp-json/bankful/v1/order-updated`,
    redirect_success: `${wcUrl}/wp-json/bankful/v1/redirect-pending/`,
    x_url_failed: `${wcUrl}/wp-json/bankful/v1/redirect-pending/`,
    x_url_complete: `${SITE_URL}/checkout/confirmation?order=${order.id}`,
    x_url_cancel: `${SITE_URL}/checkout/pay/${method}?order=${order.id}&cancelled=1`,
    save_card_on_file: "N",
    cust_fname: order.billing.first_name,
    cust_lname: order.billing.last_name,
    bill_addr: order.billing.address_1,
    bill_addr_2: order.billing.address_2,
    bill_addr_city: order.billing.city,
    bill_addr_state: order.billing.state,
    bill_addr_country: order.billing.country,
    bill_addr_zip: order.billing.postcode,
    cust_phone: order.billing.phone,
    cust_email: order.billing.email,
    // customer_ip_address is read-only via the WC REST API (confirmed empty
    // on every order regardless of what's sent on create) — the real value
    // lives in the _headless_customer_ip meta key set by place-order/route.ts.
    remote_ip: order.customer_ip_address || order.meta_data.find((m) => m.key === "_headless_customer_ip")?.value || "",
  };

  const call = (token: string) =>
    fetch(`${BANKFUL_API_BASE}/api/woocommerce-v2/generate-redirect-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(requestBody),
    });

  let token = await getAccessToken();
  let res = await call(token);

  if (res.status === 401) {
    // Discard the cached token, re-exchange once, retry exactly once. Never more.
    token = await getAccessToken(true);
    res = await call(token);
  }

  if (!res.ok) {
    throw new BankfulError("UPSTREAM_ERROR", `Bankful generate-redirect-url failed: ${res.status}`);
  }

  const json = (await res.json()) as { redirect_url?: string };
  if (!json.redirect_url) {
    throw new BankfulError("UPSTREAM_ERROR", "Bankful response did not include redirect_url");
  }

  return { redirectUrl: json.redirect_url };
}
