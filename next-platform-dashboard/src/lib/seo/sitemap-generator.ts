/**
 * Sitemap Generator - Generate XML sitemaps for sites
 */

import { createClient } from "@supabase/supabase-js";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  images?: { loc: string; title?: string; caption?: string }[];
}

export interface SitemapOptions {
  siteId: string;
  baseUrl: string;
  changefreq?: string;
  includeImages?: boolean;
  includeBlogPosts?: boolean;
  excludePatterns?: string[];
}

/**
 * Generate a complete sitemap for a site
 */
export async function generateSitemap(
  siteId: string,
  baseUrl: string
): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const urls: SitemapUrl[] = [];

  // Get site settings
  const { data: site } = await supabase
    .from("sites")
    .select("sitemap_changefreq, sitemap_include_images")
    .eq("id", siteId)
    .single();

  const changefreq = (site?.sitemap_changefreq || "weekly") as SitemapUrl["changefreq"];
  const includeImages = site?.sitemap_include_images ?? true;

  // Get published pages (all pages are shown in sitemap when site is published)
  const { data: pages } = await supabase
    .from("pages")
    .select("slug, updated_at, robots_index, content, seo_image")
    .eq("site_id", siteId)
    .neq("robots_index", false);

  if (pages) {
    for (const page of pages) {
      // Skip pages that should not be indexed
      if (page.robots_index === false) continue;

      const isHomePage = page.slug === "home" || page.slug === "/";
      const url: SitemapUrl = {
        loc: `${baseUrl}${isHomePage ? "" : `/${page.slug}`}`,
        lastmod: page.updated_at,
        changefreq,
        priority: isHomePage ? 1.0 : 0.8,
      };

      // Extract images from content if enabled
      if (includeImages) {
        const images = extractImagesFromContent(page.content, page.seo_image);
        if (images.length > 0) {
          url.images = images.slice(0, 10); // Limit to 10 images per URL
        }
      }

      urls.push(url);
    }
  }

  // Get published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, featured_image_url, title")
    .eq("site_id", siteId)
    .eq("status", "published");

  if (posts && posts.length > 0) {
    // Add blog index page
    urls.push({
      loc: `${baseUrl}/blog`,
      changefreq: "daily",
      priority: 0.6,
    });

    for (const post of posts) {
      const url: SitemapUrl = {
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updated_at,
        changefreq: "monthly",
        priority: 0.7,
      };

      if (includeImages && post.featured_image_url) {
        url.images = [{ 
          loc: post.featured_image_url,
          title: post.title 
        }];
      }

      urls.push(url);
    }
  }

  // Generate XML
  return generateSitemapXml(urls);
}

/**
 * Extract images from page content
 */
function extractImagesFromContent(
  content: unknown,
  seoImage?: string | null
): { loc: string; title?: string }[] {
  const images: { loc: string; title?: string }[] = [];

  // Add SEO image first if available
  if (seoImage) {
    images.push({ loc: seoImage });
  }

  if (!content) return images;

  try {
    const contentStr = typeof content === "string" 
      ? content 
      : JSON.stringify(content);

    // Match image URLs
    const imageRegex = /https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|gif|webp)(\?[^\s"'<>]*)?/gi;
    const matches = contentStr.match(imageRegex) || [];

    for (const match of matches) {
      // Avoid duplicates
      if (!images.some((img) => img.loc === match)) {
        images.push({ loc: match });
      }
    }
  } catch {
    // Ignore parsing errors
  }

  return images;
}

/**
 * Generate sitemap XML string
 */
function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlsXml = urls
    .map((url) => {
      let urlXml = `  <url>
    <loc>${escapeXml(url.loc)}</loc>`;

      if (url.lastmod) {
        const date = new Date(url.lastmod);
        if (!isNaN(date.getTime())) {
          urlXml += `
    <lastmod>${date.toISOString().split("T")[0]}</lastmod>`;
        }
      }

      if (url.changefreq) {
        urlXml += `
    <changefreq>${url.changefreq}</changefreq>`;
      }

      if (url.priority !== undefined) {
        urlXml += `
    <priority>${url.priority.toFixed(1)}</priority>`;
      }

      if (url.images && url.images.length > 0) {
        for (const image of url.images) {
          urlXml += `
    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>`;
          if (image.title) {
            urlXml += `
      <image:title>${escapeXml(image.title)}</image:title>`;
          }
          if (image.caption) {
            urlXml += `
      <image:caption>${escapeXml(image.caption)}</image:caption>`;
          }
          urlXml += `
    </image:image>`;
        }
      }

      urlXml += `
  </url>`;

      return urlXml;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate a sitemap index for multiple sitemaps
 */
export function generateSitemapIndex(
  sitemaps: { loc: string; lastmod?: string }[]
): string {
  const sitemapsXml = sitemaps
    .map((sitemap) => {
      let xml = `  <sitemap>
    <loc>${escapeXml(sitemap.loc)}</loc>`;
      if (sitemap.lastmod) {
        xml += `
    <lastmod>${new Date(sitemap.lastmod).toISOString().split("T")[0]}</lastmod>`;
      }
      xml += `
  </sitemap>`;
      return xml;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapsXml}
</sitemapindex>`;
}

/**
 * Validate sitemap URLs
 */
export function validateSitemapUrls(urls: SitemapUrl[]): {
  valid: SitemapUrl[];
  invalid: { url: SitemapUrl; reason: string }[];
} {
  const valid: SitemapUrl[] = [];
  const invalid: { url: SitemapUrl; reason: string }[] = [];

  for (const url of urls) {
    try {
      const parsed = new URL(url.loc);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        invalid.push({ url, reason: "Invalid protocol" });
        continue;
      }
      valid.push(url);
    } catch {
      invalid.push({ url, reason: "Invalid URL format" });
    }
  }

  return { valid, invalid };
}

/**
 * Get default robots.txt content
 */
export function getDefaultRobotsTxt(subdomain: string, customDomain?: string | null): string {
  const baseUrl = customDomain 
    ? `https://${customDomain}` 
    : `https://${subdomain}.dramac.app`;

  return `# Robots.txt for ${subdomain}
User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin/system paths
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
`;
}
