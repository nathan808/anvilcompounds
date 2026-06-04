import { NextResponse } from "next/server";

const WP_URL = "https://anvilcompounds.shop";

export interface PostCard {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  featuredImage: string | null;
  categories: string[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const featuredImage =
    featuredMedia[0] ? ((featuredMedia[0].source_url as string) ?? null) : null;

  const termGroups = (embedded["wp:term"] ?? []) as Record<string, unknown>[][];
  const categories = (termGroups[0] ?? [])
    .map((t) => (t.name as string) ?? "")
    .filter(Boolean);

  return {
    id:           p.id as number,
    slug:         p.slug as string,
    title:        stripHtml((p.title as { rendered: string }).rendered),
    excerpt:      stripHtml((p.excerpt as { rendered: string }).rendered),
    date:         formatDate(p.date as string),
    featuredImage,
    categories,
  };
}

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/posts?_embed&per_page=20&orderby=date&order=desc&status=publish`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ posts: [] });
    const raw = (await res.json()) as Record<string, unknown>[];
    return NextResponse.json({ posts: raw.map(mapPost) });
  } catch {
    return NextResponse.json({ posts: [] });
  }
}
