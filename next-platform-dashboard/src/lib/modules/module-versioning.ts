"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, isSuperAdmin } from "@/lib/auth/permissions";

export interface ModuleVersion {
  id: string;
  moduleSourceId: string;
  version: string;
  changelog: string;
  renderCode: string;
  settingsSchema: Record<string, unknown>;
  apiRoutes: Array<{
    path: string;
    method: string;
    handler: string;
  }>;
  styles: string;
  defaultSettings: Record<string, unknown>;
  isBreakingChange: boolean;
  minPlatformVersion: string | null;
  createdAt: string;
  createdBy: string | null;
}

/**
 * Parse semver string to components
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split(".").map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

/**
 * Increment version based on type
 */
function incrementVersion(
  currentVersion: string,
  type: "major" | "minor" | "patch"
): string {
  const { major, minor, patch } = parseVersion(currentVersion);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Compare two semver versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
export async function compareVersions(a: string, b: string): Promise<number> {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vA.major > vB.major ? 1 : -1;
  if (vA.minor !== vB.minor) return vA.minor > vB.minor ? 1 : -1;
  if (vA.patch !== vB.patch) return vA.patch > vB.patch ? 1 : -1;
  return 0;
}

/**
 * Create a new version for a module
 */
export async function createVersion(
  moduleId: string,
  versionType: "major" | "minor" | "patch",
  changelog: string
): Promise<{ success: boolean; version?: string; versionId?: string; error?: string }> {
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

  // Get current module
  const { data: module } = await db
    .from("module_source")
    .select("*")
    .eq("module_id", moduleId)
    .single();

  if (!module) {
    return { success: false, error: "Module not found" };
  }

  const newVersion = incrementVersion(
    module.latest_version || "0.0.0",
    versionType
  );

  // Check if this version already exists
  const { data: existingVersion } = await db
    .from("module_versions")
    .select("id")
    .eq("module_source_id", module.id)
    .eq("version", newVersion)
    .single();

  if (existingVersion) {
    return { success: false, error: `Version ${newVersion} already exists` };
  }

  // Create version snapshot with current code
  const { data: versionData, error } = await db
    .from("module_versions")
    .insert({
      module_source_id: module.id,
      version: newVersion,
      changelog: changelog || `Version ${newVersion}`,
      render_code: module.render_code,
      settings_schema: module.settings_schema,
      api_routes: module.api_routes,
      styles: module.styles,
      default_settings: module.default_settings,
      is_breaking_change: versionType === "major",
      created_by: userId,
    })
    .select()
    .single();

  if (error || !versionData) {
    console.error("[Versioning] Create version error:", error);
    return { success: false, error: "Failed to create version" };
  }

  // Update latest version on module source
  const { error: updateError } = await db
    .from("module_source")
    .update({
      latest_version: newVersion,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("module_id", moduleId);

  if (updateError) {
    console.error("[Versioning] Update module error:", updateError);
    // Version was created, just couldn't update module - not critical
  }

  return { 
    success: true, 
    version: newVersion,
    versionId: versionData.id,
  };
}

/**
 * Get all versions for a module
 * Wrapped in try-catch to prevent server action hangs
 */
export async function getModuleVersions(moduleId: string): Promise<ModuleVersion[]> {
  try {
    console.log("[ModuleVersioning] getModuleVersions called for:", moduleId);
    
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Check if moduleId is a UUID or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleId);

    let moduleSourceId: string | null = null;
    
    if (isUUID) {
      // First try module_source.id directly
      const { data: directModule } = await db
        .from("module_source")
        .select("id")
        .eq("id", moduleId)
        .maybeSingle();
      
      if (directModule) {
        moduleSourceId = directModule.id;
      } else {
        // Check if it's a modules_v2.id and get studio_module_id
        const { data: v2Module } = await db
          .from("modules_v2")
          .select("studio_module_id")
          .eq("id", moduleId)
          .maybeSingle();
        
        if (v2Module?.studio_module_id) {
          // studio_module_id is the UUID (module_source.id)
          moduleSourceId = v2Module.studio_module_id;
        }
      }
    } else {
      // It's a slug - try both module_id and slug columns
      let result = await db
        .from("module_source")
        .select("id")
        .eq("module_id", moduleId)
        .maybeSingle();
      
      if (!result.data) {
        // Not found by module_id, try slug
        result = await db
          .from("module_source")
          .select("id")
          .eq("slug", moduleId)
          .maybeSingle();
      }
      moduleSourceId = result.data?.id || null;
    }

    if (!moduleSourceId) {
      console.log("[ModuleVersioning] No module found for:", moduleId);
      return [];
    }

    const { data, error } = await db
      .from("module_versions")
      .select("*")
      .eq("module_source_id", moduleSourceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ModuleVersioning] Query error:", error);
      return [];
    }
    
    if (!data) {
      return [];
    }

    console.log("[ModuleVersioning] Found", data.length, "versions");
    
    return data.map((v: Record<string, unknown>) => ({
      id: v.id,
      moduleSourceId: v.module_source_id,
      version: v.version,
      changelog: v.changelog || "",
      renderCode: v.render_code || "",
      settingsSchema: v.settings_schema || {},
      apiRoutes: v.api_routes || [],
      styles: v.styles || "",
      defaultSettings: v.default_settings || {},
      isBreakingChange: v.is_breaking_change || false,
      minPlatformVersion: v.min_platform_version,
      createdAt: v.created_at,
      createdBy: v.created_by,
    }));
  } catch (err) {
    console.error("[ModuleVersioning] getModuleVersions fatal error:", err);
    return [];
  }
}

/**
 * Get a specific version by ID
 */
export async function getModuleVersion(versionId: string): Promise<ModuleVersion | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("module_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    moduleSourceId: data.module_source_id,
    version: data.version,
    changelog: data.changelog || "",
    renderCode: data.render_code || "",
    settingsSchema: data.settings_schema || {},
    apiRoutes: data.api_routes || [],
    styles: data.styles || "",
    defaultSettings: data.default_settings || {},
    isBreakingChange: data.is_breaking_change || false,
    minPlatformVersion: data.min_platform_version,
    createdAt: data.created_at,
    createdBy: data.created_by,
  };
}

/**
 * Rollback module to a specific version
 */
export async function rollbackToVersion(
  moduleId: string,
  versionId: string
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

  // Get version data
  const { data: version } = await db
    .from("module_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (!version) {
    return { success: false, error: "Version not found" };
  }

  // Update module with version's code
  const { error } = await db
    .from("module_source")
    .update({
      render_code: version.render_code,
      settings_schema: version.settings_schema,
      api_routes: version.api_routes,
      styles: version.styles,
      default_settings: version.default_settings,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("module_id", moduleId);

  if (error) {
    console.error("[Versioning] Rollback error:", error);
    return { success: false, error: "Failed to rollback" };
  }

  return { success: true };
}

/**
 * Delete a specific version (can't delete if it's the only one)
 */
export async function deleteVersion(
  moduleId: string,
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get module
  const { data: module } = await db
    .from("module_source")
    .select("id")
    .eq("module_id", moduleId)
    .single();

  if (!module) {
    return { success: false, error: "Module not found" };
  }

  // Count versions
  const { count } = await db
    .from("module_versions")
    .select("*", { count: "exact", head: true })
    .eq("module_source_id", module.id);

  if (count !== null && count <= 1) {
    return { success: false, error: "Cannot delete the only version" };
  }

  // Delete the version
  const { error } = await db
    .from("module_versions")
    .delete()
    .eq("id", versionId);

  if (error) {
    return { success: false, error: "Failed to delete version" };
  }

  // Update latest_version if needed
  const { data: latestVersion } = await db
    .from("module_versions")
    .select("version")
    .eq("module_source_id", module.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (latestVersion) {
    await db
      .from("module_source")
      .update({ latest_version: latestVersion.version })
      .eq("module_id", moduleId);
  }

  return { success: true };
}

/**
 * Get version diff between two versions
 */
export async function getVersionDiff(
  versionIdA: string,
  versionIdB: string
): Promise<{
  codeChanged: boolean;
  schemaChanged: boolean;
  stylesChanged: boolean;
} | null> {
  const [versionA, versionB] = await Promise.all([
    getModuleVersion(versionIdA),
    getModuleVersion(versionIdB),
  ]);

  if (!versionA || !versionB) {
    return null;
  }

  return {
    codeChanged: versionA.renderCode !== versionB.renderCode,
    schemaChanged: 
      JSON.stringify(versionA.settingsSchema) !== JSON.stringify(versionB.settingsSchema),
    stylesChanged: versionA.styles !== versionB.styles,
  };
}
