import { createHash } from "crypto";

const GRAPH_API_VERSION = "v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// Meta requires phone numbers hashed as digits-only, no formatting/leading +.
function hashPhone(raw: string): string {
  return sha256(raw.replace(/[^0-9]/g, ""));
}

interface CapiPurchaseInput {
  eventId: string;
  orderTotal: number;
  currency: string;
  contentIds: string[];
  email?: string;
  phone?: string;
  clientIp?: string;
  eventSourceUrl?: string;
}

// Sends a server-side Purchase event to Meta's Conversions API. Used only
// from the WooCommerce order-status webhook (app/api/webhooks/wc-order-status)
// — there is no reliable client-side moment for "payment confirmed" given
// this store's delayed-settlement payment methods (Zelle/wire/crypto), so
// Purchase is CAPI-only rather than paired with a browser pixel event.
export async function sendMetaCapiPurchase(input: CapiPurchaseInput): Promise<{ ok: boolean; status?: number; body?: string }> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return { ok: false, body: "missing_meta_env_vars" };
  }

  const userData: Record<string, unknown> = {};
  if (input.email) userData.em = [sha256(input.email)];
  if (input.phone) userData.ph = [hashPhone(input.phone)];
  if (input.clientIp && input.clientIp !== "unknown") userData.client_ip_address = input.clientIp;

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        custom_data: {
          currency: input.currency,
          value: input.orderTotal,
          content_ids: input.contentIds,
          content_type: "product",
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };

  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  return { ok: res.ok, status: res.status, body };
}
