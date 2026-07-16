import PaymentMethodsBar from "@/components/PaymentMethodsBar";

// Payment methods + RUO line, broken out of AddToCartButton so the mobile
// product-page layout can place it after the shipping card instead of
// bundled right under the buy buttons (see ProductPageTemplate.tsx).
export default function PurchaseFooter() {
  return (
    <div className="space-y-4">
      <PaymentMethodsBar />
      <p className="text-center font-mono text-[10px] text-white/20 tracking-wide">
        RUO only · Not for human or veterinary use · 21+ required
      </p>
    </div>
  );
}
