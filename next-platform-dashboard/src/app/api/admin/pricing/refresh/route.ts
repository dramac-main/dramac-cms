// src/app/api/admin/pricing/refresh/route.ts
// Manual pricing cache refresh endpoint

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pricingCacheService } from '@/lib/resellerclub/pricing-cache';
import { isConfigured } from '@/lib/resellerclub/config';

/**
 * POST /api/admin/pricing/refresh
 * Manually refresh pricing cache from ResellerClub
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check super_admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
    }
    
    // Check if ResellerClub is configured
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'ResellerClub not configured' },
        { status: 400 }
      );
    }
    
    // Use a system-wide customer ID (or first agency's) - super admin can refresh for all
    // For now, just refresh the global cache without customer ID requirement
    const customerId = ''; // Super admin refreshes global pricing
    
    // Parse request body for sync options
    const body = await request.json().catch(() => ({}));
    const syncType = body.syncType || 'full'; // 'domain', 'email', or 'full'
    const pricingTypes = body.pricingTypes || ['customer', 'cost'];
    
    const results: {
      domain?: unknown;
      email?: unknown;
    } = {};
    
    // Refresh domain pricing
    if (syncType === 'domain' || syncType === 'full') {
      results.domain = await pricingCacheService.refreshDomainPricing(
        customerId,
        pricingTypes
      );
    }
    
    // Refresh email pricing
    if (syncType === 'email' || syncType === 'full') {
      results.email = await pricingCacheService.refreshEmailPricing(
        customerId,
        pricingTypes
      );
    }
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Admin/Pricing] Refresh error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Refresh failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/pricing/refresh
 * Check pricing cache status
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check domain cache status
    const domainStale = await pricingCacheService.isCacheStale('domain');
    const emailStale = await pricingCacheService.isCacheStale('email');
    
    // Get last sync times
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lastDomainSync } = await (supabase as any)
      .from('pricing_sync_log')
      .select('*')
      .eq('sync_type', 'domain')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lastEmailSync } = await (supabase as any)
      .from('pricing_sync_log')
      .select('*')
      .eq('sync_type', 'email')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();
    
    return NextResponse.json({
      configured: isConfigured(),
      domain: {
        stale: domainStale,
        lastSync: lastDomainSync,
      },
      email: {
        stale: emailStale,
        lastSync: lastEmailSync,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Admin/Pricing] Status error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Status check failed',
      },
      { status: 500 }
    );
  }
}
