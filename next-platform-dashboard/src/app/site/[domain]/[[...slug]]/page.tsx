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

export async function generateStaticParams() {
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

  // Try custom domain first, then slug
  const site = await getSiteByDomain(domain) || await getSiteBySlug(domain);
  
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

  return (
    <SiteRenderer
      site={site}
      page={page}
    />
  );
}

// Enable ISR
export const revalidate = 60;
