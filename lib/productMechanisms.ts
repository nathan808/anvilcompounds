// Per-product "Mechanisms studied in preclinical models" content, transcribed directly from
// each compound's SDS / research-reference PDF (public/documents/sds/*.pdf), section "02
// Technical & Research Reference". Keyed by product slug (filename minus .pdf).
//
// Faithful-transcription rules followed when building this file:
// - No claims were added beyond what appears in the source PDF.
// - Hedging language present in the source ("not established effects in humans", "schematic
//   only; not a claim of established human effect", etc.) is preserved verbatim or near-verbatim
//   — do not strip it out when consuming this data.
// - Section titles, bullet counts, and diagram shapes intentionally differ per product because
//   the underlying PDFs differ; nothing here was forced into a uniform template.
// - Entries are `null` for products whose PDF has no comparable mechanism/diagram section — see
//   the comment above each null entry for what that product's section 02 contains instead.

export interface ProductMechanismBullet {
  title: string;
  description: string;
}

export interface ProductMechanismBranch {
  node: string;
  outcome: string;
}

export interface ProductMechanismDiagram {
  root: string;
  branches: ProductMechanismBranch[];
}

export interface ProductMechanism {
  sectionTitle: string;
  intro: string;
  bullets: ProductMechanismBullet[];
  diagram: ProductMechanismDiagram;
  caption: string;
}

export const PRODUCT_MECHANISMS: Record<string, ProductMechanism | null> = {
  "bpc-157": {
    sectionTitle: "Mechanisms studied in preclinical models",
    intro:
      "Investigated in published preclinical research since the early 1990s across tissue-repair, gastrointestinal, vascular and neurological models. Frequently characterized as notably stable in aqueous and acidic conditions, which is one reason it has been studied across multiple routes of administration in animal models. Findings below derive from animal and cell-culture systems. They are not established effects in humans.",
    bullets: [
      {
        title: "Angiogenesis via VEGFR2 signaling",
        description:
          "Endothelial responses reported through the VEGFR2–Akt–eNOS axis (Hsieh et al.).",
      },
      {
        title: "Nitric oxide (NO) system modulation",
        description:
          "Interaction with the Src–caveolin-1–eNOS pathway; magnitude and direction remain under active debate in the 2025 literature.",
      },
      {
        title: "Growth-hormone receptor (GHR) upregulation",
        description:
          "Increased GHR expression and downstream JAK2 signaling in tendon fibroblast cultures.",
      },
      {
        title: "FAK–paxillin and ERK1/2 signaling",
        description: "Implicated in cell-migration and tissue-repair models.",
      },
      {
        title: "Anti-inflammatory modulation",
        description: "Reduced pro-inflammatory cytokines in injury models.",
      },
    ],
    diagram: {
      root: "BPC-157 / research peptide",
      branches: [
        { node: "VEGFR2 → Akt → eNOS → NO", outcome: "Angiogenesis" },
        { node: "FAK–paxillin", outcome: "Cell migration" },
        { node: "GHR / JAK2", outcome: "Fibroblast signaling" },
        { node: "↓ TNF / cytokines", outcome: "Anti-inflammatory" },
      ],
    },
    caption:
      "Proposed pathways investigated in preclinical (animal / in-vitro) models. Schematic only; not a claim of established human effect.",
  },

  "glp-rt": {
    sectionTitle: "Mechanism",
    intro:
      "Retatrutide extends incretin co-agonism to a third target. Where dual agonists engage the appetite and insulin axes, adding glucagon receptor agonism introduces a direct energy-expenditure and lipolytic signal, a mechanistically different contribution rather than simply more of the same.",
    bullets: [
      {
        title: "GIP receptor agonism",
        description: "Incretin signaling; insulin response and adipose-tissue effects.",
      },
      {
        title: "GLP-1 receptor agonism",
        description:
          "Appetite reduction and slowed gastric emptying, as in the established GLP-1 class.",
      },
      {
        title: "Glucagon receptor agonism",
        description:
          "Associated with increased energy expenditure and fat metabolism, the differentiating component.",
      },
      {
        title: "Once-weekly pharmacokinetics",
        description:
          "Fatty-acid modification supports extended half-life in the investigational clinical formulation.",
      },
      {
        title: "Open scientific question",
        description:
          "Whether the added glucagon signal alters the long-term safety profile relative to dual agonism is precisely what the ongoing Phase 3 programme is designed to determine.",
      },
    ],
    diagram: {
      root: "GLP-RT / single molecule",
      branches: [
        { node: "GIP receptor", outcome: "Insulin response, adipose signaling" },
        { node: "GLP-1 receptor", outcome: "Appetite, gastric emptying" },
        { node: "Glucagon receptor", outcome: "Energy expenditure, lipolysis" },
      ],
    },
    caption:
      "Triple hormone receptor co-agonism. Schematic. Research-grade material supplied here is for in-vitro laboratory use only.",
  },

  // Bacteriostatic Water is a reconstitution solvent (0.9% benzyl alcohol sterile water), not a
  // bioactive research peptide, and has no SDS/research-reference PDF (see SLUG_TO_SDS). There is
  // no mechanism content to show. Needs a fallback.
  "bac-water": null,

  "glp-trz": {
    sectionTitle: "Mechanism",
    intro:
      "GIP and GLP-1 are endogenous incretin hormones. Their receptors are expressed in pancreatic tissue and in brain regions relevant to appetite regulation. Tirzepatide co-activates both with a single molecule — the mechanistic feature that separates it from the GLP-1 monotherapy class.",
    bullets: [
      {
        title: "Dual receptor co-agonism",
        description:
          "Simultaneous activation of GIP and GLP-1 receptors, which have overlapping and non-overlapping expression and function.",
      },
      {
        title: "Appetite and intake",
        description:
          "Reduced calorie intake, with effects understood to be substantially appetite-mediated.",
      },
      {
        title: "Gastric emptying",
        description: "Slowed gastric emptying, a class effect of GLP-1 receptor agonism.",
      },
      {
        title: "Insulin sensitivity and glycemic control",
        description:
          "Improved insulin response; the basis of the original type 2 diabetes indication.",
      },
      {
        title: "Half-life extension",
        description:
          "The C20 fatty diacid moiety supports albumin binding and once-weekly administration in the approved product.",
      },
    ],
    diagram: {
      root: "GLP-TRZ / single molecule",
      branches: [
        { node: "GIP receptor", outcome: "Insulin response, adipose signaling" },
        { node: "GLP-1 receptor", outcome: "Appetite, gastric emptying, insulin" },
      ],
    },
    caption:
      "Dual incretin receptor co-agonism. Schematic. Research-grade material supplied here is for in-vitro laboratory use only.",
  },

  // KLOW is a four-peptide blend (KPV, GHK-Cu, BPC-157, TB-500). Its section 02 ("Constituent
  // Reference") documents each of the four constituents individually — each with its own short
  // mechanism bullet list — but there is no unified mechanism narrative or flow diagram for the
  // blend as a whole. Section 03 ("The Blend Question") explicitly states combination behavior
  // is uncharacterized. Needs a fallback.
  klow: null,

  "ghk-cu": {
    sectionTitle: "Mechanisms studied in preclinical models",
    intro:
      "GHK-Cu has been studied for decades in skin-biology, wound-healing and extracellular-matrix (ECM) research. The observation that circulating GHK declines with age motivated much of the interest in exogenous GHK-Cu as a research tool in connective-tissue and regenerative biology. Findings below derive from in-vitro and animal models (with some early/limited human topical data). Not established systemic effects in humans.",
    bullets: [
      {
        title: "Collagen & GAG synthesis",
        description:
          "Dose-dependent stimulation of collagen (types I & III) and glycosaminoglycan synthesis in cultured dermal fibroblasts (Maquart et al., 1988).",
      },
      {
        title: "“Balanced” matrix remodeling",
        description:
          "Modulation of matrix metalloproteinases (e.g., MMP-2) — clearing damaged matrix while supporting new synthesis.",
      },
      {
        title: "Copper-dependent enzyme activity",
        description:
          "Influence on lysyl oxidase (collagen/elastin crosslinking); the copper center is integral.",
      },
      {
        title: "Anti-inflammatory / antioxidant signaling",
        description:
          "Downregulation of TNF-α and IL-6; modulation of antioxidant enzymes (e.g., SOD) in wound models.",
      },
    ],
    diagram: {
      root: "GHK-Cu / Cu tripeptide",
      branches: [
        { node: "Collagen / GAG synthesis", outcome: "ECM buildup" },
        { node: "MMP modulation", outcome: "Balanced remodeling" },
        { node: "Lysyl oxidase (Cu-dep.)", outcome: "Collagen crosslinking" },
        { node: "↓TNF-α/IL-6, ↑SOD", outcome: "Anti-inflam. / antioxidant" },
      ],
    },
    caption:
      "Proposed pathways investigated in preclinical (in-vitro / animal) models. Schematic only; not a claim of established human effect.",
  },

  "tb-500": {
    sectionTitle: "Mechanisms studied in preclinical models",
    intro:
      "Thymosin β4 is the principal intracellular G-actin–sequestering molecule in eukaryotic cells, regulating the actin cytoskeleton that governs cell shape, motility and migration. TB-500 (its active region) has been studied in preclinical tissue-repair research across wound-healing, cardiovascular, corneal and musculoskeletal models since the late 1990s–2000s. Findings below derive from animal and cell-culture systems. They are not established effects in humans.",
    bullets: [
      {
        title: "Actin sequestration (foundational)",
        description:
          "High-affinity 1:1 binding to monomeric G-actin (reported Kd ≈ 0.5–0.7 µM), influencing polymerization and cell migration.",
      },
      {
        title: "Cell migration & re-epithelialization",
        description:
          "Promotes keratinocyte and fibroblast migration in preclinical wound models.",
      },
      {
        title: "Angiogenesis",
        description:
          "Endothelial migration and tubule formation; the LKKTET motif is implicated (mutation reduces activity).",
      },
      {
        title: "Anti-inflammatory modulation",
        description:
          "NF-κB-associated modulation of inflammatory signaling in injury models.",
      },
    ],
    diagram: {
      root: "TB-500 / Tβ4 fragment",
      branches: [
        { node: "G-actin sequestration", outcome: "Cell migration" },
        { node: "Endothelial migration", outcome: "Angiogenesis" },
        { node: "Re-epithelialization", outcome: "Wound closure (model)" },
        { node: "NF-κB modulation", outcome: "Anti-inflammatory" },
      ],
    },
    caption:
      "Proposed pathways investigated in preclinical (animal / in-vitro) models. Schematic only; not a claim of established human effect.",
  },

  "mots-c": {
    sectionTitle: "Mechanisms studied in preclinical models",
    intro:
      "First described by Lee et al. (2015), MOTS-c helped establish that the mitochondrial genome encodes signaling peptides — reframing mitochondria from passive energy suppliers to active participants in cellular communication. Research since has focused on metabolic regulation, exercise adaptation, and stress response. Findings below derive from cell-culture and animal systems. They are not established effects in humans.",
    bullets: [
      {
        title: "AMPK activation (central mechanism)",
        description:
          "Reported to act indirectly by inhibiting the folate cycle and de novo purine synthesis, raising AICAR and activating AMPK — distinct from direct AMPK activators.",
      },
      {
        title: "Glucose handling",
        description:
          "Enhanced glucose flux and GLUT4-associated uptake in skeletal muscle models; reduced glucose levels in treated mice.",
      },
      {
        title: "Fatty-acid oxidation & mitochondrial biogenesis",
        description:
          "ACC phosphorylation and PGC-1α-associated adaptations reported in animal models.",
      },
      {
        title: "Nuclear translocation",
        description:
          "Under metabolic stress, MOTS-c has been reported to move to the nucleus and influence nuclear gene expression.",
      },
      {
        title: "Exercise interaction",
        description:
          "Reported synergy with exercise intervention on PGC-1α expression and insulin resistance via AMPK signaling in mice.",
      },
    ],
    diagram: {
      root: "MOTS-c / mito-derived peptide",
      branches: [
        {
          node: "Folate / purine cycle → AMPK ↑",
          outcome: "GLUT4 → glucose uptake; fatty-acid oxidation; PGC-1α / biogenesis",
        },
        { node: "Nuclear translocation", outcome: "Stress-adaptive gene expression" },
      ],
    },
    caption:
      "Proposed pathways investigated in preclinical (in-vitro / animal) models. Schematic only; not a claim of established human effect.",
  },

  "nad-plus": {
    sectionTitle: "Established biochemical roles",
    intro:
      "NAD⁺ is not a novel research compound — it is fundamental, well-characterized cellular biochemistry described since the early 20th century. Contemporary research interest centres on the observation that tissue NAD⁺ concentrations decline with age, and on whether raising them alters aging-associated outcomes.",
    bullets: [
      {
        title: "Redox cofactor",
        description:
          "The NAD⁺/NADH couple carries electrons through glycolysis, the TCA cycle and oxidative phosphorylation — central to ATP production.",
      },
      {
        title: "Sirtuin substrate",
        description:
          "Required by the SIRT1–SIRT7 deacylases that regulate gene expression and stress responses.",
      },
      {
        title: "PARP substrate",
        description:
          "Consumed by poly(ADP-ribose) polymerases during DNA strand-break repair.",
      },
      {
        title: "CD38 and turnover",
        description:
          "NAD⁺-consuming enzymes contribute to the age-associated decline in tissue NAD⁺.",
      },
      {
        title: "Biosynthesis",
        description:
          "Generated via the salvage pathway (from nicotinamide), the Preiss-Handler pathway (from nicotinic acid), and de novo from tryptophan via kynurenine.",
      },
    ],
    diagram: {
      root: "NAD⁺ / coenzyme",
      branches: [
        { node: "Redox (NAD⁺/NADH)", outcome: "Electron transport → ATP" },
        { node: "Sirtuins (SIRT1–7)", outcome: "Deacylation / gene regulation" },
        { node: "PARP enzymes", outcome: "DNA strand-break repair" },
        { node: "CD38 / consumption", outcome: "Turnover — declines with age" },
      ],
    },
    caption:
      "Established biochemical roles of NAD⁺ in cellular metabolism. Schematic. These are textbook enzymology, distinct from claims about supplementation outcomes.",
  },

  tesamorelin: {
    sectionTitle: "Mechanism",
    intro:
      "Developed by Theratechnologies (Montreal), tesamorelin is mechanistically distinct from exogenous growth hormone: it acts upstream at the pituitary GHRH receptor to stimulate the body's own GH secretion, preserving pulsatile physiological signaling rather than replacing the hormone directly.",
    bullets: [
      {
        title: "GHRH receptor agonism",
        description:
          "Binds GHRH receptors on the anterior pituitary with high affinity, stimulating endogenous growth hormone secretion.",
      },
      {
        title: "Downstream IGF-1",
        description: "Increased GH raises insulin-like growth factor 1 (IGF-1).",
      },
      {
        title: "DPP-IV resistance",
        description:
          "The N-terminal trans-3-hexenoic acid modification protects against dipeptidyl peptidase-IV cleavage, extending half-life relative to unmodified GHRH (reported ≈26 min vs ≈12 min for sermorelin).",
      },
      {
        title: "Adipose effects studied",
        description:
          "In clinical trials the studied outcome was reduction of visceral adipose tissue, distinct from general weight loss.",
      },
      {
        title: "Requires intact pituitary axis",
        description:
          "Because it acts upstream, activity depends on a functional hypothalamic-pituitary response.",
      },
    ],
    diagram: {
      root: "Tesamorelin / GHRH analogue",
      branches: [
        { node: "Pituitary GHRH receptor → Endogenous GH release", outcome: "IGF-1 ↑" },
        {
          node: "DPP-IV resistance (N-terminal hexenoyl group)",
          outcome: "Extended half-life vs unmodified GHRH",
        },
        { node: "Visceral adipose tissue", outcome: "Studied clinical outcome" },
      ],
    },
    caption:
      "Established mechanism of action for the tesamorelin molecule. Schematic. Research-grade material supplied here is for in-vitro laboratory use only.",
  },

  "cjc-1295-ipamorelin": {
    sectionTitle: "Constituents",
    intro:
      "Findings below derive from preclinical and component-level research and pertain to each compound studied individually. They are not established effects in humans for this blend.",
    bullets: [
      {
        title: "CJC-1295 — GHRH-R binding",
        description: "Binds the GHRH receptor on anterior pituitary somatotrophs.",
      },
      {
        title: "CJC-1295 — cAMP signaling",
        description:
          "G-protein activation raising cAMP, priming vesicles for GH exocytosis.",
      },
      {
        title: "CJC-1295 — DPP-IV resistance",
        description: "Substitutions confer resistance to DPP-IV degradation.",
      },
      {
        title: "CJC-1295 — DAC extension",
        description:
          "DAC formulation binds serum albumin, sustaining stimulation over days.",
      },
      {
        title: "Ipamorelin — GHS-R1a agonism",
        description:
          "Agonist at the ghrelin receptor (GHS-R1a) in hypothalamus and pituitary.",
      },
      {
        title: "Ipamorelin — calcium signaling",
        description: "Gq / phospholipase C / IP₃ signaling raising intracellular calcium.",
      },
      {
        title: "Ipamorelin — granule release",
        description: "Calcium-mediated granule release triggers the acute GH pulse.",
      },
      {
        title: "Ipamorelin — receptor selectivity",
        description:
          "Selective — minimal cortisol, prolactin or ACTH elevation versus GHRP-2 / GHRP-6 / hexarelin.",
      },
    ],
    diagram: {
      root: "CJC-1295 + Ipamorelin / dual-pathway blend",
      branches: [
        {
          node: "CJC-1295 → GHRH-R → cAMP ↑ (primes vesicles)",
          outcome: "Somatotroph → Pulsatile GH release → IGF-1",
        },
        {
          node: "Ipamorelin → GHS-R1a → Ca²⁺ ↑ (triggers exocytosis)",
          outcome: "Somatotroph → Pulsatile GH release → IGF-1",
        },
      ],
    },
    caption:
      "Dual-pathway convergence on the somatotroph. GHRH-receptor signaling raises cAMP and primes secretory vesicles; ghrelin-receptor signaling raises intracellular calcium and triggers release. Schematic; not a claim of established human effect for this blend.",
  },

  "5-amino-1mq": {
    sectionTitle: "Mechanism and preclinical findings",
    intro:
      "NNMT catalyses the methylation of nicotinamide using S-adenosylmethionine (SAM) as methyl donor, producing 1-methylnicotinamide and SAH. It therefore sits at the intersection of two pathways: it consumes nicotinamide (a NAD⁺ precursor) and it consumes SAM (the cell's principal methyl donor). Inhibiting it is a way to probe both simultaneously. All findings below derive from cell-culture and rodent models. There are no human data.",
    bullets: [
      {
        title: "NNMT inhibition",
        description:
          "Blocks the methylation drain on nicotinamide and SAM, with reported downstream effects on NAD⁺ salvage and methyl-donor availability.",
      },
      {
        title: "Adipocyte models",
        description:
          "In 3T3-L1 preadipocyte culture, reported to inhibit differentiation and reduce lipid accumulation across a micromolar concentration range.",
      },
      {
        title: "Diet-induced obesity models",
        description:
          "Neelakantan et al. (2019) reported reduced weight gain, decreased fat mass and smaller adipocytes in high-fat-diet mice without differences in food intake — mechanistically distinct from appetite-mediated compounds.",
      },
      {
        title: "Metabolic parameters",
        description:
          "Improved glucose tolerance and insulin sensitivity reported in obese rodent models.",
      },
      {
        title: "Tissue context",
        description:
          "NNMT is highly expressed in white adipose tissue and liver, and elevated expression has been observed in obese adipose tissue — the rationale for adipose as the primary research target.",
      },
    ],
    diagram: {
      root: "5-Amino-1MQ / NNMT inhibitor",
      branches: [
        { node: "Nicotinamide preserved", outcome: "NAD⁺ salvage pathway" },
        { node: "Adipocyte biology", outcome: "Lipogenesis ↓ (mouse models)" },
        { node: "SAM pool preserved", outcome: "Methyl-donor availability" },
      ],
    },
    caption:
      "Proposed mechanism investigated in preclinical (in-vitro / rodent) models. Schematic only; not a claim of established human effect.",
  },

  // BPC-157 + TB-500 combination product. Unlike KLOW/GLOW (which use a shared "Constituent
  // Reference" blend format with no combined diagram), this PDF bundles the two compounds' full,
  // separate reference documents back to back — each with its own complete "Mechanisms studied
  // in preclinical models" section and diagram, identical in content to the standalone BPC-157
  // and TB-500 documents. The entry below merges both into one combined bullet list / diagram so
  // it fits this schema; bullet titles are prefixed with the constituent name for clarity.
  "bpc-157-tb-500": {
    sectionTitle: "Mechanisms studied in preclinical models",
    intro:
      "This combination product bundles two individually documented peptides. BPC-157 has been investigated in published preclinical research since the early 1990s across tissue-repair, gastrointestinal, vascular and neurological models, and is frequently characterized as notably stable in aqueous and acidic conditions. TB-500 (thymosin β4's active region) has been studied in preclinical tissue-repair research across wound-healing, cardiovascular, corneal and musculoskeletal models since the late 1990s–2000s. Findings below derive from animal and cell-culture systems for each compound studied individually; they are not established effects in humans.",
    bullets: [
      {
        title: "BPC-157 — Angiogenesis via VEGFR2 signaling",
        description:
          "Endothelial responses reported through the VEGFR2–Akt–eNOS axis (Hsieh et al.).",
      },
      {
        title: "BPC-157 — Nitric oxide (NO) system modulation",
        description:
          "Interaction with the Src–caveolin-1–eNOS pathway; magnitude and direction remain under active debate in the 2025 literature.",
      },
      {
        title: "BPC-157 — Growth-hormone receptor (GHR) upregulation",
        description:
          "Increased GHR expression and downstream JAK2 signaling in tendon fibroblast cultures.",
      },
      {
        title: "BPC-157 — FAK–paxillin and ERK1/2 signaling",
        description: "Implicated in cell-migration and tissue-repair models.",
      },
      {
        title: "BPC-157 — Anti-inflammatory modulation",
        description: "Reduced pro-inflammatory cytokines in injury models.",
      },
      {
        title: "TB-500 — Actin sequestration (foundational)",
        description:
          "High-affinity 1:1 binding to monomeric G-actin (reported Kd ≈ 0.5–0.7 µM), influencing polymerization and cell migration.",
      },
      {
        title: "TB-500 — Cell migration & re-epithelialization",
        description:
          "Promotes keratinocyte and fibroblast migration in preclinical wound models.",
      },
      {
        title: "TB-500 — Angiogenesis",
        description:
          "Endothelial migration and tubule formation; the LKKTET motif is implicated (mutation reduces activity).",
      },
      {
        title: "TB-500 — Anti-inflammatory modulation",
        description: "NF-κB-associated modulation of inflammatory signaling in injury models.",
      },
    ],
    diagram: {
      root: "BPC-157 + TB-500 / two-peptide combination",
      branches: [
        { node: "BPC-157 — VEGFR2 → Akt → eNOS → NO", outcome: "Angiogenesis" },
        { node: "BPC-157 — FAK–paxillin", outcome: "Cell migration" },
        { node: "BPC-157 — GHR / JAK2", outcome: "Fibroblast signaling" },
        { node: "BPC-157 — ↓ TNF / cytokines", outcome: "Anti-inflammatory" },
        { node: "TB-500 — G-actin sequestration", outcome: "Cell migration" },
        { node: "TB-500 — Endothelial migration", outcome: "Angiogenesis" },
        { node: "TB-500 — Re-epithelialization", outcome: "Wound closure (model)" },
        { node: "TB-500 — NF-κB modulation", outcome: "Anti-inflammatory" },
      ],
    },
    caption:
      "Proposed pathways investigated in preclinical (animal / in-vitro) models, for each constituent studied individually. Schematic only; not a claim of established human effect for this combination.",
  },

  // GLOW is a three-peptide blend (GHK-Cu, BPC-157, TB-500). Like KLOW, its section 02
  // ("Constituent Reference") documents each constituent individually — each with its own short
  // mechanism bullet list — but there is no unified mechanism narrative or flow diagram for the
  // blend as a whole. Section 03 ("The Blend Question") explicitly states combination behavior
  // is uncharacterized. Needs a fallback.
  glow: null,

  semax: {
    sectionTitle: "Mechanisms studied in preclinical models",
    intro:
      "Semax has been investigated since the 1980s–1990s, predominantly by Russian research groups, in neuroprotection, cerebral ischemia and cognition models. The C-terminal Pro-Gly-Pro extension distinguishes it from the parent ACTH fragment by conferring greater metabolic stability. Findings below derive from animal and cell-culture systems. They are not established effects in humans.",
    bullets: [
      {
        title: "BDNF / TrkB modulation",
        description:
          "Dolotov et al. (2006) reported increased BDNF protein and TrkB phosphorylation, with elevated exon III BDNF and trkB mRNA, in rat hippocampus.",
      },
      {
        title: "Neurotrophin gene expression",
        description:
          "Rapid, gene- and region-specific changes in neurotrophin expression reported in rat brain.",
      },
      {
        title: "Ischemia models",
        description:
          "Activation of neurotrophic factor expression and modulation of VEGF-A mRNA in frontal cortex and hippocampus in cerebral ischemia models; reduced infarct volume reported.",
      },
      {
        title: "Monoaminergic modulation",
        description: "Reported effects on dopaminergic, serotonergic and cholinergic systems.",
      },
      {
        title: "Melanocortin receptor interaction",
        description:
          "Described in the literature as an MC4 receptor antagonist while lacking ACTH corticotropic activity.",
      },
    ],
    diagram: {
      root: "Semax / ACTH(4–10) analogue",
      branches: [
        { node: "BDNF ↑ / TrkB ↑", outcome: "Synaptic plasticity (model)" },
        { node: "Neurotrophin genes", outcome: "Region-specific expression" },
        { node: "Monoamine systems", outcome: "Dopaminergic / serotonergic" },
        { node: "VEGF-A mRNA", outcome: "Ischemia models" },
      ],
    },
    caption:
      "Proposed pathways investigated in preclinical (animal / in-vitro) models. Schematic only; not a claim of established human effect.",
  },

  selank: {
    sectionTitle: "Mechanisms studied in preclinical models",
    intro:
      "Selank has been studied predominantly by Russian and Eastern European research groups since the 1990s, in anxiety, cognition and immune-signaling models. Its tuftsin origin gives it a dual research profile spanning both CNS and peripheral immune activity — unusual among neuroactive peptides. Findings below derive from animal and cell-culture systems. They are not established effects in humans.",
    bullets: [
      {
        title: "GABAergic modulation",
        description:
          "Described in the literature as acting on GABA binding / receptor affinity rather than as a direct receptor agonist.",
      },
      {
        title: "BDNF regulation",
        description:
          "Kolik et al. (2019) reported Selank (0.3 mg/kg IP, 7 days) prevented memory and attention impairment during alcohol withdrawal in rats and prevented ethanol-induced BDNF elevation in hippocampus and prefrontal cortex.",
      },
      {
        title: "Gene-expression effects",
        description:
          "Kolomin et al. (2010) reported a single intranasal dose produced measurable gene-expression changes in both rat hippocampus and spleen — consistent with dual CNS/immune activity.",
      },
      {
        title: "Behavioral models",
        description:
          "Seregin et al. reported anxiolytic activity in elevated plus-maze models without motor impairment or sedation.",
      },
      {
        title: "Monoaminergic & enkephalin systems",
        description:
          "Reported modulation of serotonergic signaling and enkephalin metabolism.",
      },
    ],
    diagram: {
      root: "Selank / tuftsin analogue",
      branches: [
        { node: "GABAergic modulation", outcome: "Anxiolytic behavior (model)" },
        { node: "BDNF expression", outcome: "Hippocampus / cortex" },
        { node: "Enkephalin metabolism", outcome: "Peptidase modulation" },
        { node: "Immune signaling", outcome: "Tuftsin-derived activity" },
      ],
    },
    caption:
      "Proposed pathways investigated in preclinical (animal / in-vitro) models. Schematic only; not a claim of established human effect.",
  },
};
