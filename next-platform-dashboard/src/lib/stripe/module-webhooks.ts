import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function handleModuleSubscriptionUpdate(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const { agency_id, module_id, type } = subscription.metadata;
  
  if (type !== "module" || !module_id) return false;

  const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number || Date.now() / 1000;
  await supabase.from("module_subscriptions").upsert(
    {
      agency_id,
      module_id,
      stripe_subscription_id: subscription.id,
      status: subscription.status as "active" | "canceled" | "past_due" | "incomplete" | "incomplete_expired" | "trialing" | "unpaid",
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
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
