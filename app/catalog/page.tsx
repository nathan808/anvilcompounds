import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import ProductsSection from "@/components/ProductsSection";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Research Catalog — Anvil Compounds",
  robots: { index: false, follow: false },
};

export default function CatalogPage() {
  return (
    <main className="bg-navy-950 min-h-screen">
      <Navbar />
      <Suspense fallback={null}>
        <ProductsSection />
      </Suspense>
      <Footer />
    </main>
  );
}
