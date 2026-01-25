# Phase EM-59A: Paddle Billing Integration - Core Infrastructure

> **Phase Type:** Platform Foundation  
> **Complexity:** High  
> **Dependencies:** Replaces LemonSqueezy integration  
> **Estimated Effort:** 3-4 weeks  
> **Business Impact:** 🌍 Enables Global Payments (including Zambia)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Why Paddle Over LemonSqueezy](#why-paddle-over-lemonsqueezy)
3. [Pricing Model Architecture](#pricing-model-architecture)
4. [Database Schema](#database-schema)
5. [Paddle Integration Setup](#paddle-integration-setup)
6. [Subscription Management](#subscription-management)
7. [Usage-Based Billing](#usage-based-billing)
8. [Webhook Handlers](#webhook-handlers)
9. [Migration from LemonSqueezy](#migration-from-lemonsqueezy)

---

## Executive Summary

### The Problem

LemonSqueezy doesn't support payouts to Zambian banks, making it impossible for you to receive revenue. Paddle solves this through Payoneer/Wise integration.

### The Solution

Replace LemonSqueezy with Paddle as Merchant of Record (MoR), implementing:
- Hybrid pricing (base subscription + usage-based)
- Metered billing for automation runs & AI actions
- Global tax compliance
- Zambia-compatible payouts via Payoneer/Wise

### Key Changes

| Component | LemonSqueezy (Current) | Paddle (New) |
|-----------|------------------------|--------------|
| Payout Method | ❌ No Zambia | ✅ Payoneer/Wise |
| Usage Billing | ⚠️ Limited | ✅ Full metered |
| Tax Compliance | ✅ Basic | ✅ Advanced |
| Dunning | ⚠️ Basic | ✅ Advanced |
| Enterprise Features | ❌ Limited | ✅ Quotes, Invoicing |

---

## Why Paddle Over LemonSqueezy

### Comparison Matrix

| Feature | LemonSqueezy | Paddle | Winner |
|---------|--------------|--------|--------|
| **Payout to Zambia** | ❌ No | ✅ Yes (Payoneer/Wise) | **Paddle** |
| **Merchant of Record** | ✅ Yes | ✅ Yes | Tie |
| **Usage-Based Billing** | ⚠️ Basic | ✅ Advanced | **Paddle** |
| **Subscription Pausing** | ✅ Yes | ✅ Yes | Tie |
| **Dunning (Failed Payments)** | ⚠️ Basic | ✅ Advanced | **Paddle** |
| **Tax Compliance** | ✅ Good | ✅ Excellent | **Paddle** |
| **Enterprise Features** | ❌ Limited | ✅ Full | **Paddle** |
| **Pricing** | 5% + $0.50 | 5% + $0.50 | Tie |
| **Developer Experience** | ✅ Good | ✅ Good | Tie |
| **Documentation** | ✅ Good | ✅ Excellent | **Paddle** |

### Payout Solution for Zambia

```
Revenue Flow:
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐     ┌────────────────┐
│  Customer   │────►│   Paddle    │────►│    Payoneer     │────►│  Zambia Bank   │
│  Pays $99   │     │  Processes  │     │  or Wise        │     │  Receives ZMW  │
└─────────────┘     └─────────────┘     └─────────────────┘     └────────────────┘

Paddle handles:
• Payment processing
• Tax calculation & remittance
• Fraud prevention
• Currency conversion
• Compliance

You receive:
• Weekly/Monthly payouts
• To Payoneer → Local bank
• Or Wise → Local bank
```

### Setting Up Payoneer/Wise with Paddle

1. **Create Payoneer Business Account**
   - Sign up at payoneer.com
   - Verify business documents
   - Get USD receiving account details

2. **Or Create Wise Business Account**
   - Sign up at wise.com/business
   - Complete verification
   - Get USD account details

3. **Link to Paddle**
   - In Paddle dashboard → Settings → Payouts
   - Add bank account (use Payoneer/Wise USD details)
   - Set payout schedule (weekly recommended)

---

## Pricing Model Architecture

### Simple Hybrid Model

```
┌─────────────────────────────────────────────────────────────────┐
│                   DRAMAC PRICING STRUCTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  STARTER PLAN - $29/month ($290/year - save 17%)          │  │
│  │  ─────────────────────────────────────────────────────────│  │
│  │  Base Features:                                            │  │
│  │  • 3 modules included                                      │  │
│  │  • 1 site                                                  │  │
│  │  • 3 team members                                          │  │
│  │  • Basic support                                           │  │
│  │                                                            │  │
│  │  Included Usage:                                           │  │
│  │  • 1,000 automation runs/month                            │  │
│  │  • 500 AI actions/month                                   │  │
│  │  • 10,000 API calls/month                                 │  │
│  │                                                            │  │
│  │  Overage Rates:                                           │  │
│  │  • $0.001 per automation run                              │  │
│  │  • $0.005 per AI action                                   │  │
│  │  • $0.0001 per API call                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  PRO PLAN - $99/month ($990/year - save 17%)              │  │
│  │  ─────────────────────────────────────────────────────────│  │
│  │  Base Features:                                            │  │
│  │  • 10 modules included                                     │  │
│  │  • 5 sites                                                 │  │
│  │  • 10 team members                                         │  │
│  │  • Priority support                                        │  │
│  │  • Custom domain                                           │  │
│  │  • White-label options                                     │  │
│  │                                                            │  │
│  │  Included Usage:                                           │  │
│  │  • 10,000 automation runs/month                           │  │
│  │  • 5,000 AI actions/month                                 │  │
│  │  • 100,000 API calls/month                                │  │
│  │                                                            │  │
│  │  Overage Rates (50% discount):                            │  │
│  │  • $0.0005 per automation run                             │  │
│  │  • $0.0025 per AI action                                  │  │
│  │  • $0.00005 per API call                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ENTERPRISE - Custom Pricing (Contact Sales)              │  │
│  │  ─────────────────────────────────────────────────────────│  │
│  │  Everything in Pro, plus:                                  │  │
│  │  • Unlimited modules                                       │  │
│  │  • Unlimited sites                                         │  │
│  │  • Unlimited team members                                  │  │
│  │  • Dedicated support                                       │  │
│  │  • SLA guarantees                                          │  │
│  │  • Custom integrations                                     │  │
│  │  • SSO/SAML                                                │  │
│  │  • Unlimited usage (no overage)                           │  │
│  │  • Custom development                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  MODULE ADD-ONS (Optional)                                       │
│  ├─ Premium CRM: +$19/month                                     │
│  ├─ Advanced Analytics: +$29/month                              │
│  ├─ AI Agent Pack: +$49/month (includes 5,000 extra AI actions) │
│  └─ White-label Complete: +$99/month                            │
└─────────────────────────────────────────────────────────────────┘
```

### How Paddle Handles This

```typescript
// Paddle Product Structure

// 1. Base Subscription Products
const PRODUCTS = {
  starter_monthly: {
    paddle_product_id: 'pro_starter_monthly',
    paddle_price_id: 'pri_starter_monthly',
    name: 'Starter Monthly',
    amount: 2900, // $29.00 in cents
    interval: 'month',
    included_usage: {
      automation_runs: 1000,
      ai_actions: 500,
      api_calls: 10000
    }
  },
  starter_yearly: {
    paddle_product_id: 'pro_starter_yearly',
    paddle_price_id: 'pri_starter_yearly',
    name: 'Starter Yearly',
    amount: 29000, // $290.00 in cents
    interval: 'year',
    included_usage: {
      automation_runs: 12000, // 1000 × 12
      ai_actions: 6000,       // 500 × 12
      api_calls: 120000       // 10000 × 12
    }
  },
  pro_monthly: {
    paddle_product_id: 'pro_pro_monthly',
    paddle_price_id: 'pri_pro_monthly',
    name: 'Pro Monthly',
    amount: 9900, // $99.00 in cents
    interval: 'month',
    included_usage: {
      automation_runs: 10000,
      ai_actions: 5000,
      api_calls: 100000
    }
  },
  pro_yearly: {
    paddle_product_id: 'pro_pro_yearly',
    paddle_price_id: 'pri_pro_yearly',
    name: 'Pro Yearly',
    amount: 99000, // $990.00 in cents
    interval: 'year',
    included_usage: {
      automation_runs: 120000,
      ai_actions: 60000,
      api_calls: 1200000
    }
  }
};

// 2. Metered Usage Items (for overage)
const METERED_ITEMS = {
  automation_runs: {
    paddle_price_id: 'pri_automation_overage',
    unit_name: 'automation run',
    unit_price_starter: 0.001,  // $0.001 per run
    unit_price_pro: 0.0005,     // $0.0005 per run (50% discount)
  },
  ai_actions: {
    paddle_price_id: 'pri_ai_overage',
    unit_name: 'AI action',
    unit_price_starter: 0.005,  // $0.005 per action
    unit_price_pro: 0.0025,     // $0.0025 per action
  },
  api_calls: {
    paddle_price_id: 'pri_api_overage',
    unit_name: 'API call',
    unit_price_starter: 0.0001,
    unit_price_pro: 0.00005,
  }
};
```

---

## Database Schema

### Migration File: `migrations/em-59-paddle-billing.sql`

```sql
-- ============================================================================
-- Phase EM-59: Paddle Billing Schema
-- Created: 2026-01-XX
-- Description: Replaces LemonSqueezy with Paddle billing integration
-- ============================================================================

-- ============================================================================
-- DROP OLD LEMONSQUEEZY COLUMNS (if safe)
-- ============================================================================
-- Note: Run this AFTER migration is complete and verified
-- ALTER TABLE modules_v2 DROP COLUMN IF EXISTS lemon_product_id;
-- ALTER TABLE modules_v2 DROP COLUMN IF EXISTS lemon_variant_monthly_id;
-- ALTER TABLE modules_v2 DROP COLUMN IF EXISTS lemon_variant_yearly_id;
-- ALTER TABLE modules_v2 DROP COLUMN IF EXISTS lemon_variant_one_time_id;

-- ============================================================================
-- PADDLE CUSTOMERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS paddle_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Paddle identifiers
  paddle_customer_id TEXT NOT NULL UNIQUE,
  
  -- Customer info
  email TEXT NOT NULL,
  name TEXT,
  
  -- Address (for tax)
  address_country TEXT,
  address_postal_code TEXT,
  address_city TEXT,
  address_line1 TEXT,
  
  -- Tax
  tax_identifier TEXT,
  
  -- Metadata
  marketing_consent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PADDLE SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS paddle_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES paddle_customers(id) ON DELETE CASCADE,
  
  -- Paddle identifiers
  paddle_subscription_id TEXT NOT NULL UNIQUE,
  paddle_product_id TEXT NOT NULL,
  paddle_price_id TEXT NOT NULL,
  
  -- Plan details
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'enterprise')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'trialing',
    'active',
    'past_due',
    'paused',
    'canceled'
  )),
  
  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  
  -- Pricing at time of subscription
  unit_price INTEGER NOT NULL,           -- In cents
  currency TEXT DEFAULT 'USD',
  
  -- Included usage (snapshot at subscription time)
  included_automation_runs INTEGER DEFAULT 0,
  included_ai_actions INTEGER DEFAULT 0,
  included_api_calls INTEGER DEFAULT 0,
  
  -- Discount
  discount_id TEXT,
  discount_percentage DECIMAL(5,2),
  discount_ends_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PADDLE TRANSACTIONS (Invoices)
-- ============================================================================

CREATE TABLE IF NOT EXISTS paddle_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES paddle_subscriptions(id) ON DELETE SET NULL,
  
  -- Paddle identifiers
  paddle_transaction_id TEXT NOT NULL UNIQUE,
  paddle_invoice_id TEXT,
  paddle_invoice_number TEXT,
  
  -- Type
  origin TEXT CHECK (origin IN (
    'subscription_recurring',
    'subscription_charge',
    'subscription_payment_method_change',
    'web',
    'api'
  )),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'draft',
    'ready',
    'billed',
    'paid',
    'completed',
    'canceled',
    'past_due'
  )),
  
  -- Amounts
  subtotal INTEGER NOT NULL,             -- Before tax, in cents
  tax INTEGER DEFAULT 0,                 -- Tax amount
  total INTEGER NOT NULL,                -- Final amount
  currency TEXT DEFAULT 'USD',
  
  -- Tax details
  tax_rate DECIMAL(5,4),
  tax_rates JSONB DEFAULT '[]',          -- Multiple tax rates if applicable
  
  -- Line items
  line_items JSONB DEFAULT '[]',
  
  -- Billing period
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  
  -- Payment
  payment_method TEXT,
  card_last_four TEXT,
  
  -- URLs
  invoice_url TEXT,
  receipt_url TEXT,
  
  -- Dates
  billed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USAGE TRACKING
-- ============================================================================

-- Hourly usage buckets (for real-time tracking)
CREATE TABLE IF NOT EXISTS usage_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Time bucket
  hour_timestamp TIMESTAMPTZ NOT NULL,   -- Truncated to hour
  
  -- Counts
  automation_runs INTEGER DEFAULT 0,
  ai_actions INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  
  -- Breakdown by type
  automation_by_workflow JSONB DEFAULT '{}',  -- { workflow_id: count }
  ai_by_agent JSONB DEFAULT '{}',             -- { agent_id: count }
  api_by_endpoint JSONB DEFAULT '{}',         -- { endpoint: count }
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (agency_id, site_id, hour_timestamp)
);

-- Daily usage aggregates
CREATE TABLE IF NOT EXISTS usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Date
  date DATE NOT NULL,
  
  -- Totals
  automation_runs INTEGER DEFAULT 0,
  ai_actions INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  
  -- Breakdown by site
  usage_by_site JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (agency_id, date)
);

-- Billing period usage (for invoicing)
CREATE TABLE IF NOT EXISTS usage_billing_period (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES paddle_subscriptions(id) ON DELETE CASCADE,
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Usage totals
  automation_runs INTEGER DEFAULT 0,
  ai_actions INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  
  -- Included (from plan)
  included_automation_runs INTEGER DEFAULT 0,
  included_ai_actions INTEGER DEFAULT 0,
  included_api_calls INTEGER DEFAULT 0,
  
  -- Overage
  overage_automation_runs INTEGER DEFAULT 0,
  overage_ai_actions INTEGER DEFAULT 0,
  overage_api_calls INTEGER DEFAULT 0,
  
  -- Overage cost (in cents)
  overage_cost INTEGER DEFAULT 0,
  
  -- Status
  reported_to_paddle BOOLEAN DEFAULT false,
  reported_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (subscription_id, period_start)
);

-- ============================================================================
-- PADDLE PRODUCTS (Platform Configuration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS paddle_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  slug TEXT NOT NULL UNIQUE,             -- 'starter_monthly', 'pro_yearly', etc.
  name TEXT NOT NULL,
  description TEXT,
  
  -- Paddle IDs
  paddle_product_id TEXT,
  paddle_price_id TEXT,
  
  -- Pricing
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'enterprise', 'addon')),
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Included usage
  included_automation_runs INTEGER DEFAULT 0,
  included_ai_actions INTEGER DEFAULT 0,
  included_api_calls INTEGER DEFAULT 0,
  
  -- Limits
  max_modules INTEGER,
  max_sites INTEGER,
  max_team_members INTEGER,
  
  -- Features
  features JSONB DEFAULT '[]',
  
  -- Overage rates (cents per unit)
  overage_rate_automation DECIMAL(10,6),
  overage_rate_ai DECIMAL(10,6),
  overage_rate_api DECIMAL(10,6),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PADDLE WEBHOOKS LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS paddle_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event details
  paddle_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  
  -- Payload
  payload JSONB NOT NULL,
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  
  -- Timing
  occurred_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_paddle_customers_agency ON paddle_customers(agency_id);
CREATE INDEX idx_paddle_customers_paddle_id ON paddle_customers(paddle_customer_id);

CREATE INDEX idx_paddle_subscriptions_agency ON paddle_subscriptions(agency_id);
CREATE INDEX idx_paddle_subscriptions_status ON paddle_subscriptions(status);
CREATE INDEX idx_paddle_subscriptions_paddle_id ON paddle_subscriptions(paddle_subscription_id);

CREATE INDEX idx_paddle_transactions_agency ON paddle_transactions(agency_id);
CREATE INDEX idx_paddle_transactions_subscription ON paddle_transactions(subscription_id);
CREATE INDEX idx_paddle_transactions_status ON paddle_transactions(status);

CREATE INDEX idx_usage_hourly_agency_hour ON usage_hourly(agency_id, hour_timestamp DESC);
CREATE INDEX idx_usage_hourly_site_hour ON usage_hourly(site_id, hour_timestamp DESC);

CREATE INDEX idx_usage_daily_agency_date ON usage_daily(agency_id, date DESC);

CREATE INDEX idx_usage_billing_period_sub ON usage_billing_period(subscription_id);
CREATE INDEX idx_usage_billing_period_dates ON usage_billing_period(period_start, period_end);

CREATE INDEX idx_paddle_webhooks_event_type ON paddle_webhooks(event_type);
CREATE INDEX idx_paddle_webhooks_processed ON paddle_webhooks(processed) WHERE processed = false;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE paddle_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_billing_period ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE paddle_webhooks ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY "Service role bypass" ON paddle_customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON paddle_subscriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON paddle_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON usage_hourly FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON usage_daily FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON usage_billing_period FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON paddle_products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role bypass" ON paddle_webhooks FOR ALL USING (auth.role() = 'service_role');

-- User policies
CREATE POLICY "Users can view their agency's customer" ON paddle_customers
  FOR SELECT USING (agency_id IN (
    SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their agency's subscription" ON paddle_subscriptions
  FOR SELECT USING (agency_id IN (
    SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their agency's transactions" ON paddle_transactions
  FOR SELECT USING (agency_id IN (
    SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their agency's usage" ON usage_hourly
  FOR SELECT USING (agency_id IN (
    SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their agency's daily usage" ON usage_daily
  FOR SELECT USING (agency_id IN (
    SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their agency's billing period" ON usage_billing_period
  FOR SELECT USING (agency_id IN (
    SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
  ));

-- Products are public (read-only)
CREATE POLICY "Anyone can view products" ON paddle_products
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Increment usage (atomic operation)
CREATE OR REPLACE FUNCTION increment_usage(
  p_agency_id UUID,
  p_site_id UUID,
  p_automation_runs INTEGER DEFAULT 0,
  p_ai_actions INTEGER DEFAULT 0,
  p_api_calls INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_hour TIMESTAMPTZ;
BEGIN
  v_hour := date_trunc('hour', NOW());
  
  INSERT INTO usage_hourly (
    agency_id, site_id, hour_timestamp,
    automation_runs, ai_actions, api_calls
  ) VALUES (
    p_agency_id, p_site_id, v_hour,
    p_automation_runs, p_ai_actions, p_api_calls
  )
  ON CONFLICT (agency_id, site_id, hour_timestamp)
  DO UPDATE SET
    automation_runs = usage_hourly.automation_runs + p_automation_runs,
    ai_actions = usage_hourly.ai_actions + p_ai_actions,
    api_calls = usage_hourly.api_calls + p_api_calls;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aggregate daily usage (called by cron)
CREATE OR REPLACE FUNCTION aggregate_daily_usage(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO usage_daily (agency_id, date, automation_runs, ai_actions, api_calls, usage_by_site)
  SELECT 
    agency_id,
    p_date,
    SUM(automation_runs),
    SUM(ai_actions),
    SUM(api_calls),
    jsonb_object_agg(site_id, jsonb_build_object(
      'automation_runs', automation_runs,
      'ai_actions', ai_actions,
      'api_calls', api_calls
    ))
  FROM usage_hourly
  WHERE hour_timestamp >= p_date::timestamptz
    AND hour_timestamp < (p_date + 1)::timestamptz
  GROUP BY agency_id
  ON CONFLICT (agency_id, date)
  DO UPDATE SET
    automation_runs = EXCLUDED.automation_runs,
    ai_actions = EXCLUDED.ai_actions,
    api_calls = EXCLUDED.api_calls,
    usage_by_site = EXCLUDED.usage_by_site;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current period usage for an agency
CREATE OR REPLACE FUNCTION get_current_period_usage(p_agency_id UUID)
RETURNS TABLE (
  automation_runs BIGINT,
  ai_actions BIGINT,
  api_calls BIGINT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(uh.automation_runs), 0)::BIGINT,
    COALESCE(SUM(uh.ai_actions), 0)::BIGINT,
    COALESCE(SUM(uh.api_calls), 0)::BIGINT,
    ps.current_period_start,
    ps.current_period_end
  FROM paddle_subscriptions ps
  LEFT JOIN usage_hourly uh ON uh.agency_id = ps.agency_id
    AND uh.hour_timestamp >= ps.current_period_start
    AND uh.hour_timestamp < ps.current_period_end
  WHERE ps.agency_id = p_agency_id
    AND ps.status IN ('active', 'trialing', 'past_due')
  GROUP BY ps.current_period_start, ps.current_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate overage for a subscription
CREATE OR REPLACE FUNCTION calculate_overage(p_subscription_id UUID)
RETURNS TABLE (
  overage_automation INTEGER,
  overage_ai INTEGER,
  overage_api INTEGER,
  overage_cost_cents INTEGER
) AS $$
DECLARE
  v_sub RECORD;
  v_usage RECORD;
  v_rates RECORD;
BEGIN
  -- Get subscription details
  SELECT * INTO v_sub FROM paddle_subscriptions WHERE id = p_subscription_id;
  
  -- Get current usage
  SELECT 
    COALESCE(SUM(automation_runs), 0) as automation_runs,
    COALESCE(SUM(ai_actions), 0) as ai_actions,
    COALESCE(SUM(api_calls), 0) as api_calls
  INTO v_usage
  FROM usage_hourly
  WHERE agency_id = v_sub.agency_id
    AND hour_timestamp >= v_sub.current_period_start
    AND hour_timestamp < v_sub.current_period_end;
  
  -- Get overage rates from product
  SELECT 
    overage_rate_automation,
    overage_rate_ai,
    overage_rate_api
  INTO v_rates
  FROM paddle_products
  WHERE plan_type = v_sub.plan_type
    AND billing_cycle = v_sub.billing_cycle;
  
  -- Calculate overages
  overage_automation := GREATEST(0, v_usage.automation_runs - v_sub.included_automation_runs);
  overage_ai := GREATEST(0, v_usage.ai_actions - v_sub.included_ai_actions);
  overage_api := GREATEST(0, v_usage.api_calls - v_sub.included_api_calls);
  
  -- Calculate cost (convert to cents)
  overage_cost_cents := (
    (overage_automation * v_rates.overage_rate_automation) +
    (overage_ai * v_rates.overage_rate_ai) +
    (overage_api * v_rates.overage_rate_api)
  ) * 100;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA: Products
-- ============================================================================

INSERT INTO paddle_products (slug, name, plan_type, billing_cycle, price_cents, included_automation_runs, included_ai_actions, included_api_calls, max_modules, max_sites, max_team_members, overage_rate_automation, overage_rate_ai, overage_rate_api, features, display_order) VALUES

('starter_monthly', 'Starter Monthly', 'starter', 'monthly', 2900,
  1000, 500, 10000, 3, 1, 3,
  0.001, 0.005, 0.0001,
  '["3 modules", "1 site", "3 team members", "Basic support", "1,000 automation runs/mo", "500 AI actions/mo"]',
  1),

('starter_yearly', 'Starter Yearly', 'starter', 'yearly', 29000,
  12000, 6000, 120000, 3, 1, 3,
  0.001, 0.005, 0.0001,
  '["3 modules", "1 site", "3 team members", "Basic support", "12,000 automation runs/yr", "6,000 AI actions/yr", "Save 17%"]',
  2),

('pro_monthly', 'Pro Monthly', 'pro', 'monthly', 9900,
  10000, 5000, 100000, 10, 5, 10,
  0.0005, 0.0025, 0.00005,
  '["10 modules", "5 sites", "10 team members", "Priority support", "Custom domain", "White-label", "10,000 automation runs/mo", "5,000 AI actions/mo", "50% overage discount"]',
  3),

('pro_yearly', 'Pro Yearly', 'pro', 'yearly', 99000,
  120000, 60000, 1200000, 10, 5, 10,
  0.0005, 0.0025, 0.00005,
  '["10 modules", "5 sites", "10 team members", "Priority support", "Custom domain", "White-label", "120,000 automation runs/yr", "60,000 AI actions/yr", "50% overage discount", "Save 17%"]',
  4),

('ai_agent_pack', 'AI Agent Pack', 'addon', 'monthly', 4900,
  0, 5000, 0, NULL, NULL, NULL,
  NULL, 0.003, NULL,
  '["5,000 extra AI actions/mo", "Priority AI queue", "Advanced AI models"]',
  10),

('white_label_complete', 'White-label Complete', 'addon', 'monthly', 9900,
  0, 0, 0, NULL, NULL, NULL,
  NULL, NULL, NULL,
  '["Custom branding", "Remove DRAMAC branding", "Custom email domain", "Custom login page"]',
  11)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features;
```

---

## Paddle Integration Setup

### Environment Configuration

```bash
# .env.local

# Paddle API
PADDLE_API_KEY=pdl_live_xxx                    # or pdl_sandbox_xxx for testing
PADDLE_WEBHOOK_SECRET=pdl_whk_xxx
PADDLE_ENVIRONMENT=production                   # or sandbox

# Paddle Product IDs (created in Paddle dashboard)
PADDLE_PRODUCT_STARTER=pro_xxx
PADDLE_PRICE_STARTER_MONTHLY=pri_xxx
PADDLE_PRICE_STARTER_YEARLY=pri_xxx
PADDLE_PRODUCT_PRO=pro_xxx
PADDLE_PRICE_PRO_MONTHLY=pri_xxx
PADDLE_PRICE_PRO_YEARLY=pri_xxx

# Usage metering (if using Paddle metering)
PADDLE_PRICE_AUTOMATION_OVERAGE=pri_xxx
PADDLE_PRICE_AI_OVERAGE=pri_xxx
PADDLE_PRICE_API_OVERAGE=pri_xxx
```

### Paddle Client Setup

```typescript
// src/lib/paddle/client.ts

import Paddle from '@paddle/paddle-node-sdk';

// Validate environment
if (!process.env.PADDLE_API_KEY) {
  throw new Error('PADDLE_API_KEY is required');
}

// Create Paddle client
export const paddle = new Paddle(process.env.PADDLE_API_KEY, {
  environment: process.env.PADDLE_ENVIRONMENT === 'sandbox' 
    ? Paddle.Environment.sandbox 
    : Paddle.Environment.production
});

// Environment check
export const isPaddleSandbox = process.env.PADDLE_ENVIRONMENT === 'sandbox';

// Product/Price IDs
export const PADDLE_IDS = {
  products: {
    starter: process.env.PADDLE_PRODUCT_STARTER!,
    pro: process.env.PADDLE_PRODUCT_PRO!,
  },
  prices: {
    starter_monthly: process.env.PADDLE_PRICE_STARTER_MONTHLY!,
    starter_yearly: process.env.PADDLE_PRICE_STARTER_YEARLY!,
    pro_monthly: process.env.PADDLE_PRICE_PRO_MONTHLY!,
    pro_yearly: process.env.PADDLE_PRICE_PRO_YEARLY!,
    automation_overage: process.env.PADDLE_PRICE_AUTOMATION_OVERAGE!,
    ai_overage: process.env.PADDLE_PRICE_AI_OVERAGE!,
    api_overage: process.env.PADDLE_PRICE_API_OVERAGE!,
  }
} as const;
```

### Frontend Paddle.js Integration

```typescript
// src/lib/paddle/paddle-client.ts

'use client';

import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | null = null;

export async function getPaddle(): Promise<Paddle> {
  if (paddleInstance) return paddleInstance;
  
  paddleInstance = await initializePaddle({
    environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'sandbox' 
      ? 'sandbox' 
      : 'production',
    token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    checkout: {
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en',
        allowLogout: true,
        showAddDiscounts: true,
        showAddTaxId: true,
      }
    }
  });
  
  return paddleInstance!;
}

// Open checkout for subscription
export async function openCheckout({
  priceId,
  customerId,
  agencyId,
  email,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerId?: string;
  agencyId: string;
  email: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<void> {
  const paddle = await getPaddle();
  
  await paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: customerId ? { id: customerId } : { email },
    customData: {
      agency_id: agencyId,
    },
    settings: {
      successUrl: successUrl || `${window.location.origin}/dashboard/billing?success=true`,
      // Note: Paddle doesn't support cancelUrl in the same way
    }
  });
}

// Update payment method
export async function updatePaymentMethod(subscriptionId: string): Promise<void> {
  const paddle = await getPaddle();
  
  await paddle.Checkout.open({
    transactionId: subscriptionId,
    settings: {
      displayMode: 'overlay'
    }
  });
}
```

---

## Subscription Management

### Subscription Service

```typescript
// src/lib/paddle/subscription-service.ts

import { paddle, PADDLE_IDS } from './client';
import { createClient } from '@/lib/supabase/server';

export interface CreateSubscriptionParams {
  agencyId: string;
  email: string;
  planType: 'starter' | 'pro';
  billingCycle: 'monthly' | 'yearly';
  customData?: Record<string, unknown>;
}

export interface SubscriptionDetails {
  id: string;
  paddleSubscriptionId: string;
  planType: string;
  billingCycle: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  unitPrice: number;
  currency: string;
  includedUsage: {
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  };
}

export class SubscriptionService {
  /**
   * Get subscription for an agency
   */
  async getSubscription(agencyId: string): Promise<SubscriptionDetails | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('paddle_subscriptions')
      .select('*')
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing', 'past_due'])
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      paddleSubscriptionId: data.paddle_subscription_id,
      planType: data.plan_type,
      billingCycle: data.billing_cycle,
      status: data.status,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      cancelAtPeriodEnd: data.cancel_at_period_end,
      unitPrice: data.unit_price,
      currency: data.currency,
      includedUsage: {
        automationRuns: data.included_automation_runs,
        aiActions: data.included_ai_actions,
        apiCalls: data.included_api_calls
      }
    };
  }

  /**
   * Get or create Paddle customer
   */
  async getOrCreateCustomer(
    agencyId: string,
    email: string,
    name?: string
  ): Promise<string> {
    const supabase = await createClient();
    
    // Check for existing customer
    const { data: existing } = await supabase
      .from('paddle_customers')
      .select('paddle_customer_id')
      .eq('agency_id', agencyId)
      .single();
    
    if (existing) {
      return existing.paddle_customer_id;
    }
    
    // Create new customer in Paddle
    const customer = await paddle.customers.create({
      email,
      name: name || undefined,
    });
    
    // Save to database
    await supabase
      .from('paddle_customers')
      .insert({
        agency_id: agencyId,
        paddle_customer_id: customer.id,
        email,
        name
      });
    
    return customer.id;
  }

  /**
   * Create checkout session URL
   */
  async createCheckoutSession(params: CreateSubscriptionParams): Promise<{
    checkoutUrl?: string;
    clientToken?: string;
  }> {
    // Get price ID
    const priceKey = `${params.planType}_${params.billingCycle}` as keyof typeof PADDLE_IDS.prices;
    const priceId = PADDLE_IDS.prices[priceKey];
    
    if (!priceId) {
      throw new Error(`Invalid plan: ${params.planType} ${params.billingCycle}`);
    }
    
    // Get or create customer
    const customerId = await this.getOrCreateCustomer(
      params.agencyId,
      params.email
    );
    
    // For Paddle.js, return the data needed to open checkout
    return {
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    agencyId: string,
    immediately: boolean = false
  ): Promise<void> {
    const supabase = await createClient();
    
    // Get subscription
    const { data: sub } = await supabase
      .from('paddle_subscriptions')
      .select('paddle_subscription_id')
      .eq('agency_id', agencyId)
      .single();
    
    if (!sub) {
      throw new Error('No active subscription found');
    }
    
    if (immediately) {
      // Cancel immediately
      await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
        effectiveFrom: 'immediately'
      });
    } else {
      // Cancel at end of billing period
      await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
        effectiveFrom: 'next_billing_period'
      });
    }
    
    // Update local record (webhook will also do this)
    await supabase
      .from('paddle_subscriptions')
      .update({
        cancel_at_period_end: !immediately,
        status: immediately ? 'canceled' : 'active',
        canceled_at: immediately ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('agency_id', agencyId);
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(agencyId: string): Promise<void> {
    const supabase = await createClient();
    
    const { data: sub } = await supabase
      .from('paddle_subscriptions')
      .select('paddle_subscription_id')
      .eq('agency_id', agencyId)
      .single();
    
    if (!sub) {
      throw new Error('No active subscription found');
    }
    
    await paddle.subscriptions.pause(sub.paddle_subscription_id, {
      effectiveFrom: 'next_billing_period'
    });
  }

  /**
   * Resume paused subscription
   */
  async resumeSubscription(agencyId: string): Promise<void> {
    const supabase = await createClient();
    
    const { data: sub } = await supabase
      .from('paddle_subscriptions')
      .select('paddle_subscription_id')
      .eq('agency_id', agencyId)
      .single();
    
    if (!sub) {
      throw new Error('No subscription found');
    }
    
    await paddle.subscriptions.resume(sub.paddle_subscription_id, {
      effectiveFrom: 'immediately'
    });
  }

  /**
   * Change subscription plan
   */
  async changePlan(
    agencyId: string,
    newPlanType: 'starter' | 'pro',
    newBillingCycle: 'monthly' | 'yearly',
    prorate: boolean = true
  ): Promise<void> {
    const supabase = await createClient();
    
    const { data: sub } = await supabase
      .from('paddle_subscriptions')
      .select('paddle_subscription_id')
      .eq('agency_id', agencyId)
      .single();
    
    if (!sub) {
      throw new Error('No subscription found');
    }
    
    const priceKey = `${newPlanType}_${newBillingCycle}` as keyof typeof PADDLE_IDS.prices;
    const newPriceId = PADDLE_IDS.prices[priceKey];
    
    await paddle.subscriptions.update(sub.paddle_subscription_id, {
      items: [{ priceId: newPriceId, quantity: 1 }],
      prorationBillingMode: prorate ? 'prorated_immediately' : 'full_next_billing_period'
    });
  }

  /**
   * Get invoices for an agency
   */
  async getInvoices(agencyId: string, limit: number = 10): Promise<any[]> {
    const supabase = await createClient();
    
    const { data } = await supabase
      .from('paddle_transactions')
      .select('*')
      .eq('agency_id', agencyId)
      .in('status', ['completed', 'paid', 'billed'])
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return data || [];
  }
}

export const subscriptionService = new SubscriptionService();
```

---

## Usage-Based Billing

### Usage Tracker

```typescript
// src/lib/paddle/usage-tracker.ts

import { createClient } from '@/lib/supabase/server';
import { paddle, PADDLE_IDS } from './client';

export type UsageType = 'automation_runs' | 'ai_actions' | 'api_calls';

export interface UsageReport {
  automationRuns: number;
  aiActions: number;
  apiCalls: number;
  includedAutomationRuns: number;
  includedAiActions: number;
  includedApiCalls: number;
  overageAutomationRuns: number;
  overageAiActions: number;
  overageApiCalls: number;
  overageCostCents: number;
  periodStart: Date;
  periodEnd: Date;
  percentUsed: {
    automationRuns: number;
    aiActions: number;
    apiCalls: number;
  };
}

export class UsageTracker {
  /**
   * Record usage (called after each action)
   */
  async recordUsage(
    agencyId: string,
    siteId: string,
    type: UsageType,
    count: number = 1
  ): Promise<void> {
    const supabase = await createClient();
    
    // Use database function for atomic increment
    await supabase.rpc('increment_usage', {
      p_agency_id: agencyId,
      p_site_id: siteId,
      [`p_${type}`]: count
    });
  }

  /**
   * Get current period usage
   */
  async getCurrentUsage(agencyId: string): Promise<UsageReport> {
    const supabase = await createClient();
    
    // Get subscription with included limits
    const { data: sub } = await supabase
      .from('paddle_subscriptions')
      .select('*')
      .eq('agency_id', agencyId)
      .in('status', ['active', 'trialing', 'past_due'])
      .single();
    
    if (!sub) {
      throw new Error('No active subscription');
    }
    
    // Get usage for current period
    const { data: usage } = await supabase.rpc('get_current_period_usage', {
      p_agency_id: agencyId
    });
    
    const currentUsage = usage?.[0] || {
      automation_runs: 0,
      ai_actions: 0,
      api_calls: 0
    };
    
    // Calculate overages
    const overageAutomation = Math.max(0, 
      currentUsage.automation_runs - sub.included_automation_runs);
    const overageAi = Math.max(0,
      currentUsage.ai_actions - sub.included_ai_actions);
    const overageApi = Math.max(0,
      currentUsage.api_calls - sub.included_api_calls);
    
    // Get overage rates
    const { data: product } = await supabase
      .from('paddle_products')
      .select('overage_rate_automation, overage_rate_ai, overage_rate_api')
      .eq('plan_type', sub.plan_type)
      .eq('billing_cycle', sub.billing_cycle)
      .single();
    
    const overageCost = product ? (
      (overageAutomation * (product.overage_rate_automation || 0)) +
      (overageAi * (product.overage_rate_ai || 0)) +
      (overageApi * (product.overage_rate_api || 0))
    ) * 100 : 0; // Convert to cents
    
    return {
      automationRuns: currentUsage.automation_runs,
      aiActions: currentUsage.ai_actions,
      apiCalls: currentUsage.api_calls,
      includedAutomationRuns: sub.included_automation_runs,
      includedAiActions: sub.included_ai_actions,
      includedApiCalls: sub.included_api_calls,
      overageAutomationRuns: overageAutomation,
      overageAiActions: overageAi,
      overageApiCalls: overageApi,
      overageCostCents: Math.round(overageCost),
      periodStart: new Date(sub.current_period_start),
      periodEnd: new Date(sub.current_period_end),
      percentUsed: {
        automationRuns: (currentUsage.automation_runs / sub.included_automation_runs) * 100,
        aiActions: (currentUsage.ai_actions / sub.included_ai_actions) * 100,
        apiCalls: (currentUsage.api_calls / sub.included_api_calls) * 100
      }
    };
  }

  /**
   * Check if usage limit reached (for enforcement)
   */
  async checkUsageLimit(
    agencyId: string,
    type: UsageType,
    requestedCount: number = 1
  ): Promise<{
    allowed: boolean;
    remaining: number;
    isOverage: boolean;
  }> {
    const usage = await this.getCurrentUsage(agencyId);
    
    const current = usage[type.replace('_runs', 'Runs').replace('_actions', 'Actions').replace('_calls', 'Calls') as keyof UsageReport] as number;
    const included = usage[`included${type.charAt(0).toUpperCase() + type.slice(1).replace('_runs', 'Runs').replace('_actions', 'Actions').replace('_calls', 'Calls')}` as keyof UsageReport] as number;
    
    const remaining = included - current;
    const isOverage = remaining <= 0;
    
    // For now, allow overage (will be billed)
    // Enterprise could have hard limits
    return {
      allowed: true, // Change to false to enforce hard limits
      remaining: Math.max(0, remaining),
      isOverage
    };
  }

  /**
   * Report usage to Paddle (for metered billing)
   * Called at end of billing period or on demand
   */
  async reportUsageToPaddle(agencyId: string): Promise<void> {
    const supabase = await createClient();
    
    // Get subscription
    const { data: sub } = await supabase
      .from('paddle_subscriptions')
      .select('*')
      .eq('agency_id', agencyId)
      .single();
    
    if (!sub) return;
    
    // Get usage report
    const usage = await this.getCurrentUsage(agencyId);
    
    // Only report if there's overage
    if (usage.overageAutomationRuns <= 0 && 
        usage.overageAiActions <= 0 && 
        usage.overageApiCalls <= 0) {
      return;
    }
    
    // Report to Paddle using transactions API
    // This creates a one-time charge for overage
    const items = [];
    
    if (usage.overageAutomationRuns > 0) {
      items.push({
        priceId: PADDLE_IDS.prices.automation_overage,
        quantity: usage.overageAutomationRuns
      });
    }
    
    if (usage.overageAiActions > 0) {
      items.push({
        priceId: PADDLE_IDS.prices.ai_overage,
        quantity: usage.overageAiActions
      });
    }
    
    if (usage.overageApiCalls > 0) {
      items.push({
        priceId: PADDLE_IDS.prices.api_overage,
        quantity: usage.overageApiCalls
      });
    }
    
    if (items.length > 0) {
      // Create transaction for overage
      const { data: customer } = await supabase
        .from('paddle_customers')
        .select('paddle_customer_id')
        .eq('agency_id', agencyId)
        .single();
      
      if (customer) {
        await paddle.transactions.create({
          customerId: customer.paddle_customer_id,
          items,
          collectionMode: 'automatic',
        });
      }
    }
    
    // Record that we reported this period
    await supabase
      .from('usage_billing_period')
      .upsert({
        agency_id: agencyId,
        subscription_id: sub.id,
        period_start: sub.current_period_start,
        period_end: sub.current_period_end,
        automation_runs: usage.automationRuns,
        ai_actions: usage.aiActions,
        api_calls: usage.apiCalls,
        included_automation_runs: usage.includedAutomationRuns,
        included_ai_actions: usage.includedAiActions,
        included_api_calls: usage.includedApiCalls,
        overage_automation_runs: usage.overageAutomationRuns,
        overage_ai_actions: usage.overageAiActions,
        overage_api_calls: usage.overageApiCalls,
        overage_cost: usage.overageCostCents,
        reported_to_paddle: true,
        reported_at: new Date().toISOString()
      }, {
        onConflict: 'subscription_id,period_start'
      });
  }
}

export const usageTracker = new UsageTracker();
```

---

## Webhook Handlers

### Webhook Route

```typescript
// src/app/api/webhooks/paddle/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { paddle } from '@/lib/paddle/client';
import { createServiceClient } from '@/lib/supabase/service';
import { handlePaddleEvent } from '@/lib/paddle/webhook-handlers';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('paddle-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }
    
    // Verify webhook signature
    let event;
    try {
      event = paddle.webhooks.unmarshal(
        rawBody,
        process.env.PADDLE_WEBHOOK_SECRET!,
        signature
      );
    } catch (e) {
      console.error('[Paddle Webhook] Invalid signature:', e);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Log webhook
    const supabase = createServiceClient();
    await supabase
      .from('paddle_webhooks')
      .insert({
        paddle_event_id: event.eventId,
        event_type: event.eventType,
        payload: event.data,
        occurred_at: event.occurredAt
      });
    
    // Process event
    try {
      await handlePaddleEvent(event);
      
      // Mark as processed
      await supabase
        .from('paddle_webhooks')
        .update({
          processed: true,
          processed_at: new Date().toISOString()
        })
        .eq('paddle_event_id', event.eventId);
        
    } catch (error) {
      console.error('[Paddle Webhook] Processing error:', error);
      
      await supabase
        .from('paddle_webhooks')
        .update({
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('paddle_event_id', event.eventId);
      
      // Still return 200 to acknowledge receipt
      // We'll retry from our logs if needed
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('[Paddle Webhook] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
```

### Webhook Event Handlers

```typescript
// src/lib/paddle/webhook-handlers.ts

import { createServiceClient } from '@/lib/supabase/service';
import type { 
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
  SubscriptionCanceledEvent,
  TransactionCompletedEvent,
  CustomerCreatedEvent
} from '@paddle/paddle-node-sdk';

export async function handlePaddleEvent(event: any): Promise<void> {
  switch (event.eventType) {
    case 'subscription.created':
      await handleSubscriptionCreated(event);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(event);
      break;
    case 'subscription.canceled':
      await handleSubscriptionCanceled(event);
      break;
    case 'subscription.paused':
      await handleSubscriptionPaused(event);
      break;
    case 'subscription.resumed':
      await handleSubscriptionResumed(event);
      break;
    case 'transaction.completed':
      await handleTransactionCompleted(event);
      break;
    case 'transaction.payment_failed':
      await handlePaymentFailed(event);
      break;
    case 'customer.created':
      await handleCustomerCreated(event);
      break;
    case 'customer.updated':
      await handleCustomerUpdated(event);
      break;
    default:
      console.log(`[Paddle] Unhandled event type: ${event.eventType}`);
  }
}

async function handleSubscriptionCreated(event: SubscriptionCreatedEvent): Promise<void> {
  const supabase = createServiceClient();
  const data = event.data;
  
  // Get agency ID from custom data
  const agencyId = data.customData?.agency_id;
  if (!agencyId) {
    console.error('[Paddle] No agency_id in subscription custom data');
    return;
  }
  
  // Determine plan type from price
  const planType = determinePlanType(data.items[0]?.price?.id);
  const billingCycle = data.billingCycle?.interval === 'year' ? 'yearly' : 'monthly';
  
  // Get included usage from our products table
  const { data: product } = await supabase
    .from('paddle_products')
    .select('*')
    .eq('plan_type', planType)
    .eq('billing_cycle', billingCycle)
    .single();
  
  // Create subscription record
  await supabase
    .from('paddle_subscriptions')
    .insert({
      agency_id: agencyId,
      customer_id: await getCustomerIdByPaddleId(data.customerId),
      paddle_subscription_id: data.id,
      paddle_product_id: data.items[0]?.product?.id,
      paddle_price_id: data.items[0]?.price?.id,
      plan_type: planType,
      billing_cycle: billingCycle,
      status: data.status,
      current_period_start: data.currentBillingPeriod?.startsAt,
      current_period_end: data.currentBillingPeriod?.endsAt,
      trial_end: data.scheduledChange?.effectiveAt,
      unit_price: data.items[0]?.price?.unitPrice?.amount,
      currency: data.currencyCode,
      included_automation_runs: product?.included_automation_runs || 0,
      included_ai_actions: product?.included_ai_actions || 0,
      included_api_calls: product?.included_api_calls || 0,
    });
  
  // Update agency with subscription status
  await supabase
    .from('agencies')
    .update({
      subscription_status: 'active',
      subscription_plan: planType,
      updated_at: new Date().toISOString()
    })
    .eq('id', agencyId);
  
  // Send welcome email
  await sendSubscriptionWelcomeEmail(agencyId, planType);
}

async function handleSubscriptionUpdated(event: SubscriptionUpdatedEvent): Promise<void> {
  const supabase = createServiceClient();
  const data = event.data;
  
  // Update subscription
  await supabase
    .from('paddle_subscriptions')
    .update({
      status: data.status,
      current_period_start: data.currentBillingPeriod?.startsAt,
      current_period_end: data.currentBillingPeriod?.endsAt,
      cancel_at_period_end: data.scheduledChange?.action === 'cancel',
      updated_at: new Date().toISOString()
    })
    .eq('paddle_subscription_id', data.id);
}

async function handleSubscriptionCanceled(event: SubscriptionCanceledEvent): Promise<void> {
  const supabase = createServiceClient();
  const data = event.data;
  
  // Update subscription
  const { data: sub } = await supabase
    .from('paddle_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('paddle_subscription_id', data.id)
    .select('agency_id')
    .single();
  
  if (sub) {
    // Update agency
    await supabase
      .from('agencies')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', sub.agency_id);
    
    // Send cancellation email
    await sendCancellationEmail(sub.agency_id);
  }
}

async function handleSubscriptionPaused(event: any): Promise<void> {
  const supabase = createServiceClient();
  const data = event.data;
  
  await supabase
    .from('paddle_subscriptions')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('paddle_subscription_id', data.id);
}

async function handleSubscriptionResumed(event: any): Promise<void> {
  const supabase = createServiceClient();
  const data = event.data;
  
  await supabase
    .from('paddle_subscriptions')
    .update({
      status: 'active',
      paused_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('paddle_subscription_id', data.id);
}

async function handleTransactionCompleted(event: TransactionCompletedEvent): Promise<void> {
  const supabase = createServiceClient();
  const data = event.data;
  
  // Get agency from subscription
  const { data: sub } = await supabase
    .from('paddle_subscriptions')
    .select('agency_id, id')
    .eq('paddle_subscription_id', data.subscriptionId)
    .single();
  
  if (!sub) {
    console.error('[Paddle] No subscription found for transaction');
    return;
  }
  
  // Create transaction record
  await supabase
    .from('paddle_transactions')
    .insert({
      agency_id: sub.agency_id,
      subscription_id: sub.id,
      paddle_transaction_id: data.id,
      paddle_invoice_id: data.invoiceId,
      paddle_invoice_number: data.invoiceNumber,
      origin: data.origin,
      status: data.status,
      subtotal: data.details?.totals?.subtotal,
      tax: data.details?.totals?.tax,
      total: data.details?.totals?.total,
      currency: data.currencyCode,
      line_items: data.items,
      billing_period_start: data.billingPeriod?.startsAt,
      billing_period_end: data.billingPeriod?.endsAt,
      invoice_url: data.checkout?.url,
      billed_at: data.billedAt,
      completed_at: new Date().toISOString()
    });
  
  // Reset usage tracking for new period
  if (data.origin === 'subscription_recurring') {
    await resetUsageForNewPeriod(sub.agency_id, sub.id);
  }
}

async function handlePaymentFailed(event: any): Promise<void> {
  const supabase = createServiceClient();
  const data = event.data;
  
  // Update subscription status
  await supabase
    .from('paddle_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('paddle_subscription_id', data.subscriptionId);
  
  // Get agency for notification
  const { data: sub } = await supabase
    .from('paddle_subscriptions')
    .select('agency_id')
    .eq('paddle_subscription_id', data.subscriptionId)
    .single();
  
  if (sub) {
    // Send payment failed email
    await sendPaymentFailedEmail(sub.agency_id);
  }
}

async function handleCustomerCreated(event: CustomerCreatedEvent): Promise<void> {
  // Customer creation is handled during checkout
  // This is a backup handler
  console.log('[Paddle] Customer created:', event.data.id);
}

async function handleCustomerUpdated(event: any): Promise<void> {
  const supabase = createServiceClient();
  const data = event.data;
  
  await supabase
    .from('paddle_customers')
    .update({
      email: data.email,
      name: data.name,
      address_country: data.address?.countryCode,
      address_postal_code: data.address?.postalCode,
      updated_at: new Date().toISOString()
    })
    .eq('paddle_customer_id', data.id);
}

// Helper functions
function determinePlanType(priceId: string): string {
  if (priceId.includes('starter')) return 'starter';
  if (priceId.includes('pro')) return 'pro';
  return 'starter';
}

async function getCustomerIdByPaddleId(paddleCustomerId: string): Promise<string> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('paddle_customers')
    .select('id')
    .eq('paddle_customer_id', paddleCustomerId)
    .single();
  return data?.id;
}

async function resetUsageForNewPeriod(agencyId: string, subscriptionId: string): Promise<void> {
  // Archive current period usage and reset
  // This is handled by the billing period table
  console.log(`[Paddle] New billing period for agency ${agencyId}`);
}

// Email functions (implement with your email service)
async function sendSubscriptionWelcomeEmail(agencyId: string, planType: string): Promise<void> {
  console.log(`[Email] Welcome email for agency ${agencyId}, plan ${planType}`);
  // Implement with Resend or your email service
}

async function sendCancellationEmail(agencyId: string): Promise<void> {
  console.log(`[Email] Cancellation email for agency ${agencyId}`);
}

async function sendPaymentFailedEmail(agencyId: string): Promise<void> {
  console.log(`[Email] Payment failed email for agency ${agencyId}`);
}
```

---

## Migration from LemonSqueezy

### ⚠️ CRITICAL: Database Cleanup Required

**The existing codebase has MULTIPLE conflicting billing tables that MUST be cleaned up:**

| Existing Table | Source File | Issue |
|----------------|-------------|-------|
| `billing_customers` | billing.sql | Has `stripe_customer_id` column |
| `billing_subscriptions` | billing.sql | Has `stripe_subscription_id` column |
| `billing_invoices` | billing.sql | Has `stripe_invoice_id` column |
| `billing_usage` | billing.sql | Has `stripe_subscription_item_id` column |
| `subscriptions` | billing-lemonsqueezy.sql | Has `lemonsqueezy_*` columns |
| `invoices` | billing-lemonsqueezy.sql | Has `lemonsqueezy_order_id` column |

**After EM-59 migration is complete and verified, run this cleanup migration:**

```sql
-- migrations/em-59-cleanup-old-billing.sql
-- ============================================================================
-- CLEANUP: Remove Old Billing Tables After Paddle Migration
-- RUN ONLY AFTER: All data migrated to paddle_* tables and verified
-- ============================================================================

-- Step 1: Backup data first (if needed)
-- CREATE TABLE billing_customers_backup AS SELECT * FROM billing_customers;
-- CREATE TABLE billing_subscriptions_backup AS SELECT * FROM billing_subscriptions;
-- CREATE TABLE subscriptions_backup AS SELECT * FROM subscriptions;

-- Step 2: Drop old Stripe billing tables
DROP TABLE IF EXISTS billing_usage CASCADE;
DROP TABLE IF EXISTS billing_invoices CASCADE;
DROP TABLE IF EXISTS billing_subscriptions CASCADE;
DROP TABLE IF EXISTS billing_customers CASCADE;

-- Step 3: Drop old LemonSqueezy tables
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Step 4: Clean up any remaining stripe/lemonsqueezy columns
-- (These may exist in other tables - check and clean)
-- ALTER TABLE modules_v2 DROP COLUMN IF EXISTS lemon_product_id;
-- ALTER TABLE modules_v2 DROP COLUMN IF EXISTS lemon_variant_monthly_id;
-- ALTER TABLE modules_v2 DROP COLUMN IF EXISTS lemon_variant_yearly_id;

-- Step 5: Verify cleanup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_customers') THEN
    RAISE EXCEPTION 'billing_customers table still exists!';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    RAISE EXCEPTION 'subscriptions table still exists!';
  END IF;
  RAISE NOTICE 'Old billing tables successfully cleaned up';
END $$;
```

### TypeScript Types Update Required

**The following TypeScript files must be updated when implementing EM-59:**

1. **Delete or Deprecate:**
   - `src/types/billing.ts` - Contains Stripe types (DELETE after migration)
   - `src/types/payments.ts` - Contains LemonSqueezy types (DELETE after migration)

2. **Create New:**
   - `src/types/paddle.ts` - New Paddle types (provided below)

3. **Regenerate:**
   - `src/types/supabase.ts` - Run `npx supabase gen types typescript` after migration

**New Paddle Types File:**

```typescript
// src/types/paddle.ts
// DRAMAC CMS - Paddle Billing Types
// Created as part of EM-59 migration

export type PaddleSubscriptionStatus = 
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'canceled';

export type BillingCycle = 'monthly' | 'yearly';
export type PlanType = 'starter' | 'pro' | 'enterprise' | 'addon';

export interface PaddleCustomer {
  id: string;
  agency_id: string;
  paddle_customer_id: string;
  email: string;
  name: string | null;
  address_country: string | null;
  address_postal_code: string | null;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaddleSubscription {
  id: string;
  agency_id: string;
  customer_id: string;
  paddle_subscription_id: string;
  paddle_product_id: string;
  paddle_price_id: string;
  plan_type: PlanType;
  billing_cycle: BillingCycle;
  status: PaddleSubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
  paused_at: string | null;
  cancel_at_period_end: boolean;
  cancellation_reason: string | null;
  unit_price: number;
  currency: string;
  included_automation_runs: number;
  included_ai_actions: number;
  included_api_calls: number;
  discount_id: string | null;
  discount_percentage: number | null;
  discount_ends_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaddleTransaction {
  id: string;
  agency_id: string;
  subscription_id: string | null;
  paddle_transaction_id: string;
  paddle_invoice_id: string | null;
  paddle_invoice_number: string | null;
  origin: 'subscription_recurring' | 'subscription_charge' | 'web' | 'api';
  status: 'draft' | 'ready' | 'billed' | 'paid' | 'completed' | 'canceled' | 'past_due';
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  invoice_url: string | null;
  receipt_url: string | null;
  billed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  automation_runs: number;
  ai_actions: number;
  api_calls: number;
  included_automation_runs: number;
  included_ai_actions: number;
  included_api_calls: number;
  overage_automation_runs: number;
  overage_ai_actions: number;
  overage_api_calls: number;
  period_start: string;
  period_end: string;
}

export interface PaddleProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  plan_type: PlanType;
  billing_cycle: BillingCycle | 'one_time';
  price_cents: number;
  currency: string;
  included_automation_runs: number;
  included_ai_actions: number;
  included_api_calls: number;
  max_modules: number | null;
  max_sites: number | null;
  max_team_members: number | null;
  features: string[];
  is_active: boolean;
}

export interface BillingOverview {
  subscription: PaddleSubscription | null;
  customer: PaddleCustomer | null;
  transactions: PaddleTransaction[];
  usage: UsageStats | null;
  products: PaddleProduct[];
}
```

### Code Files That Must Be Updated

**During EM-59 implementation, these files need modification:**

| File | Current State | Required Change |
|------|---------------|-----------------|
| `src/lib/payments/lemonsqueezy.ts` | LemonSqueezy SDK | Replace with `src/lib/paddle/client.ts` |
| `src/lib/actions/billing.ts` | Uses lemonsqueezy functions | Rewrite for Paddle |
| `src/modules/automation/components/connection-setup.tsx` | Has Stripe service | Replace with Paddle |
| `src/modules/automation/components/workflow-builder/action-palette.tsx` | Has integration.stripe | Replace with integration.paddle |
| `src/config/plans.ts` | LemonSqueezy variant IDs | Update for Paddle price IDs |

### Migration Plan

```markdown
## LemonSqueezy → Paddle Migration Plan

### Phase 1: Preparation (Week 1)
- [ ] Set up Paddle account
- [ ] Create products and prices in Paddle
- [ ] Set up Payoneer/Wise for payouts
- [ ] Deploy database migration
- [ ] Deploy new billing code (inactive)
- [ ] Update TypeScript types (create paddle.ts)

### Phase 2: Testing (Week 2)
- [ ] Test checkout flow in Paddle sandbox
- [ ] Test webhook handlers
- [ ] Test usage tracking
- [ ] Test subscription management
- [ ] Test overage billing

### Phase 3: Parallel Running (Week 3)
- [ ] Enable Paddle for new signups
- [ ] Keep LemonSqueezy active for existing
- [ ] Monitor both systems
- [ ] Handle any issues

### Phase 4: Migration (Week 4)
- [ ] Contact existing customers about migration
- [ ] Offer migration incentive (1 month free)
- [ ] Migrate customers one by one
- [ ] Cancel LemonSqueezy subscriptions after migration

### Phase 5: Cleanup (Week 5)
- [ ] Disable LemonSqueezy integration
- [ ] Remove LemonSqueezy code
- [ ] Final reconciliation
- [ ] Documentation update
```

### Migration Script

```typescript
// scripts/migrate-lemonsqueezy-to-paddle.ts

import { createServiceClient } from '@/lib/supabase/service';
import { subscriptionService } from '@/lib/paddle/subscription-service';

async function migrateLemonSqueezyToPaddle() {
  const supabase = createServiceClient();
  
  // Get all active LemonSqueezy subscriptions
  const { data: lsSubscriptions } = await supabase
    .from('billing_subscriptions')
    .select(`
      *,
      agency:agencies(id, name, owner_email)
    `)
    .eq('status', 'active')
    .eq('provider', 'lemonsqueezy');
  
  if (!lsSubscriptions?.length) {
    console.log('No LemonSqueezy subscriptions to migrate');
    return;
  }
  
  console.log(`Found ${lsSubscriptions.length} subscriptions to migrate`);
  
  for (const lsSub of lsSubscriptions) {
    try {
      console.log(`\nMigrating agency: ${lsSub.agency.name}`);
      
      // 1. Create Paddle customer
      const customerId = await subscriptionService.getOrCreateCustomer(
        lsSub.agency.id,
        lsSub.agency.owner_email
      );
      
      // 2. Determine equivalent Paddle plan
      const paddlePlan = mapLemonSqueezyToPaddle(lsSub.variant_id);
      
      // 3. Send migration email with special checkout link
      await sendMigrationEmail({
        agencyId: lsSub.agency.id,
        email: lsSub.agency.owner_email,
        currentPlan: lsSub.plan_name,
        newPlan: paddlePlan,
        customerId
      });
      
      // 4. Mark as pending migration
      await supabase
        .from('billing_subscriptions')
        .update({ 
          metadata: { 
            ...lsSub.metadata, 
            paddle_migration_pending: true,
            paddle_customer_id: customerId 
          }
        })
        .eq('id', lsSub.id);
      
      console.log(`✓ Migration initiated for ${lsSub.agency.name}`);
      
    } catch (error) {
      console.error(`✗ Failed to migrate ${lsSub.agency.name}:`, error);
    }
  }
}

function mapLemonSqueezyToPaddle(variantId: string): { planType: string; billingCycle: string } {
  const mapping: Record<string, { planType: string; billingCycle: string }> = {
    'ls_variant_starter_monthly': { planType: 'starter', billingCycle: 'monthly' },
    'ls_variant_starter_yearly': { planType: 'starter', billingCycle: 'yearly' },
    'ls_variant_pro_monthly': { planType: 'pro', billingCycle: 'monthly' },
    'ls_variant_pro_yearly': { planType: 'pro', billingCycle: 'yearly' },
  };
  
  return mapping[variantId] || { planType: 'starter', billingCycle: 'monthly' };
}

// Run migration
migrateLemonSqueezyToPaddle();
```

---

## Next: Part B (PHASE-EM-59B-PADDLE-BILLING.md)

Part B will cover:
- Billing UI Components
- Customer Portal
- Admin Dashboard
- Reporting & Analytics
- Dunning Management
- Enterprise Features
- Testing Guide
- Deployment Checklist

---

## 🔔 Automation Event Integration (CRITICAL)

### Events This Module MUST Emit

Billing events must be emitted to enable automation workflows (e.g., "When subscription is canceled, send retention email"):

```typescript
// Required import in all billing action files
import { logAutomationEvent } from '@/modules/automation/services/event-processor'
```

### Events to Emit

| Event | Trigger | Payload |
|-------|---------|---------|
| `billing.subscription.created` | New subscription started | `{ subscription_id, agency_id, plan_type, billing_cycle }` |
| `billing.subscription.upgraded` | Plan upgrade | `{ subscription_id, old_plan, new_plan }` |
| `billing.subscription.downgraded` | Plan downgrade | `{ subscription_id, old_plan, new_plan }` |
| `billing.subscription.canceled` | Subscription canceled | `{ subscription_id, agency_id, reason }` |
| `billing.subscription.renewed` | Subscription renewed | `{ subscription_id, amount, next_period_end }` |
| `billing.payment.succeeded` | Payment successful | `{ transaction_id, amount, currency }` |
| `billing.payment.failed` | Payment failed | `{ transaction_id, agency_id, error_code, retry_count }` |
| `billing.trial.started` | Trial begun | `{ subscription_id, trial_end }` |
| `billing.trial.ending` | Trial ending soon (3 days) | `{ subscription_id, days_remaining }` |
| `billing.usage.threshold` | Usage hit threshold (80%) | `{ agency_id, usage_type, percentage }` |
| `billing.usage.exceeded` | Usage exceeded included | `{ agency_id, usage_type, overage_amount }` |

### Integration Code Example

```typescript
// In webhook handler after subscription.created
await logAutomationEvent(siteId, 'billing.subscription.created', {
  subscription_id: subscription.paddle_subscription_id,
  agency_id: subscription.agency_id,
  plan_type: subscription.plan_type,
  billing_cycle: subscription.billing_cycle,
  amount: subscription.unit_price,
})

// After payment fails
await logAutomationEvent(siteId, 'billing.payment.failed', {
  transaction_id: transaction.paddle_transaction_id,
  agency_id: transaction.agency_id,
  error_code: transaction.error_code,
  retry_count: transaction.retry_count,
})
```

### EVENT_REGISTRY Addition

Add to `src/modules/automation/lib/event-types.ts`:

```typescript
'billing': {
  'subscription.created': {
    id: 'billing.subscription.created',
    category: 'Billing',
    name: 'Subscription Created',
    description: 'Triggered when a new subscription is created',
    trigger_label: 'When subscription is created',
    payload_schema: { subscription_id: 'string', plan_type: 'string' }
  },
  'subscription.canceled': {
    id: 'billing.subscription.canceled',
    category: 'Billing',
    name: 'Subscription Canceled',
    description: 'Triggered when subscription is canceled',
    trigger_label: 'When subscription is canceled',
    payload_schema: { subscription_id: 'string', reason: 'string' }
  },
  'payment.failed': {
    id: 'billing.payment.failed',
    category: 'Billing',
    name: 'Payment Failed',
    description: 'Triggered when a payment fails',
    trigger_label: 'When payment fails',
    payload_schema: { transaction_id: 'string', error_code: 'string' }
  },
  // ... add all events
}
```

---

## 📊 Current Database Schema Reference

When writing the EM-59 migration, be aware of these existing tables:

**Existing Billing Tables (to be deprecated):**
- `subscriptions` - Old subscription tracking (LemonSqueezy)
- `invoices` - Old invoice table

**Automation Engine (EM-57) - For Event Integration:**
- `automation_events_log` - Where billing events will be logged
- `automation_event_subscriptions` - For triggering workflows on billing events

**RLS Helper Functions (Phase-59) - Use These:**
- `auth.get_current_agency_id()` - Get user's agency
- `auth.is_agency_member(agency_id)` - Check agency membership

---

## Quick Reference

### Files to Update (Hybrid Model)

When implementing the hybrid pricing model, these files need updates:

| File | Change |
|------|--------|
| `src/lib/paddle/subscription-service.ts` | New file - Paddle subscription management |
| `src/lib/paddle/usage-tracker.ts` | New file - Usage tracking for overage |
| `src/lib/paddle/webhook-handlers.ts` | New file - Webhook event processing |
| `src/app/api/webhooks/paddle/route.ts` | New file - Webhook endpoint |
| `src/components/billing/pricing-plans.tsx` | Update plans, add usage display |
| `src/components/billing/subscription-card.tsx` | Update for Paddle |
| `src/components/billing/subscription-banner.tsx` | Update for Paddle |
| `src/lib/actions/billing.ts` | Replace LemonSqueezy with Paddle |
| `src/types/billing.ts` | Update types for Paddle |

### Key APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/billing/checkout` | POST | Create Paddle checkout |
| `/api/billing/subscription` | GET | Get subscription details |
| `/api/billing/subscription/cancel` | POST | Cancel subscription |
| `/api/billing/subscription/pause` | POST | Pause subscription |
| `/api/billing/subscription/resume` | POST | Resume subscription |
| `/api/billing/usage` | GET | Get current usage |
| `/api/billing/invoices` | GET | Get invoice history |
| `/api/webhooks/paddle` | POST | Paddle webhooks |

---

*Document Version: 1.1*  
*Created: 2026-01-24*  
*Updated: 2026-01-26 (Added automation event integration, database schema reference)*  
*Phase Status: Specification Complete*
