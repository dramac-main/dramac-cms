/**
 * LP Migration Actions — Block Format → Studio Format
 *
 * Phase LPB-11: Server actions for migrating legacy LPs to Studio format.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { MKT_TABLES } from "../lib/marketing-constants";
import { convertBlocksToStudioTree } from "../lib/lp-migration-engine";
import { emitAutomationEvent } from "@/modules/automation/lib/automation-engine";
import type {
  LandingPageBlock,
  StyleConfig,
} from "../types/landing-page-types";
import type {
  BlockMigrationResult,
  MigrationProgress,
  MigrationStatus,
} from "../types/lp-builder-types";

// ============================================================================
// AUTH
// ============================================================================

async function requireAuth(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}

// ============================================================================
// MIGRATION STATUS
// ============================================================================

/**
 * Get migration status summary for a site.
 */
export async function getMigrationStatus(
  siteId: string,
): Promise<MigrationStatus> {
  await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await (admin as any)
    .from(MKT_TABLES.landingPages)
    .select("id, use_studio_format, migrated_at")
    .eq("site_id", siteId);

  if (error)
    throw new Error(`Failed to get migration status: ${error.message}`);

  const rows = data || [];
  const total = rows.length;
  const migrated = rows.filter(
    (r: { use_studio_format: boolean }) => r.use_studio_format,
  ).length;
  const legacy = total - migrated;
  const percentage = total > 0 ? Math.round((migrated / total) * 100) : 100;

  return { total, migrated, legacy, percentage };
}

// ============================================================================
// PREVIEW
// ============================================================================

/**
 * Dry-run migration preview for a single LP.
 * Returns the converted Studio tree and warnings without saving.
 */
export async function previewBlockMigration(lpId: string): Promise<{
  originalBlocks: LandingPageBlock[];
  convertedTree: unknown;
  warnings: string[];
}> {
  await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await (admin as any)
    .from(MKT_TABLES.landingPages)
    .select("id, content_json, style_config, use_studio_format")
    .eq("id", lpId)
    .single();

  if (error || !data) throw new Error("Landing page not found");
  if (data.use_studio_format) {
    return {
      originalBlocks: [],
      convertedTree: null,
      warnings: ["This LP already uses Studio format."],
    };
  }

  const blocks = (data.content_json as LandingPageBlock[]) || [];
  const style = (data.style_config as StyleConfig) || null;
  const { studioData, warnings } = convertBlocksToStudioTree(blocks, style);

  return {
    originalBlocks: blocks,
    convertedTree: studioData,
    warnings,
  };
}

// ============================================================================
// SINGLE MIGRATION
// ============================================================================

/**
 * Migrate a single LP from block format to Studio format.
 */
export async function migrateLP(lpId: string): Promise<BlockMigrationResult> {
  await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await (admin as any)
    .from(MKT_TABLES.landingPages)
    .select("id, site_id, title, content_json, style_config, use_studio_format")
    .eq("id", lpId)
    .single();

  if (error || !data) {
    return {
      success: false,
      lpId,
      lpTitle: "Unknown",
      originalBlockCount: 0,
      convertedComponentCount: 0,
      warnings: [],
      error: "Landing page not found",
    };
  }

  if (data.use_studio_format) {
    return {
      success: true,
      lpId,
      lpTitle: data.title,
      originalBlockCount: 0,
      convertedComponentCount: 0,
      warnings: ["Already using Studio format — skipped."],
    };
  }

  const blocks = (data.content_json as LandingPageBlock[]) || [];
  const style = (data.style_config as StyleConfig) || null;
  const { studioData, warnings } = convertBlocksToStudioTree(blocks, style);
  const componentCount = Object.keys(studioData.components).length;

  const { error: updateError } = await (admin as any)
    .from(MKT_TABLES.landingPages)
    .update({
      content_studio: studioData,
      use_studio_format: true,
      migrated_at: new Date().toISOString(),
      migration_source: "manual",
    })
    .eq("id", lpId);

  if (updateError) {
    return {
      success: false,
      lpId,
      lpTitle: data.title,
      originalBlockCount: blocks.length,
      convertedComponentCount: 0,
      warnings,
      error: updateError.message,
    };
  }

  // Fire automation event
  try {
    await emitAutomationEvent(data.site_id, "marketing.landing_page.migrated", {
      lpId,
      lpTitle: data.title,
      originalBlockCount: blocks.length,
      convertedComponentCount: componentCount,
      source: "manual",
    });
  } catch {
    // Non-blocking — don't fail the migration for event emission errors
  }

  return {
    success: true,
    lpId,
    lpTitle: data.title,
    originalBlockCount: blocks.length,
    convertedComponentCount: componentCount,
    warnings,
  };
}

// ============================================================================
// BATCH MIGRATION
// ============================================================================

/**
 * Migrate ALL legacy LPs for a site. Each LP migrated individually;
 * failure of one doesn't block others.
 */
export async function migrateSiteLPs(
  siteId: string,
): Promise<MigrationProgress> {
  await requireAuth();
  const admin = createAdminClient();

  const { data, error } = await (admin as any)
    .from(MKT_TABLES.landingPages)
    .select("id")
    .eq("site_id", siteId)
    .eq("use_studio_format", false);

  if (error) throw new Error(`Failed to query legacy LPs: ${error.message}`);

  const legacyIds = (data || []).map((r: { id: string }) => r.id);
  const total = legacyIds.length;
  const results: BlockMigrationResult[] = [];

  for (const id of legacyIds) {
    const result = await migrateLP(id);
    results.push(result);
  }

  const migrated = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return { total, migrated, failed, inProgress: false, results };
}

// ============================================================================
// REVERT
// ============================================================================

/**
 * Revert a migrated LP back to legacy block format.
 */
export async function revertMigration(lpId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  await requireAuth();
  const admin = createAdminClient();

  const { error } = await (admin as any)
    .from(MKT_TABLES.landingPages)
    .update({
      use_studio_format: false,
      content_studio: null,
      migrated_at: null,
      migration_source: null,
    })
    .eq("id", lpId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
