"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ModuleSubscription } from "@/types/modules";

export function useModuleSubscriptions(agencyId: string) {
  return useQuery({
    queryKey: ["module-subscriptions", agencyId],
    queryFn: async (): Promise<ModuleSubscription[]> => {
      const response = await fetch(`/api/agencies/${agencyId}/modules`);
      if (!response.ok) throw new Error("Failed to fetch subscriptions");
      return response.json();
    },
    enabled: !!agencyId,
  });
}

export function useSubscribeModule(agencyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      moduleId,
      billingCycle = "monthly",
    }: {
      moduleId: string;
      billingCycle?: "monthly" | "yearly";
    }) => {
      const response = await fetch(`/api/agencies/${agencyId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, billingCycle }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to subscribe");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-subscriptions", agencyId] });
    },
  });
}
