// src/hooks/use-revenue-data.ts
// Phase EM-43: Revenue Sharing Dashboard - Revenue Data Hook

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  EarningsSummary,
  RevenueAnalytics,
  SaleRecord,
  PayoutAccount,
  Payout,
} from "@/lib/revenue";

interface UseRevenueDataOptions {
  dateRange?: string;
  moduleId?: string | null;
}

interface RevenueDataResponse {
  summary: EarningsSummary | null;
  analytics: RevenueAnalytics | null;
  sales: { sales: SaleRecord[]; total: number } | null;
  payouts: { payouts: Payout[]; total: number } | null;
  payoutAccount: PayoutAccount | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Helper to calculate date ranges
function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString().split("T")[0];

  let startDate: Date;
  switch (range) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "365d":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate,
  };
}

async function fetchRevenueData(
  dateRange: string,
  moduleId?: string | null
): Promise<{
  summary: EarningsSummary | null;
  analytics: RevenueAnalytics | null;
  sales: { sales: SaleRecord[]; total: number } | null;
  payouts: { payouts: Payout[]; total: number } | null;
  payoutAccount: PayoutAccount | null;
}> {
  const { startDate, endDate } = getDateRange(dateRange);

  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  if (moduleId) {
    params.set("moduleId", moduleId);
  }

  const response = await fetch(`/api/developer/revenue?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch revenue data");
  }

  return response.json();
}

export function useRevenueData(
  options: UseRevenueDataOptions = {}
): RevenueDataResponse {
  const { dateRange = "30d", moduleId = null } = options;
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["revenue-data", dateRange, moduleId],
    queryFn: () => fetchRevenueData(dateRange, moduleId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    summary: data?.summary || null,
    analytics: data?.analytics || null,
    sales: data?.sales || null,
    payouts: data?.payouts || null,
    payoutAccount: data?.payoutAccount || null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Hook for requesting a payout
export function useRequestPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      periodStart,
      periodEnd,
    }: {
      periodStart: string;
      periodEnd: string;
    }) => {
      const response = await fetch("/api/developer/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodStart, periodEnd }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to request payout");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-data"] });
    },
  });
}

// Hook for updating payout preferences
export function useUpdatePayoutPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: {
      payout_frequency?: string;
      payout_threshold?: number;
      payout_currency?: string;
    }) => {
      const response = await fetch("/api/developer/payout-account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update preferences");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-data"] });
    },
  });
}

// Hook for setting up payout account
export function usePayoutSetup() {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/developer/payout-account", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to set up payout account"
        );
      }

      return response.json() as Promise<{ url: string }>;
    },
  });
}

// Hook for exporting revenue data
export function useExportRevenue() {
  return useMutation({
    mutationFn: async ({
      format,
      dateRange,
    }: {
      format: "csv" | "pdf";
      dateRange: string;
    }) => {
      const { startDate, endDate } = getDateRange(dateRange);

      const params = new URLSearchParams({
        format,
        startDate,
        endDate,
      });

      const response = await fetch(
        `/api/developer/revenue/export?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to export data");
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `revenue-export-${startDate}-to-${endDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
  });
}
