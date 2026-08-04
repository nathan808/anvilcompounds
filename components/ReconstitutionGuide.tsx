"use client";

import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { BW_VOLUMES_ML, parseReconVials } from "@/lib/reconstitution";

export default function ReconstitutionGuide({
  slug,
  sizes,
}: {
  slug: string;
  sizes: string[];
}) {
  const { isAuthenticated, hydrated } = useAuth();
  const vials = parseReconVials(sizes);

  if (vials.length === 0) return null;

  if (!hydrated) {
    return <div className="h-40 rounded-2xl bg-mock-surface2 animate-pulse" />;
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`/products/${slug}?access=lab-guide`);
    return (
      <div className="bg-white border border-mock-line rounded-2xl p-8 text-center">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-mock-line bg-mock-surface2">
          <span className="w-1.5 h-1.5 rounded-full bg-mock-cobalt" />
          <span className="font-mono text-[10px] text-mock-cobaltInk tracking-[0.18em] uppercase">
            Researcher &amp; Laboratory Access
          </span>
        </div>
        <p className="font-display font-700 text-mock-navy text-lg mb-2 max-w-md mx-auto">
          Reconstitution reference data is reserved for verified researcher accounts
        </p>
        <p className="font-body text-sm text-mock-sub leading-relaxed max-w-md mx-auto mb-6">
          Sign in with your Anvil Compounds research account to view laboratory
          reconstitution values for this compound — bacteriostatic water volumes
          and resulting concentrations, for laboratory reference only.
        </p>
        <Link
          href={`/account?redirect=${redirect}`}
          className="inline-flex items-center justify-center px-6 py-3 bg-mock-cobalt hover:bg-mock-cobaltInk text-white font-display font-700 text-sm rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-mock-cobalt/20"
        >
          Sign In to View
        </Link>
        <p className="font-mono text-[10px] text-mock-sub tracking-wide mt-4">
          No research account yet? Registration is free and takes under a minute.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-mock-line rounded-2xl p-8">
      <p className="font-body text-sm text-mock-sub leading-relaxed mb-6">
        Reference values for reconstituting each vial with bacteriostatic water
        at common laboratory volumes.
      </p>

      <div className="space-y-6">
        {vials.map(({ size, totalMg }) => (
          <div key={size}>
            <p className="font-display font-800 text-mock-navy text-base mb-3">
              {size} vial
            </p>
            <div className="border border-mock-line rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-mock-surface2 border-b border-mock-line">
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] text-mock-sub tracking-widest uppercase font-500">
                      BW Added
                    </th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] text-mock-sub tracking-widest uppercase font-500">
                      Resulting Concentration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {BW_VOLUMES_ML.map((vol) => (
                    <tr key={vol} className="border-b border-mock-line last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs text-mock-navy">{vol} mL</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-mock-cobaltInk font-600">
                        {(totalMg / vol).toFixed(2)} mg/mL
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-5 border-t border-mock-line">
        <p className="font-mono text-[10px] text-mock-sub leading-relaxed tracking-wide">
          Reference values only, calculated from total peptide content per vial.
          Provided to support laboratory reconstitution planning — not a
          recommendation for use, dosing, or administration. RUO only. Not for
          human or animal use.
        </p>
      </div>
    </div>
  );
}
