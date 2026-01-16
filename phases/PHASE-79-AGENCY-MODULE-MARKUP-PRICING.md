# Phase 79: Agency Module Markup Pricing

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🔴 CRITICAL
>
> **Estimated Time**: 10-12 hours

---

## 🎯 Objective

Implement a GoHighLevel-style module pricing model where:
1. **Super Admin** sets wholesale module prices
2. **Agencies** buy modules at wholesale and add their own markup
3. **Clients** pay the agency's marked-up price
4. **Agencies** keep 100% of the markup as profit

This creates a win-win-win: platform revenue + agency profits + client value.

---

## 📋 Prerequisites

- [ ] LemonSqueezy integration working
- [ ] Module marketplace functional
- [ ] Agency subscription system exists
- [ ] Site module installation working

---

## 🔍 Industry Research (GoHighLevel Model)

**How GoHighLevel Does It:**
- Agency pays wholesale SaaS Pro plan ($497/mo)
- Agency creates custom pricing packages for clients
- Example packages: Starter $197/mo, Growth $297/mo, Pro $497/mo
- Agency keeps 100% of markup (e.g., buys for $497, sells for $997 = $500 profit)
- Agency can white-label everything

**Our Implementation:**
- Platform (Super Admin) sets module wholesale prices
- Agencies subscribe to modules at wholesale
- Agencies configure markup percentage or fixed price per module
- When client's site uses a module, client pays agency's marked-up price
- Payment flows: Client → Agency (full price), Platform → Agency refund (wholesale cost)
- OR: Client → Platform (marked-up price), Platform → Agency (markup share)

---

## 💼 Business Value

1. **Agency Revenue Stream** - Agencies make money on every module
2. **Platform Revenue** - Still collect wholesale on every install
3. **Client Value** - One-stop-shop for agencies
4. **Competitive Advantage** - Match GoHighLevel's winning model
5. **Stickiness** - Agencies invested in the ecosystem

---

## 📁 Files to Create/Modify

```
src/lib/modules/
├── pricing-service.ts          # Module pricing logic
├── agency-pricing.ts           # Agency markup management
├── billing-service.ts          # Billing/invoicing for modules

src/app/(dashboard)/settings/
├── module-pricing/page.tsx     # Agency module pricing config

src/app/(dashboard)/admin/
├── module-pricing/page.tsx     # Super Admin wholesale pricing

src/components/modules/
├── price-display.tsx           # Shows final price to clients
├── agency-pricing-card.tsx     # Configure agency markup
├── wholesale-price-form.tsx    # Set wholesale prices
├── profit-calculator.tsx       # Show agency profit

src/app/api/modules/
├── pricing/route.ts            # Get pricing for context
├── purchase/route.ts           # Process module purchase

Database:
├── module_pricing              # Wholesale prices (Super Admin)
├── agency_module_pricing       # Agency markups
├── module_purchases            # Purchase history
```

---

## ✅ Tasks

### Task 79.1: Database Schema

**File: `migrations/module-pricing-tables.sql`**

```sql
-- Wholesale module pricing (set by Super Admin)
CREATE TABLE IF NOT EXISTS module_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL UNIQUE,
  
  -- Wholesale pricing (what agencies pay)
  wholesale_price_cents INTEGER NOT NULL DEFAULT 0,
  wholesale_price_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, one-time
  
  -- Suggested retail price (guidance for agencies)
  suggested_retail_cents INTEGER,
  
  -- LemonSqueezy integration
  lemon_product_id TEXT,
  lemon_variant_id TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency module pricing (markup configuration)
CREATE TABLE IF NOT EXISTS agency_module_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  
  -- Pricing strategy
  pricing_strategy TEXT NOT NULL DEFAULT 'markup_percent', -- markup_percent, fixed_price, passthrough
  markup_percent INTEGER DEFAULT 100, -- 100 = 100% markup (2x wholesale)
  fixed_price_cents INTEGER, -- Used if strategy is fixed_price
  
  -- Whether agency sells this module
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Calculated retail price (cached)
  retail_price_cents INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agency_id, module_id)
);

-- Module purchases/subscriptions
CREATE TABLE IF NOT EXISTS module_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who bought it
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  module_id TEXT NOT NULL,
  
  -- Pricing at time of purchase
  wholesale_price_cents INTEGER NOT NULL,
  retail_price_cents INTEGER NOT NULL,
  agency_profit_cents INTEGER NOT NULL,
  
  -- Subscription status
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired
  billing_period TEXT NOT NULL, -- monthly, yearly, one-time
  
  -- LemonSqueezy
  lemon_subscription_id TEXT,
  lemon_order_id TEXT,
  
  -- Dates
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agency_module_pricing_agency ON agency_module_pricing(agency_id);
CREATE INDEX idx_module_purchases_site ON module_purchases(site_id);
CREATE INDEX idx_module_purchases_agency ON module_purchases(agency_id);
CREATE INDEX idx_module_purchases_status ON module_purchases(status);

-- Function to calculate retail price
CREATE OR REPLACE FUNCTION calculate_retail_price(
  wholesale_cents INTEGER,
  strategy TEXT,
  markup_percent INTEGER,
  fixed_cents INTEGER
) RETURNS INTEGER AS $$
BEGIN
  IF strategy = 'passthrough' THEN
    RETURN wholesale_cents;
  ELSIF strategy = 'fixed_price' THEN
    RETURN COALESCE(fixed_cents, wholesale_cents);
  ELSE -- markup_percent
    RETURN wholesale_cents + (wholesale_cents * COALESCE(markup_percent, 100) / 100);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update retail price on agency pricing changes
CREATE OR REPLACE FUNCTION update_retail_price()
RETURNS TRIGGER AS $$
DECLARE
  wholesale INTEGER;
BEGIN
  SELECT wholesale_price_cents INTO wholesale
  FROM module_pricing
  WHERE module_id = NEW.module_id;
  
  NEW.retail_price_cents := calculate_retail_price(
    COALESCE(wholesale, 0),
    NEW.pricing_strategy,
    NEW.markup_percent,
    NEW.fixed_price_cents
  );
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_retail_price
BEFORE INSERT OR UPDATE ON agency_module_pricing
FOR EACH ROW EXECUTE FUNCTION update_retail_price();
```

---

### Task 79.2: Pricing Service

**File: `src/lib/modules/pricing-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export interface WholesalePricing {
  moduleId: string;
  wholesalePriceCents: number;
  wholesalePriceType: "monthly" | "yearly" | "one-time";
  suggestedRetailCents: number | null;
  isActive: boolean;
}

export interface AgencyModulePricing {
  moduleId: string;
  pricingStrategy: "markup_percent" | "fixed_price" | "passthrough";
  markupPercent: number;
  fixedPriceCents: number | null;
  retailPriceCents: number;
  wholesalePriceCents: number;
  profitCents: number;
  isEnabled: boolean;
}

export interface ModulePriceContext {
  moduleId: string;
  wholesalePriceCents: number;
  retailPriceCents: number;
  agencyProfitCents: number;
  billingPeriod: string;
  isAvailable: boolean;
}

// === SUPER ADMIN FUNCTIONS ===

export async function setWholesalePrice(
  moduleId: string,
  priceCents: number,
  priceType: "monthly" | "yearly" | "one-time",
  suggestedRetailCents?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("module_pricing")
    .upsert(
      {
        module_id: moduleId,
        wholesale_price_cents: priceCents,
        wholesale_price_type: priceType,
        suggested_retail_cents: suggestedRetailCents || priceCents * 2,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "module_id" }
    );

  if (error) {
    console.error("[PricingService] Set wholesale error:", error);
    return { success: false, error: "Failed to set wholesale price" };
  }

  return { success: true };
}

export async function getWholesalePricing(): Promise<WholesalePricing[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("module_pricing")
    .select("*")
    .eq("is_active", true)
    .order("module_id");

  if (error) {
    console.error("[PricingService] Get wholesale error:", error);
    return [];
  }

  return data.map((p) => ({
    moduleId: p.module_id,
    wholesalePriceCents: p.wholesale_price_cents,
    wholesalePriceType: p.wholesale_price_type,
    suggestedRetailCents: p.suggested_retail_cents,
    isActive: p.is_active,
  }));
}

export async function getWholesalePrice(moduleId: string): Promise<WholesalePricing | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("module_pricing")
    .select("*")
    .eq("module_id", moduleId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    moduleId: data.module_id,
    wholesalePriceCents: data.wholesale_price_cents,
    wholesalePriceType: data.wholesale_price_type,
    suggestedRetailCents: data.suggested_retail_cents,
    isActive: data.is_active,
  };
}

// === AGENCY FUNCTIONS ===

export async function setAgencyModulePricing(
  agencyId: string,
  moduleId: string,
  config: {
    pricingStrategy: "markup_percent" | "fixed_price" | "passthrough";
    markupPercent?: number;
    fixedPriceCents?: number;
    isEnabled?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("agency_module_pricing")
    .upsert(
      {
        agency_id: agencyId,
        module_id: moduleId,
        pricing_strategy: config.pricingStrategy,
        markup_percent: config.markupPercent || 100,
        fixed_price_cents: config.fixedPriceCents,
        is_enabled: config.isEnabled !== false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agency_id,module_id" }
    );

  if (error) {
    console.error("[PricingService] Set agency pricing error:", error);
    return { success: false, error: "Failed to set module pricing" };
  }

  return { success: true };
}

export async function getAgencyModulePricing(
  agencyId: string
): Promise<AgencyModulePricing[]> {
  const supabase = await createClient();

  // Get agency's pricing configurations
  const { data: agencyPricing } = await supabase
    .from("agency_module_pricing")
    .select("*")
    .eq("agency_id", agencyId);

  // Get wholesale prices
  const { data: wholesalePricing } = await supabase
    .from("module_pricing")
    .select("*")
    .eq("is_active", true);

  const wholesaleMap = new Map(
    wholesalePricing?.map((p) => [p.module_id, p]) || []
  );

  // Merge data
  const results: AgencyModulePricing[] = [];

  // Add configured modules
  agencyPricing?.forEach((ap) => {
    const wholesale = wholesaleMap.get(ap.module_id);
    const wholesaleCents = wholesale?.wholesale_price_cents || 0;

    results.push({
      moduleId: ap.module_id,
      pricingStrategy: ap.pricing_strategy,
      markupPercent: ap.markup_percent || 100,
      fixedPriceCents: ap.fixed_price_cents,
      retailPriceCents: ap.retail_price_cents || calculateRetailPrice(
        wholesaleCents,
        ap.pricing_strategy,
        ap.markup_percent,
        ap.fixed_price_cents
      ),
      wholesalePriceCents: wholesaleCents,
      profitCents: (ap.retail_price_cents || 0) - wholesaleCents,
      isEnabled: ap.is_enabled,
    });
  });

  // Add available modules not yet configured
  wholesalePricing?.forEach((wp) => {
    if (!results.find((r) => r.moduleId === wp.module_id)) {
      const defaultRetail = wp.wholesale_price_cents * 2; // Default 100% markup
      results.push({
        moduleId: wp.module_id,
        pricingStrategy: "markup_percent",
        markupPercent: 100,
        fixedPriceCents: null,
        retailPriceCents: defaultRetail,
        wholesalePriceCents: wp.wholesale_price_cents,
        profitCents: defaultRetail - wp.wholesale_price_cents,
        isEnabled: false,
      });
    }
  });

  return results;
}

export async function getModulePriceForSite(
  siteId: string,
  moduleId: string
): Promise<ModulePriceContext | null> {
  const supabase = await createClient();

  // Get site's agency
  const { data: site } = await supabase
    .from("sites")
    .select("client:clients!inner(agency_id)")
    .eq("id", siteId)
    .single();

  if (!site) {
    return null;
  }

  const agencyId = (site.client as { agency_id: string }).agency_id;

  // Get wholesale price
  const wholesale = await getWholesalePrice(moduleId);
  if (!wholesale || !wholesale.isActive) {
    return null;
  }

  // Get agency's pricing for this module
  const { data: agencyPricing } = await supabase
    .from("agency_module_pricing")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .single();

  // Calculate retail price
  let retailPriceCents: number;
  if (agencyPricing) {
    retailPriceCents = agencyPricing.retail_price_cents || calculateRetailPrice(
      wholesale.wholesalePriceCents,
      agencyPricing.pricing_strategy,
      agencyPricing.markup_percent,
      agencyPricing.fixed_price_cents
    );
  } else {
    // Default to 100% markup if agency hasn't configured
    retailPriceCents = wholesale.wholesalePriceCents * 2;
  }

  return {
    moduleId,
    wholesalePriceCents: wholesale.wholesalePriceCents,
    retailPriceCents,
    agencyProfitCents: retailPriceCents - wholesale.wholesalePriceCents,
    billingPeriod: wholesale.wholesalePriceType,
    isAvailable: agencyPricing?.is_enabled !== false,
  };
}

// Helper function
function calculateRetailPrice(
  wholesaleCents: number,
  strategy: string,
  markupPercent: number | null,
  fixedCents: number | null
): number {
  if (strategy === "passthrough") {
    return wholesaleCents;
  } else if (strategy === "fixed_price") {
    return fixedCents || wholesaleCents;
  } else {
    return wholesaleCents + (wholesaleCents * (markupPercent || 100)) / 100;
  }
}
```

---

### Task 79.3: Agency Billing Service

**File: `src/lib/modules/billing-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getModulePriceForSite } from "./pricing-service";

export interface ModulePurchaseResult {
  success: boolean;
  error?: string;
  checkoutUrl?: string;
  purchaseId?: string;
}

export interface PurchaseRecord {
  id: string;
  siteId: string;
  moduleId: string;
  wholesalePriceCents: number;
  retailPriceCents: number;
  agencyProfitCents: number;
  status: string;
  billingPeriod: string;
  startedAt: string;
  currentPeriodEnd: string | null;
}

export async function purchaseModuleForSite(
  siteId: string,
  moduleId: string
): Promise<ModulePurchaseResult> {
  const supabase = await createClient();

  // Get pricing context
  const pricing = await getModulePriceForSite(siteId, moduleId);
  if (!pricing) {
    return { success: false, error: "Module pricing not available" };
  }

  if (!pricing.isAvailable) {
    return { success: false, error: "Module not available from this agency" };
  }

  // Get site's agency
  const { data: site } = await supabase
    .from("sites")
    .select("client:clients!inner(agency_id)")
    .eq("id", siteId)
    .single();

  if (!site) {
    return { success: false, error: "Site not found" };
  }

  const agencyId = (site.client as { agency_id: string }).agency_id;

  // For free modules, just create the purchase record
  if (pricing.retailPriceCents === 0) {
    const { data: purchase, error } = await supabase
      .from("module_purchases")
      .insert({
        site_id: siteId,
        agency_id: agencyId,
        module_id: moduleId,
        wholesale_price_cents: 0,
        retail_price_cents: 0,
        agency_profit_cents: 0,
        status: "active",
        billing_period: "one-time",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: "Failed to activate module" };
    }

    // Also install the module
    await supabase.from("site_modules").insert({
      site_id: siteId,
      module_id: moduleId,
      enabled: true,
      settings: {},
      installed_at: new Date().toISOString(),
    });

    return { success: true, purchaseId: purchase.id };
  }

  // For paid modules, create LemonSqueezy checkout
  // In production, this would:
  // 1. Create LemonSqueezy checkout with retail price
  // 2. Include site_id, agency_id, module_id in metadata
  // 3. Return checkout URL
  // 4. Webhook handles purchase completion

  const checkoutUrl = await createLemonSqueezyCheckout({
    siteId,
    agencyId,
    moduleId,
    priceCents: pricing.retailPriceCents,
    billingPeriod: pricing.billingPeriod,
  });

  return {
    success: true,
    checkoutUrl,
  };
}

async function createLemonSqueezyCheckout(params: {
  siteId: string;
  agencyId: string;
  moduleId: string;
  priceCents: number;
  billingPeriod: string;
}): Promise<string> {
  // In production, use LemonSqueezy API:
  // - Create checkout with custom price
  // - Include metadata for webhook processing
  // - Return checkout URL
  
  // For now, return a placeholder
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/checkout/module?site=${params.siteId}&module=${params.moduleId}`;
}

export async function getAgencyModuleRevenue(
  agencyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRevenue: number;
  totalProfit: number;
  purchaseCount: number;
  moduleBreakdown: { moduleId: string; revenue: number; profit: number; count: number }[];
}> {
  const supabase = await createClient();

  let query = supabase
    .from("module_purchases")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("status", "active");

  if (startDate) {
    query = query.gte("started_at", startDate.toISOString());
  }
  if (endDate) {
    query = query.lte("started_at", endDate.toISOString());
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      totalRevenue: 0,
      totalProfit: 0,
      purchaseCount: 0,
      moduleBreakdown: [],
    };
  }

  const moduleMap = new Map<string, { revenue: number; profit: number; count: number }>();

  let totalRevenue = 0;
  let totalProfit = 0;

  data.forEach((purchase) => {
    totalRevenue += purchase.retail_price_cents;
    totalProfit += purchase.agency_profit_cents;

    const existing = moduleMap.get(purchase.module_id) || { revenue: 0, profit: 0, count: 0 };
    existing.revenue += purchase.retail_price_cents;
    existing.profit += purchase.agency_profit_cents;
    existing.count += 1;
    moduleMap.set(purchase.module_id, existing);
  });

  return {
    totalRevenue,
    totalProfit,
    purchaseCount: data.length,
    moduleBreakdown: Array.from(moduleMap.entries()).map(([moduleId, stats]) => ({
      moduleId,
      ...stats,
    })),
  };
}

export async function getSitePurchases(siteId: string): Promise<PurchaseRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("module_purchases")
    .select("*")
    .eq("site_id", siteId)
    .order("started_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    siteId: p.site_id,
    moduleId: p.module_id,
    wholesalePriceCents: p.wholesale_price_cents,
    retailPriceCents: p.retail_price_cents,
    agencyProfitCents: p.agency_profit_cents,
    status: p.status,
    billingPeriod: p.billing_period,
    startedAt: p.started_at,
    currentPeriodEnd: p.current_period_end,
  }));
}
```

---

### Task 79.4: Price Display Component

**File: `src/components/modules/price-display.tsx`**

```tsx
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  priceCents: number;
  billingPeriod?: string;
  originalPriceCents?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({
  priceCents,
  billingPeriod = "monthly",
  originalPriceCents,
  size = "md",
  className,
}: PriceDisplayProps) {
  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  };

  const periodLabel = {
    monthly: "/mo",
    yearly: "/yr",
    "one-time": "",
  }[billingPeriod] || "";

  const isFree = priceCents === 0;
  const hasDiscount = originalPriceCents && originalPriceCents > priceCents;

  return (
    <div className={cn("flex items-baseline gap-1", className)}>
      {hasDiscount && (
        <span className="text-muted-foreground line-through text-sm">
          {formatPrice(originalPriceCents)}
        </span>
      )}
      <span
        className={cn(
          "font-bold",
          isFree && "text-green-600",
          size === "sm" && "text-lg",
          size === "md" && "text-2xl",
          size === "lg" && "text-3xl"
        )}
      >
        {formatPrice(priceCents)}
      </span>
      {!isFree && periodLabel && (
        <span className="text-muted-foreground text-sm">{periodLabel}</span>
      )}
    </div>
  );
}
```

---

### Task 79.5: Agency Pricing Card Component

**File: `src/components/modules/agency-pricing-card.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Save, Loader2, DollarSign, Percent, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { setAgencyModulePricing, type AgencyModulePricing } from "@/lib/modules/pricing-service";
import { PriceDisplay } from "./price-display";
import { ProfitCalculator } from "./profit-calculator";
import { toast } from "sonner";

interface AgencyPricingCardProps {
  agencyId: string;
  moduleName: string;
  moduleIcon: string;
  pricing: AgencyModulePricing;
  onUpdate?: () => void;
}

export function AgencyPricingCard({
  agencyId,
  moduleName,
  moduleIcon,
  pricing,
  onUpdate,
}: AgencyPricingCardProps) {
  const [isEnabled, setIsEnabled] = useState(pricing.isEnabled);
  const [strategy, setStrategy] = useState(pricing.pricingStrategy);
  const [markupPercent, setMarkupPercent] = useState(pricing.markupPercent);
  const [fixedPrice, setFixedPrice] = useState(
    pricing.fixedPriceCents ? pricing.fixedPriceCents / 100 : 0
  );
  const [saving, setSaving] = useState(false);

  // Calculate preview prices
  const calculateRetail = (): number => {
    if (strategy === "passthrough") {
      return pricing.wholesalePriceCents;
    } else if (strategy === "fixed_price") {
      return fixedPrice * 100;
    } else {
      return pricing.wholesalePriceCents + (pricing.wholesalePriceCents * markupPercent) / 100;
    }
  };

  const retailCents = calculateRetail();
  const profitCents = retailCents - pricing.wholesalePriceCents;

  const handleSave = async () => {
    setSaving(true);

    const result = await setAgencyModulePricing(agencyId, pricing.moduleId, {
      pricingStrategy: strategy,
      markupPercent: strategy === "markup_percent" ? markupPercent : undefined,
      fixedPriceCents: strategy === "fixed_price" ? fixedPrice * 100 : undefined,
      isEnabled,
    });

    setSaving(false);

    if (result.success) {
      toast.success("Module pricing updated");
      onUpdate?.();
    } else {
      toast.error(result.error || "Failed to update pricing");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{moduleIcon}</span>
            <div>
              <CardTitle className="text-lg">{moduleName}</CardTitle>
              <CardDescription>
                Wholesale: ${(pricing.wholesalePriceCents / 100).toFixed(2)}/mo
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`enable-${pricing.moduleId}`} className="text-sm">
              Sell this module
            </Label>
            <Switch
              id={`enable-${pricing.moduleId}`}
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
        </div>
      </CardHeader>

      {isEnabled && (
        <CardContent className="space-y-6">
          {/* Pricing Strategy */}
          <div className="space-y-3">
            <Label>Pricing Strategy</Label>
            <RadioGroup
              value={strategy}
              onValueChange={(v) => setStrategy(v as typeof strategy)}
              className="grid grid-cols-3 gap-3"
            >
              <Label
                htmlFor="markup"
                className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer ${
                  strategy === "markup_percent" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="markup_percent" id="markup" className="sr-only" />
                <Percent className="h-5 w-5" />
                <span className="text-sm font-medium">Markup %</span>
              </Label>

              <Label
                htmlFor="fixed"
                className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer ${
                  strategy === "fixed_price" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="fixed_price" id="fixed" className="sr-only" />
                <DollarSign className="h-5 w-5" />
                <span className="text-sm font-medium">Fixed Price</span>
              </Label>

              <Label
                htmlFor="passthrough"
                className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer ${
                  strategy === "passthrough" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="passthrough" id="passthrough" className="sr-only" />
                <ArrowRight className="h-5 w-5" />
                <span className="text-sm font-medium">At Cost</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Strategy-specific input */}
          {strategy === "markup_percent" && (
            <div className="space-y-2">
              <Label>Markup Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(Number(e.target.value))}
                  min={0}
                  max={500}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                100% markup means you charge double the wholesale price
              </p>
            </div>
          )}

          {strategy === "fixed_price" && (
            <div className="space-y-2">
              <Label>Your Retail Price</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(Number(e.target.value))}
                  min={pricing.wholesalePriceCents / 100}
                  step={0.01}
                  className="w-32"
                />
                <span className="text-muted-foreground">/mo</span>
              </div>
              {fixedPrice * 100 < pricing.wholesalePriceCents && (
                <p className="text-xs text-destructive">
                  Price must be at least ${(pricing.wholesalePriceCents / 100).toFixed(2)} (wholesale)
                </p>
              )}
            </div>
          )}

          {/* Profit Preview */}
          <ProfitCalculator
            wholesaleCents={pricing.wholesalePriceCents}
            retailCents={retailCents}
          />

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Pricing
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
```

---

### Task 79.6: Profit Calculator Component

**File: `src/components/modules/profit-calculator.tsx`**

```tsx
import { TrendingUp, DollarSign, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProfitCalculatorProps {
  wholesaleCents: number;
  retailCents: number;
  monthlySales?: number;
  className?: string;
}

export function ProfitCalculator({
  wholesaleCents,
  retailCents,
  monthlySales = 10,
  className,
}: ProfitCalculatorProps) {
  const profitCents = retailCents - wholesaleCents;
  const profitPercent = wholesaleCents > 0 ? (profitCents / wholesaleCents) * 100 : 0;
  const monthlyProfit = profitCents * monthlySales;
  const yearlyProfit = monthlyProfit * 12;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  };

  return (
    <Card className={cn("bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h4 className="font-semibold text-green-800 dark:text-green-200">
            Your Profit Projection
          </h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Per Sale */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Per Sale</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(profitCents)}
            </p>
          </div>

          {/* Margin */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Margin</p>
            <p className="text-lg font-bold text-green-600">
              {profitPercent.toFixed(0)}%
            </p>
          </div>

          {/* Monthly (estimated) */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Monthly ({monthlySales} sales)
            </p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(monthlyProfit)}
            </p>
          </div>

          {/* Yearly */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Yearly</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(yearlyProfit)}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            You pay: {formatCurrency(wholesaleCents)}
          </span>
          <span className="font-medium">
            Client pays: {formatCurrency(retailCents)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Task 79.7: Agency Module Pricing Page

**File: `src/app/(dashboard)/settings/module-pricing/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DollarSign, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgencyPricingCard } from "@/components/modules/agency-pricing-card";
import { getAgencyModulePricing } from "@/lib/modules/pricing-service";
import { getAgencyModuleRevenue } from "@/lib/modules/billing-service";
import { getModuleById } from "@/lib/modules/module-catalog";

export default async function AgencyModulePricingPage() {
  const supabase = await createClient();

  // Get current user and their agency
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    redirect("/onboarding");
  }

  const agencyId = profile.agency_id;

  // Get pricing configurations
  const modulePricing = await getAgencyModulePricing(agencyId);
  const revenueData = await getAgencyModuleRevenue(agencyId);

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Module Pricing</h1>
        <p className="text-muted-foreground mt-1">
          Configure your markup and earn profit on every module your clients use
        </p>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Module Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {revenueData.purchaseCount} module installations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Profit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(revenueData.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {revenueData.totalRevenue > 0
                ? `${((revenueData.totalProfit / revenueData.totalRevenue) * 100).toFixed(0)}% profit margin`
                : "Start selling modules!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Modules Configured
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modulePricing.filter((p) => p.isEnabled).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {modulePricing.length} available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module Pricing Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Configure Module Pricing</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Set your markup for each module. Your clients will pay your price, and you keep the difference.
        </p>

        <div className="grid gap-4">
          {modulePricing.map((pricing) => {
            const module = getModuleById(pricing.moduleId);
            return (
              <AgencyPricingCard
                key={pricing.moduleId}
                agencyId={agencyId}
                moduleName={module?.name || pricing.moduleId}
                moduleIcon={module?.icon || "📦"}
                pricing={pricing}
              />
            );
          })}
        </div>

        {modulePricing.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No Modules Available</h3>
              <p className="text-sm text-muted-foreground">
                Module pricing will appear here once the platform admin configures wholesale prices.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

### Task 79.8: Super Admin Wholesale Pricing Page

**File: `src/app/(dashboard)/admin/module-pricing/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, DollarSign, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { setWholesalePrice, getWholesalePricing, type WholesalePricing } from "@/lib/modules/pricing-service";
import { MODULE_CATALOG } from "@/lib/modules/module-catalog";
import { toast } from "sonner";

export default function AdminModulePricingPage() {
  const [pricing, setPricing] = useState<WholesalePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Form state for each module
  const [editedPrices, setEditedPrices] = useState<
    Record<string, { price: number; type: string; suggested: number }>
  >({});

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    setLoading(true);
    const data = await getWholesalePricing();
    setPricing(data);

    // Initialize edited prices
    const edited: typeof editedPrices = {};
    data.forEach((p) => {
      edited[p.moduleId] = {
        price: p.wholesalePriceCents / 100,
        type: p.wholesalePriceType,
        suggested: (p.suggestedRetailCents || p.wholesalePriceCents * 2) / 100,
      };
    });
    setEditedPrices(edited);
    setLoading(false);
  };

  const handleSave = async (moduleId: string) => {
    const edited = editedPrices[moduleId];
    if (!edited) return;

    setSaving(moduleId);

    const result = await setWholesalePrice(
      moduleId,
      Math.round(edited.price * 100),
      edited.type as "monthly" | "yearly" | "one-time",
      Math.round(edited.suggested * 100)
    );

    setSaving(null);

    if (result.success) {
      toast.success("Wholesale price updated");
      loadPricing();
    } else {
      toast.error(result.error || "Failed to update price");
    }
  };

  const updatePrice = (
    moduleId: string,
    field: "price" | "type" | "suggested",
    value: number | string
  ) => {
    setEditedPrices((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      },
    }));
  };

  // Get modules without pricing configured
  const unconfiguredModules = MODULE_CATALOG.filter(
    (m) => !pricing.find((p) => p.moduleId === m.id)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Wholesale Module Pricing</h1>
        <p className="text-muted-foreground mt-1">
          Set the wholesale prices that agencies will pay for modules
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Modules</span>
            </div>
            <p className="text-2xl font-bold mt-2">{MODULE_CATALOG.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Priced Modules</span>
            </div>
            <p className="text-2xl font-bold mt-2">{pricing.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">Needs Pricing</span>
            </div>
            <p className="text-2xl font-bold mt-2">{unconfiguredModules.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Configured Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Modules</CardTitle>
          <CardDescription>
            Modules with wholesale prices set
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : pricing.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No wholesale prices configured yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Wholesale Price</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Suggested Retail</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricing.map((p) => {
                  const module = MODULE_CATALOG.find((m) => m.id === p.moduleId);
                  const edited = editedPrices[p.moduleId] || {
                    price: p.wholesalePriceCents / 100,
                    type: p.wholesalePriceType,
                    suggested: (p.suggestedRetailCents || 0) / 100,
                  };

                  return (
                    <TableRow key={p.moduleId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{module?.icon || "📦"}</span>
                          <span className="font-medium">{module?.name || p.moduleId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>$</span>
                          <Input
                            type="number"
                            value={edited.price}
                            onChange={(e) =>
                              updatePrice(p.moduleId, "price", Number(e.target.value))
                            }
                            className="w-20"
                            min={0}
                            step={0.01}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={edited.type}
                          onValueChange={(v) => updatePrice(p.moduleId, "type", v)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="one-time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>$</span>
                          <Input
                            type="number"
                            value={edited.suggested}
                            onChange={(e) =>
                              updatePrice(p.moduleId, "suggested", Number(e.target.value))
                            }
                            className="w-20"
                            min={0}
                            step={0.01}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSave(p.moduleId)}
                          disabled={saving === p.moduleId}
                        >
                          {saving === p.moduleId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Unconfigured Modules */}
      {unconfiguredModules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Modules Needing Prices</CardTitle>
            <CardDescription>
              Set wholesale prices for these modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {unconfiguredModules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{module.icon}</span>
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    Catalog: ${(module.pricing.amount / 100).toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Task 79.9: LemonSqueezy Webhook Handler

**File: `src/app/api/webhooks/lemonsqueezy/module/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventName = event.meta?.event_name;

    console.log(`[ModuleWebhook] Received event: ${eventName}`);

    switch (eventName) {
      case "order_created":
        await handleOrderCreated(event);
        break;
      case "subscription_created":
        await handleSubscriptionCreated(event);
        break;
      case "subscription_updated":
        await handleSubscriptionUpdated(event);
        break;
      case "subscription_cancelled":
        await handleSubscriptionCancelled(event);
        break;
      default:
        console.log(`[ModuleWebhook] Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ModuleWebhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  if (!signature || !WEBHOOK_SECRET) return false;

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

async function handleOrderCreated(event: Record<string, unknown>) {
  const data = event.data as Record<string, unknown>;
  const attrs = data.attributes as Record<string, unknown>;
  const meta = event.meta as Record<string, unknown>;
  const customData = (meta.custom_data || {}) as Record<string, string>;

  const { site_id, agency_id, module_id } = customData;

  if (!site_id || !agency_id || !module_id) {
    console.error("[ModuleWebhook] Missing custom data in order");
    return;
  }

  // Get pricing info
  const { data: pricing } = await supabase
    .from("module_pricing")
    .select("wholesale_price_cents")
    .eq("module_id", module_id)
    .single();

  const { data: agencyPricing } = await supabase
    .from("agency_module_pricing")
    .select("retail_price_cents")
    .eq("agency_id", agency_id)
    .eq("module_id", module_id)
    .single();

  const wholesaleCents = pricing?.wholesale_price_cents || 0;
  const retailCents = agencyPricing?.retail_price_cents || wholesaleCents * 2;
  const profitCents = retailCents - wholesaleCents;

  // Create purchase record
  await supabase.from("module_purchases").insert({
    site_id,
    agency_id,
    module_id,
    wholesale_price_cents: wholesaleCents,
    retail_price_cents: retailCents,
    agency_profit_cents: profitCents,
    status: "active",
    billing_period: "one-time",
    lemon_order_id: String(attrs.order_number),
    started_at: new Date().toISOString(),
  });

  // Install module on site
  await supabase.from("site_modules").insert({
    site_id,
    module_id,
    enabled: true,
    settings: {},
    installed_at: new Date().toISOString(),
  });

  console.log(`[ModuleWebhook] Module ${module_id} installed for site ${site_id}`);
}

async function handleSubscriptionCreated(event: Record<string, unknown>) {
  const data = event.data as Record<string, unknown>;
  const attrs = data.attributes as Record<string, unknown>;
  const meta = event.meta as Record<string, unknown>;
  const customData = (meta.custom_data || {}) as Record<string, string>;

  const { site_id, agency_id, module_id } = customData;

  if (!site_id || !agency_id || !module_id) {
    console.error("[ModuleWebhook] Missing custom data in subscription");
    return;
  }

  // Get pricing info
  const { data: pricing } = await supabase
    .from("module_pricing")
    .select("wholesale_price_cents, wholesale_price_type")
    .eq("module_id", module_id)
    .single();

  const { data: agencyPricing } = await supabase
    .from("agency_module_pricing")
    .select("retail_price_cents")
    .eq("agency_id", agency_id)
    .eq("module_id", module_id)
    .single();

  const wholesaleCents = pricing?.wholesale_price_cents || 0;
  const retailCents = agencyPricing?.retail_price_cents || wholesaleCents * 2;
  const profitCents = retailCents - wholesaleCents;

  // Create purchase record
  await supabase.from("module_purchases").insert({
    site_id,
    agency_id,
    module_id,
    wholesale_price_cents: wholesaleCents,
    retail_price_cents: retailCents,
    agency_profit_cents: profitCents,
    status: "active",
    billing_period: pricing?.wholesale_price_type || "monthly",
    lemon_subscription_id: String(data.id),
    started_at: new Date().toISOString(),
    current_period_start: attrs.current_period_start as string,
    current_period_end: attrs.current_period_end as string,
  });

  // Install module
  await supabase.from("site_modules").insert({
    site_id,
    module_id,
    enabled: true,
    settings: {},
    installed_at: new Date().toISOString(),
  });
}

async function handleSubscriptionUpdated(event: Record<string, unknown>) {
  const data = event.data as Record<string, unknown>;
  const attrs = data.attributes as Record<string, unknown>;

  await supabase
    .from("module_purchases")
    .update({
      current_period_start: attrs.current_period_start as string,
      current_period_end: attrs.current_period_end as string,
      updated_at: new Date().toISOString(),
    })
    .eq("lemon_subscription_id", String(data.id));
}

async function handleSubscriptionCancelled(event: Record<string, unknown>) {
  const data = event.data as Record<string, unknown>;

  const { data: purchase } = await supabase
    .from("module_purchases")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("lemon_subscription_id", String(data.id))
    .select()
    .single();

  if (purchase) {
    // Disable module on site
    await supabase
      .from("site_modules")
      .update({ enabled: false })
      .eq("site_id", purchase.site_id)
      .eq("module_id", purchase.module_id);
  }
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Retail price calculation is correct
- [ ] Markup percentages work correctly
- [ ] Fixed price strategy works
- [ ] Passthrough strategy works
- [ ] Profit calculations are accurate

### Integration Tests
- [ ] Wholesale prices save correctly
- [ ] Agency pricing saves correctly
- [ ] Module prices show in marketplace
- [ ] Purchase flow creates records

### E2E Tests
- [ ] Super admin can set wholesale prices
- [ ] Agency can configure markup
- [ ] Profit calculator shows accurate projections
- [ ] Module purchase completes successfully
- [ ] Webhook processes payments correctly

---

## ✅ Completion Checklist

- [ ] Database schema for pricing
- [ ] Pricing service (wholesale + agency)
- [ ] Billing service
- [ ] Price display component
- [ ] Agency pricing card component
- [ ] Profit calculator component
- [ ] Agency pricing page
- [ ] Super admin pricing page
- [ ] LemonSqueezy webhook handler
- [ ] Tests passing

---

**Next Phase**: Phase 80 - Module Development Studio
