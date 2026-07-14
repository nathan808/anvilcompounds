import { NextRequest, NextResponse } from "next/server";

interface WcZone { id: number; name: string }
interface WcZoneLocation { code: string; type: string }
interface WcShippingMethod {
  method_id: string;
  instance_id: number;
  enabled: boolean;
  settings: Record<string, { value: string }>;
}

const DELIVERY_ESTIMATES: Record<string, string> = {
  ground: "2-3 business days",
  "2day": "2 business days",
  overnight: "Next business day",
};

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function GET(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 8).toUpperCase();

  const url = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  if (!url || !key || !secret) {
    console.error(`[shipping:${requestId}] FAIL: missing WC env vars`);
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const subtotal = parseFloat(req.nextUrl.searchParams.get("subtotal") ?? "0") || 0;
  const hasCoupon = req.nextUrl.searchParams.get("hasCoupon") === "true";

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const headers = { Authorization: `Basic ${auth}` };

  try {
    // ── 1. Find whichever zone covers US — never hardcode a zone id ────────
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

    if (usZoneId === null) {
      console.error(`[shipping:${requestId}] FAIL: no shipping zone covers US`);
      return NextResponse.json({ error: "No shipping zone configured for US" }, { status: 500 });
    }

    // ── 2. Fetch that zone's methods ────────────────────────────────────────
    const methodsRes = await fetch(`${url}/wp-json/wc/v3/shipping/zones/${usZoneId}/methods`, { headers });
    if (!methodsRes.ok) throw new Error(`methods fetch failed: ${methodsRes.status}`);
    const methods = (await methodsRes.json()) as WcShippingMethod[];

    const flatRates = methods.filter((m) => m.method_id === "flat_rate" && m.enabled);
    const freeShipping = methods.find((m) => m.method_id === "free_shipping" && m.enabled);

    // ── 3. Free-shipping eligibility, driven entirely by WC's own settings ─
    let freeEligible = false;
    if (freeShipping) {
      const requires = freeShipping.settings.requires?.value ?? "";
      const minAmount = parseFloat(freeShipping.settings.min_amount?.value ?? "0") || 0;
      const meetsMin = subtotal >= minAmount;
      switch (requires) {
        case "min_amount": freeEligible = meetsMin; break;
        case "coupon": freeEligible = hasCoupon; break;
        case "either": freeEligible = meetsMin || hasCoupon; break;
        case "both": freeEligible = meetsMin && hasCoupon; break;
        default: freeEligible = true;
      }
    }

    // ── 4. Build options — free shipping only ever zeroes out "Ground" ─────
    const wcOptions = flatRates.map((m) => {
      const title = m.settings.title?.value ?? "Shipping";
      const cost = parseFloat(m.settings.cost?.value ?? "0") || 0;
      const isGround = normalizeTitle(title) === "ground";
      const free = freeEligible && isGround;

      return {
        methodId: m.method_id,
        instanceId: m.instance_id,
        title,
        cost: free ? 0 : cost,
        originalCost: free ? cost : null,
        estimate: DELIVERY_ESTIMATES[normalizeTitle(title)] ?? "",
      };
    });

    return NextResponse.json({ methods: wcOptions });
  } catch (err) {
    console.error(`[shipping:${requestId}] FAIL:`, err);
    return NextResponse.json({ error: "Could not load shipping methods" }, { status: 502 });
  }
}
