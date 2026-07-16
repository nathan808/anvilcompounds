import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MarqueeBar from "@/components/MarqueeBar";
import CatalogTeaser from "@/components/CatalogTeaser";
import HowWeTestSection from "@/components/HowWeTestSection";
import TrustSection from "@/components/TrustSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <MarqueeBar />
      <CatalogTeaser />
      <HowWeTestSection />
      <TrustSection />
      <Footer />
    </main>
  );
}
