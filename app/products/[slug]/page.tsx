import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductPageTemplate, {
  type ProductPageData,
} from "@/components/ProductPageTemplate";

// ─── Static params — all known slugs ──────────────────────────────────────────

export async function generateStaticParams() {
  const slugs = [
    "bpc-157",
    "semaglutide",
    "tirzepatide",
    "retatrutide",
    "kglow",
    "ghk-cu",
    "tb-500",
    "bac-water",
    "mots-c",
  ];
  return slugs.map((slug) => ({ slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata() {
  return {
    title: `${BAC_WATER_PLACEHOLDER.name} — Anvil Compounds`,
    description: BAC_WATER_PLACEHOLDER.subtitle,
  };
}

// ─── Placeholder data (Phase 1 — all slugs render this) ──────────────────────

const BAC_WATER_PLACEHOLDER: ProductPageData = {
  slug: "bac-water",
  name: "Bacteriostatic Water",
  category: "Research Supplies",
  subtitle: "0.9% benzyl alcohol · Sterile · 30mL multi-use vial",
  price: "$25.00",
  priceNumber: 25,
  priceUnit: "/ vial",
  sizes: ["30mL × 1", "30mL × 3"],
  sizesPrices: [25, 65],
  wcProductId: 349,
  image: null,
  trustBadges: [
    "Sterility certified",
    "0.9% benzyl alcohol",
    "Multi-use sealed vial",
    "Same-day shipping",
  ],
  whatItIsSubtitle: "Bacteriostatic Water | Research Use Only",
  whatItIsBody:
    "Bacteriostatic water (BW) is sterile water for injection containing 0.9% benzyl alcohol as a preservative. The benzyl alcohol component inhibits microbial growth, allowing the vial to be used multiple times without contamination over a defined period. It is the standard reconstitution solvent used in peptide research laboratories for lyophilized peptide preparation prior to in vitro use.",
  compositionBody:
    "Bacteriostatic water is an aqueous solution containing water for injection (WFI) meeting sterility requirements and benzyl alcohol (C7H8O) at 0.9% w/v concentration. Supplied in sealed 30mL multi-use glass vials. No active peptide or pharmaceutical ingredient.",
  researchApplications: [
    "Standard reconstitution medium for lyophilized peptide research compounds",
    "Multi-use format — benzyl alcohol preservative prevents microbial contamination between uses",
    "Compatible with all lyophilized peptide compounds in the Anvil catalog",
    "Appropriate for in vitro cell culture preparation and research workflows",
  ],
  documentationHeading: "Documentation & Quality",
  documentationMetrics: [
    { label: "Sterility", value: "Certified" },
    { label: "Lot ID", value: "Pending — first batch" },
    { label: "Analysis Date", value: "Pending — first batch" },
    { label: "Benzyl Alcohol", value: "0.9% w/v" },
  ],
  documentationFile: null,
  documentationCaption:
    "Certificate of Analysis issued upon batch completion. Sterility tested per USP standards.",
  propertiesTable: [
    { label: "Format", value: "Sterile aqueous solution" },
    { label: "Preservative", value: "Benzyl alcohol 0.9% w/v" },
    { label: "Volume", value: "30mL per vial" },
    { label: "Container", value: "Multi-use sealed glass vial" },
    { label: "Storage", value: "Room temperature · Keep sealed" },
    { label: "Shelf Life", value: "24 months from manufacture date" },
    {
      label: "Terms",
      value: "RUO only. Not for human, animal, diagnostic, or household use.",
    },
  ],
  shippingType: "ambient",
  relatedProducts: [
    { slug: "bpc-157", name: "BPC-157", category: "Repair & Recovery", icon: "⬡" },
    { slug: "ghk-cu", name: "GHK-Cu", category: "Cosmetic & Longevity", icon: "⬢" },
    { slug: "tb-500", name: "TB-500", category: "Repair & Recovery", icon: "◉" },
  ],
};

// ─── Page component ───────────────────────────────────────────────────────────

export default function ProductPage() {
  return (
    <>
      <Navbar />
      <main className="bg-navy-950 min-h-screen pt-16">
        <ProductPageTemplate product={BAC_WATER_PLACEHOLDER} />
      </main>
      <Footer />
    </>
  );
}
