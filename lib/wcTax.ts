interface WcTaxRate {
  country: string;
  state: string;
  rate: string;
  shipping: boolean;
}

export interface TaxRateInfo {
  rate: number; // decimal, e.g. 0.0725 — never hardcode this, always read from WC
  shippingTaxable: boolean;
}

// Reads live tax rates from WooCommerce rather than hardcoding a rate/jurisdiction.
// Sums non-compound rates matching the given US state (or a blank/wildcard state
// row, which WC treats as applying to all states). This store has exactly one
// rate configured (CA, 7.25%); compound-tax stacking isn't handled since nothing
// here uses it yet.
export async function fetchTaxRate(state: string): Promise<TaxRateInfo> {
  const url = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!url || !key || !secret) throw new Error("WC env vars not configured");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${url}/wp-json/wc/v3/taxes?per_page=100`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`WC taxes fetch failed: ${res.status}`);

  const rates = (await res.json()) as WcTaxRate[];
  const matching = rates.filter((r) => r.country === "US" && (r.state === "" || r.state === state));

  const rate = matching.reduce((sum, r) => sum + parseFloat(r.rate) / 100, 0);
  const shippingTaxable = matching.some((r) => r.shipping);

  return { rate, shippingTaxable };
}
