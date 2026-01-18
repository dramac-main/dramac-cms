"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useModuleSubscriptions(agencyId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["module-subscriptions", agencyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("agency_module_subscriptions")
        .select(`
          *,
          module:modules_v2(id, name, category, icon)
        `)
        .eq("agency_id", agencyId);

      return data || [];
    },
  });
}

export function useHasModuleAccess(agencyId: string, moduleId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["module-access", agencyId, moduleId],
    queryFn: async () => {
      const { data } = await supabase
        .from("agency_module_subscriptions")
        .select("status")
        .eq("agency_id", agencyId)
        .eq("module_id", moduleId)
        .single();

      return data?.status === "active";
    },
  });
}

export function usePurchaseModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      moduleId,
      billingCycle = "monthly",
    }: {
      agencyId: string;
      moduleId: string;
      billingCycle?: "monthly" | "yearly";
    }) => {
      const response = await fetch("/api/billing/module-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, moduleId, billingCycle }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout");
      }

      const { url } = await response.json();
      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-subscriptions"] });
    },
  });
}

export function useCancelModuleSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agencyId,
      moduleId,
    }: {
      agencyId: string;
      moduleId: string;
    }) => {
      const response = await fetch("/api/billing/cancel-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, moduleId }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-subscriptions"] });
    },
  });
}
