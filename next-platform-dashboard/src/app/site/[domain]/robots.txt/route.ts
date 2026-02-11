import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDefaultRobotsTxt } from "@/lib/seo/sitemap-generator";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;

  // Use admin client for public routes (no auth cookies)
  const supabase = createAdminClient();

  // Try to find site by custom domain first, then by subdomain
  let site = null;
  
  // Check if it's a custom domain or subdomain
  const isSubdomain = domain.endsWith('.dramac.app') || !domain.includes('.');
  
  if (isSubdomain) {
    const subdomain = domain.replace('.dramac.app', '');
    const { data } = await supabase
      .from("sites")
      .select("id, subdomain, custom_domain, robots_txt, published")
      .eq("subdomain", subdomain)
      .eq("published", true)
      .single();
    site = data;
  } else {
    // Custom domain lookup
    const { data } = await supabase
      .from("sites")
      .select("id, subdomain, custom_domain, robots_txt, published")
      .eq("custom_domain", domain)
      .eq("custom_domain_verified", true)
      .eq("published", true)
      .single();
    site = data;
  }

  if (!site) {
    return new NextResponse("Site not found", { 
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  }

  // Use custom robots.txt or generate default
  const robotsTxt = site.robots_txt || getDefaultRobotsTxt(site.subdomain, site.custom_domain);

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
