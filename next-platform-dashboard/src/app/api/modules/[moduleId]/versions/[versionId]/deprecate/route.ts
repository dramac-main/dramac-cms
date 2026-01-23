/**
 * Phase EM-41: Deprecate Version API Route
 * 
 * POST /api/modules/[moduleId]/versions/[versionId]/deprecate
 * Deprecates a published version.
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

    const body = await request.json();
    const { reason } = body;

    const versionService = getVersionService();
    await versionService.deprecateVersion(versionId, reason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Deprecate version error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deprecate version' },
      { status: 500 }
    );
  }
}
