import Image from "next/image";
import Link from "next/link";
import SciIcon, { type SciIconName } from "@/components/SciIcon";

const TESTS: { icon: SciIconName; name: string; checks: string; standard: string }[] = [
  {
    icon: "chromatogram",
    name: "HPLC",
    checks: "Purity. Separates the sample so you can see how much is the actual compound and how much is impurity.",
    standard: "99% or higher. A lot that tests below that doesn't ship.",
  },
  {
    icon: "spectrum",
    name: "Mass spectrometry",
    checks: "Identity. Measures the molecule itself, so we're not just trusting a label.",
    standard: "Has to match the expected molecular mass.",
  },
  {
    icon: "droplet",
    name: "Endotoxin (LAL)",
    checks: "Bacterial endotoxins. You can't see or smell them, which is why we test every lot.",
    standard: "Has to pass. Run to the USP <85> method.",
  },
];

export default function HowWeTestSection() {
  return (
    <section id="testing" className="relative bg-mock-surface2 border-y border-mock-line py-16 md:py-20 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-center mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-px bg-mock-cobalt" />
              <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.2em] uppercase">
                003 / Testing Protocol
              </span>
            </div>
            <h2 className="font-display font-700 text-mock-navy text-2xl md:text-3xl mb-3">
              How every lot is tested
            </h2>
            <p className="font-body text-mock-sub leading-relaxed max-w-xl">
              We don&rsquo;t test our own products in-house. Every lot goes to an independent lab,
              and it has to pass all three tests below before we list it.
            </p>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-mock-line">
            <Image
              src="/images/homepage/hplc-instrument.jpg"
              alt="HPLC instrument running a purity analysis with chromatogram on screen"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              loading="lazy"
            />
          </div>
        </div>

        <div className="border border-mock-line rounded-xl overflow-x-auto bg-white mb-6">
          <table className="w-full min-w-[620px] text-left">
            <thead className="bg-mock-surface2 border-b border-mock-line">
              <tr className="font-mono text-[11px] text-mock-sub tracking-[0.15em] uppercase">
                <th scope="col" className="px-5 py-3 font-400">Test</th>
                <th scope="col" className="px-5 py-3 font-400">What it checks</th>
                <th scope="col" className="px-5 py-3 font-400">What it has to show</th>
              </tr>
            </thead>
            <tbody>
              {TESTS.map((t) => (
                <tr key={t.name} className="border-b border-mock-line last:border-0 align-top">
                  <th scope="row" className="px-5 py-4 text-left w-[24%]">
                    <span className="inline-flex items-center gap-2.5 font-display font-600 text-sm text-mock-navy">
                      <span className="text-mock-cobaltInk/70"><SciIcon name={t.icon} /></span>
                      {t.name}
                    </span>
                  </th>
                  <td className="px-5 py-4 font-body text-sm text-mock-sub leading-relaxed">{t.checks}</td>
                  <td className="px-5 py-4 font-body text-sm text-mock-navy leading-relaxed">{t.standard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-white border border-mock-line rounded-xl px-5 py-4">
          <p className="inline-flex items-start gap-3 font-body text-sm text-mock-sub leading-relaxed">
            <span className="text-mock-cobaltInk/70 mt-0.5"><SciIcon name="document" /></span>
            <span>
              All three results are on the lot&rsquo;s Certificate of Analysis, which comes with every
              order. Each COA has a code you can use to look the result up with the testing lab.
            </span>
          </p>
          <Link
            href="/coas"
            className="shrink-0 font-display font-600 text-sm text-mock-cobaltInk hover:text-mock-cobalt"
          >
            Browse the COA Library →
          </Link>
        </div>
      </div>
    </section>
  );
}
