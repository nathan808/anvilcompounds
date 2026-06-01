import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, billing, notes } = body;

    const url = process.env.WC_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;

    if (!url || !key || !secret) {
      return NextResponse.json({ error: "API not configured" }, { status: 500 });
    }

    const auth = Buffer.from(`${key}:${secret}`).toString("base64");

    const lineItems = items.map((item: { wcProductId: number; quantity: number }) => ({
      product_id: item.wcProductId,
      quantity: item.quantity,
    }));

    const payload = {
      payment_method: "bacs",
      payment_method_title: "Manual Payment (Zelle / ACH / Crypto)",
      status: "pending",
      billing: {
        first_name: billing.firstName,
        last_name: billing.lastName,
        address_1: billing.address1,
        address_2: billing.address2 ?? "",
        city: billing.city,
        state: billing.state,
        postcode: billing.zip,
        country: "US",
        email: billing.email,
        phone: billing.phone,
      },
      shipping: {
        first_name: billing.firstName,
        last_name: billing.lastName,
        address_1: billing.address1,
        address_2: billing.address2 ?? "",
        city: billing.city,
        state: billing.state,
        postcode: billing.zip,
        country: "US",
      },
      line_items: lineItems,
      customer_note: notes ?? "",
    };

    const wcRes = await fetch(`${url}/wp-json/wc/v3/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!wcRes.ok) {
      const err = await wcRes.text();
      console.error("WooCommerce error:", err);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const order = await wcRes.json();
    return NextResponse.json({ orderId: order.id, orderNumber: order.number });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
