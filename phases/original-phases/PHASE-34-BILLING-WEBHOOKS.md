# Phase 34: Billing & Payments - Webhooks

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` and `PHASE-33-BILLING-FOUNDATION.md`

---

## 🎯 Objective

Handle Stripe webhooks for subscription lifecycle events, automatic seat counting, and invoice sync.

---

## 📋 Prerequisites

- [ ] Phase 33 completed
- [ ] Stripe webhook endpoint configured
- [ ] Webhook secret available

---

## ✅ Tasks

### Task 34.1: Webhook Handler

**File: `src/app/api/webhooks/stripe/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/config";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(supabase, event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaid(supabase, event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoiceFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialEnding(supabase, event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const agencyId = subscription.metadata.agency_id;
  if (!agencyId) return;

  const quantity = subscription.items.data[0]?.quantity || 0;

  await supabase.from("billing_subscriptions").upsert(
    {
      agency_id: agencyId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      quantity,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_subscription_id",
    }
  );
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  await supabase
    .from("billing_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleInvoicePaid(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const customer = await stripe.customers.retrieve(invoice.customer as string);
  if (customer.deleted) return;

  const agencyId = customer.metadata.agency_id;
  if (!agencyId) return;

  await supabase.from("billing_invoices").upsert(
    {
      agency_id: agencyId,
      stripe_invoice_id: invoice.id,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: "paid",
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
    },
    {
      onConflict: "stripe_invoice_id",
    }
  );
}

async function handleInvoiceFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const customer = await stripe.customers.retrieve(invoice.customer as string);
  if (customer.deleted) return;

  const agencyId = customer.metadata.agency_id;
  if (!agencyId) return;

  await supabase.from("billing_invoices").upsert(
    {
      agency_id: agencyId,
      stripe_invoice_id: invoice.id,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: "failed",
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    },
    {
      onConflict: "stripe_invoice_id",
    }
  );

  // TODO: Send notification email about failed payment
}

async function handleTrialEnding(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const agencyId = subscription.metadata.agency_id;
  if (!agencyId) return;

  // TODO: Send trial ending notification email
  console.log(`Trial ending for agency ${agencyId}`);
}
```

### Task 34.2: Admin Supabase Client

**File: `src/lib/supabase/admin.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

// Admin client bypasses RLS - use only in server-side code
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

### Task 34.3: Automatic Seat Sync

**File: `src/lib/stripe/seat-sync.ts`**

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSeatCount } from "./subscriptions";

export async function syncSeatsForAgency(agencyId: string) {
  const supabase = createAdminClient();

  // Count active clients
  const { count } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  const clientCount = count || 0;

  // Get current subscription
  const { data: subscription } = await supabase
    .from("billing_subscriptions")
    .select("quantity, status")
    .eq("agency_id", agencyId)
    .in("status", ["active", "trialing"])
    .single();

  // If no subscription and has clients, they need to subscribe
  if (!subscription && clientCount > 0) {
    // Mark agency as needing subscription
    await supabase
      .from("agencies")
      .update({ needs_subscription: true })
      .eq("id", agencyId);
    return { needsSubscription: true, clientCount };
  }

  // If subscription exists and seat count differs, update
  if (subscription && subscription.quantity !== clientCount) {
    await updateSeatCount(agencyId, Math.max(clientCount, 1));
    return { updated: true, oldCount: subscription.quantity, newCount: clientCount };
  }

  return { synced: true, seatCount: clientCount };
}

// Sync all agencies (cron job)
export async function syncAllAgencySeats() {
  const supabase = createAdminClient();

  const { data: agencies } = await supabase
    .from("agencies")
    .select("id");

  if (!agencies) return;

  const results = await Promise.all(
    agencies.map((agency) => syncSeatsForAgency(agency.id))
  );

  return results;
}
```

### Task 34.4: Client Count Trigger

**File: `src/lib/hooks/use-client-mutation.ts`**

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Client } from "@/types";

export function useCreateClient() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (data: Omit<Client, "id" | "created_at" | "updated_at">) => {
      const { data: client, error } = await supabase
        .from("clients")
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      // Trigger seat sync
      await fetch("/api/billing/sync-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: data.agency_id }),
      });

      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ clientId, agencyId }: { clientId: string; agencyId: string }) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

      // Trigger seat sync
      await fetch("/api/billing/sync-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}
```

### Task 34.5: Seat Sync API Route

**File: `src/app/api/billing/sync-seats/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSeatsForAgency } from "@/lib/stripe/seat-sync";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId } = body;

    // Verify user belongs to agency
    const { data: member } = await supabase
      .from("agency_members")
      .select("role")
      .eq("agency_id", agencyId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await syncSeatsForAgency(agencyId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Seat sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync seats" },
      { status: 500 }
    );
  }
}
```

### Task 34.6: Billing Status Hook

**File: `src/lib/hooks/use-billing.ts`**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { BillingOverview } from "@/types/billing";

export function useBilling(agencyId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["billing", agencyId],
    queryFn: async (): Promise<BillingOverview> => {
      // Get subscription
      const { data: subscription } = await supabase
        .from("billing_subscriptions")
        .select("*")
        .eq("agency_id", agencyId)
        .in("status", ["active", "trialing", "past_due"])
        .single();

      // Get customer
      const { data: customer } = await supabase
        .from("billing_customers")
        .select("*")
        .eq("agency_id", agencyId)
        .single();

      // Get invoices
      const { data: invoices } = await supabase
        .from("billing_invoices")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .limit(12);

      // Count clients
      const { count: totalClients } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId);

      return {
        subscription,
        customer,
        invoices: invoices || [],
        currentSeats: subscription?.quantity || 0,
        totalClients: totalClients || 0,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSubscriptionStatus(agencyId: string) {
  const { data } = useBilling(agencyId);

  const isActive = data?.subscription?.status === "active";
  const isTrialing = data?.subscription?.status === "trialing";
  const isPastDue = data?.subscription?.status === "past_due";
  const trialDaysRemaining = data?.subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(data.subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    isActive,
    isTrialing,
    isPastDue,
    trialDaysRemaining,
    needsPaymentMethod: isTrialing && trialDaysRemaining <= 3,
    canAddClients: isActive || isTrialing,
  };
}
```

### Task 34.7: Subscription Status Banner

**File: `src/components/billing/subscription-banner.tsx`**

```typescript
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubscriptionStatus } from "@/lib/hooks/use-billing";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";

interface SubscriptionBannerProps {
  agencyId: string;
  onUpgrade: () => void;
}

export function SubscriptionBanner({ agencyId, onUpgrade }: SubscriptionBannerProps) {
  const {
    isTrialing,
    isPastDue,
    trialDaysRemaining,
    needsPaymentMethod,
  } = useSubscriptionStatus(agencyId);

  if (isPastDue) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Payment Failed</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Your last payment failed. Please update your payment method to continue using the platform.</span>
          <Button variant="outline" size="sm" onClick={onUpgrade}>
            Update Payment
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (needsPaymentMethod) {
    return (
      <Alert className="mb-4 border-yellow-500 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Trial Ending Soon</AlertTitle>
        <AlertDescription className="flex items-center justify-between text-yellow-700">
          <span>Your trial ends in {trialDaysRemaining} days. Add a payment method to continue.</span>
          <Button variant="outline" size="sm" onClick={onUpgrade}>
            Add Payment Method
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isTrialing) {
    return (
      <Alert className="mb-4 border-blue-500 bg-blue-50">
        <CreditCard className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Free Trial</AlertTitle>
        <AlertDescription className="text-blue-700">
          You have {trialDaysRemaining} days remaining in your free trial.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
```

---

## 📐 Acceptance Criteria

- [ ] Webhooks verify signature correctly
- [ ] Subscription updates sync to database
- [ ] Invoice records created on payment
- [ ] Failed payments logged correctly
- [ ] Seat count auto-syncs on client changes
- [ ] Billing status hook returns accurate data
- [ ] Status banner shows trial/payment info

---

## 🔧 Stripe CLI Testing

```bash
# Install Stripe CLI and login
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

---

## 📁 Files Created This Phase

```
src/app/api/webhooks/stripe/
└── route.ts

src/lib/supabase/
└── admin.ts

src/lib/stripe/
└── seat-sync.ts

src/lib/hooks/
├── use-client-mutation.ts
└── use-billing.ts

src/app/api/billing/sync-seats/
└── route.ts

src/components/billing/
└── subscription-banner.tsx
```

---

## ➡️ Next Phase

**Phase 35: Billing & Payments - Module Billing** - Stripe integration for module marketplace purchases.
