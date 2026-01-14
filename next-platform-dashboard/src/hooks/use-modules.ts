"use client";

import { useQuery } from "@tanstack/react-query";
import type { Module } from "@/types/modules";

interface UseModulesOptions {
  category?: string;
  featured?: boolean;
}

export function useModules(options: UseModulesOptions = {}) {
  const { category, featured } = options;

  return useQuery({
    queryKey: ["modules", { category, featured }],
    queryFn: async (): Promise<Module[]> => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (featured) params.set("featured", "true");

      const response = await fetch(`/api/modules?${params}`);
      if (!response.ok) throw new Error("Failed to fetch modules");
      return response.json();
    },
  });
}

export function useModule(moduleId: string) {
  return useQuery({
    queryKey: ["module", moduleId],
    queryFn: async (): Promise<Module> => {
      const response = await fetch(`/api/modules/${moduleId}`);
      if (!response.ok) throw new Error("Failed to fetch module");
      return response.json();
    },
    enabled: !!moduleId,
  });
}
