import { NextRequest, NextResponse } from "next/server";
import { recordCheckoutStarted } from "@/lib/abandonedCheckout";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: string;
      cartItems?: { name: string; size: string; quantity: number; price: number }[];
      subtotal?: number;
      timestamp?: string;
    };

    await recordCheckoutStarted({
      email: body.email ?? "",
      cartItems: body.cartItems ?? [],
      subtotal: body.subtotal ?? 0,
      timestamp: body.timestamp ?? new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Never block checkout on abandonment-capture failures
    return NextResponse.json({ ok: false });
  }
}
