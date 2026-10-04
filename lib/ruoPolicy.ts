import { LEGAL_ENTITY_NAME, BUSINESS_ADDRESS, BUSINESS_PHONE, BUSINESS_EMAIL } from "@/lib/siteConfig";

// Research Use Only policy. Served by app/legal/[slug] when WordPress has no
// "ruo-policy" page of its own (a WordPress page with that slug takes precedence).
export const RUO_POLICY_TITLE = "RUO Policy";
export const RUO_POLICY_UPDATED = "2026-10-03";

export const RUO_POLICY_HTML = `
<h2>Scope</h2>
<p>All products sold by ${LEGAL_ENTITY_NAME} ("Anvil Compounds") are supplied for <strong>in vitro laboratory and research use only</strong>. They are not drugs, dietary supplements, cosmetics, or food, and they have not been evaluated by the Food and Drug Administration. They are not intended to diagnose, treat, cure, or prevent any disease.</p>

<h2>Purchaser eligibility</h2>
<p>By placing an order you represent that:</p>
<ul>
  <li>you are at least 21 years of age;</li>
  <li>you are a qualified researcher, or are affiliated with a research institution or laboratory; and</li>
  <li>you are purchasing for a legitimate research purpose.</li>
</ul>

<h2>Prohibited uses</h2>
<p>Products may not be used in or on humans or animals, and may not be used for any veterinary, therapeutic, diagnostic, clinical, cosmetic, or nutritional purpose. Products may not be ingested, injected, inhaled, or applied topically, and may not be incorporated into any food, drink, or consumer product. Resale for any of these uses is prohibited.</p>

<h2>Attestation requirement</h2>
<p>Access to the product catalog requires a research-use and affiliation attestation, and every order requires you to confirm at checkout that the products are for research use only. We may decline or cancel any order where these requirements are not met or where we reasonably believe a product will be used contrary to this policy.</p>

<h2>No claims</h2>
<p>Anvil Compounds makes no claims about the safety, efficacy, or legality of any compound for human or animal use. Information on this site is provided for reference only and is not medical advice.</p>

<h2>Questions</h2>
<p>${LEGAL_ENTITY_NAME}<br />${BUSINESS_ADDRESS}<br />${BUSINESS_PHONE}<br /><a href="mailto:${BUSINESS_EMAIL}">${BUSINESS_EMAIL}</a></p>
`;
