import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateSitemap } from "@/lib/seo/sitemap-generator";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

export async function GET(
  request: Request,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;

  // Initialize Supabase with service role for public routes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Try to find site by custom domain first, then by subdomain
  let site = null;
  
  // Check if it's a custom domain or subdomain
  const isSubdomain = domain.endsWith('.dramac.app') || !domain.includes('.');
  
  if (isSubdomain) {
    const subdomain = domain.replace('.dramac.app', '');
    const { data } = await supabase
      .from("sites")
      .select("id, subdomain, custom_domain, sitemap_enabled, published")
      .eq("subdomain", subdomain)
      .eq("published", true)
      .single();
    site = data;
  } else {
    // Custom domain lookup
    const { data } = await supabase
      .from("sites")
      .select("id, subdomain, custom_domain, sitemap_enabled, published")
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

  // Check if sitemap is enabled
  if (site.sitemap_enabled === false) {
    return new NextResponse("Sitemap not available", { 
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  }

  // Determine base URL
  const baseUrl = site.custom_domain
    ? `https://${site.custom_domain}`
    : `https://${site.subdomain}.dramac.app`;

  try {
    // Generate sitemap
    const sitemap = await generateSitemap(site.id, baseUrl);

    return new NextResponse(sitemap, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
        "X-Robots-Tag": "noindex", // Sitemap itself shouldn't be indexed
      },
    });
  } catch (error) {
    console.error("[Sitemap] Generation error:", error);
    return new NextResponse("Error generating sitemap", { 
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}
