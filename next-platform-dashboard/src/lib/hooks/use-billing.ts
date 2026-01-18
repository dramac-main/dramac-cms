"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { BillingOverview, BillingSubscription, BillingCustomer, BillingInvoice } from "@/types/billing";

export function useBilling(agencyId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["billing", agencyId],
    queryFn: async (): Promise<BillingOverview> => {
      // Get subscription and billing info from agencies table
      const { data: agency } = await supabase
        .from("agencies")
        .select("stripe_subscription_id, stripe_customer_id, plan")
        .eq("id", agencyId)
        .single();

      // Get subscription details if available
      const { data: subscription } = agency?.stripe_subscription_id 
        ? await supabase
            .from("subscriptions")
            .select("*")
            .eq("stripe_subscription_id", agency.stripe_subscription_id)
            .single()
        : { data: null };

      // Count clients
      const { count: totalClients } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId);

      // Build billing customer from agency data
      const customer: BillingCustomer | null = agency?.stripe_customer_id ? {
        id: agencyId,
        agency_id: agencyId,
        stripe_customer_id: agency.stripe_customer_id,
        email: "", // Will be fetched from Stripe when needed
        name: null,
        created_at: new Date().toISOString(),
      } : null;

      return {
        subscription: subscription as BillingSubscription | null,
        customer,
        invoices: [], // Invoices are fetched from Stripe directly when needed
        currentSeats: (subscription as BillingSubscription | null)?.quantity || 0,
        totalClients: totalClients || 0,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

function calculateDaysRemaining(trialEndDate: string | null): number {
  if (!trialEndDate) return 0;
  const trialEnd = new Date(trialEndDate).getTime();
  const now = new Date().getTime();
  return Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
}

export function useSubscriptionStatus(agencyId: string) {
  const { data } = useBilling(agencyId);

  const status = useMemo(() => {
    const isActive = data?.subscription?.status === "active";
    const isTrialing = data?.subscription?.status === "trialing";
    const isPastDue = data?.subscription?.status === "past_due";
    const trialDaysRemaining = calculateDaysRemaining(data?.subscription?.trial_end ?? null);

    return {
      isActive,
      isTrialing,
      isPastDue,
      trialDaysRemaining,
      needsPaymentMethod: isTrialing && trialDaysRemaining <= 3,
      canAddClients: isActive || isTrialing,
    };
  }, [data?.subscription]);

  return status;
}
