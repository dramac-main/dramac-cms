"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createSiteSchema, updateSiteSchema } from "@/lib/validations/site";
import type { SiteFilters } from "@/types/site";
import type { Json } from "@/types/database";
import { bootstrapLiveChatAgent } from "@/modules/live-chat/lib/bootstrap-agent";

// Core modules that are auto-enabled on every new site.
// These form the foundation: CRM for contacts, Automation for workflows,
// Live Chat for real-time communication.
const CORE_MODULE_SLUGS = ["crm", "automation", "live-chat"] as const;

// Get all sites for the current organization
export async function getSites(filters?: SiteFilters) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) throw new Error("No organization found");

  let query = supabase
    .from("sites")
    .select(
      `
      *,
      client:clients(id, name, company)
    `,
    )
    .eq("agency_id", profile.agency_id);

  // Apply filters
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,subdomain.ilike.%${filters.search}%`,
    );
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("sites")
    .select(
      `
      *,
      client:clients(id, name, company),
      pages(id, name, slug, is_homepage, created_at)
    `,
    )
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
      settings: validated.data.description
        ? { description: validated.data.description }
        : {},
      published: false,
    })
    .select()
    .single();

  if (siteError) {
    // Check if it's a duplicate subdomain error
    if (siteError.code === "23505" && siteError.message.includes("subdomain")) {
      return {
        error:
          "This subdomain is already taken. Please choose a different one.",
      };
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

  // Auto-enable core modules (CRM, Automation, Live Chat) on every new site
  await installCoreModules(site.id, profile.agency_id, user.id).catch((err) =>
    console.error("[Sites] Failed to auto-install core modules:", err),
  );

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/clients/${validated.data.client_id}`);
  return { success: true, data: { site, homepage } };
}

// ============================================================================
// CORE MODULE AUTO-INSTALL
// ============================================================================

/**
 * Auto-install core modules for a new site.
 * Creates agency_module_subscriptions (if missing) + site_module_installations.
 * Uses admin client so it works regardless of RLS.
 */
async function installCoreModules(
  siteId: string,
  agencyId: string,
  userId: string,
): Promise<void> {
  const supabase = createAdminClient();

  // Resolve module slugs to UUIDs
  const { data: modules, error: modError } = await (supabase as any)
    .from("modules_v2")
    .select("id, slug, name")
    .in("slug", [...CORE_MODULE_SLUGS]);

  if (modError || !modules?.length) {
    console.warn(
      "[Sites] Core module definitions not found in modules_v2:",
      modError?.message,
    );
    return;
  }

  for (const mod of modules) {
    try {
      // Step 1: Ensure agency subscription exists
      let subscriptionId: string | null = null;

      const { data: existingSub } = await (supabase as any)
        .from("agency_module_subscriptions")
        .select("id, status")
        .eq("agency_id", agencyId)
        .eq("module_id", mod.id)
        .single();

      if (existingSub) {
        subscriptionId = existingSub.id;
        if (existingSub.status !== "active") {
          await (supabase as any)
            .from("agency_module_subscriptions")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("id", existingSub.id);
        }
      } else {
        const { data: newSub } = await (supabase as any)
          .from("agency_module_subscriptions")
          .insert({
            agency_id: agencyId,
            module_id: mod.id,
            status: "active",
            billing_cycle: "monthly",
          })
          .select("id")
          .single();
        subscriptionId = newSub?.id || null;
      }

      // Step 2: Create site installation (skip if already exists)
      const { data: existing } = await supabase
        .from("site_module_installations")
        .select("id, is_enabled")
        .eq("site_id", siteId)
        .eq("module_id", mod.id)
        .single();

      if (existing) {
        if (!existing.is_enabled) {
          await supabase
            .from("site_module_installations")
            .update({
              is_enabled: true,
              enabled_at: new Date().toISOString(),
              agency_subscription_id: subscriptionId,
            })
            .eq("id", existing.id);
        }
        continue;
      }

      await supabase.from("site_module_installations").insert({
        site_id: siteId,
        module_id: mod.id,
        is_enabled: true,
        installed_at: new Date().toISOString(),
        installed_by: userId,
        enabled_at: new Date().toISOString(),
        agency_subscription_id: subscriptionId,
        settings: {},
      });

      console.log(
        `[Sites] Core module ${mod.slug} installed for site ${siteId}`,
      );

      // Step 3: For Live Chat — auto-register the site owner as the first agent
      // so chat conversations have someone to route to immediately.
      if (mod.slug === "live-chat") {
        await bootstrapLiveChatAgent(siteId, userId).catch((err) =>
          console.error("[Sites] Failed to bootstrap live chat agent:", err),
        );
        await seedDefaultDepartments(siteId).catch((err) =>
          console.error("[Sites] Failed to seed default departments:", err),
        );
      }
    } catch (err) {
      console.error(`[Sites] Failed to install core module ${mod.slug}:`, err);
    }
  }

  // Step 4: Install automation starter packs AFTER all modules are installed
  // (so getPacksForModules can find booking, ecommerce, etc.)
  try {
    const { installDefaultAutomationPacks } =
      await import("@/modules/automation/actions/automation-actions");
    await installDefaultAutomationPacks(siteId);
  } catch (err) {
    console.error("[Sites] Failed to install automation packs:", err);
  }
}

// bootstrapLiveChatAgent is now imported from @/modules/live-chat/lib/bootstrap-agent

/** Seed industry-standard departments when live-chat is first installed for a site. */
async function seedDefaultDepartments(siteId: string): Promise<void> {
  const supabase = createAdminClient();

  // Check if departments already exist for this site
  const { count } = await (supabase as any)
    .from("mod_chat_departments")
    .select("*", { count: "exact", head: true })
    .eq("site_id", siteId);

  if ((count || 0) > 0) return; // Already seeded

  const departments = [
    {
      name: "General",
      description: "General enquiries and information",
      is_default: true,
    },
    { name: "Sales", description: "Sales enquiries, pricing, and quotes" },
    { name: "Support", description: "Technical support and troubleshooting" },
    {
      name: "Billing",
      description: "Billing, invoices, and payment enquiries",
    },
    {
      name: "Customer Service",
      description: "Customer service and account management",
    },
  ];

  for (let i = 0; i < departments.length; i++) {
    const dept = departments[i];
    await (supabase as any).from("mod_chat_departments").insert({
      site_id: siteId,
      name: dept.name,
      description: dept.description,
      is_default: dept.is_default || false,
      is_active: true,
      auto_assign: true,
      max_concurrent_chats: 5,
      sort_order: i,
    });
  }

  console.log(
    `[Sites] Seeded ${departments.length} default departments for site ${siteId}`,
  );
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
export async function getSiteEnabledModules(
  siteId: string,
): Promise<Set<string>> {
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
  moduleSlug: string,
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
 * ALWAYS writes the flat branding fields (primary_color, etc.) so that
 * the renderer, AI context builder, and branding settings all stay in sync.
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
  },
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
    Object.entries(themeUpdate).filter(([, v]) => v !== undefined),
  );

  // Merge into settings: preserve existing settings, nest designTokens under .theme,
  // and also set flat branding fields if not already present
  const mergedSettings = {
    ...currentSettings,
    theme: {
      ...((currentSettings.theme as Record<string, unknown>) || {}),
      ...cleanTheme,
    },
    // ALWAYS write flat branding fields — these are the canonical source of truth
    // for the renderer, AI context builder, and branding settings UI.
    // Previous behavior only wrote if absent, causing stale data on re-generation.
    ...(designTokens.primaryColor
      ? { primary_color: designTokens.primaryColor }
      : {}),
    ...(designTokens.secondaryColor
      ? { secondary_color: designTokens.secondaryColor }
      : {}),
    ...(designTokens.accentColor
      ? { accent_color: designTokens.accentColor }
      : {}),
    ...(designTokens.backgroundColor
      ? { background_color: designTokens.backgroundColor }
      : {}),
    ...(designTokens.textColor ? { text_color: designTokens.textColor } : {}),
    ...(designTokens.fontHeading
      ? { font_heading: designTokens.fontHeading }
      : {}),
    ...(designTokens.fontBody ? { font_body: designTokens.fontBody } : {}),
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

// ============================================================================
// Site Branding Settings
// ============================================================================

export interface SiteBrandingData {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_heading: string;
  font_body: string;
  logo_url: string;
  favicon_url: string;
}

/**
 * Get site branding data from settings.
 * Reads flat fields first, falls back to theme.* (camelCase).
 */
export async function getSiteBrandingAction(siteId: string): Promise<{
  data?: SiteBrandingData;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: site, error } = await supabase
    .from("sites")
    .select("settings")
    .eq("id", siteId)
    .single();

  if (error) return { error: error.message };

  const settings = (site?.settings as Record<string, unknown>) || {};
  const theme = (settings.theme as Record<string, unknown>) || {};

  return {
    data: {
      primary_color:
        (settings.primary_color as string) ||
        (theme.primaryColor as string) ||
        "",
      secondary_color:
        (settings.secondary_color as string) ||
        (theme.secondaryColor as string) ||
        "",
      accent_color:
        (settings.accent_color as string) ||
        (theme.accentColor as string) ||
        "",
      background_color:
        (settings.background_color as string) ||
        (theme.backgroundColor as string) ||
        "#ffffff",
      text_color:
        (settings.text_color as string) ||
        (theme.textColor as string) ||
        "#0f172a",
      font_heading:
        (settings.font_heading as string) ||
        (theme.fontHeading as string) ||
        "",
      font_body:
        (settings.font_body as string) || (theme.fontBody as string) || "",
      logo_url: (settings.logo_url as string) || "",
      favicon_url: (settings.favicon_url as string) || "",
    },
  };
}

/**
 * Update site branding settings.
 * Writes to BOTH flat fields AND theme.* for full compatibility.
 * This is the SINGLE source of truth for site branding.
 */
export async function updateSiteBrandingAction(
  siteId: string,
  branding: SiteBrandingData,
): Promise<{ success?: boolean; error?: string }> {
  if (!siteId) return { error: "Missing siteId" };

  const supabase = await createClient();

  // Fetch current settings to merge
  const { data: site, error: fetchError } = await supabase
    .from("sites")
    .select("settings")
    .eq("id", siteId)
    .single();

  if (fetchError) return { error: fetchError.message };

  const currentSettings = (site?.settings as Record<string, unknown>) || {};
  const currentTheme = (currentSettings.theme as Record<string, unknown>) || {};

  const mergedSettings = {
    ...currentSettings,
    // Flat fields (canonical for renderer + AI context builder)
    primary_color: branding.primary_color || undefined,
    secondary_color: branding.secondary_color || undefined,
    accent_color: branding.accent_color || undefined,
    background_color: branding.background_color || undefined,
    text_color: branding.text_color || undefined,
    font_heading: branding.font_heading || undefined,
    font_body: branding.font_body || undefined,
    logo_url: branding.logo_url || undefined,
    favicon_url: branding.favicon_url || undefined,
    // Theme sub-object (for AI designer design tokens compatibility)
    theme: {
      ...currentTheme,
      primaryColor: branding.primary_color || undefined,
      secondaryColor: branding.secondary_color || undefined,
      accentColor: branding.accent_color || undefined,
      backgroundColor: branding.background_color || undefined,
      textColor: branding.text_color || undefined,
      fontHeading: branding.font_heading || undefined,
      fontBody: branding.font_body || undefined,
      logoUrl: branding.logo_url || undefined,
      faviconUrl: branding.favicon_url || undefined,
    },
  };

  const { error: updateError } = await supabase
    .from("sites")
    .update({ settings: mergedSettings as Json })
    .eq("id", siteId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/dashboard/sites/${siteId}`);
  revalidatePath(`/dashboard/sites/${siteId}/settings`);
  return { success: true };
}

// ============================================================================
// Site Logo & Favicon Upload
// ============================================================================

/**
 * Upload a logo image for a site.
 * Stores in Supabase Storage "branding" bucket under sites/{siteId}/ path.
 * Updates the site settings.logo_url with the public URL.
 */
export async function uploadSiteLogoAction(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  // Use admin client to bypass storage RLS policies
  const supabase = createAdminClient();
  const file = formData.get("file") as File;
  const siteId = formData.get("siteId") as string;
  const type = (formData.get("type") as string) || "logo"; // "logo" or "favicon"

  if (!file || !siteId) {
    return { error: "Missing file or site ID" };
  }

  // Validate file type
  const validTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "image/x-icon",
  ];
  if (!validTypes.includes(file.type)) {
    return {
      error: "Invalid file type. Please upload PNG, JPEG, WebP, SVG, or ICO.",
    };
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { error: "File too large. Maximum size is 2MB." };
  }

  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `sites/${siteId}/${type}-${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("branding")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error(`[Sites] Error uploading ${type}:`, uploadError);
    return { error: `Failed to upload ${type}` };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("branding")
    .getPublicUrl(fileName);

  const publicUrl = urlData.publicUrl;

  // Update site settings with the new URL
  const settingsField = type === "favicon" ? "favicon_url" : "logo_url";

  const { data: site } = await supabase
    .from("sites")
    .select("settings")
    .eq("id", siteId)
    .single();

  const currentSettings = (site?.settings as Record<string, unknown>) || {};
  const currentTheme = (currentSettings.theme as Record<string, unknown>) || {};

  const mergedSettings = {
    ...currentSettings,
    [settingsField]: publicUrl,
    theme: {
      ...currentTheme,
      [type === "favicon" ? "faviconUrl" : "logoUrl"]: publicUrl,
    },
  };

  const { error: updateError } = await supabase
    .from("sites")
    .update({ settings: mergedSettings as Json })
    .eq("id", siteId);

  if (updateError) {
    console.error(
      `[Sites] Error updating settings with ${type} URL:`,
      updateError,
    );
    return { error: `Uploaded but failed to save ${type} URL` };
  }

  revalidatePath(`/dashboard/sites/${siteId}`);
  revalidatePath(`/dashboard/sites/${siteId}/settings`);
  return { url: publicUrl };
}

/**
 * Remove (clear) the logo or favicon URL from site settings.
 */
export async function removeSiteLogoAction(
  siteId: string,
  type: "logo" | "favicon" = "logo",
): Promise<{ success?: boolean; error?: string }> {
  if (!siteId) return { error: "Missing siteId" };

  // Use admin client to bypass storage RLS policies
  const supabase = createAdminClient();

  const { data: site } = await supabase
    .from("sites")
    .select("settings")
    .eq("id", siteId)
    .single();

  const currentSettings = (site?.settings as Record<string, unknown>) || {};
  const currentTheme = (currentSettings.theme as Record<string, unknown>) || {};

  const settingsField = type === "favicon" ? "favicon_url" : "logo_url";
  const themeField = type === "favicon" ? "faviconUrl" : "logoUrl";

  const mergedSettings = {
    ...currentSettings,
    [settingsField]: undefined,
    theme: {
      ...currentTheme,
      [themeField]: undefined,
    },
  };

  const { error: updateError } = await supabase
    .from("sites")
    .update({ settings: mergedSettings as Json })
    .eq("id", siteId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/dashboard/sites/${siteId}`);
  revalidatePath(`/dashboard/sites/${siteId}/settings`);
  return { success: true };
}
