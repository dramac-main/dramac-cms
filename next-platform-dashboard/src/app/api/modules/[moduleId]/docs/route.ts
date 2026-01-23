/**
 * Phase EM-33: API Documentation Generation Route
 * 
 * GET - Generate and download API documentation for a module
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { APIDocsGenerator } from '@/lib/modules/api-mode';
import type { EntityConfig } from '@/lib/modules/api-mode';

const SUPPORTED_FORMATS = ['openapi', 'markdown', 'postman'] as const;
type SupportedFormat = typeof SUPPORTED_FORMATS[number];

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
    const format = (request.nextUrl.searchParams.get('format') || 'openapi') as SupportedFormat;
    
    if (!siteModuleInstallationId) {
      return NextResponse.json(
        { error: 'siteModuleInstallationId is required' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: `format must be one of: ${SUPPORTED_FORMATS.join(', ')}` },
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
      .select('id, name, slug, version, description, schema_config')
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

    // Generate documentation
    const moduleName = moduleData?.name || 'Module';
    const moduleVersion = moduleData?.version || '1.0.0';
    const baseUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://api.dramac.app'}/api/modules/${moduleId}`;
    
    const docsGenerator = new APIDocsGenerator(
      moduleName,
      moduleVersion,
      baseUrl,
      entities,
      { serverDescription: 'DRAMAC Module API' }
    );

    let content: string;
    let contentType: string;
    let filename: string;
    const slug = moduleData?.slug || 'module';

    switch (format) {
      case 'openapi':
        content = JSON.stringify(docsGenerator.generateOpenAPI(), null, 2);
        contentType = 'application/json';
        filename = `${slug}-openapi.json`;
        break;
      case 'markdown':
        content = docsGenerator.generateMarkdown();
        contentType = 'text/markdown';
        filename = `${slug}-api-docs.md`;
        break;
      case 'postman':
        content = JSON.stringify(docsGenerator.generatePostmanCollection(), null, 2);
        contentType = 'application/json';
        filename = `${slug}-postman-collection.json`;
        break;
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': `${contentType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('[Docs Generation Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
