import type { Metadata } from "next";
import { Archivo, Inter, Space_Mono, Oswald, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/lib/cartContext";
import { AuthProvider } from "@/lib/authContext";
import { CheckoutProvider } from "@/lib/checkoutContext";
import BackToTop from "@/components/BackToTop";
import AgeGate from "@/components/AgeGate";
import BogoPopup from "@/components/BogoPopup";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
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

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["600", "700", "800", "900"],
  style: ["normal", "italic"],
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
      <body className={`${archivo.variable} ${inter.variable} ${spaceMono.variable} ${oswald.variable} ${playfairDisplay.variable} font-body`}>
        <AuthProvider>
          <CartProvider>
            <CheckoutProvider>
              <AgeGate />
              <BogoPopup />
              {children}
              <BackToTop />
            </CheckoutProvider>
          </CartProvider>
        </AuthProvider>
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <>
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                alt=""
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        )}
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
