/**
 * Phase EM-31: Webhook Test API
 * Test a webhook with a sample payload
 * 
 * POST /api/modules/[moduleId]/external/webhooks/[webhookId]/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebhookService } from '@/lib/modules/external/webhook-service';

interface RouteParams {
  params: Promise<{ moduleId: string; webhookId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId, webhookId } = await params;
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

    const webhookService = new WebhookService(module.site_id, moduleId);
    const result = await webhookService.testWebhook(webhookId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Test failed' },
      { status: 500 }
    );
  }
}
