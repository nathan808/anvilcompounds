import { NextRequest, NextResponse } from "next/server";
import { createPaymentLink, BankfulError, BankfulMethodId } from "@/lib/bankful";

const VALID_METHODS: BankfulMethodId[] = ["ethereum", "echeck"];

export async function POST(req: NextRequest) {
  let body: { orderId?: number; orderKey?: string; method?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { orderId, orderKey, method } = body;

  if (!orderId || !orderKey || !method || !VALID_METHODS.includes(method as BankfulMethodId)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await createPaymentLink(orderId, orderKey, method as BankfulMethodId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof BankfulError) {
      if (err.code === "ORDER_KEY_MISMATCH") {
        // Same response as "doesn't exist" — never confirm/deny via error shape.
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (err.code === "ORDER_NOT_PAYABLE") {
        return NextResponse.json(
          { error: "This order has already been processed and cannot be paid again." },
          { status: 409 }
        );
      }
    }
    // Never include credential or upstream-detail content in the client response.
    console.error("[create-payment-link] FAIL:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Could not start payment right now. Please try again or contact support@anvilcompounds.shop" },
      { status: 502 }
    );
  }
}
