"use client";

import { MarketplaceModuleCard } from "./marketplace-module-card";
import type { ModuleDefinition } from "@/lib/modules/module-types";

interface FeaturedModulesProps {
  modules: ModuleDefinition[];
  installedIds?: string[];
  onInstall?: (moduleId: string) => Promise<void>;
}

export function FeaturedModules({
  modules,
  installedIds = [],
  onInstall,
}: FeaturedModulesProps) {
  if (modules.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Featured Modules</h2>
          <p className="text-sm text-muted-foreground">
            Top-rated modules to supercharge your sites
          </p>
        </div>
      </div>

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
    </section>
  );
}
