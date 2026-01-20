import { createClient } from "@/lib/supabase/server";

export interface SiteExportData {
  version: "1.0";
  exportDate: string;
  siteInfo: {
    name: string;
    subdomain: string;
    status: string;
    settings: Record<string, unknown>;
    seoTitle: string | null;
    seoDescription: string | null;
    seoImage: string | null;
  };
  pages: Array<{
    slug: string;
    name: string;
    content: unknown;
    seoTitle: string | null;
    seoDescription: string | null;
    seoImage: string | null;
    isHomepage: boolean;
    sortOrder: number;
  }>;
  modules: Array<{
    moduleSlug: string;
    settings: Record<string, unknown>;
    isEnabled: boolean;
  }>;
  metadata: {
    totalPages: number;
    totalModules: number;
    exportedBy: string;
  };
}

/**
 * Export entire site to JSON format
 */
export async function exportSite(siteId: string): Promise<{
  success: boolean;
  data?: SiteExportData;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // 1. Get site info
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("*")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return { success: false, error: "Site not found" };
    }

    // 2. Get all pages with their content
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select(`
        id,
        slug,
        name,
        seo_title,
        seo_description,
        seo_image,
        is_homepage,
        sort_order
      `)
      .eq("site_id", siteId)
      .order("sort_order", { ascending: true });

    if (pagesError) {
      return { success: false, error: `Failed to get pages: ${pagesError.message}` };
    }

    // Get page content for each page
    const pagesWithContent = await Promise.all(
      (pages || []).map(async (page) => {
        const { data: contentData } = await supabase
          .from("page_content")
          .select("content")
          .eq("page_id", page.id)
          .single();

        return {
          slug: page.slug,
          name: page.name,
          content: contentData?.content || { sections: [] },
          seoTitle: page.seo_title,
          seoDescription: page.seo_description,
          seoImage: page.seo_image,
          isHomepage: page.is_homepage ?? false,
          sortOrder: page.sort_order ?? 0,
        };
      })
    );

    // 3. Get enabled modules (separate queries - FK was dropped)
    const { data: rawModuleInstalls, error: modulesError } = await supabase
      .from("site_module_installations")
      .select("module_id, settings, installed_at")
      .eq("site_id", siteId);

    if (modulesError) {
      return { success: false, error: `Failed to get modules: ${modulesError.message}` };
    }

    // Fetch module slugs separately
    let siteModules: Array<{ settings: Record<string, unknown>; installed_at: string | null; module: { slug: string } | null }> = [];
    if (rawModuleInstalls?.length) {
      const moduleIds = rawModuleInstalls.map((m) => m.module_id);
      const { data: modules } = await supabase
        .from("modules_v2")
        .select("id, slug")
        .in("id", moduleIds);

      const moduleMap = new Map((modules || []).map((m) => [m.id, m]));

      siteModules = rawModuleInstalls.map((m) => ({
        settings: m.settings as Record<string, unknown>,
        installed_at: m.installed_at,
        module: moduleMap.get(m.module_id) || null,
      }));
    }

    // 4. Build export data
    const exportData: SiteExportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      siteInfo: {
        name: site.name,
        subdomain: site.subdomain,
        status: site.published ? "published" : "draft",
        settings: (site.settings as Record<string, unknown>) || {},
        seoTitle: site.seo_title,
        seoDescription: site.seo_description,
        seoImage: site.seo_image,
      },
      pages: pagesWithContent,
      modules: (siteModules || []).map((sm) => ({
        moduleSlug: (sm.module as unknown as { slug: string } | null)?.slug || "",
        settings: (sm.settings as Record<string, unknown>) || {},
        isEnabled: !!sm.installed_at,
      })).filter(m => m.moduleSlug),
      metadata: {
        totalPages: pagesWithContent.length,
        totalModules: siteModules?.filter(m => m.installed_at).length || 0,
        exportedBy: user.email || user.id,
      },
    };

    return { success: true, data: exportData };
  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}

/**
 * Export site and return as downloadable JSON
 */
export async function exportSiteToJSON(siteId: string): Promise<{
  success: boolean;
  json?: string;
  filename?: string;
  error?: string;
}> {
  const result = await exportSite(siteId);

  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }

  const filename = `${result.data.siteInfo.subdomain}-export-${
    new Date().toISOString().split("T")[0]
  }.json`;

  return {
    success: true,
    json: JSON.stringify(result.data, null, 2),
    filename,
  };
}
