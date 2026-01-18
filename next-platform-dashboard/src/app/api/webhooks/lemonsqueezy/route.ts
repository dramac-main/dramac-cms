import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getPlanByVariantId } from "@/config/plans";
import {
  handleModuleSubscriptionCreated,
  handleModuleSubscriptionRenewed,
  handleModuleSubscriptionCanceled,
} from "@/lib/payments/module-billing";

// Create Supabase admin client for webhook handling
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
  
  // Ensure both buffers are the same length before comparison
  const sigBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);
  
  if (sigBuffer.length !== digestBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(sigBuffer, digestBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    if (!signature) {
      console.error("Missing webhook signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing LEMONSQUEEZY_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { meta, data } = payload;
    const eventName = meta.event_name;

    console.log("LemonSqueezy webhook received:", eventName);

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCreated(data: any, meta: any) {
  const attributes = data.attributes;
  const customData = meta.custom_data || {};
  const { agency_id, module_id, type, billing_cycle } = customData;

  if (!agency_id) {
    console.error("Missing agency_id in custom data");
    return;
  }

  // Check if this is a module subscription
  if (type === "module_subscription" && module_id) {
    await handleModuleSubscriptionCreated(
      String(data.id),
      String(attributes.customer_id),
      agency_id,
      module_id,
      billing_cycle || "monthly",
      String(attributes.variant_id),
      attributes.renews_at,
      attributes.order_id ? String(attributes.order_id) : undefined
    );
    console.log("Module subscription created:", { agency_id, module_id });
    return;
  }

  // Handle agency plan subscription
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
  } else {
    console.log("Subscription created for agency:", agency_id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(data: any) {
  const attributes = data.attributes;
  const subscriptionId = String(data.id);

  // Check if this is a module subscription
  const { data: moduleSubscription } = await supabaseAdmin
    .from("agency_module_subscriptions")
    .select("id")
    .eq("lemon_subscription_id", subscriptionId)
    .single();

  if (moduleSubscription) {
    // Update module subscription
    await handleModuleSubscriptionRenewed(subscriptionId, attributes.renews_at);
    console.log("Module subscription updated:", subscriptionId);
    return;
  }

  // Handle agency plan subscription
  const plan = getPlanByVariantId(String(attributes.variant_id));

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: mapStatus(attributes.status),
      current_period_end: attributes.renews_at,
      lemonsqueezy_variant_id: String(attributes.variant_id),
      plan_id: plan?.id || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("lemonsqueezy_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription:", error);
  } else {
    console.log("Subscription updated:", data.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCancelled(data: any) {
  const attributes = data.attributes;
  const subscriptionId = String(data.id);

  // Check if this is a module subscription
  const { data: moduleSubscription } = await supabaseAdmin
    .from("agency_module_subscriptions")
    .select("id")
    .eq("lemon_subscription_id", subscriptionId)
    .single();

  if (moduleSubscription) {
    // Cancel module subscription
    await handleModuleSubscriptionCanceled(subscriptionId);
    console.log("Module subscription cancelled:", subscriptionId);
    return;
  }

  // Handle agency plan subscription
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      ends_at: attributes.ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq("lemonsqueezy_subscription_id", subscriptionId);

  if (error) {
    console.error("Error cancelling subscription:", error);
  } else {
    console.log("Subscription cancelled:", data.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionResumed(data: any) {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      cancelled_at: null,
      ends_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("lemonsqueezy_subscription_id", String(data.id));

  if (error) {
    console.error("Error resuming subscription:", error);
  } else {
    console.log("Subscription resumed:", data.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  } else {
    console.log("Subscription expired:", data.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  } else {
    console.log("Subscription paused:", data.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentSuccess(data: any, meta: any) {
  const attributes = data.attributes;

  // Get subscription to find agency_id
  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("id, agency_id")
    .eq("lemonsqueezy_subscription_id", String(data.id))
    .single();

  if (!subscription) {
    console.error("Subscription not found for payment:", data.id);
    return;
  }

  // Create invoice record
  const orderId = attributes.order_id || `payment_${data.id}_${Date.now()}`;
  
  const { error } = await supabaseAdmin.from("invoices").upsert(
    {
      agency_id: subscription.agency_id,
      subscription_id: subscription.id,
      lemonsqueezy_order_id: String(orderId),
      amount: (attributes.total || 0) / 100, // LemonSqueezy amounts are in cents
      currency: attributes.currency || "USD",
      status: "paid",
      invoice_url: attributes.urls?.invoice_url || "",
      receipt_url: attributes.urls?.receipt_url || "",
    },
    { onConflict: "lemonsqueezy_order_id" }
  );

  if (error) {
    console.error("Error creating invoice:", error);
  } else {
    console.log("Invoice created for order:", orderId);
  }

  // Update subscription status to active if it was past_due
  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id)
    .eq("status", "past_due");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  } else {
    console.log("Payment failed for subscription:", data.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleOrderCreated(data: any, meta: any) {
  // Order created - can use for one-time purchases or initial subscription order
  console.log("Order created:", data.id);
  
  // If this is associated with a subscription, it will be handled by subscription_created
  // This can be used for one-time purchases in the future
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

// Allow GET for webhook verification (some providers require this)
export async function GET() {
  return NextResponse.json({ status: "LemonSqueezy webhook endpoint active" });
}
