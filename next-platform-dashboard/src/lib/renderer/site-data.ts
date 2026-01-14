import { createAdminClient } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";
import { RENDERER_CONFIG } from "./config";
import type { Json } from "@/types/database";

export interface SiteData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: {
    title?: string;
    description?: string;
    favicon?: string;
    ogImage?: string;
    customCss?: string;
    customHead?: string;
    fonts?: string[];
  };
  pages: PageData[];
  published: boolean;
  publishedAt: string | null;
}

export interface PageData {
  id: string;
  slug: string;
  title: string;
  content: Json; // Craft.js JSON
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  isHomepage: boolean;
  published: boolean;
}

// Helper type for page query results
interface PageQueryResult {
  id: string;
  slug: string;
  name: string;
  is_homepage: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  page_content: { content: Json }[] | null;
}

// Cached site fetch with ISR
export const getSiteByDomain = unstable_cache(
  async (domain: string): Promise<SiteData | null> => {
    const supabase = createAdminClient();

    // Try custom domain first
    let query = supabase
      .from("sites")
      .select(`
        id,
        name,
        subdomain,
        custom_domain,
        settings,
        published,
        published_at,
        pages (
          id,
          slug,
          name,
          is_homepage,
          seo_title,
          seo_description,
          seo_image,
          page_content (
            content
          )
        )
      `)
      .eq("published", true);

    // Check if it's a custom domain or subdomain
    if (domain.includes(".")) {
      query = query.eq("custom_domain", domain);
    } else {
      query = query.eq("subdomain", domain);
    }

    const { data: site } = await query.single();

    if (!site) return null;

    const siteSettings = (site.settings || {}) as SiteData["settings"];

    return {
      id: site.id,
      name: site.name,
      slug: site.subdomain,
      domain: site.custom_domain,
      settings: siteSettings,
      pages: ((site.pages || []) as unknown as PageQueryResult[])
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.name,
          content: p.page_content?.[0]?.content || {},
          seoTitle: p.seo_title,
          seoDescription: p.seo_description,
          ogImage: p.seo_image,
          isHomepage: p.is_homepage,
          published: true, // All fetched pages are published (site is published)
        })),
      published: site.published,
      publishedAt: site.published_at,
    };
  },
  ["site-by-domain"],
  {
    revalidate: RENDERER_CONFIG.revalidateTime,
    tags: ["site"],
  }
);

export const getSiteBySlug = unstable_cache(
  async (slug: string): Promise<SiteData | null> => {
    const supabase = createAdminClient();

    const { data: site } = await supabase
      .from("sites")
      .select(`
        id,
        name,
        subdomain,
        custom_domain,
        settings,
        published,
        published_at,
        pages (
          id,
          slug,
          name,
          is_homepage,
          seo_title,
          seo_description,
          seo_image,
          page_content (
            content
          )
        )
      `)
      .eq("subdomain", slug)
      .eq("published", true)
      .single();

    if (!site) return null;

    const siteSettings = (site.settings || {}) as SiteData["settings"];

    return {
      id: site.id,
      name: site.name,
      slug: site.subdomain,
      domain: site.custom_domain,
      settings: siteSettings,
      pages: ((site.pages || []) as unknown as PageQueryResult[])
        .map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.name,
          content: p.page_content?.[0]?.content || {},
          seoTitle: p.seo_title,
          seoDescription: p.seo_description,
          ogImage: p.seo_image,
          isHomepage: p.is_homepage,
          published: true, // All fetched pages are published (site is published)
        })),
      published: site.published,
      publishedAt: site.published_at,
    };
  },
  ["site-by-slug"],
  {
    revalidate: RENDERER_CONFIG.revalidateTime,
    tags: ["site"],
  }
);

export async function getPageBySlug(
  siteId: string,
  pageSlug: string
): Promise<PageData | null> {
  const supabase = createAdminClient();

  const { data: page } = await supabase
    .from("pages")
    .select(`
      id,
      slug,
      name,
      is_homepage,
      seo_title,
      seo_description,
      seo_image,
      page_content (
        content
      )
    `)
    .eq("site_id", siteId)
    .eq("slug", pageSlug)
    .single();

  if (!page) return null;

  const pageResult = page as unknown as PageQueryResult;

  return {
    id: pageResult.id,
    slug: pageResult.slug,
    title: pageResult.name,
    content: pageResult.page_content?.[0]?.content || {},
    seoTitle: pageResult.seo_title,
    seoDescription: pageResult.seo_description,
    ogImage: pageResult.seo_image,
    isHomepage: pageResult.is_homepage,
    published: true,
  };
}

export async function getAllPublishedSites(): Promise<{ slug: string; domain: string | null }[]> {
  const supabase = createAdminClient();

  const { data: sites } = await supabase
    .from("sites")
    .select("subdomain, custom_domain")
    .eq("published", true);

  return (sites || []).map((s) => ({
    slug: s.subdomain,
    domain: s.custom_domain,
  }));
}

export async function getSitePages(siteId: string): Promise<string[]> {
  const supabase = createAdminClient();

  const { data: pages } = await supabase
    .from("pages")
    .select("slug")
    .eq("site_id", siteId);

  return (pages || []).map((p) => p.slug);
}
