import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const featured = searchParams.get("featured") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const offset = (page - 1) * limit;

  const supabase = createAdminClient();

  let query = supabase
    .from("blog_posts")
    .select(
      `id, title, slug, excerpt, featured_image_url, featured_image_alt,
       published_at, reading_time_minutes, is_featured, tags`,
      { count: "exact" },
    )
    .eq("site_id", siteId)
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (featured) {
    query = query.eq("is_featured", true);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ posts: [], total: 0 }, { status: 500 });
  }

  const posts = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || null,
    featuredImageUrl: row.featured_image_url || null,
    featuredImageAlt: row.featured_image_alt || null,
    publishedAt: row.published_at || null,
    readingTimeMinutes: row.reading_time_minutes || 0,
    isFeatured: row.is_featured || false,
    tags: row.tags || [],
  }));

  return NextResponse.json({
    posts,
    total: count || 0,
    page,
    limit,
  });
}
