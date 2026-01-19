import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketplaceGrid } from "@/components/modules/marketplace/marketplace-grid";
import { MarketplaceSidebar } from "@/components/modules/marketplace/marketplace-sidebar";
import { MarketplaceHeader } from "@/components/modules/marketplace/marketplace-header";

export const metadata: Metadata = {
  title: "Module Marketplace | DRAMAC",
  description: "Browse and subscribe to modules for your agency",
};

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

/**
 * Unified Module Marketplace
 * Queries modules_v2 table which includes both catalog and studio modules.
 */
export default async function MarketplacePage({ searchParams }: PageProps) {
  const { q, category } = await searchParams;
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user?.id || "")
    .single();

  // Build query for modules_v2 table (includes both catalog and studio modules)
  let query = supabase
    .from("modules_v2" as any)
    .select("*")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("install_count", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data: modules } = await query;

  // Check if user's agency is enrolled in beta program
  const { data: betaEnrollment } = profile?.agency_id 
    ? await supabase
        .from("beta_enrollment" as any)
        .select("*")
        .eq("agency_id", profile.agency_id)
        .eq("is_active", true)
        .single()
    : { data: null };

  const isBetaAgency = !!betaEnrollment;
  const betaTier = betaEnrollment?.beta_tier || "standard";

  // Get testing modules to filter appropriately
  const { data: testingModules } = await supabase
    .from("module_source" as any)
    .select("slug, status")
    .eq("status", "testing");

  const testingModuleMap = new Map(
    testingModules?.map((m: any) => [m.slug, m.status]) || []
  );

  // Filter modules based on beta enrollment
  let filteredModules = modules || [];

  if (!isBetaAgency) {
    // Regular users: Filter out ALL testing modules
    filteredModules = filteredModules.filter((m: any) => !testingModuleMap.has(m.slug));
  } else if (betaTier === "standard") {
    // Standard beta tier: Only show opted-in testing modules
    const acceptedModules = betaEnrollment.accepted_modules || [];
    filteredModules = filteredModules.filter((m: any) => {
      if (!testingModuleMap.has(m.slug)) return true; // Published module
      return acceptedModules.includes(m.slug); // Testing module - check opt-in
    });
  }
  // Internal/Alpha/Early Access: Show all (no additional filtering)

  // Get agency's existing subscriptions
  const { data: subscriptions } = profile?.agency_id 
    ? await supabase
        .from("agency_module_subscriptions" as any)
        .select("module_id, status")
        .eq("agency_id", profile.agency_id)
        .eq("status", "active")
    : { data: null };

  const subscribedModuleIds = new Set(subscriptions?.map((s: any) => s.module_id) || []);

  // Get categories for sidebar
  const { data: categories } = await supabase
    .from("modules_v2" as any)
    .select("category")
    .eq("status", "active");

  const uniqueCategories = [...new Set(categories?.map((c: any) => c.category) || [])];

  // Get featured modules (from filtered list)
  const featuredModules = (filteredModules as any[])?.filter((m: any) => m.is_featured).slice(0, 3) || [];

  // Convert modules to expected format (includes source AND status for badges)
  const formattedModules = (filteredModules as any[] || []).map((m: any) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    description: m.description,
    icon: m.icon || "📦",
    category: m.category,
    install_level: m.install_level,
    wholesale_price_monthly: m.wholesale_price_monthly,
    install_count: m.install_count || 0,
    rating_average: m.rating_average,
    is_featured: m.is_featured,
    source: m.source || "catalog", // 'catalog' or 'studio'
    status: testingModuleMap.has(m.slug) ? "testing" : "published", // Add status for beta badge
  }));

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}/mo`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <MarketplaceHeader searchQuery={q} />

      <div className="flex gap-6">
        {/* Sidebar */}
        <MarketplaceSidebar 
          categories={uniqueCategories as string[]} 
          selectedCategory={category}
        />

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {/* Featured Modules (only on home, no search/filter) */}
          {!q && !category && featuredModules.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured Modules
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredModules.map((module: any) => (
                  <Card 
                    key={module.id} 
                    className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{module.icon || "📦"}</span>
                        <div>
                          <CardTitle className="text-lg">{module.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-primary">
                              {formatPrice(module.wholesale_price_monthly)}
                            </span>
                            {subscribedModuleIds.has(module.id) && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Subscribed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {module.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* All Modules */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {category ? `${category} Modules` : q ? `Search Results` : "All Modules"}
              </h2>
              <span className="text-muted-foreground">
                {formattedModules.length} modules
              </span>
            </div>
            <MarketplaceGrid 
              modules={formattedModules} 
              subscribedModuleIds={subscribedModuleIds}
            />
          </section>
        </div>
      </div>
    </div>
  );
}