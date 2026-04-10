import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { DEFAULT_LOCALE } from "@/lib/locale-config";
// Create a Supabase admin client for public blog access (no auth cookies)
function getSupabaseClient() {
  return createAdminClient();
}

async function getSiteBySubdomain(subdomain: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("subdomain", subdomain)
    .eq("published", true)
    .single();

  if (error) {
    console.error("[PublicBlog] getSiteBySubdomain error:", error.message, {
      subdomain,
    });
  }

  return data;
}

async function getPostBySlug(siteId: string, slug: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      `
      *,
      author:profiles(full_name, avatar_url),
      categories:blog_post_categories(
        category:blog_categories(id, name, slug, color)
      )
    `,
    )
    .eq("site_id", siteId)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    console.error("[PublicBlog] getPostBySlug error:", error.message, {
      siteId,
      slug,
    });
  }

  return data;
}

async function getRelatedPosts(siteId: string, postId: string, limit = 3) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, featured_image_url, published_at")
    .eq("site_id", siteId)
    .eq("status", "published")
    .neq("id", postId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[PublicBlog] getRelatedPosts error:", error.message, {
      siteId,
    });
  }

  return data || [];
}

export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  const site = await getSiteBySubdomain(subdomain);

  if (!site) {
    notFound();
  }

  const post = await getPostBySlug(site.id, slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(site.id, post.id);

  const author = post.author as {
    full_name: string;
    avatar_url?: string;
  } | null;
  const categoriesRaw =
    (post.categories as Array<{
      category: { name: string; slug: string; color: string };
    }>) || [];
  const categories = categoriesRaw.filter((c) => c.category);

  return (
    <article className="max-w-3xl mx-auto py-12 px-4">
      {/* Back link */}
      <Link
        href={`/blog/${subdomain}`}
        className="inline-flex items-center text-sm mb-8 transition-colors"
        style={{ color: "var(--muted-foreground, #6b7280)" }}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to blog
      </Link>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {categories.map((c, i) => (
            <Badge
              key={i}
              variant="secondary"
              style={{
                backgroundColor: `${c.category.color}20`,
                color: c.category.color,
              }}
            >
              {c.category.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Title */}
      <h1
        className="text-4xl font-bold mb-4 leading-tight"
        style={{ fontFamily: "var(--font-display, inherit)" }}
      >
        {post.title}
      </h1>

      {/* Meta */}
      <div
        className="flex items-center gap-4 mb-8"
        style={{ color: "var(--muted-foreground, #6b7280)" }}
      >
        <div className="flex items-center gap-3">
          {author?.avatar_url ? (
            <Image
              src={author.avatar_url}
              alt={author.full_name || "Author"}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                backgroundColor: "var(--muted, #e5e7eb)",
                color: "var(--muted-foreground, #6b7280)",
              }}
            >
              {(author?.full_name || "U").charAt(0)}
            </div>
          )}
          <div>
            <p
              className="font-medium"
              style={{ color: "var(--foreground, #111827)" }}
            >
              {author?.full_name || "Unknown Author"}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span>
                {new Date(
                  String(post.published_at || post.created_at || new Date()),
                ).toLocaleDateString(DEFAULT_LOCALE, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <span>{post.reading_time_minutes || 1} min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image_url && (
        <div className="relative aspect-[2/1] mb-8 rounded-xl overflow-hidden">
          <Image
            src={post.featured_image_url}
            alt={post.featured_image_alt || post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="blog-prose prose prose-lg max-w-none prose-headings:font-bold prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: post.content_html || "" }}
      />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div
          className="mt-12 pt-8"
          style={{ borderTop: "1px solid var(--border, #e5e7eb)" }}
        >
          <p
            className="text-sm mb-3"
            style={{ color: "var(--muted-foreground, #6b7280)" }}
          >
            Tags:
          </p>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div
          className="mt-12 pt-8"
          style={{ borderTop: "1px solid var(--border, #e5e7eb)" }}
        >
          <h2
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: "var(--font-display, inherit)" }}
          >
            Related Posts
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                href={`/blog/${subdomain}/${relatedPost.slug}`}
                className="group"
              >
                {relatedPost.featured_image_url && (
                  <div className="relative aspect-[3/2] mb-3 rounded-lg overflow-hidden">
                    <Image
                      src={relatedPost.featured_image_url}
                      alt={relatedPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 250px"
                    />
                  </div>
                )}
                <h3
                  className="font-medium transition-colors line-clamp-2"
                  style={{ fontFamily: "var(--font-display, inherit)" }}
                >
                  {relatedPost.title}
                </h3>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--muted-foreground, #6b7280)" }}
                >
                  {new Date(
                    String(relatedPost.published_at || new Date()),
                  ).toLocaleDateString(DEFAULT_LOCALE, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  const site = await getSiteBySubdomain(subdomain);
  if (!site) return { title: "Post Not Found" };

  const post = await getPostBySlug(site.id, slug);
  if (!post) return { title: "Post Not Found" };

  const ogImages = [];
  if (post.og_image_url) {
    ogImages.push(post.og_image_url);
  } else if (post.featured_image_url) {
    ogImages.push(post.featured_image_url);
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    keywords: post.meta_keywords || post.tags,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author?.full_name || "Unknown"],
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: ogImages,
    },
    alternates: {
      canonical: post.canonical_url || undefined,
    },
  };
}
