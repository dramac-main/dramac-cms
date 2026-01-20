import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSiteByDomain, getSiteBySlug, getAllPublishedSites } from "@/lib/renderer/site-data";
import { RENDERER_DEFAULTS } from "@/lib/renderer/config";
import { UnifiedSiteRenderer } from "@/components/renderer/unified-site-renderer";
import { SiteHead } from "@/components/renderer/site-head";
import { SiteStyles } from "@/components/renderer/site-styles";
import { ModuleInjector } from "@/components/renderer/module-injector";

interface SitePageProps {
  params: Promise<{
    domain: string;
    slug?: string[];
  }>;
}

// Only generate static params in production for known domains
export async function generateStaticParams() {
  // Skip static generation in development
  if (process.env.NODE_ENV !== 'production') {
    return [];
  }
  
  const sites = await getAllPublishedSites();
  const params: { domain: string; slug?: string[] }[] = [];

  for (const site of sites) {
    const domain = site.domain || site.slug;
    
    // Add homepage
    params.push({ domain, slug: [] });

    // Add all pages
    // In real implementation, fetch pages for each site
    // params.push({ domain, slug: ['about'] });
  }

  return params;
}

// Enable ISR with 60 second revalidation
export const revalidate = 60;

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { domain, slug } = await params;
  const pageSlug = slug?.join("/") || "";

  // Try custom domain first, then slug
  const site = await getSiteByDomain(domain) || await getSiteBySlug(domain);
  if (!site) return {};

  // Find the specific page
  const page = pageSlug
    ? site.pages.find((p) => p.slug === pageSlug)
    : site.pages.find((p) => p.isHomepage);

  const title = page?.seoTitle || page?.title || site.settings.title || RENDERER_DEFAULTS.title;
  const description = page?.seoDescription || site.settings.description || RENDERER_DEFAULTS.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: page?.ogImage || site.settings.ogImage ? [page?.ogImage || site.settings.ogImage!] : [],
    },
    icons: site.settings.favicon ? [site.settings.favicon] : undefined,
  };
}

export default async function SitePage({ params }: SitePageProps) {
  const { domain, slug } = await params;
  const pageSlug = slug?.join("/") || "";

  // Try custom domain first, then slug (subdomain)
  const siteByDomain = await getSiteByDomain(domain);
  const siteBySlug = await getSiteBySlug(domain);
  const site = siteByDomain || siteBySlug;

  if (!site || !site.published) {
    notFound();
  }

  // Find the requested page
  const page = pageSlug
    ? site.pages.find((p) => p.slug === pageSlug)
    : site.pages.find((p) => p.isHomepage);

  if (!page) {
    notFound();
  }

  // Convert content to string if needed (Craft.js expects string JSON)
  const contentString = typeof page.content === 'string' 
    ? page.content 
    : JSON.stringify(page.content);

  return (
    <>
      <SiteHead site={site} />
      <SiteStyles site={site} />
      <ModuleInjector siteId={site.id} />
      
      <UnifiedSiteRenderer
        content={contentString}
        themeSettings={site.settings.theme}
        siteId={site.id}
        pageId={page.id}
      />
    </>
  );
}

// ISR configuration removed - moved to top
