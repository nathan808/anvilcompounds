import AddToCartButton from "@/app/products/[slug]/AddToCartButton";
import ShippingBanner from "@/components/ShippingBanner";
import ProductImageGallery from "@/components/ProductImageGallery";
import ViewCoaButton from "@/components/ViewCoaButton";
import SdsPreviewButton from "@/components/SdsPreviewButton";
import PurchaseFooter from "@/components/PurchaseFooter";
import { ProductCard as CatalogProductCard } from "@/components/ProductsSection";
import { getProductDisplayTitle } from "@/lib/productTitle";
import { PRODUCT_MECHANISMS } from "@/lib/productMechanisms";
import type { ProductCard } from "@/lib/woocommerce";

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
  hasCoa: boolean;

  propertiesTable: { label: string; value: string }[];

  shippingType: "standard" | "ambient";

  relatedProducts: ProductCard[];
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

// Renders a compound's pathway schematic as boxes + arrows: a root node
// branching out to each researched node, each pointing to its outcome
// label. Structure/labels are transcribed per-product from the compound's
// SDS (see lib/productMechanisms.ts) — shape intentionally differs by
// product rather than being forced into one fixed layout.
function MechanismDiagram({
  root,
  branches,
}: {
  root: string;
  branches: { node: string; outcome: string }[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-800/40 p-5 md:p-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="shrink-0 md:self-stretch flex items-center">
          <div className="px-4 py-3 rounded-lg bg-navy-950 border border-blue-500/30 text-center md:min-w-[140px]">
            <span className="font-display font-700 text-white text-sm leading-tight">{root}</span>
          </div>
        </div>

        <div className="hidden md:block w-5 h-px bg-blue-600/40 shrink-0" />

        <div className="flex-grow space-y-2.5">
          {branches.map((b, i) => (
            <div key={i} className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-blue-300">
                {b.node}
              </span>
              <span className="text-blue-500/50">→</span>
              <span className="font-mono text-xs text-white/50">{b.outcome}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Slot "02" — a compound's studied mechanisms/pathways, transcribed from
// its SDS. Falls back to the legacy Research Applications list for the
// handful of products (multi-peptide blends, reconstitution solvent) whose
// SDS has no unified mechanism narrative to draw from — see
// lib/productMechanisms.ts for exactly which products and why.
function MechanismsBlock({ product }: { product: ProductPageData }) {
  const mechanism = PRODUCT_MECHANISMS[product.slug];

  if (mechanism) {
    return (
      <InfoBlock number="02" label={mechanism.sectionTitle}>
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <p className="font-body text-white/60 leading-relaxed">{mechanism.intro}</p>

          <ul className="space-y-4">
            {mechanism.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                <p className="font-body text-white/65 leading-relaxed">
                  <span className="font-display font-700 text-white">{b.title}.</span>{" "}
                  {b.description}
                </p>
              </li>
            ))}
          </ul>

          <MechanismDiagram root={mechanism.diagram.root} branches={mechanism.diagram.branches} />

          <p className="font-mono text-xs text-white/30 leading-relaxed">{mechanism.caption}</p>
        </div>
      </InfoBlock>
    );
  }

  return (
    <InfoBlock number="02" label="Research Applications">
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
  );
}

// ─── Main template ─────────────────────────────────────────────────────────────

export default function ProductPageTemplate({
  product,
}: {
  product: ProductPageData;
}) {
  const hasCoa = product.hasCoa;

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
              SDS moved under the shipping card. Image column uses the
              "bleed" variant (borderless, fills column height) to reuse
              FeaturedSpotlight's visual language per the homepage
              integration brief. ── */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-12 xl:gap-20 items-stretch">

            {/* Left — product image + shipping banner + SDS preview */}
            <div className="flex flex-col gap-5">
              <div className="flex-1 min-h-0">
                <ProductImageGallery
                  productImage={product.image}
                  productName={product.name}
                  coaImage={product.documentationImage}
                  variant="bleed"
                />
              </div>
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

      {/* ── SECTIONS 1-4 — Combined info block ────────────────────────────
          One continuous section instead of stacked ones: every block
          shares the same bg-navy-950, so separate py-16 wrappers per block
          only added dead space between them. space-y-14 below keeps clear
          separation without it. ── */}
      <section className="bg-navy-950 py-16">
        <div className="max-w-5xl mx-auto px-6 space-y-14">

          <InfoBlock number="01" label="What it is">
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

          <MechanismsBlock product={product} />

          <InfoBlock number="03" label="Properties">
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
              legitimate in vitro laboratory research purposes only, not for human
              or veterinary injection or therapeutic use. Anvil Compounds is not a
              pharmacy or compounding facility.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION — Related compounds ──────────────────────────────────── */}
      {product.relatedProducts.length > 0 && (
        <Section>
          <SectionLabel number="04" label="Related Compounds" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {product.relatedProducts.map((rel, i) => (
              <CatalogProductCard key={rel.id} product={rel} index={i} />
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
