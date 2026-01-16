"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  ModuleInstallLevel,
  ModuleRow,
} from "../types";

// Note: Using AnyClient type alias for new module tables.
// Once Supabase types are regenerated with the new schema,
// replace AnyClient with proper SupabaseClient type.

import type { SupabaseClient } from "@supabase/supabase-js";

// Temporary type alias until types are regenerated
type AnyClient = SupabaseClient<any, "public", any>;

// =============================================================
// TYPES
// =============================================================

export interface InstallModuleParams {
  moduleId: string;
  installLevel: ModuleInstallLevel;
  agencyId: string;
  clientId?: string;
  siteId?: string;
  settings?: Record<string, unknown>;
  installedBy?: string;
}

export interface InstallResult {
  success: boolean;
  error?: string;
  installationId?: string;
}

export interface UninstallModuleParams {
  moduleId: string;
  installLevel: ModuleInstallLevel;
  agencyId: string;
  clientId?: string;
  siteId?: string;
}

export interface UninstallResult {
  success: boolean;
  error?: string;
}

export interface ToggleModuleParams {
  installationId: string;
  installLevel: ModuleInstallLevel;
  enabled: boolean;
}

export interface UpdateSettingsParams {
  installationId: string;
  installLevel: ModuleInstallLevel;
  settings: Record<string, unknown>;
}

// =============================================================
// MODULE INSTALLATION SERVICE
// =============================================================

/**
 * Install a module at the appropriate level
 */
export async function installModule(
  params: InstallModuleParams
): Promise<InstallResult> {
  const supabase = await createClient();
  const { moduleId, installLevel, agencyId, clientId, siteId, settings = {}, installedBy } = params;

  try {
    // 1. Verify module exists and matches install level
    const { data: moduleData, error: moduleError } = await (supabase as AnyClient)
      .from("modules_v2")
      .select("*")
      .eq("id", moduleId)
      .eq("status", "active")
      .single();

    if (moduleError || !moduleData) {
      return { success: false, error: "Module not found or inactive" };
    }

    const moduleRecord = moduleData as ModuleRow;

    if (moduleRecord.install_level !== installLevel) {
      return {
        success: false,
        error: `Module can only be installed at ${moduleRecord.install_level} level`,
      };
    }

    // 2. Verify agency has subscription to this module (for paid modules)
    let subscriptionId: string | undefined;
    
    if (moduleRecord.pricing_type !== "free") {
      const { data: subscription } = await (supabase as AnyClient)
        .from("agency_module_subscriptions")
        .select("*")
        .eq("agency_id", agencyId)
        .eq("module_id", moduleId)
        .eq("status", "active")
        .single();

      if (!subscription) {
        return { success: false, error: "Agency must subscribe to this module first" };
      }

      // Check installation limits
      if (subscription.max_installations !== null) {
        if (subscription.current_installations >= subscription.max_installations) {
          return { success: false, error: "Installation limit reached for this module" };
        }
      }

      subscriptionId = subscription.id;
    }

    // 3. Install based on level
    switch (installLevel) {
      case "agency":
        return installForAgency(supabase, moduleId, agencyId, subscriptionId, settings, installedBy);

      case "client":
        if (!clientId) {
          return { success: false, error: "Client ID required for client-level installation" };
        }
        return installForClient(supabase, moduleId, clientId, agencyId, subscriptionId, settings, installedBy);

      case "site":
        if (!siteId) {
          return { success: false, error: "Site ID required for site-level installation" };
        }
        return installForSite(supabase, moduleId, siteId, agencyId, clientId, subscriptionId, settings, installedBy);

      default:
        return { success: false, error: "Invalid install level" };
    }
  } catch (error) {
    console.error("[InstallationService] Error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Install module for agency
 */
async function installForAgency(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
  agencyId: string,
  subscriptionId: string | undefined,
  settings: Record<string, unknown>,
  installedBy?: string
): Promise<InstallResult> {
  const db = supabase as AnyClient;
  
  // Check if already installed
  const { data: existing } = await db
    .from("agency_module_installations")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Module already installed for this agency" };
  }

  const { data, error } = await db
    .from("agency_module_installations")
    .insert({
      agency_id: agencyId,
      module_id: moduleId,
      subscription_id: subscriptionId,
      is_enabled: true,
      settings,
      installed_at: new Date().toISOString(),
      installed_by: installedBy,
      enabled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[InstallationService] Agency install error:", error);
    return { success: false, error: "Failed to install module" };
  }

  // Update subscription installation count
  if (subscriptionId) {
    await db.rpc("increment_module_installations", { sub_id: subscriptionId });
  }

  return { success: true, installationId: data.id };
}

/**
 * Install module for client
 */
async function installForClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
  clientId: string,
  agencyId: string,
  subscriptionId: string | undefined,
  settings: Record<string, unknown>,
  installedBy?: string
): Promise<InstallResult> {
  const db = supabase as AnyClient;
  
  // Verify client belongs to agency
  const { data: client } = await supabase
    .from("clients")
    .select("id, agency_id")
    .eq("id", clientId)
    .single();

  if (!client || client.agency_id !== agencyId) {
    return { success: false, error: "Client not found or doesn't belong to agency" };
  }

  // Check if already installed
  const { data: existing } = await db
    .from("client_module_installations")
    .select("id")
    .eq("client_id", clientId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Module already installed for this client" };
  }

  // Get pricing for client
  const clientPrice = await calculateClientPrice(supabase, moduleId, agencyId);

  const { data, error } = await db
    .from("client_module_installations")
    .insert({
      client_id: clientId,
      module_id: moduleId,
      agency_subscription_id: subscriptionId,
      billing_status: "active",
      price_paid: clientPrice,
      billing_cycle: "monthly",
      is_enabled: true,
      settings,
      installed_at: new Date().toISOString(),
      installed_by: installedBy,
      enabled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[InstallationService] Client install error:", error);
    return { success: false, error: "Failed to install module" };
  }

  // Update subscription installation count
  if (subscriptionId) {
    await db.rpc("increment_module_installations", { sub_id: subscriptionId });
  }

  return { success: true, installationId: data.id };
}

/**
 * Install module for site
 */
async function installForSite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
  siteId: string,
  agencyId: string,
  clientId: string | undefined,
  subscriptionId: string | undefined,
  settings: Record<string, unknown>,
  installedBy?: string
): Promise<InstallResult> {
  const db = supabase as AnyClient;
  
  // Verify site belongs to agency
  const { data: site } = await supabase
    .from("sites")
    .select("id, agency_id, client_id")
    .eq("id", siteId)
    .single();

  if (!site || site.agency_id !== agencyId) {
    return { success: false, error: "Site not found or doesn't belong to agency" };
  }

  // Check if already installed
  const { data: existing } = await db
    .from("site_module_installations")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Module already installed for this site" };
  }

  // For site-level modules, check if client has the module installed
  let clientInstallationId: string | undefined;
  if (site.client_id) {
    const { data: clientInstall } = await db
      .from("client_module_installations")
      .select("id")
      .eq("client_id", site.client_id)
      .eq("module_id", moduleId)
      .maybeSingle();

    clientInstallationId = clientInstall?.id;
  }

  const { data, error } = await db
    .from("site_module_installations")
    .insert({
      site_id: siteId,
      module_id: moduleId,
      client_installation_id: clientInstallationId,
      agency_subscription_id: subscriptionId,
      is_enabled: true,
      settings,
      installed_at: new Date().toISOString(),
      installed_by: installedBy,
      enabled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[InstallationService] Site install error:", error);
    return { success: false, error: "Failed to install module" };
  }

  // Update subscription installation count
  if (subscriptionId) {
    await db.rpc("increment_module_installations", { sub_id: subscriptionId });
  }

  return { success: true, installationId: data.id };
}

/**
 * Uninstall a module
 */
export async function uninstallModule(
  params: UninstallModuleParams
): Promise<UninstallResult> {
  const supabase = await createClient();
  const db = supabase as AnyClient;
  const { moduleId, installLevel, agencyId, clientId, siteId } = params;

  try {
    let tableName: string;
    let whereClause: Record<string, string>;

    switch (installLevel) {
      case "agency":
        tableName = "agency_module_installations";
        whereClause = { agency_id: agencyId, module_id: moduleId };
        break;

      case "client":
        if (!clientId) {
          return { success: false, error: "Client ID required" };
        }
        tableName = "client_module_installations";
        whereClause = { client_id: clientId, module_id: moduleId };
        break;

      case "site":
        if (!siteId) {
          return { success: false, error: "Site ID required" };
        }
        tableName = "site_module_installations";
        whereClause = { site_id: siteId, module_id: moduleId };
        break;

      default:
        return { success: false, error: "Invalid install level" };
    }

    // Get installation to find subscription ID
    const { data: installation } = await db
      .from(tableName)
      .select("id, subscription_id, agency_subscription_id")
      .match(whereClause)
      .single();

    if (!installation) {
      return { success: false, error: "Installation not found" };
    }

    // Delete installation
    const { error } = await db.from(tableName).delete().match(whereClause);

    if (error) {
      console.error("[InstallationService] Uninstall error:", error);
      return { success: false, error: "Failed to uninstall module" };
    }

    // Decrement subscription installation count
    const subId = installation.subscription_id || installation.agency_subscription_id;
    if (subId) {
      await db.rpc("decrement_module_installations", { sub_id: subId });
    }

    return { success: true };
  } catch (error) {
    console.error("[InstallationService] Uninstall error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Toggle module enabled/disabled
 */
export async function toggleModule(
  params: ToggleModuleParams
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const db = supabase as AnyClient;
  const { installationId, installLevel, enabled } = params;

  try {
    let tableName: string;

    switch (installLevel) {
      case "agency":
        tableName = "agency_module_installations";
        break;
      case "client":
        tableName = "client_module_installations";
        break;
      case "site":
        tableName = "site_module_installations";
        break;
      default:
        return { success: false, error: "Invalid install level" };
    }

    const { error } = await db
      .from(tableName)
      .update({
        is_enabled: enabled,
        enabled_at: enabled ? new Date().toISOString() : null,
      })
      .eq("id", installationId);

    if (error) {
      console.error("[InstallationService] Toggle error:", error);
      return { success: false, error: "Failed to update module status" };
    }

    return { success: true };
  } catch (error) {
    console.error("[InstallationService] Toggle error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update module settings
 */
export async function updateModuleSettings(
  params: UpdateSettingsParams
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const db = supabase as AnyClient;
  const { installationId, installLevel, settings } = params;

  try {
    let tableName: string;

    switch (installLevel) {
      case "agency":
        tableName = "agency_module_installations";
        break;
      case "client":
        tableName = "client_module_installations";
        break;
      case "site":
        tableName = "site_module_installations";
        break;
      default:
        return { success: false, error: "Invalid install level" };
    }

    const { error } = await db
      .from(tableName)
      .update({ settings })
      .eq("id", installationId);

    if (error) {
      console.error("[InstallationService] Settings update error:", error);
      return { success: false, error: "Failed to update settings" };
    }

    return { success: true };
  } catch (error) {
    console.error("[InstallationService] Settings update error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================
// QUERY FUNCTIONS
// =============================================================

/**
 * Get all installed modules for an agency
 */
export async function getAgencyModuleInstallations(agencyId: string) {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  const { data, error } = await db
    .from("agency_module_installations")
    .select(`
      *,
      module:modules_v2(*)
    `)
    .eq("agency_id", agencyId);

  if (error) {
    console.error("[InstallationService] Get agency installations error:", error);
    return [];
  }

  return data || [];
}

/**
 * Get all installed modules for a client
 */
export async function getClientModuleInstallations(clientId: string) {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  const { data, error } = await db
    .from("client_module_installations")
    .select(`
      *,
      module:modules_v2(*)
    `)
    .eq("client_id", clientId);

  if (error) {
    console.error("[InstallationService] Get client installations error:", error);
    return [];
  }

  return data || [];
}

/**
 * Get all installed modules for a site
 */
export async function getSiteModuleInstallations(siteId: string) {
  const supabase = await createClient();
  const db = supabase as AnyClient;

  const { data, error } = await db
    .from("site_module_installations")
    .select(`
      *,
      module:modules_v2(*)
    `)
    .eq("site_id", siteId);

  if (error) {
    console.error("[InstallationService] Get site installations error:", error);
    return [];
  }

  return data || [];
}

/**
 * Check if a module is installed at a specific level
 */
export async function isModuleInstalled(params: {
  moduleId: string;
  installLevel: ModuleInstallLevel;
  agencyId?: string;
  clientId?: string;
  siteId?: string;
}): Promise<boolean> {
  const supabase = await createClient();
  const db = supabase as AnyClient;
  const { moduleId, installLevel, agencyId, clientId, siteId } = params;

  let query;

  switch (installLevel) {
    case "agency":
      if (!agencyId) return false;
      query = db
        .from("agency_module_installations")
        .select("id")
        .eq("agency_id", agencyId)
        .eq("module_id", moduleId);
      break;

    case "client":
      if (!clientId) return false;
      query = db
        .from("client_module_installations")
        .select("id")
        .eq("client_id", clientId)
        .eq("module_id", moduleId);
      break;

    case "site":
      if (!siteId) return false;
      query = db
        .from("site_module_installations")
        .select("id")
        .eq("site_id", siteId)
        .eq("module_id", moduleId);
      break;

    default:
      return false;
  }

  const { data } = await query.maybeSingle();
  return !!data;
}

// =============================================================
// HELPER FUNCTIONS
// =============================================================

/**
 * Calculate what client pays (wholesale + agency markup)
 */
async function calculateClientPrice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  moduleId: string,
  agencyId: string
): Promise<number> {
  const db = supabase as AnyClient;
  
  // Get module wholesale price
  const { data: module } = await db
    .from("modules_v2")
    .select("wholesale_price_monthly")
    .eq("id", moduleId)
    .single();

  if (!module) return 0;

  const wholesalePrice = module.wholesale_price_monthly || 0;

  // Get agency markup
  const { data: subscription } = await db
    .from("agency_module_subscriptions")
    .select("markup_type, markup_percentage, markup_fixed_amount, custom_price_monthly, retail_price_monthly_cached")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .single();

  if (!subscription) return wholesalePrice;

  // Use cached price if available
  if (subscription.retail_price_monthly_cached) {
    return subscription.retail_price_monthly_cached;
  }

  // Calculate based on markup type
  switch (subscription.markup_type) {
    case "percentage":
      return Math.round(wholesalePrice * (1 + (subscription.markup_percentage || 100) / 100));
    case "fixed":
      return wholesalePrice + (subscription.markup_fixed_amount || 0);
    case "custom":
      return subscription.custom_price_monthly || wholesalePrice;
    case "passthrough":
      return wholesalePrice;
    default:
      return wholesalePrice;
  }
}
