"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Client } from "@/types";

export function useCreateClient() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (data: Omit<Client, "id" | "created_at" | "updated_at">) => {
      const { data: client, error } = await supabase
        .from("clients")
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      // Trigger seat sync
      await fetch("/api/billing/sync-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: data.agency_id }),
      });

      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ clientId, agencyId }: { clientId: string; agencyId: string }) => {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

      // Trigger seat sync
      await fetch("/api/billing/sync-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId }),
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });
}
