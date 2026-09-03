"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { faqs, type FaqItem } from "@/lib/faqData";

// ─── FAQ accordion (unchanged from the old FAQ page) ──────────────────────────

function AccordionItem({
  item,
  isOpen,
  onToggle,
  globalIndex,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  globalIndex: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (globalIndex % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 ${
        isOpen ? "border-mock-cobaltLight/40 shadow-lg shadow-mock-cobalt/10" : "hover:border-mock-cobalt/25"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`shrink-0 w-0.5 h-6 rounded-full transition-all duration-300 ${
              isOpen ? "bg-mock-cobaltLight" : "bg-mock-cobalt/30 group-hover:bg-mock-cobalt/60"
            }`}
          />
          <span
            className={`font-body text-sm md:text-base leading-snug transition-colors duration-200 ${
              isOpen ? "text-white" : "text-white/85 group-hover:text-white/95"
            }`}
          >
            {item.q}
          </span>
        </div>

        <div
          className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? "border-mock-cobaltLight/50 bg-mock-cobalt/20 rotate-180"
              : "border-white/15 group-hover:border-mock-cobalt/30"
          }`}
        >
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`w-3 h-3 transition-colors duration-200 ${
              isOpen ? "text-mock-cobaltLight" : "text-white/40"
            }`}
          >
            <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-6 pb-6 pl-[calc(1.5rem+0.125rem+1rem)]">
              <p className="font-body text-[#AEBBD0] text-sm leading-relaxed">{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CategoryGroup({
  category,
  items,
  openId,
  setOpenId,
  baseIndex,
}: {
  category: string;
  items: FaqItem[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  baseIndex: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div className="mb-12">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -16 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-4 mb-5"
      >
        <div className="w-4 h-px bg-mock-cobalt/50" />
        <span className="font-mono text-xs text-mock-cobaltLight tracking-[0.22em] uppercase">
          {category}
        </span>
        <div className="flex-1 h-px bg-mock-cobalt/10" />
      </motion.div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const id = `${category}-${i}`;
          return (
            <AccordionItem
              key={id}
              item={item}
              isOpen={openId === id}
              onToggle={() => setOpenId(openId === id ? null : id)}
              globalIndex={baseIndex + i}
            />
          );
        })}
      </div>
    </div>
  );
}

function FaqTab() {
  const [openId, setOpenId] = useState<string | null>(null);

  const offsets: number[] = [];
  let counter = 0;
  for (const group of faqs) {
    offsets.push(counter);
    counter += group.items.length;
  }

  return (
    <div className="max-w-3xl mx-auto px-6">
      {faqs.map((group, gi) => (
        <CategoryGroup
          key={group.category}
          category={group.category}
          items={group.items}
          openId={openId}
          setOpenId={setOpenId}
          baseIndex={offsets[gi]}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 p-7 rounded-2xl border border-mock-cobalt/20 bg-mock-cobalt/5 text-center"
      >
        <p className="font-body text-[#AEBBD0] text-sm mb-4">
          Still have questions? Reach out directly.
        </p>
        <a
          href="mailto:support@anvilcompounds.shop"
          className="inline-flex items-center gap-2 font-mono text-sm text-mock-cobaltLight hover:text-white transition-colors animated-underline"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
            <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
          </svg>
          support@anvilcompounds.shop
        </a>
      </motion.div>
    </div>
  );
}

// ─── Journal (moved from the old app/blog/page.tsx) ───────────────────────────

interface PostCardData {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  featuredImage: string | null;
  categories: string[];
}

function JournalPostCard({ post }: { post: PostCardData }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-mock-cobaltLight/40 hover:shadow-xl hover:shadow-mock-cobalt/10 hover:-translate-y-1 transition-all duration-500"
    >
      <div className="flex flex-col flex-grow p-6">
        <div className="flex items-center gap-3 mb-3">
          {post.categories[0] && (
            <span className="font-mono text-[10px] text-mock-cobaltLight tracking-[0.2em] uppercase">
              {post.categories[0]}
            </span>
          )}
          <span className="text-white/30 text-xs">·</span>
          <span className="font-mono text-[10px] text-white/55 tracking-wider">
            {post.date}
          </span>
        </div>

        <h2 className="font-heading font-700 text-[#EAF0FA] text-lg leading-snug mb-3 group-hover:text-mock-cobaltLight transition-colors duration-300 line-clamp-3">
          {post.title}
        </h2>

        <p className="font-body text-sm text-[#AEBBD0] leading-relaxed line-clamp-2 flex-grow">
          {post.excerpt}
        </p>

        <div className="flex items-center gap-2 mt-4 font-mono text-xs text-mock-cobaltLight/70 group-hover:text-mock-cobaltLight transition-colors duration-300">
          <span>Read more</span>
          <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
        </div>
      </div>
    </Link>
  );
}

// Hidden from the Journal listing per the store owner's request — posts
// tagged "The Science" still exist in WordPress (direct /blog/[slug] links
// and the sitemap are untouched), they just don't show up on this page.
const HIDDEN_CATEGORIES = new Set(["The Science"]);

function JournalTab() {
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        const all: PostCardData[] = Array.isArray(data.posts) ? data.posts : [];
        setPosts(all.filter((p) => !p.categories.some((c) => HIDDEN_CATEGORIES.has(c))));
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 h-56 animate-pulse" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <JournalPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-px bg-mock-cobalt/40 mb-6 mx-auto" />
          <p className="font-mono text-xs text-mock-cobaltLight tracking-[0.25em] uppercase mb-3">
            Coming Soon
          </p>
          <p className="font-body text-white/55 text-sm max-w-sm">
            Research Journal posts are being prepared. Check back shortly.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Tab = "journal" | "faq";

function LearnContent() {
  const searchParams = useSearchParams();
  const initialTab: Tab = searchParams.get("tab") === "faq" ? "faq" : "journal";
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <main className="bg-mock-graphite min-h-screen">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "clamp(300px, 42vh, 480px)" }}>
        <Image
          src="/images/hero-bg.jpeg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={90}
        />
        <div className="absolute inset-0 bg-white/25" />

        <div className="relative z-10 flex items-center justify-center h-full w-full pt-24 pb-12 md:pt-32 md:pb-20 px-4">
          <motion.div
            initial="hidden"
            animate="show"
            className="flex flex-col items-center text-center px-4 py-6"
            style={{ background: "radial-gradient(ellipse 80% 90% at 50% 50%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.18) 60%, transparent 100%)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-3 mb-5"
            >
              <div className="w-6 h-px bg-blue-500" />
              <span className="font-mono text-xs text-blue-600 tracking-[0.3em] uppercase">Learn</span>
              <div className="w-6 h-px bg-blue-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-800 text-gray-950 mb-5"
              style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)", textShadow: "0 1px 12px rgba(255,255,255,0.95)" }}
            >
              Research Journal{" "}
              <span style={{ color: "#1D6ADB" }}>& Questions</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22 }}
              className="font-body text-gray-700 text-base md:text-lg leading-relaxed max-w-xl"
            >
              Perspectives on verification and testing standards, plus everything
              you need to know about ordering and research use.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Tab switcher ─────────────────────────────────────────────────── */}
      <section className="bg-mock-graphite pt-10 md:pt-14">
        <div className="max-w-xs mx-auto px-6 mb-10 md:mb-14">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            {(["journal", "faq"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg font-display font-600 text-sm transition-all duration-200 ${
                  tab === t
                    ? "bg-mock-cobalt text-white shadow-lg shadow-mock-cobalt/20"
                    : "text-white/55 hover:text-white/80"
                }`}
              >
                {t === "journal" ? "Journal" : "FAQ"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <section className="bg-mock-graphite pb-12 md:pb-20">
        {tab === "journal" ? <JournalTab /> : <FaqTab />}

        <div className="max-w-3xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 text-center">
          <p className="font-mono text-[9px] text-white/50 tracking-wide leading-relaxed">
            Anvil Compounds products are intended solely for laboratory and investigational use.
            We do not market, sell, or promote products for human or veterinary consumption,
            therapeutic use, or clinical application. Must be 21+ to purchase.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function LearnPage() {
  return (
    <Suspense>
      <LearnContent />
    </Suspense>
  );
}
