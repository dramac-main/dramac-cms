// src/app/api/admin/email-plans/discover/route.ts
// Diagnostic endpoint — calls the RC pricing API and returns ALL email product keys found.
// Also drills into Titan Mail `plans` structure to reveal the exact pricing shape.
// 
// GET /api/admin/email-plans/discover  (requires super_admin)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/resellerclub/config';
import { businessEmailApi } from '@/lib/resellerclub/email';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isConfigured()) {
      return NextResponse.json({ error: 'RC not configured' }, { status: 400 });
    }

    // Fetch ALL products from the pricing API (returns everything in one call)
    const [sellingPricing, costPricing] = await Promise.allSettled([
      businessEmailApi.getResellerPricing(),
      businessEmailApi.getResellerCostPricing(),
    ]);

    const customerData = sellingPricing.status === 'fulfilled' ? sellingPricing.value : null;
    const costData = costPricing.status === 'fulfilled' ? costPricing.value : null;

    const TITAN_KEYS = ['titanmailglobal', 'titanmailindia'];

    // Full raw data for Titan Mail keys — essential for understanding their pricing structure
    const titanRawData: Record<string, {
      sellingRaw: unknown;
      costRaw: unknown;
    }> = {};

    for (const key of TITAN_KEYS) {
      if (customerData?.[key] || costData?.[key]) {
        titanRawData[key] = {
          sellingRaw: customerData?.[key] ?? null,
          costRaw: costData?.[key] ?? null,
        };
      }
    }

    // Summary of all email-like products
    const emailPlans: Record<string, {
      key: string;
      hasEmailAccountRanges: boolean;
      topLevelKeys: string[];
      slabs?: string[];
      samplePricing?: Record<string, unknown>;
      costSamplePricing?: Record<string, unknown>;
    }> = {};

    if (customerData) {
      for (const [key, value] of Object.entries(customerData)) {
        if (typeof value !== 'object' || value === null) continue;
        const v = value as Record<string, unknown>;
        const hasRanges = 'email_account_ranges' in v;
        const topKeys = Object.keys(v);

        const isEmailLike = hasRanges
          || key.startsWith('eelite')
          || key.startsWith('enterprise')
          || key.startsWith('titanmail')
          || key.includes('email');

        if (isEmailLike) {
          const ranges = v.email_account_ranges as Record<string, unknown> | undefined;
          const slabs = ranges ? Object.keys(ranges) : undefined;
          const firstSlab = slabs?.[0];
          const samplePricing = firstSlab && ranges ? ranges[firstSlab] as Record<string, unknown> : undefined;

          let costSample: Record<string, unknown> | undefined;
          if (costData?.[key]) {
            const cv = costData[key] as Record<string, unknown>;
            const cr = cv.email_account_ranges as Record<string, unknown> | undefined;
            const cs = cr ? Object.keys(cr) : undefined;
            const csFirst = cs?.[0];
            costSample = csFirst && cr ? cr[csFirst] as Record<string, unknown> : undefined;
          }

          emailPlans[key] = {
            key,
            hasEmailAccountRanges: hasRanges,
            topLevelKeys: topKeys,
            slabs,
            samplePricing,
            costSamplePricing: costSample,
          };
        }
      }
    }

    const allKeys = customerData ? Object.keys(customerData).sort() : [];

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalProductKeys: allKeys.length,
      emailPlans,
      emailPlanCount: Object.keys(emailPlans).length,
      // Full raw Titan Mail data — shows exact pricing structure
      titanMailFullData: titanRawData,
      allProductKeys: allKeys,
    });
  } catch (error) {
    console.error('[EmailPlanDiscovery] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery failed' },
      { status: 500 }
    );
  }
}

