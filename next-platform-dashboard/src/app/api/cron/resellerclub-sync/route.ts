// src/app/api/cron/resellerclub-sync/route.ts
// Scheduled ResellerClub reconciliation job
// Syncs domain and email order data from ResellerClub

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { reconcileAgency } from '@/lib/resellerclub/reconciliation';
import { pricingCacheService } from '@/lib/resellerclub/pricing-cache';
import { isConfigured } from '@/lib/resellerclub/config';

// Verify cron secret to prevent unauthorized access
function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // If no CRON_SECRET set, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production';
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/resellerclub-sync
 * 
 * Scheduled job to:
 * 1. Refresh pricing caches from ResellerClub
 * 2. Reconcile domain and email order data
 * 
 * Recommended schedule: Daily at 02:00 UTC (04:00 Lusaka time)
 * vercel.json: { "path": "/api/cron/resellerclub-sync", "schedule": "0 2 * * *" }
 */
export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!isConfigured()) {
    return NextResponse.json(
      { error: 'ResellerClub not configured', timestamp: new Date().toISOString() },
      { status: 400 }
    );
  }
  
  const results = {
    pricing: {
      domain: { refreshed: false, error: null as string | null },
      email: { refreshed: false, error: null as string | null },
    },
    reconciliation: [] as Array<{
      agencyId: string;
      agencyName: string;
      result: unknown;
    }>,
    timestamp: new Date().toISOString(),
  };
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    
    // ====================================================================
    // 1. Refresh pricing caches for all agencies with ResellerClub
    // ====================================================================
    
    const { data: agencies } = await admin
      .from('agencies')
      .select('id, name, resellerclub_customer_id')
      .not('resellerclub_customer_id', 'is', null);
    
    if (agencies && agencies.length > 0) {
      // Use first agency's customer ID for pricing (pricing is global)
      const customerId = agencies[0].resellerclub_customer_id as string;
      
      try {
        const domainPricing = await pricingCacheService.refreshDomainPricing(
          customerId,
          ['customer', 'cost']
        );
        results.pricing.domain.refreshed = domainPricing.success;
        if (!domainPricing.success) {
          results.pricing.domain.error = domainPricing.error || 'Unknown error';
        }
      } catch (error) {
        results.pricing.domain.error = error instanceof Error ? error.message : 'Unknown error';
      }
      
      try {
        const emailPricing = await pricingCacheService.refreshEmailPricing(
          customerId,
          ['customer', 'cost']
        );
        results.pricing.email.refreshed = emailPricing.success;
        if (!emailPricing.success) {
          results.pricing.email.error = emailPricing.error || 'Unknown error';
        }
      } catch (error) {
        results.pricing.email.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    // ====================================================================
    // 2. Reconcile domains and email orders for each agency
    // ====================================================================
    
    for (const agency of agencies || []) {
      try {
        const reconcileResult = await reconcileAgency(agency.id);
        
        results.reconciliation.push({
          agencyId: agency.id,
          agencyName: agency.name || 'Unknown',
          result: reconcileResult,
        });
        
        // Rate limiting - wait 500ms between agencies
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[Cron] Reconciliation error for agency ${agency.id}:`, error);
        results.reconciliation.push({
          agencyId: agency.id,
          agencyName: agency.name || 'Unknown',
          result: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[Cron/ResellerClub] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        ...results,
      },
      { status: 500 }
    );
  }
}
