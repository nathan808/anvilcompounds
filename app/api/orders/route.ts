import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8).toUpperCase();
  console.log(`[orders:${requestId}] ── START ──────────────────────────────`);

  try {
    // ── 1. Parse request body ────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error(`[orders:${requestId}] FAIL: could not parse request body`, parseErr);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { items, billing, notes, ruoConfirmed, customer_id } = body as {
      items: { wcProductId: number; quantity: number; name: string; size: string; price: number }[];
      billing: Record<string, string>;
      notes?: string;
      ruoConfirmed?: boolean;
      customer_id?: number;
    };

    console.log(`[orders:${requestId}] Request body:`, JSON.stringify({
      itemCount: items?.length,
      items: items?.map(i => ({ name: i.name, wcProductId: i.wcProductId, qty: i.quantity, price: i.price })),
      billingEmail: billing?.email,
      billingName: `${billing?.firstName} ${billing?.lastName}`,
      ruoConfirmed,
      customer_id,
    }));

    // ── 2. Check env vars ────────────────────────────────────────────────────
    const url    = process.env.WC_URL;
    const key    = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;

    console.log(`[orders:${requestId}] Env vars: WC_URL=${url ? `"${url}"` : "MISSING"} KEY=${key ? "present" : "MISSING"} SECRET=${secret ? "present" : "MISSING"}`);

    if (!url || !key || !secret) {
      console.error(`[orders:${requestId}] FAIL: missing env vars — WC_URL:${!!url} KEY:${!!key} SECRET:${!!secret}`);
      return NextResponse.json({ error: "API not configured" }, { status: 500 });
    }

    // ── 3. Build line_items ──────────────────────────────────────────────────
    const lineItems = (items ?? []).map((item) => ({
      product_id: item.wcProductId,
      quantity: item.quantity,
    }));

    const zeroIdItems = lineItems.filter(i => i.product_id === 0);
    if (zeroIdItems.length > 0) {
      console.warn(`[orders:${requestId}] WARN: ${zeroIdItems.length} line_item(s) have product_id=0 — WooCommerce will reject these`);
    }

    console.log(`[orders:${requestId}] line_items:`, JSON.stringify(lineItems));

    // ── 4. Build WC payload ──────────────────────────────────────────────────
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");

    const payload = {
      payment_method: "bacs",
      payment_method_title: "Manual Payment (Zelle / ACH / Crypto)",
      status: "on-hold",
      customer_id: customer_id ?? 0,
      billing: {
        first_name: billing.firstName,
        last_name:  billing.lastName,
        address_1:  billing.address1,
        address_2:  billing.address2 ?? "",
        city:       billing.city,
        state:      billing.state,
        postcode:   billing.zip,
        country:    "US",
        email:      billing.email,
        phone:      billing.phone,
      },
      shipping: {
        first_name: billing.firstName,
        last_name:  billing.lastName,
        address_1:  billing.address1,
        address_2:  billing.address2 ?? "",
        city:       billing.city,
        state:      billing.state,
        postcode:   billing.zip,
        country:    "US",
      },
      line_items: lineItems,
      customer_note: notes ?? "",
      meta_data: [
        { key: "_ruo_confirmed",    value: ruoConfirmed ? "yes" : "no" },
        { key: "_ruo_confirmed_at", value: new Date().toISOString() },
        { key: "_ruo_confirmed_ip", value: ip },
      ],
    };

    const wcEndpoint = `${url}/wp-json/wc/v3/orders`;
    console.log(`[orders:${requestId}] Calling WC: POST ${wcEndpoint}`);
    console.log(`[orders:${requestId}] Auth header: Basic [key:${key.slice(0,8)}...] present`);
    console.log(`[orders:${requestId}] Payload (billing/shipping redacted):`, JSON.stringify({
      ...payload,
      billing:  { email: payload.billing.email, state: payload.billing.state },
      shipping: "[redacted]",
    }));

    // ── 5. Call WooCommerce ──────────────────────────────────────────────────
    let wcRes: Response;
    try {
      wcRes = await fetch(wcEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (fetchErr) {
      console.error(`[orders:${requestId}] FAIL: network error reaching WooCommerce`, fetchErr);
      return NextResponse.json({ error: "Could not reach WooCommerce" }, { status: 502 });
    }

    const wcBody = await wcRes.text();
    console.log(`[orders:${requestId}] WC response status: ${wcRes.status}`);
    console.log(`[orders:${requestId}] WC response body: ${wcBody.slice(0, 500)}`);

    if (!wcRes.ok) {
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(wcBody); } catch { /* not JSON */ }
      console.error(`[orders:${requestId}] FAIL: WC returned ${wcRes.status}`, parsed);
      return NextResponse.json(
        { error: "Failed to create order", wcStatus: wcRes.status, wcError: parsed },
        { status: 500 }
      );
    }

    const order = JSON.parse(wcBody) as { id: number; number: string };
    console.log(`[orders:${requestId}] SUCCESS: order created — id:${order.id} number:${order.number}`);
    console.log(`[orders:${requestId}] ── END ────────────────────────────────`);

    // ── Fire Omnisend events (fire-and-forget — never fails the order) ──────
    const omnisendKey = process.env.OMNISEND_API_KEY;
    if (omnisendKey) {
      const omnisendHeaders = {
        "Content-Type": "application/json",
        "X-API-KEY": omnisendKey,
      };
      const omnisendBase = "https://api.omnisend.com/v3";

      Promise.allSettled([
        // 1. "Order Placed" event
        fetch(`${omnisendBase}/events`, {
          method: "POST",
          headers: omnisendHeaders,
          body: JSON.stringify({
            email: billing.email,
            eventName: "Order Placed",
            eventVersion: "v2",
            fields: {
              orderId: String(order.id),
              orderNumber: String(order.number),
              currency: "USD",
              orderTotal: (items as { price: number; quantity: number }[])
                .reduce((s, i) => s + i.price * i.quantity, 0)
                .toFixed(2),
              lineItems: (items as { name: string; wcProductId: number; price: number; quantity: number }[])
                .map((i) => ({
                  productId: String(i.wcProductId),
                  title: i.name,
                  price: i.price,
                  quantity: i.quantity,
                })),
            },
          }),
        }),
        // 2. Upsert contact with "customer" tag
        fetch(`${omnisendBase}/contacts`, {
          method: "POST",
          headers: omnisendHeaders,
          body: JSON.stringify({
            email: billing.email,
            firstName: billing.firstName ?? "",
            lastName: billing.lastName ?? "",
            tags: ["customer"],
            status: "subscribed",
            statusDate: new Date().toISOString(),
          }),
        }),
      ]).catch(() => {});
    }

    return NextResponse.json({ orderId: order.id, orderNumber: order.number });

  } catch (err) {
    console.error(`[orders:${requestId}] UNHANDLED ERROR:`, err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
