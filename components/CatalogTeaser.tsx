import Link from "next/link";
import { getProductDisplayTitle } from "@/lib/productTitle";
import type { ProductCard } from "@/lib/woocommerce";
import SciIcon from "@/components/SciIcon";

// Slugs for the fixed preview list only (see PREVIEW_NAMES in app/page.tsx) —
// not the full catalog's name->slug map, which lives in ProductsSection.
const PREVIEW_SLUGS: Record<string, string> = {
  "BPC-157": "bpc-157",
  "GHK-Cu": "ghk-cu",
  "TB-500": "tb-500",
  "BPC-157 + TB-500": "bpc-157-tb-500",
  KLOW: "klow",
};

function gateHref(name: string) {
  const slug = PREVIEW_SLUGS[name] ?? "";
  return `/gate?redirect=${encodeURIComponent(`/products/${slug}`)}`;
}

// Homepage catalog index — a short tabular preview of the catalog. Pricing
// and the rest of the catalog stay behind the gate.
export default function CatalogTeaser({
  previewProducts,
  totalCount,
}: {
  previewProducts: ProductCard[];
  totalCount: number;
}) {
  return (
    <section id="catalog" className="bg-white border-b border-mock-line py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-px bg-mock-cobalt" />
              <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.2em] uppercase">
                01 / Catalog Index
              </span>
            </div>
            <h2 className="font-display font-700 text-mock-navy text-2xl md:text-3xl">
              Research Reagent Catalog
            </h2>
          </div>
          {previewProducts.length > 0 && (
            <p className="font-mono text-[11px] text-mock-sub tracking-[0.15em] uppercase">
              Showing {previewProducts.length} of {totalCount} · verification required for full catalog
            </p>
          )}
        </div>

        {previewProducts.length > 0 && (
          <div className="border border-mock-line rounded-xl overflow-x-auto mb-8">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-mock-surface2 border-b border-mock-line">
                <tr className="font-mono text-[11px] text-mock-sub tracking-[0.15em] uppercase">
                  <th scope="col" className="px-5 py-3 font-400">Catalog Code</th>
                  <th scope="col" className="px-5 py-3 font-400">Compound</th>
                  <th scope="col" className="px-5 py-3 font-400">Research Area</th>
                  <th scope="col" className="px-5 py-3 font-400">Format</th>
                  <th scope="col" className="px-5 py-3 font-400">Purity (HPLC)</th>
                  <th scope="col" className="px-5 py-3 font-400">COA</th>
                </tr>
              </thead>
              <tbody>
                {previewProducts.map((p) => (
                  <tr key={p.id} className="border-b border-mock-line last:border-0 hover:bg-mock-surface2/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-mock-sub">{p.sku ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <Link href={gateHref(p.name)} className="font-display font-600 text-sm text-mock-navy hover:text-mock-cobaltInk">
                        {getProductDisplayTitle(p.name, p.category)}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-body text-sm text-mock-sub">{p.category}</td>
                    <td className="px-5 py-3.5 font-body text-sm text-mock-sub">
                      {p.sizes.length ? `${p.sizes.join(" / ")}, lyophilized` : "Lyophilized"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm text-mock-navy">{p.purity || "—"}</td>
                    <td className="px-5 py-3.5">
                      {p.hasCoa ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-mock-cobaltInk tracking-wider uppercase">
                          <SciIcon name="document" className="w-3.5 h-3.5" /> On file
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-mock-muted tracking-wider uppercase">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link
          href="/catalog?catalog=full"
          className="inline-block px-5 py-2.5 rounded-lg bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-600 text-sm transition-colors"
        >
          Browse Full Catalog →
        </Link>
      </div>
    </section>
  );
}
