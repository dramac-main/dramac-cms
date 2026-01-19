/**
 * Module Dependency Resolution Service
 * 
 * Handles inter-module dependency resolution, including:
 * - Dependency graph traversal
 * - Version compatibility checking
 * - Circular dependency detection
 * - Installation order calculation (topological sort)
 * 
 * @module module-dependency-resolver
 */

"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Types
// ============================================================================

export type DependencyType = "required" | "optional" | "peer";

export type DependencyStatus = 
  | "installed" 
  | "available" 
  | "missing" 
  | "version_mismatch"
  | "not_published";

export interface DependencyNode {
  moduleId: string;
  moduleName: string;
  moduleSlug: string;
  version: string;
  status: DependencyStatus;
  dependencyType: DependencyType;
  installedVersion?: string;
  minVersion?: string;
  maxVersion?: string;
}

export interface DependencyConflict {
  moduleId: string;
  moduleName: string;
  reason: string;
  resolution?: string;
  severity: "error" | "warning";
}

export interface DependencyResolutionResult {
  success: boolean;
  canInstall: boolean;
  required: DependencyNode[];
  optional: DependencyNode[];
  peer: DependencyNode[];
  conflicts: DependencyConflict[];
  installOrder: string[];
  warnings: string[];
}

export interface CircularDependencyResult {
  hasCircular: boolean;
  cycle?: string[];
  cycleNames?: string[];
}

// ============================================================================
// Main Resolution Function
// ============================================================================

/**
 * Resolve all dependencies for a module before installation
 * Returns install order and identifies any conflicts
 */
export async function resolveDependencies(
  moduleId: string,
  siteId: string
): Promise<DependencyResolutionResult> {
  const supabase = await createClient();

  const result: DependencyResolutionResult = {
    success: true,
    canInstall: true,
    required: [],
    optional: [],
    peer: [],
    conflicts: [],
    installOrder: [],
    warnings: [],
  };

  try {
    // Check for circular dependencies first
    const circularCheck = await checkCircularDependencies(moduleId);
    if (circularCheck.hasCircular) {
      result.success = false;
      result.canInstall = false;
      result.conflicts.push({
        moduleId,
        moduleName: "Unknown",
        reason: `Circular dependency detected: ${circularCheck.cycleNames?.join(" → ") || circularCheck.cycle?.join(" → ")}`,
        severity: "error",
      });
      return result;
    }

    // Get the module's dependencies from the graph
    // Use type assertion for Phase 81C table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deps, error: depsError } = await (supabase as any)
      .from("module_dependencies_graph")
      .select(`
        *,
        depends_on:depends_on_module_id (
          id, 
          module_id, 
          name, 
          slug,
          published_version, 
          status
        )
      `)
      .eq("module_source_id", moduleId);

    if (depsError) {
      result.success = false;
      result.canInstall = false;
      result.conflicts.push({
        moduleId,
        moduleName: "Unknown",
        reason: `Failed to load dependencies: ${depsError.message}`,
        severity: "error",
      });
      return result;
    }

    // If no dependencies, module can be installed
    if (!deps || deps.length === 0) {
      result.installOrder = [moduleId];
      return result;
    }

    // Get installed modules on the site
    const { data: installedModules } = await supabase
      .from("site_module_installations")
      .select("module_id, is_enabled")
      .eq("site_id", siteId)
      .eq("is_enabled", true);

    const installedMap = new Map(
      (installedModules || []).map((m) => [m.module_id, { isEnabled: m.is_enabled }])
    );

    // Process each dependency
    for (const dep of deps) {
      const depModule = dep.depends_on as unknown as {
        id: string;
        module_id: string;
        name: string;
        slug: string;
        published_version: string;
        status: string;
      } | null;

      if (!depModule) {
        result.conflicts.push({
          moduleId: dep.depends_on_module_id,
          moduleName: "Unknown",
          reason: "Dependency module not found in database",
          severity: "error",
        });
        if (dep.dependency_type === "required") {
          result.canInstall = false;
        }
        continue;
      }

      const installedInfo = installedMap.get(depModule.id);
      const isInstalled = !!installedInfo;

      const node: DependencyNode = {
        moduleId: depModule.id,
        moduleName: depModule.name,
        moduleSlug: depModule.slug,
        version: depModule.published_version || "0.0.0",
        status: "available",
        dependencyType: dep.dependency_type as DependencyType,
        installedVersion: undefined, // Version tracking not available on site_module_installations
        minVersion: dep.min_version,
        maxVersion: dep.max_version,
      };

      // Check if dependency module is published
      if (depModule.status !== "published") {
        node.status = "not_published";
        result.conflicts.push({
          moduleId: depModule.id,
          moduleName: depModule.name,
          reason: `Required module "${depModule.name}" is not published (status: ${depModule.status})`,
          severity: dep.dependency_type === "required" ? "error" : "warning",
        });
        if (dep.dependency_type === "required") {
          result.canInstall = false;
        }
      }
      // Check if installed (version compatibility check skipped - no version tracking)
      else if (isInstalled) {
        // Since we don't have version tracking, assume installed versions are compatible
        node.status = "installed";
      } else {
        node.status = "available";
        if (dep.dependency_type === "required") {
          result.warnings.push(
            `Required dependency "${depModule.name}" is not installed and will be added`
          );
        }
      }

      // Categorize by dependency type
      switch (dep.dependency_type) {
        case "required":
          result.required.push(node);
          break;
        case "optional":
          result.optional.push(node);
          break;
        case "peer":
          result.peer.push(node);
          break;
      }
    }

    // Build installation order (topological sort)
    result.installOrder = await buildInstallOrder(moduleId, supabase);

    result.success = result.conflicts.filter(c => c.severity === "error").length === 0;

  } catch (error) {
    result.success = false;
    result.canInstall = false;
    result.conflicts.push({
      moduleId,
      moduleName: "Unknown",
      reason: error instanceof Error ? error.message : "Unknown error during resolution",
      severity: "error",
    });
  }

  return result;
}

// ============================================================================
// Version Compatibility
// ============================================================================

interface VersionCheckResult {
  compatible: boolean;
  reason: string;
  resolution?: string;
}

/**
 * Check if a version is compatible with min/max constraints
 */
function checkVersionCompatibility(
  installedVersion: string,
  minVersion?: string | null,
  maxVersion?: string | null
): VersionCheckResult {
  if (!minVersion && !maxVersion) {
    return { compatible: true, reason: "No version constraints" };
  }

  const installed = parseVersion(installedVersion);

  if (minVersion) {
    const min = parseVersion(minVersion);
    if (compareVersions(installed, min) < 0) {
      return {
        compatible: false,
        reason: `Installed version ${installedVersion} is below minimum ${minVersion}`,
        resolution: `Update to version ${minVersion} or higher`,
      };
    }
  }

  if (maxVersion) {
    const max = parseVersion(maxVersion);
    if (compareVersions(installed, max) > 0) {
      return {
        compatible: false,
        reason: `Installed version ${installedVersion} exceeds maximum ${maxVersion}`,
        resolution: `Downgrade to version ${maxVersion} or lower`,
      };
    }
  }

  return { compatible: true, reason: "Version is compatible" };
}

/**
 * Parse semver string to numeric parts
 */
function parseVersion(version: string): [number, number, number] {
  const parts = (version || "0.0.0").split(".");
  return [
    parseInt(parts[0], 10) || 0,
    parseInt(parts[1], 10) || 0,
    parseInt(parts[2], 10) || 0,
  ];
}

/**
 * Compare two version tuples
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a: [number, number, number], b: [number, number, number]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  return 0;
}

/**
 * Compare two version strings
 */
export function compareVersionStrings(a: string, b: string): number {
  return compareVersions(parseVersion(a), parseVersion(b));
}

// ============================================================================
// Installation Order (Topological Sort)
// ============================================================================

/**
 * Build correct installation order using topological sort
 */
async function buildInstallOrder(
  targetModuleId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string[]> {
  const order: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>(); // For cycle detection during sort

  async function visit(moduleId: string): Promise<void> {
    if (visited.has(moduleId)) return;
    if (visiting.has(moduleId)) {
      // Cycle detected during sort (shouldn't happen if we checked earlier)
      throw new Error(`Circular dependency detected during topological sort at ${moduleId}`);
    }

    visiting.add(moduleId);

    // Get dependencies for this module
    const { data: deps } = await supabase
      .from("module_dependencies_graph")
      .select("depends_on_module_id, dependency_type")
      .eq("module_source_id", moduleId)
      .eq("dependency_type", "required"); // Only required deps affect install order

    for (const dep of deps || []) {
      await visit(dep.depends_on_module_id);
    }

    visiting.delete(moduleId);
    visited.add(moduleId);
    order.push(moduleId);
  }

  await visit(targetModuleId);
  return order;
}

/**
 * Get installation order for multiple modules
 */
export async function getMultiModuleInstallOrder(
  moduleIds: string[]
): Promise<string[]> {
  const supabase = await createClient();
  const allOrder: string[] = [];
  const visited = new Set<string>();

  for (const moduleId of moduleIds) {
    const order = await buildInstallOrder(moduleId, supabase);
    for (const id of order) {
      if (!visited.has(id)) {
        visited.add(id);
        allOrder.push(id);
      }
    }
  }

  return allOrder;
}

// ============================================================================
// Circular Dependency Detection
// ============================================================================

/**
 * Check for circular dependencies using DFS
 */
export async function checkCircularDependencies(
  moduleId: string
): Promise<CircularDependencyResult> {
  const supabase = await createClient();

  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];
  const pathNames: string[] = [];

  // Get module name for better error messages
  async function getModuleName(id: string): Promise<string> {
    const { data } = await supabase
      .from("module_source")
      .select("name")
      .eq("id", id)
      .single();
    return data?.name || id;
  }

  async function dfs(currentId: string): Promise<boolean> {
    if (stack.has(currentId)) {
      // Found a cycle
      path.push(currentId);
      pathNames.push(await getModuleName(currentId));
      return true;
    }
    if (visited.has(currentId)) return false;

    visited.add(currentId);
    stack.add(currentId);
    path.push(currentId);
    pathNames.push(await getModuleName(currentId));

    const { data: deps } = await supabase
      .from("module_dependencies_graph")
      .select("depends_on_module_id")
      .eq("module_source_id", currentId);

    for (const dep of deps || []) {
      if (await dfs(dep.depends_on_module_id)) {
        return true;
      }
    }

    stack.delete(currentId);
    path.pop();
    pathNames.pop();
    return false;
  }

  const hasCircular = await dfs(moduleId);
  
  return { 
    hasCircular, 
    cycle: hasCircular ? [...path] : undefined,
    cycleNames: hasCircular ? [...pathNames] : undefined,
  };
}

// ============================================================================
// Dependency Graph Management
// ============================================================================

/**
 * Add a module dependency to the graph
 */
export async function addModuleDependency(
  moduleSourceId: string,
  dependsOnModuleId: string,
  options: {
    dependencyType?: DependencyType;
    minVersion?: string;
    maxVersion?: string;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const { dependencyType = "required", minVersion, maxVersion } = options;

  // Prevent self-dependency
  if (moduleSourceId === dependsOnModuleId) {
    return { success: false, error: "A module cannot depend on itself" };
  }

  const supabase = await createClient();

  // Check if adding this dependency would create a circular dependency
  const wouldCreateCycle = await wouldCreateCircularDependency(
    moduleSourceId,
    dependsOnModuleId
  );

  if (wouldCreateCycle) {
    return { 
      success: false, 
      error: "Adding this dependency would create a circular dependency" 
    };
  }

  const { error } = await supabase
    .from("module_dependencies_graph")
    .upsert({
      module_source_id: moduleSourceId,
      depends_on_module_id: dependsOnModuleId,
      dependency_type: dependencyType,
      min_version: minVersion,
      max_version: maxVersion,
    }, { onConflict: "module_source_id,depends_on_module_id" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Remove a module dependency from the graph
 */
export async function removeModuleDependency(
  moduleSourceId: string,
  dependsOnModuleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("module_dependencies_graph")
    .delete()
    .eq("module_source_id", moduleSourceId)
    .eq("depends_on_module_id", dependsOnModuleId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get all dependencies for a module
 */
export async function getModuleDependencies(
  moduleSourceId: string
): Promise<DependencyNode[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_dependencies_graph")
    .select(`
      *,
      depends_on:depends_on_module_id (
        id, module_id, name, slug, published_version, status
      )
    `)
    .eq("module_source_id", moduleSourceId);

  return (data || []).map((d) => {
    const depModule = d.depends_on as unknown as {
      id: string;
      module_id: string;
      name: string;
      slug: string;
      published_version: string;
      status: string;
    } | null;

    return {
      moduleId: depModule?.id || d.depends_on_module_id,
      moduleName: depModule?.name || "Unknown",
      moduleSlug: depModule?.slug || "",
      version: depModule?.published_version || "0.0.0",
      status: depModule?.status === "published" ? "available" : "not_published",
      dependencyType: d.dependency_type as DependencyType,
      minVersion: d.min_version,
      maxVersion: d.max_version,
    } as DependencyNode;
  });
}

/**
 * Get all modules that depend on a given module
 */
export async function getModuleDependents(
  moduleSourceId: string
): Promise<DependencyNode[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_dependencies_graph")
    .select(`
      *,
      dependent:module_source_id (
        id, module_id, name, slug, published_version, status
      )
    `)
    .eq("depends_on_module_id", moduleSourceId);

  return (data || []).map((d) => {
    const depModule = d.dependent as unknown as {
      id: string;
      module_id: string;
      name: string;
      slug: string;
      published_version: string;
      status: string;
    } | null;

    return {
      moduleId: depModule?.id || d.module_source_id,
      moduleName: depModule?.name || "Unknown",
      moduleSlug: depModule?.slug || "",
      version: depModule?.published_version || "0.0.0",
      status: depModule?.status === "published" ? "available" : "not_published",
      dependencyType: d.dependency_type as DependencyType,
      minVersion: d.min_version,
      maxVersion: d.max_version,
    } as DependencyNode;
  });
}

/**
 * Check if adding a dependency would create a circular dependency
 */
async function wouldCreateCircularDependency(
  fromModuleId: string,
  toModuleId: string
): Promise<boolean> {
  const supabase = await createClient();
  
  // If toModule depends on fromModule (directly or indirectly), adding
  // fromModule → toModule would create a cycle
  const visited = new Set<string>();
  const queue = [toModuleId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === fromModuleId) {
      return true; // Would create a cycle
    }
    if (visited.has(current)) continue;
    visited.add(current);

    const { data: deps } = await supabase
      .from("module_dependencies_graph")
      .select("depends_on_module_id")
      .eq("module_source_id", current);

    for (const dep of deps || []) {
      queue.push(dep.depends_on_module_id);
    }
  }

  return false;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the full dependency tree as a nested structure
 */
export async function getDependencyTree(
  moduleSourceId: string,
  maxDepth: number = 5
): Promise<{
  moduleId: string;
  moduleName: string;
  version: string;
  dependencies: unknown[];
}> {
  const supabase = await createClient();

  async function buildTree(moduleId: string, depth: number): Promise<{
    moduleId: string;
    moduleName: string;
    version: string;
    dependencies: unknown[];
  }> {
    // Get module info
    const { data: moduleInfo } = await supabase
      .from("module_source")
      .select("id, name, published_version")
      .eq("id", moduleId)
      .single();

    const result = {
      moduleId: moduleInfo?.id || moduleId,
      moduleName: moduleInfo?.name || "Unknown",
      version: moduleInfo?.published_version || "0.0.0",
      dependencies: [] as unknown[],
    };

    if (depth >= maxDepth) return result;

    // Get dependencies
    const { data: deps } = await supabase
      .from("module_dependencies_graph")
      .select("depends_on_module_id, dependency_type")
      .eq("module_source_id", moduleId);

    for (const dep of deps || []) {
      const childTree = await buildTree(dep.depends_on_module_id, depth + 1);
      result.dependencies.push({
        ...childTree,
        dependencyType: dep.dependency_type,
      });
    }

    return result;
  }

  return buildTree(moduleSourceId, 0);
}

/**
 * Validate that all required dependencies are satisfied for installation
 */
export async function validateDependenciesForInstall(
  moduleId: string,
  siteId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const resolution = await resolveDependencies(moduleId, siteId);
  
  const errors = resolution.conflicts
    .filter(c => c.severity === "error")
    .map(c => `${c.moduleName}: ${c.reason}`);

  return {
    valid: errors.length === 0,
    errors,
  };
}
