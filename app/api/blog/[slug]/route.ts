import { NextRequest, NextResponse } from "next/server";
import type { PostCard } from "@/app/api/blog/route";

const WP_URL = "https://anvilcompounds.shop";

export interface PostFull extends PostCard {
  content: string;
  author: string;
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

export const revalidate = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/wp/v2/posts?slug=${encodeURIComponent(params.slug)}&_embed&status=publish`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ post: null }, { status: 404 });

    const posts = (await res.json()) as Record<string, unknown>[];
    if (!posts.length) return NextResponse.json({ post: null }, { status: 404 });

    const p = posts[0];
    const embedded = (p._embedded ?? {}) as Record<string, unknown[]>;

    const featuredMedia = (embedded["wp:featuredmedia"] ?? []) as Record<string, unknown>[];
    const featuredImage =
      featuredMedia[0] ? ((featuredMedia[0].source_url as string) ?? null) : null;

    const termGroups = (embedded["wp:term"] ?? []) as Record<string, unknown>[][];
    const categories = (termGroups[0] ?? [])
      .map((t) => (t.name as string) ?? "")
      .filter(Boolean);

    const authors = (embedded["author"] ?? []) as Record<string, unknown>[];
    const author =
      authors[0] ? ((authors[0].name as string) ?? "Anvil Compounds") : "Anvil Compounds";

    const post: PostFull = {
      id:           p.id as number,
      slug:         p.slug as string,
      title:        stripHtml((p.title as { rendered: string }).rendered),
      excerpt:      stripHtml((p.excerpt as { rendered: string }).rendered),
      date:         formatDate(p.date as string),
      featuredImage,
      categories,
      content:      (p.content as { rendered: string }).rendered,
      author,
    };

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ post: null }, { status: 404 });
  }
}
