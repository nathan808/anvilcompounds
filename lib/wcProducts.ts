import { getDiscountedPrice } from "@/lib/volumePricing";
import { roundCurrency } from "@/lib/taxMath";

interface WcVariation {
  id: number;
  price: string;
  regular_price: string;
  attributes: { name: string; option: string }[];
}

interface WcProduct {
  id: number;
  name: string;
  type: string;
  price: string;
  regular_price: string;
}

export interface ResolvedLineItem {
  productId: number;
  variationId: number | null;
  quantity: number;
  name: string;
  unitBasePrice: number; // WC's price for this product/variation, before volume discount
  unitPrice: number;     // after this codebase's own volume-discount tiers
  lineTotal: number;
}

// Fetches the product (and, for variable products, matches the requested size
// against WC's own variation attributes) directly from WooCommerce. The price
// never comes from the client — only productId/size/quantity do, and size is
// used purely as a selector into WC's live variation data, exactly the way
// AddToCartButton already reads sizes/sizesPrices from getProductPageData().
export async function resolveLineItem(
  productId: number,
  size: string,
  quantity: number
): Promise<ResolvedLineItem | null> {
  if (!Number.isInteger(productId) || productId <= 0) return null;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) return null;

  const url = process.env.WC_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!url || !key || !secret) throw new Error("WC env vars not configured");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const headers = { Authorization: `Basic ${auth}` };

  const productRes = await fetch(`${url}/wp-json/wc/v3/products/${productId}`, { headers });
  if (!productRes.ok) return null;
  const product: WcProduct = await productRes.json();

  let unitBasePrice = parseFloat(product.price || product.regular_price || "0");
  let variationId: number | null = null;

  if (product.type === "variable") {
    const varRes = await fetch(`${url}/wp-json/wc/v3/products/${productId}/variations?per_page=50`, { headers });
    if (varRes.ok) {
      const variations: WcVariation[] = await varRes.json();
      const match = variations.find((v) => v.attributes.some((a) => a.name === "Size" && a.option === size));
      if (match) {
        unitBasePrice = parseFloat(match.price || match.regular_price || String(unitBasePrice));
        variationId = match.id;
      }
      // No matching size (e.g. catalog quick-add's "Standard") falls back to
      // the parent product's own price — same fallback getProductPageData() uses.
    }
  }

  if (!unitBasePrice || unitBasePrice <= 0) return null;

  const unitPrice = getDiscountedPrice(unitBasePrice, quantity);
  return {
    productId,
    variationId,
    quantity,
    name: product.name,
    unitBasePrice,
    unitPrice,
    lineTotal: roundCurrency(unitPrice * quantity),
  };
}
