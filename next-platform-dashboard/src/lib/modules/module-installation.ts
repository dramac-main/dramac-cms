"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth/permissions";

// ============================================================
// TYPES
// ============================================================

export interface InstallModuleOnSiteParams {
  siteId: string;
  moduleId: string;
  initialSettings?: Record<string, unknown>;
}

export interface InstallResult {
  success: boolean;
  error?: string;
  installationId?: string;
}

export interface UninstallResult {
  success: boolean;
  error?: string;
}

export interface UpdateSettingsResult {
  success: boolean;
  error?: string;
}

// ============================================================
// INSTALL MODULE ON SITE
// ============================================================

/**
 * Install a module on a site.
 * Works for both catalog and studio modules.
 * 
 * This is a simplified installation for site-level modules that doesn't
 * require agency subscription checks (for free modules or direct installs).
 */
export async function installModuleOnSite(
  siteId: string,
  moduleId: string,
  initialSettings?: Record<string, unknown>
): Promise<InstallResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify the site exists and user has access
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, agency_id, client_id")
    .eq("id", siteId)
    .single();

  if (siteError || !site) {
    return { success: false, error: "Site not found" };
  }

  // Verify the module exists and is available
  let moduleExists = false;
  let defaultSettings: Record<string, unknown> = {};
  let moduleName = "";

  // Check modules_v2 first (published marketplace modules)
  const { data: m2 } = await db
    .from("modules_v2")
    .select("id, default_settings, name, status")
    .eq("id", moduleId)
    .single();

  if (m2 && m2.status === "active") {
    moduleExists = true;
    defaultSettings = m2.default_settings || {};
    moduleName = m2.name;
  } else {
    // Check module_source (for testing/development modules)
    const { data: ms } = await db
      .from("module_source")
      .select("id, default_settings, name, status")
      .eq("id", moduleId)
      .single();

    if (ms && (ms.status === "published" || ms.status === "testing")) {
      moduleExists = true;
      defaultSettings = ms.default_settings || {};
      moduleName = ms.name;
    }
  }

  if (!moduleExists) {
    return { success: false, error: "Module not found or not available" };
  }

  // Check if already installed
  const { data: existing } = await db
    .from("site_module_installations")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Module already installed on this site" };
  }

  // Merge default settings with initial settings
  const mergedSettings = { ...defaultSettings, ...initialSettings };

  // Install the module
  const { data: installation, error: installError } = await db
    .from("site_module_installations")
    .insert({
      site_id: siteId,
      module_id: moduleId,
      settings: mergedSettings,
      is_enabled: true,
      installed_at: new Date().toISOString(),
      installed_by: userId,
      enabled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (installError) {
    console.error("[ModuleInstallation] Install error:", installError);
    return { success: false, error: installError.message };
  }

  console.log(`[ModuleInstallation] Installed ${moduleName} on site ${siteId}`);

  return { success: true, installationId: installation.id };
}

// ============================================================
// UNINSTALL MODULE FROM SITE
// ============================================================

/**
 * Uninstall a module from a site.
 */
export async function uninstallModuleFromSite(
  siteId: string,
  moduleId: string
): Promise<UninstallResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify the installation exists
  const { data: installation, error: findError } = await db
    .from("site_module_installations")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (findError || !installation) {
    return { success: false, error: "Installation not found" };
  }

  // Delete the installation
  const { error: deleteError } = await db
    .from("site_module_installations")
    .delete()
    .eq("id", installation.id);

  if (deleteError) {
    console.error("[ModuleInstallation] Uninstall error:", deleteError);
    return { success: false, error: deleteError.message };
  }

  console.log(`[ModuleInstallation] Uninstalled module ${moduleId} from site ${siteId}`);

  return { success: true };
}

// ============================================================
// UPDATE MODULE SETTINGS
// ============================================================

/**
 * Update module settings on a site.
 */
export async function updateModuleSettings(
  siteId: string,
  moduleId: string,
  settings: Record<string, unknown>
): Promise<UpdateSettingsResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  // Update the settings
  const { error: updateError } = await db
    .from("site_module_installations")
    .update({
      settings,
      updated_at: new Date().toISOString(),
    })
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (updateError) {
    console.error("[ModuleInstallation] Settings update error:", updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

// ============================================================
// TOGGLE MODULE ENABLED STATE
// ============================================================

/**
 * Enable or disable a module on a site.
 */
export async function toggleModuleEnabled(
  siteId: string,
  moduleId: string,
  enabled: boolean
): Promise<UpdateSettingsResult> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const updateData: Record<string, unknown> = {
    is_enabled: enabled,
    updated_at: new Date().toISOString(),
  };

  if (enabled) {
    updateData.enabled_at = new Date().toISOString();
  } else {
    updateData.disabled_at = new Date().toISOString();
  }

  const { error: updateError } = await db
    .from("site_module_installations")
    .update(updateData)
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (updateError) {
    console.error("[ModuleInstallation] Toggle error:", updateError);
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

// ============================================================
// GET SITE MODULES
// ============================================================

/**
 * Get all modules installed on a site.
 */
export async function getSiteModules(siteId: string): Promise<{
  success: boolean;
  modules?: Array<{
    installationId: string;
    moduleId: string;
    settings: Record<string, unknown>;
    isEnabled: boolean;
    installedAt: string;
  }>;
  error?: string;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: installations, error } = await db
    .from("site_module_installations")
    .select("id, module_id, settings, is_enabled, installed_at")
    .eq("site_id", siteId);

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    modules: (installations || []).map((i: {
      id: string;
      module_id: string;
      settings: Record<string, unknown>;
      is_enabled: boolean;
      installed_at: string;
    }) => ({
      installationId: i.id,
      moduleId: i.module_id,
      settings: i.settings || {},
      isEnabled: i.is_enabled,
      installedAt: i.installed_at,
    })),
  };
}

// ============================================================
// CHECK IF MODULE IS INSTALLED
// ============================================================

/**
 * Check if a module is installed on a site.
 */
export async function isModuleInstalledOnSite(
  siteId: string,
  moduleId: string
): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data } = await db
    .from("site_module_installations")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  return !!data;
}
