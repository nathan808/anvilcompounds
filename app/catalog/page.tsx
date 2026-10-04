import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import ProductsSection from "@/components/ProductsSection";
import Footer from "@/components/Footer";
import { getProducts } from "@/lib/woocommerce";

export const metadata = {
  title: "Research Catalog — Anvil Compounds",
  robots: { index: false, follow: false },
};

// Products are fetched here, on the server, and cached for 60s (same window
// as the underlying WC fetch cache), so visitors get the catalog with the
// page instead of waiting on a client-side round-trip to WooCommerce.
export const revalidate = 60;

export default async function CatalogPage() {
  const products = await getProducts().catch(() => undefined);
  return (
    <main className="bg-mock-page min-h-screen">
      <Navbar />
      <Suspense fallback={null}>
        <ProductsSection initialProducts={products} />
      </Suspense>
      <Footer />
    </main>
  );
}
