/**
 * Phase EM-31: Webhook Management API
 * Manage a specific webhook
 * 
 * GET /api/modules/[moduleId]/external/webhooks/[webhookId]
 * PATCH /api/modules/[moduleId]/external/webhooks/[webhookId]
 * DELETE /api/modules/[moduleId]/external/webhooks/[webhookId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebhookService } from '@/lib/modules/external/webhook-service';

interface RouteParams {
  params: Promise<{ moduleId: string; webhookId: string }>;
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
    const { moduleId, webhookId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await getModuleAndVerifyAccess(supabase, moduleId, user.id);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const webhookService = new WebhookService(access.siteId, moduleId);
    const webhook = await webhookService.getWebhook(webhookId);

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Get recent deliveries
    const deliveries = await webhookService.getDeliveries(webhookId, { limit: 10 });

    return NextResponse.json({
      webhook: {
        ...webhook,
        secret: '••••••••' + webhook.secret.slice(-4)
      },
      deliveries
    });
  } catch (error: any) {
    console.error('Get webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get webhook' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId, webhookId } = await params;
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
    const { name, url, events, headers, isActive } = body;

    const webhookService = new WebhookService(access.siteId, moduleId);
    const webhook = await webhookService.updateWebhook(webhookId, {
      name,
      url,
      events,
      headers,
      isActive
    });

    return NextResponse.json({
      webhook: {
        ...webhook,
        secret: '••••••••' + webhook.secret.slice(-4)
      }
    });
  } catch (error: any) {
    console.error('Update webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId, webhookId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await getModuleAndVerifyAccess(supabase, moduleId, user.id);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const webhookService = new WebhookService(access.siteId, moduleId);
    await webhookService.deleteWebhook(webhookId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
