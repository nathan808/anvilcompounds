import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/app/products/[slug]/AddToCartButton";
import SizeSelector from "@/app/products/[slug]/SizeSelector";

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
  documentationCaption?: string;

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
      <span className="font-mono text-xs text-blue-400 tracking-[0.2em] uppercase">
        {number} / {label}
      </span>
    </div>
  );
}

// ─── Section wrappers ──────────────────────────────────────────────────────────

function Section({
  bg,
  children,
}: {
  bg: "navy-950" | "navy-900";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`${bg === "navy-950" ? "bg-navy-950" : "bg-navy-900"} py-16`}
    >
      <div className="max-w-5xl mx-auto px-6">{children}</div>
    </section>
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
      {/* ── SECTION 1 — Hero header ───────────────────────────────────────── */}
      <section className="bg-navy-950 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-start">

            {/* Left — product image */}
            <div className="relative">
              {product.image ? (
                <div className="relative w-full aspect-square max-w-lg mx-auto lg:max-w-none rounded-2xl overflow-hidden glass-card">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              ) : (
                <div
                  className="glass-card rounded-2xl flex items-center justify-center max-w-lg mx-auto lg:max-w-none"
                  style={{ minHeight: "420px" }}
                >
                  <span
                    className="text-blue-400/20 select-none"
                    style={{ fontSize: "6rem", lineHeight: 1 }}
                  >
                    ⬡
                  </span>
                </div>
              )}
            </div>

            {/* Right — buy column */}
            <div className="lg:sticky lg:top-24 space-y-5">
              {/* Breadcrumb */}
              <nav className="font-mono text-xs text-white/30">
                <span>Catalog</span>
                <span className="mx-2 text-white/20">/</span>
                <span className="text-blue-400/70">{product.category}</span>
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
                {product.name}
              </h1>

              {/* Subtitle */}
              <p className="font-mono text-xs text-blue-400/70 tracking-wider">
                {product.subtitle}
              </p>

              {/* Price */}
              <div className="pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-800 text-3xl text-white">
                    {product.price}
                  </span>
                  <span className="font-body text-sm text-white/30">
                    {product.priceUnit}
                  </span>
                </div>
              </div>

              {/* Size selector */}
              <div>
                <p className="font-mono text-[10px] text-white/35 tracking-widest uppercase mb-3">
                  Select Size
                </p>
                <SizeSelector sizes={product.sizes} />
              </div>

              {/* Add to cart */}
              <AddToCartButton
                slug={product.slug}
                name={product.name}
                sizes={product.sizes}
                priceNumber={product.priceNumber}
                wcProductId={product.wcProductId}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — Trust badges ──────────────────────────────────────── */}
      <section className="bg-navy-900 py-8">
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

      {/* ── SECTION 3 — What it is ────────────────────────────────────────── */}
      <Section bg="navy-950">
        <SectionLabel number="01" label="What it is" />
        <div className="glass-card rounded-2xl p-8">
          <p className="font-display font-700 text-white text-xl mb-4">
            {product.whatItIsSubtitle}
          </p>
          <p className="font-body text-white/60 leading-relaxed">
            {product.whatItIsBody}
          </p>
        </div>
      </Section>

      {/* ── SECTION 4 — Composition (conditional) ────────────────────────── */}
      {product.compositionBody && (
        <Section bg="navy-900">
          <SectionLabel number="02" label="Composition" />
          <div className="glass-card rounded-2xl p-8">
            <p className="font-body text-white/60 leading-relaxed">
              {product.compositionBody}
            </p>
          </div>
        </Section>
      )}

      {/* ── SECTION 5 — Research applications ───────────────────────────── */}
      <Section bg="navy-950">
        <SectionLabel number="03" label="Research Applications" />
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
      </Section>

      {/* ── SECTION 6 — Documentation ────────────────────────────────────── */}
      <Section bg="navy-900">
        <SectionLabel number="04" label={product.documentationHeading} />

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

        {/* Download button */}
        {product.documentationFile ? (
          <a
            href={product.documentationFile}
            download
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/30"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download COA
          </a>
        ) : (
          <button
            disabled
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/30 font-display font-700 text-sm opacity-40 cursor-not-allowed"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            COA Pending
          </button>
        )}

        {/* Caption */}
        {product.documentationCaption && (
          <p className="font-mono text-xs text-white/30 mt-4">
            {product.documentationCaption}
          </p>
        )}
      </Section>

      {/* ── SECTION 7 — Properties table ─────────────────────────────────── */}
      <Section bg="navy-950">
        <SectionLabel number="05" label="Properties" />
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
      </Section>

      {/* ── SECTION 8 — Shipping ──────────────────────────────────────────── */}
      <Section bg="navy-900">
        <SectionLabel number="06" label="Shipping" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {product.shippingType === "standard" ? (
            <>
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-700 text-white text-sm">
                  Same-day shipping
                </h3>
                <p className="font-body text-xs text-white/40 mt-1">
                  Orders placed before 12PM PST
                </p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-700 text-white text-sm">
                  2–3 day delivery
                </h3>
                <p className="font-body text-xs text-white/40 mt-1">
                  USPS Priority Mail
                </p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-700 text-white text-sm">
                  Cold-chain shipping
                </h3>
                <p className="font-body text-xs text-white/40 mt-1">
                  Ice packs included for temperature-sensitive compounds
                </p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-700 text-white text-sm">
                  Discreet packaging
                </h3>
                <p className="font-body text-xs text-white/40 mt-1">
                  Plain outer packaging, no product names
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-700 text-white text-sm">
                  Same-day shipping
                </h3>
                <p className="font-body text-xs text-white/40 mt-1">
                  Orders placed before 12PM PST
                </p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-700 text-white text-sm">
                  2–3 day delivery
                </h3>
                <p className="font-body text-xs text-white/40 mt-1">
                  USPS Priority Mail
                </p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-700 text-white text-sm">
                  Ambient shipping
                </h3>
                <p className="font-body text-xs text-white/40 mt-1">
                  No cold-chain required for this product
                </p>
              </div>
              <div className="glass-card rounded-xl p-5">
                <h3 className="font-display font-700 text-white text-sm">
                  Discreet packaging
                </h3>
                <p className="font-body text-xs text-white/40 mt-1">
                  Plain outer packaging, no product names
                </p>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ── SECTION 9 — Research use confirmation ────────────────────────── */}
      <Section bg="navy-950">
        <div className="glass-card rounded-2xl p-8 border-l-4 border-blue-600">
          <p className="font-body text-sm text-white/50 leading-relaxed">
            By completing your order you confirm all products are purchased for
            legitimate in vitro laboratory research purposes only — not for human
            or veterinary injection or therapeutic use. Anvil Compounds is not a
            pharmacy or compounding facility.
          </p>
        </div>
      </Section>

      {/* ── SECTION 10 — Related compounds ───────────────────────────────── */}
      {product.relatedProducts.length > 0 && (
        <Section bg="navy-900">
          <SectionLabel number="08" label="Related Compounds" />
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
                  <p className="font-mono text-xs text-blue-400/70 tracking-wider mt-1">
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

      {/* ── SECTION 11 — Footer compliance ───────────────────────────────── */}
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
