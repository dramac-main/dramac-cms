/**
 * Phase EM-33: Module Webhooks Management Route
 * 
 * API endpoint for managing webhooks for a module installation
 * GET - List webhooks
 * POST - Create new webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserId } from '@/lib/auth/permissions';
import crypto from 'crypto';

function generateSigningSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteModuleInstallationId = request.nextUrl.searchParams.get('siteModuleInstallationId');
    
    if (!siteModuleInstallationId) {
      return NextResponse.json(
        { error: 'siteModuleInstallationId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this site module
    const supabase = createAdminClient();
    
    // Get installation info
    const { data: installation } = await (supabase as any)
      .from('site_module_installations')
      .select('id, module_id, site_id')
      .eq('id', siteModuleInstallationId)
      .single();

    if (!installation) {
      return NextResponse.json({ error: 'Site module not found' }, { status: 404 });
    }

    // Get site info
    const { data: siteData } = await (supabase as any)
      .from('sites')
      .select('agency_id')
      .eq('id', installation.site_id)
      .single();

    const agencyId = siteData?.agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'Invalid site module' }, { status: 400 });
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

    // List webhooks directly from database
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';
    
    let query = (supabase as any)
      .from('module_api_webhooks')
      .select('*')
      .eq('site_module_installation_id', siteModuleInstallationId)
      .order('created_at', { ascending: false });
    
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data: webhooks, error } = await query;
    
    if (error) throw error;

    return NextResponse.json({ data: webhooks || [] });
  } catch (error: any) {
    console.error('[Webhooks GET Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteModuleInstallationId, name, targetUrl, events, headers, isActive = true, metadata } = body;

    if (!siteModuleInstallationId || !name || !targetUrl || !events || events.length === 0) {
      return NextResponse.json(
        { error: 'siteModuleInstallationId, name, targetUrl, and events are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid target URL format' }, { status: 400 });
    }

    // Verify user has access to this site module
    const supabase = createAdminClient();
    
    // Get installation info
    const { data: installation } = await (supabase as any)
      .from('site_module_installations')
      .select('id, module_id, site_id')
      .eq('id', siteModuleInstallationId)
      .single();

    if (!installation) {
      return NextResponse.json({ error: 'Site module not found' }, { status: 404 });
    }

    if (installation.module_id !== moduleId) {
      return NextResponse.json({ error: 'Module ID mismatch' }, { status: 400 });
    }

    // Get site info
    const { data: siteData } = await (supabase as any)
      .from('sites')
      .select('agency_id')
      .eq('id', installation.site_id)
      .single();

    const agencyId = siteData?.agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'Invalid site module' }, { status: 400 });
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

    // Create webhook with signing secret
    const signingSecret = generateSigningSecret();
    
    const { data: webhook, error } = await (supabase as any)
      .from('module_api_webhooks')
      .insert({
        site_module_installation_id: siteModuleInstallationId,
        name,
        url: targetUrl,
        events,
        secret: signingSecret,
        custom_headers: headers || {},
        is_active: isActive,
        metadata: metadata || {},
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: webhook,
      signingSecret,
      message: 'Store the signing secret securely - it cannot be retrieved later'
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Webhooks POST Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
