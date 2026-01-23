/**
 * Phase EM-33: SDK Generation Route
 * 
 * GET - Generate and download SDK for a module
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { SDKGenerator } from '@/lib/modules/api-mode';
import type { EntityConfig, SDKLanguage } from '@/lib/modules/api-mode';

const SUPPORTED_LANGUAGES = ['typescript', 'javascript', 'python'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteModuleInstallationId = request.nextUrl.searchParams.get('siteModuleInstallationId');
    const language = request.nextUrl.searchParams.get('language') as SupportedLanguage;
    
    if (!siteModuleInstallationId) {
      return NextResponse.json(
        { error: 'siteModuleInstallationId is required' },
        { status: 400 }
      );
    }

    if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { error: `language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify user has access to this site module
    const supabase = createAdminClient();
    
    // Get installation info
    const { data: installation } = await (supabase as any)
      .from('site_module_installations')
      .select('id, module_id, site_id')
      .eq('id', siteModuleInstallationId)
      .single();

    if (!installation) {
      return NextResponse.json({ error: 'Site module not found' }, { status: 404 });
    }

    // Get module info
    const { data: moduleData } = await (supabase as any)
      .from('modules')
      .select('id, name, slug, version, schema_config')
      .eq('id', moduleId)
      .single();

    // Get site info
    const { data: siteData } = await (supabase as any)
      .from('sites')
      .select('id, name, agency_id')
      .eq('id', installation.site_id)
      .single();

    const agencyId = siteData?.agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'Invalid site module' }, { status: 400 });
    }

    // Verify user membership
    const { data: membership } = await (supabase as any)
      .from('agency_members')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get module entities
    const entities: EntityConfig[] = moduleData?.schema_config?.entities || [];
    if (entities.length === 0) {
      return NextResponse.json(
        { error: 'Module has no configured entities' },
        { status: 400 }
      );
    }

    // Generate SDK
    const moduleName = moduleData?.name || 'Module';
    const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://api.dramac.app'}/api/modules/${moduleId}`;
    
    const sdkGenerator = new SDKGenerator(
      moduleName,
      baseUrl,
      entities
    );
    const sdkResult = sdkGenerator.generate(language as SDKLanguage);

    // Determine content type and file extension
    const contentTypes: Record<SupportedLanguage, { mime: string; ext: string }> = {
      typescript: { mime: 'text/typescript', ext: 'ts' },
      javascript: { mime: 'text/javascript', ext: 'js' },
      python: { mime: 'text/x-python', ext: 'py' }
    };

    const { mime, ext } = contentTypes[language];
    const filename = `${moduleData?.slug || 'module'}-sdk.${ext}`;

    return new NextResponse(sdkResult.content, {
      headers: {
        'Content-Type': `${mime}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('[SDK Generation Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
