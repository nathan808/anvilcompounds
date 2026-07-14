export interface CheckoutStartedPayload {
  email: string;
  cartItems: { name: string; size: string; quantity: number; price: number }[];
  subtotal: number;
  timestamp: string;
}

// Single drop-in point: swap this body for an Omnisend (or other ESP) call
// once the abandoned-checkout flow is ready. Callers never need to change.
export async function recordCheckoutStarted(payload: CheckoutStartedPayload): Promise<void> {
  console.log("[checkout:started]", JSON.stringify(payload));
}
