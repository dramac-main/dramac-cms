/**
 * Phase EM-31: Domain Management API
 * Manage a specific domain
 * 
 * GET /api/modules/[moduleId]/external/domains/[domainId]
 * PATCH /api/modules/[moduleId]/external/domains/[domainId]
 * DELETE /api/modules/[moduleId]/external/domains/[domainId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DomainService } from '@/lib/modules/external/domain-service';

interface RouteParams {
  params: Promise<{ moduleId: string; domainId: string }>;
}

async function getModuleAndVerifyAccess(supabase: any, moduleId: string, userId: string) {
  const { data: module, error: moduleError } = await supabase
    .from('site_modules')
    .select('site_id')
    .eq('id', moduleId)
    .single();

  if (moduleError || !module) {
    return { error: 'Module not found', status: 404 };
  }

  const { data: member } = await supabase
    .from('site_members')
    .select('role')
    .eq('site_id', module.site_id)
    .eq('user_id', userId)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { module, siteId: module.site_id };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId, domainId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await getModuleAndVerifyAccess(supabase, moduleId, user.id);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const domainService = new DomainService(access.siteId, moduleId);
    const domain = await domainService.getDomain(domainId);

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const instructions = domainService.getVerificationInstructions(domain);

    return NextResponse.json({ domain, verification: instructions });
  } catch (error: any) {
    console.error('Get domain error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get domain' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId, domainId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await getModuleAndVerifyAccess(supabase, moduleId, user.id);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await request.json();
    const { allowEmbed, allowApi, embedTypes, rateLimit } = body;

    const domainService = new DomainService(access.siteId, moduleId);
    const domain = await domainService.updateDomain(domainId, {
      allowEmbed,
      allowApi,
      embedTypes,
      rateLimit
    });

    return NextResponse.json({ domain });
  } catch (error: any) {
    console.error('Update domain error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update domain' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId, domainId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await getModuleAndVerifyAccess(supabase, moduleId, user.id);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const domainService = new DomainService(access.siteId, moduleId);
    await domainService.removeDomain(domainId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete domain error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete domain' },
      { status: 500 }
    );
  }
}
