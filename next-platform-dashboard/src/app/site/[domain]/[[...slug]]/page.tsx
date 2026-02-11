import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { CraftRenderer } from "./craft-renderer";
import { ModuleInjector } from "@/components/renderer/module-injector";
import type { InstalledModuleInfo } from "@/types/studio-module";
import { LiveChatWidgetInjector } from "@/components/renderer/live-chat-widget-injector";

// Known module slugs that have Studio components
const KNOWN_MODULE_SLUGS = ["ecommerce", "booking", "crm", "automation", "social-media", "live-chat"];

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
      agency_id,
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

    return processData(siteByCustomDomain, pageSlug, supabase);
  }

  return processData(site, pageSlug, supabase);
}

async function processData(site: any, pageSlug: string, supabase: ReturnType<typeof createAdminClient>) {
  // Find the requested page
  // IMPORTANT: Normalize slug comparison to handle both with and without leading slashes
  const pages = site.pages || [];
  const normalizedSlug = pageSlug ? (pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}`) : '';
  
  const page = pageSlug
    ? pages.find((p: any) => {
        // Compare normalized slugs
        const pSlug = p.slug?.startsWith('/') ? p.slug : `/${p.slug}`;
        return pSlug === normalizedSlug || p.slug === pageSlug;
      })
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

  // Fetch installed modules for this site
  let modules: InstalledModuleInfo[] = [];
  try {
    const { data: installations } = await supabase
      .from("site_module_installations")
      .select(`
        id,
        module_id,
        is_enabled,
        installed_at,
        settings
      `)
      .eq("site_id", site.id)
      .eq("is_enabled", true);

    if (installations && installations.length > 0) {
      const moduleIds = installations.map(d => d.module_id);
      
      const { data: modulesData } = await supabase
        .from("modules_v2")
        .select(`
          id,
          name,
          slug,
          current_version,
          category,
          icon,
          status
        `)
        .in("id", moduleIds);

      if (modulesData) {
        const moduleMap = new Map(modulesData.map(m => [m.id, m]));
        
        for (const row of installations) {
          const mod = moduleMap.get(row.module_id);
          if (mod && (mod.status === "published" || mod.status === "active")) {
            modules.push({
              id: mod.id,
              name: mod.name,
              slug: mod.slug,
              status: row.is_enabled ? "active" : "inactive",
              version: mod.current_version || "1.0.0",
              category: mod.category,
              icon: mod.icon || undefined,
              hasStudioComponents: KNOWN_MODULE_SLUGS.includes(mod.slug),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[SitePage] Error fetching modules:", err);
  }

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
    modules,
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
            Page Not Found
          </h1>
          <p className="text-gray-500">
            This page is being built and will be available shortly.
          </p>
        </div>
      </div>
    );
  }

  // Check if live-chat module is enabled
  const hasLiveChat = data.modules.some(m => m.slug === 'live-chat' && m.status === 'active');

  // Pass data to client component for rendering with modules
  return (
    <>
      <CraftRenderer 
        content={data.content} 
        themeSettings={data.themeSettings}
        siteId={data.site.id}
        modules={data.modules}
      />
      {/* Inject studio modules for this site */}
      <ModuleInjector siteId={data.site.id} />
      {/* Inject live chat widget if module is enabled */}
      {hasLiveChat && <LiveChatWidgetInjector siteId={data.site.id} />}
    </>
  );
}
