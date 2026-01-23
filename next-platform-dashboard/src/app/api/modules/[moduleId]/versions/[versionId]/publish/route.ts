/**
 * Phase EM-41: Publish Version API Route
 * 
 * POST /api/modules/[moduleId]/versions/[versionId]/publish
 * Publishes a draft version.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, isSuperAdmin } from '@/lib/auth/permissions';
import { getVersionService } from '@/lib/modules/versioning';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; versionId: string }> }
) {
  try {
    const { versionId } = await params;
    const userId = await getCurrentUserId();
    const isAdmin = await isSuperAdmin();

    if (!userId || !isAdmin) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const versionService = getVersionService();
    const version = await versionService.publishVersion(versionId, userId);

    return NextResponse.json(version);
  } catch (error) {
    console.error('[API] Publish version error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish version' },
      { status: 500 }
    );
  }
}
