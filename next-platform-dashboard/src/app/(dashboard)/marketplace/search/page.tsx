import { Suspense } from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketplaceSearch } from "@/components/modules/marketplace/marketplace-search";
import { FeaturedCollections } from "@/components/modules/marketplace/featured-collections";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type MarketplaceFilters } from "@/lib/modules/marketplace-search";

export const metadata: Metadata = {
  title: "Enhanced Marketplace | DRAMAC",
  description: "Search and browse premium modules for your agency",
};

interface PageProps {
  searchParams: Promise<{ 
    q?: string; 
    category?: string;
    price?: string;
    sort?: string;
    page?: string;
  }>;
}

/**
 * Enhanced Module Marketplace with advanced search
 * Phase EM-02: Marketplace Enhancement
 */
export default async function EnhancedMarketplacePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hasSearchParams = params.q || params.category || params.price;
  
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user?.id || "")
    .single();

  // Get subscribed module IDs
  let subscribedModuleIds = new Set<string>();
  
  if (profile?.agency_id) {
    const { data: subscriptions } = await supabase
      .from("agency_module_subscriptions")
      .select("module_id")
      .eq("agency_id", profile.agency_id)
      .eq("status", "active");
    
    if (subscriptions) {
      subscribedModuleIds = new Set(subscriptions.map(s => s.module_id));
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Module Marketplace</h1>
        <p className="text-muted-foreground mt-1">
          Discover and install powerful modules to extend your platform
        </p>
      </div>

      <Tabs defaultValue={hasSearchParams ? "search" : "browse"}>
        <TabsList>
          <TabsTrigger value="browse">Browse Collections</TabsTrigger>
          <TabsTrigger value="search">Search All Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <Suspense fallback={<CollectionsSkeleton />}>
            <FeaturedCollections 
              subscribedModuleIds={subscribedModuleIds}
              maxCollections={6}
              maxModulesPerCollection={4}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <Suspense fallback={<SearchSkeleton />}>
            <MarketplaceSearch 
              subscribedModuleIds={subscribedModuleIds}
              initialFilters={{
                query: params.q,
                categories: params.category?.split(',').filter(Boolean) as MarketplaceFilters['categories'],
                priceRange: params.price as MarketplaceFilters['priceRange'],
                sortBy: params.sort as MarketplaceFilters['sortBy'],
                page: parseInt(params.page || '1') || 1
              }}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CollectionsSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
