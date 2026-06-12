import { NextResponse } from "next/server";
import { getProducts } from "@/lib/woocommerce";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("WooCommerce fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}
