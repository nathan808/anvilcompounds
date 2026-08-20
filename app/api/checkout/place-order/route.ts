import { NextRequest, NextResponse } from "next/server";
import { resolveLineItem, ResolvedLineItem } from "@/lib/wcProducts";
import { fetchShippingOptions } from "@/lib/wcShipping";
import { validateCoupon } from "@/lib/wcCoupon";
import { computeCouponDiscount } from "@/lib/couponMath";
import { computeTax, roundCurrency } from "@/lib/taxMath";
import { fetchTaxRate } from "@/lib/wcTax";
import { PAYMENT_METHODS, PaymentMethodId } from "@/lib/paymentMethods";
import { PAYMENT_CONFIG } from "@/lib/paymentConfig";
import { computeVolumeDiscount, VOLUME_DISCOUNT_LABEL } from "@/lib/volumeDiscount";
import { MAX_QTY_PER_ITEM } from "@/lib/volumePricing";
import { computeBogoDiscount, computeBogoLineDiscount, BOGO_ENABLED, BOGO_LABEL, FREE_GIFT_PRODUCT_ID, FREE_GIFT_VARIATION_ID, BUNDLE_PRODUCT_IDS } from "@/lib/bogoDiscount";

// The client sends ONLY identifiers and selections — never a price, total,
// discount amount, or tax figure. Every money value below is derived
// server-side from WooCommerce (or from PAYMENT_CONFIG/lib/paymentMethods.ts,
// which the client cannot influence). client_total_cents is accepted purely
// as an optional staleness check (see PART C below) — it is never used in
// the order math itself.
interface PlaceOrderBody {
  items: { productId: number; size: string; quantity: number }[];
  shippingInstanceId: string;
  couponCode?: string;
  paymentMethodId: PaymentMethodId;
  billing: Record<string, string>;
  ruoConfirmed: boolean;
  customer_id?: number;
  client_total_cents?: number;
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

  const { items, shippingInstanceId, couponCode, paymentMethodId, billing, ruoConfirmed, customer_id, client_total_cents } = body;

  const methodMeta = PAYMENT_METHODS.find((m) => m.id === paymentMethodId);
  if (!methodMeta) {
    console.error(`[place-order:${requestId}] FAIL: unknown paymentMethodId "${paymentMethodId}"`);
    return NextResponse.json({ error: "Unknown payment method" }, { status: 400 });
  }
  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  const bundleItem = items.find((i) => BUNDLE_PRODUCT_IDS.has(i.productId));
  if (bundleItem) {
    console.warn(`[place-order:${requestId}] FAIL: bundle product ${bundleItem.productId} is out of stock`);
    return NextResponse.json(
      { error: "One of the bundles in your cart is currently out of stock. Please remove it to continue." },
      { status: 400 }
    );
  }
  const overLimit = items.find((i) => i.quantity < 1 || i.quantity > MAX_QTY_PER_ITEM);
  if (overLimit) {
    return NextResponse.json(
      { error: `Quantity must be between 1 and ${MAX_QTY_PER_ITEM} vials per compound.` },
      { status: 400 }
    );
  }
  if (!shippingInstanceId || typeof shippingInstanceId !== "string") {
    return NextResponse.json({ error: "No shipping method selected" }, { status: 400 });
  }
  if (!billing?.state) {
    return NextResponse.json({ error: "Missing shipping address" }, { status: 400 });
  }

  // ── 1. Line items — price comes ONLY from WooCommerce ─────────────────────
  // Resolved concurrently: each call is 1-2 independent WC round-trips
  // (product + variations), and they don't depend on each other, so awaiting
  // them one at a time in a loop was pure added latency for multi-item carts.
  // Tax rate lookup only needs billing.state, which is already known — kick
  // it off here too and await the result down in step 5. Pure reordering,
  // same validation and error messages as before.
  const taxRatePromise = fetchTaxRate(billing.state);
  taxRatePromise.catch(() => {}); // avoid an unhandled-rejection warning if an item fails to resolve below, before step 5 ever awaits this

  const resolvedResults = await Promise.all(
    items.map((item) => resolveLineItem(item.productId, item.size, item.quantity))
  );
  const failedIndex = resolvedResults.findIndex((r) => !r);
  if (failedIndex !== -1) {
    const item = items[failedIndex];
    console.error(`[place-order:${requestId}] FAIL: could not resolve product ${item.productId} (size "${item.size}", qty ${item.quantity})`);
    return NextResponse.json({ error: `One of the items in your cart is no longer available (product ${item.productId}).` }, { status: 400 });
  }
  const resolvedItems = resolvedResults as ResolvedLineItem[];

  const outOfStockIndex = resolvedItems.findIndex((r) => !r.inStock);
  if (outOfStockIndex !== -1) {
    const item = resolvedItems[outOfStockIndex];
    console.warn(`[place-order:${requestId}] FAIL: product ${item.productId} (variation ${item.variationId}) is out of stock`);
    return NextResponse.json(
      { error: `${item.name} is currently out of stock. Please remove it or choose a different size to continue.` },
      { status: 400 }
    );
  }
  const subtotal = roundCurrency(resolvedItems.reduce((s, i) => s + i.lineTotal, 0));

  // ── 1b. BOGO launch promo — every qualifying SKU (qty >= 2) gets its own
  //    2nd-unit-free pair, independently of every other line (one pair per
  //    SKU, not one per order). Still suppresses the $200+ Volume Discount
  //    and the payment-method discount (see lib/bogoDiscount.ts) — coupons
  //    (below) are the one exception, now allowed to stack ─────────────────
  const bogoLineInputs = resolvedItems.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, regularPrice: i.regularPrice, productId: i.productId }));
  // One entry per qualifying SKU — kept separate (not pre-summed) so each
  // becomes its own fee line, taxed and rounded independently by WC, same
  // principle as the per-product-line tax fix (see computeTax's docstring).
  const bogoLineDiscounts = resolvedItems
    .map((item, i) => ({ item, discount: computeBogoLineDiscount(bogoLineInputs[i]) }))
    .filter((d) => d.discount > 0);
  const bogoDiscount = roundCurrency(computeBogoDiscount(bogoLineInputs));
  const bogoActive = bogoDiscount > 0;
  // What the customer's order actually totals after BOGO, before any
  // coupon — the base chk10's $250 minimum and its own 10% are computed
  // against (confirmed with the store owner: "10% off this order", where
  // "this order" already reflects BOGO, not the pre-BOGO Base-price total).
  const postBogoSubtotal = roundCurrency(subtotal - bogoDiscount);

  // ── 2. Coupon — validated against WC, discount computed server-side ───────
  // NOTE: coupon amount is NOT delegated to WooCommerce's own coupon_lines
  // processing (see below, no coupon_lines sent) — WC computes a percent
  // coupon against its own view of the line-item subtotal, which has no
  // concept of our custom BOGO fee lines, so it would compute 10% of the
  // pre-BOGO amount instead of 10% of postBogoSubtotal. Instead this is
  // computed here and sent as our own fee line, same as BOGO/Volume
  // Discount, so WC's total exactly matches what's shown to the customer.
  let coupon: { code: string; discountType: "percent" | "fixed_cart"; amount: number } | null = null;
  if (couponCode) {
    const result = await validateCoupon(couponCode, postBogoSubtotal);
    if (!result.valid) {
      console.warn(`[place-order:${requestId}] FAIL: coupon "${couponCode}" rejected — ${result.reason}`);
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    coupon = { code: result.code, discountType: result.discountType, amount: result.amount };
  }
  const couponDiscount = roundCurrency(computeCouponDiscount(postBogoSubtotal, coupon));
  const postCouponSubtotal = subtotal - couponDiscount;

  // Volume discount occupies the same pipeline slot as a coupon — mutually
  // exclusive with it (computeVolumeDiscount returns 0 whenever a coupon is
  // present), and with BOGO. discountedSubtotal is the "compounding" base
  // confirmed for both the free-shipping threshold check and the
  // payment-method discount calculation.
  const volumeDiscount = bogoActive ? 0 : roundCurrency(computeVolumeDiscount(subtotal, !!coupon));
  const discountedSubtotal = postCouponSubtotal - volumeDiscount - bogoDiscount;

  // ── 3. Shipping — cost comes from WC; instance_id must be a real, currently
  //      valid method for this cart, not merely well-formed ─────────────────
  let shippingOptions;
  try {
    shippingOptions = (await fetchShippingOptions(discountedSubtotal, !!coupon)).methods;
  } catch (err) {
    console.error(`[place-order:${requestId}] FAIL: could not load shipping options`, err);
    return NextResponse.json({ error: "Could not load shipping options" }, { status: 502 });
  }
  const shippingMatch = shippingOptions.find((o) => o.instanceId === shippingInstanceId);
  if (!shippingMatch) {
    console.warn(`[place-order:${requestId}] FAIL: shippingInstanceId "${shippingInstanceId}" is not a valid method for this order`);
    return NextResponse.json({ error: "Selected shipping method is no longer available. Please choose again." }, { status: 400 });
  }
  const shippingCost = shippingMatch.cost; // already reflects the free-Ground-over-threshold override

  // ── 4. Payment-method discount — percentage comes from our own catalog ────
  const paymentDiscountAmount = bogoActive ? 0 : roundCurrency(discountedSubtotal * (methodMeta.discountPercent / 100));

  // ── 5. Tax ──────────────────────────────────────────────────────────────────
  let taxRate = 0;
  let shippingTaxable = false;
  try {
    const taxInfo = await taxRatePromise;
    taxRate = taxInfo.rate;
    shippingTaxable = taxInfo.shippingTaxable;
  } catch (err) {
    console.error(`[place-order:${requestId}] FAIL: could not load tax rate`, err);
    return NextResponse.json({ error: "Could not load tax rate" }, { status: 502 });
  }
  // Product lines are taxed at their raw amount — the coupon is no longer
  // apportioned across them (see the coupon note above: it's a fee line
  // now, not routed through WC's own coupon-on-line-items mechanism), so
  // it's taxed the same way as every other fee (BOGO, Volume Discount,
  // payment-method): its own entry in feeAmounts, rounded independently.
  // Mathematically equivalent to reducing the product-line base by the same
  // amount (verified: base*rate - X*rate either way) — just consistent with
  // how every other discount here is now modeled. Each product line is
  // still taxed and rounded independently, not as one combined subtotal —
  // see computeTax's docstring re: the TOTAL_MISMATCH on order #1113.
  const productLineAmounts = resolvedItems.map((item) => item.lineTotal);
  const tax = computeTax(
    taxRate,
    productLineAmounts,
    [volumeDiscount, paymentDiscountAmount, couponDiscount, ...bogoLineDiscounts.map((d) => d.discount)],
    shippingCost,
    shippingTaxable
  );
  const expectedTotal = roundCurrency(postCouponSubtotal - volumeDiscount - paymentDiscountAmount - bogoDiscount + shippingCost + tax.totalTax);

  console.log(`[place-order:${requestId}] Method: ${paymentMethodId} | subtotal:${subtotal} couponDiscount:${couponDiscount} volumeDiscount:${volumeDiscount} bogoDiscount:${bogoDiscount} paymentDiscount:${paymentDiscountAmount} shipping:${shippingCost} taxRate:${taxRate} totalTax:${tax.totalTax} expectedTotal:${expectedTotal}`);

  // ── 6. Zelle cap, enforced server-side ─────────────────────────────────────
  if (paymentMethodId === "zelle" && expectedTotal > PAYMENT_CONFIG.zelle.maxOrder) {
    console.warn(`[place-order:${requestId}] FAIL: Zelle order ${expectedTotal} exceeds cap ${PAYMENT_CONFIG.zelle.maxOrder}`);
    return NextResponse.json({
      error: `Zelle is not available above $${PAYMENT_CONFIG.zelle.maxOrder}. Contact support@anvilcompounds.shop for orders over $${PAYMENT_CONFIG.zelle.maxOrder}.`,
    }, { status: 400 });
  }

  // ── PART C: client/server agreement check — never silently use either
  //    number without telling the customer ───────────────────────────────────
  if (typeof client_total_cents === "number") {
    const serverTotalCents = Math.round(expectedTotal * 100);
    if (serverTotalCents !== client_total_cents) {
      console.warn(`[place-order:${requestId}] CART CHANGED — client:${client_total_cents} server:${serverTotalCents} — order NOT created`);
      return NextResponse.json({
        error: "CART_CHANGED",
        message: "Your cart has changed, please review.",
        clientTotal: client_total_cents / 100,
        serverTotal: expectedTotal,
      }, { status: 409 });
    }
  }

  const url = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!url || !key || !secret) {
    console.error(`[place-order:${requestId}] FAIL: missing WC env vars`);
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const lineItems = [
    ...resolvedItems.map((item) => ({
      product_id: item.productId,
      ...(item.variationId ? { variation_id: item.variationId } : {}),
      quantity: item.quantity,
      subtotal: item.lineTotal.toFixed(2),
      total: item.lineTotal.toFixed(2),
    })),
    // Free gift bundled with every order for the launch promo — a real line
    // item (not just a fee) so it appears on the packing slip for fulfillment.
    ...(BOGO_ENABLED
      ? [{
          product_id: FREE_GIFT_PRODUCT_ID,
          variation_id: FREE_GIFT_VARIATION_ID,
          quantity: 1,
          subtotal: "0.00",
          total: "0.00",
          meta_data: [{ key: "_anvil_free_gift", value: "yes" }],
        }]
      : []),
  ];

  const feeLines = [
    ...(volumeDiscount > 0
      ? [{
          name: VOLUME_DISCOUNT_LABEL,
          total: (-volumeDiscount).toFixed(2),
          tax_status: "none",
        }]
      : []),
    // One fee line per qualifying SKU (not one combined line) — matches
    // how WooCommerce actually taxes/rounds each fee independently.
    ...bogoLineDiscounts.map(({ item, discount }) => ({
      name: `${BOGO_LABEL} — ${item.name}`,
      total: (-discount).toFixed(2),
      tax_status: "none",
    })),
    // Coupon, as its own fee line — see the note above on why this isn't
    // sent via coupon_lines.
    ...(coupon && couponDiscount > 0
      ? [{
          name: `Coupon (${coupon.code})`,
          total: (-couponDiscount).toFixed(2),
          tax_status: "none",
        }]
      : []),
    ...(paymentDiscountAmount > 0
      ? [{
          name: `Payment method discount (${methodMeta.label})`,
          total: (-paymentDiscountAmount).toFixed(2),
          tax_status: "none",
        }]
      : []),
  ];

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
      method_id: shippingMatch.methodId,
      method_title: shippingMatch.title,
      instance_id: shippingMatch.instanceId,
      total: shippingCost.toFixed(2),
    }],
    // No coupon_lines — see the coupon note above. WC's own usage_count for
    // the coupon won't increment as a result (we're not going through its
    // native coupon-application path); _anvil_coupon_applied meta below is
    // the substitute record for Ken's own visibility into how often it's
    // actually used.
    fee_lines: feeLines,
    meta_data: [
      { key: "anvil_payment_method", value: paymentMethodId },
      // customer_ip_address is read-only via the WC REST API (confirmed: an
      // explicit value on create/update is silently dropped) — stored as meta
      // instead so lib/bankful.ts's remote_ip field has something real to read.
      { key: "_headless_customer_ip", value: ip },
      { key: "_ruo_confirmed", value: ruoConfirmed ? "yes" : "no" },
      { key: "_ruo_confirmed_at", value: new Date().toISOString() },
      ...(coupon ? [{ key: "_anvil_coupon_applied", value: coupon.code }] : []),
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

  // ── CRITICAL: verify WC's total matches what we independently computed ────
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
