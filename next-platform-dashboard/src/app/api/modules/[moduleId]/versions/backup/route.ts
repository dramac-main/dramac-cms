/**
 * Phase EM-41: Backup API Route
 * 
 * POST /api/modules/[moduleId]/versions/backup
 * Creates a data backup before upgrade/rollback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { createMigrationService } from '@/lib/modules/versioning';

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
    const { siteId, type = 'pre_upgrade' } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    const migrationService = createMigrationService(siteId, moduleId);

    // Create backup
    const backupId = await migrationService.createBackup(userId, type);

    return NextResponse.json({ backupId });
  } catch (error) {
    console.error('[API] Backup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create backup' },
      { status: 500 }
    );
  }
}

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    const migrationService = createMigrationService(siteId, moduleId);
    const backups = await migrationService.getBackups();

    return NextResponse.json(backups);
  } catch (error) {
    console.error('[API] Get backups error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get backups' },
      { status: 500 }
    );
  }
}
