/**
 * Branding Queries
 * 
 * UNIFIED: Reads from `agencies.custom_branding` JSONB column (single source of truth).
 * Fetched server-side for email sending — uses admin client to bypass RLS.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_BRANDING, type AgencyBranding } from "@/types/branding";

// In-memory cache for branding data (5 minute TTL)
const brandingCache = new Map<string, { data: AgencyBranding | null; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Map the JSONB custom_branding column + agency fields into the full AgencyBranding shape */
function mapToBranding(agency: {
  id: string;
  name: string;
  custom_branding: Record<string, unknown> | null;
  white_label_enabled: boolean | null;
}): AgencyBranding {
  const cb = (agency.custom_branding || {}) as Record<string, unknown>;

  return {
    id: agency.id,
    agency_id: agency.id,
    agency_display_name: (cb.agency_display_name as string) || (cb.display_name as string) || agency.name || DEFAULT_BRANDING.agency_display_name,
    tagline: (cb.tagline as string) || null,
    logo_url: (cb.logo_url as string) || null,
    logo_dark_url: (cb.logo_dark_url as string) || null,
    favicon_url: (cb.favicon_url as string) || null,
    apple_touch_icon_url: (cb.apple_touch_icon_url as string) || null,
    primary_color: (cb.primary_color as string) || DEFAULT_BRANDING.primary_color,
    primary_foreground: (cb.primary_foreground as string) || DEFAULT_BRANDING.primary_foreground,
    accent_color: (cb.accent_color as string) || (cb.secondary_color as string) || DEFAULT_BRANDING.accent_color,
    accent_foreground: (cb.accent_foreground as string) || DEFAULT_BRANDING.accent_foreground,
    email_from_name: (cb.email_from_name as string) || null,
    email_reply_to: (cb.email_reply_to as string) || null,
    email_footer_text: (cb.email_footer_text as string) || null,
    email_footer_address: (cb.email_footer_address as string) || null,
    email_logo_url: (cb.email_logo_url as string) || null,
    email_social_links: (cb.email_social_links as Record<string, string>) || {},
    portal_welcome_title: (cb.portal_welcome_title as string) || null,
    portal_welcome_subtitle: (cb.portal_welcome_subtitle as string) || null,
    portal_login_background_url: (cb.portal_login_background_url as string) || null,
    portal_custom_css: (cb.portal_custom_css as string) || null,
    support_email: (cb.support_email as string) || null,
    support_url: (cb.support_url as string) || null,
    privacy_policy_url: (cb.privacy_policy_url as string) || null,
    terms_of_service_url: (cb.terms_of_service_url as string) || null,
    white_label_level: (cb.white_label_level as "basic" | "full" | "custom") || (agency.white_label_enabled ? "full" : "basic"),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

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
    const { data: agency, error } = await supabase
      .from("agencies")
      .select("id, name, custom_branding, white_label_enabled")
      .eq("id", agencyId)
      .single();

    if (error || !agency) {
      if (error?.code !== "PGRST116") {
        console.error("[Branding] Error fetching branding:", error);
      }
      brandingCache.set(agencyId, { data: null, expiry: Date.now() + CACHE_TTL });
      return null;
    }

    const branding = mapToBranding(agency as { id: string; name: string; custom_branding: Record<string, unknown> | null; white_label_enabled: boolean | null });
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
