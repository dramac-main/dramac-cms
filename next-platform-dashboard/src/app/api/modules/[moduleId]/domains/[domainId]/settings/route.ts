/**
 * Phase EM-32: Domain Settings API
 * GET /api/modules/[moduleId]/domains/[domainId]/settings - Get settings
 * PATCH /api/modules/[moduleId]/domains/[domainId]/settings - Update settings
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { CustomDomainService, DomainConfig, WhiteLabelConfig, EdgeRouter } from '@/lib/modules/domains';

interface RouteParams {
  params: Promise<{ moduleId: string; domainId: string }>;
}

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAccess(userId: string, moduleId: string, requireAdmin = false) {
  const serviceSupabase = getServiceSupabase();
  
  const { data: siteModule } = await serviceSupabase
    .from('site_module_installations')
    .select('id, site_id')
    .eq('id', moduleId)
    .single();

  if (!siteModule) return { error: 'Module not found', status: 404 };

  const { data: site } = await serviceSupabase
    .from('sites')
    .select('id, agency_id')
    .eq('id', siteModule.site_id)
    .single();

  if (!site) return { error: 'Site not found', status: 404 };

  const query = serviceSupabase
    .from('agency_members')
    .select('role')
    .eq('agency_id', site.agency_id)
    .eq('user_id', userId);

  if (requireAdmin) {
    query.in('role', ['owner', 'admin']);
  }

  const { data: membership } = await query.single();

  if (!membership) {
    return { error: requireAdmin ? 'Admin access required' : 'Access denied', status: 403 };
  }

  return { success: true };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { moduleId, domainId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkAccess(user.id, moduleId);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const service = new CustomDomainService(moduleId);
    const domain = await service.getDomain(domainId);

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      config: domain.config, 
      white_label: domain.white_label 
    });
  } catch (error) {
    console.error('Failed to get domain settings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { moduleId, domainId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await checkAccess(user.id, moduleId, true);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await request.json();
    const { config, white_label } = body as { 
      config?: Partial<DomainConfig>; 
      white_label?: Partial<WhiteLabelConfig>; 
    };

    const service = new CustomDomainService(moduleId);

    // Update config if provided
    if (config) {
      await service.updateConfig(domainId, config);
    }

    // Update white-label if provided
    if (white_label) {
      await service.updateWhiteLabel(domainId, white_label);
    }

    // Invalidate cache for this domain
    const domain = await service.getDomain(domainId);
    if (domain) {
      EdgeRouter.invalidateCache(domain.domain);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update domain settings:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
