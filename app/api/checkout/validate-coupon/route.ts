import { NextRequest, NextResponse } from "next/server";

interface WcCoupon {
  code: string;
  status: string;
  discount_type: string;
  amount: string;
  date_expires: string | null;
  usage_limit: number | null;
  usage_count: number;
  minimum_amount: string;
  maximum_amount: string;
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8).toUpperCase();

  let body: { code?: string; subtotal?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, reason: "Invalid request" }, { status: 400 });
  }

  const code = (body.code ?? "").trim().toLowerCase();
  const subtotal = typeof body.subtotal === "number" ? body.subtotal : 0;

  if (!code) {
    return NextResponse.json({ valid: false, reason: "Enter a coupon code" });
  }

  const url = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  if (!url || !key || !secret) {
    console.error(`[coupon:${requestId}] FAIL: missing WC env vars`);
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  let wcRes: Response;
  try {
    wcRes = await fetch(
      `${url}/wp-json/wc/v3/coupons?code=${encodeURIComponent(code)}&per_page=1`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
  } catch (err) {
    console.error(`[coupon:${requestId}] FAIL: network error reaching WooCommerce`, err);
    return NextResponse.json({ error: "Could not reach WooCommerce" }, { status: 502 });
  }

  if (!wcRes.ok) {
    console.error(`[coupon:${requestId}] FAIL: WC returned ${wcRes.status}`);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }

  const coupons = (await wcRes.json()) as WcCoupon[];
  const coupon = coupons.find((c) => c.status === "publish");

  if (!coupon) {
    return NextResponse.json({ valid: false, reason: "Coupon code not found" });
  }

  if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
    return NextResponse.json({ valid: false, reason: "This coupon has expired" });
  }

  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return NextResponse.json({ valid: false, reason: "This coupon has reached its usage limit" });
  }

  const minAmount = parseFloat(coupon.minimum_amount || "0");
  if (minAmount > 0 && subtotal < minAmount) {
    return NextResponse.json({
      valid: false,
      reason: `This coupon requires a minimum order of $${minAmount.toFixed(2)}`,
    });
  }

  const maxAmount = parseFloat(coupon.maximum_amount || "0");
  if (maxAmount > 0 && subtotal > maxAmount) {
    return NextResponse.json({
      valid: false,
      reason: `This coupon applies to orders up to $${maxAmount.toFixed(2)}`,
    });
  }

  if (coupon.discount_type !== "percent" && coupon.discount_type !== "fixed_cart") {
    return NextResponse.json({
      valid: false,
      reason: "This coupon type isn't supported at checkout yet — contact support",
    });
  }

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    discountType: coupon.discount_type as "percent" | "fixed_cart",
    amount: parseFloat(coupon.amount || "0"),
  });
}
