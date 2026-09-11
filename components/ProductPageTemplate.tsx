import ProductHero from "@/components/ProductHero";
import LoopVideo from "@/components/LoopVideo";
import ViewContentPixel from "@/components/ViewContentPixel";
import InfoBlock from "@/components/InfoBlock";
import ProductFaqBlock from "@/components/ProductFaqBlock";
import { ProductCard as CatalogProductCard } from "@/components/ProductsSection";
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

  const whatItIsNumber = nextNumber();
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

          <InfoBlock number={whatItIsNumber} label="What it is" defaultOpen>
            <WithMoleculeVisual image={product.moleculeImage} productName={product.name}>
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
            </WithMoleculeVisual>
          </InfoBlock>

          <div id="faq-section">
            <InfoBlock number={faqNumber} label="FAQ">
              <ProductFaqBlock />
            </InfoBlock>
          </div>

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
