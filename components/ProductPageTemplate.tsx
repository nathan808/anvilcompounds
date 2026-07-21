import Link from "next/link";
import AddToCartButton from "@/app/products/[slug]/AddToCartButton";
import ShippingBanner from "@/components/ShippingBanner";
import ProductImageGallery from "@/components/ProductImageGallery";
import ViewCoaButton from "@/components/ViewCoaButton";
import SdsPreviewButton from "@/components/SdsPreviewButton";
import InlineCoaViewer from "@/components/InlineCoaViewer";
import PurchaseFooter from "@/components/PurchaseFooter";
import { getProductDisplayTitle } from "@/lib/productTitle";

// ─── Data interface ────────────────────────────────────────────────────────────

export interface ProductPageData {
  slug: string;
  name: string;
  category: string;
  subtitle: string;
  price: string;
  priceNumber: number;
  priceUnit: string;
  sizes: string[];
  sizesPrices: number[];
  wcProductId: number;
  image?: string | null;

  trustBadges: string[]; // exactly 4

  whatItIsSubtitle: string;
  whatItIsBody: string;

  compositionBody?: string;

  researchApplications: string[];

  documentationHeading: string;
  documentationMetrics: { label: string; value: string }[];
  documentationFile?: string | null;
  documentationImage?: string | null;
  documentationCaption?: string;
  sdsFile?: string | null;
  moleculeImage?: string | null;

  propertiesTable: { label: string; value: string }[];

  shippingType: "standard" | "ambient";

  relatedProducts: {
    slug: string;
    name: string;
    category: string;
    icon: string;
  }[];
}

// ─── Utility sub-components ────────────────────────────────────────────────────

function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-6 h-px bg-blue-600" />
      <span className="font-mono text-xs text-slate-400 tracking-[0.2em] uppercase">
        {number} / {label}
      </span>
    </div>
  );
}

// ─── Section wrappers ──────────────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-navy-950 py-16">
      <div className="max-w-5xl mx-auto px-6">{children}</div>
    </section>
  );
}

// A single content block within the combined info section below — no
// section/background of its own, just a label + body, so several of these
// can sit close together without the dead space that comes from each one
// being its own full-bleed section.
function InfoBlock({
  number,
  label,
  children,
}: {
  number: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SectionLabel number={number} label={label} />
      {children}
    </div>
  );
}

// Pairs a text card with the compound's molecular structure/sequence
// diagram (cropped from its SDS reference document) when one exists;
// falls back to the text card alone otherwise.
function WithMoleculeVisual({
  image,
  productName,
  children,
}: {
  image?: string | null;
  productName: string;
  children: React.ReactNode;
}) {
  if (!image) return <>{children}</>;
  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-5 items-start">
      {children}
      <div className="rounded-2xl overflow-hidden bg-white p-3 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={`${productName} molecular structure`}
          className="w-full h-auto rounded-lg"
        />
      </div>
    </div>
  );
}

// ─── Main template ─────────────────────────────────────────────────────────────

export default function ProductPageTemplate({
  product,
}: {
  product: ProductPageData;
}) {
  const hasCoa = !!product.documentationFile;

  return (
    <>
      {/* ── SECTION 1 — Hero header ───────────────────────────────────────── */}
      <section className="bg-navy-950 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">

          {/* ── Mobile layout (< lg): category/disclaimer/name up top, buy
              buttons right under pricing so they're visible without
              scrolling, everything else (COA/SDS, shipping, payment info)
              pushed below. Renders its own AddToCartButton/ProductImageGallery
              instance (see note on the desktop block below). ── */}
          <div className="lg:hidden space-y-5">
            <nav className="font-mono text-xs text-white/30">
              <span>Catalog</span>
              <span className="mx-2 text-white/20">/</span>
              <span className="text-slate-400/80">{product.category}</span>
            </nav>

            <div className="inline-block">
              <span className="font-mono text-[10px] text-white/35 tracking-[0.18em] uppercase border border-white/10 rounded-full px-3 py-1">
                For laboratory and research use only
              </span>
            </div>

            <h1
              className="font-display font-800 text-white leading-[1.05]"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
            >
              {getProductDisplayTitle(product.name, product.category)}
            </h1>

            <p className="font-mono text-xs text-slate-400 tracking-wider">
              {product.subtitle}
            </p>

            <ProductImageGallery
              productImage={product.image}
              productName={product.name}
              coaImage={product.documentationImage}
            />

            <AddToCartButton
              slug={product.slug}
              name={product.name}
              sizes={product.sizes}
              sizesPrices={product.sizesPrices}
              priceNumber={product.priceNumber}
              wcProductId={product.wcProductId}
              hasCoa={hasCoa}
              showFooter={false}
            />

            <div className="space-y-3">
              <ViewCoaButton
                productName={product.name}
                imageUrl={product.documentationImage}
                fileUrl={product.documentationFile}
              />
              <SdsPreviewButton productName={product.name} fileUrl={product.sdsFile} />
            </div>

            <ShippingBanner theme="dark" />

            <PurchaseFooter />
          </div>

          {/* ── Desktop layout (>= lg): image + shipping + SDS on the left,
              everything else in a sticky right column, as before except
              SDS moved under the shipping card. ── */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-12 xl:gap-20 items-start">

            {/* Left — product image + shipping banner + SDS preview */}
            <div className="space-y-5">
              <ProductImageGallery
                productImage={product.image}
                productName={product.name}
                coaImage={product.documentationImage}
              />
              <ShippingBanner theme="dark" />
              <SdsPreviewButton productName={product.name} fileUrl={product.sdsFile} />
            </div>

            {/* Right — buy column */}
            <div className="lg:sticky lg:top-24 space-y-5">
              {/* Breadcrumb */}
              <nav className="font-mono text-xs text-white/30">
                <span>Catalog</span>
                <span className="mx-2 text-white/20">/</span>
                <span className="text-slate-400/80">{product.category}</span>
              </nav>

              {/* RUO pill */}
              <div className="inline-block">
                <span className="font-mono text-[10px] text-white/35 tracking-[0.18em] uppercase border border-white/10 rounded-full px-3 py-1">
                  For laboratory and research use only
                </span>
              </div>

              {/* Name */}
              <h1
                className="font-display font-800 text-white leading-[1.05]"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
              >
                {getProductDisplayTitle(product.name, product.category)}
              </h1>

              {/* Subtitle */}
              <p className="font-mono text-xs text-slate-400 tracking-wider">
                {product.subtitle}
              </p>

              {/* View COA — above Add to Cart */}
              <ViewCoaButton
                productName={product.name}
                imageUrl={product.documentationImage}
                fileUrl={product.documentationFile}
              />

              {/* Add to cart (renders its own payment-methods/RUO footer) */}
              <AddToCartButton
                slug={product.slug}
                name={product.name}
                sizes={product.sizes}
                sizesPrices={product.sizesPrices}
                priceNumber={product.priceNumber}
                wcProductId={product.wcProductId}
                hasCoa={hasCoa}
              />

            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — Trust badges ──────────────────────────────────────── */}
      <section className="bg-navy-950 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {product.trustBadges.map((badge) => (
              <div
                key={badge}
                className="glass-card rounded-xl px-5 py-3 flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="font-mono text-xs text-white/60 tracking-wider">
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTIONS 3-7 — Combined info block ────────────────────────────
          One continuous section instead of five stacked ones: every block
          shares the same bg-navy-950, so separate py-16 wrappers per block
          only added dead space between them. space-y-14 below keeps clear
          separation without it. ── */}
      <section className="bg-navy-950 py-16">
        <div className="max-w-5xl mx-auto px-6 space-y-14">

          <InfoBlock number="01" label={product.documentationHeading}>
            {/* Metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {product.documentationMetrics.map((metric) => (
                <div key={metric.label} className="glass-card rounded-xl p-5">
                  <p className="font-mono text-[10px] text-white/35 tracking-widest uppercase">
                    {metric.label}
                  </p>
                  <p className="font-display font-700 text-white text-xl mt-1">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <InlineCoaViewer
              productName={product.name}
              imageUrl={product.documentationImage}
              fileUrl={product.documentationFile}
            />

            {product.documentationCaption && (
              <p className="font-mono text-xs text-white/30 mt-4">
                {product.documentationCaption}
              </p>
            )}
          </InfoBlock>

          <InfoBlock number="02" label="What it is">
            <WithMoleculeVisual
              image={!product.compositionBody ? product.moleculeImage : null}
              productName={product.name}
            >
              <div className="glass-card rounded-2xl p-8">
                <p className="font-display font-700 text-white text-xl mb-4">
                  {product.whatItIsSubtitle}
                </p>
                <p className="font-body text-white/60 leading-relaxed">
                  {product.whatItIsBody}
                </p>
              </div>
            </WithMoleculeVisual>
          </InfoBlock>

          {product.compositionBody && (
            <InfoBlock number="03" label="Composition">
              <WithMoleculeVisual image={product.moleculeImage} productName={product.name}>
                <div className="glass-card rounded-2xl p-8">
                  <p className="font-body text-white/60 leading-relaxed">
                    {product.compositionBody}
                  </p>
                </div>
              </WithMoleculeVisual>
            </InfoBlock>
          )}

          <InfoBlock number="04" label="Research Applications">
            <div className="glass-card rounded-2xl p-8">
              <ol className="space-y-5">
                {product.researchApplications.map((item, i) => (
                  <li key={i} className="flex items-start gap-5">
                    <span className="shrink-0 font-mono text-xs text-blue-600/60 w-6 pt-0.5 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="font-body text-white/65 leading-relaxed">{item}</p>
                  </li>
                ))}
              </ol>
            </div>
          </InfoBlock>

          <InfoBlock number="05" label="Properties">
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <tbody>
                  {product.propertiesTable.map((row, i) => (
                    <tr
                      key={row.label}
                      className={`border-b border-white/5 last:border-0 ${
                        i % 2 === 0 ? "bg-white/[0.02]" : ""
                      }`}
                    >
                      <td className="px-6 md:px-8 py-4 font-mono text-xs text-white/30 tracking-widest uppercase whitespace-nowrap align-top w-48">
                        {row.label}
                      </td>
                      <td className="px-6 md:px-8 py-4 font-body text-sm text-white/70 leading-relaxed">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </InfoBlock>

        </div>
      </section>

      {/* ── RUO disclaimer — tighter top spacing ─────────────────────────── */}
      <section className="bg-navy-950 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="glass-card rounded-2xl p-8 border-l-4 border-blue-600">
            <p className="font-body text-sm text-white/50 leading-relaxed">
              By completing your order you confirm all products are purchased for
              legitimate in vitro laboratory research purposes only — not for human
              or veterinary injection or therapeutic use. Anvil Compounds is not a
              pharmacy or compounding facility.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 8 — Related compounds ────────────────────────────────── */}
      {product.relatedProducts.length > 0 && (
        <Section>
          <SectionLabel number="06" label="Related Compounds" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {product.relatedProducts.map((rel) => (
              <Link
                key={rel.slug}
                href={`/products/${rel.slug}`}
                className="glass-card rounded-2xl p-6 flex flex-col gap-4 group transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/10 relative"
              >
                <span className="text-3xl text-blue-400/40">{rel.icon}</span>
                <div className="flex-grow">
                  <h3 className="font-display font-700 text-white text-lg group-hover:text-blue-300 transition-colors">
                    {rel.name}
                  </h3>
                  <p className="font-mono text-xs text-slate-400/70 tracking-wider mt-1">
                    {rel.category}
                  </p>
                </div>
                <span className="absolute bottom-5 right-5 text-white/30 group-hover:text-blue-400 transition-colors font-body text-base">
                  →
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ── Footer compliance ─────────────────────────────────────────────── */}
      <section className="bg-navy-950 border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="font-mono text-[10px] text-white/20 tracking-wide leading-relaxed">
            Anvil Compounds products are intended solely for laboratory and
            investigational use. We do not market, sell, or promote products for
            human or veterinary consumption, therapeutic use, or clinical
            application. Must be 21+ to purchase.
          </p>
        </div>
      </section>
    </>
  );
}
