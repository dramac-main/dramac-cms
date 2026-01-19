import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getSiteByDomain, getSiteBySlug, getAllPublishedSites } from "@/lib/renderer/site-data";
import { RENDERER_DEFAULTS } from "@/lib/renderer/config";
import { SiteRenderer } from "@/components/renderer/site-renderer";

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

  console.log("[SitePage] ====== REQUEST START ======");
  console.log("[SitePage] Domain param:", domain);
  console.log("[SitePage] Page slug:", pageSlug);
  console.log("[SitePage] Full params:", { domain, slug });

  // Try custom domain first, then slug (subdomain)
  const siteByDomain = await getSiteByDomain(domain);
  console.log("[SitePage] getSiteByDomain result:", { domain, found: !!siteByDomain, siteName: siteByDomain?.name });
  
  const siteBySlug = await getSiteBySlug(domain);
  console.log("[SitePage] getSiteBySlug result:", { domain, found: !!siteBySlug, siteName: siteBySlug?.name });
  
  const site = siteByDomain || siteBySlug;
  
  console.log("[SitePage] Final site:", { 
    found: !!site, 
    published: site?.published,
    siteName: site?.name,
    siteSlug: site?.slug,
    pageCount: site?.pages?.length 
  });

  if (!site || !site.published) {
    console.error("[SitePage] ❌ Site not found or not published:", { 
      domain, 
      siteFound: !!site, 
      published: site?.published 
    });
    notFound();
  }

  // Find the requested page
  const page = pageSlug
    ? site.pages.find((p) => p.slug === pageSlug)
    : site.pages.find((p) => p.isHomepage);

  console.log("[SitePage] Page lookup result:", {
    pageSlug: pageSlug || "(homepage)",
    found: !!page,
    pageTitle: page?.title
  });

  if (!page) {
    console.error("[SitePage] Page not found:", { domain, pageSlug, availablePages: site.pages.map(p => p.slug) });
    notFound();
  }

  return (
    <SiteRenderer
      site={site}
      page={page}
    />
  );
}

// ISR configuration removed - moved to top
