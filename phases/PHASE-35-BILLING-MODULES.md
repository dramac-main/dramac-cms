# Phase 35: Billing & Payments - Module Billing

> ⚠️ **DEPRECATED** - This phase has been superseded by **Phase 76A: Module System Architecture Overhaul**
>
> **Reason**: Module billing has been consolidated into Phase 76A which uses LemonSqueezy as the primary
> payment provider (matching agency subscriptions) instead of Stripe. Phase 76A provides:
> - Unified LemonSqueezy billing across all module purchases
> - Agency markup pricing (agencies resell modules with profit)
> - Client-level and site-level billing
> - Better webhook integration with existing LemonSqueezy handler
>
> **See**: `PHASE-76A-MODULE-SYSTEM-ARCHITECTURE-OVERHAUL.md` for the current module billing implementation.

---

# ~~ORIGINAL CONTENT (DEPRECATED)~~

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-33-BILLING-FOUNDATION.md` and `PHASE-29-MODULE-FOUNDATION.md`

---

## ~~🎯 Objective~~

~~Integrate Stripe billing for module marketplace - monthly module subscriptions and usage-based billing.~~

---

## 📋 Prerequisites

- [ ] Phase 33-34 completed (Billing foundation)
- [ ] Phase 29-32 completed (Module system)
- [ ] Module price IDs created in Stripe

---

## ✅ Tasks

### Task 35.1: Module Pricing Configuration

**File: `src/lib/stripe/module-pricing.ts`**

```typescript
import { stripe } from "./config";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ModulePricing {
  moduleId: string;
  stripePriceId: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  usageBased?: boolean;
}

// Sync module prices from database to include Stripe info
export async function getModulePricing(moduleId: string): Promise<ModulePricing | null> {
  const supabase = createAdminClient();

  const { data: module } = await supabase
    .from("modules")
    .select("id, price_monthly, price_yearly, stripe_price_monthly, stripe_price_yearly")
    .eq("id", moduleId)
    .single();

  if (!module) return null;

  return {
    moduleId: module.id,
    stripePriceId: module.stripe_price_monthly,
    monthlyPrice: module.price_monthly,
    yearlyPrice: module.price_yearly,
  };
}

// Create Stripe product and price for a module
export async function createModuleProduct(module: {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly?: number;
}) {
  // Create product
  const product = await stripe.products.create({
    name: module.name,
    description: module.description,
    metadata: {
      module_id: module.id,
    },
  });

  // Create monthly price
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: module.priceMonthly * 100, // Convert to cents
    currency: "usd",
    recurring: {
      interval: "month",
    },
    metadata: {
      module_id: module.id,
      billing_cycle: "monthly",
    },
  });

  // Create yearly price if provided
  let yearlyPrice = null;
  if (module.priceYearly) {
    yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: module.priceYearly * 100,
      currency: "usd",
      recurring: {
        interval: "year",
      },
      metadata: {
        module_id: module.id,
        billing_cycle: "yearly",
      },
    });
  }

  // Update database with Stripe IDs
  const supabase = createAdminClient();
  await supabase
    .from("modules")
    .update({
      stripe_product_id: product.id,
      stripe_price_monthly: monthlyPrice.id,
      stripe_price_yearly: yearlyPrice?.id,
    })
    .eq("id", module.id);

  return {
    productId: product.id,
    monthlyPriceId: monthlyPrice.id,
    yearlyPriceId: yearlyPrice?.id,
  };
}
```

### Task 35.2: Module Subscription Service

**File: `src/lib/stripe/module-subscriptions.ts`**

```typescript
import { stripe } from "./config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrGetCustomer } from "./customers";

export interface SubscribeToModuleParams {
  agencyId: string;
  moduleId: string;
  billingCycle: "monthly" | "yearly";
  email: string;
}

export async function subscribeToModule(params: SubscribeToModuleParams) {
  const { agencyId, moduleId, billingCycle, email } = params;
  const supabase = createAdminClient();

  // Get module pricing
  const { data: module } = await supabase
    .from("modules")
    .select("stripe_price_monthly, stripe_price_yearly, name")
    .eq("id", moduleId)
    .single();

  if (!module) {
    throw new Error("Module not found");
  }

  const priceId = billingCycle === "yearly"
    ? module.stripe_price_yearly
    : module.stripe_price_monthly;

  if (!priceId) {
    throw new Error("Module pricing not configured");
  }

  // Get or create customer
  const customer = await createOrGetCustomer({ agencyId, email });

  // Check for existing subscription
  const { data: existing } = await supabase
    .from("module_subscriptions")
    .select("stripe_subscription_id")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .single();

  if (existing?.stripe_subscription_id) {
    throw new Error("Already subscribed to this module");
  }

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    metadata: {
      agency_id: agencyId,
      module_id: moduleId,
      type: "module",
    },
  });

  // Store in database
  await supabase.from("module_subscriptions").insert({
    agency_id: agencyId,
    module_id: moduleId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    billing_cycle: billingCycle,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  return subscription;
}

export async function cancelModuleSubscription(agencyId: string, moduleId: string) {
  const supabase = createAdminClient();

  const { data: sub } = await supabase
    .from("module_subscriptions")
    .select("stripe_subscription_id")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .single();

  if (!sub?.stripe_subscription_id) {
    throw new Error("Module subscription not found");
  }

  // Cancel at period end
  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  await supabase
    .from("module_subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("stripe_subscription_id", sub.stripe_subscription_id);
}

export async function getAgencyModuleSubscriptions(agencyId: string) {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("module_subscriptions")
    .select(`
      *,
      module:modules(id, name, category, icon)
    `)
    .eq("agency_id", agencyId);

  return data || [];
}
```

### Task 35.3: Module Purchase Checkout

**File: `src/app/api/billing/module-checkout/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";
import { createOrGetCustomer } from "@/lib/stripe/customers";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, moduleId, billingCycle = "monthly" } = body;

    // Get module pricing
    const { data: module } = await supabase
      .from("modules")
      .select("stripe_price_monthly, stripe_price_yearly, name")
      .eq("id", moduleId)
      .single();

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const priceId = billingCycle === "yearly"
      ? module.stripe_price_yearly
      : module.stripe_price_monthly;

    if (!priceId) {
      return NextResponse.json(
        { error: "Module pricing not configured" },
        { status: 400 }
      );
    }

    // Get or create customer
    const customer = await createOrGetCustomer({
      agencyId,
      email: user.email!,
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          agency_id: agencyId,
          module_id: moduleId,
          type: "module",
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?success=true&module=${moduleId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace?canceled=true`,
      metadata: {
        agency_id: agencyId,
        module_id: moduleId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Module checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
```

### Task 35.4: Module Webhook Handler Extension

**File: `src/lib/stripe/module-webhooks.ts`**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function handleModuleSubscriptionUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const { agency_id, module_id, type } = subscription.metadata;
  
  if (type !== "module" || !module_id) return false;

  await supabase.from("module_subscriptions").upsert(
    {
      agency_id,
      module_id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_subscription_id",
    }
  );

  // Enable module for agency if active
  if (subscription.status === "active") {
    // Verify module is enabled in agency settings
    const { data: existing } = await supabase
      .from("agency_modules")
      .select("id")
      .eq("agency_id", agency_id)
      .eq("module_id", module_id)
      .single();

    if (!existing) {
      await supabase.from("agency_modules").insert({
        agency_id,
        module_id,
        enabled: true,
      });
    }
  }

  return true;
}

export async function handleModuleSubscriptionCanceled(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const { module_id, type } = subscription.metadata;
  
  if (type !== "module" || !module_id) return false;

  await supabase
    .from("module_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  return true;
}
```

### Task 35.5: Module Subscription Database Schema

**File: `migrations/module-billing.sql`**

```sql
-- Add missing columns to module_subscriptions (table created in Phase 29)
-- Note: This is idempotent - columns only added if they don't exist
ALTER TABLE public.module_subscriptions 
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Make stripe_subscription_id unique if not already
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'module_subscriptions' 
    AND indexname = 'module_subscriptions_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE public.module_subscriptions 
      ADD CONSTRAINT module_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- Add Stripe columns to modules table
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS stripe_price_monthly TEXT;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS stripe_price_yearly TEXT;

-- Agency modules tracking (purchased modules)
CREATE TABLE public.agency_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, module_id)
);

-- RLS for agency_modules (module_subscriptions RLS already defined in Phase 29)
ALTER TABLE public.agency_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agency modules"
  ON public.agency_modules FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage agency modules"
  ON public.agency_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = agency_modules.agency_id
      AND role IN ('owner', 'admin')
    )
  );

-- Indexes
CREATE INDEX idx_agency_modules_agency ON public.agency_modules(agency_id);
```

### Task 35.6: Module Purchase Hook

**File: `src/lib/hooks/use-module-subscription.ts`**

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useModuleSubscriptions(agencyId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["module-subscriptions", agencyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("module_subscriptions")
        .select(`
          *,
          module:modules(id, name, category, icon)
        `)
        .eq("agency_id", agencyId);

      return data || [];
    },
  });
}

export function useHasModuleAccess(agencyId: string, moduleId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["module-access", agencyId, moduleId],
    queryFn: async () => {
      const { data } = await supabase
        .from("module_subscriptions")
        .select("status")
        .eq("agency_id", agencyId)
        .eq("module_id", moduleId)
        .single();

      return data?.status === "active";
    },
  });
}

export function usePurchaseModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      moduleId,
      billingCycle = "monthly",
    }: {
      agencyId: string;
      moduleId: string;
      billingCycle?: "monthly" | "yearly";
    }) => {
      const response = await fetch("/api/billing/module-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, moduleId, billingCycle }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout");
      }

      const { url } = await response.json();
      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-subscriptions"] });
    },
  });
}

export function useCancelModuleSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      moduleId,
    }: {
      agencyId: string;
      moduleId: string;
    }) => {
      const response = await fetch("/api/billing/cancel-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, moduleId }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-subscriptions"] });
    },
  });
}
```

### Task 35.7: Cancel Module API Route

**File: `src/app/api/billing/cancel-module/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelModuleSubscription } from "@/lib/stripe/module-subscriptions";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, moduleId } = body;

    // Verify user is owner
    const { data: member } = await supabase
      .from("agency_members")
      .select("role")
      .eq("agency_id", agencyId)
      .eq("user_id", user.id)
      .single();

    if (member?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await cancelModuleSubscription(agencyId, moduleId);

    return NextResponse.json({ success: true, canceledAtPeriodEnd: true });
  } catch (error) {
    console.error("Cancel module error:", error);
    return NextResponse.json(
      { error: "Failed to cancel module subscription" },
      { status: 500 }
    );
  }
}
```

---

## 📐 Acceptance Criteria

- [ ] Modules have Stripe products/prices
- [ ] Module checkout creates subscription
- [ ] Webhooks handle module subscriptions
- [ ] Module access granted on payment
- [ ] Cancellation works at period end
- [ ] Agency modules table tracks purchases

---

## 📁 Files Created This Phase

```
src/lib/stripe/
├── module-pricing.ts
├── module-subscriptions.ts
└── module-webhooks.ts

src/app/api/billing/
├── module-checkout/
│   └── route.ts
└── cancel-module/
    └── route.ts

migrations/
└── module-billing.sql

src/lib/hooks/
└── use-module-subscription.ts
```

---

## ➡️ Next Phase

**Phase 36: Billing & Payments - Dashboard** - Billing settings UI, invoice history, payment management.
