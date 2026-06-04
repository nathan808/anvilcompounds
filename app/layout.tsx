import type { Metadata } from "next";
import { Syne, DM_Sans, DM_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/lib/cartContext";
import { AuthProvider } from "@/lib/authContext";
import AgeGate from "@/components/AgeGate";
import BackToTop from "@/components/BackToTop";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anvil Compounds — Independently Verified. Every Batch.",
  description:
    "Research-grade peptides independently tested to 99%+ purity. Triple verification: HPLC, Mass Spectrometry & Endotoxin Screening. Ships same day from Southern California.",
  keywords: "research peptides, BPC-157, Semaglutide, Tirzepatide, research compounds, HPLC tested peptides",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-theme="light">
      <body className={`${syne.variable} ${dmSans.variable} ${dmMono.variable} font-body`}>
        <AuthProvider>
          <CartProvider>
            <AgeGate />
            {children}
            <BackToTop />
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
