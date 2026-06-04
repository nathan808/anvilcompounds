import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { PostCard } from "@/app/api/blog/route";

export const metadata: Metadata = {
  title: "Research Journal — Anvil Compounds",
  description:
    "Perspectives on research compound verification, testing standards, and the peptide market.",
};

async function getPosts(): Promise<PostCard[]> {
  try {
    const base =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
    const res = await fetch(`${base}/api/blog`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.posts) ? data.posts : [];
  } catch {
    return [];
  }
}

function PostCard({ post }: { post: PostCard }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col glass-card rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-600/10 hover:-translate-y-1 transition-all duration-500"
    >
      {/* Featured image */}
      <div className="relative w-full h-52 bg-navy-800 overflow-hidden shrink-0">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center mesh-bg opacity-60">
            <span className="font-mono text-[10px] text-blue-400/30 tracking-[0.3em] uppercase">
              Research Journal
            </span>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="flex flex-col flex-grow p-6">
        {/* Category + date */}
        <div className="flex items-center gap-3 mb-3">
          {post.categories[0] && (
            <span className="font-mono text-[10px] text-blue-400 tracking-[0.2em] uppercase">
              {post.categories[0]}
            </span>
          )}
          <span className="text-white/20 text-xs">·</span>
          <span className="font-mono text-[10px] text-white/30 tracking-wider">
            {post.date}
          </span>
        </div>

        {/* Title */}
        <h2 className="font-display font-700 text-white text-lg leading-snug mb-3 group-hover:text-blue-300 transition-colors duration-300 line-clamp-3">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="font-body text-sm text-white/45 leading-relaxed line-clamp-2 flex-grow">
          {post.excerpt}
        </p>

        {/* Read more */}
        <div className="flex items-center gap-2 mt-4 font-mono text-xs text-blue-400/70 group-hover:text-blue-400 transition-colors duration-300">
          <span>Read more</span>
          <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="col-span-1 md:col-span-3 flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-px bg-blue-600/40 mb-6 mx-auto" />
      <p className="font-mono text-xs text-blue-400/60 tracking-[0.25em] uppercase mb-3">
        Coming Soon
      </p>
      <p className="font-body text-white/30 text-sm max-w-sm">
        Research Journal posts are being prepared. Check back shortly.
      </p>
    </div>
  );
}

export default async function BlogIndexPage() {
  const posts = await getPosts();

  return (
    <>
      <Navbar />
      <main className="bg-navy-950 min-h-screen pt-24">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">

          {/* Page header */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-6 h-px bg-blue-600" />
              <span className="font-mono text-xs text-blue-400 tracking-[0.25em] uppercase">
                Anvil Compounds
              </span>
            </div>
            <h1
              className="font-display font-800 text-white mb-4"
              style={{ fontSize: "clamp(2.8rem, 5vw, 4.5rem)", lineHeight: 0.95 }}
            >
              Research
              <br />
              <span className="text-blue-400">Journal</span>
            </h1>
            <p className="font-body text-white/45 text-lg max-w-xl leading-relaxed">
              Perspectives on research compound verification, testing standards,
              and the peptide market.
            </p>
          </div>

          {/* Post grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.length > 0
              ? posts.map((post) => <PostCard key={post.id} post={post} />)
              : <EmptyState />
            }
          </div>

          {/* Footer compliance */}
          <div className="mt-16 pt-8 border-t border-white/5 text-center">
            <p className="font-mono text-[9px] text-white/20 tracking-wide leading-relaxed">
              Anvil Compounds products are intended solely for laboratory and investigational use.
              We do not market, sell, or promote products for human or veterinary consumption,
              therapeutic use, or clinical application. Must be 21+ to purchase.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
