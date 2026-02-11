import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Grid3x3, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AppsGrid } from "@/components/portal/apps/apps-grid";
import { EmptyAppsState } from "@/components/portal/apps/empty-apps-state";
import { requirePortalAuth } from "@/lib/portal/portal-auth";

export const metadata: Metadata = {
  title: "My Apps | Client Portal",
  description: "Access your installed apps and modules",
};

export default async function PortalAppsPage() {
  const user = await requirePortalAuth();

  const supabase = await createClient();

  // Get client with their agency
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name, agency_id")
    .eq("id", user.clientId)
    .single();

  if (error || !client) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Unable to load apps. Please try again later.</p>
      </div>
    );
  }

  // Define the module type to match AppsGrid expectations
  interface InstalledModule {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    slug: string;
    category: string;
    installation_id: string;
    installed_at: string;
    settings: Record<string, unknown>;
  }

  // First try to get client-level module installations (separate queries for safety)
  // Note: custom_name/custom_icon don't exist in schema - removed from select
  const { data: rawClientInstalls } = await supabase
    .from("client_module_installations")
    .select("id, module_id, installed_at, settings")
    .eq("client_id", client.id)
    .eq("is_enabled", true)
    .order("installed_at", { ascending: false });

  // Fetch modules separately if there are installations
  let installedModules: InstalledModule[] = [];
  if (rawClientInstalls?.length) {
    const moduleIds = rawClientInstalls.map((i) => i.module_id);
    const { data: modules } = await supabase
      .from("modules_v2")
      .select("id, name, description, icon, slug, category")
      .in("id", moduleIds)
      .eq("is_active", true);

    const moduleMap = new Map((modules || []).map((m) => [m.id, m]));
    
    installedModules = rawClientInstalls
      .filter((i) => moduleMap.has(i.module_id))
      .map((i) => {
        const mod = moduleMap.get(i.module_id)!;
        return {
          id: mod.id,
          name: mod.name,
          description: mod.description,
          icon: mod.icon || "📦",
          slug: mod.slug,
          category: mod.category,
          installation_id: i.id,
          installed_at: i.installed_at || new Date().toISOString(),
          settings: (i.settings || {}) as Record<string, unknown>,
        };
      });
  }

  // If no client installations, fall back to agency subscriptions (legacy support)
  if (installedModules.length === 0 && client.agency_id) {
    // Check agency_module_subscriptions (separate queries - FK was dropped)
    const { data: rawSubscriptions } = await supabase
      .from("agency_module_subscriptions")
      .select("id, module_id")
      .eq("agency_id", client.agency_id)
      .eq("status", "active");

    if (rawSubscriptions?.length) {
      const subModuleIds = rawSubscriptions.map((s) => s.module_id);
      const { data: subModules } = await supabase
        .from("modules_v2")
        .select("id, slug, name, description, icon, category")
        .in("id", subModuleIds)
        .eq("is_active", true);

      const subModuleMap = new Map((subModules || []).map((m) => [m.id, m]));

      installedModules = rawSubscriptions
        .filter((s) => subModuleMap.has(s.module_id))
        .map((s) => {
          const mod = subModuleMap.get(s.module_id)!;
          return {
            id: mod.id,
            name: mod.name,
            description: mod.description,
            icon: mod.icon || "📦",
            slug: mod.slug,
            category: mod.category,
            installation_id: s.id,
            installed_at: new Date().toISOString(),
            settings: {},
          };
        });
    }
  }

  return (
    <div className="space-y-6">
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Grid3x3 className="h-8 w-8" />
                My Apps
              </h1>
              <p className="text-muted-foreground">
                Access your business tools and applications
              </p>
            </div>
            <Button asChild>
              <Link href="/portal/apps/browse">
                <Plus className="h-4 w-4 mr-2" />
                Browse Apps
              </Link>
            </Button>
          </div>

          {/* Search */}
          {installedModules.length > 0 && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your apps..."
                className="pl-10"
              />
            </div>
          )}

          {/* Apps Grid */}
          {installedModules.length === 0 ? (
            <EmptyAppsState />
          ) : (
            <AppsGrid modules={installedModules} />
          )}
        </div>
      </main>
    </div>
  );
}
