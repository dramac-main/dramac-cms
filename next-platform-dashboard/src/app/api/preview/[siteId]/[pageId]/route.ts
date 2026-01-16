import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ siteId: string; pageId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { siteId, pageId } = await params;
    const supabase = await createClient();

    // Get page with site info for preview
    const { data: page, error: pageError } = await supabase
      .from("pages")
      .select(`
        id,
        name,
        slug,
        seo_title,
        seo_description,
        site_id,
        page_content(content),
        site:sites (
          id,
          name,
          subdomain,
          custom_domain,
          theme_settings
        )
      `)
      .eq("id", pageId)
      .eq("site_id", siteId)
      .single();

    if (pageError || !page) {
      console.error("[Preview API] Page not found:", pageError);
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Extract content from page_content relation - handle both array and object formats
    let content: Record<string, unknown> | null = null;
    
    if (page.page_content) {
      if (Array.isArray(page.page_content) && page.page_content.length > 0) {
        // Array format
        content = (page.page_content[0] as { content: Record<string, unknown> }).content;
      } else if (typeof page.page_content === 'object' && 'content' in page.page_content) {
        // Object format
        content = (page.page_content as { content: Record<string, unknown> }).content;
      }
    }

    // Return comprehensive page data for Craft.js preview
    return NextResponse.json({
      page: {
        id: page.id,
        name: page.name,
        slug: page.slug,
        metaTitle: page.seo_title,
        metaDescription: page.seo_description,
      },
      site: page.site,
      content: content ? JSON.stringify(content) : null,
      themeSettings: (page.site as { theme_settings?: Record<string, unknown> } | null)?.theme_settings || null,
    });
  } catch (error) {
    console.error("[Preview API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
