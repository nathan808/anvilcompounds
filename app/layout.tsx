import type { Metadata } from "next";
import { Syne, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cartContext";

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
  title: "Anvil Compounds — Purity Proven. Not Promised.",
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
    <html lang="en" className="scroll-smooth">
      <body className={`${syne.variable} ${dmSans.variable} ${dmMono.variable} font-body`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
