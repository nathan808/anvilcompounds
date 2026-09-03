import ProductHero from "@/components/ProductHero";
import LoopVideo from "@/components/LoopVideo";
import ViewContentPixel from "@/components/ViewContentPixel";
import InfoBlock from "@/components/InfoBlock";
import ProductFaqBlock from "@/components/ProductFaqBlock";
import { ProductCard as CatalogProductCard } from "@/components/ProductsSection";
import { PRODUCT_MECHANISMS } from "@/lib/productMechanisms";
import type { ProductCard } from "@/lib/woocommerce";

// AC3R/AC2T's SDS-derived mechanism narrative reads as redundant next to
// their Properties table on those two specific product pages — everywhere
// else the Mechanisms block still renders normally.
const HIDE_MECHANISMS_SLUGS = new Set(["ac3r", "ac2t"]);

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
  sizesOriginalPrices: (number | null)[];
  // Per-size photo/COA, aligned index-for-index with `sizes`. Falls back to
  // `image`/`documentationFile` for any size without its own (see
  // getProductPageData in lib/woocommerce.ts) — always the same length as
  // `sizes`, so callers don't need to null-check per index.
  sizesImages: (string | null)[];
  sizesDocumentationFiles: (string | null)[];
  // Per-size stock_quantity, aligned index-for-index with `sizes` (see
  // sizesStock in lib/woocommerce.ts). null means stock isn't tracked for
  // that size — treated as "don't show a low-stock badge".
  sizesStock: (number | null)[];
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
  // false only for supply/accessory items that will never have a lab COA
  // (see NO_COA_REQUIRED_IDS in lib/woocommerce.ts) — hides the COA button
  // on the product page entirely instead of a perpetual "COA Pending" state.
  coaApplicable: boolean;

  propertiesTable: { label: string; value: string }[];

  shippingType: "standard" | "ambient";

  relatedProducts: ProductCard[];
}

// ─── Utility sub-components ────────────────────────────────────────────────────

function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-6 h-px bg-mock-cobalt" />
      <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.2em] uppercase">
        {number} / {label}
      </span>
    </div>
  );
}

// ─── Section wrappers ──────────────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-mock-page py-16">
      <div className="max-w-5xl mx-auto px-6">{children}</div>
    </section>
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
    <div className="rounded-xl border border-mock-line bg-mock-surface2 p-5 md:p-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="shrink-0 md:self-stretch flex items-center">
          <div className="px-4 py-3 rounded-lg bg-mock-cobalt border border-white/10 text-center md:min-w-[140px]">
            <span className="font-display font-700 text-white text-sm leading-tight">{root}</span>
          </div>
        </div>

        <div className="hidden md:block w-5 h-px bg-mock-cobalt/40 shrink-0" />

        <div className="flex-grow space-y-2.5">
          {branches.map((b, i) => (
            <div key={i} className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1.5 rounded-md bg-white border border-mock-line font-mono text-xs text-mock-cobaltInk">
                {b.node}
              </span>
              <span className="text-mock-cobalt/60">→</span>
              <span className="font-mono text-xs text-mock-sub">{b.outcome}</span>
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
function MechanismsBlock({ product, number }: { product: ProductPageData; number: string }) {
  const mechanism = PRODUCT_MECHANISMS[product.slug];

  if (mechanism) {
    return (
      <InfoBlock number={number} label={mechanism.sectionTitle}>
        <div className="bg-white border border-mock-line rounded-2xl p-8 space-y-6">
          <p className="font-body text-mock-sub leading-relaxed">{mechanism.intro}</p>

          <ul className="space-y-4">
            {mechanism.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-mock-cobalt mt-2" />
                <p className="font-body text-mock-sub leading-relaxed">
                  <span className="font-display font-700 text-mock-navy">{b.title}.</span>{" "}
                  {b.description}
                </p>
              </li>
            ))}
          </ul>

          <MechanismDiagram root={mechanism.diagram.root} branches={mechanism.diagram.branches} />

          <p className="font-mono text-xs text-mock-sub leading-relaxed">{mechanism.caption}</p>
        </div>
      </InfoBlock>
    );
  }

  return (
    <InfoBlock number={number} label="Research Applications">
      <div className="bg-white border border-mock-line rounded-2xl p-8">
        <ol className="space-y-5">
          {product.researchApplications.map((item, i) => (
            <li key={i} className="flex items-start gap-5">
              <span className="shrink-0 font-mono text-xs text-mock-cobaltInk/70 w-6 pt-0.5 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="font-body text-mock-sub leading-relaxed">{item}</p>
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
  // Section numbers are assigned in render order rather than hardcoded, so
  // skipping Mechanisms (AC3R/AC2T) never leaves a numbering gap.
  let sectionCount = 0;
  const nextNumber = () => String(++sectionCount).padStart(2, "0");
  const showMechanisms = !HIDE_MECHANISMS_SLUGS.has(product.slug);

  const whatItIsNumber = nextNumber();
  const mechanismsNumber = showMechanisms ? nextNumber() : null;
  const faqNumber = nextNumber();
  const relatedNumber = product.relatedProducts.length > 0 ? nextNumber() : null;

  return (
    <>
      <ViewContentPixel wcProductId={product.wcProductId} name={product.name} price={product.priceNumber} />
      <ProductHero product={product} />

      {/* ── SECTIONS — Combined info block ────────────────────────────────
          One continuous section instead of stacked ones: every block
          shares the same bg-mock-page. Each block is now a collapsed-by-
          default accordion row (see InfoBlock), so a tight space-y reads as
          a cohesive accordion group instead of leaving large gaps of empty
          page between short collapsed rows. ── */}
      <section className="bg-mock-page py-12">
        <div className="max-w-5xl mx-auto px-6 space-y-4">

          <InfoBlock number={whatItIsNumber} label="What it is">
            <div className="space-y-4">
              <WithMoleculeVisual
                image={!product.compositionBody ? product.moleculeImage : null}
                productName={product.name}
              >
                <div className="bg-white border border-mock-line rounded-2xl p-8">
                  <p className="font-display font-700 text-mock-navy text-xl mb-4">
                    {product.whatItIsSubtitle}
                  </p>
                  <p className="font-body text-mock-sub leading-relaxed">
                    {product.whatItIsBody}
                  </p>
                </div>
              </WithMoleculeVisual>

              <div className="bg-white border border-mock-line rounded-2xl overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {product.propertiesTable.map((row, i) => (
                      <tr
                        key={row.label}
                        className={`border-b border-mock-line last:border-0 ${
                          i % 2 === 0 ? "bg-mock-surface2" : ""
                        }`}
                      >
                        <td className="px-6 md:px-8 py-4 font-mono text-xs text-mock-sub tracking-widest uppercase whitespace-nowrap align-top w-48">
                          {row.label}
                        </td>
                        <td className="px-6 md:px-8 py-4 font-body text-sm text-mock-navy leading-relaxed">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </InfoBlock>

          {showMechanisms && <MechanismsBlock product={product} number={mechanismsNumber!} />}

          <InfoBlock number={faqNumber} label="FAQ">
            <ProductFaqBlock />
          </InfoBlock>

        </div>
      </section>

      {/* ── RUO disclaimer — tighter top spacing ─────────────────────────── */}
      <section className="bg-mock-page pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white border border-mock-line rounded-2xl p-8 border-l-4 border-l-mock-cobalt">
            <p className="font-body text-sm text-mock-sub leading-relaxed">
              By completing your order you confirm all products are purchased for
              legitimate in vitro laboratory research purposes only, not for human
              or veterinary injection or therapeutic use. Anvil Compounds is not a
              pharmacy or compounding facility.
            </p>
          </div>
        </div>
      </section>

      {/* ── Lab loop video — full width, native horizontal frame, no crop.
          Tight top/bottom padding (matches the RUO block above it) rather
          than the standard Section's py-16, which left too much empty
          bg-mock-page space above/below the video card. ── */}
      <section className="bg-mock-page pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-2xl overflow-hidden border border-mock-line">
            <LoopVideo
              src="/videos/anvil-semax-selank-loop.mp4"
              className="w-full h-auto block"
            />
          </div>
        </div>
      </section>

      {/* ── SECTION — Related compounds ──────────────────────────────────── */}
      {product.relatedProducts.length > 0 && (
        <Section>
          <SectionLabel number={relatedNumber!} label="Related Research" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {product.relatedProducts.map((rel, i) => (
              <CatalogProductCard key={rel.id} product={rel} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Footer compliance ─────────────────────────────────────────────── */}
      {/* id targeted by AddToCartButton's sticky bar so it un-sticks
          before covering this text — see stickyBarEnabled in AddToCartButton.tsx. */}
      <section id="compliance-footer" className="bg-mock-page border-t border-mock-line py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="font-mono text-[10px] text-mock-sub tracking-wide leading-relaxed">
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
