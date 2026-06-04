import { NextResponse } from "next/server";

const WP_URL = "https://anvilcompounds.shop";

export interface PostCard {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  featuredImage: string | null;
  featuredImageAlt: string;
  categories: string[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function mapPost(p: Record<string, unknown>): PostCard {
  const embedded = (p._embedded ?? {}) as Record<string, unknown[]>;

  const featuredMedia = (embedded["wp:featuredmedia"] ?? []) as Record<string, unknown>[];
  const featuredImage = featuredMedia[0]
    ? (featuredMedia[0].source_url as string | null) ?? null
    : null;
  const featuredImageAlt = featuredMedia[0]
    ? (featuredMedia[0].alt_text as string) ?? ""
    : "";

  const termGroups = (embedded["wp:term"] ?? []) as Record<string, unknown>[][];
  const categories = (termGroups[0] ?? []).map(
    (t) => (t.name as string) ?? ""
  ).filter(Boolean);

  return {
    id:               p.id as number,
    slug:             p.slug as string,
    title:            stripHtml((p.title as { rendered: string }).rendered),
    excerpt:          stripHtml((p.excerpt as { rendered: string }).rendered),
    date:             formatDate(p.date as string),
    featuredImage,
    featuredImageAlt,
    categories,
  };
}

export async function GET() {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/posts?_embed&per_page=20&orderby=date&order=desc&status=publish`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 502 });
    }

    const posts = await res.json() as Record<string, unknown>[];
    return NextResponse.json(posts.map(mapPost));
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
