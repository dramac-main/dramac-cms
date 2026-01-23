/**
 * Phase EM-41: Upgrade Plan API Route
 * 
 * POST /api/modules/[moduleId]/versions/upgrade-plan
 * Returns the plan for upgrading from one version to another.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { getVersionService, createMigrationService } from '@/lib/modules/versioning';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { siteId, moduleSourceId, fromVersion, toVersion } = body;

    if (!siteId || !moduleSourceId || !toVersion) {
      return NextResponse.json(
        { error: 'siteId, moduleSourceId, and toVersion are required' },
        { status: 400 }
      );
    }

    const versionService = getVersionService();
    const migrationService = createMigrationService(siteId, moduleId);

    // Get upgrade path
    const upgradePath = await versionService.getUpgradePath(
      moduleSourceId,
      fromVersion || '0.0.0',
      toVersion
    );

    // Get migration plan
    const migrationPlan = await migrationService.createMigrationPlan(
      fromVersion || null,
      toVersion
    );

    return NextResponse.json({
      migrations: migrationPlan.migrations.map(m => ({
        id: m.id,
        description: m.description,
        to_version: m.to_version,
        is_reversible: m.is_reversible,
        estimated_duration_seconds: m.estimated_duration_seconds
      })),
      totalDuration: migrationPlan.totalDuration,
      hasBreakingChanges: upgradePath.hasBreakingChanges,
      breakingVersions: upgradePath.breakingVersions,
      warnings: migrationPlan.warnings,
      requiresMaintenance: migrationPlan.requiresMaintenance
    });
  } catch (error) {
    console.error('[API] Upgrade plan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create upgrade plan' },
      { status: 500 }
    );
  }
}
