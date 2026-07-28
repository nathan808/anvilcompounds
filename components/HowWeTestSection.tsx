"use client";

import Image from "next/image";

const methods = [
  {
    step: "01",
    name: "HPLC — Purity",
    description:
      "Each lot is run through a stationary phase under pressure, and the resulting chromatogram tells us exactly what's active compound and what's impurity, down to the ppm. Our purity floor is 99%. A batch that tests below it doesn't leave the lab.",
  },
  {
    step: "02",
    name: "Mass Spec — Identity",
    description:
      "Ionization and mass-to-charge analysis pins down the exact molecular identity of the compound in the vial. We're not trusting a label, we're measuring a molecule. If the spectrum doesn't match spec, the batch doesn't ship.",
  },
  {
    step: "03",
    name: "Endotoxin (LAL)",
    description:
      "Every batch runs a Limulus Amebocyte Lysate assay for bacterial endotoxins, a screen most research suppliers skip to save time and cost. Endotoxin contamination has no smell and leaves no visible trace, which is exactly why we treat this test as mandatory, not optional.",
    detailLink: "/blog/endotoxin-problem-peptide-market",
    detailLinkLabel: "The endotoxin problem nobody in the peptide market talks about →",
  },
];

export default function HowWeTestSection() {
  return (
    <section id="testing" className="relative bg-mock-surface2 border-y border-mock-line py-[76px]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-10 items-center mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-px bg-mock-cobalt" />
              <span className="font-mono text-xs text-mock-cobaltInk tracking-[0.25em] uppercase">
                003 / Anvil Standards
              </span>
            </div>

            <h2
              className="font-heading font-700 text-mock-navy mb-4"
              style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.5rem)" }}
            >
              Testing <span className="font-800 italic text-mock-cobalt">Protocol</span>
            </h2>

            <p className="font-body text-mock-sub text-base leading-relaxed">
              Every lot clears independent assays before it lists. No shortcuts. No batch
              skips a step. Nothing ships until the data confirms spec.
            </p>
          </div>

          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-mock-line hidden lg:block">
            <Image
              src="/images/homepage/hplc-instrument.jpg"
              alt="HPLC instrument running a purity analysis with chromatogram on screen"
              fill
              className="object-cover"
              sizes="420px"
              loading="lazy"
            />
          </div>
        </div>

        {/* Proto cards — simple numbered cards matching the mockup */}
        <div className="grid gap-3">
          {methods.map((method) => (
            <div
              key={method.step}
              className="bg-white border border-mock-line rounded-xl p-4 md:p-[18px] flex gap-4"
            >
              <div
                className="shrink-0 w-9 h-9 rounded-lg bg-mock-graphite text-mock-cobaltLight font-heading italic font-800 flex items-center justify-center"
                style={{ fontSize: "15.4px" }}
              >
                {method.step}
              </div>
              <div>
                <h4 className="font-display font-700 text-[15px] text-mock-navy">{method.name}</h4>
                <p className="text-[13px] text-mock-sub mt-1 leading-relaxed">{method.description}</p>
                {method.detailLink && (
                  <a
                    href={method.detailLink}
                    className="inline-block mt-2 font-mono text-xs text-mock-cobaltInk hover:text-mock-cobalt animated-underline"
                  >
                    {method.detailLinkLabel}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* COA callout */}
        <a
          href="/coas"
          className="mt-8 p-5 md:p-6 rounded-xl border border-mock-line bg-white flex flex-col md:flex-row gap-5 md:items-center hover:border-mock-cobalt/40 hover:shadow-lg hover:shadow-mock-cobalt/5 transition-all duration-300 cursor-pointer"
        >
          <div className="flex-grow">
            <h3 className="font-display font-700 text-mock-navy text-xl mb-2">
              Certificate of Analysis, Every Batch
            </h3>
            <p className="font-body text-mock-sub text-sm leading-relaxed max-w-lg">
              Every order ships with a full COA covering all three assay results. Scan the QR
              code to confirm your batch against our independent testing portal.
            </p>
          </div>
          <div className="shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 border-mock-cobalt/30 bg-mock-surface2 flex items-center justify-center float">
              <div className="grid grid-cols-3 gap-1.5 p-3">
                {Array.from({ length: 9 }).map((_, k) => (
                  <div
                    key={k}
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor: [0, 2, 6, 8].includes(k)
                        ? "#1F5AE0"
                        : Math.random() > 0.5
                        ? "#0A2547"
                        : "#7FA4EC",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}
