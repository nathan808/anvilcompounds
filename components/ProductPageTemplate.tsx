import ProductHero from "@/components/ProductHero";
import InfoBlock from "@/components/InfoBlock";
import ReconstitutionGuide from "@/components/ReconstitutionGuide";
import ProductFaqBlock from "@/components/ProductFaqBlock";
import { ProductCard as CatalogProductCard } from "@/components/ProductsSection";
import { PRODUCT_MECHANISMS } from "@/lib/productMechanisms";
import { parseReconVials } from "@/lib/reconstitution";
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
          <div className="px-4 py-3 rounded-lg bg-mock-graphite border border-mock-cobalt/30 text-center md:min-w-[140px]">
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
function MechanismsBlock({ product }: { product: ProductPageData }) {
  const mechanism = PRODUCT_MECHANISMS[product.slug];

  if (mechanism) {
    return (
      <InfoBlock number="02" label={mechanism.sectionTitle}>
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
    <InfoBlock number="02" label="Research Applications">
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
  return (
    <>
      <ProductHero product={product} />

      {/* ── SECTIONS 1-4 — Combined info block ────────────────────────────
          One continuous section instead of stacked ones: every block
          shares the same bg-mock-page. Each block is now a collapsed-by-
          default accordion row (see InfoBlock), so a tight space-y reads as
          a cohesive accordion group instead of leaving large gaps of empty
          page between short collapsed rows. ── */}
      <section className="bg-mock-page py-12">
        <div className="max-w-5xl mx-auto px-6 space-y-4">

          <InfoBlock number="01" label="What it is">
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
          </InfoBlock>

          <MechanismsBlock product={product} />

          <InfoBlock number="03" label="Properties">
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
          </InfoBlock>

          {parseReconVials(product.sizes).length > 0 && (
            <InfoBlock number="04" label="Reconstitution Guide">
              <ReconstitutionGuide slug={product.slug} sizes={product.sizes} />
            </InfoBlock>
          )}

          <InfoBlock number="05" label="FAQ">
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

      {/* ── SECTION — Related compounds ──────────────────────────────────── */}
      {product.relatedProducts.length > 0 && (
        <Section>
          <SectionLabel number="06" label="Related Compounds" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {product.relatedProducts.map((rel, i) => (
              <CatalogProductCard key={rel.id} product={rel} index={i} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Footer compliance ─────────────────────────────────────────────── */}
      <section className="bg-mock-page border-t border-mock-line py-8">
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
