"use client";

import { useState } from "react";
import AddToCartButton from "@/app/products/[slug]/AddToCartButton";
import ShippingBanner from "@/components/ShippingBanner";
import ProductImageGallery from "@/components/ProductImageGallery";
import ViewCoaButton from "@/components/ViewCoaButton";
import SdsPreviewButton from "@/components/SdsPreviewButton";
import PurchaseFooter from "@/components/PurchaseFooter";
import { getProductDisplayTitle } from "@/lib/productTitle";
import type { ProductPageData } from "@/components/ProductPageTemplate";

// Owns the selected-size index so the product photo and COA button (siblings
// of AddToCartButton, not children of it) switch in step with whichever size
// the shopper picks — e.g. GLP-RT/GLP-TRZ show a different vial photo and a
// different COA PDF for 10mg vs 20mg. Extracted out of ProductPageTemplate
// (a server component) specifically to hold this client-side state.
export default function ProductHero({ product }: { product: ProductPageData }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasCoa = product.hasCoa;

  const currentImage = product.sizesImages[selectedIndex] ?? product.image ?? null;
  const currentDocFile = product.sizesDocumentationFiles[selectedIndex] ?? product.documentationFile ?? null;

  return (
    <section className="bg-mock-page py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-6">

        {/* ── Mobile layout (< lg): category/disclaimer/name up top, buy
            buttons right under pricing so they're visible without
            scrolling, everything else (COA/SDS, shipping, payment info)
            pushed below. Renders its own AddToCartButton/ProductImageGallery
            instance (see note on the desktop block below). ── */}
        <div className="lg:hidden space-y-5">
          <nav className="font-mono text-xs text-mock-sub">
            <span>Catalog</span>
            <span className="mx-2 text-mock-sub/60">/</span>
            <span className="text-mock-cobaltInk/80">{product.category}</span>
          </nav>

          <div className="inline-block">
            <span className="font-mono text-[10px] text-mock-sub tracking-[0.18em] uppercase border border-mock-line rounded-full px-3 py-1">
              For laboratory and research use only
            </span>
          </div>

          <h1
            className="font-heading font-700 text-mock-navy leading-[1.05]"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
          >
            {getProductDisplayTitle(product.name, product.category)}
          </h1>

          <p className="font-mono text-xs text-mock-sub tracking-wider">
            {product.subtitle}
          </p>

          <ProductImageGallery
            productImage={currentImage}
            productName={product.name}
            coaImage={product.documentationImage}
          />

          <AddToCartButton
            slug={product.slug}
            name={product.name}
            sizes={product.sizes}
            sizesPrices={product.sizesPrices}
            sizesOriginalPrices={product.sizesOriginalPrices}
            priceNumber={product.priceNumber}
            wcProductId={product.wcProductId}
            hasCoa={hasCoa}
            showFooter={false}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
          />

          <div className="space-y-3">
            <ViewCoaButton
              productName={product.name}
              imageUrl={product.documentationImage}
              fileUrl={currentDocFile}
            />
            <SdsPreviewButton productName={product.name} fileUrl={product.sdsFile} />
          </div>

          <ShippingBanner theme="light" />

          <PurchaseFooter />
        </div>

        {/* ── Desktop layout (>= lg): image + shipping + SDS on the left,
            everything else in a sticky right column, as before except
            SDS moved under the shipping card. Image column uses the
            "bleed" variant (borderless, fills column height) to reuse
            FeaturedSpotlight's visual language per the homepage
            integration brief. Columns use items-start (not stretch) so a
            shorter left column doesn't get invisibly stretched to match a
            taller right column, which used to leave a dead gap under the
            image/shipping/SDS block. ── */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-12 xl:gap-20 items-start">

          {/* Left — product image + shipping banner + SDS preview */}
          <div className="flex flex-col gap-5">
            {/* Image wrapper sized to 80% and centered — shrinks the framed
                photo without cropping anything (aspect ratio is preserved,
                it just scales down); shipping banner/SDS button below stay
                full column width. */}
            <div className="w-[80%] mx-auto">
              <ProductImageGallery
                productImage={currentImage}
                productName={product.name}
                coaImage={product.documentationImage}
                variant="bleed"
              />
            </div>
            <ShippingBanner theme="light" />
            <SdsPreviewButton productName={product.name} fileUrl={product.sdsFile} />
          </div>

          {/* Right — buy column */}
          <div className="lg:sticky lg:top-24 space-y-5">
            {/* Breadcrumb */}
            <nav className="font-mono text-xs text-mock-sub">
              <span>Catalog</span>
              <span className="mx-2 text-mock-sub/60">/</span>
              <span className="text-mock-cobaltInk/80">{product.category}</span>
            </nav>

            {/* RUO pill */}
            <div className="inline-block">
              <span className="font-mono text-[10px] text-mock-sub tracking-[0.18em] uppercase border border-mock-line rounded-full px-3 py-1">
                For laboratory and research use only
              </span>
            </div>

            {/* Name */}
            <h1
              className="font-heading font-700 text-mock-navy leading-[1.05]"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
            >
              {getProductDisplayTitle(product.name, product.category)}
            </h1>

            {/* Subtitle */}
            <p className="font-mono text-xs text-mock-sub tracking-wider">
              {product.subtitle}
            </p>

            {/* View COA — above Add to Cart */}
            <ViewCoaButton
              productName={product.name}
              imageUrl={product.documentationImage}
              fileUrl={currentDocFile}
            />

            {/* Add to cart (renders its own payment-methods/RUO footer) */}
            <AddToCartButton
              slug={product.slug}
              name={product.name}
              sizes={product.sizes}
              sizesPrices={product.sizesPrices}
              sizesOriginalPrices={product.sizesOriginalPrices}
              priceNumber={product.priceNumber}
              wcProductId={product.wcProductId}
              hasCoa={hasCoa}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
            />

          </div>
        </div>
      </div>
    </section>
  );
}
