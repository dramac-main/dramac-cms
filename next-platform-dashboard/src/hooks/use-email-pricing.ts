"use client";

import { useQuery } from "@tanstack/react-query";
import { getBusinessEmailPricing } from "@/lib/actions/business-email";

/**
 * React Query hook for email pricing data.
 * Caches for 5 minutes so repeated wizard visits don't re-fetch from the RC API.
 * The first fetch may take 1-5s (live RC call), but subsequent navigations are instant.
 */
export function useEmailPricing() {
  return useQuery({
    queryKey: ["email-pricing"],
    queryFn: async () => {
      const result = await getBusinessEmailPricing();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to load pricing");
      }
      return { data: result.data, costData: result.costData };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — pricing doesn't change often
    gcTime: 10 * 60 * 1000, // keep in cache for 10 minutes after last use
    retry: 1,
  });
}
