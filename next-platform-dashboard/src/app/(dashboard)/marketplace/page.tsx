"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ModuleCard } from "@/components/modules/module-card";
import { ModuleDetailSheet } from "@/components/modules/module-detail-sheet";
import { CategoryFilter } from "@/components/modules/category-filter";
import { useModules } from "@/hooks/use-modules";
import { useModuleSubscriptions, useSubscribeModule } from "@/hooks/use-module-subscriptions";
import { useCurrentAgency } from "@/hooks/use-current-agency";
import type { Module, ModuleCategory } from "@/types/modules";
import { Search, Loader2, Package } from "lucide-react";
import { toast } from "sonner";

export default function MarketplacePage() {
  const { agency } = useCurrentAgency();
  const agencyId = agency?.id || "";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ModuleCategory | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const { data: modules, isLoading } = useModules({ category: category || undefined });
  const { data: subscriptions } = useModuleSubscriptions(agencyId);
  const subscribeMutation = useSubscribeModule(agencyId);

  const subscribedIds = new Set(subscriptions?.map((s) => s.module_id) || []);

  // Filter by search
  const filteredModules = modules?.filter((m) => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(lower) ||
      m.description?.toLowerCase().includes(lower) ||
      m.category.toLowerCase().includes(lower)
    );
  });

  const handleSubscribe = async (moduleId: string, billingCycle: "monthly" | "yearly" = "monthly") => {
    try {
      await subscribeMutation.mutateAsync({ moduleId, billingCycle });
      toast.success("Successfully subscribed to module!");
      setSelectedModule(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to subscribe");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Module Marketplace</h1>
        <p className="text-muted-foreground">
          Extend your platform with powerful add-ons
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search modules..."
          className="pl-9"
        />
      </div>

      {/* Categories */}
      <CategoryFilter selected={category} onSelect={setCategory} />

      {/* Modules Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredModules?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">No modules found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules?.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              isSubscribed={subscribedIds.has(module.id)}
              onSubscribe={() => handleSubscribe(module.id)}
              onViewDetails={() => setSelectedModule(module)}
              isLoading={subscribeMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <ModuleDetailSheet
        module={selectedModule}
        open={!!selectedModule}
        onOpenChange={(open) => !open && setSelectedModule(null)}
        isSubscribed={selectedModule ? subscribedIds.has(selectedModule.id) : false}
        onSubscribe={(billingCycle) =>
          selectedModule && handleSubscribe(selectedModule.id, billingCycle)
        }
        isLoading={subscribeMutation.isPending}
      />
    </div>
  );
}
