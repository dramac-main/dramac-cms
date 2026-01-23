/**
 * Phase EM-32: Domain Verification API
 * POST /api/modules/[moduleId]/domains/[domainId]/verify - Verify domain ownership
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { CustomDomainService } from '@/lib/modules/domains';

interface RouteParams {
  params: Promise<{ moduleId: string; domainId: string }>;
}

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { moduleId, domainId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has admin access to this module installation
    const serviceSupabase = getServiceSupabase();
    
    const { data: siteModule } = await serviceSupabase
      .from('site_module_installations')
      .select('id, site_id')
      .eq('id', moduleId)
      .single();

    if (!siteModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const { data: site } = await serviceSupabase
      .from('sites')
      .select('id, agency_id')
      .eq('id', siteModule.site_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const { data: membership } = await serviceSupabase
      .from('agency_members')
      .select('role')
      .eq('agency_id', site.agency_id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const service = new CustomDomainService(moduleId);
    const verified = await service.verifyDomain(domainId);

    return NextResponse.json({ verified });
  } catch (error) {
    console.error('Domain verification failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message, verified: false }, { status: 500 });
  }
}
