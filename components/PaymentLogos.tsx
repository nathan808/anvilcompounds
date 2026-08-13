// Licensed/provided artwork (public/images/payment-strip.png) — Visa,
// Mastercard, Amex, Discover, PayPal, Apple Pay, Google Pay. Replaces the
// earlier hand-drawn placeholder chips now that a real asset exists.
export function CardNetworkLogos({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/payment-strip.png"
      alt="Visa, Mastercard, American Express, Discover, PayPal, Apple Pay, Google Pay"
      className={`h-6 w-auto ${className}`}
    />
  );
}
