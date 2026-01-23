/**
 * Phase EM-41: Rollback Execution API Route
 * 
 * POST /api/modules/[moduleId]/versions/rollback
 * Executes a rollback to a previous version.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { createRollbackService, createMigrationService } from '@/lib/modules/versioning';

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
    const { 
      siteId, 
      moduleSourceId, 
      targetVersionId, 
      backupId,
      restoreData = false,
      createBackup = true,
      force = false
    } = body;

    // Handle rollback from backup
    if (backupId) {
      const migrationService = createMigrationService(siteId, moduleId);
      
      try {
        await migrationService.restoreFromBackup(backupId);
        return NextResponse.json({
          success: true,
          dataRestored: true
        });
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Backup restoration failed' },
          { status: 500 }
        );
      }
    }

    // Handle version rollback
    if (!siteId || !moduleSourceId || !targetVersionId) {
      return NextResponse.json(
        { error: 'siteId, moduleSourceId, and targetVersionId are required (or backupId)' },
        { status: 400 }
      );
    }

    const rollbackService = createRollbackService(siteId, moduleId, moduleSourceId);
    
    const result = await rollbackService.executeRollback(
      targetVersionId,
      userId,
      {
        createBackup,
        force,
        restoreData
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Rollback failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Rollback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rollback failed' },
      { status: 500 }
    );
  }
}
