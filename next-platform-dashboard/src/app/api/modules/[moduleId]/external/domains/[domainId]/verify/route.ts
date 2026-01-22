/**
 * Phase EM-31: Domain Verification API
 * Verify domain ownership
 * 
 * POST /api/modules/[moduleId]/external/domains/[domainId]/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DomainService } from '@/lib/modules/external/domain-service';
import { getModuleAndVerifyAccess } from '@/lib/modules/external/module-access';

interface RouteParams {
  params: Promise<{ moduleId: string; domainId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId, domainId } = await params;
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
    const { method } = body;

    if (!method || !['dns', 'meta'].includes(method)) {
      return NextResponse.json(
        { error: 'Method must be "dns" or "meta"' },
        { status: 400 }
      );
    }

    const domainService = new DomainService(module.site_id, moduleId);
    const result = await domainService.verifyDomain(domainId, method);

    if (result.verified) {
      return NextResponse.json({
        verified: true,
        message: 'Domain verified successfully'
      });
    } else {
      return NextResponse.json({
        verified: false,
        error: result.error || 'Verification failed'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Domain verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
