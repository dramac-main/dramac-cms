import { stripe, PRICE_IDS, BILLING_CONFIG } from "./config";
import { createClient } from "@/lib/supabase/server";
import { createOrGetCustomer } from "./customers";
import Stripe from "stripe";

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

  const subscriptionResponse = await stripe.subscriptions.create({
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

  // Extract subscription data
  const subscription = subscriptionResponse as Stripe.Subscription;
  
  // Get period info from subscription items (new API structure)
  const subscriptionItem = subscription.items.data[0];
  const currentPeriodStart = subscriptionItem?.current_period_start;
  const currentPeriodEnd = subscriptionItem?.current_period_end;

  // Store in database
  await supabase.from("billing_subscriptions").insert({
    agency_id: agencyId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    billing_cycle: billingCycle,
    quantity: initialSeats,
    current_period_start: currentPeriodStart 
      ? new Date(currentPeriodStart * 1000).toISOString() 
      : null,
    current_period_end: currentPeriodEnd 
      ? new Date(currentPeriodEnd * 1000).toISOString() 
      : null,
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
  const subscriptionResponse = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
  const subscription = subscriptionResponse as Stripe.Subscription;
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
