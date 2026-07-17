import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MarqueeBar from "@/components/MarqueeBar";
import CatalogTeaser from "@/components/CatalogTeaser";
import HowWeTestSection from "@/components/HowWeTestSection";
import TrustSection from "@/components/TrustSection";
import Footer from "@/components/Footer";
import { getProducts } from "@/lib/woocommerce";

// The lowest-scrutiny, non-GLP compounds -- shown unverified as a catalog
// preview. Everything else (pricing, the rest of the catalog, GLP-1
// analogs) stays behind the gate.
const PREVIEW_NAMES = ["NAD+", "5-Amino-1MQ", "MOTS-c", "GHK-Cu", "Semax"];

export default async function Home() {
  const products = await getProducts().catch(() => []);
  const previewProducts = PREVIEW_NAMES.map((name) =>
    products.find((p) => p.name === name)
  ).filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <main>
      <Navbar />
      <HeroSection />
      <MarqueeBar />
      <CatalogTeaser previewProducts={previewProducts} totalCount={products.length} />
      <HowWeTestSection />
      <TrustSection />
      <Footer />
    </main>
  );
}
