import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { EnhancedModuleCard } from "@/components/modules/marketplace/enhanced-module-card";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Format slug to title
  const title = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${title} | Marketplace Collections`,
    description: `Browse ${title.toLowerCase()} modules`,
  };
}

/**
 * Collection detail page - shows all modules in a collection
 * Phase EM-02: Marketplace Enhancement
 */
export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user?.id || "")
    .single();

  // Get collection details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: collection, error } = await (supabase as any)
    .from("module_collections")
    .select(`
      id, slug, name, description, icon, banner_image,
      items:module_collection_items(
        display_order,
        module:modules_v2(
          id, slug, name, description, icon, category, module_type,
          pricing_type, wholesale_price_monthly, wholesale_price_yearly,
          rating_average, rating_count, install_count, is_featured,
          author_name, author_verified, screenshots, published_at
        )
      )
    `)
    .eq("slug", slug)
    .eq("is_visible", true)
    .single();

  if (error || !collection) {
    notFound();
  }

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

  // Define collection item type
  interface CollectionItem {
    display_order: number;
    module: Record<string, unknown> | null;
  }

  // Extract and sort modules
  const modules = (collection.items || [])
    .filter((item: CollectionItem) => item.module !== null)
    .sort((a: CollectionItem, b: CollectionItem) => a.display_order - b.display_order)
    .map((item: CollectionItem) => item.module);

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/marketplace/search">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Marketplace
        </Link>
      </Button>

      {/* Collection Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{collection.icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{collection.name}</h1>
            {collection.description && (
              <p className="text-muted-foreground mt-1">
                {collection.description}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {modules.length} module{modules.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Modules Grid */}
      {modules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((module: Record<string, unknown>) => (
            <EnhancedModuleCard
              key={module.id as string}
              module={module as unknown as Parameters<typeof EnhancedModuleCard>[0]['module']}
              isSubscribed={subscribedModuleIds.has(module.id as string)}
              linkPrefix="/marketplace"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <p>No modules in this collection yet</p>
        </div>
      )}
    </div>
  );
}
