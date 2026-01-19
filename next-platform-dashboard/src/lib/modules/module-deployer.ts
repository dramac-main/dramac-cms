"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, isSuperAdmin } from "@/lib/auth/permissions";
import { createVersion } from "./module-versioning";
import { syncStudioModuleToCatalog } from "./module-catalog-sync";

export interface DeploymentResult {
  success: boolean;
  deploymentId?: string;
  version?: string;
  error?: string;
}

export interface Deployment {
  id: string;
  moduleSourceId: string;
  moduleId: string;
  versionId: string;
  version: string;
  environment: "staging" | "production";
  status: "pending" | "deploying" | "success" | "failed" | "rolled_back";
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  deployedBy: string | null;
}

/**
 * Deploy a module to staging or production
 */
export async function deployModule(
  moduleId: string,
  environment: "staging" | "production",
  versionType: "major" | "minor" | "patch",
  changelog: string,
  testingTier?: "internal" | "beta" | "public"
): Promise<DeploymentResult> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  if (!changelog?.trim()) {
    return { success: false, error: "Changelog is required" };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get module source
  const { data: module } = await db
    .from("module_source")
    .select("*")
    .eq("module_id", moduleId)
    .single();

  if (!module) {
    return { success: false, error: "Module not found" };
  }

  // Create new version
  const versionResult = await createVersion(moduleId, versionType, changelog);
  if (!versionResult.success || !versionResult.version || !versionResult.versionId) {
    return { success: false, error: versionResult.error || "Failed to create version" };
  }

  // Create deployment record
  const { data: deployment, error: deploymentError } = await db
    .from("module_deployments")
    .insert({
      module_source_id: module.id,
      version_id: versionResult.versionId,
      environment,
      status: "deploying",
      deployed_by: userId,
    })
    .select()
    .single();

  if (deploymentError || !deployment) {
    console.error("[Deployer] Create deployment error:", deploymentError);
    return { success: false, error: "Failed to create deployment record" };
  }

  try {
    // Deployment process
    // In a real system, this would:
    // 1. Validate the module code
    // 2. Bundle/compile if needed
    // 3. Update the module registry
    // 4. Clear caches
    // 5. Notify dependent sites

    // Validate code before deployment
    const validationResult = await validateModuleForDeployment(module);
    if (!validationResult.valid) {
      throw new Error(`Validation failed: ${validationResult.errors.join(", ")}`);
    }

    // Update module status based on environment
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    if (environment === "production") {
      updateData.status = "published";
      updateData.published_version = versionResult.version;
      updateData.published_at = new Date().toISOString();
      // Clear testing_tier when publishing
      updateData.testing_tier = null;
    } else {
      updateData.status = "testing";
      // Set testing_tier for staging deploys (defaults to 'internal' if not specified)
      updateData.testing_tier = testingTier || "internal";
    }

    await db
      .from("module_source")
      .update(updateData)
      .eq("module_id", moduleId);

    // Update deployment status to success
    await db
      .from("module_deployments")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
      })
      .eq("id", deployment.id);

    // If production, sync to catalog for marketplace visibility
    if (environment === "production") {
      const syncResult = await syncStudioModuleToCatalog(moduleId);
      if (!syncResult.success) {
        console.error("[Deployer] Catalog sync failed:", syncResult.error);
        // Don't fail deployment, but log warning - module is deployed but not visible in marketplace
      } else {
        console.log(`[Deployer] Module synced to catalog: ${syncResult.action} (${syncResult.catalogModuleId})`);
      }
    }

    // Update analytics
    await updateModuleAnalytics(moduleId);

    return {
      success: true,
      deploymentId: deployment.id,
      version: versionResult.version,
    };
  } catch (error) {
    // Mark deployment as failed
    await db
      .from("module_deployments")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", deployment.id);

    console.error("[Deployer] Deployment failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Deployment failed" 
    };
  }
}

/**
 * Validate module for deployment
 */
async function validateModuleForDeployment(
  module: Record<string, unknown>
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check required fields
  if (!module.name) errors.push("Module name is required");
  if (!module.render_code) errors.push("Module render code is required");

  // Basic code structure validation
  const renderCode = module.render_code as string;
  if (renderCode) {
    // Check for export statement
    if (!renderCode.includes("export")) {
      errors.push("Module must export a component");
    }

    // Check bracket matching
    const openBraces = (renderCode.match(/{/g) || []).length;
    const closeBraces = (renderCode.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push("Mismatched curly braces in code");
    }
  }

  // Validate settings schema if present
  const settingsSchema = module.settings_schema;
  if (settingsSchema && typeof settingsSchema !== "object") {
    errors.push("Settings schema must be a valid JSON object");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * @deprecated Use syncStudioModuleToCatalog from module-catalog-sync.ts instead.
 * This function is kept for backwards compatibility but actual sync is now
 * handled by the module-catalog-sync service which properly syncs to modules_v2.
 * 
 * Legacy sync to catalog - now handled by syncStudioModuleToCatalog
 */
async function syncModuleToCatalog(
  module: Record<string, unknown>
): Promise<void> {
  // Actual sync is now handled by syncStudioModuleToCatalog called above
  // This function is kept for any legacy code paths
  console.log(`[Deployer] Legacy syncModuleToCatalog called for ${module.module_id}`);
  
  // Additional post-sync tasks could go here:
  // 1. Invalidate CDN caches
  // 2. Send notifications to subscribed sites
  // 4. Update search indexes
}

/**
 * Update module analytics after deployment
 */
async function updateModuleAnalytics(moduleId: string): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Upsert analytics record
  await db
    .from("module_analytics")
    .upsert(
      {
        module_id: moduleId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "module_id" }
    );
}

/**
 * Get deployment history for a module
 */
export async function getDeployments(moduleId: string): Promise<Deployment[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: module } = await db
    .from("module_source")
    .select("id")
    .eq("module_id", moduleId)
    .single();

  if (!module) {
    return [];
  }

  const { data, error } = await db
    .from("module_deployments")
    .select(`
      *,
      version:module_versions(version)
    `)
    .eq("module_source_id", module.id)
    .order("started_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((d: Record<string, unknown>) => ({
    id: d.id,
    moduleSourceId: d.module_source_id,
    moduleId,
    versionId: d.version_id,
    version: (d.version as { version: string })?.version || "unknown",
    environment: d.environment as Deployment["environment"],
    status: d.status as Deployment["status"],
    startedAt: d.started_at,
    completedAt: d.completed_at,
    errorMessage: d.error_message,
    deployedBy: d.deployed_by,
  }));
}

/**
 * Get a specific deployment by ID
 */
export async function getDeployment(deploymentId: string): Promise<Deployment | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("module_deployments")
    .select(`
      *,
      version:module_versions(version),
      module:module_source(module_id)
    `)
    .eq("id", deploymentId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    moduleSourceId: data.module_source_id,
    moduleId: (data.module as { module_id: string })?.module_id || "",
    versionId: data.version_id,
    version: (data.version as { version: string })?.version || "unknown",
    environment: data.environment as Deployment["environment"],
    status: data.status as Deployment["status"],
    startedAt: data.started_at,
    completedAt: data.completed_at,
    errorMessage: data.error_message,
    deployedBy: data.deployed_by,
  };
}

/**
 * Rollback a deployment
 */
export async function rollbackDeployment(
  deploymentId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return { success: false, error: "Super admin access required" };
  }

  const userId = await getCurrentUserId();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get deployment
  const { data: deployment } = await db
    .from("module_deployments")
    .select(`
      *,
      module:module_source(module_id)
    `)
    .eq("id", deploymentId)
    .single();

  if (!deployment) {
    return { success: false, error: "Deployment not found" };
  }

  if (deployment.status !== "success") {
    return { success: false, error: "Can only rollback successful deployments" };
  }

  // Mark deployment as rolled back
  await db
    .from("module_deployments")
    .update({ status: "rolled_back" })
    .eq("id", deploymentId);

  // Find previous successful deployment
  const { data: previousDeployment } = await db
    .from("module_deployments")
    .select(`
      version_id,
      version:module_versions(*)
    `)
    .eq("module_source_id", deployment.module_source_id)
    .eq("status", "success")
    .neq("id", deploymentId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  if (previousDeployment && previousDeployment.version) {
    const prevVersion = previousDeployment.version as Record<string, unknown>;
    
    // Restore previous version's code
    await db
      .from("module_source")
      .update({
        render_code: prevVersion.render_code,
        settings_schema: prevVersion.settings_schema,
        api_routes: prevVersion.api_routes,
        styles: prevVersion.styles,
        default_settings: prevVersion.default_settings,
        published_version: prevVersion.version as string,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("id", deployment.module_source_id);
  } else {
    // No previous deployment - set to testing status
    await db
      .from("module_source")
      .update({
        status: "testing",
        published_version: null,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq("id", deployment.module_source_id);
  }

  return { success: true };
}

/**
 * Re-deploy a specific version
 */
export async function redeployVersion(
  moduleId: string,
  versionId: string,
  environment: "staging" | "production"
): Promise<DeploymentResult> {
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

  // Get module and version
  const { data: module } = await db
    .from("module_source")
    .select("id")
    .eq("module_id", moduleId)
    .single();

  if (!module) {
    return { success: false, error: "Module not found" };
  }

  const { data: version } = await db
    .from("module_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (!version) {
    return { success: false, error: "Version not found" };
  }

  // Create deployment record
  const { data: deployment, error: deploymentError } = await db
    .from("module_deployments")
    .insert({
      module_source_id: module.id,
      version_id: versionId,
      environment,
      status: "deploying",
      deployed_by: userId,
    })
    .select()
    .single();

  if (deploymentError || !deployment) {
    return { success: false, error: "Failed to create deployment" };
  }

  try {
    // Update module with this version's code
    const updateData: Record<string, unknown> = {
      render_code: version.render_code,
      settings_schema: version.settings_schema,
      api_routes: version.api_routes,
      styles: version.styles,
      default_settings: version.default_settings,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    if (environment === "production") {
      updateData.status = "published";
      updateData.published_version = version.version;
      updateData.published_at = new Date().toISOString();
    } else {
      updateData.status = "testing";
    }

    await db
      .from("module_source")
      .update(updateData)
      .eq("module_id", moduleId);

    // Mark deployment as success
    await db
      .from("module_deployments")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
      })
      .eq("id", deployment.id);

    return {
      success: true,
      deploymentId: deployment.id,
      version: version.version,
    };
  } catch (error) {
    await db
      .from("module_deployments")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", deployment.id);

    return { success: false, error: "Redeploy failed" };
  }
}

/**
 * Get module analytics
 */
export async function getModuleAnalytics(moduleId: string): Promise<{
  totalInstalls: number;
  activeInstalls: number;
  weeklyInstalls: number;
  uninstalls: number;
  avgLoadTimeMs: number | null;
  errorCount: number;
  totalRevenueCents: number;
  monthlyRevenueCents: number;
} | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("module_analytics")
    .select("*")
    .eq("module_id", moduleId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    totalInstalls: data.total_installs || 0,
    activeInstalls: data.active_installs || 0,
    weeklyInstalls: data.weekly_installs || 0,
    uninstalls: data.uninstalls || 0,
    avgLoadTimeMs: data.avg_load_time_ms,
    errorCount: data.error_count || 0,
    totalRevenueCents: data.total_revenue_cents || 0,
    monthlyRevenueCents: data.monthly_revenue_cents || 0,
  };
}
