# Phase 53: LemonSqueezy Payment Integration

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-46-REMEDIATION-MASTER-PLAN.md`

---

## 🎯 Objective

Implement subscription billing using **LemonSqueezy** - a Merchant of Record that handles payments globally, manages taxes, and provides a simple checkout experience. Perfect for SaaS subscriptions.

---

## 📋 Why LemonSqueezy?

| Feature | LemonSqueezy |
|---------|--------------|
| Global Support | ✅ Works in 190+ countries |
| Subscriptions | ✅ Built-in subscription management |
| Tax Handling | ✅ Handles VAT/Sales tax automatically |
| Merchant of Record | ✅ They handle payments, you get payouts |
| Setup Complexity | ✅ Very simple - just API key |
| Checkout | ✅ Beautiful hosted checkout |
| Webhooks | ✅ Full webhook support |
| Payout | ✅ Direct payout to bank/PayPal |

---

## ✅ Tasks

### Task 53.1: LemonSqueezy Configuration

**File: `src/lib/payments/lemonsqueezy.ts`**

```typescript
import {
  lemonSqueezySetup,
  createCheckout,
  getCustomer,
  listSubscriptions,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  listProducts,
  listVariants,
} from "@lemonsqueezy/lemonsqueezy.js";

// Initialize LemonSqueezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error("LemonSqueezy Error:", error),
});

export interface CreateCheckoutOptions {
  variantId: string;
  email?: string;
  name?: string;
  userId: string;
  agencyId: string;
  redirectUrl?: string;
  discountCode?: string;
}

export async function createLemonSqueezyCheckout(options: CreateCheckoutOptions) {
  const checkout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    options.variantId,
    {
      checkoutData: {
        email: options.email,
        name: options.name,
        custom: {
          user_id: options.userId,
          agency_id: options.agencyId,
        },
        discountCode: options.discountCode,
      },
      checkoutOptions: {
        embed: false,
        media: true,
        logo: true,
        desc: true,
        discount: true,
        dark: false,
        subscriptionPreview: true,
      },
      productOptions: {
        enabledVariants: [parseInt(options.variantId)],
        redirectUrl: options.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
        receiptButtonText: "Go to Dashboard",
        receiptLinkUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        receiptThankYouNote: "Thank you for subscribing to DRAMAC CMS!",
      },
    }
  );

  return checkout;
}

export async function getLemonSqueezyCustomer(customerId: string) {
  const customer = await getCustomer(customerId);
  return customer.data;
}

export async function getLemonSqueezySubscription(subscriptionId: string) {
  const subscription = await getSubscription(subscriptionId);
  return subscription.data;
}

export async function getLemonSqueezySubscriptions(customerId: string) {
  const subscriptions = await listSubscriptions({
    filter: { customerId },
  });
  return subscriptions.data;
}

export async function cancelLemonSqueezySubscription(subscriptionId: string) {
  const result = await cancelSubscription(subscriptionId);
  return result.data;
}

export async function pauseLemonSqueezySubscription(subscriptionId: string) {
  const result = await updateSubscription(subscriptionId, {
    pause: {
      mode: "void", // or "free" to give free access while paused
    },
  });
  return result.data;
}

export async function resumeLemonSqueezySubscription(subscriptionId: string) {
  const result = await updateSubscription(subscriptionId, {
    pause: null,
  });
  return result.data;
}

export async function updateSubscriptionPlan(
  subscriptionId: string,
  variantId: string
) {
  const result = await updateSubscription(subscriptionId, {
    variantId: parseInt(variantId),
  });
  return result.data;
}

export async function getProducts() {
  const products = await listProducts({
    filter: { storeId: process.env.LEMONSQUEEZY_STORE_ID! },
  });
  return products.data;
}

export async function getVariants(productId: string) {
  const variants = await listVariants({
    filter: { productId },
  });
  return variants.data;
}

// Export for type safety
export type LemonSqueezySubscription = Awaited<
  ReturnType<typeof getLemonSqueezySubscription>
>;
```

### Task 53.2: Payment Types

**File: `src/types/payments.ts`**

```typescript
export type SubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

export type BillingInterval = "monthly" | "yearly";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  variant_id_monthly: string;
  variant_id_yearly: string;
  features: string[];
  limits: {
    sites: number;
    clients: number;
    storage_gb: number;
    team_members: number;
    custom_domains: boolean;
    ai_generations: number;
    white_label: boolean;
  };
  popular?: boolean;
}

export interface Subscription {
  id: string;
  agency_id: string;
  plan_id: string;
  lemonsqueezy_subscription_id: string;
  lemonsqueezy_customer_id: string;
  lemonsqueezy_variant_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  agency_id: string;
  subscription_id: string;
  lemonsqueezy_order_id: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "refunded";
  invoice_url: string;
  receipt_url: string;
  created_at: string;
}
```

### Task 53.3: Subscription Plans Configuration

**File: `src/config/plans.ts`**

```typescript
import type { SubscriptionPlan } from "@/types/payments";

// These IDs come from your LemonSqueezy dashboard after creating products
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out DRAMAC",
    price_monthly: 0,
    price_yearly: 0,
    currency: "USD",
    variant_id_monthly: "", // No checkout needed for free
    variant_id_yearly: "",
    features: [
      "1 website",
      "1 client",
      "500MB storage",
      "Basic templates",
      "Community support",
    ],
    limits: {
      sites: 1,
      clients: 1,
      storage_gb: 0.5,
      team_members: 1,
      custom_domains: false,
      ai_generations: 5,
      white_label: false,
    },
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small agencies getting started",
    price_monthly: 29,
    price_yearly: 290, // ~2 months free
    currency: "USD",
    variant_id_monthly: "YOUR_STARTER_MONTHLY_VARIANT_ID", // Replace with actual IDs
    variant_id_yearly: "YOUR_STARTER_YEARLY_VARIANT_ID",
    features: [
      "5 websites",
      "10 clients",
      "5GB storage",
      "All templates",
      "Custom domains",
      "Email support",
      "50 AI generations/month",
    ],
    limits: {
      sites: 5,
      clients: 10,
      storage_gb: 5,
      team_members: 3,
      custom_domains: true,
      ai_generations: 50,
      white_label: false,
    },
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing agencies",
    price_monthly: 79,
    price_yearly: 790,
    currency: "USD",
    variant_id_monthly: "YOUR_PRO_MONTHLY_VARIANT_ID",
    variant_id_yearly: "YOUR_PRO_YEARLY_VARIANT_ID",
    popular: true,
    features: [
      "20 websites",
      "50 clients",
      "25GB storage",
      "All templates & modules",
      "Priority support",
      "200 AI generations/month",
      "White-label option",
    ],
    limits: {
      sites: 20,
      clients: 50,
      storage_gb: 25,
      team_members: 10,
      custom_domains: true,
      ai_generations: 200,
      white_label: true,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large agencies and teams",
    price_monthly: 199,
    price_yearly: 1990,
    currency: "USD",
    variant_id_monthly: "YOUR_ENTERPRISE_MONTHLY_VARIANT_ID",
    variant_id_yearly: "YOUR_ENTERPRISE_YEARLY_VARIANT_ID",
    features: [
      "Unlimited websites",
      "Unlimited clients",
      "100GB storage",
      "All features included",
      "Dedicated support",
      "Unlimited AI generations",
      "Full white-label",
      "Custom integrations",
    ],
    limits: {
      sites: -1, // unlimited
      clients: -1,
      storage_gb: 100,
      team_members: -1,
      custom_domains: true,
      ai_generations: -1,
      white_label: true,
    },
  },
];

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId);
}

export function getPlanByVariantId(variantId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(
    (p) => p.variant_id_monthly === variantId || p.variant_id_yearly === variantId
  );
}

export function getPrice(plan: SubscriptionPlan, interval: "monthly" | "yearly"): number {
  return interval === "yearly" ? plan.price_yearly : plan.price_monthly;
}

export function getVariantId(plan: SubscriptionPlan, interval: "monthly" | "yearly"): string {
  return interval === "yearly" ? plan.variant_id_yearly : plan.variant_id_monthly;
}
```

### Task 53.4: Billing Actions

**File: `src/lib/actions/billing.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createLemonSqueezyCheckout,
  cancelLemonSqueezySubscription,
  pauseLemonSqueezySubscription,
  resumeLemonSqueezySubscription,
  updateSubscriptionPlan,
} from "@/lib/payments/lemonsqueezy";
import { SUBSCRIPTION_PLANS, getPlanById, getVariantId } from "@/config/plans";
import type { BillingInterval, Subscription } from "@/types/payments";

export async function getAgencySubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient();

  // Get user's agency
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", userId)
    .single();

  if (!profile?.agency_id) {
    return null;
  }

  // Get subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("agency_id", profile.agency_id)
    .single();

  return subscription;
}

export async function getAgencyInvoices(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", userId)
    .single();

  if (!profile?.agency_id) {
    return [];
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("agency_id", profile.agency_id)
    .order("created_at", { ascending: false });

  return invoices || [];
}

export async function createCheckout(planId: string, interval: BillingInterval) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user profile with agency
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, agency:agencies(*)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found" };
  }

  // Get plan
  const plan = getPlanById(planId);
  if (!plan) {
    return { error: "Invalid plan" };
  }

  // Get variant ID for the selected interval
  const variantId = getVariantId(plan, interval);
  if (!variantId) {
    return { error: "Invalid plan configuration" };
  }

  try {
    // Create LemonSqueezy checkout
    const checkout = await createLemonSqueezyCheckout({
      variantId,
      email: user.email!,
      name: profile.full_name || undefined,
      userId: user.id,
      agencyId: profile.agency_id,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
    });

    if (!checkout.data?.data.attributes.url) {
      return { error: "Failed to create checkout" };
    }

    return { checkoutUrl: checkout.data.data.attributes.url };
  } catch (error) {
    console.error("Checkout error:", error);
    return { error: "Failed to create checkout" };
  }
}

export async function cancelSubscription() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const subscription = await getAgencySubscription(user.id);
  if (!subscription) {
    return { error: "No subscription found" };
  }

  try {
    await cancelLemonSqueezySubscription(subscription.lemonsqueezy_subscription_id);

    // Update local database
    await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    revalidatePath("/billing");
    return { success: true };
  } catch (error) {
    console.error("Cancel error:", error);
    return { error: "Failed to cancel subscription" };
  }
}

export async function pauseSubscription() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const subscription = await getAgencySubscription(user.id);
  if (!subscription) {
    return { error: "No subscription found" };
  }

  try {
    await pauseLemonSqueezySubscription(subscription.lemonsqueezy_subscription_id);

    await supabase
      .from("subscriptions")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    revalidatePath("/billing");
    return { success: true };
  } catch (error) {
    console.error("Pause error:", error);
    return { error: "Failed to pause subscription" };
  }
}

export async function resumeSubscription() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const subscription = await getAgencySubscription(user.id);
  if (!subscription) {
    return { error: "No subscription found" };
  }

  try {
    await resumeLemonSqueezySubscription(subscription.lemonsqueezy_subscription_id);

    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    revalidatePath("/billing");
    return { success: true };
  } catch (error) {
    console.error("Resume error:", error);
    return { error: "Failed to resume subscription" };
  }
}

export async function changePlan(newPlanId: string, interval: BillingInterval) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const subscription = await getAgencySubscription(user.id);
  if (!subscription) {
    // No existing subscription, create new checkout
    return createCheckout(newPlanId, interval);
  }

  const newPlan = getPlanById(newPlanId);
  if (!newPlan) {
    return { error: "Invalid plan" };
  }

  const newVariantId = getVariantId(newPlan, interval);

  try {
    await updateSubscriptionPlan(
      subscription.lemonsqueezy_subscription_id,
      newVariantId
    );

    await supabase
      .from("subscriptions")
      .update({
        plan_id: newPlanId,
        lemonsqueezy_variant_id: newVariantId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    revalidatePath("/billing");
    return { success: true };
  } catch (error) {
    console.error("Change plan error:", error);
    return { error: "Failed to change plan" };
  }
}

export async function getCustomerPortalUrl() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  const subscription = await getAgencySubscription(user.id);
  if (!subscription?.lemonsqueezy_customer_id) {
    return { error: "No subscription found" };
  }

  // LemonSqueezy customer portal URL format
  const portalUrl = `https://app.lemonsqueezy.com/my-orders`;
  return { url: portalUrl };
}
```

### Task 53.5: Webhook Handler

**File: `src/app/api/webhooks/lemonsqueezy/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getPlanByVariantId } from "@/config/plans";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      rawBody,
      signature,
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { meta, data } = payload;
    const eventName = meta.event_name;

    console.log("LemonSqueezy webhook:", eventName);

    switch (eventName) {
      case "subscription_created":
        await handleSubscriptionCreated(data, meta);
        break;

      case "subscription_updated":
        await handleSubscriptionUpdated(data);
        break;

      case "subscription_cancelled":
        await handleSubscriptionCancelled(data);
        break;

      case "subscription_resumed":
        await handleSubscriptionResumed(data);
        break;

      case "subscription_expired":
        await handleSubscriptionExpired(data);
        break;

      case "subscription_paused":
        await handleSubscriptionPaused(data);
        break;

      case "subscription_unpaused":
        await handleSubscriptionResumed(data);
        break;

      case "subscription_payment_success":
        await handlePaymentSuccess(data, meta);
        break;

      case "subscription_payment_failed":
        await handlePaymentFailed(data);
        break;

      case "order_created":
        await handleOrderCreated(data, meta);
        break;

      default:
        console.log("Unhandled webhook event:", eventName);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(data: any, meta: any) {
  const attributes = data.attributes;
  const customData = meta.custom_data || {};
  const { user_id, agency_id } = customData;

  if (!agency_id) {
    console.error("Missing agency_id in custom data");
    return;
  }

  // Find plan by variant ID
  const plan = getPlanByVariantId(String(attributes.variant_id));

  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      agency_id,
      plan_id: plan?.id || "unknown",
      lemonsqueezy_subscription_id: String(data.id),
      lemonsqueezy_customer_id: String(attributes.customer_id),
      lemonsqueezy_variant_id: String(attributes.variant_id),
      status: mapStatus(attributes.status),
      current_period_start: attributes.created_at,
      current_period_end: attributes.renews_at,
      trial_ends_at: attributes.trial_ends_at,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "agency_id" }
  );

  if (error) {
    console.error("Error creating subscription:", error);
  }
}

async function handleSubscriptionUpdated(data: any) {
  const attributes = data.attributes;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: mapStatus(attributes.status),
      current_period_end: attributes.renews_at,
      lemonsqueezy_variant_id: String(attributes.variant_id),
      updated_at: new Date().toISOString(),
    })
    .eq("lemonsqueezy_subscription_id", String(data.id));

  if (error) {
    console.error("Error updating subscription:", error);
  }
}

async function handleSubscriptionCancelled(data: any) {
  const attributes = data.attributes;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      ends_at: attributes.ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq("lemonsqueezy_subscription_id", String(data.id));

  if (error) {
    console.error("Error cancelling subscription:", error);
  }
}

async function handleSubscriptionResumed(data: any) {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("lemonsqueezy_subscription_id", String(data.id));

  if (error) {
    console.error("Error resuming subscription:", error);
  }
}

async function handleSubscriptionExpired(data: any) {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("lemonsqueezy_subscription_id", String(data.id));

  if (error) {
    console.error("Error expiring subscription:", error);
  }
}

async function handleSubscriptionPaused(data: any) {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("lemonsqueezy_subscription_id", String(data.id));

  if (error) {
    console.error("Error pausing subscription:", error);
  }
}

async function handlePaymentSuccess(data: any, meta: any) {
  const attributes = data.attributes;
  const customData = meta.custom_data || {};

  // Get subscription to find agency_id
  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("agency_id")
    .eq("lemonsqueezy_subscription_id", String(data.id))
    .single();

  if (!subscription) return;

  // Create invoice record
  const { error } = await supabaseAdmin.from("invoices").insert({
    agency_id: subscription.agency_id,
    subscription_id: String(data.id),
    lemonsqueezy_order_id: String(attributes.order_id || data.id),
    amount: attributes.total / 100, // LemonSqueezy amounts are in cents
    currency: attributes.currency,
    status: "paid",
    invoice_url: attributes.urls?.invoice_url || "",
    receipt_url: attributes.urls?.receipt_url || "",
  });

  if (error) {
    console.error("Error creating invoice:", error);
  }
}

async function handlePaymentFailed(data: any) {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("lemonsqueezy_subscription_id", String(data.id));

  if (error) {
    console.error("Error marking payment failed:", error);
  }
}

async function handleOrderCreated(data: any, meta: any) {
  // Order created - can use for one-time purchases or initial subscription order
  console.log("Order created:", data.id);
}

function mapStatus(lsStatus: string): string {
  const statusMap: Record<string, string> = {
    on_trial: "on_trial",
    active: "active",
    paused: "paused",
    past_due: "past_due",
    unpaid: "unpaid",
    cancelled: "cancelled",
    expired: "expired",
  };
  return statusMap[lsStatus] || "active";
}
```

### Task 53.6: Billing Page

**File: `src/app/(dashboard)/billing/page.tsx`**

```tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth";
import { getAgencySubscription, getAgencyInvoices } from "@/lib/actions/billing";
import { CurrentPlanCard } from "@/components/billing/current-plan-card";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { InvoiceHistory } from "@/components/billing/invoice-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Billing | DRAMAC",
};

export default async function BillingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const [subscription, invoices] = await Promise.all([
    getAgencySubscription(session.user.id),
    getAgencyInvoices(session.user.id),
  ]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view billing history
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CurrentPlanCard subscription={subscription} />
        </TabsContent>

        <TabsContent value="plans">
          <PricingPlans currentPlanId={subscription?.plan_id || "free"} />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceHistory invoices={invoices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Task 53.7: Current Plan Card

**File: `src/components/billing/current-plan-card.tsx`**

```tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Crown,
  Pause,
  Play,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getPlanById } from "@/config/plans";
import {
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  getCustomerPortalUrl,
} from "@/lib/actions/billing";
import type { Subscription } from "@/types/payments";

interface CurrentPlanCardProps {
  subscription: Subscription | null;
}

const statusConfig = {
  active: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100", label: "Active" },
  on_trial: { icon: Crown, color: "text-blue-500", bg: "bg-blue-100", label: "Trial" },
  paused: { icon: Pause, color: "text-yellow-500", bg: "bg-yellow-100", label: "Paused" },
  past_due: { icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-100", label: "Past Due" },
  cancelled: { icon: XCircle, color: "text-red-500", bg: "bg-red-100", label: "Cancelled" },
  expired: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-100", label: "Expired" },
  unpaid: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-100", label: "Unpaid" },
};

export function CurrentPlanCard({ subscription }: CurrentPlanCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  const plan = getPlanById(subscription?.plan_id || "free");
  const status = subscription?.status || "active";
  const statusInfo = statusConfig[status] || statusConfig.active;
  const StatusIcon = statusInfo.icon;

  const handleCancel = async () => {
    setIsLoading("cancel");
    const result = await cancelSubscription();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Subscription cancelled. You'll have access until the end of the billing period.");
    }
    setIsLoading(null);
  };

  const handlePause = async () => {
    setIsLoading("pause");
    const result = await pauseSubscription();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Subscription paused");
    }
    setIsLoading(null);
  };

  const handleResume = async () => {
    setIsLoading("resume");
    const result = await resumeSubscription();
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Subscription resumed");
    }
    setIsLoading(null);
  };

  const handleManageBilling = async () => {
    setIsLoading("portal");
    const result = await getCustomerPortalUrl();
    if (result.error) {
      toast.error(result.error);
    } else if (result.url) {
      window.open(result.url, "_blank");
    }
    setIsLoading(null);
  };

  // Mock usage - would come from actual usage tracking
  const usage = {
    sites: { used: 2, limit: plan?.limits.sites || 1 },
    clients: { used: 5, limit: plan?.limits.clients || 1 },
    storage: { used: 1.2, limit: plan?.limits.storage_gb || 0.5 },
    aiGenerations: { used: 15, limit: plan?.limits.ai_generations || 5 },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Plan Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Badge className={`${statusInfo.bg} ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold">{plan?.name || "Free"}</h3>
            <p className="text-muted-foreground">{plan?.description}</p>
          </div>

          {subscription && (
            <div className="space-y-2 text-sm">
              {subscription.current_period_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {subscription.cancelled_at ? "Access until" : "Renews on"}
                  </span>
                  <span>
                    {format(new Date(subscription.current_period_end), "MMMM d, yyyy")}
                  </span>
                </div>
              )}
              {subscription.trial_ends_at && status === "on_trial" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial ends</span>
                  <span>
                    {format(new Date(subscription.trial_ends_at), "MMMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4">
            {subscription && status !== "cancelled" && status !== "expired" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={isLoading === "portal"}
                >
                  {isLoading === "portal" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>

                {status === "paused" ? (
                  <Button onClick={handleResume} disabled={isLoading === "resume"}>
                    {isLoading === "resume" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handlePause}
                      disabled={isLoading === "pause"}
                    >
                      {isLoading === "pause" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Cancel</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You'll continue to have access until the end of your current
                            billing period. After that, you'll be downgraded to the Free
                            plan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancel}
                            className="bg-destructive text-destructive-foreground"
                          >
                            {isLoading === "cancel" && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Yes, Cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </>
            )}

            {(!subscription || status === "cancelled" || status === "expired") && (
              <Button asChild>
                <a href="#plans">Upgrade Now</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageItem
            label="Websites"
            used={usage.sites.used}
            limit={usage.sites.limit}
          />
          <UsageItem
            label="Clients"
            used={usage.clients.used}
            limit={usage.clients.limit}
          />
          <UsageItem
            label="Storage"
            used={usage.storage.used}
            limit={usage.storage.limit}
            unit="GB"
          />
          <UsageItem
            label="AI Generations"
            used={usage.aiGenerations.used}
            limit={usage.aiGenerations.limit}
            unit="/month"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function UsageItem({
  label,
  used,
  limit,
  unit = "",
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span
          className={
            isAtLimit
              ? "text-destructive font-medium"
              : isNearLimit
              ? "text-orange-500 font-medium"
              : ""
          }
        >
          {used}
          {isUnlimited ? "" : ` / ${limit}`}
          {unit}
          {isUnlimited && " (Unlimited)"}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={`h-2 ${
            isAtLimit
              ? "[&>div]:bg-destructive"
              : isNearLimit
              ? "[&>div]:bg-orange-500"
              : ""
          }`}
        />
      )}
    </div>
  );
}
```

### Task 53.8: Pricing Plans Component

**File: `src/components/billing/pricing-plans.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SUBSCRIPTION_PLANS, getPrice, getVariantId } from "@/config/plans";
import { createCheckout, changePlan } from "@/lib/actions/billing";
import type { BillingInterval } from "@/types/payments";

interface PricingPlansProps {
  currentPlanId: string;
}

export function PricingPlans({ currentPlanId }: PricingPlansProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === "free" || planId === currentPlanId) return;

    setLoadingPlan(planId);
    try {
      const result = currentPlanId === "free"
        ? await createCheckout(planId, interval)
        : await changePlan(planId, interval);

      if (result.error) {
        toast.error(result.error);
      } else if ("checkoutUrl" in result && result.checkoutUrl) {
        // Redirect to LemonSqueezy checkout
        window.location.href = result.checkoutUrl;
      } else {
        toast.success("Plan updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to process request");
    } finally {
      setLoadingPlan(null);
    }
  };

  const yearlySavings = Math.round((1 - 290 / (29 * 12)) * 100);

  return (
    <div className="space-y-6" id="plans">
      {/* Interval Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span
          className={cn(
            "text-sm transition-colors",
            interval === "monthly" ? "font-medium" : "text-muted-foreground"
          )}
        >
          Monthly
        </span>
        <Switch
          checked={interval === "yearly"}
          onCheckedChange={(checked) => setInterval(checked ? "yearly" : "monthly")}
        />
        <span
          className={cn(
            "text-sm transition-colors",
            interval === "yearly" ? "font-medium" : "text-muted-foreground"
          )}
        >
          Yearly
          <span className="ml-1.5 text-xs text-green-600 font-medium">
            (Save {yearlySavings}%)
          </span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const price = getPrice(plan, interval);
          const isCurrent = plan.id === currentPlanId;
          const isPopular = plan.popular;
          const hasVariant = !!getVariantId(plan, interval);

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                isPopular && "border-primary shadow-lg scale-105",
                isCurrent && "border-green-500"
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  Current Plan
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <div className="mb-6">
                  <span className="text-4xl font-bold">${price}</span>
                  {price > 0 && (
                    <span className="text-muted-foreground">
                      /{interval === "yearly" ? "year" : "month"}
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  disabled={isCurrent || loadingPlan === plan.id || (!hasVariant && plan.id !== "free")}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {loadingPlan === plan.id && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {isCurrent
                    ? "Current Plan"
                    : plan.id === "free"
                    ? "Free Forever"
                    : currentPlanId === "free"
                    ? "Get Started"
                    : "Switch Plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trust Indicators */}
      <div className="text-center space-y-2 pt-4">
        <p className="text-sm text-muted-foreground">
          🔒 Secure checkout powered by LemonSqueezy
        </p>
        <p className="text-xs text-muted-foreground">
          Cancel anytime • No hidden fees • Instant access
        </p>
      </div>
    </div>
  );
}
```

### Task 53.9: Invoice History Component

**File: `src/components/billing/invoice-history.tsx`**

```tsx
"use client";

import { format } from "date-fns";
import { Download, ExternalLink, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Invoice } from "@/types/payments";

interface InvoiceHistoryProps {
  invoices: Invoice[];
}

const statusConfig = {
  paid: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-100" },
  pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-100" },
  refunded: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-100" },
};

export function InvoiceHistory({ invoices }: InvoiceHistoryProps) {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No invoices yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Invoices will appear here after your first payment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const status = statusConfig[invoice.status];
              const StatusIcon = status.icon;

              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium font-mono text-sm">
                    #{invoice.lemonsqueezy_order_id.slice(-8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${status.bg} ${status.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {invoice.invoice_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.invoice_url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {invoice.receipt_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.receipt_url, "_blank")}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### Task 53.10: Success Page

**File: `src/app/(dashboard)/billing/success/page.tsx`**

```tsx
import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Welcome! | DRAMAC",
};

export default function BillingSuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Welcome to DRAMAC Pro!</h1>
          <p className="text-muted-foreground mb-6">
            Your subscription is now active. You have full access to all features.
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/sites/new">
                <Sparkles className="w-4 h-4 mr-2" />
                Create Your First Site
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            A receipt has been sent to your email address.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Task 53.11: Database Migration

**File: `migrations/billing-lemonsqueezy.sql`**

```sql
-- Subscriptions table for LemonSqueezy
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  plan_id text NOT NULL DEFAULT 'free',
  lemonsqueezy_subscription_id text UNIQUE,
  lemonsqueezy_customer_id text,
  lemonsqueezy_variant_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agency_id)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  subscription_id text,
  lemonsqueezy_order_id text UNIQUE NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'paid',
  invoice_url text,
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_agency ON subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_agency ON invoices(agency_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their agency subscription"
  ON subscriptions FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view their agency invoices"
  ON invoices FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role can manage all
CREATE POLICY "Service role full access subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access invoices"
  ON invoices FOR ALL
  USING (auth.role() = 'service_role');
```

### Task 53.12: Environment Variables

Add to `.env.local`:

```env
# LemonSqueezy
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Task 53.13: Install Package

```bash
pnpm add @lemonsqueezy/lemonsqueezy.js
```

---

## 📋 LemonSqueezy Setup Guide

### Step 1: Create LemonSqueezy Account
1. Go to [lemonsqueezy.com](https://lemonsqueezy.com)
2. Sign up and verify your email
3. Complete onboarding

### Step 2: Create Your Store
1. Set up your store with business details
2. Add payout method (PayPal or Bank Transfer)
3. Configure tax settings (auto-handled)

### Step 3: Create Products
1. Create a product called "DRAMAC CMS"
2. Add variants for each plan:
   - **Starter Monthly** - $29/month
   - **Starter Yearly** - $290/year
   - **Professional Monthly** - $79/month
   - **Professional Yearly** - $790/year
   - **Enterprise Monthly** - $199/month
   - **Enterprise Yearly** - $1990/year

### Step 4: Get Credentials
1. **API Key**: Settings → API → Create API Key
2. **Store ID**: Settings → Stores → Copy ID
3. Add to `.env.local`

### Step 5: Setup Webhook
1. Settings → Webhooks → Create
2. URL: `https://yourdomain.com/api/webhooks/lemonsqueezy`
3. Select events:
   - subscription_created
   - subscription_updated
   - subscription_cancelled
   - subscription_resumed
   - subscription_expired
   - subscription_paused
   - subscription_payment_success
   - subscription_payment_failed
4. Copy signing secret to `LEMONSQUEEZY_WEBHOOK_SECRET`

### Step 6: Update Plan Variant IDs
Copy each variant ID from LemonSqueezy dashboard into `src/config/plans.ts`

---

## 🧪 Testing Checklist

- [ ] Billing page loads with current plan
- [ ] Usage metrics display correctly
- [ ] Plan cards show with pricing
- [ ] Monthly/Yearly toggle works
- [ ] "Get Started" redirects to LemonSqueezy checkout
- [ ] Webhook receives subscription_created event
- [ ] Subscription created in database after payment
- [ ] Success page displays after checkout
- [ ] Pause subscription works
- [ ] Resume subscription works
- [ ] Cancel subscription works (keeps access until period end)
- [ ] Invoice history shows past payments
- [ ] Plan upgrade works
- [ ] Plan downgrade works

---

## 📝 Notes

- LemonSqueezy handles all payment UI - no forms to build
- They are Merchant of Record - handle taxes, refunds, chargebacks
- Test mode available for development
- Webhook signatures ensure security
- Customers can manage billing via LemonSqueezy portal
...