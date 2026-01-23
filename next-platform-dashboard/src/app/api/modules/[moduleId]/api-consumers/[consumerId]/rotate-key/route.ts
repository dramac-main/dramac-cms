/**
 * Phase EM-33: API Consumer Key Rotation Route
 * 
 * POST - Rotate API key for a consumer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { APIConsumerService } from '@/lib/modules/api-mode';

export async function POST(
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

    // Verify user has write access
    const { data: membership } = await (supabase as any)
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', userId)
      .single();

    if (!membership || !['owner', 'admin', 'developer'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Rotate the API key
    const consumerService = new APIConsumerService();
    const newApiKey = await consumerService.regenerateApiKey(consumerId);

    return NextResponse.json({
      apiKey: newApiKey,
      message: 'API key rotated successfully. Store this new key securely - the old key is now invalid.'
    });
  } catch (error: any) {
    console.error('[API Consumer Rotate Key Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
