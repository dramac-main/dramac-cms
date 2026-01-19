"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FeaturedModules } from "@/components/modules/featured-modules";
import { ModuleCategoryFilter } from "@/components/modules/module-marketplace-category-filter";
import { ModuleGrid } from "@/components/modules/module-grid";
import type { ModuleDefinition, ModuleCategory, ModulePricingType } from "@/lib/modules/module-types";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

type SortOption = "popular" | "newest" | "price-low" | "price-high" | "rating";

interface MarketplaceClientProps {
  initialModules: ModuleDefinition[];
  featuredModules: ModuleDefinition[];
}

/**
 * Client component for the marketplace page.
 * Handles filtering, sorting, and search on the client side.
 * Receives pre-fetched modules from the server component.
 */
export function MarketplaceClient({ 
  initialModules, 
  featuredModules 
}: MarketplaceClientProps) {
  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ModuleCategory | null>(null);
  const [priceType, setPriceType] = useState<ModulePricingType | "all">("all");
  const [sort, setSort] = useState<SortOption>("popular");
  
  const debouncedSearch = useDebounce(search, 300);

  // Filter and sort modules on the client
  const filteredModules = useMemo(() => {
    let results = [...initialModules];

    // Filter by search term
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower) ||
          m.tags?.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category
    if (category) {
      results = results.filter((m) => m.category === category);
    }

    // Filter by price type
    if (priceType !== "all") {
      results = results.filter((m) => m.pricing.type === priceType);
    }

    // Sort
    results.sort((a, b) => {
      switch (sort) {
        case "popular":
          return (b.installCount || 0) - (a.installCount || 0);
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price-low":
          return (a.pricing.amount || 0) - (b.pricing.amount || 0);
        case "price-high":
          return (b.pricing.amount || 0) - (a.pricing.amount || 0);
        default:
          return 0;
      }
    });

    return results;
  }, [initialModules, debouncedSearch, category, priceType, sort]);

  const handleInstall = useCallback(async (moduleId: string) => {
    const mod = initialModules.find((m) => m.id === moduleId || m.slug === moduleId);
    if (!mod) return;

    if (mod.pricing.type === "free") {
      toast.success(`${mod.name} installed successfully!`);
    } else {
      toast.info(`Redirecting to purchase ${mod.name}...`);
      // Would redirect to LemonSqueezy checkout or install flow
    }
  }, [initialModules]);

  const handleClearFilters = useCallback(() => {
    setCategory(null);
    setPriceType("all");
    setSearch("");
  }, []);

  const showFeatured = !search && !category && priceType === "all";

  return (
    <div className="container py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Module Marketplace</h1>
        <p className="text-muted-foreground">
          Extend your sites with powerful modules
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <Label className="mb-3 block">Price</Label>
                  <RadioGroup
                    value={priceType}
                    onValueChange={(v) => setPriceType(v as ModulePricingType | "all")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="free" id="free" />
                      <Label htmlFor="free">Free</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly">Monthly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one-time" id="one-time" />
                      <Label htmlFor="one-time">One-time</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <ModuleCategoryFilter selected={category} onChange={setCategory} />
      </div>

      {/* Featured Modules */}
      {showFeatured && featuredModules.length > 0 && (
        <FeaturedModules
          modules={featuredModules}
          onInstall={handleInstall}
        />
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {category
            ? `${category.charAt(0).toUpperCase() + category.slice(1)} Modules`
            : search
            ? `Search Results`
            : "All Modules"}
        </h2>
        <span className="text-sm text-muted-foreground">
          {filteredModules.length} module{filteredModules.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Module Grid */}
      <ModuleGrid
        modules={filteredModules}
        onInstall={handleInstall}
        loading={false}
        emptyMessage={search ? "No modules match your search" : "No modules available"}
      />
    </div>
  );
}
