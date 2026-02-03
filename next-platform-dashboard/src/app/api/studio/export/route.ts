/**
 * Studio Export API Route
 * 
 * Exports studio pages as optimized static HTML/CSS/assets.
 * 
 * POST /api/studio/export
 * - Export a single page or entire site
 * - Returns build result with files
 * 
 * @phase STUDIO-23 - Export & Render Optimization
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPage, buildSite, type BuildOptions, type BuildResult, type StudioPageData } from "@/lib/studio/engine";
import type { StudioComponent } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface ExportRequest {
  /** Site ID to export */
  siteId: string;
  /** Optional specific page ID (exports all if not provided) */
  pageId?: string;
  /** Build options */
  options?: BuildOptions;
  /** Output format */
  format?: "zip" | "json" | "preview";
}

interface ExportResponse {
  success: boolean;
  error?: string;
  result?: BuildResult;
  /** Download URL for zip format */
  downloadUrl?: string;
  /** Preview URLs for preview format */
  previewUrls?: string[];
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Fetches page data and components from database
 */
async function fetchPageData(
  supabase: ReturnType<typeof createClient> extends Promise<infer R> ? R : never,
  siteId: string,
  pageId: string
): Promise<{ page: StudioPageData; components: StudioComponent[] } | null> {
  // Fetch page
  const { data: pageData, error: pageError } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .eq("site_id", siteId)
    .single();
  
  if (pageError || !pageData) {
    console.error("Failed to fetch page:", pageError);
    return null;
  }
  
  // Fetch page content (components)
  const { data: contentData } = await supabase
    .from("page_content")
    .select("content")
    .eq("page_id", pageId)
    .single();
  
  // Parse page data to StudioPageData format
  // Map database columns to our interface (pages table uses 'name' not 'title')
  // Note: pages table doesn't have a status column, so we default to "draft"
  const page: StudioPageData = {
    id: pageData.id,
    siteId: pageData.site_id,
    title: pageData.name || "Untitled",
    slug: pageData.slug || pageData.id,
    description: pageData.og_description || undefined,
    status: "draft", // No status column in pages table
    rootZone: {
      id: "root",
      componentIds: [],
    },
    createdAt: pageData.created_at ?? undefined,
    updatedAt: pageData.updated_at ?? undefined,
  };
  
  // Parse components from content
  let components: StudioComponent[] = [];
  
  if (contentData?.content) {
    try {
      const content = typeof contentData.content === "string"
        ? JSON.parse(contentData.content)
        : contentData.content;
      
      if (content.components && Array.isArray(content.components)) {
        components = content.components;
      }
      
      if (content.rootZone) {
        page.rootZone = content.rootZone;
      }
    } catch (e) {
      console.error("Failed to parse page content:", e);
    }
  }
  
  return { page, components };
}

/**
 * Fetches all pages for a site
 */
async function fetchSitePages(
  supabase: ReturnType<typeof createClient> extends Promise<infer R> ? R : never,
  siteId: string
): Promise<Array<{ page: StudioPageData; components: StudioComponent[] }>> {
  // Fetch all pages for the site (pages table has no status column, so export all)
  const { data: pagesData, error } = await supabase
    .from("pages")
    .select("id")
    .eq("site_id", siteId);
  
  if (error || !pagesData) {
    console.error("Failed to fetch site pages:", error);
    return [];
  }
  
  // Fetch each page's data
  const pages: Array<{ page: StudioPageData; components: StudioComponent[] }> = [];
  
  for (const pageRef of pagesData) {
    const pageData = await fetchPageData(supabase, siteId, pageRef.id);
    if (pageData) {
      pages.push(pageData);
    }
  }
  
  return pages;
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ExportResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json() as ExportRequest;
    const { siteId, pageId, options = {}, format = "json" } = body;
    
    if (!siteId) {
      return NextResponse.json<ExportResponse>(
        { success: false, error: "Site ID is required" },
        { status: 400 }
      );
    }
    
    // Verify user has access to site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, agency_id, name")
      .eq("id", siteId)
      .single();
    
    if (siteError || !site) {
      return NextResponse.json<ExportResponse>(
        { success: false, error: "Site not found" },
        { status: 404 }
      );
    }
    
    // Build options
    const buildOptions: BuildOptions = {
      minify: options.minify ?? true,
      optimizeAssets: options.optimizeAssets ?? true,
      inlineCriticalCSS: options.inlineCriticalCSS ?? true,
      baseUrl: options.baseUrl || `https://${site.name}.dramac.io`,
      mode: options.mode || "production",
      generateSitemap: true,
      generateRobots: true,
    };
    
    let result: BuildResult;
    
    if (pageId) {
      // Export single page
      const pageData = await fetchPageData(supabase, siteId, pageId);
      
      if (!pageData) {
        return NextResponse.json<ExportResponse>(
          { success: false, error: "Page not found" },
          { status: 404 }
        );
      }
      
      result = await buildPage(pageData.page, pageData.components, buildOptions);
    } else {
      // Export entire site
      const pages = await fetchSitePages(supabase, siteId);
      
      if (pages.length === 0) {
        return NextResponse.json<ExportResponse>(
          { success: false, error: "No published pages found" },
          { status: 404 }
        );
      }
      
      result = await buildSite(pages, buildOptions);
    }
    
    // Handle different output formats
    if (format === "zip") {
      // In production, this would:
      // 1. Create a zip file from result.files
      // 2. Upload to storage
      // 3. Return download URL
      
      return NextResponse.json<ExportResponse>({
        success: true,
        result,
        downloadUrl: `/api/studio/export/download/${siteId}`, // Placeholder
      });
    }
    
    if (format === "preview") {
      // Return preview URLs
      const previewUrls = result.files
        .filter(f => f.type === "html")
        .map(f => `/preview/${siteId}/${f.path.replace("/index.html", "")}`);
      
      return NextResponse.json<ExportResponse>({
        success: true,
        result,
        previewUrls,
      });
    }
    
    // Default: return full result as JSON
    return NextResponse.json<ExportResponse>({
      success: true,
      result,
    });
    
  } catch (error) {
    console.error("Export error:", error);
    
    return NextResponse.json<ExportResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      },
      { status: 500 }
    );
  }
}

// GET handler for status/info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get("siteId");
  
  if (!siteId) {
    return NextResponse.json({
      available: true,
      formats: ["json", "zip", "preview"],
      options: {
        minify: "boolean - Whether to minify output (default: true)",
        optimizeAssets: "boolean - Whether to optimize images/assets (default: true)",
        inlineCriticalCSS: "boolean - Whether to inline critical CSS (default: true)",
        baseUrl: "string - Base URL for the site",
        mode: "production | development | preview",
      },
    });
  }
  
  // Return export status for a specific site
  // Note: pages table has no status/published_at column - all pages are exportable
  const supabase = await createClient();
  
  const { data: pages } = await supabase
    .from("pages")
    .select("id, name")
    .eq("site_id", siteId);
  
  return NextResponse.json({
    siteId,
    totalPages: pages?.length || 0,
    publishedPages: pages?.length || 0, // No status column, all considered exportable
    pages: pages?.map(p => ({
      id: p.id,
      title: p.name,
      status: "draft", // No status column in pages table
      exportable: true, // All pages are exportable
    })),
  });
}
