/**
 * Branding Queries
 * 
 * Phase WL-02: Database queries for agency branding.
 * Fetched server-side for email sending — uses admin client to bypass RLS.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { AgencyBranding } from "@/types/branding";

// In-memory cache for branding data (5 minute TTL)
const brandingCache = new Map<string, { data: AgencyBranding | null; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch agency branding from the database.
 * Results are cached in memory for 5 minutes to avoid N+1 queries.
 */
export async function getAgencyBranding(
  agencyId: string
): Promise<AgencyBranding | null> {
  // Check cache
  const cached = brandingCache.get(agencyId);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await (supabase as ReturnType<typeof createAdminClient>)
      .from("agency_branding" as "agencies") // Cast: table not in generated types
      .select("*")
      .eq("agency_id", agencyId)
      .single();

    if (error) {
      // PGRST116 = no rows found — not an error, agency just hasn't configured branding
      if (error.code !== "PGRST116") {
        console.error("[Branding] Error fetching branding:", error);
      }
      brandingCache.set(agencyId, { data: null, expiry: Date.now() + CACHE_TTL });
      return null;
    }

    const branding = data as unknown as AgencyBranding;
    brandingCache.set(agencyId, { data: branding, expiry: Date.now() + CACHE_TTL });
    return branding;
  } catch (err) {
    console.error("[Branding] Unexpected error:", err);
    return null;
  }
}

/**
 * Fetch agency branding by agency slug.
 * Used by portal login page to brand the login experience.
 */
export async function getAgencyBrandingBySlug(
  agencySlug: string
): Promise<AgencyBranding | null> {
  try {
    const supabase = createAdminClient();
    
    // First find the agency by slug
    const { data: agency, error: agencyError } = await supabase
      .from("agencies")
      .select("id")
      .eq("slug", agencySlug)
      .single();

    if (agencyError || !agency) {
      return null;
    }

    return getAgencyBranding(agency.id);
  } catch (err) {
    console.error("[Branding] Error fetching by slug:", err);
    return null;
  }
}

/**
 * Clear branding cache for an agency (call after branding settings update).
 */
export function clearBrandingCache(agencyId: string): void {
  brandingCache.delete(agencyId);
}
