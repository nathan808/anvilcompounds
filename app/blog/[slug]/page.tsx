import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { PostFull } from "@/app/api/blog/[slug]/route";
import type { PostCard } from "@/app/api/blog/route";

const BASE_URL =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getPost(slug: string): Promise<PostFull | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/blog/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getAllPosts(): Promise<PostCard[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/blog`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Static generation ────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Post not found — Anvil Compounds" };

  return {
    title:       `${post.title} — Anvil Compounds`,
    description: post.excerpt.slice(0, 160),
    openGraph: {
      title:       post.title,
      description: post.excerpt.slice(0, 160),
      type:        "article",
      publishedTime: post.date,
      images:      post.featuredImage ? [{ url: post.featuredImage }] : [],
    },
    twitter: {
      card:        "summary_large_image",
      title:       post.title,
      description: post.excerpt.slice(0, 160),
      images:      post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-px bg-blue-600" />
      <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
        {label}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const [post, allPosts] = await Promise.all([
    getPost(params.slug),
    getAllPosts(),
  ]);

  if (!post) notFound();

  // Related posts: same category, excluding current post, max 3
  const related = allPosts
    .filter(
      (p) =>
        p.slug !== post.slug &&
        p.categories.some((c) => post.categories.includes(c))
    )
    .slice(0, 3);

  // If not enough same-category posts, pad with any other posts
  const relatedPadded = related.length < 3
    ? [
        ...related,
        ...allPosts
          .filter((p) => p.slug !== post.slug && !related.find((r) => r.slug === p.slug))
          .slice(0, 3 - related.length),
      ]
    : related;

  return (
    <>
      <Navbar />
      <main className="bg-navy-950 min-h-screen pt-24">
        <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />

        <article className="relative z-10">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <header className="max-w-3xl mx-auto px-6 pt-12 pb-8">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-mono text-xs text-blue-400/60 hover:text-blue-400 transition-colors mb-8 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Research Journal
            </Link>

            {/* Category + date */}
            <div className="flex items-center gap-3 mb-5">
              {post.categories[0] && (
                <span className="font-mono text-[10px] text-blue-400 tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/20">
                  {post.categories[0]}
                </span>
              )}
              <span className="font-mono text-xs text-white/30 tracking-wider">
                {post.date}
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-display font-800 text-white leading-[1.05] mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              {post.title}
            </h1>

            {/* Excerpt / lead */}
            <p className="font-body text-white/55 text-lg leading-relaxed">
              {post.excerpt}
            </p>
          </header>

          {/* ── Featured image ───────────────────────────────────────────────── */}
          {post.featuredImage && (
            <div className="max-w-4xl mx-auto px-6 mb-10">
              <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden">
                <Image
                  src={post.featuredImage}
                  alt={post.featuredImageAlt || post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* ── Post body ────────────────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-6 mb-16">
            <div
              className="prose-anvil"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* ── Author block ─────────────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-6 mb-16">
            <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
              {/* Logo mark */}
              <div className="relative w-12 h-12 shrink-0">
                <div className="absolute inset-0 rounded bg-blue-600 rotate-45" />
                <div className="absolute inset-[3px] rounded bg-navy-950 rotate-45" />
                <div className="absolute inset-[5px] rounded bg-blue-600/80 rotate-45" />
              </div>
              <div>
                <p className="font-display font-700 text-white">Anvil Compounds</p>
                <p className="font-mono text-xs text-white/35 tracking-wider mt-0.5">
                  Research-grade compounds. Independently verified.
                </p>
              </div>
            </div>
          </div>

          {/* ── RUO disclaimer ───────────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-6 mb-16">
            <div className="rounded-xl bg-blue-600/5 border border-blue-600/15 px-5 py-4">
              <p className="font-mono text-[10px] text-white/35 tracking-wide leading-relaxed">
                All compounds referenced in this article are sold for in vitro laboratory
                research purposes only. Not for human or veterinary use. Must be 21+ to purchase.
              </p>
            </div>
          </div>

          {/* ── Related posts ────────────────────────────────────────────────── */}
          {relatedPadded.length > 0 && (
            <div className="max-w-7xl mx-auto px-6 mb-16">
              <SectionLabel label="More from the Journal" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {relatedPadded.map((p) => (
                  <Link
                    key={p.id}
                    href={`/blog/${p.slug}`}
                    className="glass-card rounded-2xl p-6 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-600/10 hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    {p.categories[0] && (
                      <span className="font-mono text-[9px] text-blue-400/70 tracking-[0.2em] uppercase block mb-2">
                        {p.categories[0]}
                      </span>
                    )}
                    <h3 className="font-display font-700 text-white text-sm leading-snug mb-2 group-hover:text-blue-300 transition-colors line-clamp-3">
                      {p.title}
                    </h3>
                    <span className="font-mono text-[10px] text-white/25 tracking-wider">
                      {p.date}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Back link bottom ─────────────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto px-6 pb-16 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-mono text-xs text-blue-400/60 hover:text-blue-400 transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Research Journal
            </Link>
          </div>

          {/* ── Footer compliance ────────────────────────────────────────────── */}
          <div className="border-t border-white/5 py-8">
            <p className="text-center font-mono text-[9px] text-white/20 tracking-wide leading-relaxed max-w-2xl mx-auto px-6">
              Anvil Compounds products are intended solely for laboratory and investigational use.
              We do not market, sell, or promote products for human or veterinary consumption,
              therapeutic use, or clinical application. Must be 21+ to purchase.
            </p>
          </div>

        </article>
      </main>
      <Footer />
    </>
  );
}
