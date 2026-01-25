/**
 * DEPRECATED: LemonSqueezy Billing Actions
 * 
 * ⚠️ WARNING: This file uses LemonSqueezy which does NOT support Zambia payouts.
 * 
 * This file will be replaced during Phase EM-59 implementation with Paddle billing.
 * 
 * NEW IMPLEMENTATION: @/lib/paddle/billing-actions.ts (to be created in EM-59)
 * 
 * @see phases/enterprise-modules/PHASE-EM-59A-PADDLE-BILLING.md
 * @deprecated Will be replaced with Paddle billing in EM-59
 */
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
import { getPlanById, getVariantId } from "@/config/plans";
import type { BillingInterval, Subscription, Invoice } from "@/types/payments";

/** @deprecated Use Paddle subscription functions from EM-59 */
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

  return subscription as Subscription | null;
}

export async function getAgencyInvoices(userId: string): Promise<Invoice[]> {
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

  return (invoices as Invoice[]) || [];
}

export async function getAgencyUsage(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", userId)
    .single();

  if (!profile?.agency_id) {
    return { sites: 0, clients: 0, storage_gb: 0, ai_generations: 0 };
  }

  // Get site count
  const { count: sitesCount } = await supabase
    .from("sites")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", profile.agency_id);

  // Get client count
  const { count: clientsCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", profile.agency_id);

  // Get storage usage (placeholder - would need file storage tracking)
  const storageGb = 0;

  // Get AI generation count for current month (placeholder)
  const aiGenerations = 0;

  return {
    sites: sitesCount || 0,
    clients: clientsCount || 0,
    storage_gb: storageGb,
    ai_generations: aiGenerations,
  };
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

  if (!profile.agency_id) {
    return { error: "No agency found. Please create an agency first." };
  }

  // Get plan
  const plan = getPlanById(planId);
  if (!plan) {
    return { error: "Invalid plan" };
  }

  // Get variant ID for the selected interval
  const variantId = getVariantId(plan, interval);
  if (!variantId) {
    return { error: "Invalid plan configuration. Please contact support." };
  }

  try {
    // Create LemonSqueezy checkout
    const checkout = await createLemonSqueezyCheckout({
      variantId,
      email: user.email!,
      name: profile.name || undefined,
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
    return { error: "Failed to create checkout. Please try again." };
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

  if (!subscription.lemonsqueezy_subscription_id) {
    return { error: "Invalid subscription. Please contact support." };
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
    return { error: "Failed to cancel subscription. Please try again." };
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

  if (!subscription.lemonsqueezy_subscription_id) {
    return { error: "Invalid subscription. Please contact support." };
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
    return { error: "Failed to pause subscription. Please try again." };
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

  if (!subscription.lemonsqueezy_subscription_id) {
    return { error: "Invalid subscription. Please contact support." };
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
    return { error: "Failed to resume subscription. Please try again." };
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
  if (!newVariantId) {
    return { error: "Invalid plan configuration" };
  }

  if (!subscription.lemonsqueezy_subscription_id) {
    // No LemonSqueezy subscription, create new checkout
    return createCheckout(newPlanId, interval);
  }

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
    return { error: "Failed to change plan. Please try again." };
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

export async function ensureFreeSubscription(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", userId)
    .single();

  if (!profile?.agency_id) {
    return null;
  }

  // Check if subscription exists
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("agency_id", profile.agency_id)
    .single();

  if (existing) {
    return existing;
  }

  // Create free subscription
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .insert({
      agency_id: profile.agency_id,
      plan_id: "free",
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating free subscription:", error);
    return null;
  }

  return subscription;
}
