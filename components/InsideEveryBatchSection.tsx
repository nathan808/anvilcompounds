import Image from "next/image";
import SciIcon, { type SciIconName } from "@/components/SciIcon";

// What's on each lot's Certificate of Analysis (see the COA PDFs) plus the
// storage info shown on every product page.
const COA_CONTENTS: { icon: SciIconName; label: string; detail: string }[] = [
  { icon: "tag",          label: "Lot number",           detail: "Printed on the COA so you can match the results to your vial." },
  { icon: "chromatogram", label: "Purity (HPLC)",        detail: "The measured purity for that exact lot, not a range." },
  { icon: "spectrum",     label: "Identity (LC-MS)",     detail: "Confirms the compound is what it's supposed to be." },
  { icon: "droplet",      label: "Endotoxin (LAL)",      detail: "Pass/fail result for bacterial endotoxins." },
  { icon: "hash",         label: "Verification code",    detail: "Use it to look the result up directly with the testing lab." },
  { icon: "thermometer",  label: "Storage",              detail: "2–8 °C, away from light. Listed on every product page too." },
];

export default function InsideEveryBatchSection() {
  return (
    <section className="relative bg-mock-surface2 border-y border-mock-line py-16 md:py-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 items-start">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-px bg-mock-cobalt" />
            <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.2em] uppercase">
              005 / Inside Every Batch
            </span>
          </div>
          <h2 className="font-display font-700 text-mock-navy text-2xl md:text-3xl mb-3">
            What comes with every lot
          </h2>
          <p className="font-body text-mock-sub leading-relaxed mb-6">
            Each lot&rsquo;s data ships with it: purity, identity and contamination screen. Read the
            numbers before your experiment, not after.
          </p>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-mock-line">
            <Image
              src="/images/homepage/scientist.jpg"
              alt="Research scientist reviewing chromatogram data on a monitor in a lab"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              loading="lazy"
            />
          </div>
        </div>

        <div className="border border-mock-line rounded-xl overflow-hidden bg-white">
          <div className="px-5 py-3 border-b border-mock-line bg-mock-surface2">
            <span className="font-mono text-[11px] text-mock-sub tracking-[0.2em] uppercase">
              On every Certificate of Analysis
            </span>
          </div>
          <dl>
            {COA_CONTENTS.map((row) => (
              <div key={row.label} className="flex gap-4 px-5 py-4 border-b border-mock-line last:border-0">
                <dt className="shrink-0 w-44 inline-flex items-start gap-2.5 font-display font-600 text-sm text-mock-navy">
                  <span className="text-mock-cobaltInk/70 mt-0.5"><SciIcon name={row.icon} /></span>
                  {row.label}
                </dt>
                <dd className="font-body text-sm text-mock-sub leading-relaxed">{row.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
