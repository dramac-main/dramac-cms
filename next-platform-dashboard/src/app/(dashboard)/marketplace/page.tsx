import { Suspense } from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketplaceSearch } from "@/components/modules/marketplace/marketplace-search";
import { FeaturedCollections } from "@/components/modules/marketplace/featured-collections";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Zap, BookOpen } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Module Marketplace | DRAMAC",
  description: "Discover and install powerful modules to extend your platform",
};

/**
 * Unified Module Marketplace (Phase EM-02)
 * 
 * IMPORTANT: This page does NOT read searchParams to avoid infinite re-renders.
 * The MarketplaceSearch component reads searchParams client-side using useSearchParams().
 */
export default async function MarketplacePage() {
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user?.id || "")
    .single();

  // Get subscribed module IDs for showing "Subscribed" badges
  const subscribedIds: string[] = [];
  
  if (profile?.agency_id) {
    const { data: subscriptions } = await supabase
      .from("agency_module_subscriptions")
      .select("module_id")
      .eq("agency_id", profile.agency_id)
      .eq("status", "active");
    
    if (subscriptions) {
      subscribedIds.push(...subscriptions.map(s => s.module_id));
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Module Marketplace"
        description="Discover and install powerful modules to extend your platform"
        actions={
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/modules/requests/new">
                <Zap className="h-4 w-4 mr-2" />
                Request a Module
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/modules/subscriptions">
                <BookOpen className="h-4 w-4 mr-2" />
                My Subscriptions
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Collections</TabsTrigger>
          <TabsTrigger value="search">Search All Modules</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <Suspense fallback={<CollectionsSkeleton />}>
            <FeaturedCollections 
              subscribedModuleIds={subscribedIds}
              maxCollections={6}
              maxModulesPerCollection={4}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <Suspense fallback={<SearchSkeleton />}>
            <MarketplaceSearch 
              subscribedModuleIds={subscribedIds}
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
