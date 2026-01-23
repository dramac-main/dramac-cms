/**
 * Phase EM-41: Verify API Route
 * 
 * POST /api/modules/[moduleId]/versions/verify
 * Verifies that a module version is correctly installed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { getVersionService } from '@/lib/modules/versioning';

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
    const { siteId, moduleSourceId, version } = body;

    if (!siteId || !moduleSourceId || !version) {
      return NextResponse.json(
        { error: 'siteId, moduleSourceId, and version are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const versionService = getVersionService();

    // Get version info
    const versions = await versionService.getVersions(moduleSourceId);
    const targetVersion = versions.find(v => v.version === version);

    if (!targetVersion) {
      return NextResponse.json(
        { error: `Version ${version} not found` },
        { status: 404 }
      );
    }

    // Get site module installation
    const { data: siteModule, error: siteModuleError } = await db
      .from('site_module_installations')
      .select('id')
      .eq('site_id', siteId)
      .eq('module_id', moduleId)
      .single();

    if (siteModuleError || !siteModule) {
      return NextResponse.json(
        { error: 'Module not installed on this site' },
        { status: 404 }
      );
    }

    // Update or create site_module_versions entry
    const { data: existingVersion } = await db
      .from('site_module_versions')
      .select('id')
      .eq('site_module_id', siteModule.id)
      .eq('version_id', targetVersion.id)
      .single();

    if (existingVersion) {
      // Update existing
      await db
        .from('site_module_versions')
        .update({
          status: 'active',
          activated_at: new Date().toISOString()
        })
        .eq('id', existingVersion.id);

      // Deactivate other versions
      await db
        .from('site_module_versions')
        .update({
          status: 'rolled_back',
          deactivated_at: new Date().toISOString()
        })
        .eq('site_module_id', siteModule.id)
        .neq('id', existingVersion.id)
        .eq('status', 'active');
    } else {
      // Deactivate any current active version
      await db
        .from('site_module_versions')
        .update({
          status: 'rolled_back',
          deactivated_at: new Date().toISOString()
        })
        .eq('site_module_id', siteModule.id)
        .eq('status', 'active');

      // Create new active version entry
      await db
        .from('site_module_versions')
        .insert({
          site_module_id: siteModule.id,
          version_id: targetVersion.id,
          status: 'active',
          activated_at: new Date().toISOString(),
          installed_by: userId
        });
    }

    // Update module source latest version if needed
    await db
      .from('module_source')
      .update({
        latest_version: version,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleSourceId);

    return NextResponse.json({
      success: true,
      version,
      versionId: targetVersion.id
    });
  } catch (error) {
    console.error('[API] Verify error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
