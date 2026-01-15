import { createClient } from "@/lib/supabase/server";
import type { SiteExportData } from "./export";
import type { Json } from "@/types/database";

export interface ImportOptions {
  targetSiteId?: string;      // Import into existing site
  newSiteName?: string;       // Create new site
  newSubdomain?: string;      // For new site
  clientId: string;           // Required for new site
  agencyId?: string;          // For new site
  overwritePages: boolean;    // Replace existing pages
  importModules: boolean;     // Import module settings
}

export interface ImportResult {
  success: boolean;
  siteId?: string;
  error?: string;
  details?: {
    pagesImported: number;
    pagesSkipped: number;
    modulesImported: number;
  };
}

/**
 * Validate import data structure
 */
export function validateImportData(data: unknown): {
  valid: boolean;
  error?: string;
  data?: SiteExportData;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid data format" };
  }

  const exportData = data as SiteExportData;

  if (exportData.version !== "1.0") {
    return { valid: false, error: `Unsupported export version: ${exportData.version}` };
  }

  if (!exportData.siteInfo || !exportData.siteInfo.name) {
    return { valid: false, error: "Missing site info" };
  }

  if (!Array.isArray(exportData.pages)) {
    return { valid: false, error: "Invalid pages data" };
  }

  return { valid: true, data: exportData };
}

/**
 * Import site from JSON data
 */
export async function importSite(
  importData: SiteExportData,
  options: ImportOptions
): Promise<ImportResult> {
  const supabase = await createClient();

  try {
    let siteId = options.targetSiteId;

    // If creating new site
    if (!siteId && options.newSiteName && options.newSubdomain) {
      // Check subdomain availability
      const { data: existing } = await supabase
        .from("sites")
        .select("id")
        .eq("subdomain", options.newSubdomain)
        .single();

      if (existing) {
        return { success: false, error: "Subdomain already exists" };
      }

      // Get agency ID from client if not provided
      let agencyId = options.agencyId;
      if (!agencyId) {
        const { data: client } = await supabase
          .from("clients")
          .select("agency_id")
          .eq("id", options.clientId)
          .single();
        
        if (client) {
          agencyId = client.agency_id;
        }
      }

      if (!agencyId) {
        return { success: false, error: "Could not determine agency ID" };
      }

      // Create new site
      const { data: newSite, error: createError } = await supabase
        .from("sites")
        .insert({
          client_id: options.clientId,
          agency_id: agencyId,
          name: options.newSiteName,
          subdomain: options.newSubdomain,
          published: false,
          settings: importData.siteInfo.settings as Json,
          seo_title: importData.siteInfo.seoTitle,
          seo_description: importData.siteInfo.seoDescription,
          seo_image: importData.siteInfo.seoImage,
        })
        .select()
        .single();

      if (createError || !newSite) {
        return { success: false, error: `Failed to create site: ${createError?.message}` };
      }

      siteId = newSite.id;
    }

    if (!siteId) {
      return { success: false, error: "No target site specified" };
    }

    let pagesImported = 0;
    let pagesSkipped = 0;
    let modulesImported = 0;

    // Import pages
    for (const page of importData.pages) {
      // Check if page exists
      const { data: existingPage } = await supabase
        .from("pages")
        .select("id")
        .eq("site_id", siteId)
        .eq("slug", page.slug)
        .single();

      if (existingPage && !options.overwritePages) {
        pagesSkipped++;
        continue;
      }

      if (existingPage && options.overwritePages) {
        // Update existing page
        await supabase
          .from("pages")
          .update({
            name: page.name,
            seo_title: page.seoTitle,
            seo_description: page.seoDescription,
            seo_image: page.seoImage,
            is_homepage: page.isHomepage,
            sort_order: page.sortOrder,
          })
          .eq("id", existingPage.id);

        // Update page content
        await supabase
          .from("page_content")
          .upsert({
            page_id: existingPage.id,
            content: page.content as Json,
          }, {
            onConflict: "page_id",
          });

        pagesImported++;
      } else {
        // Create new page
        const { data: newPage, error: pageError } = await supabase
          .from("pages")
          .insert({
            site_id: siteId,
            slug: page.slug,
            name: page.name,
            seo_title: page.seoTitle,
            seo_description: page.seoDescription,
            seo_image: page.seoImage,
            is_homepage: page.isHomepage,
            sort_order: page.sortOrder,
          })
          .select()
          .single();

        if (!pageError && newPage) {
          // Create page content
          await supabase
            .from("page_content")
            .insert({
              page_id: newPage.id,
              content: page.content as Json,
            });
          
          pagesImported++;
        }
      }
    }

    // Import modules
    if (options.importModules && importData.modules) {
      for (const moduleData of importData.modules) {
        // Get module ID from slug
        const { data: module } = await supabase
          .from("modules")
          .select("id")
          .eq("slug", moduleData.moduleSlug)
          .single();

        if (!module) continue;

        // Upsert site module
        const { error: moduleError } = await supabase
          .from("site_modules")
          .upsert({
            site_id: siteId,
            module_id: module.id,
            settings: moduleData.settings as Json,
            is_enabled: moduleData.isEnabled,
          }, {
            onConflict: "site_id,module_id",
          });

        if (!moduleError) {
          modulesImported++;
        }
      }
    }

    return {
      success: true,
      siteId,
      details: {
        pagesImported,
        pagesSkipped,
        modulesImported,
      },
    };
  } catch (error) {
    console.error("Import error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}

/**
 * Parse JSON file and import
 */
export async function importSiteFromJSON(
  jsonString: string,
  options: ImportOptions
): Promise<ImportResult> {
  try {
    const data = JSON.parse(jsonString);
    const validation = validateImportData(data);

    if (!validation.valid || !validation.data) {
      return { success: false, error: validation.error };
    }

    return importSite(validation.data, options);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: false, error: "Invalid JSON format" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}
