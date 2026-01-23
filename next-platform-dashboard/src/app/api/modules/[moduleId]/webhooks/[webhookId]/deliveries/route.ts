/**
 * Phase EM-33: Webhook Delivery History Route
 * 
 * GET - Get delivery history for a webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserId } from '@/lib/auth/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; webhookId: string }> }
) {
  try {
    const { moduleId, webhookId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify webhook access
    const supabase = createAdminClient();
    
    // Get webhook info
    const { data: webhook } = await (supabase as any)
      .from('module_api_webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Get installation info
    const { data: installation } = await (supabase as any)
      .from('site_module_installations')
      .select('id, module_id, site_id')
      .eq('id', webhook.site_module_installation_id)
      .single();

    if (!installation) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }

    // Get site info
    const { data: site } = await (supabase as any)
      .from('sites')
      .select('agency_id')
      .eq('id', installation.site_id)
      .single();

    const agencyId = site?.agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
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

    // Parse pagination params
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    // Get delivery history directly from database
    const { data: deliveries, error } = await (supabase as any)
      .from('module_api_webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data: deliveries || [],
      pagination: {
        limit,
        offset,
        hasMore: (deliveries?.length || 0) === limit
      }
    });
  } catch (error: any) {
    console.error('[Webhook Deliveries Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
