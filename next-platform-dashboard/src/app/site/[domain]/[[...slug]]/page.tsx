import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { CraftRenderer } from "./craft-renderer";
import { ModuleInjector } from "@/components/renderer/module-injector";

interface SitePageProps {
  params: Promise<{
    domain: string;
    slug?: string[];
  }>;
}

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { domain, slug } = await params;
  const data = await getSiteData(domain, slug?.join("/") || "");
  
  if (!data) return {};
  
  return {
    title: data.page.seoTitle || data.page.name || data.site.name,
    description: data.page.seoDescription || undefined,
    openGraph: {
      title: data.page.seoTitle || data.page.name,
      description: data.page.seoDescription || undefined,
      images: data.page.seoImage ? [data.page.seoImage] : undefined,
    },
  };
}

/**
 * Server-side data fetching
 */
async function getSiteData(domain: string, pageSlug: string) {
  const supabase = createAdminClient();

  // Parse domain to extract subdomain if it's a platform subdomain
  // e.g., "ten-and-ten.sites.dramacagency.com" -> "ten-and-ten"
  let subdomain = domain;
  let customDomain = domain;
  
  // Check if this is a platform subdomain (*.sites.dramacagency.com)
  if (domain.endsWith('.sites.dramacagency.com')) {
    subdomain = domain.split('.')[0]; // Extract first part
  } else if (domain.endsWith('.dramac.app')) {
    subdomain = domain.split('.')[0]; // Extract first part
  }

  // Try to find site by custom domain first, then by subdomain
  let siteQuery = supabase
    .from("sites")
    .select(`
      id,
      name,
      subdomain,
      custom_domain,
      settings,
      published,
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

  // First try by subdomain (most common)
  siteQuery = siteQuery.eq("subdomain", subdomain);

  const { data: site, error: siteError } = await siteQuery.single();

  if (siteError || !site) {
    // Try custom domain if subdomain failed
    const { data: siteByCustomDomain } = await supabase
      .from("sites")
      .select(`
        id,
        name,
        subdomain,
        custom_domain,
        settings,
        published,
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
      .eq("custom_domain", customDomain)
      .eq("published", true)
      .single();

    if (!siteByCustomDomain) {
      return null;
    }

    return processData(siteByCustomDomain, pageSlug);
  }

  return processData(site, pageSlug);
}

function processData(site: any, pageSlug: string) {
  // Find the requested page
  const pages = site.pages || [];
  const page = pageSlug
    ? pages.find((p: any) => p.slug === pageSlug)
    : pages.find((p: any) => p.is_homepage);

  if (!page) {
    return null;
  }

  // Extract content from page_content relation
  let content: Record<string, unknown> | null = null;
  
  if (page.page_content) {
    if (Array.isArray(page.page_content) && page.page_content.length > 0) {
      content = page.page_content[0].content;
    } else if (typeof page.page_content === 'object' && 'content' in page.page_content) {
      content = page.page_content.content;
    }
  }

  // Extract theme settings
  const siteSettings = site.settings || {};
  const themeSettings = siteSettings.theme || null;

  return {
    site: {
      id: site.id,
      name: site.name,
      subdomain: site.subdomain,
      customDomain: site.custom_domain,
      settings: siteSettings,
    },
    page: {
      id: page.id,
      name: page.name,
      slug: page.slug,
      isHomepage: page.is_homepage,
      seoTitle: page.seo_title,
      seoDescription: page.seo_description,
      seoImage: page.seo_image,
    },
    content: content ? JSON.stringify(content) : null,
    themeSettings,
  };
}

/**
 * Server Component - fetches data and passes to client renderer
 */
export default async function SitePage({ params }: SitePageProps) {
  const { domain, slug } = await params;
  const pageSlug = slug?.join("/") || "";

  // Fetch data server-side (no loading state!)
  const data = await getSiteData(domain, pageSlug);

  if (!data) {
    notFound();
  }

  // No content state
  if (!data.content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2 text-gray-900">
            Page Coming Soon
          </h1>
          <p className="text-gray-500">
            This page is being built and will be available shortly.
          </p>
        </div>
      </div>
    );
  }

  // Pass data to client component for Craft.js rendering
  return (
    <>
      <CraftRenderer 
        content={data.content} 
        themeSettings={data.themeSettings}
      />
      {/* Inject studio modules for this site */}
      <ModuleInjector siteId={data.site.id} />
    </>
  );
}
