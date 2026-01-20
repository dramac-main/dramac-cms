"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, isSuperAdmin } from "@/lib/auth/permissions";

// Note: module_source, module_versions, module_deployments, module_analytics tables
// are created by migration but not yet in the generated types.
// Using 'as any' for now until types are regenerated.

export interface ModuleDefinition {
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  pricingTier: "free" | "starter" | "pro" | "enterprise";
  renderCode: string;
  settingsSchema: Record<string, unknown>;
  apiRoutes: Array<{
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    handler: string;
  }>;
  styles: string;
  defaultSettings: Record<string, unknown>;
  dependencies: string[];
}

export interface ModuleSource {
  id: string;
  moduleId: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  renderCode: string;
  settingsSchema: Record<string, unknown>;
  apiRoutes: Array<{
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    handler: string;
  }>;
  styles: string;
  defaultSettings: Record<string, unknown>;
  pricingTier: string;
  dependencies: string[];
  status: "draft" | "testing" | "published" | "deprecated";
  publishedVersion: string | null;
  latestVersion: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

/**
 * Create a new module in the development studio
 */
export async function createModule(
  definition: ModuleDefinition
): Promise<{ success: boolean; moduleId?: string; error?: string }> {
  // Verify super admin access
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Generate module ID from slug
  const moduleId = definition.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  // Check if slug already exists
  const { data: existing } = await db
    .from("module_source")
    .select("id")
    .eq("slug", definition.slug)
    .single();

  if (existing) {
    return { success: false, error: "A module with this slug already exists" };
  }

  // Validate required fields
  if (!definition.name?.trim()) {
    return { success: false, error: "Module name is required" };
  }
  if (!definition.slug?.trim()) {
    return { success: false, error: "Module slug is required" };
  }

  const { data, error } = await db
    .from("module_source")
    .insert({
      module_id: moduleId,
      name: definition.name.trim(),
      slug: definition.slug.trim(),
      description: definition.description || "",
      icon: definition.icon || "📦",
      category: definition.category || "other",
      pricing_tier: definition.pricingTier || "free",
      render_code: definition.renderCode || "",
      settings_schema: definition.settingsSchema || {},
      api_routes: definition.apiRoutes || [],
      styles: definition.styles || "",
      default_settings: definition.defaultSettings || {},
      dependencies: definition.dependencies || [],
      status: "draft",
      latest_version: "0.0.1",
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[ModuleBuilder] Create error:", error);
    return { success: false, error: "Failed to create module" };
  }

  // Create initial version snapshot
  const { error: versionError } = await db.from("module_versions").insert({
    module_source_id: data.id,
    version: "0.0.1",
    changelog: "Initial version",
    render_code: definition.renderCode || "",
    settings_schema: definition.settingsSchema || {},
    api_routes: definition.apiRoutes || [],
    styles: definition.styles || "",
    default_settings: definition.defaultSettings || {},
    is_breaking_change: false,
    created_by: userId,
  });

  if (versionError) {
    console.error("[ModuleBuilder] Version creation error:", versionError);
    // Module was created, just log the version error
  }

  return { success: true, moduleId };
}

/**
 * Update an existing module
 */
export async function updateModule(
  moduleId: string,
  updates: Partial<ModuleDefinition>
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.icon !== undefined) updateData.icon = updates.icon;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.pricingTier !== undefined) updateData.pricing_tier = updates.pricingTier;
  if (updates.renderCode !== undefined) updateData.render_code = updates.renderCode;
  if (updates.settingsSchema !== undefined) updateData.settings_schema = updates.settingsSchema;
  if (updates.apiRoutes !== undefined) updateData.api_routes = updates.apiRoutes;
  if (updates.styles !== undefined) updateData.styles = updates.styles;
  if (updates.defaultSettings !== undefined) updateData.default_settings = updates.defaultSettings;
  if (updates.dependencies !== undefined) updateData.dependencies = updates.dependencies;

  const { error } = await db
    .from("module_source")
    .update(updateData)
    .eq("module_id", moduleId);

  if (error) {
    console.error("[ModuleBuilder] Update error:", error);
    return { success: false, error: "Failed to update module" };
  }

  return { success: true };
}

/**
 * Get all module sources for the studio listing
 */
export async function getModuleSources(): Promise<ModuleSource[]> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return [];
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("module_source")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    console.error("[ModuleBuilder] Get sources error:", error);
    return [];
  }

  return data.map((m: Record<string, unknown>) => ({
    id: m.id,
    moduleId: m.module_id,
    name: m.name,
    slug: m.slug,
    description: m.description || "",
    icon: m.icon || "📦",
    category: m.category || "other",
    renderCode: m.render_code || "",
    settingsSchema: m.settings_schema || {},
    apiRoutes: m.api_routes || [],
    styles: m.styles || "",
    defaultSettings: m.default_settings || {},
    pricingTier: m.pricing_tier || "free",
    dependencies: m.dependencies || [],
    status: m.status as ModuleSource["status"],
    publishedVersion: m.published_version,
    latestVersion: m.latest_version,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
    createdBy: m.created_by,
  }));
}

/**
 * Get a single module source by ID
 * Wrapped in try-catch to prevent server action hangs
 */
export async function getModuleSource(moduleId: string): Promise<ModuleSource | null> {
  try {
    console.log("[ModuleBuilder] getModuleSource called for:", moduleId);
    
    // Check admin access - no timeout, let it complete naturally
    // The client-side handles race conditions
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      console.log("[ModuleBuilder] Not super admin, returning null");
      return null;
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Check if moduleId is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleId);
    
    let data, error;
    
    if (isUUID) {
      // First try module_source.id
      const result = await db
        .from("module_source")
        .select("*")
        .eq("id", moduleId)
        .maybeSingle();
      
      if (result.data) {
        data = result.data;
      } else {
        // UUID not in module_source, check if it's a modules_v2.id
        // and get the linked studio_module_id
        const v2Result = await db
          .from("modules_v2")
          .select("studio_module_id")
          .eq("id", moduleId)
          .maybeSingle();
        
        if (v2Result.data?.studio_module_id) {
          // Found! Now get the module_source using the studio_module_id
          // studio_module_id is the UUID (module_source.id)
          const sourceResult = await db
            .from("module_source")
            .select("*")
            .eq("id", v2Result.data.studio_module_id)
            .maybeSingle();
          data = sourceResult.data;
          error = sourceResult.error;
        } else {
          error = result.error || { message: "Module not found in module_source or modules_v2" };
        }
      }
    } else {
      // It's a slug, try both module_id and slug columns
      // First try module_id
      let result = await db
        .from("module_source")
        .select("*")
        .eq("module_id", moduleId)
        .maybeSingle();
      
      if (!result.data && !result.error) {
        // Not found by module_id, try slug
        result = await db
          .from("module_source")
          .select("*")
          .eq("slug", moduleId)
          .maybeSingle();
      }
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("[ModuleBuilder] Query error:", error);
      return null;
    }
    
    if (!data) {
      console.log("[ModuleBuilder] No module found for:", moduleId);
      return null;
    }

    console.log("[ModuleBuilder] Module found:", data.slug);
    
    return {
      id: data.id,
      moduleId: data.module_id,
      name: data.name,
      slug: data.slug,
      description: data.description || "",
      icon: data.icon || "📦",
      category: data.category || "other",
      renderCode: data.render_code || "",
      settingsSchema: data.settings_schema || {},
      apiRoutes: data.api_routes || [],
      styles: data.styles || "",
      defaultSettings: data.default_settings || {},
      pricingTier: data.pricing_tier || "free",
      dependencies: data.dependencies || [],
      status: data.status as ModuleSource["status"],
      publishedVersion: data.published_version,
      latestVersion: data.latest_version,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
    };
  } catch (err) {
    console.error("[ModuleBuilder] getModuleSource fatal error:", err);
    return null;
  }
}

/**
 * Delete a module and all its versions
 */
export async function deleteModule(
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Check if module exists
  const { data: module } = await db
    .from("module_source")
    .select("id, status")
    .eq("module_id", moduleId)
    .single();

  if (!module) {
    return { success: false, error: "Module not found" };
  }

  // Prevent deletion of published modules
  if (module.status === "published") {
    return { 
      success: false, 
      error: "Cannot delete a published module. Deprecate it first." 
    };
  }

  // Delete will cascade to versions and deployments
  const { error } = await db
    .from("module_source")
    .delete()
    .eq("module_id", moduleId);

  if (error) {
    console.error("[ModuleBuilder] Delete error:", error);
    return { success: false, error: "Failed to delete module" };
  }

  return { success: true };
}

/**
 * Update module status (draft, testing, published, deprecated)
 */
export async function updateModuleStatus(
  moduleId: string,
  status: ModuleSource["status"]
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const userId = await getCurrentUserId();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  // If publishing, set published_at
  if (status === "published") {
    updateData.published_at = new Date().toISOString();
  }

  const { error } = await db
    .from("module_source")
    .update(updateData)
    .eq("module_id", moduleId);

  if (error) {
    return { success: false, error: "Failed to update status" };
  }

  return { success: true };
}

/**
 * Validate module code syntax (basic validation)
 */
export async function validateModuleCode(
  renderCode: string,
  settingsSchema: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Basic render code validation
  if (!renderCode?.trim()) {
    errors.push("Render code is required");
  } else {
    // Check for basic React component structure
    if (!renderCode.includes("export") && !renderCode.includes("function")) {
      errors.push("Render code should export a React component");
    }
    
    // Check for obvious syntax errors
    try {
      // Basic bracket matching
      const openBraces = (renderCode.match(/{/g) || []).length;
      const closeBraces = (renderCode.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push("Mismatched curly braces in render code");
      }
      
      const openParens = (renderCode.match(/\(/g) || []).length;
      const closeParens = (renderCode.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push("Mismatched parentheses in render code");
      }
    } catch {
      errors.push("Invalid render code syntax");
    }
  }

  // Validate settings schema JSON
  if (settingsSchema?.trim()) {
    try {
      const schema = JSON.parse(settingsSchema);
      if (typeof schema !== "object") {
        errors.push("Settings schema must be a JSON object");
      }
    } catch {
      errors.push("Invalid JSON in settings schema");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Duplicate an existing module
 */
export async function duplicateModule(
  sourceModuleId: string,
  newName: string,
  newSlug: string
): Promise<{ success: boolean; moduleId?: string; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  // Get source module
  const source = await getModuleSource(sourceModuleId);
  if (!source) {
    return { success: false, error: "Source module not found" };
  }

  // Create new module with copied data
  return createModule({
    name: newName,
    slug: newSlug,
    description: source.description,
    icon: source.icon,
    category: source.category,
    pricingTier: source.pricingTier as ModuleDefinition["pricingTier"],
    renderCode: source.renderCode,
    settingsSchema: source.settingsSchema,
    apiRoutes: source.apiRoutes,
    styles: source.styles,
    defaultSettings: source.defaultSettings,
    dependencies: source.dependencies,
  });
}
