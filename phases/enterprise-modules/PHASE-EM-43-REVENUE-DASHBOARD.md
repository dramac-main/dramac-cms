# Phase EM-43: Revenue Sharing Dashboard

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 12-15 hours
> **Prerequisites**: EM-01, EM-02, EM-42
> **Status**: ✅ COMPLETE (January 23, 2026)

---

## 🎯 Objective

Build a comprehensive **revenue sharing and analytics dashboard** for module developers:
1. Sales tracking and analytics
2. Revenue share configuration
3. Payout management
4. Earnings reports
5. Tax document generation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REVENUE DASHBOARD                                 │
├────────────────┬─────────────────┬──────────────────────────────────┤
│   EARNINGS     │   PAYOUTS       │      ANALYTICS                   │
├────────────────┼─────────────────┼──────────────────────────────────┤
│ Transaction Log│ Payout Schedule │ Sales Trends                     │
│ Commission Calc│ Stripe Connect  │ Geographic Data                  │
│ Refund Handling│ Tax Forms       │ Module Performance               │
│ Revenue Split  │ Statements      │ Customer Insights                │
└────────────────┴─────────────────┴──────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (1 hour)

```sql
-- migrations/em-43-revenue-schema.sql

-- Developer Payout Accounts
CREATE TABLE developer_payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developer_profiles(id) ON DELETE CASCADE,
  
  -- Stripe Connect
  stripe_account_id TEXT UNIQUE,
  stripe_account_status TEXT DEFAULT 'pending' CHECK (stripe_account_status IN (
    'pending', 'active', 'restricted', 'disabled'
  )),
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  
  -- Payout Preferences
  payout_frequency TEXT DEFAULT 'monthly' CHECK (payout_frequency IN (
    'weekly', 'biweekly', 'monthly'
  )),
  payout_threshold DECIMAL(10,2) DEFAULT 50.00,
  payout_currency TEXT DEFAULT 'USD',
  
  -- Tax Info
  tax_form_type TEXT CHECK (tax_form_type IN ('W-9', 'W-8BEN', 'W-8BEN-E')),
  tax_form_submitted_at TIMESTAMPTZ,
  tax_form_verified BOOLEAN DEFAULT false,
  tax_id_last4 TEXT,
  
  -- Stats
  total_earnings DECIMAL(12,2) DEFAULT 0,
  total_paid_out DECIMAL(12,2) DEFAULT 0,
  pending_balance DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(developer_id)
);

-- Module Revenue Configuration
CREATE TABLE module_revenue_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Pricing
  base_price DECIMAL(10,2),
  price_type TEXT NOT NULL CHECK (price_type IN (
    'free', 'one_time', 'subscription', 'usage_based'
  )),
  
  -- Revenue Split
  platform_fee_percent DECIMAL(5,2) DEFAULT 30.00,
  developer_share_percent DECIMAL(5,2) DEFAULT 70.00,
  
  -- Subscription tiers
  tiers JSONB DEFAULT '[]'::jsonb,
  
  -- Usage-based pricing
  usage_unit TEXT,
  usage_rate DECIMAL(10,6),
  usage_included INTEGER,
  
  -- Trial
  trial_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id)
);

-- Sales Transactions
CREATE TABLE module_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id),
  developer_id UUID NOT NULL REFERENCES developer_profiles(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  agency_id UUID REFERENCES agencies(id),
  site_id UUID REFERENCES sites(id),
  
  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'purchase', 'subscription', 'renewal', 'upgrade', 'usage', 'refund'
  )),
  
  -- Amounts
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  developer_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN (
    'pending', 'completed', 'refunded', 'disputed', 'failed'
  )),
  
  -- Refund tracking
  refund_reason TEXT,
  refund_amount DECIMAL(10,2),
  refunded_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts
CREATE TABLE developer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developer_profiles(id),
  payout_account_id UUID NOT NULL REFERENCES developer_payout_accounts(id),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Amounts
  gross_earnings DECIMAL(12,2) NOT NULL,
  platform_fees DECIMAL(12,2) NOT NULL,
  net_earnings DECIMAL(12,2) NOT NULL,
  refunds DECIMAL(12,2) DEFAULT 0,
  adjustments DECIMAL(12,2) DEFAULT 0,
  payout_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  
  -- Stripe
  stripe_transfer_id TEXT,
  stripe_payout_id TEXT,
  
  -- Processing
  scheduled_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  failed_reason TEXT,
  
  -- Statement
  statement_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout Line Items
CREATE TABLE payout_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES developer_payouts(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES module_sales(id),
  
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Records (for usage-based billing)
CREATE TABLE module_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id),
  site_id UUID NOT NULL REFERENCES sites(id),
  
  -- Usage
  usage_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  
  -- Billing
  billable_quantity INTEGER,
  unit_price DECIMAL(10,6),
  total_amount DECIMAL(10,2),
  billed BOOLEAN DEFAULT false,
  billed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, site_id, usage_date)
);

-- Revenue Analytics Cache
CREATE TABLE revenue_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developer_profiles(id),
  module_id UUID REFERENCES modules(id),
  
  -- Date
  date DATE NOT NULL,
  
  -- Metrics
  sales_count INTEGER DEFAULT 0,
  gross_revenue DECIMAL(12,2) DEFAULT 0,
  net_revenue DECIMAL(12,2) DEFAULT 0,
  refund_count INTEGER DEFAULT 0,
  refund_amount DECIMAL(12,2) DEFAULT 0,
  
  -- New vs returning
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  
  -- Geography (aggregated)
  by_country JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(developer_id, module_id, date)
);

-- Indexes
CREATE INDEX idx_payout_accounts_developer ON developer_payout_accounts(developer_id);
CREATE INDEX idx_payout_accounts_stripe ON developer_payout_accounts(stripe_account_id);
CREATE INDEX idx_sales_developer ON module_sales(developer_id, created_at DESC);
CREATE INDEX idx_sales_module ON module_sales(module_id, created_at DESC);
CREATE INDEX idx_sales_status ON module_sales(status, created_at DESC);
CREATE INDEX idx_payouts_developer ON developer_payouts(developer_id, status);
CREATE INDEX idx_payouts_period ON developer_payouts(period_start, period_end);
CREATE INDEX idx_analytics_developer ON revenue_analytics_daily(developer_id, date DESC);
CREATE INDEX idx_analytics_module ON revenue_analytics_daily(module_id, date DESC);

-- Function to calculate developer earnings
CREATE OR REPLACE FUNCTION calculate_sale_amounts(
  p_gross_amount DECIMAL,
  p_platform_fee_percent DECIMAL DEFAULT 30.00
)
RETURNS TABLE(platform_fee DECIMAL, developer_amount DECIMAL) AS $$
BEGIN
  platform_fee := ROUND(p_gross_amount * (p_platform_fee_percent / 100), 2);
  developer_amount := p_gross_amount - platform_fee;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update developer balance
CREATE OR REPLACE FUNCTION update_developer_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    UPDATE developer_payout_accounts
    SET 
      total_earnings = total_earnings + NEW.developer_amount,
      pending_balance = pending_balance + NEW.developer_amount,
      updated_at = NOW()
    WHERE developer_id = NEW.developer_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'refunded' AND OLD.status = 'completed' THEN
    UPDATE developer_payout_accounts
    SET 
      total_earnings = total_earnings - NEW.refund_amount,
      pending_balance = pending_balance - NEW.refund_amount,
      updated_at = NOW()
    WHERE developer_id = NEW.developer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_developer_balance
AFTER INSERT OR UPDATE ON module_sales
FOR EACH ROW EXECUTE FUNCTION update_developer_balance();
```

---

### Task 2: Revenue Service (2 hours)

```typescript
// src/lib/revenue/revenue-service.ts

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

export interface SaleRecord {
  id: string;
  module_id: string;
  buyer_id: string;
  transaction_type: string;
  gross_amount: number;
  platform_fee: number;
  developer_amount: number;
  status: string;
  created_at: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingBalance: number;
  totalPaidOut: number;
  thisMonth: number;
  lastMonth: number;
  growthPercent: number;
}

export class RevenueService {
  /**
   * Record a sale
   */
  async recordSale(params: {
    moduleId: string;
    buyerId: string;
    agencyId?: string;
    siteId?: string;
    transactionType: string;
    grossAmount: number;
    stripePaymentIntentId?: string;
    stripeInvoiceId?: string;
    stripeSubscriptionId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SaleRecord> {
    // Get module and developer
    const { data: module } = await supabase
      .from('modules')
      .select(`
        id,
        created_by,
        revenue_config:module_revenue_config(platform_fee_percent, developer_share_percent)
      `)
      .eq('id', params.moduleId)
      .single();

    if (!module) throw new Error('Module not found');

    // Get developer profile
    const { data: developer } = await supabase
      .from('developer_profiles')
      .select('id')
      .eq('user_id', module.created_by)
      .single();

    if (!developer) throw new Error('Developer profile not found');

    // Calculate amounts
    const platformFeePercent = module.revenue_config?.platform_fee_percent || 30;
    const platformFee = Math.round(params.grossAmount * (platformFeePercent / 100) * 100) / 100;
    const developerAmount = params.grossAmount - platformFee;

    // Insert sale
    const { data, error } = await supabase
      .from('module_sales')
      .insert({
        module_id: params.moduleId,
        developer_id: developer.id,
        buyer_id: params.buyerId,
        agency_id: params.agencyId,
        site_id: params.siteId,
        transaction_type: params.transactionType,
        gross_amount: params.grossAmount,
        platform_fee: platformFee,
        developer_amount: developerAmount,
        stripe_payment_intent_id: params.stripePaymentIntentId,
        stripe_invoice_id: params.stripeInvoiceId,
        stripe_subscription_id: params.stripeSubscriptionId,
        metadata: params.metadata,
        status: 'completed'
      })
      .select()
      .single();

    if (error) throw error;

    // Update daily analytics
    await this.updateDailyAnalytics(developer.id, params.moduleId, developerAmount);

    return data;
  }

  /**
   * Process a refund
   */
  async processRefund(
    saleId: string,
    amount: number,
    reason: string
  ): Promise<void> {
    const { data: sale } = await supabase
      .from('module_sales')
      .select('*')
      .eq('id', saleId)
      .single();

    if (!sale) throw new Error('Sale not found');
    if (sale.status === 'refunded') throw new Error('Already refunded');

    // Calculate refund proportions
    const refundPercent = amount / sale.gross_amount;
    const developerRefund = Math.round(sale.developer_amount * refundPercent * 100) / 100;

    // Process Stripe refund if applicable
    if (sale.stripe_payment_intent_id) {
      await stripe.refunds.create({
        payment_intent: sale.stripe_payment_intent_id,
        amount: Math.round(amount * 100)
      });
    }

    // Update sale record
    await supabase
      .from('module_sales')
      .update({
        status: 'refunded',
        refund_reason: reason,
        refund_amount: amount,
        refunded_at: new Date().toISOString()
      })
      .eq('id', saleId);

    // Update analytics
    const today = new Date().toISOString().split('T')[0];
    await supabase.rpc('update_refund_analytics', {
      p_developer_id: sale.developer_id,
      p_module_id: sale.module_id,
      p_date: today,
      p_refund_amount: developerRefund
    });
  }

  /**
   * Get earnings summary for developer
   */
  async getEarningsSummary(developerId: string): Promise<EarningsSummary> {
    const { data: account } = await supabase
      .from('developer_payout_accounts')
      .select('total_earnings, pending_balance, total_paid_out')
      .eq('developer_id', developerId)
      .single();

    if (!account) {
      return {
        totalEarnings: 0,
        pendingBalance: 0,
        totalPaidOut: 0,
        thisMonth: 0,
        lastMonth: 0,
        growthPercent: 0
      };
    }

    // Get this month's earnings
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const { data: thisMonthData } = await supabase
      .from('module_sales')
      .select('developer_amount')
      .eq('developer_id', developerId)
      .eq('status', 'completed')
      .gte('created_at', thisMonthStart);

    const { data: lastMonthData } = await supabase
      .from('module_sales')
      .select('developer_amount')
      .eq('developer_id', developerId)
      .eq('status', 'completed')
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd);

    const thisMonth = thisMonthData?.reduce((sum, s) => sum + s.developer_amount, 0) || 0;
    const lastMonth = lastMonthData?.reduce((sum, s) => sum + s.developer_amount, 0) || 0;

    const growthPercent = lastMonth > 0 
      ? ((thisMonth - lastMonth) / lastMonth) * 100 
      : thisMonth > 0 ? 100 : 0;

    return {
      totalEarnings: account.total_earnings,
      pendingBalance: account.pending_balance,
      totalPaidOut: account.total_paid_out,
      thisMonth,
      lastMonth,
      growthPercent
    };
  }

  /**
   * Get sales history
   */
  async getSalesHistory(
    developerId: string,
    options: {
      moduleId?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ sales: SaleRecord[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const from = (page - 1) * limit;

    let query = supabase
      .from('module_sales')
      .select(`
        *,
        module:modules(name, icon),
        buyer:users(name, email)
      `, { count: 'exact' })
      .eq('developer_id', developerId);

    if (options.moduleId) {
      query = query.eq('module_id', options.moduleId);
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      sales: data || [],
      total: count || 0
    };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(
    developerId: string,
    options: {
      moduleId?: string;
      startDate: string;
      endDate: string;
      groupBy?: 'day' | 'week' | 'month';
    }
  ): Promise<{
    data: Array<{ date: string; revenue: number; sales: number }>;
    totals: { revenue: number; sales: number; avgOrderValue: number };
    topModules: Array<{ moduleId: string; name: string; revenue: number; sales: number }>;
    byCountry: Array<{ country: string; revenue: number; sales: number }>;
  }> {
    let query = supabase
      .from('revenue_analytics_daily')
      .select('*')
      .eq('developer_id', developerId)
      .gte('date', options.startDate)
      .lte('date', options.endDate);

    if (options.moduleId) {
      query = query.eq('module_id', options.moduleId);
    }

    const { data: analytics, error } = await query.order('date');

    if (error) throw error;

    // Aggregate data
    const dailyData: Record<string, { revenue: number; sales: number }> = {};
    const moduleData: Record<string, { name: string; revenue: number; sales: number }> = {};
    const countryData: Record<string, { revenue: number; sales: number }> = {};
    let totalRevenue = 0;
    let totalSales = 0;

    (analytics || []).forEach(a => {
      // Daily aggregation
      if (!dailyData[a.date]) {
        dailyData[a.date] = { revenue: 0, sales: 0 };
      }
      dailyData[a.date].revenue += a.net_revenue;
      dailyData[a.date].sales += a.sales_count;

      // Module aggregation
      if (a.module_id) {
        if (!moduleData[a.module_id]) {
          moduleData[a.module_id] = { name: '', revenue: 0, sales: 0 };
        }
        moduleData[a.module_id].revenue += a.net_revenue;
        moduleData[a.module_id].sales += a.sales_count;
      }

      // Country aggregation
      if (a.by_country) {
        Object.entries(a.by_country as Record<string, number>).forEach(([country, amount]) => {
          if (!countryData[country]) {
            countryData[country] = { revenue: 0, sales: 0 };
          }
          countryData[country].revenue += amount;
          countryData[country].sales += 1;
        });
      }

      totalRevenue += a.net_revenue;
      totalSales += a.sales_count;
    });

    // Get module names
    const moduleIds = Object.keys(moduleData);
    if (moduleIds.length > 0) {
      const { data: modules } = await supabase
        .from('modules')
        .select('id, name')
        .in('id', moduleIds);

      modules?.forEach(m => {
        if (moduleData[m.id]) {
          moduleData[m.id].name = m.name;
        }
      });
    }

    return {
      data: Object.entries(dailyData).map(([date, d]) => ({
        date,
        revenue: d.revenue,
        sales: d.sales
      })),
      totals: {
        revenue: totalRevenue,
        sales: totalSales,
        avgOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0
      },
      topModules: Object.entries(moduleData)
        .map(([moduleId, d]) => ({ moduleId, ...d }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      byCountry: Object.entries(countryData)
        .map(([country, d]) => ({ country, ...d }))
        .sort((a, b) => b.revenue - a.revenue)
    };
  }

  /**
   * Update daily analytics cache
   */
  private async updateDailyAnalytics(
    developerId: string,
    moduleId: string,
    amount: number
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await supabase.rpc('upsert_revenue_analytics', {
      p_developer_id: developerId,
      p_module_id: moduleId,
      p_date: today,
      p_sale_amount: amount
    });
  }
}
```

---

### Task 3: Payout Service (2 hours)

```typescript
// src/lib/revenue/payout-service.ts

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
});

export interface PayoutAccount {
  id: string;
  developer_id: string;
  stripe_account_id: string | null;
  stripe_account_status: string;
  payout_frequency: string;
  payout_threshold: number;
  pending_balance: number;
  total_paid_out: number;
}

export interface Payout {
  id: string;
  period_start: string;
  period_end: string;
  gross_earnings: number;
  net_earnings: number;
  payout_amount: number;
  status: string;
  processed_at: string | null;
  statement_url: string | null;
}

export class PayoutService {
  /**
   * Create or get Stripe Connect account
   */
  async createConnectAccount(developerId: string): Promise<string> {
    // Check if account exists
    const { data: existing } = await supabase
      .from('developer_payout_accounts')
      .select('stripe_account_id')
      .eq('developer_id', developerId)
      .single();

    if (existing?.stripe_account_id) {
      return existing.stripe_account_id;
    }

    // Get developer info
    const { data: developer } = await supabase
      .from('developer_profiles')
      .select(`
        user:users(email)
      `)
      .eq('id', developerId)
      .single();

    if (!developer) throw new Error('Developer not found');

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: developer.user?.email,
      capabilities: {
        transfers: { requested: true }
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual'
          }
        }
      }
    });

    // Store account ID
    await supabase
      .from('developer_payout_accounts')
      .upsert({
        developer_id: developerId,
        stripe_account_id: account.id,
        stripe_account_status: 'pending'
      });

    return account.id;
  }

  /**
   * Get Stripe Connect onboarding link
   */
  async getOnboardingLink(developerId: string, returnUrl: string): Promise<string> {
    const stripeAccountId = await this.createConnectAccount(developerId);

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: `${returnUrl}?success=true`,
      type: 'account_onboarding'
    });

    return accountLink.url;
  }

  /**
   * Check Stripe account status
   */
  async refreshAccountStatus(developerId: string): Promise<string> {
    const { data: account } = await supabase
      .from('developer_payout_accounts')
      .select('stripe_account_id')
      .eq('developer_id', developerId)
      .single();

    if (!account?.stripe_account_id) return 'not_connected';

    const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id);

    let status = 'pending';
    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      status = 'active';
    } else if (stripeAccount.requirements?.currently_due?.length) {
      status = 'restricted';
    }

    // Update status
    await supabase
      .from('developer_payout_accounts')
      .update({
        stripe_account_status: status,
        stripe_onboarding_complete: stripeAccount.details_submitted
      })
      .eq('developer_id', developerId);

    return status;
  }

  /**
   * Get payout account details
   */
  async getPayoutAccount(developerId: string): Promise<PayoutAccount | null> {
    const { data, error } = await supabase
      .from('developer_payout_accounts')
      .select('*')
      .eq('developer_id', developerId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Update payout preferences
   */
  async updatePayoutPreferences(
    developerId: string,
    preferences: {
      payout_frequency?: string;
      payout_threshold?: number;
      payout_currency?: string;
    }
  ): Promise<void> {
    await supabase
      .from('developer_payout_accounts')
      .update({
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .eq('developer_id', developerId);
  }

  /**
   * Create a payout
   */
  async createPayout(
    developerId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<Payout> {
    // Get account
    const { data: account } = await supabase
      .from('developer_payout_accounts')
      .select('*')
      .eq('developer_id', developerId)
      .single();

    if (!account) throw new Error('Payout account not found');
    if (account.stripe_account_status !== 'active') {
      throw new Error('Stripe account not active');
    }

    // Calculate earnings for period
    const { data: sales } = await supabase
      .from('module_sales')
      .select('gross_amount, platform_fee, developer_amount, refund_amount')
      .eq('developer_id', developerId)
      .eq('status', 'completed')
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    const totals = (sales || []).reduce(
      (acc, s) => ({
        gross: acc.gross + (s.gross_amount || 0),
        fees: acc.fees + (s.platform_fee || 0),
        net: acc.net + (s.developer_amount || 0),
        refunds: acc.refunds + (s.refund_amount || 0)
      }),
      { gross: 0, fees: 0, net: 0, refunds: 0 }
    );

    const payoutAmount = totals.net - totals.refunds;

    if (payoutAmount < account.payout_threshold) {
      throw new Error(`Amount below threshold of $${account.payout_threshold}`);
    }

    // Create payout record
    const { data: payout, error } = await supabase
      .from('developer_payouts')
      .insert({
        developer_id: developerId,
        payout_account_id: account.id,
        period_start: periodStart,
        period_end: periodEnd,
        gross_earnings: totals.gross,
        platform_fees: totals.fees,
        net_earnings: totals.net,
        refunds: totals.refunds,
        payout_amount: payoutAmount,
        status: 'pending',
        scheduled_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Create line items
    if (sales && sales.length > 0) {
      const { data: saleRecords } = await supabase
        .from('module_sales')
        .select('id, module:modules(name), developer_amount')
        .eq('developer_id', developerId)
        .eq('status', 'completed')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      const lineItems = (saleRecords || []).map(s => ({
        payout_id: payout.id,
        sale_id: s.id,
        description: `Sale: ${s.module?.name}`,
        amount: s.developer_amount
      }));

      await supabase.from('payout_line_items').insert(lineItems);
    }

    return payout;
  }

  /**
   * Process a payout via Stripe
   */
  async processPayout(payoutId: string): Promise<void> {
    const { data: payout } = await supabase
      .from('developer_payouts')
      .select(`
        *,
        account:developer_payout_accounts(stripe_account_id)
      `)
      .eq('id', payoutId)
      .single();

    if (!payout) throw new Error('Payout not found');
    if (payout.status !== 'pending') throw new Error('Payout not pending');

    try {
      // Create Stripe transfer
      const transfer = await stripe.transfers.create({
        amount: Math.round(payout.payout_amount * 100),
        currency: payout.currency,
        destination: payout.account.stripe_account_id,
        transfer_group: `payout_${payout.id}`
      });

      // Update payout
      await supabase
        .from('developer_payouts')
        .update({
          status: 'processing',
          stripe_transfer_id: transfer.id
        })
        .eq('id', payoutId);

      // Update developer balance
      await supabase
        .from('developer_payout_accounts')
        .update({
          pending_balance: supabase.rpc('decrement_balance', {
            amount: payout.payout_amount
          }),
          total_paid_out: supabase.rpc('increment_paid_out', {
            amount: payout.payout_amount
          })
        })
        .eq('id', payout.payout_account_id);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await supabase
        .from('developer_payouts')
        .update({
          status: 'failed',
          failed_reason: errorMessage
        })
        .eq('id', payoutId);

      throw error;
    }
  }

  /**
   * Get payout history
   */
  async getPayoutHistory(
    developerId: string,
    options: {
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ payouts: Payout[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const from = (page - 1) * limit;

    let query = supabase
      .from('developer_payouts')
      .select('*', { count: 'exact' })
      .eq('developer_id', developerId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      payouts: data || [],
      total: count || 0
    };
  }

  /**
   * Generate statement PDF
   */
  async generateStatement(payoutId: string): Promise<string> {
    const { data: payout } = await supabase
      .from('developer_payouts')
      .select(`
        *,
        line_items:payout_line_items(*),
        developer:developer_profiles(display_name, user:users(email))
      `)
      .eq('id', payoutId)
      .single();

    if (!payout) throw new Error('Payout not found');

    // Generate PDF (using a PDF library like pdf-lib or pdfkit)
    // This is a placeholder - implement actual PDF generation
    const statementContent = `
      EARNINGS STATEMENT
      
      Developer: ${payout.developer?.display_name}
      Period: ${payout.period_start} to ${payout.period_end}
      
      Gross Earnings: $${payout.gross_earnings.toFixed(2)}
      Platform Fees: -$${payout.platform_fees.toFixed(2)}
      Refunds: -$${payout.refunds.toFixed(2)}
      ---
      Net Payout: $${payout.payout_amount.toFixed(2)}
      
      Line Items:
      ${payout.line_items.map((li: { description: string; amount: number }) => 
        `  ${li.description}: $${li.amount.toFixed(2)}`
      ).join('\n')}
    `;

    // Upload to storage and return URL
    const fileName = `statements/${payout.developer_id}/${payoutId}.pdf`;
    
    // For now, return a placeholder URL
    const url = `/api/statements/${payoutId}`;

    await supabase
      .from('developer_payouts')
      .update({ statement_url: url })
      .eq('id', payoutId);

    return url;
  }
}
```

---

### Task 4: Revenue Dashboard UI (3 hours)

```tsx
// src/app/(dashboard)/developer/revenue/page.tsx

'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Download,
  Calendar,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui';
import { RevenueChart } from '@/components/developer/RevenueChart';
import { useRevenueData } from '@/hooks/useRevenueData';

export default function RevenueDashboardPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  
  const {
    summary,
    analytics,
    sales,
    payouts,
    payoutAccount,
    isLoading,
    refetch
  } = useRevenueData({ dateRange, moduleId: selectedModule });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
          <p className="text-muted-foreground">
            Track your earnings and manage payouts
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Payout Account Alert */}
      {payoutAccount?.stripe_account_status !== 'active' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {payoutAccount?.stripe_account_status === 'pending'
                ? 'Complete your payout account setup to receive earnings.'
                : 'Your payout account needs attention.'}
            </span>
            <Button size="sm" asChild>
              <a href="/developer/settings/payouts">Setup Payouts</a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.totalEarnings || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.pendingBalance || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.thisMonth || 0)}
                </p>
                {summary?.growthPercent !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${
                    summary?.growthPercent > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary?.growthPercent > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(summary?.growthPercent || 0).toFixed(1)}% vs last month
                  </div>
                )}
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid Out</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary?.totalPaidOut || 0)}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Download className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Your earnings for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={analytics?.data || []} />
            </CardContent>
          </Card>

          {/* Top Modules & Geography */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topModules.slice(0, 5).map((module, i) => (
                    <div key={module.moduleId} className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{module.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {module.sales} sales
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(module.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Country</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.byCountry.slice(0, 5).map((country) => (
                    <div key={country.country} className="flex items-center gap-4">
                      <span className="text-2xl">
                        {getCountryFlag(country.country)}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{country.country}</p>
                        <p className="text-sm text-muted-foreground">
                          {country.sales} sales
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(country.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
              <CardDescription>
                All your module sales transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales?.sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {new Date(sale.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{sale.module?.icon}</span>
                          <span>{sale.module?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{sale.buyer?.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.transaction_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            sale.status === 'completed' ? 'default' :
                            sale.status === 'refunded' ? 'destructive' : 'secondary'
                          }
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {sale.status === 'refunded' ? (
                          <span className="text-red-600">
                            -{formatCurrency(sale.refund_amount || 0)}
                          </span>
                        ) : (
                          formatCurrency(sale.developer_amount)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>
                  Your completed and pending payouts
                </CardDescription>
              </div>
              <Button>Request Payout</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts?.payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        {new Date(payout.period_start).toLocaleDateString()} - {' '}
                        {new Date(payout.period_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{formatCurrency(payout.gross_earnings)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        -{formatCurrency(payout.platform_fees + payout.refunds)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payout.payout_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payout.status === 'completed' ? 'default' :
                            payout.status === 'failed' ? 'destructive' : 'secondary'
                          }
                        >
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payout.processed_at
                          ? new Date(payout.processed_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {payout.statement_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={payout.statement_url} download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺'
  };
  return flags[country] || '🌍';
}
```

---

### Task 5: Revenue Chart Component (1 hour)

```tsx
// src/components/developer/RevenueChart.tsx

'use client';

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    sales: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No data for the selected period
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded-lg shadow-lg p-3">
                    <p className="font-medium">{formatDate(label)}</p>
                    <p className="text-primary">
                      Revenue: {formatCurrency(payload[0].value as number)}
                    </p>
                    <p className="text-muted-foreground">
                      Sales: {payload[0].payload.sales}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#8884d8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## ✅ Verification Checklist

- [ ] Sales record correctly
- [ ] Revenue calculates accurately
- [ ] Stripe Connect integrates
- [ ] Payouts process successfully
- [ ] Analytics update daily
- [ ] Statements generate
- [ ] Dashboard displays data
- [ ] Refunds deduct properly
- [ ] Currency formats correctly
- [ ] Export works

---

## 📍 Dependencies

- **Requires**: EM-01, EM-02, EM-42
- **Required by**: Developer ecosystem growth
- **External**: Stripe Connect, PDF generation library
