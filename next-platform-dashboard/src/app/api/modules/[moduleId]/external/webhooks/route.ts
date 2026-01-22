/**
 * Phase EM-31: Webhooks Management API
 * Manage webhooks for external integrations
 * 
 * GET /api/modules/[moduleId]/external/webhooks - List webhooks
 * POST /api/modules/[moduleId]/external/webhooks - Create webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebhookService } from '@/lib/modules/external/webhook-service';

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
    const webhooks = await webhookService.getWebhooks();

    // Don't return secrets
    const safeWebhooks = webhooks.map(webhook => ({
      ...webhook,
      secret: '••••••••' + webhook.secret.slice(-4)
    }));

    return NextResponse.json({ webhooks: safeWebhooks });
  } catch (error: any) {
    console.error('Get webhooks error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get webhooks' },
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
    const { name, url, events, headers } = body;

    if (!name || !url || !events) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, events' },
        { status: 400 }
      );
    }

    const webhookService = new WebhookService(module.site_id, moduleId);
    const { webhook, secret } = await webhookService.createWebhook(
      { name, url, events, headers },
      user.id
    );

    // Return webhook with secret (only shown once)
    return NextResponse.json({
      webhook: {
        ...webhook,
        secret: undefined
      },
      secret // Only returned on creation!
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create webhook' },
      { status: 500 }
    );
  }
}
