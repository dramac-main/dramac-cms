"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createSiteSchema, updateSiteSchema } from "@/lib/validations/site";
import type { SiteFilters } from "@/types/site";
import type { Json } from "@/types/database";

// Get all sites for the current organization
export async function getSites(filters?: SiteFilters) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) throw new Error("No organization found");

  let query = supabase
    .from("sites")
    .select(`
      *,
      client:clients(id, name, company)
    `)
    .eq("agency_id", profile.agency_id);

  // Apply filters
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,subdomain.ilike.%${filters.search}%`);
  }

  if (filters?.status && filters.status !== "all") {
    if (filters.status === "published") {
      query = query.eq("published", true);
    } else if (filters.status === "draft") {
      query = query.eq("published", false);
    }
  }

  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || "created_at";
  const sortOrder = filters?.sortOrder || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Get single site by ID
export async function getSite(siteId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("sites")
    .select(`
      *,
      client:clients(id, name, company),
      pages(id, name, slug, is_homepage, created_at)
    `)
    .eq("id", siteId)
    .single();

  if (error) throw error;
  return data;
}

// Check if subdomain is available
export async function checkSubdomain(subdomain: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .select("id")
    .eq("subdomain", subdomain.toLowerCase())
    .maybeSingle(); // Returns null if no match, throws on multiple matches

  if (error) throw error;
  return { available: data === null };
}

// Create new site
export async function createSiteAction(formData: unknown) {
  const validated = createSiteSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data", details: validated.error.flatten() };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) return { error: "No organization found" };

  // Create site (database constraint will catch duplicates)
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      name: validated.data.name,
      subdomain: validated.data.subdomain.toLowerCase(),
      client_id: validated.data.client_id,
      agency_id: profile.agency_id,
      settings: validated.data.description ? { description: validated.data.description } : {},
      published: false,
    })
    .select()
    .single();

  if (siteError) {
    // Check if it's a duplicate subdomain error
    if (siteError.code === '23505' && siteError.message.includes('subdomain')) {
      return { error: "This subdomain is already taken. Please choose a different one." };
    }
    return { error: siteError.message };
  }

  // Create default homepage
  const { data: homepage, error: pageError } = await supabase
    .from("pages")
    .insert({
      site_id: site.id,
      name: "Home",
      slug: "/",
      is_homepage: true,
    })
    .select()
    .single();

  if (pageError || !homepage) {
    // Cleanup site if page creation fails
    await supabase.from("sites").delete().eq("id", site.id);
    return { error: "Failed to create homepage" };
  }

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/clients/${validated.data.client_id}`);
  return { success: true, data: { site, homepage } };
}

// Update site
export async function updateSiteAction(siteId: string, formData: unknown) {
  const validated = updateSiteSchema.safeParse(formData);

  if (!validated.success) {
    return { error: "Invalid form data", details: validated.error.flatten() };
  }

  const supabase = await createClient();

  // Check subdomain if being changed
  if (validated.data.subdomain) {
    const { data: existingSite } = await supabase
      .from("sites")
      .select("id, subdomain")
      .eq("id", siteId)
      .single();

    if (existingSite && existingSite.subdomain !== validated.data.subdomain) {
      const { available } = await checkSubdomain(validated.data.subdomain);
      if (!available) {
        return { error: "Subdomain is already taken" };
      }
    }
  }

  const { data, error } = await supabase
    .from("sites")
    .update({
      name: validated.data.name,
      subdomain: validated.data.subdomain?.toLowerCase(),
      custom_domain: validated.data.custom_domain,
      published: validated.data.published,
      seo_title: validated.data.seo_title,
      seo_description: validated.data.seo_description,
      seo_image: validated.data.seo_image,
      settings: validated.data.settings as Json | undefined,
    })
    .eq("id", siteId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { success: true, data };
}

// Delete site
export async function deleteSiteAction(siteId: string) {
  const supabase = await createClient();

  // Delete pages first (cascade should handle this but being explicit)
  await supabase.from("pages").delete().eq("site_id", siteId);

  const { error } = await supabase.from("sites").delete().eq("id", siteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sites");
  return { success: true };
}

// Publish/unpublish site
export async function publishSiteAction(siteId: string, publish: boolean) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sites")
    .update({
      published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .eq("id", siteId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/sites/${siteId}`);
  return { success: true, data };
}

/**
 * Get enabled modules for a site
 * Returns a map of module slugs that are enabled for the site
 */
export async function getSiteEnabledModules(siteId: string): Promise<Set<string>> {
  const supabase = await createClient();

  // Get site with client info to check agency
  const { data: site } = await supabase
    .from("sites")
    .select("client:clients(agency_id)")
    .eq("id", siteId)
    .single();

  if (!site?.client?.agency_id) {
    return new Set();
  }

  const agencyId = site.client.agency_id;

  // Get all module subscriptions for the agency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriptions } = await (supabase as any)
    .from("agency_module_subscriptions")
    .select("module_id")
    .eq("agency_id", agencyId)
    .eq("status", "active");

  if (!subscriptions?.length) {
    return new Set();
  }

  // Get modules enabled for this site
  const { data: siteModules } = await supabase
    .from("site_module_installations")
    .select("module_id")
    .eq("site_id", siteId)
    .eq("is_enabled", true);

  if (!siteModules?.length) {
    return new Set();
  }

  // Get module slugs for enabled modules
  const enabledModuleIds = new Set(siteModules.map((sm) => sm.module_id));
  
  // Get slugs for these modules from modules_v2
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: modules } = await (supabase as any)
    .from("modules_v2")
    .select("id, slug")
    .in("id", Array.from(enabledModuleIds));

  const enabledSlugs = new Set<string>();
  if (modules) {
    for (const mod of modules) {
      enabledSlugs.add(mod.slug);
    }
  }

  return enabledSlugs;
}

/**
 * Check if a specific module is enabled for a site
 */
export async function isModuleEnabledForSite(
  siteId: string,
  moduleSlug: string
): Promise<boolean> {
  const enabledModules = await getSiteEnabledModules(siteId);
  return enabledModules.has(moduleSlug);
}

/**
 * Persist AI-generated design tokens into site.settings.theme
 * 
 * Called after the AI designer generates a website. Merges the designTokens
 * into the site's existing settings so that the brand color resolution system
 * can read them at render time (via resolveBrandColors in brand-colors.ts).
 * 
 * Also writes the top-level flat branding fields (primary_color, etc.)
 * if they are not already set, so older code paths also pick them up.
 */
export async function persistDesignTokensAction(
  siteId: string,
  designTokens: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontHeading?: string;
    fontBody?: string;
    borderRadius?: string;
    shadowStyle?: string;
    spacingScale?: string;
  }
) {
  if (!siteId || !designTokens) {
    return { error: "Missing siteId or designTokens" };
  }

  const supabase = await createClient();

  // Fetch current settings so we can merge (not overwrite)
  const { data: site, error: fetchError } = await supabase
    .from("sites")
    .select("settings")
    .eq("id", siteId)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const currentSettings = (site?.settings as Record<string, unknown>) || {};

  // Build the theme sub-object from designTokens
  const themeUpdate = {
    primaryColor: designTokens.primaryColor,
    secondaryColor: designTokens.secondaryColor,
    accentColor: designTokens.accentColor,
    backgroundColor: designTokens.backgroundColor,
    textColor: designTokens.textColor,
    fontHeading: designTokens.fontHeading,
    fontBody: designTokens.fontBody,
    borderRadius: designTokens.borderRadius,
    shadowStyle: designTokens.shadowStyle,
    spacingScale: designTokens.spacingScale,
  };

  // Remove undefined values
  const cleanTheme = Object.fromEntries(
    Object.entries(themeUpdate).filter(([, v]) => v !== undefined)
  );

  // Merge into settings: preserve existing settings, nest designTokens under .theme,
  // and also set flat branding fields if not already present
  const mergedSettings = {
    ...currentSettings,
    theme: {
      ...((currentSettings.theme as Record<string, unknown>) || {}),
      ...cleanTheme,
    },
    // Set flat branding fields only if not already set
    ...(currentSettings.primary_color ? {} : designTokens.primaryColor ? { primary_color: designTokens.primaryColor } : {}),
    ...(currentSettings.secondary_color ? {} : designTokens.secondaryColor ? { secondary_color: designTokens.secondaryColor } : {}),
    ...(currentSettings.accent_color ? {} : designTokens.accentColor ? { accent_color: designTokens.accentColor } : {}),
  };

  const { error: updateError } = await supabase
    .from("sites")
    .update({ settings: mergedSettings as Json })
    .eq("id", siteId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath(`/dashboard/sites/${siteId}`);
  return { success: true };
}
