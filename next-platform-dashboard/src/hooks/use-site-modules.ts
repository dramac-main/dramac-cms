"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Module, SiteModule } from "@/types/modules";

interface SiteModuleWithDetails {
  module: Module;
  siteModule: SiteModule | null;
  isEnabled: boolean;
}

export function useSiteModules(siteId: string) {
  return useQuery({
    queryKey: ["site-modules", siteId],
    queryFn: async (): Promise<SiteModuleWithDetails[]> => {
      const response = await fetch(`/api/sites/${siteId}/modules`);
      if (!response.ok) throw new Error("Failed to fetch site modules");
      return response.json();
    },
    enabled: !!siteId,
  });
}

export function useEnableSiteModule(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      moduleId,
      settings = {},
    }: {
      moduleId: string;
      settings?: Record<string, unknown>;
    }) => {
      const response = await fetch(`/api/sites/${siteId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, settings }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to enable module");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-modules", siteId] });
    },
  });
}

export function useUpdateSiteModule(siteId: string, moduleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      isEnabled?: boolean;
      settings?: Record<string, unknown>;
    }) => {
      const response = await fetch(`/api/sites/${siteId}/modules/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update module");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-modules", siteId] });
    },
  });
}

export function useDisableSiteModule(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moduleId: string) => {
      const response = await fetch(`/api/sites/${siteId}/modules/${moduleId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to disable module");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-modules", siteId] });
    },
  });
}
