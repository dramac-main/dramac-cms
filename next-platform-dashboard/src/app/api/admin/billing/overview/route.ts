/**
 * Admin Billing Overview API Route
 * 
 * Phase EM-59B: Paddle Billing Integration - UI, Portal & Operations
 * 
 * GET /api/admin/billing/overview
 * 
 * Returns platform-wide billing metrics for administrators.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Use admin client to fetch billing data
    const adminClient = createAdminClient();
    
    // Get active subscriptions
    const { data: subscriptions, error: subError } = await adminClient
      .from('paddle_subscriptions')
      .select(`
        id,
        plan_type,
        unit_price,
        status,
        billing_cycle,
        created_at,
        agency:agencies(id, name)
      `)
      .in('status', ['active', 'trialing', 'past_due']);
    
    if (subError) {
      console.error('[Admin Billing] Error fetching subscriptions:', subError);
    }
    
    const activeSubscriptions = subscriptions || [];
    
    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    const planCounts = { starter: 0, pro: 0, enterprise: 0 };
    
    for (const sub of activeSubscriptions) {
      const monthlyPrice = sub.billing_cycle === 'yearly' 
        ? Math.round(sub.unit_price / 12)
        : sub.unit_price;
      mrr += monthlyPrice;
      
      if (sub.plan_type === 'starter') planCounts.starter++;
      else if (sub.plan_type === 'pro') planCounts.pro++;
      else if (sub.plan_type === 'enterprise') planCounts.enterprise++;
    }
    
    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12;
    
    // Calculate ARPU (Average Revenue Per User)
    const arpu = activeSubscriptions.length > 0 
      ? Math.round(mrr / activeSubscriptions.length)
      : 0;
    
    // Calculate churn rate (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: canceledCount } = await adminClient
      .from('paddle_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'canceled')
      .gte('canceled_at', thirtyDaysAgo);
    
    const startOfMonthSubs = activeSubscriptions.length + (canceledCount || 0);
    const churnRate = startOfMonthSubs > 0 
      ? ((canceledCount || 0) / startOfMonthSubs) * 100
      : 0;
    
    // Calculate LTV (Lifetime Value) - simplified: ARPU / churn rate
    const ltv = churnRate > 0 
      ? Math.round((arpu * 100) / churnRate) * 12
      : arpu * 24; // Default to 24 months if no churn
    
    // Calculate MRR growth (vs last month)
    const lastMonthStart = new Date();
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1);
    
    const { data: lastMonthSubs } = await adminClient
      .from('paddle_subscriptions')
      .select('unit_price, billing_cycle')
      .in('status', ['active', 'trialing', 'past_due'])
      .lt('created_at', lastMonthStart.toISOString());
    
    let lastMonthMrr = 0;
    for (const sub of lastMonthSubs || []) {
      const monthlyPrice = sub.billing_cycle === 'yearly'
        ? Math.round(sub.unit_price / 12)
        : sub.unit_price;
      lastMonthMrr += monthlyPrice;
    }
    
    const mrrGrowth = lastMonthMrr > 0 
      ? ((mrr - lastMonthMrr) / lastMonthMrr) * 100
      : 0;
    
    // Get top agencies by revenue
    const topAgencies = activeSubscriptions
      .filter(sub => sub.agency)
      .map(sub => ({
        id: sub.agency.id,
        name: sub.agency.name,
        plan: sub.plan_type,
        mrr: sub.billing_cycle === 'yearly' 
          ? Math.round(sub.unit_price / 12)
          : sub.unit_price,
        usage: 0, // Would need to join with usage data
      }))
      .sort((a, b) => b.mrr - a.mrr)
      .slice(0, 10);
    
    // Get usage data for top agencies
    for (const agency of topAgencies) {
      const { data: usage } = await adminClient
        .from('usage_billing_period')
        .select('automation_runs, ai_actions, api_calls')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (usage) {
        agency.usage = (usage.automation_runs || 0) + (usage.ai_actions || 0) + (usage.api_calls || 0);
      }
    }
    
    return NextResponse.json({
      mrr,
      arr,
      activeSubscriptions: activeSubscriptions.length,
      churnRate,
      ltv,
      arpu,
      mrrGrowth,
      subscriptionsByPlan: planCounts,
      revenueByMonth: [], // Would need historical data
      topAgencies,
    });
  } catch (error) {
    console.error('[Admin Billing] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing overview' },
      { status: 500 }
    );
  }
}
