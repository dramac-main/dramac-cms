/**
 * Phase EM-33: API Consumer Usage Statistics Route
 * 
 * GET - Get usage statistics for an API consumer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { APIConsumerService } from '@/lib/modules/api-mode';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; consumerId: string }> }
) {
  try {
    const { moduleId, consumerId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get consumer info
    const supabase = createAdminClient();
    const { data: consumer } = await (supabase as any)
      .from('module_api_consumers')
      .select('*')
      .eq('id', consumerId)
      .single();

    if (!consumer) {
      return NextResponse.json({ error: 'Consumer not found' }, { status: 404 });
    }

    // Get site info
    const { data: installation } = await (supabase as any)
      .from('site_module_installations')
      .select('id, module_id, site_id')
      .eq('id', consumer.site_module_installation_id)
      .single();

    if (!installation) {
      return NextResponse.json({ error: 'Invalid consumer' }, { status: 400 });
    }

    const { data: site } = await (supabase as any)
      .from('sites')
      .select('agency_id')
      .eq('id', installation.site_id)
      .single();

    const agencyId = site?.agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'Invalid consumer' }, { status: 400 });
    }

    // Verify user membership
    const { data: membership } = await (supabase as any)
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse days from query params (default 30 days)
    const daysParam = request.nextUrl.searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    // Get usage statistics
    const consumerService = new APIConsumerService();
    const stats = await consumerService.getUsageStats(consumerId, days);

    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      data: stats,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days
      }
    });
  } catch (error: any) {
    console.error('[API Consumer Usage Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
