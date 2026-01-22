/**
 * Phase EM-31: Webhook Test API
 * Test a webhook with a sample payload
 * 
 * POST /api/modules/[moduleId]/external/webhooks/[webhookId]/test
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebhookService } from '@/lib/modules/external/webhook-service';
import { getModuleAndVerifyAccess } from '@/lib/modules/external/module-access';

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

    // Verify access to module
    const access = await getModuleAndVerifyAccess(moduleId, user.id);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: 403 });
    }

    const { module } = access;

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
