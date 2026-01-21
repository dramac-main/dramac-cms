# Phase 33: Billing & Payments - Foundation

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Set up Stripe integration for per-seat billing, customer creation, and subscription management.

---

## 📋 Prerequisites

- [ ] Phase 1-32 completed
- [ ] Stripe account created
- [ ] Stripe API keys available

---

## 📦 Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

---

## ✅ Tasks

### Task 33.1: Stripe Configuration

**File: `src/lib/stripe/config.ts`**

```typescript
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});

// Price IDs from Stripe Dashboard
export const PRICE_IDS = {
  // Per-seat pricing
  seat_monthly: process.env.STRIPE_PRICE_SEAT_MONTHLY!,
  seat_yearly: process.env.STRIPE_PRICE_SEAT_YEARLY!,
  // Modules use dynamic pricing from database
} as const;

// Client seats billing model
export const BILLING_CONFIG = {
  freeSeats: 0, // No free seats - first client triggers billing
  pricePerSeatMonthly: 19, // $19/seat/month
  pricePerSeatYearly: 190, // $190/seat/year (save ~17%)
  trialDays: 14, // 14-day free trial
};
```

### Task 33.2: Billing Database Schema

**File: `migrations/billing.sql`**

```sql
-- Customer records linking agencies to Stripe
CREATE TABLE public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions for seat-based billing
CREATE TABLE public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  quantity INTEGER NOT NULL DEFAULT 0, -- Number of seats
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice history
CREATE TABLE public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_due INTEGER NOT NULL, -- in cents
  amount_paid INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage records for metered billing (modules)
CREATE TABLE public.billing_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  stripe_subscription_item_id TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  idempotency_key TEXT UNIQUE
);

-- RLS Policies
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage ENABLE ROW LEVEL SECURITY;

-- Owners can view billing
CREATE POLICY "Owners can view billing customers"
  ON public.billing_customers FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can view subscriptions"
  ON public.billing_subscriptions FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can view invoices"
  ON public.billing_invoices FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Indexes
CREATE INDEX idx_billing_customers_stripe ON public.billing_customers(stripe_customer_id);
CREATE INDEX idx_billing_subscriptions_stripe ON public.billing_subscriptions(stripe_subscription_id);
CREATE INDEX idx_billing_invoices_agency ON public.billing_invoices(agency_id);
```

### Task 33.3: Customer Management

**File: `src/lib/stripe/customers.ts`**

```typescript
import { stripe } from "./config";
import { createClient } from "@/lib/supabase/server";

export interface CreateCustomerParams {
  agencyId: string;
  email: string;
  name?: string;
}

export async function createOrGetCustomer(params: CreateCustomerParams) {
  const { agencyId, email, name } = params;
  const supabase = await createClient();

  // Check if customer already exists
  const { data: existing } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("agency_id", agencyId)
    .single();

  if (existing?.stripe_customer_id) {
    // Retrieve and return existing customer
    const customer = await stripe.customers.retrieve(existing.stripe_customer_id);
    return customer;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      agency_id: agencyId,
    },
  });

  // Store in database
  await supabase.from("billing_customers").insert({
    agency_id: agencyId,
    stripe_customer_id: customer.id,
    email,
    name,
  });

  return customer;
}

export async function getCustomerByAgency(agencyId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("agency_id", agencyId)
    .single();

  if (!data?.stripe_customer_id) return null;

  return stripe.customers.retrieve(data.stripe_customer_id);
}

export async function updateCustomer(
  customerId: string,
  params: { email?: string; name?: string }
) {
  return stripe.customers.update(customerId, params);
}
```

### Task 33.4: Subscription Management

**File: `src/lib/stripe/subscriptions.ts`**

```typescript
import { stripe, PRICE_IDS, BILLING_CONFIG } from "./config";
import { createClient } from "@/lib/supabase/server";
import { createOrGetCustomer } from "./customers";

export interface CreateSubscriptionParams {
  agencyId: string;
  email: string;
  name?: string;
  billingCycle: "monthly" | "yearly";
  initialSeats?: number;
}

export async function createSubscription(params: CreateSubscriptionParams) {
  const { agencyId, email, name, billingCycle, initialSeats = 1 } = params;
  const supabase = await createClient();

  // Get or create customer
  const customer = await createOrGetCustomer({ agencyId, email, name });

  // Create subscription with trial
  const priceId = billingCycle === "yearly" 
    ? PRICE_IDS.seat_yearly 
    : PRICE_IDS.seat_monthly;

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [
      {
        price: priceId,
        quantity: initialSeats,
      },
    ],
    trial_period_days: BILLING_CONFIG.trialDays,
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
    metadata: {
      agency_id: agencyId,
    },
  });

  // Store in database
  await supabase.from("billing_subscriptions").insert({
    agency_id: agencyId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    billing_cycle: billingCycle,
    quantity: initialSeats,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    trial_end: subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  });

  return subscription;
}

export async function updateSeatCount(agencyId: string, newQuantity: number) {
  const supabase = await createClient();

  // Get existing subscription
  const { data: sub } = await supabase
    .from("billing_subscriptions")
    .select("stripe_subscription_id")
    .eq("agency_id", agencyId)
    .eq("status", "active")
    .single();

  if (!sub?.stripe_subscription_id) {
    throw new Error("No active subscription found");
  }

  // Get subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
  const itemId = subscription.items.data[0].id;

  // Update quantity
  const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
    items: [
      {
        id: itemId,
        quantity: newQuantity,
      },
    ],
    proration_behavior: "create_prorations",
  });

  // Update database
  await supabase
    .from("billing_subscriptions")
    .update({
      quantity: newQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.stripe_subscription_id);

  return updated;
}

export async function cancelSubscription(agencyId: string, immediately = false) {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("billing_subscriptions")
    .select("stripe_subscription_id")
    .eq("agency_id", agencyId)
    .single();

  if (!sub?.stripe_subscription_id) {
    throw new Error("No subscription found");
  }

  if (immediately) {
    const canceled = await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    await supabase
      .from("billing_subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", sub.stripe_subscription_id);
    return canceled;
  }

  // Cancel at period end
  const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  await supabase
    .from("billing_subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", sub.stripe_subscription_id);

  return updated;
}

export async function getSubscription(agencyId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("billing_subscriptions")
    .select("*")
    .eq("agency_id", agencyId)
    .single();

  return data;
}
```

### Task 33.5: Billing API Routes

**File: `src/app/api/billing/create-checkout/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICE_IDS, BILLING_CONFIG } from "@/lib/stripe/config";
import { createOrGetCustomer } from "@/lib/stripe/customers";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, billingCycle = "monthly", seats = 1 } = body;

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

    // Get agency details
    const { data: agency } = await supabase
      .from("agencies")
      .select("name")
      .eq("id", agencyId)
      .single();

    // Create or get customer
    const customer = await createOrGetCustomer({
      agencyId,
      email: user.email!,
      name: agency?.name,
    });

    // Create checkout session
    const priceId = billingCycle === "yearly"
      ? PRICE_IDS.seat_yearly
      : PRICE_IDS.seat_monthly;

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: seats,
        },
      ],
      subscription_data: {
        trial_period_days: BILLING_CONFIG.trialDays,
        metadata: {
          agency_id: agencyId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
      metadata: {
        agency_id: agencyId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
```

**File: `src/app/api/billing/portal/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/config";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId } = body;

    // Get customer ID
    const { data: customer } = await supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("agency_id", agencyId)
      .single();

    if (!customer?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
```

### Task 33.6: Billing Types

**File: `src/types/billing.ts`**

```typescript
export interface BillingCustomer {
  id: string;
  agency_id: string;
  stripe_customer_id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface BillingSubscription {
  id: string;
  agency_id: string;
  stripe_subscription_id: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete";
  billing_cycle: "monthly" | "yearly";
  quantity: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingInvoice {
  id: string;
  agency_id: string;
  stripe_invoice_id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export interface BillingOverview {
  subscription: BillingSubscription | null;
  customer: BillingCustomer | null;
  invoices: BillingInvoice[];
  currentSeats: number;
  totalClients: number;
}
```

---

## 📐 Acceptance Criteria

- [ ] Stripe client configured correctly
- [ ] Customer creation/retrieval works
- [ ] Subscriptions can be created with trial
- [ ] Seat quantity can be updated
- [ ] Checkout session generates correct URL
- [ ] Customer portal accessible
- [ ] Database stores billing records
- [ ] RLS policies protect billing data

---

## 🔐 Environment Variables

Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_SEAT_MONTHLY=price_...
STRIPE_PRICE_SEAT_YEARLY=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📁 Files Created This Phase

```
src/lib/stripe/
├── config.ts
├── customers.ts
└── subscriptions.ts

migrations/
└── billing.sql

src/app/api/billing/
├── create-checkout/
│   └── route.ts
└── portal/
    └── route.ts

src/types/
└── billing.ts
```

---

## ➡️ Next Phase

**Phase 34: Billing & Payments - Webhooks** - Stripe webhook handling, subscription lifecycle.
