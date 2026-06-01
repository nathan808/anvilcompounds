export interface BlendComponent {
  name: string;
  amount: string;
  description: string;
}

export interface Product {
  slug: string;
  name: string;
  category: string;
  descriptor: string;
  price: string;
  priceUnit: string;
  sizes: string[];
  wcUrl: string;
  purity: string;
  icon: string;
  whatItIs: string;
  molecularProfile: string;
  researchFocusAreas: string[];
  properties: Record<string, string>;
  citations: string[];
  relatedSlugs: string[];
  isBlend?: boolean;
  blendComposition?: BlendComponent[];
}

export const products: Product[] = [
  {
    slug: "bpc-157",
    name: "BPC-157",
    category: "Peptide Research · Repair & Recovery",
    descriptor: "Pentadecapeptide fragment · Lyophilized · Research grade",
    price: "$35.00",
    priceUnit: "/ vial",
    sizes: ["5mg", "10mg"],
    wcUrl: "https://anvilcompounds.shop/product-page-draft/",
    purity: "99.4%",
    icon: "⬡",
    whatItIs:
      "BPC-157, also written as Body Protection Compound-157, is a synthetic pentadecapeptide derived from a partial sequence of a protective protein found in gastric juice. In scientific literature it is classified as a stable gastric pentadecapeptide and is studied as a tool compound in receptor and signaling research across gastrointestinal, connective tissue, and angiogenesis models.",
    molecularProfile:
      "BPC-157 is a 15-amino acid peptide with the molecular formula C62H98N16O22 and a molecular weight of approximately 1419.56 g/mol. It is synthesized via standard solid-phase peptide synthesis (SPPS) and supplied in lyophilized form for stability.",
    researchFocusAreas: [
      "Gastrointestinal mucosal signaling research",
      "Connective tissue and tendon cell biology models",
      "Angiogenesis and vascular signaling pathway studies",
      "Nitric oxide system modulation research",
    ],
    properties: {
      "CAS Number": "137525-51-0",
      "Molecular Formula": "C62H98N16O22",
      "Molecular Weight": "1419.56 g/mol",
      Appearance: "White to off-white lyophilized powder",
      Sequence: "Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val",
      Storage: "-20°C · Sealed · Protected from light",
      "Shelf Life": "24 months from manufacture date",
      "Vial Format": "Lyophilized · Sealed glass vial",
      Terms: "RUO only. Not for human, animal, diagnostic, or household use.",
    },
    citations: [
      "Sikiric P et al. Brain-gut Axis and Pentadecapeptide BPC 157. Current Neuropharmacology, 2016. Reviews BPC-157 as a research tool in gut-brain axis models.",
      "Gwyer D et al. Gastric pentadecapeptide body protection compound BPC 157 and its role in accelerating musculotendinous tissue repair. Cell Tissue Res, 2019.",
      "Chang CH et al. The promoting effect of pentadecapeptide BPC 157 on tendon healing involves tendon outgrowth, cell survival, and cell migration. J Appl Physiol, 2011.",
    ],
    relatedSlugs: ["ghk-cu", "semaglutide", "tirzepatide"],
  },
  {
    slug: "semaglutide",
    name: "Semaglutide",
    category: "Peptide Research · GLP-Class",
    descriptor: "GLP-1 receptor agonist · Lyophilized · Research grade",
    price: "$45.00",
    priceUnit: "/ vial",
    sizes: ["2mg", "5mg"],
    wcUrl: "https://anvilcompounds.shop/semaglutide/",
    purity: "99.2%",
    icon: "◈",
    whatItIs:
      "Semaglutide is a synthetic analogue of human glucagon-like peptide-1 (GLP-1), a 31-amino acid incretin hormone. It shares approximately 94% sequence homology with native GLP-1 and is classified as a GLP-1 receptor agonist. It is used in research studying GLP-1 receptor activation, incretin signaling cascades, pancreatic function models, and single-receptor incretin pathway pharmacology.",
    molecularProfile:
      "Semaglutide has the molecular formula C187H291N45O59 with a molecular weight of approximately 4113.58 g/mol. It incorporates a C18 fatty diacid attached via a hydrophilic linker at position 26 lysine, which enables albumin binding and extended pharmacokinetic properties in experimental models. Synthesized via SPPS with fatty acid conjugation and supplied as a lyophilized powder.",
    researchFocusAreas: [
      "GLP-1 receptor agonism and incretin signaling research",
      "Pancreatic beta-cell GLP-1 receptor signaling models",
      "Appetite and energy homeostasis pathway studies",
      "Cardiovascular risk factor modulation research models",
    ],
    properties: {
      "CAS Number": "910463-68-2",
      "Molecular Formula": "C187H291N45O59",
      "Molecular Weight": "4113.58 g/mol",
      Appearance: "White to off-white lyophilized powder",
      Sequence: "31-amino acid GLP-1 analogue with C18 fatty diacid modification at Lys26",
      Storage: "-20°C · Sealed · Protected from light",
      "Shelf Life": "24 months from manufacture date",
      "Vial Format": "Lyophilized · Sealed glass vial",
      Terms: "RUO only. Not for human, animal, diagnostic, or household use.",
    },
    citations: [
      "Marso SP et al. Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes. NEJM, 2016. SUSTAIN-6 cardiovascular outcomes trial.",
      "Wilding JPH et al. Once-Weekly Semaglutide in Adults with Overweight or Obesity. NEJM, 2021. STEP 1 Phase 3 trial data.",
      "Drucker DJ. Mechanisms of Action and Therapeutic Application of Glucagon-like Peptide-1. Cell Metab, 2018. Comprehensive GLP-1 receptor biology review.",
    ],
    relatedSlugs: ["tirzepatide", "retatrutide", "bpc-157"],
  },
  {
    slug: "tirzepatide",
    name: "Tirzepatide",
    category: "Peptide Research · GLP-Class",
    descriptor: "Dual GIP/GLP-1 receptor agonist · Lyophilized · Research grade",
    price: "$70.00",
    priceUnit: "/ vial",
    sizes: ["5mg", "10mg"],
    wcUrl: "https://anvilcompounds.shop/tirzepatide/",
    purity: "99.1%",
    icon: "◇",
    whatItIs:
      "Tirzepatide (LY3298176) is a synthetic 39-amino acid dual agonist peptide that activates both GIP and GLP-1 receptors. In scientific literature it is classified as a dual glucose-dependent insulinotropic polypeptide and glucagon-like peptide-1 receptor agonist and is used in research studying dual incretin receptor co-activation, pancreatic beta-cell signaling, and multi-receptor metabolic pathway models.",
    molecularProfile:
      "Tirzepatide has the molecular formula C225H348N48O68 with a molecular weight of approximately 4813.48 g/mol. It is a fatty-acid modified peptide incorporating a C20 fatty diacid moiety via a linker that extends half-life in experimental models. Synthesized via SPPS with fatty acid conjugation and supplied as a lyophilized powder.",
    researchFocusAreas: [
      "Dual GIP and GLP-1 receptor co-activation research",
      "Pancreatic beta-cell function and insulin secretion models",
      "Incretin-mediated glucose homeostasis pathway research",
      "Adipose tissue metabolism and lipid signaling studies",
    ],
    properties: {
      "CAS Number": "2023788-19-2",
      "Molecular Formula": "C225H348N48O68",
      "Molecular Weight": "4813.48 g/mol",
      Appearance: "White to off-white lyophilized powder",
      Sequence: "39-amino acid dual GIP/GLP-1 agonist with C20 fatty diacid modification",
      Storage: "-20°C · Sealed · Protected from light",
      "Shelf Life": "24 months from manufacture date",
      "Vial Format": "Lyophilized · Sealed glass vial",
      Terms: "RUO only. Not for human, animal, diagnostic, or household use.",
    },
    citations: [
      "Frias JP et al. Tirzepatide versus Semaglutide Once Weekly in Patients with Type 2 Diabetes. NEJM, 2021. Head-to-head comparison of dual vs single agonist.",
      "Jastreboff AM et al. Tirzepatide Once Weekly for the Treatment of Obesity. NEJM, 2022. SURMOUNT-1 Phase 3 data.",
      "Min T & Bain SC. The Role of Tirzepatide, Dual GIP and GLP-1 Receptor Agonist, in the Management of Type 2 Diabetes. Drug Des Devel Ther, 2021.",
    ],
    relatedSlugs: ["retatrutide", "semaglutide", "bpc-157"],
  },
  {
    slug: "retatrutide",
    name: "Retatrutide",
    category: "Peptide Research · GLP-Class",
    descriptor: "Triple incretin receptor agonist · Lyophilized · Research grade",
    price: "$85.00",
    priceUnit: "/ vial",
    sizes: ["5mg", "10mg"],
    wcUrl: "https://anvilcompounds.shop/reta/",
    purity: "99.0%",
    icon: "⬟",
    whatItIs:
      "Retatrutide (LY3437943) is a synthetic 39-amino acid peptide engineered as a triple-receptor agonist targeting GIP, GLP-1, and glucagon receptors simultaneously. In scientific literature it is described as a triple incretin receptor agonist and is studied in research involving multi-receptor metabolic signaling and triple-incretin pathway models.",
    molecularProfile:
      "Retatrutide has the molecular formula C231H360N52O70 with a molecular weight of approximately 4875.42 g/mol. It is produced via SPPS with multi-step HPLC purification for high sequence fidelity. As a triple agonist it is structurally distinct from single-receptor GLP-1 agonists, incorporating activation domains for all three incretin-related receptor pathways.",
    researchFocusAreas: [
      "Triple incretin receptor signaling pathway research",
      "Multi-receptor metabolic pharmacology models",
      "GIP, GLP-1, and glucagon receptor co-activation studies",
      "Hepatic lipid metabolism and steatosis research models",
    ],
    properties: {
      "CAS Number": "2381089-83-2",
      "Molecular Formula": "C231H360N52O70",
      "Molecular Weight": "4875.42 g/mol",
      Appearance: "White to off-white lyophilized powder",
      Sequence: "39-amino acid peptide with GIP, GLP-1, and glucagon receptor activation domains",
      Storage: "-20°C · Sealed · Protected from light",
      "Shelf Life": "24 months from manufacture date",
      "Vial Format": "Lyophilized · Sealed glass vial",
      Terms: "RUO only. Not for human, animal, diagnostic, or household use.",
    },
    citations: [
      "Jastreboff AM et al. Triple-Hormone-Receptor Agonist Retatrutide for Obesity — A Phase 2 Trial. NEJM, 2023. Landmark Phase 2 trial data for retatrutide.",
      "Hartman ML et al. Retatrutide, a GIP, GLP-1 and Glucagon Receptor Agonist, for people with type 2 diabetes. The Lancet, 2023.",
      "Newsome PN et al. Retatrutide for Metabolic Dysfunction-Associated Steatotic Liver Disease. Nature Medicine, 2024.",
    ],
    relatedSlugs: ["tirzepatide", "semaglutide", "bpc-157"],
  },
  {
    slug: "kglow",
    name: "KGLOW",
    category: "Peptide Research · Repair & Recovery",
    descriptor: "4-peptide blend · Lyophilized · 80mg per vial · Research grade",
    price: "$100.00",
    priceUnit: "/ vial · 80mg blend",
    sizes: [],
    wcUrl: "https://anvilcompounds.shop/klow/",
    purity: "99.3%",
    icon: "✦",
    isBlend: true,
    blendComposition: [
      {
        name: "GHK-Cu",
        amount: "50mg per vial",
        description:
          "Copper tripeptide studied in extracellular matrix remodeling, collagen synthesis signaling, and copper-dependent enzyme activity research models.",
      },
      {
        name: "BPC-157",
        amount: "10mg per vial",
        description:
          "Synthetic pentadecapeptide studied in gastrointestinal mucosal signaling, connective tissue cell biology, and angiogenesis pathway research.",
      },
      {
        name: "TB-500",
        amount: "10mg per vial",
        description:
          "Thymosin beta-4 synthetic fragment studied in actin dynamics, cell migration signaling, and endothelial cell biology research models.",
      },
      {
        name: "KPV",
        amount: "10mg per vial",
        description:
          "Lys-Pro-Val tripeptide studied for NF-kB pathway modulation via competitive importin-alpha3 binding and MAPK suppression in inflammatory signaling research.",
      },
    ],
    whatItIs:
      "KGLOW is a multi-component peptide reagent combining four independently studied synthetic peptides into a single lyophilized vial. The blend comprises GHK-Cu, BPC-157, TB-500, and KPV at fixed mass ratios — 50mg GHK-Cu, 10mg BPC-157, 10mg TB-500, and 10mg KPV per 80mg vial. It is used in research studying how complementary signaling pathways interact simultaneously across extracellular matrix remodeling, actin-mediated cytoskeletal dynamics, cytoprotective signaling, and NF-kB inflammatory pathway modulation models.",
    molecularProfile:
      "Each component addresses a distinct research pathway. Together they are studied for multi-pathway interaction behavior in regenerative biology, tissue modeling, and inflammatory signaling research. The four components are verified individually within the blend COA.",
    researchFocusAreas: [
      "Multi-pathway extracellular matrix remodeling and collagen synthesis research",
      "NF-kB inflammatory signaling pathway modulation studies",
      "Actin-mediated cytoskeletal dynamics and cell migration models",
      "Synergistic angiogenesis and vascular signaling pathway research",
      "Cytoprotective and tissue homeostasis multi-receptor interaction models",
    ],
    properties: {
      "Blend Format": "4-component lyophilized peptide blend",
      "Total Content": "80mg per vial",
      Composition: "GHK-Cu 50mg / BPC-157 10mg / TB-500 10mg / KPV 10mg",
      Appearance:
        "Off-white to pale blue lyophilized powder (blue tint from GHK-Cu copper content — normal)",
      Storage: "-20°C · Sealed · Protected from light",
      "Shelf Life": "24 months from manufacture date (lyophilized, sealed)",
      "Vial Format": "Lyophilized · Sealed glass vial",
      Reconstitution: "Bacteriostatic water recommended — sold separately",
      Terms: "RUO only. Not for human, animal, diagnostic, or household use.",
    },
    citations: [
      "Pickart L & Margolina A. Regenerative and Protective Actions of the GHK-Cu Peptide in the Light of the New Gene Data. Int J Mol Sci, 2018. GHK-Cu component reference.",
      "Sikiric P et al. Brain-gut Axis and Pentadecapeptide BPC 157. Current Neuropharmacology, 2016. BPC-157 component reference.",
      "Goldstein AL et al. Thymosin beta4: a multi-functional regenerative peptide. Expert Opinion on Biological Therapy, 2012. TB-500 component reference.",
      "Dalmasso G et al. The PepT1-mediated tripeptide KPV repairs intestinal epithelium by triggering PepT1-mediated signaling. Gastroenterology, 2008. KPV component reference.",
    ],
    relatedSlugs: ["bpc-157", "ghk-cu", "semaglutide"],
  },
  {
    slug: "ghk-cu",
    name: "GHK-Cu",
    category: "Peptide Research · Cosmetic & Longevity",
    descriptor: "Copper tripeptide-1 · Lyophilized · Research grade",
    price: "$30.00",
    priceUnit: "/ vial",
    sizes: ["50mg", "100mg"],
    wcUrl: "https://anvilcompounds.shop/ghkcu/",
    purity: "99.5%",
    icon: "⬢",
    whatItIs:
      "GHK-Cu (Copper Peptide GHK) is a naturally occurring copper complex of the tripeptide glycyl-L-histidyl-L-lysine. First isolated from human plasma, it is found in several human tissues and studied extensively in research related to copper-dependent enzyme systems, dermal cell biology, and extracellular matrix signaling models.",
    molecularProfile:
      "GHK-Cu has the molecular formula C14H24N6O4 with a molecular weight of approximately 340.38 g/mol (free peptide). It is synthesized by complexing the GHK tripeptide with cupric acetate and supplied as a fine lyophilized powder. Physical appearance ranges from purple to blue depending on copper content and hydration state.",
    researchFocusAreas: [
      "Dermal fibroblast and extracellular matrix signaling research",
      "Copper-dependent enzyme activity models",
      "Wound healing and tissue remodeling biology research",
      "Antioxidant and anti-inflammatory pathway studies",
    ],
    properties: {
      "CAS Number": "130120-56-8",
      "Molecular Formula": "C14H24N6O4 (Cu complex)",
      "Molecular Weight": "340.38 g/mol",
      Appearance: "Fine purple to blue lyophilized powder",
      Sequence: "Gly-His-Lys",
      Storage: "-20°C · Sealed · Protected from light",
      "Shelf Life": "24 months from manufacture date",
      "Vial Format": "Lyophilized · Sealed glass vial",
      Terms: "RUO only. Not for human, animal, diagnostic, or household use.",
    },
    citations: [
      "Pickart L & Margolina A. Regenerative and Protective Actions of the GHK-Cu Peptide in the Light of the New Gene Data. Int J Mol Sci, 2018.",
      "Gorouhi F & Maibach HI. Role of topical peptides in preventing or treating aged skin. Int J Cosmet Sci, 2009. Reviews GHK-Cu in dermal research models.",
      "Pickart L. The human tri-peptide GHK and tissue remodeling. J Biomater Sci Polym Ed, 2008.",
    ],
    relatedSlugs: ["bpc-157", "kglow", "retatrutide"],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(slugs: string[]): Product[] {
  return slugs
    .map((s) => products.find((p) => p.slug === s))
    .filter((p): p is Product => p !== undefined);
}
