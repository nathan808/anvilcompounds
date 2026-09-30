import { redirect } from "next/navigation";

// Checkout is one page now (app/checkout/page.tsx) — old step URLs
// (bookmarks, back button, stale tabs) land there instead.
export default function LegacyCheckoutStep() {
  redirect("/checkout");
}
