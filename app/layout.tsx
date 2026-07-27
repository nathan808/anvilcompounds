import type { Metadata } from "next";
import { Archivo, Inter, Space_Mono, Oswald } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/lib/cartContext";
import { AuthProvider } from "@/lib/authContext";
import { CheckoutProvider } from "@/lib/checkoutContext";
import BackToTop from "@/components/BackToTop";
import AgeGate from "@/components/AgeGate";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anvil Compounds — Independently Verified. Every Batch.",
  description:
    "Research-grade peptides independently tested to 99%+ purity. Triple verification: HPLC, Mass Spectrometry & Endotoxin Screening. Ships same day from Southern California.",
  keywords: "research peptides, BPC-157, GLP research compounds, HPLC tested peptides, reference materials",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-theme="light">
      <body className={`${archivo.variable} ${inter.variable} ${spaceMono.variable} ${oswald.variable} font-body`}>
        <AuthProvider>
          <CartProvider>
            <CheckoutProvider>
              <AgeGate />
              {children}
              <BackToTop />
            </CheckoutProvider>
          </CartProvider>
        </AuthProvider>
        {process.env.NEXT_PUBLIC_OMNISEND_BRAND_ID && (
          <Script
            id="omnisend-tracking"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.omnisend = window.omnisend || [];
                omnisend.push(["accountID", "${process.env.NEXT_PUBLIC_OMNISEND_BRAND_ID}"]);
                omnisend.push(["track", "$pageViewed"]);
                !function(){var e=document.createElement("script");e.type="text/javascript";e.async=true;e.src="https://omnisnippet1.com/inshop/launcher-v2.js";var t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)}();
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
