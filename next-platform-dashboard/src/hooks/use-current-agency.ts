"use client";

import { useAuth } from "@/components/providers/auth-provider";

export function useCurrentAgency() {
  const { profile, loading } = useAuth();

  return {
    agency: profile?.organization || null,
    agencyId: profile?.agency_id || null,
    isLoading: loading,
  };
}
