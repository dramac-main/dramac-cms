/**
 * Blog RSS Feed API Route
 *
 * Phase MKT-07: Generates XML RSS 2.0 feed for a site's blog posts.
 * Consumed by email newsletter automation, external subscribers,
 * and social media auto-posting tools.
 *
 * Route: /api/blog/[siteId]/rss
 * Public route — returns XML RSS feed
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ITEMS = 50;
const BASE_DOMAIN =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || "sites.dramacagency.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const supabase = createAdminClient();

  // Fetch site info for feed metadata
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, subdomain, custom_domain, custom_domain_verified")
    .eq("id", siteId)
    .single();

  if (siteError || !site) {
    return new NextResponse("<rss><channel><title>Not Found</title></channel></rss>", {
      status: 404,
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  }

  const host =
    site.custom_domain && site.custom_domain_verified
      ? site.custom_domain
      : `${site.subdomain}.${BASE_DOMAIN}`;
  const siteUrl = `https://${host}`;
  const blogUrl = `${siteUrl}/blog`;

  // Fetch published posts
  const { data: posts, error: postsError } = await supabase
    .from("blog_posts")
    .select(
      `id, title, slug, excerpt, content_html, featured_image_url,
       published_at, tags,
       author:profiles!author_id(full_name, name)`,
    )
    .eq("site_id", siteId)
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(MAX_ITEMS);

  if (postsError) {
    return new NextResponse("<rss><channel><title>Error</title></channel></rss>", {
      status: 500,
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  }

  const items = (posts || []).map((post: Record<string, unknown>) => {
    const author = post.author as Record<string, unknown> | null;
    const authorName =
      (author?.full_name as string) || (author?.name as string) || "Unknown";
    const tags = (post.tags as string[]) || [];
    const postUrl = `${blogUrl}/${post.slug}`;
    const excerpt = (post.excerpt as string) || "";
    const contentHtml = (post.content_html as string) || "";

    // Use excerpt for description, fall back to first 300 chars of content
    const description = excerpt || stripHtmlForRss(contentHtml).slice(0, 300);

    return buildItem({
      title: post.title as string,
      link: postUrl,
      description,
      author: authorName,
      pubDate: new Date(post.published_at as string).toUTCString(),
      guid: postUrl,
      categories: tags,
      imageUrl: (post.featured_image_url as string) || null,
    });
  });

  const rssXml = buildRssFeed({
    title: `${site.name} Blog`,
    link: blogUrl,
    description: `Latest posts from ${site.name}`,
    language: "en",
    lastBuildDate: new Date().toUTCString(),
    items,
    feedUrl: `${siteUrl}/api/blog/${siteId}/rss`,
  });

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ============================================================================
// RSS XML BUILDERS
// ============================================================================

interface RssFeedParams {
  title: string;
  link: string;
  description: string;
  language: string;
  lastBuildDate: string;
  items: string[];
  feedUrl: string;
}

function buildRssFeed(params: RssFeedParams): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(params.title)}</title>
    <link>${escapeXml(params.link)}</link>
    <description>${escapeXml(params.description)}</description>
    <language>${params.language}</language>
    <lastBuildDate>${params.lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(params.feedUrl)}" rel="self" type="application/rss+xml"/>
    <generator>DRAMAC CMS</generator>
${params.items.join("\n")}
  </channel>
</rss>`;
}

interface RssItemParams {
  title: string;
  link: string;
  description: string;
  author: string;
  pubDate: string;
  guid: string;
  categories: string[];
  imageUrl: string | null;
}

function buildItem(params: RssItemParams): string {
  const categoryTags = params.categories
    .map((cat) => `      <category>${escapeXml(cat)}</category>`)
    .join("\n");

  const imagePart = params.imageUrl
    ? `\n      <media:content url="${escapeXml(params.imageUrl)}" medium="image"/>`
    : "";

  return `    <item>
      <title>${escapeXml(params.title)}</title>
      <link>${escapeXml(params.link)}</link>
      <description>${escapeXml(params.description)}</description>
      <author>${escapeXml(params.author)}</author>
      <pubDate>${params.pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(params.guid)}</guid>
${categoryTags}${imagePart}
    </item>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtmlForRss(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
