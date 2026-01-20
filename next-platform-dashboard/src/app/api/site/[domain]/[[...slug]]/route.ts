import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ domain: string; slug?: string[] }>;
}

/**
 * API route to fetch published site page data
 * 
 * This mirrors the preview API but works for published sites.
 * It uses the admin client to bypass RLS and returns data in the
 * same format as the preview API for consistency.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { domain, slug } = await params;
    const pageSlug = slug?.join("/") || "";
    
    const supabase = createAdminClient();

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

    // Check if domain looks like a custom domain (has dots) or subdomain
    if (domain.includes(".")) {
      siteQuery = siteQuery.eq("custom_domain", domain);
    } else {
      siteQuery = siteQuery.eq("subdomain", domain);
    }

    const { data: site, error: siteError } = await siteQuery.single();

    if (siteError || !site) {
      // Try subdomain if custom domain failed
      const { data: siteBySubdomain } = await supabase
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
        .eq("subdomain", domain)
        .eq("published", true)
        .single();

      if (!siteBySubdomain) {
        return NextResponse.json(
          { error: "Site not found" },
          { status: 404 }
        );
      }

      return processAndReturnSiteData(siteBySubdomain, pageSlug);
    }

    return processAndReturnSiteData(site, pageSlug);
  } catch (error) {
    console.error("[Published Site API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function processAndReturnSiteData(site: any, pageSlug: string) {
  // Find the requested page
  const pages = site.pages || [];
  const page = pageSlug
    ? pages.find((p: any) => p.slug === pageSlug)
    : pages.find((p: any) => p.is_homepage);

  if (!page) {
    return NextResponse.json(
      { error: "Page not found" },
      { status: 404 }
    );
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

  return NextResponse.json({
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
  });
}
