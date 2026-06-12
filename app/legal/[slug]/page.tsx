import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const revalidate = 86400;

// Maps clean URL slugs to WordPress page slugs
const WP_SLUG_MAP: Record<string, string> = {
  "privacy-policy":  "privacy-policy-page",
  "terms-of-use":    "terms-of-use-page",
  "cookie-policy":   "cookie-policy",
  "return-policy":   "return-policy",
  "shipping-policy": "shipping-policy",
};

interface WPPage {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  modified: string;
}

async function getPage(slug: string): Promise<WPPage | null> {
  const wpSlug = WP_SLUG_MAP[slug];
  if (!wpSlug) return null;
  try {
    const res = await fetch(
      `https://anvilcompounds.shop/wp-json/wp/v2/pages?slug=${wpSlug}&_fields=id,slug,title,content,modified`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const pages: WPPage[] = await res.json();
    return pages[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return Object.keys(WP_SLUG_MAP).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await getPage(params.slug);
  const title = page?.title.rendered ?? "Legal";
  return {
    title: `${title} — Anvil Compounds`,
    description: `${title} for Anvil Compounds research peptide products.`,
  };
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z#0-9]+;/gi, " ").trim();
}

export default async function LegalPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await getPage(params.slug);
  if (!page) notFound();

  const title = stripHtml(page.title.rendered);
  const lastUpdated = new Date(page.modified).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <Navbar />
      <main className="bg-navy-950 min-h-screen pt-24">
        <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />

        <article className="relative z-10 max-w-3xl mx-auto px-6 py-16">

          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs text-slate-400/60 hover:text-slate-400 transition-colors mb-10 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Anvil Compounds
          </Link>

          {/* Header */}
          <div className="mb-10 pb-8 border-b border-white/8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-slate-400 tracking-[0.25em] uppercase">
                Legal
              </span>
            </div>
            <h1 className="font-display font-800 text-white mb-3" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
              {title}
            </h1>
            <p className="font-mono text-xs text-white/25 tracking-wider">
              Last updated: {lastUpdated}
            </p>
          </div>

          {/* Page content from WordPress */}
          <div
            className="prose-anvil"
            dangerouslySetInnerHTML={{ __html: page.content.rendered }}
          />

          {/* Bottom nav */}
          <div className="mt-16 pt-8 border-t border-white/8 flex flex-wrap gap-4">
            {Object.entries({
              "Privacy Policy":  "privacy-policy",
              "Terms of Use":    "terms-of-use",
              "Cookie Policy":   "cookie-policy",
              "Return Policy":   "return-policy",
              "Shipping Policy": "shipping-policy",
            }).map(([label, s]) => (
              <Link
                key={s}
                href={`/legal/${s}`}
                className={`font-mono text-xs tracking-wider transition-colors ${
                  s === params.slug
                    ? "text-white/60 cursor-default pointer-events-none"
                    : "text-slate-400/50 hover:text-slate-400"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
