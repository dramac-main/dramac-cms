"use server";

import { createClient } from "@/lib/supabase/server";
import { regenerateSection } from "@/lib/ai/regenerate-section";
import type {
  RegenerationOptions,
  SectionContent,
  RegenerationResult,
} from "@/lib/ai/regeneration-types";

export async function regenerateSectionAction(
  siteId: string,
  sectionContent: SectionContent,
  options: RegenerationOptions
): Promise<RegenerationResult> {
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user has access to this site
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, clients(name, industry)")
    .eq("id", siteId)
    .single();

  if (siteError || !site) {
    return { success: false, error: "Site not found or access denied" };
  }

  // Build context from site and client data
  const client = site.clients as { name?: string; industry?: string } | null;
  const context = {
    businessName: client?.name || site.name,
    industry: client?.industry,
  };

  // Perform the regeneration
  const result = await regenerateSection(sectionContent, options, context);

  return result;
}

/**
 * Preview regeneration before applying
 */
export async function previewRegenerationAction(
  siteId: string,
  sectionContent: SectionContent,
  options: RegenerationOptions
): Promise<RegenerationResult> {
  // Preview uses the same logic as regenerate
  return regenerateSectionAction(siteId, sectionContent, options);
}
