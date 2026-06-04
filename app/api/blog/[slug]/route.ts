import { NextRequest, NextResponse } from "next/server";

const WP_URL = "https://anvilcompounds.shop";

export interface PostFull {
  id: number;
  slug: string;
  title: string;
  content: string;          // raw HTML from WordPress
  excerpt: string;          // plain text
  date: string;             // formatted
  featuredImage: string | null;
  featuredImageAlt: string;
  categories: string[];
  categoryIds: number[];
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

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/posts?_embed&slug=${encodeURIComponent(params.slug)}&status=publish`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch post" }, { status: 502 });
    }

    const posts = await res.json() as Record<string, unknown>[];
    if (!posts.length) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const p = posts[0];
    const embedded = (p._embedded ?? {}) as Record<string, unknown[]>;

    const featuredMedia = (embedded["wp:featuredmedia"] ?? []) as Record<string, unknown>[];
    const featuredImage = featuredMedia[0]
      ? (featuredMedia[0].source_url as string | null) ?? null
      : null;
    const featuredImageAlt = featuredMedia[0]
      ? (featuredMedia[0].alt_text as string) ?? ""
      : "";

    const termGroups = (embedded["wp:term"] ?? []) as Record<string, unknown>[][];
    const categoryTerms = termGroups[0] ?? [];
    const categories = categoryTerms.map((t) => (t.name as string) ?? "").filter(Boolean);

    const post: PostFull = {
      id:              p.id as number,
      slug:            p.slug as string,
      title:           stripHtml((p.title as { rendered: string }).rendered),
      content:         (p.content as { rendered: string }).rendered,
      excerpt:         stripHtml((p.excerpt as { rendered: string }).rendered),
      date:            formatDate(p.date as string),
      featuredImage,
      featuredImageAlt,
      categories,
      categoryIds:     (p.categories as number[]) ?? [],
    };

    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
