/**
 * Phase EM-31: Domain Verification API
 * Verify domain ownership
 * 
 * POST /api/modules/[moduleId]/external/domains/[domainId]/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DomainService } from '@/lib/modules/external/domain-service';

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

    // Get site context from module
    const { data: module, error: moduleError } = await supabase
      .from('site_modules')
      .select('site_id')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Verify user has access to this site
    const { data: member } = await supabase
      .from('site_members')
      .select('role')
      .eq('site_id', module.site_id)
      .eq('user_id', user.id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
