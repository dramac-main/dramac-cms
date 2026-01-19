"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Represents a studio module loaded with its render code for execution.
 */
export interface LoadedStudioModule {
  id: string;
  name: string;
  slug: string;
  renderCode: string;
  styles: string;
  settingsSchema: Record<string, unknown>;
  defaultSettings: Record<string, unknown>;
  version: string;
  source: "studio" | "catalog";
}

/**
 * Load a studio module's render code for execution.
 * This is the primary function for the renderer to get module code.
 * 
 * @param moduleId - The ID of the module (modules_v2 ID or module_source ID)
 * @returns The loaded module with render code, or null if not found
 */
export async function loadStudioModuleForRender(
  moduleId: string
): Promise<LoadedStudioModule | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // First try modules_v2 (published marketplace modules)
  const { data: marketplaceModule } = await db
    .from("modules_v2")
    .select(`
      id,
      name,
      slug,
      render_code,
      styles,
      settings_schema,
      default_settings,
      current_version,
      studio_version,
      studio_module_id,
      source
    `)
    .eq("id", moduleId)
    .eq("status", "active")
    .single();

  if (marketplaceModule?.render_code) {
    return {
      id: marketplaceModule.id,
      name: marketplaceModule.name,
      slug: marketplaceModule.slug,
      renderCode: marketplaceModule.render_code,
      styles: marketplaceModule.styles || "",
      settingsSchema: marketplaceModule.settings_schema || {},
      defaultSettings: marketplaceModule.default_settings || {},
      version: marketplaceModule.current_version || marketplaceModule.studio_version || "1.0.0",
      source: marketplaceModule.source || "studio",
    };
  }

  // If no render_code in modules_v2, check module_source directly
  // This handles testing/development modules not yet synced to marketplace
  const { data: sourceModule } = await db
    .from("module_source")
    .select(`
      id,
      name,
      slug,
      render_code,
      styles,
      settings_schema,
      default_settings,
      latest_version,
      published_version,
      status
    `)
    .eq("id", moduleId)
    .in("status", ["published", "testing"])
    .single();

  if (sourceModule?.render_code) {
    return {
      id: sourceModule.id,
      name: sourceModule.name,
      slug: sourceModule.slug,
      renderCode: sourceModule.render_code,
      styles: sourceModule.styles || "",
      settingsSchema: sourceModule.settings_schema || {},
      defaultSettings: sourceModule.default_settings || {},
      version: sourceModule.published_version || sourceModule.latest_version || "1.0.0",
      source: "studio",
    };
  }

  // Also try looking up by slug in case a slug was passed
  const { data: moduleBySlug } = await db
    .from("modules_v2")
    .select(`
      id,
      name,
      slug,
      render_code,
      styles,
      settings_schema,
      default_settings,
      current_version,
      source
    `)
    .eq("slug", moduleId)
    .eq("status", "active")
    .single();

  if (moduleBySlug?.render_code) {
    return {
      id: moduleBySlug.id,
      name: moduleBySlug.name,
      slug: moduleBySlug.slug,
      renderCode: moduleBySlug.render_code,
      styles: moduleBySlug.styles || "",
      settingsSchema: moduleBySlug.settings_schema || {},
      defaultSettings: moduleBySlug.default_settings || {},
      version: moduleBySlug.current_version || "1.0.0",
      source: moduleBySlug.source || "studio",
    };
  }

  console.warn(`[StudioModuleLoader] Module ${moduleId} not found or has no render code`);
  return null;
}

/**
 * Get all enabled modules for a site with their render code.
 * Used by the site renderer to inject all active modules.
 * 
 * @param siteId - The site ID to load modules for
 * @returns Array of loaded modules with their code and settings
 */
export async function loadSiteModulesForRender(
  siteId: string
): Promise<LoadedStudioModule[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get all installed and enabled modules for the site
  const { data: installations, error: installError } = await db
    .from("site_module_installations")
    .select(`
      module_id,
      settings,
      is_enabled
    `)
    .eq("site_id", siteId)
    .eq("is_enabled", true);

  if (installError || !installations || installations.length === 0) {
    return [];
  }

  // Load each module's render code
  const loadedModules: LoadedStudioModule[] = [];

  for (const install of installations) {
    const loadedModule = await loadStudioModuleForRender(install.module_id);
    
    if (loadedModule) {
      // Merge installation-specific settings with module defaults
      const mergedSettings = {
        ...loadedModule.defaultSettings,
        ...(install.settings as Record<string, unknown>),
      };

      loadedModules.push({
        ...loadedModule,
        defaultSettings: mergedSettings,
      });
    }
  }

  return loadedModules;
}

/**
 * Load multiple modules by their IDs.
 * Useful for batch loading.
 * 
 * @param moduleIds - Array of module IDs to load
 * @returns Array of loaded modules (excludes modules that failed to load)
 */
export async function loadModulesForRender(
  moduleIds: string[]
): Promise<LoadedStudioModule[]> {
  const modules: LoadedStudioModule[] = [];

  for (const id of moduleIds) {
    const loadedModule = await loadStudioModuleForRender(id);
    if (loadedModule) {
      modules.push(loadedModule);
    }
  }

  return modules;
}

/**
 * Check if a module has render code available.
 * Quick check without loading the full module.
 * 
 * @param moduleId - The module ID to check
 * @returns True if the module has render code
 */
export async function moduleHasRenderCode(moduleId: string): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check modules_v2
  const { data: v2Module } = await db
    .from("modules_v2")
    .select("id")
    .eq("id", moduleId)
    .eq("status", "active")
    .not("render_code", "is", null)
    .single();

  if (v2Module) return true;

  // Check module_source
  const { data: sourceModule } = await db
    .from("module_source")
    .select("id")
    .eq("id", moduleId)
    .in("status", ["published", "testing"])
    .not("render_code", "is", null)
    .single();

  return !!sourceModule;
}

/**
 * Get the render code only (without full module metadata).
 * Lightweight option when you only need the code.
 * 
 * @param moduleId - The module ID
 * @returns The render code string or null
 */
export async function getModuleRenderCode(moduleId: string): Promise<string | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check modules_v2 first
  const { data: v2Module } = await db
    .from("modules_v2")
    .select("render_code")
    .eq("id", moduleId)
    .eq("status", "active")
    .single();

  if (v2Module?.render_code) {
    return v2Module.render_code;
  }

  // Check module_source
  const { data: sourceModule } = await db
    .from("module_source")
    .select("render_code")
    .eq("id", moduleId)
    .in("status", ["published", "testing"])
    .single();

  return sourceModule?.render_code || null;
}
