// src/app/api/admin/email-plans/discover/route.ts
// Diagnostic endpoint — calls ALL three RC pricing APIs and returns full Titan Mail data.
//   reseller-price.json      → your configured selling prices (per-account/month rates)
//   reseller-cost-price.json → what you pay RC
//   customer-price.json      → what the WIZARD actually uses (includes your markup)
//
// GET /api/admin/email-plans/discover  (requires super_admin)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isConfigured } from '@/lib/resellerclub/config';
import { businessEmailApi } from '@/lib/resellerclub/email';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, agency_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isConfigured()) {
      return NextResponse.json({ error: 'RC not configured' }, { status: 400 });
    }

    // Get the admin's RC customer-id (needed for customer-price.json)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data: agency } = await admin
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', profile.agency_id)
      .single();

    const customerId: string | undefined = agency?.resellerclub_customer_id;

    // Fetch from all three pricing endpoints in parallel
    const [sellingResult, costResult, customerResult] = await Promise.allSettled([
      businessEmailApi.getResellerPricing(),
      businessEmailApi.getResellerCostPricing(),
      customerId
        ? businessEmailApi.getCustomerPricing(customerId)
        : Promise.reject(new Error('No customer-id available')),
    ]);

    const sellingData  = sellingResult.status  === 'fulfilled' ? sellingResult.value  : null;
    const costData     = costResult.status     === 'fulfilled' ? costResult.value     : null;
    const customerData = customerResult.status === 'fulfilled' ? customerResult.value : null;

    // Titan Mail raw data from all three endpoints — critical for debugging the pricing format.
    // Compare reseller vs customer to understand if prices are per-month or total-for-tenure.
    const titanMailFullData = {
      fromResellerPrice: {
        note: 'reseller-price.json — your configured selling prices (per-account/month rates)',
        titanmailglobal: sellingData?.['titanmailglobal'] ?? null,
        titanmailindia:  sellingData?.['titanmailindia']  ?? null,
      },
      fromCostPrice: {
        note: 'reseller-cost-price.json — what you pay RC',
        titanmailglobal: costData?.['titanmailglobal'] ?? null,
        titanmailindia:  costData?.['titanmailindia']  ?? null,
      },
      fromCustomerPrice: {
        note: `customer-price.json (customerId=${customerId ?? 'MISSING'}) — what the WIZARD uses`,
        titanmailglobal:   customerData?.['titanmailglobal']   ?? null,
        titanmailindia:    customerData?.['titanmailindia']    ?? null,
        eeliteus:          customerData?.['eeliteus']          ?? null,
        enterpriseemailus: customerData?.['enterpriseemailus'] ?? null,
      },
    };

    // Summary of email-like plans from the reseller-price endpoint
    const emailPlanSummary: Record<string, unknown> = {};
    if (sellingData) {
      for (const [key, value] of Object.entries(sellingData)) {
        if (typeof value !== 'object' || value === null) continue;
        const v = value as Record<string, unknown>;
        const isEmailLike = 'email_account_ranges' in v
          || 'plans' in v
          || key.startsWith('eelite')
          || key.startsWith('enterprise')
          || key.startsWith('titanmail')
          || key.includes('email');
        if (isEmailLike) {
          emailPlanSummary[key] = { topLevelKeys: Object.keys(v) };
        }
      }
    }

    const allKeys = sellingData ? Object.keys(sellingData).sort() : [];

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      customerId: customerId ?? null,
      totalProductKeys: allKeys.length,
      emailPlanSummary,
      titanMailFullData,
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
