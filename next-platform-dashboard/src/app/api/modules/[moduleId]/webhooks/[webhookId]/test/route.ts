/**
 * Phase EM-33: Webhook Test Route
 * 
 * POST - Send a test webhook delivery
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserId } from '@/lib/auth/permissions';
import crypto from 'crypto';

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; webhookId: string }> }
) {
  try {
    const { moduleId, webhookId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify webhook access with write permission
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

    // Build test payload
    const testPayload = JSON.stringify({
      event: 'test',
      data: {
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString(),
        webhookId
      },
      timestamp: new Date().toISOString(),
      deliveryId: `test_${Date.now()}`
    });

    // Sign payload if secret is configured
    const signature = webhook.secret
      ? signPayload(testPayload, webhook.secret)
      : null;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'DRAMAC-Webhook/1.0',
      'X-Webhook-Event': 'test',
      'X-Webhook-Delivery-ID': `test_${Date.now()}`,
      ...(webhook.custom_headers || {}),
      ...(signature && { 'X-Signature': `sha256=${signature}` })
    };

    // Send test webhook
    const startTime = Date.now();
    let result: { 
      success: boolean; 
      statusCode?: number; 
      responseBody?: string; 
      responseTimeMs?: number; 
      error?: string 
    };

    try {
      const controller = new AbortController();
      const timeoutMs = (webhook.timeout_seconds || 30) * 1000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: testPayload,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTimeMs = Date.now() - startTime;

      let responseBody: string;
      try {
        responseBody = await response.text();
      } catch {
        responseBody = '';
      }

      const success = response.status >= 200 && response.status < 300;

      result = {
        success,
        statusCode: response.status,
        responseBody: responseBody.substring(0, 1000),
        responseTimeMs,
        ...(success ? {} : { error: `HTTP ${response.status}` })
      };
    } catch (err: any) {
      const responseTimeMs = Date.now() - startTime;

      if (err.name === 'AbortError') {
        result = {
          success: false,
          responseTimeMs,
          error: 'Request timeout'
        };
      } else {
        result = {
          success: false,
          responseTimeMs,
          error: err.message || 'Network error'
        };
      }
    }

    return NextResponse.json({
      success: result.success,
      statusCode: result.statusCode,
      responseBody: result.responseBody,
      responseTime: result.responseTimeMs,
      message: result.success 
        ? 'Test webhook delivered successfully' 
        : `Test webhook failed: ${result.error}`
    });
  } catch (error: any) {
    console.error('[Webhook Test Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
