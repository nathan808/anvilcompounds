interface WcZone { id: number; name: string }
interface WcZoneLocation { code: string; type: string }
interface WcShippingMethod {
  method_id: string;
  instance_id: number;
  enabled: boolean;
  settings: Record<string, { value: string }>;
}

export interface ShippingOption {
  methodId: string;
  instanceId: string; // stringified — WC's shipping_lines API requires a string
  title: string;
  cost: number;
  originalCost: number | null;
  estimate: string;
}

const DELIVERY_ESTIMATES: Record<string, string> = {
  ground: "2-3 business days",
  "2day": "2 business days",
  overnight: "Next business day",
};

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Single source of truth for "what shipping options exist and what do they
// cost right now" — used both to list options for display and to validate/
// price whatever instance_id the client submits at order-creation time.
// Never hardcodes a zone id, a rate, or the free-shipping threshold; all of
// it is read live from WooCommerce.
export async function fetchShippingOptions(postCouponSubtotal: number, hasCoupon: boolean): Promise<ShippingOption[]> {
  const url = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!url || !key || !secret) throw new Error("WC env vars not configured");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const headers = { Authorization: `Basic ${auth}` };

  const zonesRes = await fetch(`${url}/wp-json/wc/v3/shipping/zones`, { headers });
  if (!zonesRes.ok) throw new Error(`zones fetch failed: ${zonesRes.status}`);
  const zones = (await zonesRes.json()) as WcZone[];

  let usZoneId: number | null = null;
  for (const zone of zones) {
    const locRes = await fetch(`${url}/wp-json/wc/v3/shipping/zones/${zone.id}/locations`, { headers });
    if (!locRes.ok) continue;
    const locations = (await locRes.json()) as WcZoneLocation[];
    if (locations.some((l) => l.type === "country" && l.code === "US")) {
      usZoneId = zone.id;
      break;
    }
  }

  if (usZoneId === null) throw new Error("No shipping zone configured for US");

  const methodsRes = await fetch(`${url}/wp-json/wc/v3/shipping/zones/${usZoneId}/methods`, { headers });
  if (!methodsRes.ok) throw new Error(`methods fetch failed: ${methodsRes.status}`);
  const methods = (await methodsRes.json()) as WcShippingMethod[];

  const flatRates = methods.filter((m) => m.method_id === "flat_rate" && m.enabled);
  const freeShipping = methods.find((m) => m.method_id === "free_shipping" && m.enabled);

  let freeEligible = false;
  if (freeShipping) {
    const requires = freeShipping.settings.requires?.value ?? "";
    const minAmount = parseFloat(freeShipping.settings.min_amount?.value ?? "0") || 0;
    const meetsMin = postCouponSubtotal >= minAmount;
    switch (requires) {
      case "min_amount": freeEligible = meetsMin; break;
      case "coupon": freeEligible = hasCoupon; break;
      case "either": freeEligible = meetsMin || hasCoupon; break;
      case "both": freeEligible = meetsMin && hasCoupon; break;
      default: freeEligible = true;
    }
  }

  return flatRates.map((m) => {
    const title = m.settings.title?.value ?? "Shipping";
    const cost = parseFloat(m.settings.cost?.value ?? "0") || 0;
    const isGround = normalizeTitle(title) === "ground";
    const free = freeEligible && isGround;

    return {
      methodId: m.method_id,
      instanceId: String(m.instance_id),
      title,
      cost: free ? 0 : cost,
      originalCost: free ? cost : null,
      estimate: DELIVERY_ESTIMATES[normalizeTitle(title)] ?? "",
    };
  });
}
