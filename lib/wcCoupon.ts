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

export type CouponResult =
  | { valid: true; code: string; discountType: "percent" | "fixed_cart"; amount: number }
  | { valid: false; reason: string };

// Single source of truth for coupon validation — used both for live UI
// feedback (validate-coupon route) and authoritative order-creation math
// (place-order route). Never trusts a client-supplied discountType/amount.
export async function validateCoupon(rawCode: string, subtotal: number): Promise<CouponResult> {
  const code = rawCode.trim().toLowerCase();
  if (!code) return { valid: false, reason: "Enter a coupon code" };

  const url = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!url || !key || !secret) throw new Error("WC env vars not configured");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(
    `${url}/wp-json/wc/v3/coupons?code=${encodeURIComponent(code)}&per_page=1`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!res.ok) throw new Error(`WC coupons fetch failed: ${res.status}`);

  const coupons = (await res.json()) as WcCoupon[];
  const coupon = coupons.find((c) => c.status === "publish");

  if (!coupon) return { valid: false, reason: "Coupon code not found" };

  if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
    return { valid: false, reason: "This coupon has expired" };
  }

  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, reason: "This coupon has reached its usage limit" };
  }

  const minAmount = parseFloat(coupon.minimum_amount || "0");
  if (minAmount > 0 && subtotal < minAmount) {
    return { valid: false, reason: `This coupon requires a minimum order of $${minAmount.toFixed(2)}` };
  }

  const maxAmount = parseFloat(coupon.maximum_amount || "0");
  if (maxAmount > 0 && subtotal > maxAmount) {
    return { valid: false, reason: `This coupon applies to orders up to $${maxAmount.toFixed(2)}` };
  }

  if (coupon.discount_type !== "percent" && coupon.discount_type !== "fixed_cart") {
    return { valid: false, reason: "This coupon type isn't supported at checkout yet — contact support" };
  }

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discount_type,
    amount: parseFloat(coupon.amount || "0"),
  };
}
