import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role for public access to robots.txt
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
      .select("subdomain, custom_domain, status, settings")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return new NextResponse("Site not found", { status: 404 });
    }

    // Check if site has custom robots.txt in settings
    const settings = site.settings as Record<string, unknown> | null;
    const customRobotsTxt = settings?.robots_txt as string | undefined;

    if (customRobotsTxt) {
      return new NextResponse(customRobotsTxt, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }

    // Determine base URL for sitemap reference
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dramac.app";
    const baseUrl = site.custom_domain
      ? `https://${site.custom_domain}`
      : `https://${site.subdomain}.${baseDomain}`;

    // Generate default robots.txt based on site status
    let robotsTxt: string;

    if (site.status === "published") {
      // Published site - allow indexing
      robotsTxt = `# robots.txt for ${baseUrl}
User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1

# Disallow admin and API routes
Disallow: /api/
Disallow: /dashboard/
Disallow: /_next/
`;
    } else {
      // Unpublished/draft site - disallow indexing
      robotsTxt = `# robots.txt for ${baseUrl}
# Site is not published - disallowing all robots
User-agent: *
Disallow: /
`;
    }

    return new NextResponse(robotsTxt, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Robots.txt generation error:", error);
    return new NextResponse("Error generating robots.txt", { status: 500 });
  }
}
