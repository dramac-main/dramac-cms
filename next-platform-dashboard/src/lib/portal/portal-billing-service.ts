"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY } from '@/lib/locale-config'
import {
  getSubscription,
  lemonSqueezySetup,
} from "@lemonsqueezy/lemonsqueezy.js";

// Initialize LemonSqueezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error("LemonSqueezy Error:", error),
});

// ============================================
// TYPES
// ============================================

export interface PortalInvoice {
  id: string;
  invoiceNumber: string | null;
  orderId: string;
  subscriptionId: string | null;
  productName: string | null;
  description: string | null;
  amount: number; // In cents
  currency: string;
  status: "paid" | "pending" | "refunded" | "partial_refund" | "void";
  createdAt: string;
  paidAt: string | null;
  invoiceUrl: string | null;
  receiptUrl: string | null;
}

export interface PortalBillingOverview {
  currentPlan: string | null;
  planStatus: "active" | "cancelled" | "paused" | "expired" | null;
  totalPaidThisYear: number;
  invoiceCount: number;
  currency: string;
  nextPaymentDate: string | null;
  nextPaymentAmount: number | null;
  customerId: string | null;
}

// ============================================
// HELPER: Get Portal Client's Agency
// ============================================

async function getPortalClientAgency(): Promise<{
  clientId: string;
  agencyId: string;
  lemonCustomerId: string | null;
} | null> {
  const cookieStore = await cookies();
  const clientId = cookieStore.get("impersonating_client_id")?.value;
  
  if (!clientId) {
    return null;
  }

  const supabase = await createClient();

  // Get client's agency
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, agency_id")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    return null;
  }

  // Get agency's LemonSqueezy customer ID from subscriptions table
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("lemonsqueezy_customer_id")
    .eq("agency_id", client.agency_id)
    .not("lemonsqueezy_customer_id", "is", null)
    .limit(1)
    .single();

  return {
    clientId: client.id,
    agencyId: client.agency_id,
    lemonCustomerId: subscription?.lemonsqueezy_customer_id || null,
  };
}

// ============================================
// EXPORTED API
// ============================================

/**
 * Get invoices for the portal client's agency
 */
export async function getPortalInvoices(): Promise<{
  invoices: PortalInvoice[];
}> {
  const context = await getPortalClientAgency();
  if (!context) {
    return { invoices: [] };
  }

  // Get invoices from database (stored from webhook events)
  return await getInvoicesFromDatabase(context.agencyId);
}

/**
 * Get invoices stored in our database (from webhook events)
 */
async function getInvoicesFromDatabase(agencyId: string): Promise<{
  invoices: PortalInvoice[];
}> {
  const supabase = await createClient();

  // Get subscription with order history
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select(`
      id,
      plan_id,
      status,
      lemonsqueezy_subscription_id,
      lemonsqueezy_customer_id,
      lemonsqueezy_variant_id,
      created_at,
      current_period_start,
      current_period_end
    `)
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (error || !subscriptions) {
    return { invoices: [] };
  }

  // Convert subscriptions to invoice-like records
  // In a full implementation, you'd store actual invoices in a separate table
  const invoices: PortalInvoice[] = subscriptions.map((sub) => {
    const planName = getPlanName(sub.plan_id);
    return {
      id: sub.id,
      invoiceNumber: sub.lemonsqueezy_subscription_id ? `SUB-${sub.lemonsqueezy_subscription_id}` : null,
      orderId: sub.id,
      subscriptionId: sub.lemonsqueezy_subscription_id,
      productName: planName,
      description: `${planName} Subscription`,
      amount: getPlanPrice(sub.plan_id), // Helper to get price
      currency: DEFAULT_CURRENCY,
      status: sub.status === "active" ? "paid" : "pending",
      createdAt: sub.created_at || new Date().toISOString(),
      paidAt: sub.status === "active" ? sub.created_at : null,
      invoiceUrl: sub.lemonsqueezy_subscription_id 
        ? `https://app.lemonsqueezy.com/my-orders`
        : null,
      receiptUrl: null,
    };
  });

  return { invoices };
}

/**
 * Get billing overview for the portal
 */
export async function getPortalBillingOverview(): Promise<PortalBillingOverview> {
  const context = await getPortalClientAgency();
  if (!context) {
    return {
      currentPlan: null,
      planStatus: null,
      totalPaidThisYear: 0,
      invoiceCount: 0,
      currency: DEFAULT_CURRENCY,
      nextPaymentDate: null,
      nextPaymentAmount: null,
      customerId: null,
    };
  }

  const supabase = await createClient();

  // Get active subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("agency_id", context.agencyId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get all subscriptions for this year's total
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const { data: yearSubscriptions, count } = await supabase
    .from("subscriptions")
    .select("plan_id", { count: "exact" })
    .eq("agency_id", context.agencyId)
    .gte("created_at", startOfYear);

  // Calculate total paid this year
  let totalPaidThisYear = 0;
  yearSubscriptions?.forEach((sub) => {
    totalPaidThisYear += getPlanPrice(sub.plan_id);
  });

  // Get next payment info from LemonSqueezy if we have a subscription
  let nextPaymentDate: string | null = null;
  let nextPaymentAmount: number | null = null;

  if (subscription?.lemonsqueezy_subscription_id && context.lemonCustomerId) {
    try {
      const lsSubscription = await getSubscription(subscription.lemonsqueezy_subscription_id);
      const subData = lsSubscription.data?.data;
      if (subData) {
        nextPaymentDate = subData.attributes.renews_at || null;
        // Use variant price or fallback to plan price
        nextPaymentAmount = getPlanPrice(subscription.plan_id);
      }
    } catch (error) {
      console.error("[PortalBillingService] Error fetching subscription:", error);
      // Use database fallback
      nextPaymentDate = subscription.current_period_end;
      nextPaymentAmount = getPlanPrice(subscription.plan_id);
    }
  } else if (subscription) {
    // Fallback to database values
    nextPaymentDate = subscription.current_period_end;
    nextPaymentAmount = getPlanPrice(subscription.plan_id);
  }

  return {
    currentPlan: subscription ? getPlanName(subscription.plan_id) : null,
    planStatus: subscription?.status as PortalBillingOverview["planStatus"] || null,
    totalPaidThisYear,
    invoiceCount: count || 0,
    currency: DEFAULT_CURRENCY,
    nextPaymentDate,
    nextPaymentAmount,
    customerId: context.lemonCustomerId,
  };
}

/**
 * Helper: Get plan name from plan_id
 */
function getPlanName(planId: string | null): string {
  if (!planId) return "Unknown Plan";
  
  // Map common plan IDs to display names
  const planNames: Record<string, string> = {
    "starter": "Starter",
    "professional": "Professional",
    "pro": "Professional",
    "agency": "Agency",
    "enterprise": "Enterprise",
    "free": "Free",
    "trial": "Trial",
  };

  const lowerPlanId = planId.toLowerCase();
  
  for (const [key, name] of Object.entries(planNames)) {
    if (lowerPlanId.includes(key)) {
      return name;
    }
  }
  
  // If no match, return the plan_id itself (formatted)
  return planId.charAt(0).toUpperCase() + planId.slice(1).replace(/_/g, " ");
}

/**
 * Helper: Get plan price in cents
 * This should match your actual LemonSqueezy product prices
 */
function getPlanPrice(planId: string | null): number {
  if (!planId) return 0;
  
  const lowerPlan = planId.toLowerCase();
  
  // Monthly prices in cents
  if (lowerPlan.includes("starter")) return 2900; // $29/month
  if (lowerPlan.includes("professional") || lowerPlan.includes("pro")) return 7900; // $79/month
  if (lowerPlan.includes("agency") || lowerPlan.includes("enterprise")) return 19900; // $199/month
  if (lowerPlan.includes("free") || lowerPlan.includes("trial")) return 0;
  
  return 0;
}

/**
 * Get subscription management portal URL from LemonSqueezy
 */
export async function getCustomerPortalUrl(): Promise<string | null> {
  const context = await getPortalClientAgency();
  if (!context?.lemonCustomerId) {
    return null;
  }

  // LemonSqueezy customer portal URL
  // Customers can manage their subscriptions at this URL
  return `https://app.lemonsqueezy.com/my-orders`;
}
