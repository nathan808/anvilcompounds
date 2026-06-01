import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts, products } from "@/lib/productData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SizeSelector from "./SizeSelector";

// Generate static params for all products
export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

// Generate metadata per product
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) return {};
  return {
    title: `${product.name} — Anvil Compounds`,
    description: product.whatItIs.slice(0, 155),
  };
}

const TRUST_BADGES = [
  { label: "99%+ Purity", icon: "◆" },
  { label: "Endotoxin Screened", icon: "◈" },
  { label: "COA Verified", icon: "✓" },
  { label: "Same-Day Shipping", icon: "⚡" },
];

const SHIPPING_ITEMS = [
  {
    icon: "⚡",
    title: "Same-Day Shipping",
    desc: "Orders placed before 12PM PST ship same day",
  },
  {
    icon: "◈",
    title: "2–3 Day Delivery",
    desc: "USPS Priority Mail · Continental US",
  },
  {
    icon: "◇",
    title: "Discreet Packaging",
    desc: "Plain outer packaging, no product labeling",
  },
  {
    icon: "❄",
    title: "Cold-Chain Handling",
    desc: "Packed with insulation to maintain integrity",
  },
];

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const related = getRelatedProducts(product.relatedSlugs);

  // Determine placeholder icon color per product
  const iconColorMap: Record<string, string> = {
    "bpc-157": "text-blue-400/25",
    semaglutide: "text-indigo-400/25",
    tirzepatide: "text-cyan-400/25",
    kglow: "text-purple-400/25",
    "ghk-cu": "text-teal-400/25",
    retatrutide: "text-rose-400/25",
  };
  const iconColor = iconColorMap[product.slug] ?? "text-blue-400/25";

  return (
    <>
      <Navbar />

      {/* RUO bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-navy-800/95 backdrop-blur-sm border-b border-blue-600/10">
        <p className="text-center font-mono text-[10px] text-white/35 tracking-[0.2em] uppercase py-1.5">
          For laboratory and research use only &nbsp;·&nbsp; Must be 21+ to purchase
        </p>
      </div>

      <main className="bg-navy-950 min-h-screen">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(29,106,219,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(29,106,219,0.06) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.06] blur-[140px] bg-blue-600 pointer-events-none" />
        </div>

        <div className="relative z-10 pt-24 md:pt-28">

          {/* ── BREADCRUMB ── */}
          <div className="max-w-7xl mx-auto px-6 py-4">
            <nav className="flex items-center gap-2 font-mono text-xs text-white/30">
              <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/#catalog" className="hover:text-white/60 transition-colors">Catalog</Link>
              <span>/</span>
              <span className="text-blue-400/70">{product.name}</span>
            </nav>
          </div>

          {/* ── HERO — 2-column grid ── */}
          <section className="max-w-7xl mx-auto px-6 py-8 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start">

              {/* LEFT — product image placeholder */}
              <div className="relative">
                <div className="glass-card rounded-2xl overflow-hidden aspect-square max-w-lg mx-auto lg:max-w-none flex items-center justify-center"
                  style={{ minHeight: "400px" }}>
                  {/* Grid pattern inside card */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(29,106,219,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(29,106,219,0.08) 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }}
                  />
                  {/* Glow orb */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full bg-blue-600/10 blur-3xl" />
                  </div>
                  {/* Icon */}
                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <span className={`text-9xl ${iconColor} select-none`} style={{ fontFamily: "sans-serif" }}>
                      {product.icon}
                    </span>
                    <div className="text-center">
                      <p className="font-display font-700 text-2xl text-white/20 tracking-wide">
                        {product.name}
                      </p>
                      <p className="font-mono text-xs text-white/15 tracking-widest uppercase mt-1">
                        Image coming soon
                      </p>
                    </div>
                  </div>
                  {/* Purity badge pinned bottom-right */}
                  <div className="absolute bottom-5 right-5 glass-card rounded-lg px-3 py-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="font-mono text-xs text-blue-400 tracking-widest">{product.purity} PURE</span>
                  </div>
                </div>
              </div>

              {/* RIGHT — buy column (sticky on desktop) */}
              <div className="lg:sticky lg:top-24">
                {/* Category pill */}
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-4 h-px bg-blue-600" />
                  <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
                    {product.category}
                  </span>
                </div>

                {/* Product name */}
                <h1
                  className="font-display font-800 text-white leading-[1.05] mb-3"
                  style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)" }}
                >
                  {product.name}
                </h1>

                {/* Descriptor */}
                <p className="font-mono text-sm text-white/40 tracking-wide mb-6">
                  {product.descriptor}
                </p>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {TRUST_BADGES.map((b) => (
                    <span
                      key={b.label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-xs font-mono text-white/50 border-white/8"
                    >
                      <span className="text-blue-400 text-[10px]">{b.icon}</span>
                      {b.label}
                    </span>
                  ))}
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="font-mono text-xs text-white/30 block tracking-wider mb-1">Starting at</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-800 text-4xl text-white">{product.price}</span>
                    <span className="font-mono text-sm text-white/35">{product.priceUnit}</span>
                  </div>
                </div>

                {/* Size selector — client component */}
                {product.sizes.length > 0 && (
                  <div className="mb-8">
                    <p className="font-mono text-xs text-white/40 tracking-widest uppercase mb-3">Select Size</p>
                    <SizeSelector sizes={product.sizes} />
                  </div>
                )}

                {/* CTA */}
                <a
                  href={product.wcUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center py-4 bg-blue-600 hover:bg-blue-500 text-white font-display font-700 text-base rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 mb-3"
                >
                  Add to Cart
                </a>
                <p className="text-center font-mono text-[10px] text-white/20 tracking-wide">
                  RUO only · Not for human or veterinary use · 21+ required
                </p>
              </div>
            </div>
          </section>

          {/* ── CONTENT SECTIONS ── */}
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

            {/* 1. What it is */}
            <section>
              <SectionLabel number="01" label="What it is" />
              <div className="glass-card rounded-2xl p-8 md:p-10">
                <p className="font-body text-white/65 leading-relaxed text-base md:text-lg">
                  {product.whatItIs}
                </p>
              </div>
            </section>

            {/* 2. Molecular profile / Blend composition */}
            <section>
              <SectionLabel number="02" label={product.isBlend ? "Blend Composition" : "Molecular Profile"} />
              {product.isBlend && product.blendComposition ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.blendComposition.map((comp) => (
                    <div key={comp.name} className="glass-card rounded-2xl p-6 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-display font-700 text-white text-lg">{comp.name}</h3>
                          <span className="font-mono text-xs text-blue-400/70 tracking-wider">{comp.amount}</span>
                        </div>
                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-400/60" />
                        </div>
                      </div>
                      <p className="font-body text-sm text-white/50 leading-relaxed">{comp.description}</p>
                    </div>
                  ))}
                  {/* Blend notes card */}
                  <div className="md:col-span-2 glass-card rounded-2xl p-6">
                    <p className="font-mono text-xs text-blue-400/60 tracking-wider uppercase mb-3">Blend Notes</p>
                    <p className="font-body text-white/55 leading-relaxed text-sm">{product.molecularProfile}</p>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-8 md:p-10">
                  <p className="font-body text-white/65 leading-relaxed text-base md:text-lg">
                    {product.molecularProfile}
                  </p>
                </div>
              )}
            </section>

            {/* 3. Research focus areas */}
            <section>
              <SectionLabel number="03" label="Research Focus Areas" />
              <div className="glass-card rounded-2xl p-8 md:p-10">
                <ol className="space-y-4">
                  {product.researchFocusAreas.map((area, i) => (
                    <li key={i} className="flex items-start gap-5">
                      <span className="shrink-0 font-mono text-xs text-blue-600/60 w-6 pt-0.5 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="font-body text-white/65 leading-relaxed">{area}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* 4. COA & Testing */}
            <section>
              <SectionLabel number="04" label="COA & Testing" />
              <div className="glass-card rounded-2xl p-8 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
                  {[
                    { label: "HPLC Purity", value: product.purity },
                    { label: "Lot ID", value: "Pending Upload" },
                    { label: "Analysis Date", value: "Pending Upload" },
                    { label: "Endotoxin Status", value: "Screened · Pass" },
                  ].map((row) => (
                    <div key={row.label} className="flex flex-col gap-1 border-b border-white/6 pb-4">
                      <span className="font-mono text-xs text-white/30 tracking-widest uppercase">{row.label}</span>
                      <span className="font-mono text-sm text-white/70">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/30 font-display font-600 text-sm cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download COA (Coming Soon)
                  </button>
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/30 font-display font-600 text-sm cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Verify Independently (Coming Soon)
                  </button>
                </div>
                <p className="mt-4 font-mono text-[10px] text-white/20 tracking-wide">
                  COA documentation will be uploaded once Ken&apos;s lab data is finalized. All compounds are tested prior to shipment.
                </p>
              </div>
            </section>

            {/* 5. Properties table */}
            <section>
              <SectionLabel number="05" label="Properties" />
              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {Object.entries(product.properties).map(([key, val], i) => (
                      <tr
                        key={key}
                        className={`border-b border-white/5 last:border-0 ${
                          i % 2 === 0 ? "bg-white/[0.02]" : ""
                        }`}
                      >
                        <td className="px-6 md:px-8 py-4 font-mono text-xs text-white/30 tracking-widest uppercase whitespace-nowrap align-top w-40 md:w-56">
                          {key}
                        </td>
                        <td className="px-6 md:px-8 py-4 font-body text-sm text-white/65 leading-relaxed">
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6. Citations */}
            <section>
              <SectionLabel number="06" label="Citations & References" />
              <div className="glass-card rounded-2xl p-8 md:p-10">
                <ol className="space-y-5">
                  {product.citations.map((cite, i) => (
                    <li key={i} className="flex items-start gap-5">
                      <span className="shrink-0 font-mono text-xs text-blue-600/50 w-6 pt-0.5 tabular-nums">
                        [{i + 1}]
                      </span>
                      <p className="font-body text-sm text-white/50 leading-relaxed italic">{cite}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 font-mono text-[10px] text-white/20 tracking-wide">
                  Citations are provided for scientific reference only and do not constitute medical claims.
                  All research activity must comply with applicable institutional and regulatory guidelines.
                </p>
              </div>
            </section>

            {/* 7. Shipping info */}
            <section>
              <SectionLabel number="07" label="Shipping & Handling" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SHIPPING_ITEMS.map((item) => (
                  <div key={item.title} className="glass-card rounded-2xl p-6 flex flex-col gap-3">
                    <span className="text-2xl text-blue-400/50">{item.icon}</span>
                    <div>
                      <h3 className="font-display font-700 text-white text-sm mb-1">{item.title}</h3>
                      <p className="font-body text-xs text-white/40 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 8. Related compounds */}
            {related.length > 0 && (
              <section className="pb-16">
                <SectionLabel number="08" label="Related Compounds" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {related.map((rel) => (
                    <Link
                      key={rel.slug}
                      href={`/products/${rel.slug}`}
                      className="glass-card rounded-2xl p-6 flex flex-col gap-4 group transition-all duration-300 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-600/10 hover:-translate-y-1"
                    >
                      {/* Icon placeholder */}
                      <div className="w-12 h-12 rounded-xl bg-blue-600/8 border border-blue-600/15 flex items-center justify-center">
                        <span className="text-2xl text-blue-400/30">{rel.icon}</span>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-display font-700 text-white text-lg mb-1 group-hover:text-blue-300 transition-colors">
                          {rel.name}
                        </h3>
                        <p className="font-mono text-xs text-blue-400/50 tracking-wider mb-3">
                          {rel.category}
                        </p>
                        <p className="font-body text-xs text-white/35 leading-relaxed line-clamp-2">
                          {rel.descriptor}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/6">
                        <span className="font-display font-700 text-white text-xl">{rel.price}</span>
                        <span className="font-mono text-xs text-blue-400/60 group-hover:text-blue-400 transition-colors flex items-center gap-1">
                          View
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

// ── Utility sub-component ──
function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-px bg-blue-600" />
      <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
        {number} / {label}
      </span>
    </div>
  );
}
