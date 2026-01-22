/**
 * Phase EM-31: External Domains Management API
 * Manages allowed domains for module embedding
 * 
 * GET /api/modules/[moduleId]/external/domains - List domains
 * POST /api/modules/[moduleId]/external/domains - Add domain
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DomainService } from '@/lib/modules/external/domain-service';
import { getModuleAndVerifyAccess } from '@/lib/modules/external/module-access';

interface RouteParams {
  params: Promise<{ moduleId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access to module
    const access = await getModuleAndVerifyAccess(moduleId, user.id);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    const { module } = access;
    const domainService = new DomainService(module.site_id, moduleId);
    const domains = await domainService.getDomains();

    return NextResponse.json({ domains });
  } catch (error) {
    const err = error as Error;
    console.error('Get domains error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to get domains' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access to module
    const access = await getModuleAndVerifyAccess(moduleId, user.id);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    const { module } = access;
    const body = await request.json();
    const { domain, allowEmbed, allowApi, embedTypes, rateLimit } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const domainService = new DomainService(module.site_id, moduleId);
    const result = await domainService.addDomain({
      domain,
      allowEmbed,
      allowApi,
      embedTypes,
      rateLimit
    });

    // Get verification instructions
    const instructions = domainService.getVerificationInstructions(result);

    return NextResponse.json({
      domain: result,
      verification: instructions
    }, { status: 201 });
  } catch (error) {
    const err = error as Error;
    console.error('Add domain error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to add domain' },
      { status: 500 }
    );
  }
}
