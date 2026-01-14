import { stripe } from "./config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrGetCustomer } from "./customers";
import type Stripe from "stripe";

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
  const subscription: Stripe.Subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    metadata: {
      agency_id: agencyId,
      module_id: moduleId,
      type: "module",
    },
  });

  // Store in database
  const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number || Date.now() / 1000;
  await supabase.from("module_subscriptions").insert({
    agency_id: agencyId,
    module_id: moduleId,
    stripe_subscription_id: subscription.id,
    status: subscription.status as "active" | "canceled" | "past_due" | "incomplete" | "incomplete_expired" | "trialing" | "unpaid",
    billing_cycle: billingCycle,
    current_period_end: new Date(periodEnd * 1000).toISOString(),
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
