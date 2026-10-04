import Link from "next/link";
import SciIcon, { type SciIconName } from "@/components/SciIcon";
import { BOGO_ENABLED } from "@/lib/bogoDiscount";

// Every value here is a standing property of the catalog (see the lot COAs
// and HowWeTestSection) — keep it factual; no per-product claims.
const SPEC_ROWS: { icon: SciIconName; label: string; value: string }[] = [
  { icon: "chromatogram", label: "Purity threshold", value: "≥ 99% by HPLC-UV" },
  { icon: "spectrum",     label: "Identity",         value: "Confirmed by LC-MS" },
  { icon: "droplet",      label: "Endotoxin",        value: "LAL assay, per lot" },
  { icon: "document",     label: "Documentation",    value: "Lot-specific Certificate of Analysis" },
  { icon: "box",          label: "Supplied as",      value: "Lyophilized solid, sealed vial" },
  { icon: "truck",        label: "Dispatch",         value: "Same day for orders before 12 PM PT" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-mock-page border-b border-mock-line">
      {/* Faint measurement grid in place of photography. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #D8E1EE 1px, transparent 1px), linear-gradient(to bottom, #D8E1EE 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        }}
      />

      {/* Clears the fixed navbar (and the promo bar above it when shown). */}
      {BOGO_ENABLED && <div className="h-9" />}
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-24 pb-14 md:pt-28 md:pb-20">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-6 h-px bg-mock-cobalt" />
              <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.2em] uppercase">
                Research reference materials · Southern California
              </span>
            </div>
            <h1
              className="font-display font-700 text-mock-navy leading-[1.1] tracking-tight mb-5"
              style={{ fontSize: "clamp(2rem, 4.2vw, 3.25rem)" }}
            >
              Research peptides, documented lot by lot.
            </h1>
            <p className="font-body text-base md:text-lg text-mock-sub leading-relaxed max-w-xl mb-8">
              Lyophilized research reagents supplied with lot-specific Certificates of Analysis
              from independent laboratories — HPLC purity, LC-MS identity and LAL endotoxin
              screening for every lot.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/catalog?catalog=full"
                className="px-5 py-2.5 rounded-lg bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-600 text-sm transition-colors"
              >
                View Catalog
              </Link>
              <Link
                href="/coas"
                className="px-5 py-2.5 rounded-lg border border-mock-line bg-white hover:border-mock-cobalt/40 text-mock-navy font-display font-600 text-sm transition-colors"
              >
                COA Library
              </Link>
            </div>
            <p className="font-mono text-[11px] text-mock-sub tracking-wide">
              For in vitro laboratory research use only. Not for human or veterinary use. 21+.
            </p>
          </div>

          <div className="bg-white border border-mock-line rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-mock-line bg-mock-surface2 flex items-center justify-between">
              <span className="font-mono text-[11px] text-mock-sub tracking-[0.2em] uppercase">
                Catalog Specification
              </span>
              <span className="font-mono text-[11px] text-mock-muted">All lots</span>
            </div>
            <table className="w-full">
              <caption className="sr-only">Standing specification for all catalog lots</caption>
              <tbody>
                {SPEC_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-mock-line last:border-0">
                    <th scope="row" className="px-5 py-3 text-left align-top w-[44%]">
                      <span className="inline-flex items-center gap-2.5 font-mono text-[11px] font-400 text-mock-sub tracking-widest uppercase">
                        <span className="text-mock-cobaltInk/70"><SciIcon name={row.icon} /></span>
                        {row.label}
                      </span>
                    </th>
                    <td className="px-5 py-3 font-body text-sm text-mock-navy">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
