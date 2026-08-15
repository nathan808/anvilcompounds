import { getProductPageData } from "@/lib/woocommerce";
import CartRestoreClient, { RestoreItem } from "./CartRestoreClient";

// Reconstructs a cart from a "slug:qty,slug:qty" query string — used for
// links sent in follow-up emails (e.g. a payment-failed retry) where we want
// the customer to land with their order already queued up instead of
// re-picking every item. Resolves against live WC data server-side so the
// email link never encodes a price — only slug + quantity — and can't go
// stale if pricing changes later.
export default async function CartRestorePage({
  searchParams,
}: {
  searchParams: { items?: string };
}) {
  const pairs = (searchParams.items ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const items: RestoreItem[] = [];
  for (const pair of pairs) {
    const [slug, qtyRaw] = pair.split(":");
    const qty = parseInt(qtyRaw, 10);
    if (!slug || !Number.isFinite(qty) || qty < 1) continue;

    const product = await getProductPageData(slug);
    if (!product) continue;

    items.push({
      slug: product.slug,
      name: product.name,
      size: product.sizes[0] ?? "Standard",
      basePrice: product.sizesPrices[0] ?? product.priceNumber,
      wcProductId: product.wcProductId,
      quantity: qty,
    });
  }

  return <CartRestoreClient items={items} />;
}
