import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Debug endpoint to test site rendering pipeline
 * GET /api/debug/site-lookup?subdomain=ten-and-ten
 * 
 * ⚠️ Development only — blocked in production
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain");
  const domain = searchParams.get("domain");
  
  if (!subdomain && !domain) {
    return NextResponse.json({ 
      error: "Provide ?subdomain=xxx or ?domain=xxx" 
    }, { status: 400 });
  }

  const supabase = createAdminClient();
  const results: Record<string, unknown> = {
    params: { subdomain, domain },
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. List ALL sites in database
    const { data: allSites, error: allSitesError } = await supabase
      .from("sites")
      .select("id, name, subdomain, custom_domain, published, published_at")
      .limit(20);

    results.allSites = {
      count: allSites?.length || 0,
      sites: allSites?.map(s => ({
        id: s.id.substring(0, 8) + "...",
        name: s.name,
        subdomain: s.subdomain,
        customDomain: s.custom_domain,
        published: s.published,
        publishedAt: s.published_at,
      })),
      error: allSitesError?.message,
    };

    // 2. Try to find site by subdomain
    if (subdomain) {
      const { data: siteBySubdomain, error: subdomainError } = await supabase
        .from("sites")
        .select(`
          id,
          name,
          subdomain,
          custom_domain,
          published,
          published_at,
          settings,
          pages (
            id,
            slug,
            name,
            is_homepage,
            page_content (
              content
            )
          )
        `)
        .eq("subdomain", subdomain)
        .single();

      results.siteBySubdomain = {
        found: !!siteBySubdomain,
        error: subdomainError?.message,
        site: siteBySubdomain ? {
          id: siteBySubdomain.id.substring(0, 8) + "...",
          name: siteBySubdomain.name,
          subdomain: siteBySubdomain.subdomain,
          customDomain: siteBySubdomain.custom_domain,
          published: siteBySubdomain.published,
          publishedAt: siteBySubdomain.published_at,
          hasSettings: !!siteBySubdomain.settings,
          pageCount: siteBySubdomain.pages?.length || 0,
          pages: siteBySubdomain.pages?.map(p => ({
            id: p.id.substring(0, 8) + "...",
            slug: p.slug,
            name: p.name,
            isHomepage: p.is_homepage,
            hasContent: !!p.page_content && (Array.isArray(p.page_content) ? p.page_content.length > 0 : !!p.page_content),
          })),
        } : null,
      };

      // 3. Try with published filter (what the renderer does)
      const { data: publishedSite, error: publishedError } = await supabase
        .from("sites")
        .select(`
          id,
          name,
          subdomain,
          custom_domain,
          published,
          published_at,
          pages (
            id,
            slug,
            name,
            is_homepage,
            page_content (
              content
            )
          )
        `)
        .eq("subdomain", subdomain)
        .eq("published", true)
        .single();

      results.publishedSiteBySubdomain = {
        found: !!publishedSite,
        error: publishedError?.message,
        site: publishedSite ? {
          id: publishedSite.id.substring(0, 8) + "...",
          name: publishedSite.name,
          published: publishedSite.published,
          pageCount: publishedSite.pages?.length || 0,
        } : null,
      };
    }

    // 4. Try to find by custom domain
    if (domain) {
      const { data: siteByDomain, error: domainError } = await supabase
        .from("sites")
        .select(`
          id,
          name,
          subdomain,
          custom_domain,
          published,
          published_at
        `)
        .eq("custom_domain", domain)
        .single();

      results.siteByCustomDomain = {
        found: !!siteByDomain,
        error: domainError?.message,
        site: siteByDomain ? {
          id: siteByDomain.id.substring(0, 8) + "...",
          name: siteByDomain.name,
          subdomain: siteByDomain.subdomain,
          published: siteByDomain.published,
        } : null,
      };
    }

    // 5. Environment config
    results.config = {
      NEXT_PUBLIC_BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN || "NOT SET",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
    };

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      error: "Debug failed",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
