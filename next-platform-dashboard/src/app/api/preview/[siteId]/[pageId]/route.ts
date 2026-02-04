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
          settings
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
    const siteSettings = (page.site as { settings?: Record<string, unknown> } | null)?.settings || {};
    const themeSettings = (siteSettings as Record<string, unknown>)?.theme || null;
    
    // Fetch installed modules for this site
    const { data: installedModules } = await supabase
      .from("site_module_installations")
      .select(`
        id,
        is_enabled,
        enabled_at,
        settings,
        module:modules_v2 (
          id,
          slug,
          name,
          description,
          type,
          category,
          current_version,
          schema
        )
      `)
      .eq("site_id", siteId)
      .eq("is_enabled", true);
    
    // Format installed modules for the renderer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modules = (installedModules || []).map((im: any) => ({
      // InstalledModuleInfo structure
      id: im.module?.id || im.id,
      name: im.module?.name || 'Unknown Module',
      slug: im.module?.slug || '', // Module slug for imports
      status: 'active' as const, // Only enabled modules are queried
      version: im.module?.current_version || '1.0.0',
      category: im.module?.category,
      hasStudioComponents: true, // Assume true, let the loader handle it
      installationId: im.id,
    })).filter((m: { slug?: string }) => m.slug);
    
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
      themeSettings: themeSettings,
      modules: modules,
    });
  } catch (error) {
    console.error("[Preview API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
