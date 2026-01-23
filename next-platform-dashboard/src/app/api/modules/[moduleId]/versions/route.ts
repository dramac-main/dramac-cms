/**
 * Phase EM-41: Module Versioning API Routes
 * 
 * API endpoints for module version management:
 * - GET: Get version details
 * - POST: Create new version
 * - PATCH: Update version (publish, deprecate, yank)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId, isSuperAdmin } from '@/lib/auth/permissions';
import { getVersionService } from '@/lib/modules/versioning';

// =============================================================
// GET /api/modules/[moduleId]/versions
// =============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const { searchParams } = new URL(request.url);
    const moduleSourceId = searchParams.get('moduleSourceId');
    const status = searchParams.get('status');
    
    const versionService = getVersionService();

    // Get module source ID if not provided
    let sourceId = moduleSourceId;
    if (!sourceId) {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      const { data: module } = await db
        .from('modules_v2')
        .select('studio_module_id')
        .eq('id', moduleId)
        .single();

      sourceId = module?.studio_module_id;
    }

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Module source not found' },
        { status: 404 }
      );
    }

    // Get versions
    const versions = status === 'published'
      ? await versionService.getPublishedVersions(sourceId)
      : await versionService.getVersions(sourceId);

    return NextResponse.json(versions);
  } catch (error) {
    console.error('[API] Get versions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get versions' },
      { status: 500 }
    );
  }
}

// =============================================================
// POST /api/modules/[moduleId]/versions
// =============================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const userId = await getCurrentUserId();
    const isAdmin = await isSuperAdmin();

    if (!userId || !isAdmin) {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      moduleSourceId,
      version,
      changelog,
      releaseNotes,
      minPlatformVersion,
      breakingChanges,
      breakingDescription,
      dependencies,
      bundleUrl,
      bundleHash,
      publish = false
    } = body;

    if (!moduleSourceId || !version) {
      return NextResponse.json(
        { error: 'moduleSourceId and version are required' },
        { status: 400 }
      );
    }

    const versionService = getVersionService();

    // Create version
    const newVersion = await versionService.createVersion(
      moduleSourceId,
      version,
      {
        changelog,
        releaseNotes,
        minPlatformVersion,
        breakingChanges,
        breakingDescription,
        dependencies,
        bundleUrl,
        bundleHash
      }
    );

    // Optionally publish immediately
    if (publish) {
      await versionService.publishVersion(newVersion.id, userId);
    }

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    console.error('[API] Create version error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create version' },
      { status: 500 }
    );
  }
}
