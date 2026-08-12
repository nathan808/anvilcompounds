import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MarqueeBar from "@/components/MarqueeBar";
import CatalogTeaser from "@/components/CatalogTeaser";
import BundlesTeaser from "@/components/BundlesTeaser";
import FeaturedSpotlight from "@/components/FeaturedSpotlight";
import HowWeTestSection from "@/components/HowWeTestSection";
import TrustSection from "@/components/TrustSection";
import InsideEveryBatchSection from "@/components/InsideEveryBatchSection";
import OperationsSection from "@/components/OperationsSection";
import Footer from "@/components/Footer";
import { getProducts } from "@/lib/woocommerce";

// The 5 featured compounds shown unverified as a catalog preview on the
// homepage. Everything else (pricing, the rest of the catalog) stays
// behind the gate.
const PREVIEW_NAMES = ["AC3R", "BPC-157", "GHK-Cu", "TB-500", "KLOW"];
const BUNDLE_NAMES = ["Energy Research Bundle", "GHRH Bundle", "Metabolic Research Bundle", "Full Research Bundle", "Cognitive Research Bundle"];

export default async function Home() {
  const products = await getProducts().catch(() => []);
  const previewProducts = PREVIEW_NAMES.map((name) =>
    products.find((p) => p.name === name)
  ).filter((p): p is NonNullable<typeof p> => p !== undefined);
  const bundleProducts = BUNDLE_NAMES.map((name) =>
    products.find((p) => p.name === name)
  ).filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <main>
      <Navbar />
      <HeroSection />
      <MarqueeBar />
      <CatalogTeaser previewProducts={previewProducts} totalCount={products.length} />
      <BundlesTeaser bundles={bundleProducts} />
      <FeaturedSpotlight />
      <OperationsSection />
      <HowWeTestSection />
      <TrustSection />
      <InsideEveryBatchSection />
      <Footer />
    </main>
  );
}
