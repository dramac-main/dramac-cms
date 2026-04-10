"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// ============================================
// TYPES
// ============================================

export interface PublicBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  authorName: string | null;
  authorAvatarUrl: string | null;
  publishedAt: string | null;
  readingTimeMinutes: number;
  isFeatured: boolean;
  categories: { id: string; name: string; slug: string; color: string }[];
  tags: string[];
}

export interface BlogListingOptions {
  featured?: boolean;
  category?: string;
  limit?: number;
  page?: number;
}

// ============================================
// HELPERS
// ============================================

function mapPostRecord(row: Record<string, unknown>): PublicBlogPost {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    excerpt: (row.excerpt as string) || null,
    contentHtml: (row.content_html as string) || null,
    featuredImageUrl: (row.featured_image_url as string) || null,
    featuredImageAlt: (row.featured_image_alt as string) || null,
    authorName: (row.author_name as string) || null,
    authorAvatarUrl: (row.author_avatar_url as string) || null,
    publishedAt: (row.published_at as string) || null,
    readingTimeMinutes: (row.reading_time_minutes as number) || 0,
    isFeatured: (row.is_featured as boolean) || false,
    categories: [],
    tags: (row.tags as string[]) || [],
  };
}

// ============================================
// PUBLIC API (no auth needed)
// ============================================

/**
 * Get published blog posts for a site (public, no auth)
 */
export async function getPublishedPosts(
  siteId: string,
  options: BlogListingOptions = {},
): Promise<{ posts: PublicBlogPost[]; total: number }> {
  const { featured, category, limit = 20, page = 1 } = options;
  const supabase = createAdminClient();
  const offset = (page - 1) * limit;

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
    console.error("[BlogAPI] getPublishedPosts error:", error);
    return { posts: [], total: 0 };
  }

  // Fetch author info separately (blog_posts has author_id FK to profiles)
  const posts = (data || []).map(mapPostRecord);

  // If category filter, we need to filter by join
  if (category && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { data: catLinks } = await supabase
      .from("blog_post_categories")
      .select("post_id, category:blog_categories(id, name, slug, color)")
      .in("post_id", postIds);

    if (catLinks) {
      const catMap = new Map<string, PublicBlogPost["categories"]>();
      for (const link of catLinks) {
        const cat = link.category as unknown as {
          id: string;
          name: string;
          slug: string;
          color: string;
        };
        if (!cat) continue;
        const list = catMap.get(link.post_id) || [];
        list.push(cat);
        catMap.set(link.post_id, list);
      }
      for (const post of posts) {
        post.categories = catMap.get(post.id) || [];
      }
    }
  } else if (posts.length > 0) {
    // Fetch categories for all posts
    const postIds = posts.map((p) => p.id);
    const { data: catLinks } = await supabase
      .from("blog_post_categories")
      .select("post_id, category:blog_categories(id, name, slug, color)")
      .in("post_id", postIds);

    if (catLinks) {
      const catMap = new Map<string, PublicBlogPost["categories"]>();
      for (const link of catLinks) {
        const cat = link.category as unknown as {
          id: string;
          name: string;
          slug: string;
          color: string;
        };
        if (!cat) continue;
        const list = catMap.get(link.post_id) || [];
        list.push(cat);
        catMap.set(link.post_id, list);
      }
      for (const post of posts) {
        post.categories = catMap.get(post.id) || [];
      }
    }
  }

  return { posts, total: count || 0 };
}

/**
 * Get a single published post by slug (public, no auth)
 */
export async function getPublishedPost(
  siteId: string,
  slug: string,
): Promise<PublicBlogPost | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      `id, title, slug, excerpt, content_html, featured_image_url, featured_image_alt,
       published_at, reading_time_minutes, is_featured, tags`,
    )
    .eq("site_id", siteId)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;

  const post = mapPostRecord(data);

  // Fetch categories
  const { data: catLinks } = await supabase
    .from("blog_post_categories")
    .select("category:blog_categories(id, name, slug, color)")
    .eq("post_id", post.id);

  if (catLinks) {
    post.categories = catLinks
      .map(
        (l) =>
          l.category as unknown as {
            id: string;
            name: string;
            slug: string;
            color: string;
          },
      )
      .filter(Boolean);
  }

  return post;
}

/**
 * Get related posts (same categories, excluding current post)
 */
export async function getRelatedPosts(
  siteId: string,
  postId: string,
  limit = 3,
): Promise<PublicBlogPost[]> {
  const supabase = createAdminClient();

  // Get categories of the current post
  const { data: currentCats } = await supabase
    .from("blog_post_categories")
    .select("category_id")
    .eq("post_id", postId);

  if (!currentCats || currentCats.length === 0) {
    // No categories — return latest posts excluding current
    const { data } = await supabase
      .from("blog_posts")
      .select(
        `id, title, slug, excerpt, featured_image_url, featured_image_alt,
         published_at, reading_time_minutes, is_featured, tags`,
      )
      .eq("site_id", siteId)
      .eq("status", "published")
      .neq("id", postId)
      .order("published_at", { ascending: false })
      .limit(limit);

    return (data || []).map(mapPostRecord);
  }

  const catIds = currentCats.map((c) => c.category_id);

  // Find posts that share categories
  const { data: relatedIds } = await supabase
    .from("blog_post_categories")
    .select("post_id")
    .in("category_id", catIds)
    .neq("post_id", postId);

  if (!relatedIds || relatedIds.length === 0) {
    const { data } = await supabase
      .from("blog_posts")
      .select(
        `id, title, slug, excerpt, featured_image_url, featured_image_alt,
         published_at, reading_time_minutes, is_featured, tags`,
      )
      .eq("site_id", siteId)
      .eq("status", "published")
      .neq("id", postId)
      .order("published_at", { ascending: false })
      .limit(limit);

    return (data || []).map(mapPostRecord);
  }

  const uniqueIds = [...new Set(relatedIds.map((r) => r.post_id))];

  const { data } = await supabase
    .from("blog_posts")
    .select(
      `id, title, slug, excerpt, featured_image_url, featured_image_alt,
       published_at, reading_time_minutes, is_featured, tags`,
    )
    .eq("site_id", siteId)
    .eq("status", "published")
    .in("id", uniqueIds)
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data || []).map(mapPostRecord);
}

/**
 * Check if a site has any published blog posts
 */
export async function getSiteBlogInfo(
  siteId: string,
): Promise<{ postCount: number; hasPosts: boolean }> {
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("blog_posts")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("status", "published");

  return {
    postCount: count || 0,
    hasPosts: (count || 0) > 0,
  };
}
