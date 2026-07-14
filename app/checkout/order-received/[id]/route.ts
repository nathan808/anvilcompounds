import { type NextRequest } from "next/server";

// After Bankful payment, WooCommerce redirects the customer's browser to
// anvilcompounds.shop/checkout/order-received/{id}/?key=...
// Hostinger proxies that to Vercel, so we catch it here and send the customer
// to the Anvil Compounds order-confirmation page instead.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const target = new URL(`/order-confirmation?order=${id}`, req.url);
  return Response.redirect(target.toString(), 302);
}
