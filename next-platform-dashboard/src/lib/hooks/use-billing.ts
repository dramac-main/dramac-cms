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
        subscription: subscription as BillingSubscription | null,
        customer: customer as BillingCustomer | null,
        invoices: (invoices || []) as BillingInvoice[],
        currentSeats: subscription?.quantity || 0,
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
