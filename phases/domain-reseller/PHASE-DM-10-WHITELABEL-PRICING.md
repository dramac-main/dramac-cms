# Phase DM-10: White-Label & Pricing Configuration

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 8 hours
> **Prerequisites**: DM-01, DM-02, All previous DM phases
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create white-label domain reselling and pricing configuration:
1. Agency pricing configuration (markup, custom prices)
2. Client pricing tiers
3. White-label branding for domain services
4. Paddle billing integration for domains
5. Usage tracking and billing
6. Invoice generation

---

## 📁 Files to Create

```
src/app/(dashboard)/dashboard/settings/domains/
├── page.tsx                    # Domain settings overview
├── pricing/page.tsx            # Pricing configuration
└── branding/page.tsx           # White-label branding

src/components/domains/settings/
├── domain-pricing-config.tsx   # Pricing configuration form
├── tld-pricing-table.tsx       # TLD pricing table
├── markup-calculator.tsx       # Markup preview
├── client-pricing-tiers.tsx    # Client tier management
├── domain-branding-config.tsx  # Branding settings
└── billing-integration.tsx     # Paddle billing setup

src/lib/actions/
└── domain-billing.ts           # Billing server actions

src/lib/paddle/
└── domain-products.ts          # Domain product management
```

---

## 📋 Implementation Tasks

### Task 1: Pricing Configuration Schema (30 mins)

```sql
-- Additional tables for pricing (add to DM-02 migration)

-- Agency domain pricing configuration
CREATE TABLE agency_domain_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Default markup settings
  default_markup_type TEXT NOT NULL DEFAULT 'percentage' CHECK (default_markup_type IN ('percentage', 'fixed', 'custom')),
  default_markup_value DECIMAL(10, 2) NOT NULL DEFAULT 30.00,
  
  -- TLD-specific pricing overrides
  tld_pricing JSONB DEFAULT '{}',
  
  -- Client tier pricing
  client_tiers JSONB DEFAULT '[]',
  
  -- Billing settings
  paddle_product_id TEXT,
  paddle_price_id TEXT,
  billing_enabled BOOLEAN DEFAULT false,
  
  -- White-label settings
  show_wholesale_prices BOOLEAN DEFAULT false,
  custom_terms_url TEXT,
  custom_support_email TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(agency_id)
);

-- Domain billing records
CREATE TABLE domain_billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  
  -- Billing details
  billing_type TEXT NOT NULL CHECK (billing_type IN ('registration', 'renewal', 'transfer', 'email', 'addon')),
  description TEXT NOT NULL,
  
  -- Pricing
  wholesale_amount DECIMAL(10, 2) NOT NULL,
  retail_amount DECIMAL(10, 2) NOT NULL,
  markup_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Paddle integration
  paddle_transaction_id TEXT,
  paddle_subscription_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly usage summary for billing
CREATE TABLE domain_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Period
  year INT NOT NULL,
  month INT NOT NULL,
  
  -- Usage counts
  domains_registered INT DEFAULT 0,
  domains_renewed INT DEFAULT 0,
  domains_transferred INT DEFAULT 0,
  email_accounts_created INT DEFAULT 0,
  
  -- Revenue
  wholesale_total DECIMAL(10, 2) DEFAULT 0,
  retail_total DECIMAL(10, 2) DEFAULT 0,
  profit_total DECIMAL(10, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(agency_id, year, month)
);

-- Create indexes
CREATE INDEX idx_domain_billing_agency ON domain_billing_records(agency_id);
CREATE INDEX idx_domain_billing_status ON domain_billing_records(status);
CREATE INDEX idx_domain_usage_period ON domain_usage_summary(agency_id, year, month);
```

### Task 2: Pricing Types (30 mins)

```typescript
// src/types/domain-pricing.ts

export interface AgencyDomainPricing {
  id: string;
  agency_id: string;
  
  // Markup settings
  default_markup_type: 'percentage' | 'fixed' | 'custom';
  default_markup_value: number;
  
  // TLD-specific pricing
  tld_pricing: TldPricingConfig;
  
  // Client tiers
  client_tiers: ClientPricingTier[];
  
  // Billing
  paddle_product_id: string | null;
  paddle_price_id: string | null;
  billing_enabled: boolean;
  
  // White-label
  show_wholesale_prices: boolean;
  custom_terms_url: string | null;
  custom_support_email: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface TldPricingConfig {
  [tld: string]: {
    markup_type: 'percentage' | 'fixed' | 'custom';
    markup_value: number;
    custom_register?: Record<number, number>; // years -> price
    custom_renew?: Record<number, number>;
    custom_transfer?: number;
    enabled: boolean;
  };
}

export interface ClientPricingTier {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  min_domains?: number; // Minimum domains for tier
  client_ids?: string[]; // Specific clients in this tier
}

export interface DomainBillingRecord {
  id: string;
  agency_id: string;
  domain_id: string | null;
  billing_type: 'registration' | 'renewal' | 'transfer' | 'email' | 'addon';
  description: string;
  wholesale_amount: number;
  retail_amount: number;
  markup_amount: number;
  currency: string;
  paddle_transaction_id: string | null;
  paddle_subscription_id: string | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DomainUsageSummary {
  id: string;
  agency_id: string;
  year: number;
  month: number;
  domains_registered: number;
  domains_renewed: number;
  domains_transferred: number;
  email_accounts_created: number;
  wholesale_total: number;
  retail_total: number;
  profit_total: number;
}

export interface PricingCalculation {
  tld: string;
  years: number;
  wholesale_price: number;
  retail_price: number;
  markup_amount: number;
  markup_percentage: number;
  privacy_wholesale?: number;
  privacy_retail?: number;
  total_wholesale: number;
  total_retail: number;
  total_profit: number;
}
```

### Task 3: Domain Billing Service (90 mins)

```typescript
// src/lib/actions/domain-billing.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { domainService } from "@/lib/resellerclub";
import type { 
  AgencyDomainPricing, 
  TldPricingConfig, 
  ClientPricingTier,
  PricingCalculation,
  DomainUsageSummary,
} from "@/types/domain-pricing";

// ============================================================================
// Pricing Configuration
// ============================================================================

export async function getAgencyPricingConfig() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  const { data: config, error } = await supabase
    .from('agency_domain_pricing')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message };
  }
  
  // Return default config if none exists
  if (!config) {
    return {
      success: true,
      data: {
        agency_id: profile.agency_id,
        default_markup_type: 'percentage',
        default_markup_value: 30,
        tld_pricing: {},
        client_tiers: [],
        billing_enabled: false,
        show_wholesale_prices: false,
      } as Partial<AgencyDomainPricing>,
    };
  }
  
  return { success: true, data: config as AgencyDomainPricing };
}

export async function updateAgencyPricingConfig(updates: {
  default_markup_type?: 'percentage' | 'fixed' | 'custom';
  default_markup_value?: number;
  tld_pricing?: TldPricingConfig;
  client_tiers?: ClientPricingTier[];
  billing_enabled?: boolean;
  show_wholesale_prices?: boolean;
  custom_terms_url?: string;
  custom_support_email?: string;
}) {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  try {
    // Upsert config
    const { data, error } = await admin
      .from('agency_domain_pricing')
      .upsert({
        agency_id: profile.agency_id,
        ...updates,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'agency_id',
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/settings/domains/pricing');
    
    return { success: true, data };
  } catch (error) {
    console.error('[Billing] Update config error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Update failed' 
    };
  }
}

// ============================================================================
// Price Calculation
// ============================================================================

export async function calculateDomainPrice(params: {
  tld: string;
  years: number;
  operation: 'register' | 'renew' | 'transfer';
  includePrivacy?: boolean;
  clientId?: string;
}): Promise<{ success: boolean; data?: PricingCalculation; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  try {
    // Get wholesale pricing from ResellerClub
    const pricing = await domainService.getPricing([params.tld]);
    const tldPricing = pricing[params.tld];
    
    if (!tldPricing) {
      return { success: false, error: 'TLD pricing not available' };
    }
    
    // Get wholesale price
    let wholesalePrice: number;
    switch (params.operation) {
      case 'register':
        wholesalePrice = tldPricing.register[params.years] || 0;
        break;
      case 'renew':
        wholesalePrice = tldPricing.renew[params.years] || 0;
        break;
      case 'transfer':
        wholesalePrice = tldPricing.transfer || 0;
        break;
    }
    
    // Get agency pricing config
    const { data: config } = await supabase
      .from('agency_domain_pricing')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .single();
    
    // Calculate retail price
    let retailPrice: number;
    let markupType = config?.default_markup_type || 'percentage';
    let markupValue = config?.default_markup_value || 30;
    
    // Check for TLD-specific pricing
    const tldConfig = config?.tld_pricing?.[params.tld];
    if (tldConfig?.enabled) {
      markupType = tldConfig.markup_type;
      markupValue = tldConfig.markup_value;
      
      // Use custom price if set
      if (markupType === 'custom') {
        const customPrices = params.operation === 'transfer' 
          ? { 1: tldConfig.custom_transfer }
          : params.operation === 'register'
            ? tldConfig.custom_register
            : tldConfig.custom_renew;
        
        if (customPrices?.[params.years]) {
          retailPrice = customPrices[params.years]!;
        }
      }
    }
    
    // Calculate markup if not custom price
    if (!retailPrice!) {
      switch (markupType) {
        case 'percentage':
          retailPrice = wholesalePrice * (1 + markupValue / 100);
          break;
        case 'fixed':
          retailPrice = wholesalePrice + markupValue;
          break;
        default:
          retailPrice = wholesalePrice * 1.3; // 30% default
      }
    }
    
    // Apply client tier discount if applicable
    if (params.clientId && config?.client_tiers) {
      const clientTier = config.client_tiers.find(
        (tier: ClientPricingTier) => tier.client_ids?.includes(params.clientId!)
      );
      
      if (clientTier) {
        retailPrice = retailPrice * (1 - clientTier.discount_percentage / 100);
      }
    }
    
    // Calculate privacy pricing
    let privacyWholesale = 0;
    let privacyRetail = 0;
    
    if (params.includePrivacy) {
      privacyWholesale = 5 * params.years; // Would get from API
      privacyRetail = privacyWholesale * (1 + (config?.default_markup_value || 30) / 100);
    }
    
    const result: PricingCalculation = {
      tld: params.tld,
      years: params.years,
      wholesale_price: wholesalePrice,
      retail_price: Math.round(retailPrice * 100) / 100,
      markup_amount: Math.round((retailPrice - wholesalePrice) * 100) / 100,
      markup_percentage: Math.round(((retailPrice - wholesalePrice) / wholesalePrice) * 10000) / 100,
      privacy_wholesale: privacyWholesale,
      privacy_retail: Math.round(privacyRetail * 100) / 100,
      total_wholesale: wholesalePrice + privacyWholesale,
      total_retail: Math.round((retailPrice + privacyRetail) * 100) / 100,
      total_profit: Math.round((retailPrice - wholesalePrice + privacyRetail - privacyWholesale) * 100) / 100,
    };
    
    return { success: true, data: result };
  } catch (error) {
    console.error('[Billing] Calculate price error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Calculation failed' 
    };
  }
}

// ============================================================================
// Billing Records
// ============================================================================

export async function createBillingRecord(params: {
  domain_id?: string;
  billing_type: 'registration' | 'renewal' | 'transfer' | 'email' | 'addon';
  description: string;
  wholesale_amount: number;
  retail_amount: number;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  const { data, error } = await admin
    .from('domain_billing_records')
    .insert({
      agency_id: profile.agency_id,
      domain_id: params.domain_id,
      billing_type: params.billing_type,
      description: params.description,
      wholesale_amount: params.wholesale_amount,
      retail_amount: params.retail_amount,
      markup_amount: params.retail_amount - params.wholesale_amount,
      currency: 'USD',
      status: 'pending',
      metadata: params.metadata || {},
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

export async function getBillingRecords(filters?: {
  status?: string;
  billing_type?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated', data: [] };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency', data: [] };
  
  let query = supabase
    .from('domain_billing_records')
    .select(`
      *,
      domain:domains(domain_name)
    `)
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false });
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.billing_type) {
    query = query.eq('billing_type', filters.billing_type);
  }
  
  if (filters?.from_date) {
    query = query.gte('created_at', filters.from_date);
  }
  
  if (filters?.to_date) {
    query = query.lte('created_at', filters.to_date);
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return { success: false, error: error.message, data: [] };
  }
  
  return { success: true, data };
}

// ============================================================================
// Usage Summary
// ============================================================================

export async function getUsageSummary(year?: number, month?: number): Promise<{
  success: boolean;
  data?: DomainUsageSummary;
  error?: string;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month || now.getMonth() + 1;
  
  const { data, error } = await supabase
    .from('domain_usage_summary')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .eq('year', targetYear)
    .eq('month', targetMonth)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message };
  }
  
  // Return empty summary if none exists
  if (!data) {
    return {
      success: true,
      data: {
        id: '',
        agency_id: profile.agency_id,
        year: targetYear,
        month: targetMonth,
        domains_registered: 0,
        domains_renewed: 0,
        domains_transferred: 0,
        email_accounts_created: 0,
        wholesale_total: 0,
        retail_total: 0,
        profit_total: 0,
      },
    };
  }
  
  return { success: true, data: data as DomainUsageSummary };
}

export async function getUsageHistory(months: number = 12) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated', data: [] };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency', data: [] };
  
  const { data, error } = await supabase
    .from('domain_usage_summary')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(months);
  
  if (error) {
    return { success: false, error: error.message, data: [] };
  }
  
  return { success: true, data: data as DomainUsageSummary[] };
}

// ============================================================================
// Revenue Analytics
// ============================================================================

export async function getRevenueAnalytics(period: 'month' | 'quarter' | 'year' = 'month') {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  // Calculate date range
  const now = new Date();
  let fromDate: Date;
  
  switch (period) {
    case 'quarter':
      fromDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case 'year':
      fromDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    default:
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  
  // Get billing records for period
  const { data: records } = await supabase
    .from('domain_billing_records')
    .select('*')
    .eq('agency_id', profile.agency_id)
    .eq('status', 'paid')
    .gte('paid_at', fromDate.toISOString());
  
  if (!records) {
    return { 
      success: true, 
      data: {
        total_revenue: 0,
        total_cost: 0,
        total_profit: 0,
        profit_margin: 0,
        by_type: {},
      }
    };
  }
  
  // Calculate totals
  const totals = records.reduce((acc, record) => {
    acc.revenue += record.retail_amount;
    acc.cost += record.wholesale_amount;
    acc.profit += record.markup_amount;
    
    // Group by type
    if (!acc.by_type[record.billing_type]) {
      acc.by_type[record.billing_type] = { revenue: 0, cost: 0, profit: 0, count: 0 };
    }
    acc.by_type[record.billing_type].revenue += record.retail_amount;
    acc.by_type[record.billing_type].cost += record.wholesale_amount;
    acc.by_type[record.billing_type].profit += record.markup_amount;
    acc.by_type[record.billing_type].count += 1;
    
    return acc;
  }, {
    revenue: 0,
    cost: 0,
    profit: 0,
    by_type: {} as Record<string, { revenue: number; cost: number; profit: number; count: number }>,
  });
  
  return {
    success: true,
    data: {
      total_revenue: Math.round(totals.revenue * 100) / 100,
      total_cost: Math.round(totals.cost * 100) / 100,
      total_profit: Math.round(totals.profit * 100) / 100,
      profit_margin: totals.revenue > 0 
        ? Math.round((totals.profit / totals.revenue) * 10000) / 100 
        : 0,
      by_type: totals.by_type,
    },
  };
}
```

### Task 4: Pricing Configuration UI (90 mins)

```typescript
// src/components/domains/settings/domain-pricing-config.tsx

"use client";

import { useState } from "react";
import { Save, Percent, DollarSign, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateAgencyPricingConfig } from "@/lib/actions/domain-billing";
import type { AgencyDomainPricing } from "@/types/domain-pricing";

interface DomainPricingConfigProps {
  config: Partial<AgencyDomainPricing>;
}

export function DomainPricingConfig({ config }: DomainPricingConfigProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [markupType, setMarkupType] = useState(config.default_markup_type || 'percentage');
  const [markupValue, setMarkupValue] = useState(String(config.default_markup_value || 30));
  const [showWholesale, setShowWholesale] = useState(config.show_wholesale_prices || false);
  const [billingEnabled, setBillingEnabled] = useState(config.billing_enabled || false);
  
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const result = await updateAgencyPricingConfig({
        default_markup_type: markupType as 'percentage' | 'fixed' | 'custom',
        default_markup_value: parseFloat(markupValue) || 0,
        show_wholesale_prices: showWholesale,
        billing_enabled: billingEnabled,
      });
      
      if (result.success) {
        toast.success('Pricing configuration saved');
      } else {
        toast.error(result.error || 'Failed to save configuration');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate example markup
  const exampleWholesale = 12.99;
  let exampleRetail: number;
  
  switch (markupType) {
    case 'percentage':
      exampleRetail = exampleWholesale * (1 + (parseFloat(markupValue) || 0) / 100);
      break;
    case 'fixed':
      exampleRetail = exampleWholesale + (parseFloat(markupValue) || 0);
      break;
    default:
      exampleRetail = parseFloat(markupValue) || exampleWholesale;
  }
  
  return (
    <div className="space-y-6">
      {/* Default Markup */}
      <Card>
        <CardHeader>
          <CardTitle>Default Pricing Markup</CardTitle>
          <CardDescription>
            Set your default markup for all domain operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={markupType} onValueChange={setMarkupType}>
            <div className="grid gap-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <RadioGroupItem value="percentage" id="percentage" />
                <div className="flex-1">
                  <Label htmlFor="percentage" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Percentage Markup
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add a percentage on top of wholesale prices
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <RadioGroupItem value="fixed" id="fixed" />
                <div className="flex-1">
                  <Label htmlFor="fixed" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Fixed Markup
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add a fixed amount on top of wholesale prices
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <RadioGroupItem value="custom" id="custom" />
                <div className="flex-1">
                  <Label htmlFor="custom" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Custom Price
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Set your own retail price (overrides wholesale)
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
          
          <div className="space-y-2">
            <Label>
              {markupType === 'percentage' 
                ? 'Markup Percentage' 
                : markupType === 'fixed'
                  ? 'Fixed Amount ($)'
                  : 'Custom Price ($)'}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={markupValue}
                onChange={(e) => setMarkupValue(e.target.value)}
                className="w-32"
                min="0"
                step={markupType === 'percentage' ? '1' : '0.01'}
              />
              {markupType === 'percentage' && <span className="text-muted-foreground">%</span>}
            </div>
          </div>
          
          {/* Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Preview</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Wholesale</p>
                <p className="font-semibold">${exampleWholesale.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Your Price</p>
                <p className="font-semibold text-primary">${exampleRetail.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Profit</p>
                <p className="font-semibold text-green-600">
                  ${(exampleRetail - exampleWholesale).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
          <CardDescription>
            Control what pricing information is visible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Wholesale Prices</Label>
              <p className="text-sm text-muted-foreground">
                Display wholesale prices alongside retail (admin only)
              </p>
            </div>
            <Switch
              checked={showWholesale}
              onCheckedChange={setShowWholesale}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Client Billing</Label>
              <p className="text-sm text-muted-foreground">
                Allow clients to purchase domains directly
              </p>
            </div>
            <Switch
              checked={billingEnabled}
              onCheckedChange={setBillingEnabled}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <Button onClick={handleSave} disabled={isLoading}>
        <Save className="h-4 w-4 mr-2" />
        {isLoading ? 'Saving...' : 'Save Configuration'}
      </Button>
    </div>
  );
}
```

### Task 5: TLD Pricing Table (60 mins)

```typescript
// src/components/domains/settings/tld-pricing-table.tsx

"use client";

import { useState, useEffect } from "react";
import { Search, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateAgencyPricingConfig } from "@/lib/actions/domain-billing";
import type { TldPricingConfig } from "@/types/domain-pricing";

interface TldPricingTableProps {
  currentConfig: TldPricingConfig;
  wholesalePricing: Record<string, { register: Record<number, number>; renew: Record<number, number>; transfer: number }>;
  onUpdate: () => void;
}

const POPULAR_TLDS = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.xyz', '.online', '.store'];

export function TldPricingTable({ currentConfig, wholesalePricing, onUpdate }: TldPricingTableProps) {
  const [search, setSearch] = useState("");
  const [editingTld, setEditingTld] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    markup_type: 'percentage' | 'fixed' | 'custom';
    markup_value: number;
    enabled: boolean;
  } | null>(null);
  
  const filteredTlds = POPULAR_TLDS.filter(tld => 
    tld.toLowerCase().includes(search.toLowerCase())
  );
  
  const startEdit = (tld: string) => {
    const config = currentConfig[tld] || {
      markup_type: 'percentage',
      markup_value: 30,
      enabled: true,
    };
    setEditingTld(tld);
    setEditValues(config);
  };
  
  const cancelEdit = () => {
    setEditingTld(null);
    setEditValues(null);
  };
  
  const saveEdit = async () => {
    if (!editingTld || !editValues) return;
    
    try {
      const newConfig = {
        ...currentConfig,
        [editingTld]: editValues,
      };
      
      const result = await updateAgencyPricingConfig({
        tld_pricing: newConfig,
      });
      
      if (result.success) {
        toast.success(`Pricing for ${editingTld} updated`);
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to update');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setEditingTld(null);
      setEditValues(null);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  const calculateRetail = (wholesale: number, tld: string) => {
    const config = currentConfig[tld];
    if (!config || !config.enabled) {
      return wholesale * 1.3; // Default 30%
    }
    
    switch (config.markup_type) {
      case 'percentage':
        return wholesale * (1 + config.markup_value / 100);
      case 'fixed':
        return wholesale + config.markup_value;
      case 'custom':
        return config.markup_value;
      default:
        return wholesale * 1.3;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search TLDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>TLD</TableHead>
              <TableHead>Wholesale</TableHead>
              <TableHead>Markup</TableHead>
              <TableHead>Retail</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTlds.map(tld => {
              const wholesale = wholesalePricing[tld]?.register?.[1] || 0;
              const config = currentConfig[tld];
              const isEditing = editingTld === tld;
              
              return (
                <TableRow key={tld}>
                  <TableCell className="font-medium">{tld}</TableCell>
                  <TableCell>{formatPrice(wholesale)}</TableCell>
                  
                  {isEditing && editValues ? (
                    <>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={editValues.markup_type}
                            onValueChange={(v) => setEditValues({ 
                              ...editValues, 
                              markup_type: v as 'percentage' | 'fixed' | 'custom' 
                            })}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="fixed">$+</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={editValues.markup_value}
                            onChange={(e) => setEditValues({
                              ...editValues,
                              markup_value: parseFloat(e.target.value) || 0,
                            })}
                            className="w-20"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatPrice(
                          editValues.markup_type === 'custom'
                            ? editValues.markup_value
                            : editValues.markup_type === 'percentage'
                              ? wholesale * (1 + editValues.markup_value / 100)
                              : wholesale + editValues.markup_value
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={editValues.enabled}
                          onCheckedChange={(checked) => setEditValues({
                            ...editValues,
                            enabled: checked,
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={saveEdit}>
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit}>
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        {config ? (
                          <span>
                            {config.markup_type === 'percentage' 
                              ? `${config.markup_value}%`
                              : config.markup_type === 'fixed'
                                ? `+${formatPrice(config.markup_value)}`
                                : formatPrice(config.markup_value)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Default (30%)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatPrice(calculateRetail(wholesale, tld))}
                      </TableCell>
                      <TableCell>
                        <span className={config?.enabled === false ? 'text-muted-foreground' : 'text-green-500'}>
                          {config?.enabled === false ? 'No' : 'Yes'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => startEdit(tld)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

---

## ✅ Completion Checklist

- [ ] Pricing configuration schema added
- [ ] Domain pricing types defined
- [ ] Pricing configuration server actions
- [ ] Price calculation service
- [ ] Billing record management
- [ ] Usage summary tracking
- [ ] Revenue analytics
- [ ] Pricing configuration UI
- [ ] TLD pricing table component
- [ ] Client pricing tiers UI
- [ ] Domain settings page
- [ ] TypeScript compiles with zero errors

---

## 📚 References

- [Phase DM-01](./PHASE-DM-01-RESELLERCLUB-INTEGRATION.md) - ResellerClub API
- [Phase DM-02](./PHASE-DM-02-DOMAIN-DATABASE-SCHEMA.md) - Database Schema
- [Phase EM-59](../next-platform-dashboard/phases/PHASE-EM-59-PADDLE-INTEGRATION.md) - Paddle Billing
