import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ siteId: string; slug: string }> },
) {
  const { siteId, slug } = await params;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      `id, title, slug, excerpt, content_html, featured_image_url, featured_image_alt,
       published_at, reading_time_minutes, is_featured, tags,
       author:profiles!author_id(full_name, name, avatar_url)`,
    )
    .eq("site_id", siteId)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const author = data.author as Record<string, unknown> | null;
  const post = {
    id: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt || null,
    contentHtml: data.content_html || null,
    featuredImageUrl: data.featured_image_url || null,
    featuredImageAlt: data.featured_image_alt || null,
    publishedAt: data.published_at || null,
    readingTimeMinutes: data.reading_time_minutes || 0,
    isFeatured: data.is_featured || false,
    tags: data.tags || [],
    authorName: author
      ? (author.full_name as string) || (author.name as string) || null
      : null,
    authorAvatarUrl: author ? (author.avatar_url as string) || null : null,
  };

  // Fetch categories
  const { data: catLinks } = await supabase
    .from("blog_post_categories")
    .select("category:blog_categories(id, name, slug, color)")
    .eq("post_id", post.id);

  const categories = catLinks
    ? catLinks
        .map(
          (l) =>
            l.category as unknown as {
              id: string;
              name: string;
              slug: string;
              color: string;
            },
        )
        .filter(Boolean)
    : [];

  return NextResponse.json({ ...post, categories });
}
