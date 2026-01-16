"use client";

import { MarketplaceModuleCard } from "./marketplace-module-card";
import type { ModuleDefinition } from "@/lib/modules/module-types";
import { Package } from "lucide-react";

interface ModuleGridProps {
  modules: ModuleDefinition[];
  installedIds?: string[];
  onInstall?: (moduleId: string) => Promise<void>;
  loading?: boolean;
  emptyMessage?: string;
}

export function ModuleGrid({
  modules,
  installedIds = [],
  onInstall,
  loading = false,
  emptyMessage = "No modules found",
}: ModuleGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {modules.map((module) => (
        <MarketplaceModuleCard
          key={module.id}
          module={module}
          isInstalled={installedIds.includes(module.id)}
          onInstall={onInstall}
        />
      ))}
    </div>
  );
}
