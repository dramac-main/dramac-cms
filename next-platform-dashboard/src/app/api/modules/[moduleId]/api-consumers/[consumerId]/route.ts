/**
 * Phase EM-33: Individual API Consumer Route
 * 
 * API endpoint for managing a specific API consumer
 * GET - Get consumer details
 * PATCH - Update consumer
 * DELETE - Delete consumer
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserId } from '@/lib/auth/permissions';
import { APIConsumerService } from '@/lib/modules/api-mode';

async function verifyConsumerAccess(
  consumerId: string,
  userId: string,
  requireWriteAccess: boolean = false
): Promise<{ agencyId: string; consumer: { id: string; api_key_hash: string; [key: string]: unknown }; installationId: string } | null> {
  const supabase = createAdminClient();
  
  // Get consumer with site module and site info
  // Cast to any to bypass strict table type checking for new tables
  const { data: consumer } = await (supabase as any)
    .from('module_api_consumers')
    .select('*')
    .eq('id', consumerId)
    .single();

  if (!consumer) {
    return null;
  }

  // Get site info separately
  const { data: installation } = await (supabase as any)
    .from('site_module_installations')
    .select('id, module_id, site_id')
    .eq('id', consumer.site_module_installation_id)
    .single();

  if (!installation) {
    return null;
  }

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

  return { agencyId, consumer, installationId: installation.id };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; consumerId: string }> }
) {
  try {
    const { moduleId: _moduleId, consumerId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await verifyConsumerAccess(consumerId, userId);
    if (!access) {
      return NextResponse.json({ error: 'Consumer not found or access denied' }, { status: 404 });
    }

    const consumerService = new APIConsumerService();
    const consumer = await consumerService.getConsumer(consumerId);

    return NextResponse.json({ data: consumer });
  } catch (error: any) {
    console.error('[API Consumer GET Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; consumerId: string }> }
) {
  try {
    const { moduleId: _moduleId, consumerId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await verifyConsumerAccess(consumerId, userId, true);
    if (!access) {
      return NextResponse.json({ error: 'Consumer not found or insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, scopes, allowedEndpoints, rateLimitPerMinute, rateLimitPerDay, allowedIps, isActive, metadata } = body;

    const consumerService = new APIConsumerService();
    const updated = await consumerService.updateConsumer(consumerId, {
      name,
      description,
      scopes,
      allowedEndpoints,
      rateLimitPerMinute,
      rateLimitPerDay,
      allowedIps,
      isActive,
      metadata
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error('[API Consumer PATCH Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; consumerId: string }> }
) {
  try {
    const { moduleId: _moduleId, consumerId } = await params;
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await verifyConsumerAccess(consumerId, userId, true);
    if (!access) {
      return NextResponse.json({ error: 'Consumer not found or insufficient permissions' }, { status: 403 });
    }

    const consumerService = new APIConsumerService();
    await consumerService.deleteConsumer(consumerId);

    return NextResponse.json({ message: 'Consumer deleted successfully' });
  } catch (error: any) {
    console.error('[API Consumer DELETE Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
