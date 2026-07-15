import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MarqueeBar from "@/components/MarqueeBar";
import ProductsSection from "@/components/ProductsSection";
import HowWeTestSection from "@/components/HowWeTestSection";
import TrustSection from "@/components/TrustSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <MarqueeBar />
      <Suspense fallback={null}>
        <ProductsSection />
      </Suspense>
      <HowWeTestSection />
      <TrustSection />
      <Footer />
    </main>
  );
}
