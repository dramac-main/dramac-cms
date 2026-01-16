"use server";

import { createClient } from "@/lib/supabase/server";
import { moduleRegistry } from "./module-registry";
import type { ModuleDefinition, InstalledModule, ModuleSearchParams } from "./module-types";
import type { Json } from "@/types/database";

export interface ModuleInstallResult {
  success: boolean;
  error?: string;
  installation?: InstalledModule;
}

export async function getInstalledModules(siteId: string): Promise<InstalledModule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_modules")
    .select("*")
    .eq("site_id", siteId)
    .eq("is_enabled", true);

  if (error) {
    console.error("[ModuleService] Error fetching installed modules:", error);
    return [];
  }

  return data.map((row) => {
    const module = moduleRegistry.get(row.module_id);
    return {
      id: row.id,
      siteId: row.site_id,
      moduleId: row.module_id,
      module: module!,
      installedAt: new Date(row.enabled_at),
      lastUpdatedAt: new Date(row.enabled_at),
      settings: (row.settings as Record<string, unknown>) || {},
      enabled: row.is_enabled,
      licenseKey: undefined,
    };
  }).filter((m) => m.module); // Filter out modules not in registry
}

export async function installModule(
  siteId: string,
  moduleId: string,
  _licenseKey?: string
): Promise<ModuleInstallResult> {
  const supabase = await createClient();

  // Check module exists
  const module = moduleRegistry.get(moduleId);
  if (!module) {
    return { success: false, error: "Module not found" };
  }

  // Check if already installed
  const { data: existing } = await supabase
    .from("site_modules")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Module already installed" };
  }

  // For paid modules, verify license/purchase (future enhancement)
  // if (module.pricing.type !== "free" && !_licenseKey) {
  //   return { success: false, error: "License key required for paid modules" };
  // }

  // Install module
  const { data, error } = await supabase
    .from("site_modules")
    .insert({
      site_id: siteId,
      module_id: moduleId,
      is_enabled: true,
      settings: {},
      enabled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[ModuleService] Error installing module:", error);
    return { success: false, error: "Failed to install module" };
  }

  return {
    success: true,
    installation: {
      id: data.id,
      siteId: data.site_id,
      moduleId: data.module_id,
      module: module,
      installedAt: new Date(data.enabled_at),
      lastUpdatedAt: new Date(data.enabled_at),
      settings: {},
      enabled: true,
      licenseKey: undefined,
    },
  };
}

export async function uninstallModule(siteId: string, moduleId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_modules")
    .delete()
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (error) {
    console.error("[ModuleService] Error uninstalling module:", error);
    return { success: false, error: "Failed to uninstall module" };
  }

  return { success: true };
}

export async function updateModuleSettings(
  siteId: string,
  moduleId: string,
  settings: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_modules")
    .update({ settings: settings as unknown as Json })
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (error) {
    console.error("[ModuleService] Error updating module settings:", error);
    return { success: false, error: "Failed to update settings" };
  }

  return { success: true };
}

export async function toggleModule(
  siteId: string,
  moduleId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_modules")
    .update({ is_enabled: enabled })
    .eq("site_id", siteId)
    .eq("module_id", moduleId);

  if (error) {
    console.error("[ModuleService] Error toggling module:", error);
    return { success: false, error: "Failed to toggle module" };
  }

  return { success: true };
}

export async function searchModulesService(params: ModuleSearchParams): Promise<{
  modules: ModuleDefinition[];
  total: number;
}> {
  // Use registry search (in-memory for now, can be DB later)
  return moduleRegistry.search(params);
}

export async function getModuleDetails(moduleIdOrSlug: string): Promise<ModuleDefinition | null> {
  const module = moduleRegistry.get(moduleIdOrSlug) || moduleRegistry.getBySlug(moduleIdOrSlug);
  return module || null;
}

export async function isModuleInstalled(siteId: string, moduleId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("site_modules")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  return !!data;
}
