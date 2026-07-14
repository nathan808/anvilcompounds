import { NextRequest, NextResponse } from "next/server";
import { computeCouponDiscount } from "@/lib/couponMath";
import { computeTax, roundCurrency } from "@/lib/taxMath";
import { fetchTaxRate } from "@/lib/wcTax";
import { PAYMENT_METHODS, PaymentMethodId } from "@/lib/paymentMethods";
import { PAYMENT_CONFIG } from "@/lib/paymentConfig";

interface PlaceOrderBody {
  items: { wcProductId: number; quantity: number; name: string; size: string; price: number }[];
  billing: Record<string, string>;
  coupon: { code: string; discountType: "percent" | "fixed_cart"; amount: number } | null;
  shipping: { methodId: string; instanceId: number; title: string; cost: number };
  paymentMethodId: PaymentMethodId;
  ruoConfirmed: boolean;
  customer_id?: number;
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8).toUpperCase();
  console.log(`[place-order:${requestId}] ── START ──────────────────────────────`);

  let body: PlaceOrderBody;
  try {
    body = await req.json();
  } catch (err) {
    console.error(`[place-order:${requestId}] FAIL: could not parse body`, err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { items, billing, coupon, shipping, paymentMethodId, ruoConfirmed, customer_id } = body;

  const methodMeta = PAYMENT_METHODS.find((m) => m.id === paymentMethodId);
  if (!methodMeta) {
    console.error(`[place-order:${requestId}] FAIL: unknown paymentMethodId "${paymentMethodId}"`);
    return NextResponse.json({ error: "Unknown payment method" }, { status: 400 });
  }

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!shipping) {
    return NextResponse.json({ error: "No shipping method selected" }, { status: 400 });
  }

  // ── Server-side totals — never trust a client-supplied total ──────────────
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const couponDiscount = computeCouponDiscount(subtotal, coupon);
  const postCouponSubtotal = subtotal - couponDiscount;
  const paymentDiscountAmount = roundCurrency(postCouponSubtotal * (methodMeta.discountPercent / 100));

  let taxRate = 0;
  let shippingTaxable = false;
  try {
    const taxInfo = await fetchTaxRate(billing.state);
    taxRate = taxInfo.rate;
    shippingTaxable = taxInfo.shippingTaxable;
  } catch (err) {
    console.error(`[place-order:${requestId}] FAIL: could not load tax rate`, err);
    return NextResponse.json({ error: "Could not load tax rate" }, { status: 502 });
  }

  const tax = computeTax(taxRate, postCouponSubtotal, paymentDiscountAmount, shipping.cost, shippingTaxable);
  const expectedTotal = roundCurrency(postCouponSubtotal - paymentDiscountAmount + shipping.cost + tax.totalTax);

  console.log(`[place-order:${requestId}] Method: ${paymentMethodId} | subtotal:${subtotal} couponDiscount:${couponDiscount} paymentDiscount:${paymentDiscountAmount} shipping:${shipping.cost} taxRate:${taxRate} totalTax:${tax.totalTax} expectedTotal:${expectedTotal}`);

  // ── Zelle cap, enforced server-side too ────────────────────────────────────
  if (paymentMethodId === "zelle" && expectedTotal > PAYMENT_CONFIG.zelle.maxOrder) {
    console.warn(`[place-order:${requestId}] FAIL: Zelle order ${expectedTotal} exceeds cap ${PAYMENT_CONFIG.zelle.maxOrder}`);
    return NextResponse.json({
      error: `Zelle is not available above $${PAYMENT_CONFIG.zelle.maxOrder}. Contact support@anvilcompounds.shop for orders over $${PAYMENT_CONFIG.zelle.maxOrder}.`,
    }, { status: 400 });
  }

  const url = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  if (!url || !key || !secret) {
    console.error(`[place-order:${requestId}] FAIL: missing WC env vars`);
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const lineItems = items.map((item) => {
    const lineTotal = (item.price * item.quantity).toFixed(2);
    return { product_id: item.wcProductId, quantity: item.quantity, subtotal: lineTotal, total: lineTotal };
  });

  const feeLines = paymentDiscountAmount > 0
    ? [{
        name: `Payment method discount (${methodMeta.label})`,
        total: (-paymentDiscountAmount).toFixed(2),
        tax_status: "none",
      }]
    : [];

  const couponLines = coupon ? [{ code: coupon.code }] : [];

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const payload = {
    payment_method: paymentMethodId,
    payment_method_title: methodMeta.label,
    status: "on-hold",
    customer_id: customer_id ?? 0,
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
    shipping_lines: [{
      method_id: shipping.methodId,
      method_title: shipping.title,
      instance_id: String(shipping.instanceId),
      total: shipping.cost.toFixed(2),
    }],
    coupon_lines: couponLines,
    fee_lines: feeLines,
    meta_data: [
      { key: "anvil_payment_method", value: paymentMethodId },
      { key: "_ruo_confirmed", value: ruoConfirmed ? "yes" : "no" },
      { key: "_ruo_confirmed_at", value: new Date().toISOString() },
      { key: "_ruo_confirmed_ip", value: ip },
    ],
  };

  console.log(`[place-order:${requestId}] WC payload (address redacted):`, JSON.stringify({
    ...payload,
    billing: { email: payload.billing.email, state: payload.billing.state },
    shipping: "[redacted]",
  }));

  let wcRes: Response;
  try {
    wcRes = await fetch(`${url}/wp-json/wc/v3/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`[place-order:${requestId}] FAIL: network error reaching WooCommerce`, err);
    return NextResponse.json({ error: "Could not reach WooCommerce" }, { status: 502 });
  }

  const wcBody = await wcRes.text();
  if (!wcRes.ok) {
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(wcBody); } catch {}
    console.error(`[place-order:${requestId}] FAIL: WC returned ${wcRes.status}`, parsed);
    return NextResponse.json({ error: "Failed to create order", wcStatus: wcRes.status, wcError: parsed }, { status: 500 });
  }

  const order = JSON.parse(wcBody) as { id: number; number: string; order_key: string; total: string };
  const wcTotal = parseFloat(order.total);

  console.log(`[place-order:${requestId}] WC order created — id:${order.id} total:${order.total} (expected ${expectedTotal})`);

  // ── CRITICAL: verify WC's total matches what the customer was shown ───────
  if (Math.abs(wcTotal - expectedTotal) > 0.01) {
    console.error(`[place-order:${requestId}] TOTAL MISMATCH — WC:${wcTotal} vs expected:${expectedTotal} — order ${order.id} left on-hold in WooCommerce, NOT redirecting customer`);
    return NextResponse.json({
      error: "TOTAL_MISMATCH",
      message: "Order total did not match what was shown at checkout. Do not proceed with payment — contact support.",
      orderId: order.id,
      orderNumber: order.number,
      expectedTotal,
      wcTotal,
    }, { status: 500 });
  }

  console.log(`[place-order:${requestId}] ── END (totals match) ──────────────────`);

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.number,
    orderKey: order.order_key,
    total: wcTotal,
  });
}
