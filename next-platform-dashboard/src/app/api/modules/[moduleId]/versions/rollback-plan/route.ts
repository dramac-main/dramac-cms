/**
 * Phase EM-41: Rollback Plan API Route
 * 
 * POST /api/modules/[moduleId]/versions/rollback-plan
 * Returns the plan for rolling back to a specific version.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { createRollbackService } from '@/lib/modules/versioning';

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
    const { siteId, moduleSourceId, targetVersionId } = body;

    if (!siteId || !moduleSourceId || !targetVersionId) {
      return NextResponse.json(
        { error: 'siteId, moduleSourceId, and targetVersionId are required' },
        { status: 400 }
      );
    }

    const rollbackService = createRollbackService(siteId, moduleId, moduleSourceId);
    const plan = await rollbackService.createRollbackPlan(targetVersionId);

    return NextResponse.json({
      currentVersion: { version: plan.currentVersion.version },
      targetVersion: { version: plan.targetVersion.version },
      migrations: plan.migrations.map(m => ({
        to_version: m.to_version,
        is_reversible: m.is_reversible,
        down_sql: m.down_sql ? '[present]' : null
      })),
      estimatedDuration: plan.estimatedDuration,
      requiresMaintenance: plan.requiresMaintenance,
      canRollback: plan.canRollback,
      blockers: plan.blockers,
      warnings: plan.warnings,
      hasBackup: plan.hasBackup
    });
  } catch (error) {
    console.error('[API] Rollback plan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create rollback plan' },
      { status: 500 }
    );
  }
}
