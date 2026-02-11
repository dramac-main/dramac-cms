import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requirePortalAuth } from "@/lib/portal/portal-auth";
import { AvailableAppsGrid } from "@/components/portal/apps/available-apps-grid";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Browse Apps | Client Portal",
  description: "Discover available apps for your business",
};

interface Subscription {
  markup_type: string | null;
  markup_percentage: number | null;
  markup_fixed_amount: number | null;
  custom_price_monthly: number | null;
  module: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    category: string;
    install_level: string | null;
    wholesale_price_monthly: number | null;
    is_featured: boolean | null;
  } | null;
}

function calculateRetailPrice(subscription: Subscription): number {
  const wholesale = subscription.module?.wholesale_price_monthly || 0;
  
  switch (subscription.markup_type) {
    case "percentage":
      return wholesale + (wholesale * (subscription.markup_percentage || 100) / 100);
    case "fixed":
      return wholesale + (subscription.markup_fixed_amount || 0);
    case "custom":
      return subscription.custom_price_monthly || wholesale;
    case "passthrough":
      return wholesale;
    default:
      return wholesale * 2; // Default 100% markup
  }
}

export default async function BrowseAppsPage() {
  const portalUser = await requirePortalAuth();

  const supabase = await createClient();

  // Get client with their agency
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name, agency_id")
    .eq("id", portalUser.clientId)
    .single();

  if (error || !client) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Unable to load apps. Please try again later.</p>
      </div>
    );
  }

  if (!client.agency_id) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>No agency associated. Please contact support.</p>
      </div>
    );
  }

  // Get already installed modules (from client_module_installations) using type assertion
  const { data: clientInstallations } = await supabase
    .from("client_module_installations")
    .select("module_id")
    .eq("client_id", client.id) as unknown as { data: { module_id: string }[] | null };

  const installedModuleIds = new Set((clientInstallations || []).map(i => i.module_id));

  // Get available modules from agency subscriptions (separate queries - FK was dropped)
  const { data: rawSubscriptions } = await supabase
    .from("agency_module_subscriptions")
    .select("id, module_id, markup_type, markup_percentage, markup_fixed_amount, custom_price_monthly")
    .eq("agency_id", client.agency_id)
    .eq("status", "active");

  // Fetch modules separately
  let availableSubscriptions: Subscription[] = [];
  if (rawSubscriptions?.length) {
    const moduleIds = rawSubscriptions.map((s) => s.module_id);
    const { data: modules } = await supabase
      .from("modules_v2")
      .select("id, slug, name, description, icon, category, install_level, wholesale_price_monthly, is_featured")
      .in("id", moduleIds)
      .eq("is_active", true);

    const moduleMap = new Map((modules || []).map((m) => [m.id, m]));

    availableSubscriptions = rawSubscriptions
      .filter((s) => moduleMap.has(s.module_id))
      .map((s) => ({
        markup_type: s.markup_type,
        markup_percentage: s.markup_percentage,
        markup_fixed_amount: s.markup_fixed_amount,
        custom_price_monthly: s.custom_price_monthly,
        module: moduleMap.get(s.module_id) || null,
      }));
  }

  // Legacy module_subscriptions no longer exists, skip it
  const legacySubscriptions: Subscription[] = [];

  // Combine and filter modules
  const allSubscriptions = [
    ...(availableSubscriptions || []),
    ...((legacySubscriptions || []) as unknown as Subscription[])
  ];
  
  // Filter to client-level modules that aren't already installed
  const availableModules = allSubscriptions
    .filter(sub => {
      const moduleData = sub.module;
      if (!moduleData || !moduleData.id) return false;
      // Include if client-level or not specified (defaults to available)
      const installLevel = moduleData.install_level;
      return (installLevel === "client" || !installLevel) && !installedModuleIds.has(moduleData.id);
    })
    .map(sub => {
      const moduleData = sub.module!;
      return {
        id: moduleData.id,
        name: moduleData.name,
        description: moduleData.description,
        icon: moduleData.icon || "Package",
        category: moduleData.category || "Other",
        agencyPrice: calculateRetailPrice(sub),
        is_featured: moduleData.is_featured || false,
      };
    });

  // Remove duplicates by module id
  const uniqueModules = Array.from(
    new Map(availableModules.map(m => [m.id, m])).values()
  );

  return (
    <div className="space-y-6">
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Link 
              href="/portal/apps" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Apps
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="h-8 w-8" />
              Browse Available Apps
            </h1>
            <p className="text-muted-foreground">
              Discover powerful apps to enhance your business operations
            </p>
          </div>

          {/* Available Apps */}
          {uniqueModules.length > 0 ? (
            <AvailableAppsGrid 
              modules={uniqueModules}
              clientId={client.id}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No Additional Apps Available</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  You have access to all available apps! Check back later for new additions 
                  or contact your agency about specific needs.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
