// RUO line, broken out of AddToCartButton so the mobile product-page layout
// can place it after the shipping card instead of bundled right under the
// buy buttons (see ProductPageTemplate.tsx). The payment-methods icon row
// that used to live here was removed from product pages; it still shows in
// the cart drawer (see components/CartDrawer.tsx).
export default function PurchaseFooter() {
  return (
    <p className="text-center font-mono text-[10px] text-mock-sub tracking-wide">
      RUO only · Not for human or veterinary use · 21+ required
    </p>
  );
}
