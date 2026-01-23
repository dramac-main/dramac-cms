/**
 * Phase EM-41: Rollback Points API Route
 * 
 * POST /api/modules/[moduleId]/versions/rollback-points
 * Returns available versions to roll back to.
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
    const { siteId, moduleSourceId } = body;

    if (!siteId || !moduleSourceId) {
      return NextResponse.json(
        { error: 'siteId and moduleSourceId are required' },
        { status: 400 }
      );
    }

    const rollbackService = createRollbackService(siteId, moduleId, moduleSourceId);
    const rollbackPoints = await rollbackService.getRollbackPoints();

    return NextResponse.json(rollbackPoints);
  } catch (error) {
    console.error('[API] Rollback points error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get rollback points' },
      { status: 500 }
    );
  }
}
