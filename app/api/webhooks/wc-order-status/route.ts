import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { sendMetaCapiPurchase } from "@/lib/metaCapi";

// WooCommerce webhook receiver — configured in wp-admin under WooCommerce ->
// Settings -> Advanced -> Webhooks, topic "Order updated", delivery URL
// pointed at this route. This is the ONLY reliable trigger for a Meta
// Purchase event in this store: orders are created "on-hold" and only
// become "processing" once payment is actually confirmed (webhook from
// Bankful, or manual for Zelle — see CHECKOUT_SPEC.md's Order lifecycle
// section) which can happen well after the customer has left the site.
// Firing Purchase at order *creation* instead would report every abandoned/
// expired on-hold order as a sale to Meta and wreck ad-optimization signal.

const SITE_URL = "https://www.anvilcompounds.shop";
const PURCHASE_SENT_META_KEY = "_meta_capi_purchase_sent";
const CONFIRMED_STATUSES = new Set(["processing", "completed"]);

interface WCOrderMetaEntry {
  key: string;
  value: unknown;
}

interface WCOrderWebhookPayload {
  id: number;
  status: string;
  total: string;
  currency: string;
  billing?: { email?: string; phone?: string };
  line_items?: { product_id: number }[];
  meta_data?: WCOrderMetaEntry[];
}

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const expectedBuf = Buffer.from(expected);
  const givenBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== givenBuf.length) return false;
  return timingSafeEqual(expectedBuf, givenBuf);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // WooCommerce's "Save webhook" button in wp-admin fires an UNSIGNED
  // connectivity ping before any real order data ever flows through this
  // URL (confirmed via production logs: no X-WC-Webhook-Signature header,
  // 13-byte body). Its exact shape isn't documented and apparently isn't
  // even always valid JSON, so anything that doesn't parse into a real
  // order (id + status) is treated the same way — skipped with a 200,
  // never a 400/401 — since there's nothing in it worth authenticating or
  // erroring over. A payload that DOES parse into id + status is a real
  // order event and is NOT let through without a verified signature below.
  let order: Partial<WCOrderWebhookPayload> = {};
  try {
    order = JSON.parse(rawBody);
  } catch {
    console.log(`[wc-order-status webhook] non-JSON body, treating as ping (length ${rawBody.length}): ${rawBody.slice(0, 200)}`);
  }
  if (!order?.id || !order.status) {
    return NextResponse.json({ ok: true, skipped: "not_an_order_event" });
  }
  // Narrowed: id + status just confirmed present, so this is a real order payload.
  const confirmedOrder = order as WCOrderWebhookPayload;

  // Trimmed defensively — a stray trailing newline from pasting into an env
  // var textarea (Vercel's Value field, unlike a single-line admin input,
  // doesn't strip it) silently breaks the HMAC comparison with no visible
  // symptom other than every delivery failing signature verification.
  const secret = process.env.WC_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[wc-order-status webhook] FAIL: WC_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const signature = req.headers.get("x-wc-webhook-signature")?.trim() ?? null;
  if (!verifySignature(rawBody, signature, secret)) {
    // Lengths only — never log the secret or the raw signature value.
    console.warn(
      `[wc-order-status webhook] FAIL: signature mismatch for order ${confirmedOrder.id} (header present: ${!!signature}, header length: ${signature?.length ?? 0}, secret length: ${secret.length}, body length: ${rawBody.length})`
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!CONFIRMED_STATUSES.has(confirmedOrder.status)) {
    return NextResponse.json({ ok: true, skipped: `status_${confirmedOrder.status}` });
  }

  // Idempotency: WC fires this webhook on every order save (e.g. a later
  // shipping-label update), not just the on-hold -> processing transition,
  // so without this flag a single paid order could fire Purchase repeatedly.
  const alreadySent = confirmedOrder.meta_data?.some(
    (m) => m.key === PURCHASE_SENT_META_KEY && m.value === "yes"
  );
  if (alreadySent) {
    return NextResponse.json({ ok: true, skipped: "already_sent" });
  }

  const contentIds = (confirmedOrder.line_items ?? []).map((li) => String(li.product_id));

  const capiResult = await sendMetaCapiPurchase({
    eventId: `order_${confirmedOrder.id}`,
    orderTotal: parseFloat(confirmedOrder.total),
    currency: confirmedOrder.currency || "USD",
    contentIds,
    email: confirmedOrder.billing?.email,
    phone: confirmedOrder.billing?.phone,
    eventSourceUrl: `${SITE_URL}/checkout/confirmation`,
  });

  if (!capiResult.ok) {
    console.error(
      `[wc-order-status webhook] Meta CAPI send failed for order ${confirmedOrder.id}`,
      capiResult.status,
      capiResult.body
    );
    return NextResponse.json({ error: "CAPI send failed" }, { status: 502 });
  }

  const url = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const wcSecret = process.env.WC_CONSUMER_SECRET;
  if (url && key && wcSecret) {
    const auth = Buffer.from(`${key}:${wcSecret}`).toString("base64");
    try {
      await fetch(`${url}/wp-json/wc/v3/orders/${confirmedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
        body: JSON.stringify({ meta_data: [{ key: PURCHASE_SENT_META_KEY, value: "yes" }] }),
      });
    } catch (err) {
      console.error(`[wc-order-status webhook] FAIL: could not flag order ${confirmedOrder.id} as sent`, err);
    }
  }

  return NextResponse.json({ ok: true });
}
