import { roundCurrency } from "@/lib/taxMath";

interface WcVariation {
  id: number;
  price: string;
  regular_price: string;
  attributes: { name: string; option: string }[];
  stock_status: string;
}

interface WcProduct {
  id: number;
  name: string;
  type: string;
  price: string;
  regular_price: string;
  stock_status: string;
}

export interface ResolvedLineItem {
  productId: number;
  variationId: number | null;
  quantity: number;
  name: string;
  unitPrice: number;     // WC's active price (regular_price minus any sale_price) — the "Single/non-B1G1" price
  regularPrice: number;  // WC's regular_price — the crossed-out "Base" price a B1G1 pair totals to (lib/bogoDiscount.ts)
  lineTotal: number;
  // stock_status of whichever WC object (variation, or parent for a simple/
  // no-size-match product) actually priced this line — e.g. GHK-Cu 50mg vs
  // 100mg only one of which may be in stock at a time.
  inStock: boolean;
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

  let unitPrice = parseFloat(product.price || product.regular_price || "0");
  let regularPrice = parseFloat(product.regular_price || product.price || "0");
  let variationId: number | null = null;
  let inStock = product.stock_status !== "outofstock";

  if (product.type === "variable") {
    const varRes = await fetch(`${url}/wp-json/wc/v3/products/${productId}/variations?per_page=50`, { headers });
    if (varRes.ok) {
      const variations: WcVariation[] = await varRes.json();
      const match = variations.find((v) => v.attributes.some((a) => a.name === "Size" && a.option === size));
      if (match) {
        unitPrice = parseFloat(match.price || match.regular_price || String(unitPrice));
        regularPrice = parseFloat(match.regular_price || match.price || String(regularPrice));
        variationId = match.id;
        inStock = match.stock_status !== "outofstock";
      }
      // No matching size (e.g. catalog quick-add's "Standard") falls back to
      // the parent product's own price/stock — same fallback getProductPageData() uses.
    }
  }

  if (!unitPrice || unitPrice <= 0) return null;

  return {
    productId,
    variationId,
    quantity,
    name: product.name,
    unitPrice,
    regularPrice,
    lineTotal: roundCurrency(unitPrice * quantity),
    inStock,
  };
}
