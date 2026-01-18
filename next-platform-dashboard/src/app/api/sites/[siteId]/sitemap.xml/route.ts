import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateSitemap } from "@/lib/seo/sitemap-generator";

// Use service role for public access to sitemap
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;

    // Get site info
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("subdomain, custom_domain, status")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return new NextResponse("Site not found", { status: 404 });
    }

    // Only allow sitemap for published sites
    if (site.status !== "published") {
      return new NextResponse("Site is not published", { status: 403 });
    }

    // Determine base URL
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";
    const baseUrl = site.custom_domain
      ? `https://${site.custom_domain}`
      : `https://${site.subdomain}.${baseDomain}`;

    const sitemapXml = await generateSitemap(siteId, baseUrl);

    return new NextResponse(sitemapXml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }
}
