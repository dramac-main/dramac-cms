"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useModuleSubscriptions(agencyId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["module-subscriptions", agencyId],
    queryFn: async () => {
      // Fetch subscriptions first (FK was dropped)
      const { data: subscriptions } = await supabase
        .from("agency_module_subscriptions")
        .select("*")
        .eq("agency_id", agencyId);

      if (!subscriptions?.length) {
        return [];
      }

      // Fetch modules separately
      const moduleIds = subscriptions.map((s) => s.module_id);
      const { data: modules } = await supabase
        .from("modules_v2")
        .select("id, name, category, icon")
        .in("id", moduleIds);

      const moduleMap = new Map((modules || []).map((m) => [m.id, m]));

      return subscriptions.map((s) => ({
        ...s,
        module: moduleMap.get(s.module_id) || null,
      }));
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
