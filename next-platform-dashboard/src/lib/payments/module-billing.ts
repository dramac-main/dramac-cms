import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  cancelSubscription,
  listSubscriptions,
} from "@lemonsqueezy/lemonsqueezy.js";
import { createAdminClient } from "@/lib/supabase/admin";

// Initialize LemonSqueezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error("LemonSqueezy Error:", error),
});

export interface CreateModuleCheckoutParams {
  agencyId: string;
  moduleId: string;
  variantId: string; // LemonSqueezy variant ID for the module price
  email: string;
  userId: string;
  billingCycle: "monthly" | "yearly";
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create a LemonSqueezy checkout session for a module subscription
 */
export async function createModuleCheckout(params: CreateModuleCheckoutParams) {
  const { agencyId, moduleId, variantId, email, userId, billingCycle, successUrl, cancelUrl } = params;
  
  const supabase = createAdminClient();

  // Check for existing active subscription
  const { data: existing } = await supabase
    .from("agency_module_subscriptions")
    .select("id, status")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .eq("status", "active")
    .single();

  if (existing) {
    throw new Error("Already subscribed to this module");
  }

  // Get module info for metadata
  const { data: module } = await supabase
    .from("modules_v2")
    .select("name, slug")
    .eq("id", moduleId)
    .single();

  const checkout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    variantId,
    {
      checkoutData: {
        email,
        custom: {
          user_id: userId,
          agency_id: agencyId,
          module_id: moduleId,
          billing_cycle: billingCycle,
          type: "module_subscription",
        },
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
        enabledVariants: [parseInt(variantId)],
        redirectUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/success?module=${moduleId}`,
        receiptButtonText: "Go to Marketplace",
        receiptLinkUrl: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace`,
        receiptThankYouNote: `Thank you for subscribing to ${module?.name || "this module"}!`,
      },
    }
  );

  return {
    checkoutUrl: checkout.data?.data.attributes.url,
    checkoutId: checkout.data?.data.id,
  };
}

/**
 * Handle successful module subscription from webhook
 */
export async function handleModuleSubscriptionCreated(
  subscriptionId: string,
  customerId: string,
  agencyId: string,
  moduleId: string,
  billingCycle: "monthly" | "yearly",
  variantId: string,
  currentPeriodEnd: string,
  orderId?: string
) {
  const supabase = createAdminClient();

  // Create subscription record (using actual column names from database)
  const { error } = await supabase.from("agency_module_subscriptions").insert({
    agency_id: agencyId,
    module_id: moduleId,
    status: "active",
    billing_cycle: billingCycle,
    lemon_subscription_id: subscriptionId,
    lemon_customer_id: customerId,
    lemon_order_id: orderId || null,
    current_period_end: currentPeriodEnd,
  });

  if (error) {
    console.error("Error creating module subscription:", error);
    throw error;
  }

  // Increment module install count on the modules_v2 table
  const { data: moduleData } = await supabase
    .from("modules_v2")
    .select("install_count")
    .eq("id", moduleId)
    .single();
  
  await supabase
    .from("modules_v2")
    .update({ install_count: (moduleData?.install_count || 0) + 1 })
    .eq("id", moduleId);

  return { success: true };
}

/**
 * Cancel a module subscription
 */
export async function cancelModuleSubscription(agencyId: string, moduleId: string) {
  const supabase = createAdminClient();

  const { data: sub } = await supabase
    .from("agency_module_subscriptions")
    .select("lemon_subscription_id")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .single();

  if (!sub?.lemon_subscription_id) {
    throw new Error("Module subscription not found");
  }

  // Cancel at period end via LemonSqueezy
  await cancelSubscription(sub.lemon_subscription_id);

  // Update local record
  await supabase
    .from("agency_module_subscriptions")
    .update({ 
      cancel_at_period_end: true,
      updated_at: new Date().toISOString()
    })
    .eq("lemon_subscription_id", sub.lemon_subscription_id);

  return { success: true };
}

/**
 * Get module subscription status
 */
export async function getModuleSubscriptionStatus(agencyId: string, moduleId: string) {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("agency_module_subscriptions")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .single();

  if (!data) {
    return null;
  }

  // Optionally sync with LemonSqueezy for real-time status
  if (data.lemon_subscription_id) {
    try {
      const lsSubscription = await getSubscription(data.lemon_subscription_id);
      const lsStatus = lsSubscription.data?.data.attributes.status;
      
      // Update local status if different
      if (lsStatus && lsStatus !== data.status) {
        await supabase
          .from("agency_module_subscriptions")
          .update({ status: lsStatus as "active" | "canceled" | "past_due" })
          .eq("id", data.id);
        
        return { ...data, status: lsStatus };
      }
    } catch (e) {
      console.error("Error syncing LemonSqueezy subscription status:", e);
    }
  }

  return data;
}

/**
 * Get all module subscriptions for an agency
 */
export async function getAgencyModuleSubscriptions(agencyId: string) {
  const supabase = createAdminClient();

  // Fetch subscriptions first (FK was dropped for testing modules)
  const { data: subscriptions } = await supabase
    .from("agency_module_subscriptions")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (!subscriptions?.length) {
    return [];
  }

  // Fetch modules separately
  const moduleIds = subscriptions.map((s) => s.module_id);
  const { data: modules } = await supabase
    .from("modules_v2")
    .select("id, name, slug, category, icon, description")
    .in("id", moduleIds);

  const moduleMap = new Map((modules || []).map((m) => [m.id, m]));

  return subscriptions.map((s) => ({
    ...s,
    module: moduleMap.get(s.module_id) || null,
  }));
}

/**
 * Check if agency has active subscription to a module
 */
export async function hasActiveModuleSubscription(agencyId: string, moduleId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("agency_module_subscriptions")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .eq("status", "active")
    .single();

  return !!data;
}

/**
 * Handle subscription renewal from webhook
 */
export async function handleModuleSubscriptionRenewed(
  subscriptionId: string,
  newPeriodEnd: string
) {
  const supabase = createAdminClient();

  await supabase
    .from("agency_module_subscriptions")
    .update({
      current_period_end: newPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("lemon_subscription_id", subscriptionId);
}

/**
 * Handle subscription cancellation from webhook
 */
export async function handleModuleSubscriptionCanceled(subscriptionId: string) {
  const supabase = createAdminClient();

  // Get the subscription to find module_id
  const { data: sub } = await supabase
    .from("agency_module_subscriptions")
    .select("module_id")
    .eq("lemon_subscription_id", subscriptionId)
    .single();

  // Update status
  await supabase
    .from("agency_module_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("lemon_subscription_id", subscriptionId);

  // Decrement install count
  if (sub?.module_id) {
    const { data: moduleData } = await supabase
      .from("modules_v2")
      .select("install_count")
      .eq("id", sub.module_id)
      .single();
    
    await supabase
      .from("modules_v2")
      .update({ install_count: Math.max((moduleData?.install_count || 0) - 1, 0) })
      .eq("id", sub.module_id);
  }
}
