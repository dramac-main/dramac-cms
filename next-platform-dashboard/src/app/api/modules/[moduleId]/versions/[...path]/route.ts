/**
 * Phase EM-41: Module Versioning Catch-All API Route
 *
 * Consolidated route handler for all versioning sub-operations.
 * Replaces individual route files to reduce Vercel route count.
 *
 * Handles:
 * - POST /versions/backup
 * - GET  /versions/backup
 * - POST /versions/migrate
 * - POST /versions/rollback
 * - POST /versions/rollback-plan
 * - POST /versions/rollback-points
 * - POST /versions/upgrade-plan
 * - POST /versions/verify
 * - POST /versions/[versionId]/publish
 * - POST /versions/[versionId]/deprecate
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, isSuperAdmin } from "@/lib/auth/permissions";
import {
  getVersionService,
  createMigrationService,
  createRollbackService,
} from "@/lib/modules/versioning";

function notFound(action: string) {
  return NextResponse.json(
    { error: `Unknown versioning action: ${action}` },
    { status: 404 },
  );
}

// =============================================================
// GET handler
// =============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> },
) {
  const { moduleId, path } = await params;
  const action = path[0];

  if (action === "backup") {
    return handleGetBackups(request, moduleId);
  }

  return notFound(path.join("/"));
}

// =============================================================
// POST handler
// =============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> },
) {
  const { moduleId, path } = await params;
  const action = path[0];

  switch (action) {
    case "backup":
      return handleBackup(request, moduleId);
    case "migrate":
      return handleMigrate(request, moduleId);
    case "rollback":
      return handleRollback(request, moduleId);
    case "rollback-plan":
      return handleRollbackPlan(request, moduleId);
    case "rollback-points":
      return handleRollbackPoints(request, moduleId);
    case "upgrade-plan":
      return handleUpgradePlan(request, moduleId);
    case "verify":
      return handleVerify(request, moduleId);
    default:
      // Handle /versions/[versionId]/publish or /versions/[versionId]/deprecate
      if (path.length === 2) {
        const versionId = path[0];
        const subAction = path[1];
        if (subAction === "publish") return handlePublish(versionId);
        if (subAction === "deprecate")
          return handleDeprecate(request, versionId);
      }
      return notFound(path.join("/"));
  }
}

// =============================================================
// Handlers
// =============================================================

async function handleGetBackups(request: NextRequest, moduleId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 },
      );
    }

    const migrationService = createMigrationService(siteId, moduleId);
    const backups = await migrationService.getBackups();
    return NextResponse.json(backups);
  } catch (error) {
    console.error("[API] Get backups error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get backups",
      },
      { status: 500 },
    );
  }
}

async function handleBackup(request: NextRequest, moduleId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { siteId, type = "pre_upgrade" } = body;
    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 },
      );
    }

    const migrationService = createMigrationService(siteId, moduleId);
    const backupId = await migrationService.createBackup(userId, type);
    return NextResponse.json({ backupId });
  } catch (error) {
    console.error("[API] Backup error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create backup",
      },
      { status: 500 },
    );
  }
}

async function handleMigrate(request: NextRequest, moduleId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { siteId, migrationId, direction } = body;

    if (!siteId || !migrationId || !direction) {
      return NextResponse.json(
        { error: "siteId, migrationId, and direction are required" },
        { status: 400 },
      );
    }

    if (direction !== "up" && direction !== "down") {
      return NextResponse.json(
        { error: 'direction must be "up" or "down"' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: migration, error: migrationError } = await db
      .from("module_migrations")
      .select("*")
      .eq("id", migrationId)
      .single();

    if (migrationError || !migration) {
      return NextResponse.json(
        { error: "Migration not found" },
        { status: 404 },
      );
    }

    const sql = direction === "up" ? migration.up_sql : migration.down_sql;
    if (!sql) {
      return NextResponse.json(
        { error: `No ${direction} SQL available for this migration` },
        { status: 400 },
      );
    }

    const { data: run, error: createError } = await db
      .from("module_migration_runs")
      .insert({
        site_id: siteId,
        module_id: moduleId,
        migration_id: migrationId,
        direction,
        status: "running",
        executed_by: userId,
      })
      .select()
      .single();

    if (createError) throw createError;

    try {
      const { error: execError } = await db.rpc("exec_raw_sql", {
        sql_query: sql,
      });
      if (execError) throw execError;

      await db
        .from("module_migration_runs")
        .update({ status: "success", completed_at: new Date().toISOString() })
        .eq("id", run.id);

      return NextResponse.json({
        success: true,
        runId: run.id,
        migration: migration.to_version,
      });
    } catch (execError) {
      await db
        .from("module_migration_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message:
            execError instanceof Error ? execError.message : String(execError),
        })
        .eq("id", run.id);

      return NextResponse.json(
        {
          error:
            execError instanceof Error
              ? execError.message
              : "Migration execution failed",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[API] Migrate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 },
    );
  }
}

async function handleRollback(request: NextRequest, moduleId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      siteId,
      moduleSourceId,
      targetVersionId,
      backupId,
      restoreData = false,
      createBackup = true,
      force = false,
    } = body;

    if (backupId) {
      const migrationService = createMigrationService(siteId, moduleId);
      try {
        await migrationService.restoreFromBackup(backupId);
        return NextResponse.json({ success: true, dataRestored: true });
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Backup restoration failed",
          },
          { status: 500 },
        );
      }
    }

    if (!siteId || !moduleSourceId || !targetVersionId) {
      return NextResponse.json(
        {
          error:
            "siteId, moduleSourceId, and targetVersionId are required (or backupId)",
        },
        { status: 400 },
      );
    }

    const rollbackService = createRollbackService(
      siteId,
      moduleId,
      moduleSourceId,
    );
    const result = await rollbackService.executeRollback(
      targetVersionId,
      userId,
      {
        createBackup,
        force,
        restoreData,
      },
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Rollback failed" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Rollback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rollback failed" },
      { status: 500 },
    );
  }
}

async function handleRollbackPlan(request: NextRequest, moduleId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { siteId, moduleSourceId, targetVersionId } = body;

    if (!siteId || !moduleSourceId || !targetVersionId) {
      return NextResponse.json(
        { error: "siteId, moduleSourceId, and targetVersionId are required" },
        { status: 400 },
      );
    }

    const rollbackService = createRollbackService(
      siteId,
      moduleId,
      moduleSourceId,
    );
    const plan = await rollbackService.createRollbackPlan(targetVersionId);

    return NextResponse.json({
      currentVersion: { version: plan.currentVersion.version },
      targetVersion: { version: plan.targetVersion.version },
      migrations: plan.migrations.map(
        (m: {
          to_version: string;
          is_reversible: boolean;
          down_sql: string | null;
        }) => ({
          to_version: m.to_version,
          is_reversible: m.is_reversible,
          down_sql: m.down_sql ? "[present]" : null,
        }),
      ),
      estimatedDuration: plan.estimatedDuration,
      requiresMaintenance: plan.requiresMaintenance,
      canRollback: plan.canRollback,
      blockers: plan.blockers,
      warnings: plan.warnings,
      hasBackup: plan.hasBackup,
    });
  } catch (error) {
    console.error("[API] Rollback plan error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create rollback plan",
      },
      { status: 500 },
    );
  }
}

async function handleRollbackPoints(request: NextRequest, moduleId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { siteId, moduleSourceId } = body;

    if (!siteId || !moduleSourceId) {
      return NextResponse.json(
        { error: "siteId and moduleSourceId are required" },
        { status: 400 },
      );
    }

    const rollbackService = createRollbackService(
      siteId,
      moduleId,
      moduleSourceId,
    );
    const rollbackPoints = await rollbackService.getRollbackPoints();
    return NextResponse.json(rollbackPoints);
  } catch (error) {
    console.error("[API] Rollback points error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get rollback points",
      },
      { status: 500 },
    );
  }
}

async function handleUpgradePlan(request: NextRequest, moduleId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { siteId, moduleSourceId, fromVersion, toVersion } = body;

    if (!siteId || !moduleSourceId || !toVersion) {
      return NextResponse.json(
        { error: "siteId, moduleSourceId, and toVersion are required" },
        { status: 400 },
      );
    }

    const versionService = getVersionService();
    const migrationService = createMigrationService(siteId, moduleId);

    const upgradePath = await versionService.getUpgradePath(
      moduleSourceId,
      fromVersion || "0.0.0",
      toVersion,
    );

    const migrationPlan = await migrationService.createMigrationPlan(
      fromVersion || null,
      toVersion,
    );

    return NextResponse.json({
      migrations: migrationPlan.migrations.map(
        (m: {
          id: string;
          description: string;
          to_version: string;
          is_reversible: boolean;
          estimated_duration_seconds: number;
        }) => ({
          id: m.id,
          description: m.description,
          to_version: m.to_version,
          is_reversible: m.is_reversible,
          estimated_duration_seconds: m.estimated_duration_seconds,
        }),
      ),
      totalDuration: migrationPlan.totalDuration,
      hasBreakingChanges: upgradePath.hasBreakingChanges,
      breakingVersions: upgradePath.breakingVersions,
      warnings: migrationPlan.warnings,
      requiresMaintenance: migrationPlan.requiresMaintenance,
    });
  } catch (error) {
    console.error("[API] Upgrade plan error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create upgrade plan",
      },
      { status: 500 },
    );
  }
}

async function handleVerify(request: NextRequest, moduleId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { siteId, moduleSourceId, version } = body;

    if (!siteId || !moduleSourceId || !version) {
      return NextResponse.json(
        { error: "siteId, moduleSourceId, and version are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const versionService = getVersionService();

    const versions = await versionService.getVersions(moduleSourceId);
    const targetVersion = versions.find(
      (v: { version: string }) => v.version === version,
    );

    if (!targetVersion) {
      return NextResponse.json(
        { error: `Version ${version} not found` },
        { status: 404 },
      );
    }

    const { data: siteModule, error: siteModuleError } = await db
      .from("site_module_installations")
      .select("id")
      .eq("site_id", siteId)
      .eq("module_id", moduleId)
      .single();

    if (siteModuleError || !siteModule) {
      return NextResponse.json(
        { error: "Module not installed on this site" },
        { status: 404 },
      );
    }

    const { data: existingVersion } = await db
      .from("site_module_versions")
      .select("id")
      .eq("site_module_id", siteModule.id)
      .eq("version_id", targetVersion.id)
      .single();

    if (existingVersion) {
      await db
        .from("site_module_versions")
        .update({ status: "active", activated_at: new Date().toISOString() })
        .eq("id", existingVersion.id);

      await db
        .from("site_module_versions")
        .update({
          status: "rolled_back",
          deactivated_at: new Date().toISOString(),
        })
        .eq("site_module_id", siteModule.id)
        .neq("id", existingVersion.id)
        .eq("status", "active");
    } else {
      await db
        .from("site_module_versions")
        .update({
          status: "rolled_back",
          deactivated_at: new Date().toISOString(),
        })
        .eq("site_module_id", siteModule.id)
        .eq("status", "active");

      await db.from("site_module_versions").insert({
        site_module_id: siteModule.id,
        version_id: targetVersion.id,
        status: "active",
        activated_at: new Date().toISOString(),
        installed_by: userId,
      });
    }

    await db
      .from("module_source")
      .update({ latest_version: version, updated_at: new Date().toISOString() })
      .eq("id", moduleSourceId);

    return NextResponse.json({
      success: true,
      version,
      versionId: targetVersion.id,
    });
  } catch (error) {
    console.error("[API] Verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 },
    );
  }
}

async function handlePublish(versionId: string) {
  try {
    const userId = await getCurrentUserId();
    const isAdmin = await isSuperAdmin();

    if (!userId || !isAdmin) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 },
      );
    }

    const versionService = getVersionService();
    const version = await versionService.publishVersion(versionId, userId);
    return NextResponse.json(version);
  } catch (error) {
    console.error("[API] Publish version error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to publish version",
      },
      { status: 500 },
    );
  }
}

async function handleDeprecate(request: NextRequest, versionId: string) {
  try {
    const userId = await getCurrentUserId();
    const isAdmin = await isSuperAdmin();

    if (!userId || !isAdmin) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { reason } = body;

    const versionService = getVersionService();
    await versionService.deprecateVersion(versionId, reason);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Deprecate version error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to deprecate version",
      },
      { status: 500 },
    );
  }
}
