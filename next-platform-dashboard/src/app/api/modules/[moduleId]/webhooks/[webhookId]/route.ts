/**
 * Phase EM-33: Individual Webhook Route
 * 
 * API endpoint for managing a specific webhook
 * GET - Get webhook details
 * PATCH - Update webhook
 * DELETE - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserId } from '@/lib/auth/permissions';

async function verifyWebhookAccess(
  webhookId: string,
  userId: string,
  requireWriteAccess: boolean = false
): Promise<{ agencyId: string; webhook: any; installationId: string; moduleId: string } | null> {
  const supabase = createAdminClient();
  
  // Get webhook info
  const { data: webhook } = await (supabase as any)
    .from('module_api_webhooks')
    .select('*')
    .eq('id', webhookId)
    .single();

  if (!webhook) {
    return null;
  }

  // Get installation info
  const { data: installation } = await (supabase as any)
    .from('site_module_installations')
    .select('id, module_id, site_id')
    .eq('id', webhook.site_module_installation_id)
    .single();

  if (!installation) {
    return null;
  }

  // Get site info
  const { data: site } = await (supabase as any)
    .from('sites')
    .select('agency_id')
    .eq('id', installation.site_id)
    .single();

  const agencyId = site?.agency_id;
  if (!agencyId) {
    return null;
  }

  // Verify user membership
  const { data: membership } = await (supabase as any)
    .from('agency_members')
    .select('role')
    .eq('agency_id', agencyId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    return null;
  }

  if (requireWriteAccess && !['owner', 'admin', 'developer'].includes(membership.role)) {
    return null;
  }

  return { agencyId, webhook, installationId: installation.id, moduleId: installation.module_id };
}

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

    const access = await verifyWebhookAccess(webhookId, userId);
    if (!access) {
      return NextResponse.json({ error: 'Webhook not found or access denied' }, { status: 404 });
    }

    // Return webhook from access check (already fetched)
    return NextResponse.json({ data: access.webhook });
  } catch (error: any) {
    console.error('[Webhook GET Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; webhookId: string }> }
) {
  try {
    const { moduleId, webhookId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await verifyWebhookAccess(webhookId, userId, true);
    if (!access) {
      return NextResponse.json({ error: 'Webhook not found or insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, targetUrl, events, headers, isActive, metadata } = body;

    // Validate URL if provided
    if (targetUrl) {
      try {
        new URL(targetUrl);
      } catch {
        return NextResponse.json({ error: 'Invalid target URL format' }, { status: 400 });
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (targetUrl !== undefined) updateData.url = targetUrl;
    if (events !== undefined) updateData.events = events;
    if (headers !== undefined) updateData.custom_headers = headers;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (metadata !== undefined) updateData.metadata = metadata;

    const supabase = createAdminClient();
    const { data: updated, error } = await (supabase as any)
      .from('module_api_webhooks')
      .update(updateData)
      .eq('id', webhookId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error('[Webhook PATCH Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; webhookId: string }> }
) {
  try {
    const { moduleId, webhookId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await verifyWebhookAccess(webhookId, userId, true);
    if (!access) {
      return NextResponse.json({ error: 'Webhook not found or insufficient permissions' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { error } = await (supabase as any)
      .from('module_api_webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) throw error;

    return NextResponse.json({ message: 'Webhook deleted successfully' });
  } catch (error: any) {
    console.error('[Webhook DELETE Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
