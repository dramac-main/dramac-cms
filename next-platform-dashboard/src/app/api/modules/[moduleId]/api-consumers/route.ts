/**
 * Phase EM-33: API Consumers Route
 * 
 * API endpoint for managing API consumers
 * GET - List consumers for a site module
 * POST - Create new consumer
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { APIConsumerService } from '@/lib/modules/api-mode';

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

    // Get site module installation ID from query
    const siteModuleInstallationId = request.nextUrl.searchParams.get('siteModuleInstallationId');
    
    if (!siteModuleInstallationId) {
      return NextResponse.json(
        { error: 'siteModuleInstallationId is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this site module
    const supabase = createAdminClient();
    const { data: installation } = await supabase
      .from('site_module_installations')
      .select(`
        id,
        site:sites(agency_id)
      `)
      .eq('id', siteModuleInstallationId)
      .single();

    if (!installation) {
      return NextResponse.json({ error: 'Site module not found' }, { status: 404 });
    }

    const agencyId = (installation.site as any)?.agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'Invalid site module' }, { status: 400 });
    }

    // Verify user is member of agency
    const { data: membership } = await supabase
      .from('agency_members')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // List consumers
    const consumerService = new APIConsumerService();
    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';
    const consumers = await consumerService.listConsumers(siteModuleInstallationId, includeInactive);

    return NextResponse.json({ data: consumers });
  } catch (error: any) {
    console.error('[API Consumers GET Error]', error);
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
    const { siteModuleInstallationId, name, description, scopes, allowedEndpoints, rateLimitPerMinute, rateLimitPerDay, allowedIps, metadata } = body;

    if (!siteModuleInstallationId || !name) {
      return NextResponse.json(
        { error: 'siteModuleInstallationId and name are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this site module
    const supabase = createAdminClient();
    const { data: installation } = await supabase
      .from('site_module_installations')
      .select(`
        id,
        module_id,
        site:sites(agency_id)
      `)
      .eq('id', siteModuleInstallationId)
      .single();

    if (!installation) {
      return NextResponse.json({ error: 'Site module not found' }, { status: 404 });
    }

    // Verify module ID matches
    if (installation.module_id !== moduleId) {
      return NextResponse.json({ error: 'Module ID mismatch' }, { status: 400 });
    }

    const agencyId = (installation.site as any)?.agency_id;
    if (!agencyId) {
      return NextResponse.json({ error: 'Invalid site module' }, { status: 400 });
    }

    // Verify user is member of agency with write access
    const { data: membership } = await supabase
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', userId)
      .single();

    if (!membership || !['owner', 'admin', 'developer'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Create consumer
    const consumerService = new APIConsumerService();
    const result = await consumerService.createConsumer(
      {
        siteModuleInstallationId,
        name,
        description,
        scopes,
        allowedEndpoints,
        rateLimitPerMinute,
        rateLimitPerDay,
        allowedIps,
        metadata
      },
      userId
    );

    return NextResponse.json({
      data: result.consumer,
      apiKey: result.apiKey,
      message: 'Store this API key securely - it cannot be retrieved later'
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API Consumers POST Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
