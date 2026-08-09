// scripts/publish-blog-posts.js
// Run with: node --env-file=.env.local scripts/publish-blog-posts.js
//
// One-off script: publishes the 5 finished Research Journal posts from
// "Blog drafts.md" directly to WordPress via the core REST API
// (wp-json/wp/v2/posts). Blog content lives entirely in WordPress, not in
// this repo (see app/api/blog/route.ts) — this is the only way to publish
// a post short of the wp-admin UI. Uses a WP Application Password, not the
// WooCommerce consumer key/secret (those can't auth against /wp/v2/*).
//
// The 6th piece in the drafts doc ("Operational Discipline / How We Test")
// is intentionally excluded — it's flagged internally as not publish-ready
// ("HOLD PENDING INPUT", "Confirm before publishing") and its confirmed
// content (3 independent assays, not the placeholder "6x") already lives in
// components/HowWeTestSection.tsx on the homepage.

const WP_URL = "https://anvilcompounds.shop";
const USERNAME = process.env.WP_ADMIN_USERNAME;
const APP_PASSWORD = process.env.WP_APPLICATION_PASSWORD;

if (!USERNAME || !APP_PASSWORD) {
  console.error("Missing env vars. Run with: node --env-file=.env.local scripts/publish-blog-posts.js");
  process.exit(1);
}

const auth = "Basic " + Buffer.from(`${USERNAME}:${APP_PASSWORD}`).toString("base64");

async function apiFetch(path, options = {}, retries = 2) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${WP_URL}${path}`, {
        ...options,
        headers: { Authorization: auth, "Content-Type": "application/json", ...options.headers },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${data.message || JSON.stringify(data)}`);
      return data;
    } catch (err) {
      if (attempt >= retries) throw err;
      console.warn(`  retrying after error: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function getOrCreateCategory(name, slug) {
  const found = await apiFetch(`/wp-json/wp/v2/categories?search=${encodeURIComponent(name)}&per_page=100`);
  const existing = found.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.id;
  const created = await apiFetch(`/wp-json/wp/v2/categories`, {
    method: "POST",
    body: JSON.stringify({ name, slug }),
  });
  return created.id;
}

function paragraphs(lines) {
  return lines.map((p) => `<p>${p}</p>`).join("\n");
}

const CHECKLIST = `
<p>Here's the check, and it takes about thirty seconds:</p>
<ol>
  <li>Find the verification link or reference number on the COA. If there isn't one, stop. An unverifiable COA is just a picture.</li>
  <li>Follow the link. Confirm it goes to the testing lab's own domain, not back to the vendor's site, not to a hosted PDF the vendor controls.</li>
  <li>Enter the reference number. The certificate should load from the lab's database.</li>
  <li>Compare it against the COA on the product page. Purity, identity, endotoxin, and lot number should match exactly. Any discrepancy is the answer to your question.</li>
  <li>Match the lot number on the certificate to the lot number printed on the vial you received. Those have to be identical, too.</li>
</ol>
`;

const POSTS = [
  {
    title: "Real COAs should be easy to check—the fake COA problem in the research market",
    slug: "fake-coa-problem-research-market",
    category: "Research Standards",
    excerpt:
      "A COA is only as trustworthy as the database it verifies against. Here's the 30-second check that separates a real lab result from a convincing document.",
    content:
      paragraphs([
        "I've seen the whole range. A COA that's a screenshot of another lab's report with the compound name changed. A stock chromatogram pulled off the internet and dropped under a fresh purity number. A \"99.4%\" was typed into a template that was never connected to any actual test. All of these look convincing on a product page, because a COA is judged on whether it looks official, and looking official is trivial.",
        "So if the document itself can't be trusted, what can?",
        "The answer is the part the vendor doesn't control: the lab's own public database.",
        "Independent testing labs like Freedom Diagnostics and Janoshik publish their results to a searchable public database. When they issue a certificate, it goes into that database under the lab's own reference number. Every legitimate COA from these labs carries a verification link or a reference number that points back to that entry. You click the link or enter the reference, and the certificate loads directly from the lab's system, not from our or any other vendor's website, not from a file the vendor uploaded, but from the database the lab maintains.",
        "That's the whole test. It's the difference between a vendor showing you a document and a vendor pointing you to a record they can't edit.",
      ]) +
      CHECKLIST +
      paragraphs([
        "If a vendor can't survive that check, no purity number they publish means anything, because you have no way to confirm the number was ever produced by a real test.",
        "Every COA on an Anvil product page links to Freedom Diagnostics' public database. The lot number on the page matches the lot number on the certificate, which matches the number printed on the vial in your order. None of it depends on you trusting our word; the verification goes somewhere we don't control, which is exactly why it's worth anything.",
        "The vendors who fabricate COAs are counting on one thing: that you'll look at the document and never check the source. The entire value of independent verification is that you don't have to take anyone's word for it. So don't. Check.",
      ]) +
      `\n<hr>\n<p><strong>Verify any lot at anvilcompounds.shop</strong><br>COA numbers on every product page · Freedom Diagnostics public-database verified</p>`,
  },
  {
    title: "The theory that aging isn't damage — it's lost information",
    slug: "aging-lost-information-theory",
    category: "The Science",
    excerpt:
      "A growing body of research suggests aging isn't just cellular damage accumulating — it may be the loss of the epigenetic information that tells cells who they're supposed to be.",
    content:
      paragraphs([
        "For most of the last century, the scientific story of aging was a story about damage. Cells accumulate wear over time. DNA takes hits. Oxidative stress builds up. Proteins misfold, tissues stiffen, systems wear down. Aging, in this telling, is entropy catching up with you, the slow physical breakdown of a machine that's been running too long.",
        "It's an intuitive model. It's also, according to a growing line of research, incomplete.",
        "A newer theory has been gaining traction: what if a large part of aging isn't damage to the hardware at all, but loss of information?",
        "Here's the idea. Every cell in your body carries the same DNA, the same complete instruction manual. What makes a skin cell a skin cell and a nerve cell a nerve cell isn't the manual; it's which pages each cell is reading. That layer of control, which genes are switched on, which are switched off, in which cell, at which time, is the epigenome. It's the annotation on top of the DNA that tells each cell who it's supposed to be.",
        "The theory is that over time, cells start losing track of those annotations. The instructions are still there. The DNA is intact. But the cell's ability to read the right instructions in the right pattern degrades. Picture a vast library where every book is still on the shelf, still perfectly printed, but the catalog system slowly scrambles, and cells increasingly pull the wrong volume. The information isn't destroyed. Access to it is.",
        "If that's right, it reframes the whole question. Damage you clean up. Lost information you'd have to restore, a fundamentally different kind of problem, and one some researchers think may be more reversible than decades of wear.",
        "The most provocative evidence that aging is more flexible than the damage model suggests comes from animals that barely seem to follow the rules. Consider the naked mole rat: a small, subterranean rodent that lives past thirty years, roughly ten times longer than a mouse of similar size. It shows unusually low rates of cancer and holds onto function far longer than its body size predicts. For decades, researchers have tried to isolate the one thing that explains it: the DNA, the metabolism, the stress handling. The current thinking is that there probably isn't one thing. Naked mole rats appear to run several biological maintenance systems in parallel, each preserving cellular function over time.",
        "That's where the research has moved: away from hunting for a single cause of aging and toward understanding the systems that keep cellular information and function intact. DNA repair. Protein quality control. Metabolic resilience. The molecular housekeeping that lets a cell keep reading the right pages.",
        "Some of the molecules studied in that context are the signals cells use to respond to stress and maintain energy balance — for example, NAD+, a coenzyme central to DNA repair and mitochondrial function, and mitochondrial-derived peptides like MOTS-c, which researchers study for their role in how cells adapt to metabolic stress.",
        "The bigger takeaway from the naked mole rat, and from the information theory of aging generally, is a shift in posture. Aging may be less a fixed countdown and more a maintenance problem, and maintenance problems, unlike the passage of time, are the kind of thing science can sometimes do something about.",
      ]) +
      `\n<hr>\n<p>Follow the Anvil Research Journal for more on the biology most people never hear about.</p>`,
  },
  {
    title: "Scientists found peptides hiding inside mitochondria. Nobody knew they existed",
    slug: "mitochondrial-derived-peptides-discovery",
    category: "The Science",
    excerpt:
      "Mitochondria carry their own small genome, and hidden inside it are instructions for signaling peptides nobody knew existed until recently. The powerhouse of the cell turns out to also be a messenger.",
    content:
      paragraphs([
        "If you remember one thing from high school biology, it's probably this: mitochondria are the powerhouse of the cell. They make energy. End of story.",
        "That sentence is true. It's also, it turns out, about half of what mitochondria actually do — and the half we understood first has been quietly overshadowed by the half we're still discovering.",
        "For most of the twentieth century, mitochondria were treated as tiny power plants and not much else. They take in nutrients and oxygen, run the chemistry that produces ATP, the molecule that fuels almost every process in the body, and that was the job description. Important, well-understood, closed case.",
        "Then researchers started noticing that mitochondria were doing things a power plant has no business doing. They were involved in inflammation. In stress responses. Whether a cell lived or died. How cells adapt to exercise. Mitochondria weren't just supplying energy to the rest of the cell — they were talking to it, and to the rest of the body, sending signals that shaped how cells behaved.",
        "The most surprising discovery came from looking at the mitochondria's own DNA.",
        "Mitochondria are unusual among the structures inside your cells: they carry their own small, separate genome, a leftover from an ancient evolutionary past when they were independent organisms. For a long time, scientists thought that the little genome coded for a short, fully catalogued list of components — a handful of genes, all accounted for.",
        "They were wrong. Hidden within mitochondrial DNA, researchers found instructions for small signaling molecule peptides that nobody knew were there. These mitochondrial-derived peptides weren't structural parts of the power plant. They were messengers, produced by the mitochondria and released to influence processes elsewhere in the body.",
        "The discovery cracked open a genuinely new field. It reframed the mitochondrion from a passive supplier into an active communicator, an organelle that monitors the cell's condition and broadcasts signals about metabolism, stress, and energy balance. Molecules nobody knew existed a few decades ago are now studied as part of how the body coordinates its response to changing conditions.",
        "One of the most studied of these mitochondrial-derived peptides is MOTS-c, which researchers investigate for its role in how cells respond to metabolic stress and maintain energy balance.",
        "What makes this one of the more compelling turns in modern cell biology is how recent it is. This isn't settled textbook material from fifty years ago. Scientists are still mapping how these signals work, what triggers their release, and what else the mitochondrial genome might be hiding. The powerhouse metaphor isn't wrong. It's just that the power plant, it turns out, has been sending messages the whole time, and we're only now learning to read them.",
      ]) +
      `\n<hr>\n<p>Follow the Anvil Research Journal for more on the biology most people never hear about.</p>`,
  },
  {
    title: "Your body starts repairing an injury before you feel it",
    slug: "how-the-body-repairs-injury",
    category: "The Science",
    excerpt:
      "By the time an injury registers as pain, the body has already launched a coordinated, multi-system repair response. A look at what's actually happening beneath a wound.",
    content:
      paragraphs([
        "Cut yourself, and by the time your brain registers the pain, the repair has already started. The delay between the injury and the feeling is enough for a biological chain reaction to begin, one that most people never think about, because it runs entirely without them.",
        "We tend to imagine healing as simple. Something breaks, the body patches it, and the patch fades to a scar. But the actual process is one of the most complicated coordinated events biology knows how to run, and \"patch it\" badly undersells what's happening.",
        "The moment tissue is damaged, cells at the site release chemical signals, an alarm broadcast into the surrounding tissue. Blood vessels respond by changing their behavior, becoming more permeable so that reinforcements can reach the area. Immune cells arrive to clear debris and guard against infection. And then the rebuilding begins: cells migrate toward the damage, new blood vessels form, and the scaffolding that holds tissue together, the extracellular matrix, gets torn down and reassembled in the right shape.",
        "None of that is one process. It's dozens, overlapping and timed against each other. Cell migration. Growth factor signaling. Matrix remodeling. Inflammatory signaling has to switch on to start the response and switch off at the right moment so it doesn't cause its own damage. Get the timing wrong in either direction and healing stalls or overshoots.",
        "Which raises a question researchers have chased for a long time: how does a cell three layers away \"know\" there's damage nearby, and know to move toward it? The answer lives in the chemical signaling gradients of molecules that tell cells where the injury is, which direction to travel, and what to do when they arrive. The body isn't patching a hole. It's running a logistics operation.",
        "The most vivid way to see how much room there is in this system is to look at animals that heal in ways we can't. A salamander can regrow an entire limb, including bone, muscle, nerve, and skin, correctly arranged from the stump of an amputation. A human, given the same injury, forms a scar. Same broad biological toolkit, dramatically different outcomes. Understanding why some animals rebuild while others seal over is one of the questions that makes regeneration research so active.",
        "The deeper researchers go, the less healing looks like fixing a broken machine and the more it looks like coordinating a city — thousands of cells, multiple systems, precise timing, all converging on a single site without central instruction.",
        "Within that field, some of the molecules researchers study for their role in cell migration, tissue repair, and matrix remodeling pathways include peptides like BPC-157 and TB-500, which come up frequently in tissue-repair research.",
        "The takeaway is a change in how you see your own body. What feels like passive recovery — you got hurt, you waited, it got better — is in fact millions of coordinated repair decisions being made every second, most of them finished before you were even aware there was anything to fix.",
      ]) +
      `\n<hr>\n<p>Follow the Anvil Research Journal for more on the biology most people never hear about.</p>`,
  },
  {
    title: "Skin biology is more interesting than skincare marketing",
    slug: "skin-biology-vs-skincare-marketing",
    category: "The Science",
    excerpt:
      "Skin is a five-pound, self-renewing organ running constant signaling and structural maintenance — a far more interesting story than anything printed on a jar.",
    content:
      paragraphs([
        "Your body has an organ that weighs close to five pounds, covers roughly twenty square feet, and rebuilds itself continuously for your entire life. Most people never think of it as an organ at all.",
        "It's your skin, and the reason it gets so little credit as a piece of biology is that an entire industry has spent decades talking about it as a surface to be treated rather than a system to be understood. The marketing version of skin is about appearance. The biology of skin is considerably stranger and more interesting.",
        "Start with the fact that skin is never static. It's in a constant state of turnover, shedding dead cells from the outer layer and replacing them from below, maintaining a barrier that holds water in and keeps the outside world out. That barrier is doing real work every second, regulating temperature, blocking pathogens, sensing pressure, heat, and damage. It's less a wrapper and more an active, sensing, self-renewing interface between you and everything else.",
        "Underneath the surface is the structural story, and it centers on a protein called collagen. Collagen is the scaffolding that gives skin its firmness and structure, a dense, organized network that holds everything in place. Alongside it sits the rest of the extracellular matrix, the material cells build and maintain to give tissue its shape and strength. When people talk about skin \"aging,\" what they're often describing is changes in this underlying architecture: collagen production slowing, the matrix remodeling less efficiently, the organized scaffolding becoming less organized.",
        "So what actually happens inside a wrinkle? Not a surface event. A wrinkle is the visible result of changes deeper down in how skin cells communicate, how much structural protein they produce, and how well the matrix beneath them holds its shape. The line you see on top is the readout of biology happening well below it.",
        "That communication layer is where a lot of the interesting research lives. As skin ages, the signaling between its cells becomes less efficient. The molecular messages that coordinate repair, structure, and renewal don't fire the way they once did. Researchers studying skin biology are increasingly focused on that signaling: how cells coordinate collagen production, how the matrix is remodeled, and how those processes change over time.",
        "And the most interesting discoveries in this area aren't happening at a cosmetics counter. They're happening in molecular biology labs, where skin is treated as a signaling system rather than a canvas. One molecule that's drawn significant attention in that context is GHK-Cu, a naturally occurring copper-binding peptide that researchers study for its role in cellular signaling and tissue-remodeling research.",
        "The point isn't that skincare marketing is wrong so much as that it's shallow; it stops at the surface, literally. The actual biology of the largest organ you own is a story about structure, signaling, and continuous self-renewal, and it's far more compelling than anything printed on a jar.",
      ]) +
      `\n<hr>\n<p>Follow the Anvil Research Journal for more on the biology most people never hear about.</p>`,
  },
];

async function main() {
  console.log("Resolving categories...");
  const categoryIds = {
    "Research Standards": await getOrCreateCategory("Research Standards", "research-standards"),
    "The Science": await getOrCreateCategory("The Science", "the-science"),
  };
  console.log("Category IDs:", categoryIds);

  for (const post of POSTS) {
    console.log(`\nPublishing: ${post.title}`);
    const created = await apiFetch(`/wp-json/wp/v2/posts`, {
      method: "POST",
      body: JSON.stringify({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        status: "publish",
        categories: [categoryIds[post.category]],
      }),
    });
    console.log(`  -> id ${created.id} | ${created.link}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
