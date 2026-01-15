"use server";

import { exportSiteToJSON } from "@/lib/sites/export";
import { importSiteFromJSON, ImportOptions, ImportResult } from "@/lib/sites/import";
import { checkRateLimit, recordRateLimitedAction } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function exportSiteAction(siteId: string): Promise<{
  success: boolean;
  json?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user has access to this site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, agency_id")
      .eq("id", siteId)
      .single();

    if (siteError || !site) {
      return { success: false, error: "Site not found or access denied" };
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, "export");
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
      };
    }

    const result = await exportSiteToJSON(siteId);

    if (result.success) {
      await recordRateLimitedAction(user.id, "export", { siteId });
    }

    return result;
  } catch (error) {
    console.error("Export action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Export failed",
    };
  }
}

export async function importSiteAction(
  jsonString: string,
  options: Omit<ImportOptions, "newSiteName" | "newSubdomain" | "agencyId">
): Promise<ImportResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user has access to the target site
    if (options.targetSiteId) {
      const { data: site, error: siteError } = await supabase
        .from("sites")
        .select("id, agency_id")
        .eq("id", options.targetSiteId)
        .single();

      if (siteError || !site) {
        return { success: false, error: "Site not found or access denied" };
      }
    }

    const result = await importSiteFromJSON(jsonString, options);

    if (result.success && options.targetSiteId) {
      revalidatePath(`/dashboard/sites/${options.targetSiteId}`);
      revalidatePath(`/dashboard/sites/${options.targetSiteId}/pages`);
    }

    return result;
  } catch (error) {
    console.error("Import action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}

/**
 * Create a new site from import data
 */
export async function importAsNewSiteAction(
  jsonString: string,
  newSiteName: string,
  newSubdomain: string,
  clientId: string
): Promise<ImportResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get agency ID from client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("agency_id")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return { success: false, error: "Client not found or access denied" };
    }

    const result = await importSiteFromJSON(jsonString, {
      newSiteName,
      newSubdomain,
      clientId,
      agencyId: client.agency_id,
      overwritePages: true,
      importModules: true,
    });

    if (result.success && result.siteId) {
      revalidatePath("/dashboard/sites");
      revalidatePath(`/dashboard/clients/${clientId}`);
    }

    return result;
  } catch (error) {
    console.error("Import as new site action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Import failed",
    };
  }
}
